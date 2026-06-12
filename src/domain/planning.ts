import type { EventWriter } from "./events.js";
import {
  DomainInvariantError,
  type LifecycleContext,
  assertSingleApprovedPlan,
  transitionGoal
} from "./lifecycle.js";
import type { Decision, Goal, JsonValue, Plan, PlanStep, RiskLevel, Task } from "./types.js";

export interface PlannerStepDraft {
  title: string;
  description: string;
  type: string;
  priority?: number;
  dependsOnStepIndexes?: number[];
  acceptanceCriteria: string[];
  approvalRequired?: boolean;
  riskLevel?: RiskLevel;
  targetService?: string;
  toolRequirements?: string[];
  preferredExecutorId?: string;
}

export interface PlannerPlanDraft {
  summary: string;
  steps: PlannerStepDraft[];
}

export interface PlannerAdapter {
  id: string;
  proposePlan(goal: Goal): PlannerPlanDraft;
}

export class DeterministicPlannerAdapter implements PlannerAdapter {
  readonly id = "deterministic-planner";

  proposePlan(goal: Goal): PlannerPlanDraft {
    const successCriteria = goal.successCriteria.length > 0 ? goal.successCriteria : ["Owner acceptance criteria reviewed"];

    return {
      summary: goal.normalizedIntent ?? goal.title,
      steps: [
        {
          title: `Plan ${goal.title}`,
          description: goal.normalizedIntent ?? goal.rawIntent,
          type: "planning",
          priority: goal.priority,
          acceptanceCriteria: successCriteria,
          approvalRequired: false,
          riskLevel: "low",
          toolRequirements: []
        }
      ]
    };
  }
}

export interface PlanRecordIds {
  planId: string;
  stepIds: string[];
}

export interface PlanProposalResult {
  goal: Goal;
  plan: Plan;
  steps: PlanStep[];
  supersededPlans: Plan[];
}

export interface PlanApprovalResult {
  goal: Goal;
  approvedPlan: Plan;
  plans: Plan[];
  tasks: Task[];
  decision: Decision;
}

export interface PlanRejectionResult {
  goal: Goal;
  rejectedPlan: Plan;
  decision: Decision;
}

export function proposePlan(options: {
  goal: Goal;
  existingPlans: Plan[];
  planner: PlannerAdapter;
  ids: PlanRecordIds;
  eventWriter: EventWriter;
  context: LifecycleContext;
}): PlanProposalResult {
  if (options.goal.status !== "intent_approved") {
    throw new DomainInvariantError("Planning requires approved goal intent");
  }

  const nextVersion = nextPlanVersion(options.existingPlans, options.goal.id);
  return createPlanProposal({
    ...options,
    version: nextVersion,
    supersedeProposedPlans: false
  });
}

export function regeneratePlan(options: {
  goal: Goal;
  existingPlans: Plan[];
  planner: PlannerAdapter;
  ids: PlanRecordIds;
  eventWriter: EventWriter;
  context: LifecycleContext;
}): PlanProposalResult {
  if (options.goal.status !== "awaiting_plan_approval") {
    throw new DomainInvariantError("Only goals awaiting plan approval can regenerate a plan");
  }

  if (options.existingPlans.some((plan) => plan.goalId === options.goal.id && plan.status === "approved")) {
    throw new DomainInvariantError("Approved plans cannot be regenerated without a new intent correction");
  }

  const nextVersion = nextPlanVersion(options.existingPlans, options.goal.id);
  return createPlanProposal({
    ...options,
    version: nextVersion,
    supersedeProposedPlans: true
  });
}

export function approvePlan(options: {
  goal: Goal;
  plan: Plan;
  steps: PlanStep[];
  existingPlans: Plan[];
  taskIds: string[];
  decisionId: string;
  approvedBy: string;
  eventWriter: EventWriter;
  context: LifecycleContext;
}): PlanApprovalResult {
  assertPlanBelongsToGoal(options.goal, options.plan);
  if (options.plan.status !== "proposed") {
    throw new DomainInvariantError("Only proposed plans can be approved");
  }

  const now = options.context.now ?? new Date();
  const approvedPlan: Plan = {
    ...options.plan,
    status: "approved",
    approvedAt: now,
    approvedBy: options.approvedBy
  };
  const plans = options.existingPlans.map((plan) => {
    if (plan.id === approvedPlan.id) {
      return approvedPlan;
    }

    if (plan.goalId === options.goal.id && (plan.status === "approved" || plan.status === "proposed")) {
      return {
        ...plan,
        status: "superseded" as const
      };
    }

    return plan;
  });
  const mergedPlans = plans.some((plan) => plan.id === approvedPlan.id) ? plans : [...plans, approvedPlan];
  assertSingleApprovedPlan(options.goal.id, mergedPlans);

  const tasks = createTasksFromApprovedPlan({
    goal: options.goal,
    plan: approvedPlan,
    steps: options.steps,
    taskIds: options.taskIds,
    context: options.context
  });
  const activeGoal = transitionGoal(options.goal, "active", {
    plans: mergedPlans,
    tasks,
    eventWriter: options.eventWriter,
    context: options.context
  });
  const decision = createPlanDecision({
    id: options.decisionId,
    goal: activeGoal,
    plan: approvedPlan,
    decisionType: "approve_plan",
    answer: "Approved plan",
    chosenOption: "approve",
    actorId: options.approvedBy,
    source: sourceFromContext(options.context),
    createdAt: now
  });

  options.eventWriter.append({
    type: "plan.approved",
    projectId: activeGoal.projectId,
    goalId: activeGoal.id,
    actor: options.context.actor,
    source: options.context.source,
    payload: {
      planId: approvedPlan.id,
      version: approvedPlan.version,
      decisionId: decision.id,
      taskIds: tasks.map((task) => task.id)
    }
  });

  return {
    goal: activeGoal,
    approvedPlan,
    plans: mergedPlans,
    tasks,
    decision
  };
}

export function rejectPlan(options: {
  goal: Goal;
  plan: Plan;
  reason: string;
  decisionId: string;
  rejectedBy: string;
  eventWriter: EventWriter;
  context: LifecycleContext;
}): PlanRejectionResult {
  assertPlanBelongsToGoal(options.goal, options.plan);
  if (options.plan.status !== "proposed") {
    throw new DomainInvariantError("Only proposed plans can be rejected");
  }

  const reason = options.reason.trim();
  if (!reason) {
    throw new DomainInvariantError("Plan rejection requires a reason");
  }

  const now = options.context.now ?? new Date();
  const rejectedPlan: Plan = {
    ...options.plan,
    status: "rejected"
  };
  const decision = createPlanDecision({
    id: options.decisionId,
    goal: options.goal,
    plan: rejectedPlan,
    decisionType: "reject_plan",
    answer: reason,
    chosenOption: "reject",
    actorId: options.rejectedBy,
    source: sourceFromContext(options.context),
    createdAt: now
  });

  options.eventWriter.append({
    type: "plan.rejected",
    projectId: options.goal.projectId,
    goalId: options.goal.id,
    actor: options.context.actor,
    source: options.context.source,
    payload: {
      planId: rejectedPlan.id,
      version: rejectedPlan.version,
      decisionId: decision.id,
      reason
    }
  });

  return {
    goal: options.goal,
    rejectedPlan,
    decision
  };
}

export function createTasksFromApprovedPlan(options: {
  goal: Goal;
  plan: Plan;
  steps: PlanStep[];
  taskIds: string[];
  context: LifecycleContext;
}): Task[] {
  assertPlanBelongsToGoal(options.goal, options.plan);
  if (options.plan.status !== "approved") {
    throw new DomainInvariantError("Task creation requires an approved plan");
  }

  const steps = validatePlanSteps(options.plan, options.steps);
  if (options.taskIds.length !== steps.length) {
    throw new DomainInvariantError("Task ID count must match plan step count");
  }

  const now = options.context.now ?? new Date();
  const stepToTaskId = new Map<string, string>();
  steps.forEach((step, index) => stepToTaskId.set(step.id, options.taskIds[index] ?? ""));

  return steps.map((step, index) => ({
    id: options.taskIds[index] ?? "",
    projectId: options.goal.projectId,
    goalId: options.goal.id,
    planStepId: step.id,
    type: step.type,
    status: step.approvalRequired ? "pending_approval" : "created",
    priority: step.priority,
    payload: {
      title: step.title,
      description: step.description,
      riskLevel: step.riskLevel,
      targetService: step.targetService ?? null,
      toolRequirements: step.toolRequirements
    },
    acceptanceCriteria: [...step.acceptanceCriteria],
    dependsOnTaskIds: step.dependsOnStepIds.map((stepId) => stepToTaskId.get(stepId) ?? ""),
    approvalRequired: step.approvalRequired,
    idempotencyKey: `${options.goal.id}:plan-${options.plan.version}:step-${step.index}`,
    selectedExecutorId: undefined,
    routingReason: undefined,
    ipsGateStatus: isCodingType(step.type) ? "pending" : "not_required",
    ipsArtifactIds: [],
    intentBundleSnapshot: createIntentBundleSnapshot(options.goal, options.plan, step),
    attempt: 0,
    maxAttempts: 3,
    createdAt: now
  }));
}

function createPlanProposal(options: {
  goal: Goal;
  existingPlans: Plan[];
  planner: PlannerAdapter;
  ids: PlanRecordIds;
  eventWriter: EventWriter;
  context: LifecycleContext;
  version: number;
  supersedeProposedPlans: boolean;
}): PlanProposalResult {
  const planningGoal =
    options.goal.status === "intent_approved"
      ? transitionGoal(options.goal, "planning", {
          eventWriter: options.eventWriter,
          context: options.context
        })
      : options.goal;

  if (planningGoal.status !== "planning" && planningGoal.status !== "awaiting_plan_approval") {
    throw new DomainInvariantError("Planning requires approved goal intent");
  }

  const draft = options.planner.proposePlan(planningGoal);
  const now = options.context.now ?? new Date();
  const plan: Plan = {
    id: options.ids.planId,
    goalId: planningGoal.id,
    version: options.version,
    status: "proposed",
    summary: requireText(draft.summary, "Plan summary is required"),
    createdByAgent: options.planner.id,
    createdAt: now
  };
  const steps = createPlanSteps(plan, draft.steps, options.ids.stepIds);
  const awaitingGoal = transitionGoal(planningGoal, "awaiting_plan_approval", {
    plans: [...options.existingPlans, plan],
    eventWriter: options.eventWriter,
    context: options.context
  });
  const supersededPlans = options.supersedeProposedPlans
    ? options.existingPlans
        .filter((existingPlan) => existingPlan.goalId === planningGoal.id && existingPlan.status === "proposed")
        .map((existingPlan) => ({
          ...existingPlan,
          status: "superseded" as const
        }))
    : [];

  options.eventWriter.append({
    type: options.supersedeProposedPlans ? "plan.regenerated" : "plan.proposed",
    projectId: awaitingGoal.projectId,
    goalId: awaitingGoal.id,
    actor: options.context.actor,
    source: options.context.source,
    payload: {
      planId: plan.id,
      version: plan.version,
      stepIds: steps.map((step) => step.id),
      supersededPlanIds: supersededPlans.map((supersededPlan) => supersededPlan.id)
    }
  });

  return {
    goal: awaitingGoal,
    plan,
    steps,
    supersededPlans
  };
}

function createPlanSteps(plan: Plan, drafts: PlannerStepDraft[], stepIds: string[]): PlanStep[] {
  if (drafts.length === 0) {
    throw new DomainInvariantError("Plan requires at least one step");
  }

  if (drafts.length !== stepIds.length) {
    throw new DomainInvariantError("Plan step ID count must match proposed steps");
  }

  const steps = drafts.map((draft, index) => {
    const dependsOnStepIds = (draft.dependsOnStepIndexes ?? []).map((dependencyIndex) => {
      const dependencyId = stepIds[dependencyIndex];
      if (!dependencyId) {
        throw new DomainInvariantError(`Plan step ${index + 1} depends on an unknown step`);
      }

      return dependencyId;
    });

    return {
      id: requireText(stepIds[index] ?? "", "Plan step ID is required"),
      planId: plan.id,
      index: index + 1,
      title: requireText(draft.title, "Plan step title is required"),
      description: requireText(draft.description, "Plan step description is required"),
      type: requireText(draft.type, "Plan step type is required"),
      priority: draft.priority ?? index + 1,
      dependsOnStepIds,
      acceptanceCriteria: trimList(draft.acceptanceCriteria),
      approvalRequired: draft.approvalRequired ?? false,
      riskLevel: draft.riskLevel ?? "medium",
      targetService: draft.targetService?.trim() || undefined,
      toolRequirements: trimList(draft.toolRequirements ?? []),
      preferredExecutorId: draft.preferredExecutorId?.trim() || undefined
    };
  });

  return validatePlanSteps(plan, steps);
}

function validatePlanSteps(plan: Plan, steps: PlanStep[]): PlanStep[] {
  if (steps.length === 0) {
    throw new DomainInvariantError("Plan requires at least one step");
  }

  const stepIds = new Set<string>();
  for (const step of steps) {
    if (step.planId !== plan.id) {
      throw new DomainInvariantError("Plan step belongs to a different plan");
    }

    if (stepIds.has(step.id)) {
      throw new DomainInvariantError("Plan step IDs must be unique");
    }
    stepIds.add(step.id);

    if (step.acceptanceCriteria.length === 0) {
      throw new DomainInvariantError("Plan step requires acceptance criteria");
    }
  }

  for (const step of steps) {
    for (const dependencyId of step.dependsOnStepIds) {
      if (!stepIds.has(dependencyId)) {
        throw new DomainInvariantError(`Plan step dependency is unknown: ${dependencyId}`);
      }
    }
  }

  return steps.map((step) => ({
    ...step,
    acceptanceCriteria: [...step.acceptanceCriteria],
    dependsOnStepIds: [...step.dependsOnStepIds],
    toolRequirements: [...step.toolRequirements]
  }));
}

function createPlanDecision(input: {
  id: string;
  goal: Goal;
  plan: Plan;
  decisionType: "approve_plan" | "reject_plan";
  answer: string;
  chosenOption: "approve" | "reject";
  actorId: string;
  source: "telegram" | "api" | "agent" | "system";
  createdAt: Date;
}): Decision {
  return {
    id: input.id,
    projectId: input.goal.projectId,
    goalId: input.goal.id,
    decisionType: input.decisionType,
    question: `Review plan version ${input.plan.version}?`,
    answer: input.answer,
    options: ["approve", "reject", "regenerate", "ask why"],
    chosenOption: input.chosenOption,
    actorId: input.actorId,
    source: input.source,
    createdAt: input.createdAt
  };
}

function createIntentBundleSnapshot(goal: Goal, plan: Plan, step: PlanStep): Record<string, JsonValue> {
  return {
    goalId: goal.id,
    planId: plan.id,
    planVersion: plan.version,
    planStepId: step.id,
    normalizedIntent: goal.normalizedIntent ?? null,
    constraints: goal.constraints,
    nonGoals: goal.nonGoals,
    successCriteria: goal.successCriteria,
    stepAcceptanceCriteria: step.acceptanceCriteria
  };
}

function nextPlanVersion(plans: Plan[], goalId: string): number {
  const versions = plans.filter((plan) => plan.goalId === goalId).map((plan) => plan.version);
  return versions.length === 0 ? 1 : Math.max(...versions) + 1;
}

function assertPlanBelongsToGoal(goal: Goal, plan: Plan): void {
  if (plan.goalId !== goal.id) {
    throw new DomainInvariantError("Plan belongs to a different goal");
  }
}

function sourceFromContext(context: LifecycleContext): "telegram" | "api" | "agent" | "system" {
  return context.source === "telegram" || context.source === "api" || context.source === "agent" ? context.source : "system";
}

function isCodingType(type: string): boolean {
  return type === "code" || type === "coding";
}

function requireText(value: string, message: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new DomainInvariantError(message);
  }

  return trimmed;
}

function trimList(values: string[]): string[] {
  return values.map((value) => value.trim()).filter(Boolean);
}
