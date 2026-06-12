import assert from "node:assert/strict";
import { test } from "node:test";
import { InMemoryEventWriter } from "./events.js";
import { DomainInvariantError } from "./lifecycle.js";
import {
  DeterministicPlannerAdapter,
  approvePlan,
  createTasksFromApprovedPlan,
  proposePlan,
  regeneratePlan,
  rejectPlan,
  type PlannerAdapter,
  type PlannerPlanDraft
} from "./planning.js";
import type { Goal, Plan, PlanStep } from "./types.js";

const now = new Date("2026-06-12T10:00:00.000Z");
const context = { actor: "owner", source: "telegram", now };

function baseGoal(overrides: Partial<Goal> = {}): Goal {
  return {
    id: "goal-1",
    projectId: "project-1",
    title: "Add active agents report",
    rawIntent: "Show active agents in Telegram",
    normalizedIntent: "Add a Telegram-first active agents report",
    status: "intent_approved",
    priority: 2,
    successCriteria: ["Owner can review active agents from Telegram"],
    constraints: ["Telegram-first"],
    nonGoals: ["Dashboard-first rebuild"],
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
    status: "proposed",
    summary: "Build active agents report",
    createdByAgent: "test-planner",
    createdAt: now,
    ...overrides
  };
}

function baseStep(overrides: Partial<PlanStep> = {}): PlanStep {
  return {
    id: "step-1",
    planId: "plan-1",
    index: 1,
    title: "Render active agents",
    description: "Create a Telegram report for active agents",
    type: "code",
    priority: 1,
    dependsOnStepIds: [],
    acceptanceCriteria: ["Report includes active agent status"],
    approvalRequired: true,
    riskLevel: "medium",
    toolRequirements: ["repo_read", "code_edit"],
    ...overrides
  };
}

function planner(draft: PlannerPlanDraft): PlannerAdapter {
  return {
    id: "test-planner",
    proposePlan: () => draft
  };
}

test("proposing a plan requires approved intent and moves goal to awaiting approval", () => {
  const events = new InMemoryEventWriter();
  const result = proposePlan({
    goal: baseGoal(),
    existingPlans: [],
    planner: new DeterministicPlannerAdapter(),
    ids: { planId: "plan-1", stepIds: ["step-1"] },
    eventWriter: events,
    context
  });

  assert.equal(result.goal.status, "awaiting_plan_approval");
  assert.equal(result.plan.status, "proposed");
  assert.equal(result.plan.version, 1);
  assert.equal(result.steps.length, 1);
  assert.ok(events.list().some((event) => event.type === "plan.proposed"));

  assert.throws(
    () =>
      proposePlan({
        goal: baseGoal({ status: "intent_ready" }),
        existingPlans: [],
        planner: new DeterministicPlannerAdapter(),
        ids: { planId: "plan-2", stepIds: ["step-2"] },
        eventWriter: events,
        context
      }),
    /approved goal intent/
  );
});

test("plan regeneration creates a new version and supersedes prior proposed plans", () => {
  const events = new InMemoryEventWriter();
  const result = regeneratePlan({
    goal: baseGoal({ status: "awaiting_plan_approval" }),
    existingPlans: [basePlan()],
    planner: new DeterministicPlannerAdapter(),
    ids: { planId: "plan-2", stepIds: ["step-2"] },
    eventWriter: events,
    context
  });

  assert.equal(result.plan.version, 2);
  assert.equal(result.supersededPlans.length, 1);
  assert.equal(result.supersededPlans[0]?.status, "superseded");
  assert.ok(events.list().some((event) => event.type === "plan.regenerated"));

  assert.throws(
    () =>
      regeneratePlan({
        goal: baseGoal({ status: "active" }),
        existingPlans: [basePlan({ status: "approved" })],
        planner: new DeterministicPlannerAdapter(),
        ids: { planId: "plan-3", stepIds: ["step-3"] },
        eventWriter: events,
        context
      }),
    /awaiting plan approval/
  );
});

test("approving a plan leaves only one approved plan and creates tasks", () => {
  const events = new InMemoryEventWriter();
  const result = approvePlan({
    goal: baseGoal({ status: "awaiting_plan_approval" }),
    plan: basePlan(),
    steps: [
      baseStep(),
      baseStep({
        id: "step-2",
        index: 2,
        title: "Validate report",
        type: "verify",
        dependsOnStepIds: ["step-1"],
        acceptanceCriteria: ["Validation report exists"],
        approvalRequired: false,
        toolRequirements: ["test_run"]
      })
    ],
    existingPlans: [basePlan(), basePlan({ id: "plan-previous", version: 0, status: "approved" })],
    taskIds: ["task-1", "task-2"],
    decisionId: "decision-plan-1",
    approvedBy: "owner",
    eventWriter: events,
    context
  });

  assert.equal(result.goal.status, "active");
  assert.equal(result.approvedPlan.status, "approved");
  assert.equal(result.plans.filter((plan) => plan.status === "approved").length, 1);
  assert.equal(result.tasks.length, 2);
  assert.equal(result.tasks[0]?.status, "pending_approval");
  assert.equal(result.tasks[0]?.ipsGateStatus, "pending");
  assert.deepEqual(result.tasks[1]?.dependsOnTaskIds, ["task-1"]);
  assert.deepEqual(result.tasks[1]?.acceptanceCriteria, ["Validation report exists"]);
  assert.equal(result.decision.decisionType, "approve_plan");
  assert.ok(events.list().some((event) => event.type === "plan.approved"));
});

test("task creation rejects unapproved plans, missing criteria, and dangling dependencies", () => {
  assert.throws(
    () =>
      createTasksFromApprovedPlan({
        goal: baseGoal(),
        plan: basePlan({ status: "proposed" }),
        steps: [baseStep()],
        taskIds: ["task-1"],
        context
      }),
    /approved plan/
  );

  assert.throws(
    () =>
      createTasksFromApprovedPlan({
        goal: baseGoal(),
        plan: basePlan({ status: "approved" }),
        steps: [baseStep({ acceptanceCriteria: [] })],
        taskIds: ["task-1"],
        context
      }),
    /acceptance criteria/
  );

  assert.throws(
    () =>
      createTasksFromApprovedPlan({
        goal: baseGoal(),
        plan: basePlan({ status: "approved" }),
        steps: [baseStep({ dependsOnStepIds: ["missing-step"] })],
        taskIds: ["task-1"],
        context
      }),
    /dependency/
  );
});

test("planning adapter output is validated before plan proposal", () => {
  const events = new InMemoryEventWriter();
  assert.throws(
    () =>
      proposePlan({
        goal: baseGoal(),
        existingPlans: [],
        planner: planner({
          summary: "Invalid plan",
          steps: [
            {
              title: "No acceptance criteria",
              description: "Invalid",
              type: "code",
              acceptanceCriteria: []
            }
          ]
        }),
        ids: { planId: "plan-invalid", stepIds: ["step-invalid"] },
        eventWriter: events,
        context
      }),
    DomainInvariantError
  );
});

test("rejected plans and superseded plans cannot create tasks", () => {
  const events = new InMemoryEventWriter();
  const rejection = rejectPlan({
    goal: baseGoal({ status: "awaiting_plan_approval" }),
    plan: basePlan(),
    reason: "Plan is too broad",
    decisionId: "decision-reject",
    rejectedBy: "owner",
    eventWriter: events,
    context
  });

  assert.equal(rejection.rejectedPlan.status, "rejected");
  assert.equal(rejection.decision.chosenOption, "reject");
  assert.throws(
    () =>
      createTasksFromApprovedPlan({
        goal: baseGoal(),
        plan: rejection.rejectedPlan,
        steps: [baseStep()],
        taskIds: ["task-1"],
        context
      }),
    /approved plan/
  );
  assert.throws(
    () =>
      createTasksFromApprovedPlan({
        goal: baseGoal(),
        plan: basePlan({ status: "superseded" }),
        steps: [baseStep()],
        taskIds: ["task-1"],
        context
      }),
    /approved plan/
  );
});
