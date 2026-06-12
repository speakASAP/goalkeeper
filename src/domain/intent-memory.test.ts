import assert from "node:assert/strict";
import { test } from "node:test";
import { InMemoryEventWriter } from "./events.js";
import {
  approveGoalIntent,
  createNormalizedIntentCard,
  createRawIntentRecord,
  recordIntentCorrection
} from "./intent-memory.js";
import { DomainInvariantError, transitionGoal, updateIntentRecordContent } from "./lifecycle.js";
import type { Goal, IntentRecord, IpsArtifact, Plan, Task } from "./types.js";

const now = new Date("2026-06-12T10:00:00.000Z");
const context = { actor: "owner", source: "telegram", now };

function baseGoal(overrides: Partial<Goal> = {}): Goal {
  return {
    id: "goal-1",
    projectId: "project-1",
    title: "Build Telegram intent memory",
    rawIntent: "Build GoalKeeper with Telegram-first intent preservation",
    status: "draft",
    priority: 1,
    successCriteria: [],
    constraints: [],
    nonGoals: [],
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
    summary: "Implement intent memory",
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
    type: "code",
    status: "assigned",
    priority: 1,
    payload: {},
    acceptanceCriteria: ["Intent lifecycle tests pass"],
    dependsOnTaskIds: [],
    approvalRequired: false,
    idempotencyKey: "task-1:v1",
    selectedExecutorId: "codex-cli",
    routingReason: "requires code_edit",
    ipsGateStatus: "passed",
    contextPackageId: "artifact-context",
    codingPromptId: "artifact-prompt",
    ipsArtifactIds: ["artifact-context", "artifact-prompt"],
    attempt: 0,
    maxAttempts: 3,
    createdAt: now,
    ...overrides
  };
}

function baseArtifact(overrides: Partial<IpsArtifact> = {}): IpsArtifact {
  return {
    id: "artifact-context",
    projectId: "project-1",
    goalId: "goal-1",
    taskId: "task-1",
    kind: "context_package",
    path: "implementation-goals/example.context-package.md",
    status: "used",
    source: "intent-memory-test",
    summary: "Context package generated from approved intent",
    missingMarkers: [],
    upstreamArtifactIds: [],
    createdAt: now,
    updatedAt: now,
    ...overrides
  };
}

function intentCard() {
  return createNormalizedIntentCard({
    normalizedIntent: "Build Telegram-first goal management with preserved intent",
    desiredOutcome: "Intent can be approved before planning",
    motivation: "Prevent agents from guessing meaning",
    constraints: ["Telegram-first", "Fail closed for missing IPS context"],
    successCriteria: ["Planning is blocked before approval", "Corrections stale downstream artifacts"],
    nonGoals: ["Dashboard-first rebuild"],
    assumptions: ["Goal 02 domain contracts exist"],
    openQuestions: []
  });
}

test("raw intent capture keeps source text immutable and separate from normalized intent", () => {
  const goal = baseGoal();
  const raw = createRawIntentRecord(goal, "intent-raw", context);
  const card = intentCard();

  assert.equal(raw.kind, "raw");
  assert.equal(raw.content, goal.rawIntent);
  assert.equal(card.normalizedIntent.includes("Telegram-first"), true);
  assert.notEqual(card.normalizedIntent, raw.content);
  assert.throws(() => updateIntentRecordContent(raw, "rewritten"), DomainInvariantError);
});

test("intent approval stores normalized fields, decision records, and allows planning", () => {
  const events = new InMemoryEventWriter();
  const result = approveGoalIntent({
    goal: baseGoal({ status: "intent_ready" }),
    card: intentCard(),
    ids: { raw: "intent-raw", summary: "intent-summary", decision: "decision-approve" },
    eventWriter: events,
    context
  });

  assert.equal(result.goal.status, "intent_approved");
  assert.equal(result.goal.normalizedIntent, "Build Telegram-first goal management with preserved intent");
  assert.deepEqual(result.goal.nonGoals, ["Dashboard-first rebuild"]);
  assert.equal(result.summaryRecord.kind, "summary");
  assert.equal(result.decision.decisionType, "approve_intent");
  assert.equal(result.decisionRecord.kind, "decision");
  assert.ok(events.list().some((event) => event.type === "intent.approved"));

  const planning = transitionGoal(result.goal, "planning", { eventWriter: events, context });
  assert.equal(planning.status, "planning");
});

test("intent approval rejects goals that are not ready for owner approval", () => {
  const events = new InMemoryEventWriter();

  assert.throws(
    () =>
      approveGoalIntent({
        goal: baseGoal({ status: "draft" }),
        card: intentCard(),
        ids: { raw: "intent-raw", summary: "intent-summary", decision: "decision-approve" },
        eventWriter: events,
        context
      }),
    /intent-ready/
  );
});

test("planning remains blocked before intent approval", () => {
  const events = new InMemoryEventWriter();

  assert.throws(
    () => transitionGoal(baseGoal({ status: "intent_ready" }), "planning", { eventWriter: events, context }),
    /intent approval/
  );
});

test("correction creates a new record and keeps previous intent records unchanged", () => {
  const events = new InMemoryEventWriter();
  const raw: IntentRecord = createRawIntentRecord(baseGoal(), "intent-raw", context);
  const correction = recordIntentCorrection({
    goal: baseGoal({ status: "intent_approved", normalizedIntent: "Build a dashboard" }),
    correction: "No, I meant Telegram control, not a dashboard.",
    ids: { correction: "intent-correction", decision: "decision-correction" },
    eventWriter: events,
    context,
    updatedCard: intentCard()
  });

  assert.equal(correction.correctionRecord.kind, "correction");
  assert.equal(correction.correctionRecord.content, "No, I meant Telegram control, not a dashboard.");
  assert.equal(raw.content, "Build GoalKeeper with Telegram-first intent preservation");
  assert.equal(correction.goal.normalizedIntent, "Build Telegram-first goal management with preserved intent");
  assert.equal(correction.decision.decisionType, "correct_intent");
  assert.equal(correction.decisionRecord.kind, "decision");
});

test("correction marks affected plans, tasks, context packages, and coding prompts stale", () => {
  const events = new InMemoryEventWriter();
  const result = recordIntentCorrection({
    goal: baseGoal({ status: "active", normalizedIntent: "Build dashboard workflow" }),
    correction: "Telegram is the primary control plane; dashboard work is out of scope.",
    ids: { correction: "intent-correction", decision: "decision-correction" },
    eventWriter: events,
    context,
    plans: [basePlan(), basePlan({ id: "plan-rejected", status: "rejected" })],
    tasks: [baseTask(), baseTask({ id: "task-done", status: "done" })],
    artifacts: [
      baseArtifact(),
      baseArtifact({ id: "artifact-prompt", kind: "coding_prompt", path: "implementation-goals/example.coding-prompt.md" }),
      baseArtifact({ id: "artifact-validation", kind: "validation_report", status: "approved" })
    ]
  });

  assert.deepEqual(
    result.stalePlans.map((plan) => [plan.id, plan.status]),
    [["plan-1", "superseded"]]
  );
  assert.deepEqual(
    result.staleTasks.map((task) => [task.id, task.status, task.ipsGateStatus]),
    [["task-1", "blocked", "blocked"]]
  );
  assert.deepEqual(
    result.staleArtifacts.map((artifact) => [artifact.id, artifact.status]),
    [
      ["artifact-context", "obsolete"],
      ["artifact-prompt", "obsolete"]
    ]
  );
  assert.ok(result.staleTasks[0]?.blockedReason?.includes("Intent correction"));
  assert.ok(events.list().some((event) => event.type === "intent.corrected"));
});
