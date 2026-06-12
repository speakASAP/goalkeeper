import assert from "node:assert/strict";
import { test } from "node:test";
import { InMemoryEventWriter } from "./events.js";
import { completeTask, recordTaskValidation } from "./lifecycle.js";
import {
  assessGoalCompletion,
  prepareRetryAfterHumanRejection,
  toTaskValidationResult,
  validateTaskExecution
} from "./validation.js";
import type { Decision, Execution, Goal, Task } from "./types.js";

const now = new Date("2026-06-12T13:00:00.000Z");

function baseGoal(overrides: Partial<Goal> = {}): Goal {
  return {
    id: "goal-1",
    projectId: "project-1",
    title: "Validate executor results",
    rawIntent: "Make GoalKeeper prove tasks served my original intent",
    normalizedIntent: "Add validation reports and completion summaries",
    status: "active",
    priority: 1,
    successCriteria: ["Validation blocks bad output"],
    constraints: ["Telegram-first"],
    nonGoals: ["Dashboard"],
    assumptions: [],
    completionPct: 90,
    createdBy: "owner",
    createdAt: now,
    updatedAt: now,
    ...overrides
  };
}

function baseTask(overrides: Partial<Task> = {}): Task {
  return {
    id: "task-1",
    projectId: "project-1",
    goalId: "goal-1",
    planStepId: "step-1",
    type: "verify",
    status: "validation",
    priority: 1,
    payload: {},
    acceptanceCriteria: ["Report includes validation evidence"],
    dependsOnTaskIds: [],
    approvalRequired: false,
    idempotencyKey: "task-1:v1",
    selectedExecutorId: "shell-safe",
    routingReason: "requires test_run",
    ipsGateStatus: "not_required",
    ipsArtifactIds: ["artifact-report"],
    attempt: 1,
    maxAttempts: 3,
    output: { valid: true },
    createdAt: now,
    startedAt: now,
    ...overrides
  };
}

function baseExecution(overrides: Partial<Execution> = {}): Execution {
  return {
    id: "execution-1",
    taskId: "task-1",
    executorId: "shell-safe",
    executorKind: "cli",
    command: "npm test",
    cwd: "/tmp/project",
    status: "succeeded",
    startedAt: now,
    endedAt: now,
    durationMs: 10,
    exitCode: 0,
    stdoutRef: "short summary",
    stderrRef: "",
    artifactRefs: ["artifact-report"],
    summary: "CLI execution succeeded",
    ...overrides
  };
}

test("invalid task output cannot produce a passed validation result or done task", () => {
  const events = new InMemoryEventWriter();
  const report = validateTaskExecution({
    task: baseTask({ output: { valid: false } }),
    executions: [baseExecution()],
    originalIntent: "Prove validation before completion",
    approvedInterpretation: "Reject invalid executor output",
    validationEvidence: ["node:test failed output check"],
    now
  });

  assert.equal(report.status, "failed");
  assert.ok(report.failedCriteria.includes("Task output is marked invalid"));

  const validating = recordTaskValidation(baseTask(), toTaskValidationResult(report), events, {
    actor: "validator",
    source: "node-test",
    now
  });
  assert.throws(() => completeTask(validating, events, { actor: "validator", source: "node-test", now }), /validation pass/);
});

test("task validation passes only with executor evidence, acceptance criteria, and intent alignment evidence", () => {
  const report = validateTaskExecution({
    task: baseTask(),
    executions: [baseExecution()],
    originalIntent: "Preserve original intent through validation",
    approvedInterpretation: "Validate executor result before task completion",
    validationEvidence: ["npm test passed", "acceptance criteria reviewed"],
    changedArtifactRefs: ["src/domain/validation.ts"],
    risks: ["Semantic validation is deterministic stub only"],
    now
  });

  assert.equal(report.status, "passed");
  assert.equal(report.executorId, "shell-safe");
  assert.deepEqual(report.passedCriteria, ["Report includes validation evidence"]);
  assert.deepEqual(report.failedCriteria, []);
  assert.match(report.semanticValidation.summary, /preserved intent/);
});

test("human rejection creates retry context and event evidence", () => {
  const events = new InMemoryEventWriter();
  const retry = prepareRetryAfterHumanRejection({
    task: baseTask({ status: "validation", attempt: 1, maxAttempts: 3 }),
    reason: "Report missed owner-visible risks",
    feedback: "Add risk summary before retrying validation",
    now,
    eventWriter: events,
    actor: "owner",
    source: "telegram"
  });

  assert.equal(retry.task.status, "failed");
  assert.equal(retry.task.validationResult?.status, "failed");
  assert.equal(retry.retryContext.previousAttempt, 1);
  assert.equal(retry.retryContext.remainingAttempts, 2);
  assert.equal((retry.task.output?.retryContext as { reason: string }).reason, "Report missed owner-visible risks");
  assert.ok(events.list().some((event) => event.type === "task.validation_rejected"));
});

test("retry preparation refuses exhausted retry budget", () => {
  assert.throws(
    () =>
      prepareRetryAfterHumanRejection({
        task: baseTask({ attempt: 3, maxAttempts: 3 }),
        reason: "Still wrong",
        feedback: "No retries remain"
      }),
    /retry budget/
  );
});

test("goal completion detection refuses incomplete and unvalidated required tasks", () => {
  const blockedByStatus = assessGoalCompletion({
    goal: baseGoal(),
    tasks: [baseTask({ status: "failed" })],
    originalIntent: "Complete only valid goals",
    finalInterpretation: "Goal requires all tasks done",
    now
  });

  assert.equal(blockedByStatus.status, "blocked");
  assert.deepEqual(blockedByStatus.blockingTaskIds, ["task-1"]);

  const blockedByValidation = assessGoalCompletion({
    goal: baseGoal(),
    tasks: [baseTask({ status: "done", validationResult: undefined })],
    originalIntent: "Complete only valid goals",
    finalInterpretation: "Goal requires validation",
    now
  });

  assert.equal(blockedByValidation.status, "blocked");
  assert.deepEqual(blockedByValidation.blockingTaskIds, ["task-1"]);
});

test("goal completion report includes intent, decisions, task summaries, artifacts, and validation evidence", () => {
  const taskReport = validateTaskExecution({
    task: baseTask({ status: "done", validationResult: { status: "passed", summary: "passed", evidence: ["npm test"], validatedAt: now } }),
    executions: [baseExecution()],
    originalIntent: "Report original owner intent",
    approvedInterpretation: "Summarize final interpretation",
    validationEvidence: ["npm test", "owner report reviewed"],
    changedArtifactRefs: ["src/domain/validation.ts"],
    risks: ["Autonomous digest is future work"],
    now
  });
  const decision: Decision = {
    id: "decision-1",
    projectId: "project-1",
    goalId: "goal-1",
    taskId: "task-1",
    decisionType: "owner_feedback",
    question: "Accept report?",
    answer: "Accept after adding risks",
    options: ["Accept", "Retry"],
    chosenOption: "Accept",
    actorId: "owner",
    source: "telegram",
    createdAt: now
  };

  const assessment = assessGoalCompletion({
    goal: baseGoal(),
    tasks: [
      baseTask({
        status: "done",
        validationResult: toTaskValidationResult(taskReport)
      })
    ],
    originalIntent: "Report original owner intent",
    finalInterpretation: "Summarize final interpretation",
    decisions: [decision],
    taskReports: [taskReport],
    now
  });

  assert.equal(assessment.status, "ready");
  assert.equal(assessment.report.originalIntent, "Report original owner intent");
  assert.deepEqual(assessment.report.completedTaskIds, ["task-1"]);
  assert.ok(assessment.report.decisions.some((item) => item.includes("Accept after adding risks")));
  assert.ok(assessment.report.validationEvidence.includes("owner report reviewed"));
  assert.ok(assessment.report.changedArtifactRefs.includes("src/domain/validation.ts"));
  assert.ok(assessment.report.risks.includes("Autonomous digest is future work"));
});
