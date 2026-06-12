import assert from "node:assert/strict";
import { test } from "node:test";
import { InMemoryEventWriter } from "./events.js";
import {
  DomainInvariantError,
  answerBlockerWithDecision,
  approveTask,
  assertCodingTaskExecutable,
  assertSingleApprovedPlan,
  assignTaskExecutor,
  blockCodingTaskForIpsFailure,
  completeTask,
  createCorrectionIntentRecord,
  recordTaskValidation,
  rejectTask,
  startTask,
  transitionGoal,
  updateGoalRawIntent,
  updateIntentRecordContent
} from "./lifecycle.js";
import type { Blocker, Decision, Goal, IntentRecord, IpsArtifact, Plan, Task } from "./types.js";

const now = new Date("2026-06-12T10:00:00.000Z");
const context = { actor: "test-agent", source: "node-test", now };

function baseGoal(overrides: Partial<Goal> = {}): Goal {
  return {
    id: "goal-1",
    projectId: "project-1",
    title: "Implement domain persistence",
    rawIntent: "Preserve GoalKeeper intent chain",
    status: "draft",
    priority: 1,
    successCriteria: ["Lifecycle rules pass"],
    constraints: ["Telegram-first"],
    nonGoals: ["Dashboard"],
    assumptions: [],
    completionPct: 0,
    createdBy: "owner",
    createdAt: now,
    updatedAt: now,
    ...overrides
  };
}

function basePlan(overrides: Partial<Plan> = {}): Plan {
  return {
    id: "plan-1",
    goalId: "goal-1",
    version: 1,
    status: "approved",
    summary: "Build the persistence model",
    createdByAgent: "planner",
    createdAt: now,
    approvedAt: now,
    approvedBy: "owner",
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
    status: "created",
    priority: 1,
    payload: {},
    acceptanceCriteria: ["Validation passes"],
    dependsOnTaskIds: [],
    approvalRequired: false,
    idempotencyKey: "task-1:v1",
    ipsGateStatus: "not_required",
    ipsArtifactIds: [],
    attempt: 0,
    maxAttempts: 3,
    createdAt: now,
    ...overrides
  };
}

test("raw goal intent and raw intent records are immutable", () => {
  assert.throws(() => updateGoalRawIntent(), DomainInvariantError);

  const rawRecord: IntentRecord = {
    id: "intent-1",
    goalId: "goal-1",
    kind: "raw",
    content: "Original owner request",
    source: "telegram",
    actorId: "owner",
    createdAt: now
  };

  assert.throws(() => updateIntentRecordContent(rawRecord, "rewritten"), DomainInvariantError);

  const correction = createCorrectionIntentRecord({
    ...rawRecord,
    id: "intent-2",
    content: "Clarifying correction"
  });
  assert.equal(correction.kind, "correction");
  assert.equal(correction.content, "Clarifying correction");
});

test("goal lifecycle enforces intent and plan approvals", () => {
  const events = new InMemoryEventWriter();

  assert.throws(
    () => transitionGoal(baseGoal({ status: "draft" }), "planning", { eventWriter: events, context }),
    /intent approval/
  );

  const planning = transitionGoal(baseGoal({ status: "intent_approved" }), "planning", {
    eventWriter: events,
    context
  });
  assert.equal(planning.status, "planning");

  assert.throws(
    () => transitionGoal(baseGoal({ status: "awaiting_plan_approval" }), "active", { eventWriter: events, context }),
    /approved plan/
  );

  const active = transitionGoal(baseGoal({ status: "awaiting_plan_approval" }), "active", {
    eventWriter: events,
    context,
    plans: [basePlan()]
  });
  assert.equal(active.status, "active");
  assert.equal(events.list().filter((event) => event.type === "goal.status_changed").length, 2);
});

test("goal completion requires all required tasks done", () => {
  const events = new InMemoryEventWriter();

  assert.throws(
    () =>
      transitionGoal(baseGoal({ status: "active" }), "completed", {
        eventWriter: events,
        context,
        tasks: [baseTask({ status: "in_progress" })]
      }),
    /open, failed, or blocked/
  );

  const completed = transitionGoal(baseGoal({ status: "active" }), "completed", {
    eventWriter: events,
    context,
    tasks: [baseTask({ status: "done" })]
  });

  assert.equal(completed.status, "completed");
  assert.equal(completed.completedAt?.toISOString(), now.toISOString());
});

test("only one approved plan can be active for a goal", () => {
  assert.doesNotThrow(() => assertSingleApprovedPlan("goal-1", [basePlan()]));
  assert.throws(
    () => assertSingleApprovedPlan("goal-1", [basePlan(), basePlan({ id: "plan-2", version: 2 })]),
    /Only one approved plan/
  );
});

test("task lifecycle enforces assignment, dependencies, validation, and events", () => {
  const events = new InMemoryEventWriter();
  const approved = approveTask(baseTask({ status: "pending_approval" }), events, context);
  const assigned = assignTaskExecutor(approved, "internal-worker", "verify task", events, context);
  const started = startTask(assigned, [], events, context);

  assert.equal(started.status, "in_progress");
  assert.equal(started.attempt, 1);

  assert.throws(() => completeTask(started, events, context), /validation pass/);

  const validation = {
    status: "passed" as const,
    summary: "Checks passed",
    evidence: ["npm test"],
    validatedAt: now
  };
  const validating = recordTaskValidation(started, validation, events, context);
  const done = completeTask(validating, events, context);

  assert.equal(done.status, "done");
  assert.ok(events.list().some((event) => event.type === "task.validation_recorded"));
});

test("task cannot start before dependencies are done", () => {
  const events = new InMemoryEventWriter();
  const task = baseTask({
    status: "assigned",
    selectedExecutorId: "internal-worker",
    routingReason: "ready",
    dependsOnTaskIds: ["task-0"]
  });

  assert.throws(() => startTask(task, [baseTask({ id: "task-0", status: "failed" })], events, context), /dependency/);
});

test("task rejection requires a reason", () => {
  const events = new InMemoryEventWriter();
  assert.throws(() => rejectTask(baseTask(), "", events, context), /reason/);
  assert.equal(rejectTask(baseTask(), "Owner rejected scope", events, context).status, "cancelled");
});

test("coding tasks require IPS gate and artifact references before execution", () => {
  const events = new InMemoryEventWriter();
  const codingTask = baseTask({
    type: "code",
    status: "assigned",
    selectedExecutorId: "codex-cli",
    routingReason: "requires code_edit"
  });

  assert.throws(() => startTask(codingTask, [], events, context), /IPS pre-coding gate/);

  const readyCodingTask = {
    ...codingTask,
    ipsGateStatus: "passed" as const,
    contextPackageId: "cp-1",
    codingPromptId: "prompt-1",
    ipsArtifactIds: ["artifact-1"]
  };

  assert.doesNotThrow(() => assertCodingTaskExecutable(readyCodingTask));
  assert.equal(startTask(readyCodingTask, [], events, context).status, "in_progress");
});

test("draft or incomplete IPS artifacts cannot authorize coding", () => {
  const task = baseTask({
    type: "code",
    ipsGateStatus: "passed",
    contextPackageId: "cp-1",
    codingPromptId: "prompt-1",
    ipsArtifactIds: ["artifact-1"]
  });
  const artifact: IpsArtifact = {
    id: "artifact-1",
    projectId: "project-1",
    goalId: "goal-1",
    taskId: "task-1",
    kind: "execution_plan",
    path: "implementation-goals/example.md",
    status: "draft",
    source: "test",
    summary: "Draft",
    missingMarkers: [],
    upstreamArtifactIds: [],
    createdAt: now,
    updatedAt: now
  };

  assert.throws(() => assertCodingTaskExecutable(task, [artifact]), /Draft or incomplete/);
  assert.throws(
    () => assertCodingTaskExecutable(task, [{ ...artifact, status: "approved", missingMarkers: ["[MISSING: scope]"] }]),
    /Draft or incomplete/
  );
});

test("IPS gate failure blocks coding tasks and emits transition event", () => {
  const events = new InMemoryEventWriter();
  const task = baseTask({
    type: "code",
    status: "assigned",
    selectedExecutorId: "codex-cli",
    routingReason: "requires code_edit",
    ipsGateStatus: "pending"
  });
  const blocker: Blocker = {
    id: "blocker-ips",
    projectId: "project-1",
    goalId: "goal-1",
    taskId: "task-1",
    type: "ips_gate_failed",
    reason: "Execution plan is missing approved IPS artifacts",
    options: [],
    impact: "Coding executor cannot run",
    status: "open",
    createdAt: now
  };

  const blocked = blockCodingTaskForIpsFailure(task, blocker, events, context);
  const event = events.list().at(-1);

  assert.equal(blocked.status, "blocked");
  assert.equal(blocked.ipsBlockerId, "blocker-ips");
  assert.equal(event?.payload.from, "assigned");
  assert.equal(event?.payload.to, "blocked");
});

test("answering a blocker creates a decision-backed state change", () => {
  const blocker: Blocker = {
    id: "blocker-1",
    projectId: "project-1",
    goalId: "goal-1",
    taskId: "task-1",
    type: "needs_user_answer",
    question: "Approve plan?",
    reason: "Human approval required",
    options: ["Approve", "Reject"],
    impact: "Plan cannot proceed without approval",
    status: "open",
    createdAt: now
  };
  const decision: Decision = {
    id: "decision-1",
    projectId: "project-1",
    goalId: "goal-1",
    taskId: "task-1",
    decisionType: "approve_plan",
    question: "Approve plan?",
    answer: "Approve",
    options: ["Approve", "Reject"],
    chosenOption: "Approve",
    actorId: "owner",
    source: "telegram",
    createdAt: now
  };

  assert.equal(answerBlockerWithDecision(blocker, decision).status, "answered");
});
