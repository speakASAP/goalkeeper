import type { EventWriter } from "./events.js";
import { DomainInvariantError, type LifecycleContext, transitionGoal } from "./lifecycle.js";
import type { Decision, Goal, IntentRecord, IntentRecordSource, IpsArtifact, JsonValue, Plan, Task } from "./types.js";

export interface NormalizedIntentCard {
  normalizedIntent: string;
  desiredOutcome: string;
  motivation?: string;
  constraints: string[];
  successCriteria: string[];
  nonGoals: string[];
  assumptions: string[];
  openQuestions: string[];
}

export interface IntentApprovalResult {
  goal: Goal;
  summaryRecord: IntentRecord;
  decisionRecord: IntentRecord;
  decision: Decision;
}

export interface IntentCorrectionResult {
  goal: Goal;
  correctionRecord: IntentRecord;
  decisionRecord: IntentRecord;
  decision: Decision;
  stalePlans: Plan[];
  staleTasks: Task[];
  staleArtifacts: IpsArtifact[];
}

export interface IntentRecordIds {
  raw: string;
  summary: string;
  decision: string;
}

export interface CorrectionIds {
  correction: string;
  decision: string;
}

const validSources = new Set<IntentRecordSource>(["telegram", "api", "agent", "system"]);

export function createRawIntentRecord(goal: Goal, id: string, context: LifecycleContext): IntentRecord {
  if (!goal.rawIntent.trim()) {
    throw new DomainInvariantError("Raw intent cannot be empty");
  }

  return {
    id,
    goalId: goal.id,
    kind: "raw",
    content: goal.rawIntent,
    source: intentSourceFromContext(context),
    actorId: context.actor,
    createdAt: context.now ?? new Date()
  };
}

export function createNormalizedIntentCard(input: NormalizedIntentCard): NormalizedIntentCard {
  assertText(input.normalizedIntent, "Normalized intent is required");
  assertText(input.desiredOutcome, "Desired outcome is required");

  return {
    normalizedIntent: input.normalizedIntent.trim(),
    desiredOutcome: input.desiredOutcome.trim(),
    motivation: input.motivation?.trim() || undefined,
    constraints: trimList(input.constraints),
    successCriteria: trimList(input.successCriteria),
    nonGoals: trimList(input.nonGoals),
    assumptions: trimList(input.assumptions),
    openQuestions: trimList(input.openQuestions)
  };
}

export function approveGoalIntent(options: {
  goal: Goal;
  card: NormalizedIntentCard;
  ids: IntentRecordIds;
  eventWriter: EventWriter;
  context: LifecycleContext;
  approvalComment?: string;
}): IntentApprovalResult {
  if (options.goal.status !== "intent_ready") {
    throw new DomainInvariantError("Only intent-ready goals can be approved");
  }

  const card = createNormalizedIntentCard(options.card);
  const now = options.context.now ?? new Date();
  const source = intentSourceFromContext(options.context);
  const preparedGoal: Goal = {
    ...options.goal,
    normalizedIntent: card.normalizedIntent,
    successCriteria: card.successCriteria,
    constraints: card.constraints,
    nonGoals: card.nonGoals,
    assumptions: card.assumptions,
    updatedAt: now
  };
  const approvedGoal = transitionGoal(preparedGoal, "intent_approved", {
    eventWriter: options.eventWriter,
    context: options.context
  });
  const summaryRecord = createSummaryRecord(options.ids.summary, approvedGoal.id, card, source, options.context.actor, now);
  const decision = createDecision({
    id: options.ids.decision,
    projectId: approvedGoal.projectId,
    goalId: approvedGoal.id,
    decisionType: "approve_intent",
    question: "Approve normalized goal intent?",
    answer: options.approvalComment?.trim() || "Approved normalized intent",
    options: ["approve", "fix", "defer"],
    chosenOption: "approve",
    actorId: options.context.actor,
    source,
    createdAt: now
  });
  const decisionRecord = createDecisionIntentRecord(options.ids.decision, approvedGoal.id, decision, source, now);

  options.eventWriter.append({
    type: "intent.approved",
    projectId: approvedGoal.projectId,
    goalId: approvedGoal.id,
    actor: options.context.actor,
    source: options.context.source,
    payload: {
      decisionId: decision.id,
      summaryRecordId: summaryRecord.id
    }
  });

  return {
    goal: approvedGoal,
    summaryRecord,
    decisionRecord,
    decision
  };
}

export function recordIntentCorrection(options: {
  goal: Goal;
  correction: string;
  ids: CorrectionIds;
  eventWriter: EventWriter;
  context: LifecycleContext;
  plans?: Plan[];
  tasks?: Task[];
  artifacts?: IpsArtifact[];
  updatedCard?: NormalizedIntentCard;
}): IntentCorrectionResult {
  assertText(options.correction, "Intent correction cannot be empty");

  const now = options.context.now ?? new Date();
  const source = intentSourceFromContext(options.context);
  const staleReason = `Intent correction ${options.ids.correction}: ${options.correction.trim()}`;
  const card = options.updatedCard ? createNormalizedIntentCard(options.updatedCard) : undefined;
  const goal: Goal = {
    ...options.goal,
    normalizedIntent: card?.normalizedIntent ?? options.goal.normalizedIntent,
    successCriteria: card?.successCriteria ?? options.goal.successCriteria,
    constraints: card?.constraints ?? options.goal.constraints,
    nonGoals: card?.nonGoals ?? options.goal.nonGoals,
    assumptions: card?.assumptions ?? options.goal.assumptions,
    status: options.goal.status === "draft" ? "intent_ready" : options.goal.status,
    updatedAt: now
  };
  const correctionRecord: IntentRecord = {
    id: options.ids.correction,
    goalId: options.goal.id,
    kind: "correction",
    content: options.correction.trim(),
    source,
    actorId: options.context.actor,
    createdAt: now
  };
  const decision = createDecision({
    id: options.ids.decision,
    projectId: goal.projectId,
    goalId: goal.id,
    decisionType: "correct_intent",
    question: "Record owner correction to goal intent?",
    answer: options.correction.trim(),
    options: ["record correction", "ignore correction"],
    chosenOption: "record correction",
    actorId: options.context.actor,
    source,
    createdAt: now
  });
  const decisionRecord = createDecisionIntentRecord(options.ids.decision, goal.id, decision, source, now);
  const stalePlans = staleAffectedPlans(options.plans ?? [], goal.id);
  const staleTasks = staleAffectedTasks(options.tasks ?? [], goal.id, staleReason);
  const staleArtifacts = staleAffectedArtifacts(options.artifacts ?? [], goal.id, staleReason, now);

  options.eventWriter.append({
    type: "intent.corrected",
    projectId: goal.projectId,
    goalId: goal.id,
    actor: options.context.actor,
    source: options.context.source,
    payload: {
      correctionRecordId: correctionRecord.id,
      decisionId: decision.id,
      stalePlanIds: stalePlans.map((plan) => plan.id),
      staleTaskIds: staleTasks.map((task) => task.id),
      staleArtifactIds: staleArtifacts.map((artifact) => artifact.id)
    }
  });

  return {
    goal,
    correctionRecord,
    decisionRecord,
    decision,
    stalePlans,
    staleTasks,
    staleArtifacts
  };
}

function staleAffectedPlans(plans: Plan[], goalId: string): Plan[] {
  return plans
    .filter((plan) => plan.goalId === goalId && (plan.status === "approved" || plan.status === "proposed"))
    .map((plan) => ({
      ...plan,
      status: "superseded"
    }));
}

function staleAffectedTasks(tasks: Task[], goalId: string, reason: string): Task[] {
  return tasks
    .filter((task) => task.goalId === goalId && !["done", "cancelled", "failed"].includes(task.status))
    .map((task) => ({
      ...task,
      status: "blocked",
      ipsGateStatus: task.type === "code" || task.type === "coding" ? "blocked" : task.ipsGateStatus,
      blockedReason: reason
    }));
}

function staleAffectedArtifacts(artifacts: IpsArtifact[], goalId: string, reason: string, now: Date): IpsArtifact[] {
  return artifacts
    .filter(
      (artifact) =>
        artifact.goalId === goalId &&
        artifact.status !== "obsolete" &&
        (artifact.kind === "context_package" || artifact.kind === "coding_prompt")
    )
    .map((artifact) => ({
      ...artifact,
      status: "obsolete",
      summary: `${artifact.summary}\nStale reason: ${reason}`,
      updatedAt: now
    }));
}

function createSummaryRecord(
  id: string,
  goalId: string,
  card: NormalizedIntentCard,
  source: IntentRecordSource,
  actorId: string,
  createdAt: Date
): IntentRecord {
  return {
    id,
    goalId,
    kind: "summary",
    content: JSON.stringify({
      normalizedIntent: card.normalizedIntent,
      desiredOutcome: card.desiredOutcome,
      motivation: card.motivation ?? null,
      constraints: card.constraints,
      successCriteria: card.successCriteria,
      nonGoals: card.nonGoals,
      assumptions: card.assumptions,
      openQuestions: card.openQuestions
    } satisfies Record<string, JsonValue>),
    source,
    actorId,
    createdAt
  };
}

function createDecisionIntentRecord(
  id: string,
  goalId: string,
  decision: Decision,
  source: IntentRecordSource,
  createdAt: Date
): IntentRecord {
  return {
    id: `${id}-intent-record`,
    goalId,
    kind: "decision",
    content: JSON.stringify({
      decisionId: decision.id,
      decisionType: decision.decisionType,
      answer: decision.answer,
      chosenOption: decision.chosenOption ?? null
    } satisfies Record<string, JsonValue>),
    source,
    actorId: decision.actorId,
    createdAt
  };
}

function createDecision(input: Decision): Decision {
  if (!input.answer.trim()) {
    throw new DomainInvariantError("Decision answer is required");
  }

  return {
    ...input,
    answer: input.answer.trim()
  };
}

function intentSourceFromContext(context: LifecycleContext): IntentRecordSource {
  if (!validSources.has(context.source as IntentRecordSource)) {
    return "system";
  }

  return context.source as IntentRecordSource;
}

function assertText(value: string, message: string): void {
  if (!value.trim()) {
    throw new DomainInvariantError(message);
  }
}

function trimList(values: string[]): string[] {
  return values.map((value) => value.trim()).filter(Boolean);
}
