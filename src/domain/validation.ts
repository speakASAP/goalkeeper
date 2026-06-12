import type { EventWriter } from "./events.js";
import { DomainInvariantError } from "./lifecycle.js";
import type { Decision, Execution, Goal, JsonValue, Task, TaskValidationResult } from "./types.js";

export interface SemanticValidationResult {
  status: "passed" | "failed" | "skipped";
  summary: string;
  evidence: string[];
}

export interface SemanticValidationAdapter {
  validate(input: SemanticValidationInput): Promise<SemanticValidationResult> | SemanticValidationResult;
}

export interface SemanticValidationInput {
  task: Task;
  originalIntent: string;
  approvedInterpretation: string;
  validationEvidence: string[];
}

export interface TaskValidationInput {
  task: Task;
  executions: Execution[];
  originalIntent: string;
  approvedInterpretation: string;
  changedArtifactRefs?: string[];
  validationEvidence: string[];
  risks?: string[];
  semanticValidation?: SemanticValidationResult;
  now?: Date;
}

export interface TaskValidationReport {
  taskId: string;
  goalId: string;
  projectId: string;
  status: "passed" | "failed";
  summary: string;
  executorId?: string;
  executionIds: string[];
  changedArtifactRefs: string[];
  validationEvidence: string[];
  risks: string[];
  passedCriteria: string[];
  failedCriteria: string[];
  notDone: string[];
  originalIntent: string;
  approvedInterpretation: string;
  semanticValidation: SemanticValidationResult;
  validatedAt: Date;
}

export interface RetryPreparationInput {
  task: Task;
  reason: string;
  feedback: string;
  now?: Date;
  eventWriter?: EventWriter;
  actor?: string;
  source?: string;
}

export interface RetryPreparation {
  task: Task;
  retryContext: {
    reason: string;
    feedback: string;
    previousAttempt: number;
    remainingAttempts: number;
    rejectedAt: string;
  };
}

export interface GoalCompletionInput {
  goal: Goal;
  tasks: Task[];
  originalIntent: string;
  finalInterpretation: string;
  decisions?: Decision[];
  taskReports?: TaskValidationReport[];
  now?: Date;
}

export type GoalCompletionAssessment =
  | {
      status: "ready";
      report: GoalCompletionReport;
    }
  | {
      status: "blocked";
      reason: string;
      blockingTaskIds: string[];
    };

export interface GoalCompletionReport {
  goalId: string;
  projectId: string;
  title: string;
  originalIntent: string;
  finalInterpretation: string;
  decisions: string[];
  completedTaskIds: string[];
  validationEvidence: string[];
  changedArtifactRefs: string[];
  risks: string[];
  notDone: string[];
  completedAt: Date;
}

export function createDeterministicSemanticValidation(input: SemanticValidationInput): SemanticValidationResult {
  const evidence = compactStrings(input.validationEvidence);
  const missing: string[] = [];
  if (!input.originalIntent.trim()) {
    missing.push("original intent");
  }

  if (!input.approvedInterpretation.trim()) {
    missing.push("approved interpretation");
  }

  if (evidence.length === 0) {
    missing.push("validation evidence");
  }

  if (missing.length > 0) {
    return {
      status: "failed",
      summary: `Intent alignment evidence is incomplete: ${missing.join(", ")}`,
      evidence
    };
  }

  return {
    status: "passed",
    summary: "Validation evidence is linked to preserved intent and approved interpretation.",
    evidence
  };
}

export function validateTaskExecution(input: TaskValidationInput): TaskValidationReport {
  const now = input.now ?? new Date();
  const validationEvidence = compactStrings(input.validationEvidence);
  const changedArtifactRefs = compactStrings(input.changedArtifactRefs ?? input.task.ipsArtifactIds);
  const risks = compactStrings(input.risks ?? []);
  const semanticValidation =
    input.semanticValidation ??
    createDeterministicSemanticValidation({
      task: input.task,
      originalIntent: input.originalIntent,
      approvedInterpretation: input.approvedInterpretation,
      validationEvidence
    });
  const successfulExecutions = input.executions.filter((execution) => execution.status === "succeeded");
  const failedCriteria: string[] = [];

  if (input.task.acceptanceCriteria.length === 0) {
    failedCriteria.push("Task has no acceptance criteria");
  }

  if (successfulExecutions.length === 0) {
    failedCriteria.push("No successful executor evidence is linked");
  }

  if (validationEvidence.length === 0) {
    failedCriteria.push("Validation evidence is missing");
  }

  if (!input.originalIntent.trim()) {
    failedCriteria.push("Original intent is missing");
  }

  if (!input.approvedInterpretation.trim()) {
    failedCriteria.push("Approved interpretation is missing");
  }

  if (semanticValidation.status === "failed") {
    failedCriteria.push(semanticValidation.summary);
  }

  if (isOutputMarkedInvalid(input.task.output)) {
    failedCriteria.push("Task output is marked invalid");
  }

  const status = failedCriteria.length === 0 ? "passed" : "failed";
  const passedCriteria = status === "passed" ? [...input.task.acceptanceCriteria] : [];
  const notDone = status === "passed" ? [] : ["Task cannot be marked done until validation passes"];
  const executorId = input.task.selectedExecutorId ?? successfulExecutions[0]?.executorId;

  return {
    taskId: input.task.id,
    goalId: input.task.goalId,
    projectId: input.task.projectId,
    status,
    summary:
      status === "passed"
        ? "Task validation passed against acceptance criteria and preserved intent."
        : `Task validation failed: ${failedCriteria.join("; ")}`,
    executorId,
    executionIds: input.executions.map((execution) => execution.id),
    changedArtifactRefs,
    validationEvidence,
    risks,
    passedCriteria,
    failedCriteria,
    notDone,
    originalIntent: input.originalIntent,
    approvedInterpretation: input.approvedInterpretation,
    semanticValidation,
    validatedAt: now
  };
}

export function toTaskValidationResult(report: TaskValidationReport): TaskValidationResult {
  return {
    status: report.status,
    summary: report.summary,
    evidence: report.validationEvidence,
    validatedAt: report.validatedAt
  };
}

export function prepareRetryAfterHumanRejection(input: RetryPreparationInput): RetryPreparation {
  const reason = requireText(input.reason, "Human rejection requires a reason");
  const feedback = requireText(input.feedback, "Human rejection requires retry feedback");
  if (input.task.attempt >= input.task.maxAttempts) {
    throw new DomainInvariantError("Task retry budget is exhausted");
  }

  const rejectedAt = input.now ?? new Date();
  const retryContext = {
    reason,
    feedback,
    previousAttempt: input.task.attempt,
    remainingAttempts: input.task.maxAttempts - input.task.attempt,
    rejectedAt: rejectedAt.toISOString()
  };
  const task: Task = {
    ...input.task,
    status: "failed",
    blockedReason: reason,
    validationResult: {
      status: "failed",
      summary: `Human rejected task result: ${reason}`,
      evidence: [feedback],
      validatedAt: rejectedAt
    },
    output: {
      ...(input.task.output ?? {}),
      retryContext
    }
  };

  input.eventWriter?.append({
    type: "task.validation_rejected",
    projectId: task.projectId,
    goalId: task.goalId,
    taskId: task.id,
    actor: input.actor ?? "owner",
    source: input.source ?? "telegram",
    payload: {
      reason,
      feedback,
      previousAttempt: retryContext.previousAttempt,
      remainingAttempts: retryContext.remainingAttempts
    }
  });

  return {
    task,
    retryContext
  };
}

export function assessGoalCompletion(input: GoalCompletionInput): GoalCompletionAssessment {
  const goalTasks = input.tasks.filter((task) => task.goalId === input.goal.id);
  if (goalTasks.length === 0) {
    return {
      status: "blocked",
      reason: "Goal has no required tasks",
      blockingTaskIds: []
    };
  }

  const blockingTaskIds = goalTasks
    .filter((task) => task.status !== "done" || task.validationResult?.status !== "passed")
    .map((task) => task.id);
  if (blockingTaskIds.length > 0) {
    return {
      status: "blocked",
      reason: "Goal has required tasks that are incomplete, failed, blocked, cancelled, or unvalidated",
      blockingTaskIds
    };
  }

  return {
    status: "ready",
    report: composeGoalCompletionReport(input)
  };
}

function composeGoalCompletionReport(input: GoalCompletionInput): GoalCompletionReport {
  const goalTasks = input.tasks.filter((task) => task.goalId === input.goal.id);
  const reports = input.taskReports ?? [];
  const validationEvidence = compactStrings([
    ...goalTasks.flatMap((task) => task.validationResult?.evidence ?? []),
    ...reports.flatMap((report) => report.validationEvidence)
  ]);
  const changedArtifactRefs = compactStrings([
    ...goalTasks.flatMap((task) => task.ipsArtifactIds),
    ...reports.flatMap((report) => report.changedArtifactRefs)
  ]);
  const risks = compactStrings(reports.flatMap((report) => report.risks));

  return {
    goalId: input.goal.id,
    projectId: input.goal.projectId,
    title: input.goal.title,
    originalIntent: input.originalIntent,
    finalInterpretation: input.finalInterpretation,
    decisions: compactStrings((input.decisions ?? []).map(formatDecision)),
    completedTaskIds: goalTasks.map((task) => task.id),
    validationEvidence,
    changedArtifactRefs,
    risks,
    notDone: compactStrings(reports.flatMap((report) => report.notDone)),
    completedAt: input.now ?? new Date()
  };
}

function formatDecision(decision: Decision): string {
  const prefix = decision.question ? `${decision.question}: ` : "";
  return `${prefix}${decision.answer}`;
}

function isOutputMarkedInvalid(output: Record<string, JsonValue> | undefined): boolean {
  if (!output) {
    return false;
  }

  return output.valid === false || output.validationStatus === "failed" || output.validationStatus === "invalid";
}

function compactStrings(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function requireText(value: string, message: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new DomainInvariantError(message);
  }

  return trimmed;
}
