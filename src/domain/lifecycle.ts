import type { EventWriter } from "./events.js";
import type {
  Blocker,
  Decision,
  Goal,
  GoalStatus,
  IntentRecord,
  IpsArtifact,
  Plan,
  Task,
  TaskStatus,
  TaskValidationResult
} from "./types.js";

export class DomainInvariantError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DomainInvariantError";
  }
}

export interface LifecycleContext {
  actor: string;
  source: string;
  now?: Date;
}

export function updateGoalRawIntent(): never {
  throw new DomainInvariantError("Raw goal intent is immutable");
}

export function updateIntentRecordContent(record: IntentRecord, content: string): IntentRecord {
  if (record.kind === "raw") {
    throw new DomainInvariantError("Raw intent records are immutable; create a correction record instead");
  }

  return {
    ...record,
    content
  };
}

export function createCorrectionIntentRecord(input: Omit<IntentRecord, "kind">): IntentRecord {
  return {
    ...input,
    kind: "correction"
  };
}

export function transitionGoal(
  goal: Goal,
  targetStatus: GoalStatus,
  options: {
    plans?: Plan[];
    tasks?: Task[];
    eventWriter: EventWriter;
    context: LifecycleContext;
  }
): Goal {
  assertGoalTransition(goal, targetStatus, options.plans ?? [], options.tasks ?? []);

  const now = options.context.now ?? new Date();
  const updated: Goal = {
    ...goal,
    status: targetStatus,
    updatedAt: now,
    completedAt: targetStatus === "completed" ? now : goal.completedAt
  };

  options.eventWriter.append({
    type: "goal.status_changed",
    projectId: goal.projectId,
    goalId: goal.id,
    actor: options.context.actor,
    source: options.context.source,
    payload: {
      from: goal.status,
      to: targetStatus
    }
  });

  return updated;
}

function assertGoalTransition(goal: Goal, targetStatus: GoalStatus, plans: Plan[], tasks: Task[]): void {
  if (goal.status === "cancelled" || goal.status === "completed") {
    throw new DomainInvariantError(`Goal ${goal.id} is terminal and cannot transition to ${targetStatus}`);
  }

  if (targetStatus === "planning" && goal.status !== "intent_approved") {
    throw new DomainInvariantError("Goal cannot move to planning before intent approval");
  }

  if (targetStatus === "active" && !plans.some((plan) => plan.goalId === goal.id && plan.status === "approved")) {
    throw new DomainInvariantError("Goal cannot become active before an approved plan exists");
  }

  if (targetStatus === "completed") {
    const requiredTasks = tasks.filter((task) => task.goalId === goal.id && task.status !== "cancelled");
    if (requiredTasks.length === 0) {
      throw new DomainInvariantError("Goal cannot complete without required tasks");
    }

    if (requiredTasks.some((task) => task.status !== "done")) {
      throw new DomainInvariantError("Goal cannot complete while required tasks are open, failed, or blocked");
    }
  }
}

export function assertSingleApprovedPlan(goalId: string, plans: Plan[]): void {
  const approvedCount = plans.filter((plan) => plan.goalId === goalId && plan.status === "approved").length;
  if (approvedCount > 1) {
    throw new DomainInvariantError("Only one approved plan can be active for a goal");
  }
}

export function approveTask(task: Task, eventWriter: EventWriter, context: LifecycleContext): Task {
  if (task.status !== "pending_approval" && task.status !== "created") {
    throw new DomainInvariantError("Only created or pending approval tasks can be approved");
  }

  return transitionTask(task, "approved", eventWriter, context);
}

export function assignTaskExecutor(
  task: Task,
  selectedExecutorId: string,
  routingReason: string,
  eventWriter: EventWriter,
  context: LifecycleContext
): Task {
  if (!selectedExecutorId || !routingReason) {
    throw new DomainInvariantError("Task assignment requires executor and routing reason");
  }

  const assigned: Task = {
    ...task,
    selectedExecutorId,
    routingReason,
    status: "assigned"
  };

  eventWriter.append({
    type: "task.executor_assigned",
    projectId: task.projectId,
    goalId: task.goalId,
    taskId: task.id,
    actor: context.actor,
    source: context.source,
    payload: {
      selectedExecutorId,
      routingReason
    }
  });

  return assigned;
}

export function startTask(
  task: Task,
  dependencies: Task[],
  eventWriter: EventWriter,
  context: LifecycleContext
): Task {
  if (!task.selectedExecutorId && !task.assignedAgentId) {
    throw new DomainInvariantError("Task cannot start without an executor or internal worker assignment");
  }

  const dependencyMap = new Map(dependencies.map((dependency) => [dependency.id, dependency]));
  for (const dependencyId of task.dependsOnTaskIds) {
    const dependency = dependencyMap.get(dependencyId);
    if (!dependency || dependency.status !== "done") {
      throw new DomainInvariantError(`Task dependency is not terminal-success: ${dependencyId}`);
    }
  }

  if (isCodingTask(task)) {
    assertCodingTaskExecutable(task);
  }

  return transitionTask(
    {
      ...task,
      startedAt: context.now ?? new Date(),
      attempt: task.attempt + 1
    },
    "in_progress",
    eventWriter,
    context
  );
}

export function recordTaskValidation(
  task: Task,
  validationResult: TaskValidationResult,
  eventWriter: EventWriter,
  context: LifecycleContext
): Task {
  const updated = transitionTask(
    {
      ...task,
      validationResult
    },
    "validation",
    eventWriter,
    context
  );

  eventWriter.append({
    type: "task.validation_recorded",
    projectId: task.projectId,
    goalId: task.goalId,
    taskId: task.id,
    actor: context.actor,
    source: context.source,
    payload: {
      status: validationResult.status,
      summary: validationResult.summary
    }
  });

  return updated;
}

export function completeTask(task: Task, eventWriter: EventWriter, context: LifecycleContext): Task {
  if (task.validationResult?.status !== "passed") {
    throw new DomainInvariantError("Task done requires validation pass");
  }

  if (isCodingTask(task) && !task.ipsArtifactIds.length) {
    throw new DomainInvariantError("Coding task completion requires IPS artifact references");
  }

  return transitionTask(
    {
      ...task,
      completedAt: context.now ?? new Date()
    },
    "done",
    eventWriter,
    context
  );
}

export function rejectTask(
  task: Task,
  reason: string,
  eventWriter: EventWriter,
  context: LifecycleContext
): Task {
  if (!reason.trim()) {
    throw new DomainInvariantError("Task rejection requires a reason");
  }

  return transitionTask(
    {
      ...task,
      blockedReason: reason
    },
    "cancelled",
    eventWriter,
    context
  );
}

export function blockCodingTaskForIpsFailure(
  task: Task,
  blocker: Blocker,
  eventWriter: EventWriter,
  context: LifecycleContext
): Task {
  if (blocker.type !== "ips_gate_failed" || blocker.status !== "open") {
    throw new DomainInvariantError("IPS gate failure must create an open IPS blocker");
  }

  return transitionTask(
    {
      ...task,
      ipsGateStatus: "failed",
      ipsBlockerId: blocker.id,
      blockedReason: blocker.reason
    },
    "blocked",
    eventWriter,
    context
  );
}

export function answerBlockerWithDecision(blocker: Blocker, decision: Decision): Blocker {
  if (blocker.status !== "open") {
    throw new DomainInvariantError("Only open blockers can be answered");
  }

  if (!decision.answer.trim()) {
    throw new DomainInvariantError("Blocker answers must create a decision with an answer");
  }

  return {
    ...blocker,
    status: "answered",
    resolvedAt: decision.createdAt
  };
}

export function assertCodingTaskExecutable(task: Task, artifacts: IpsArtifact[] = []): void {
  if (!isCodingTask(task)) {
    return;
  }

  if (task.ipsGateStatus !== "passed") {
    throw new DomainInvariantError("Coding task requires passed IPS pre-coding gate");
  }

  if (!task.contextPackageId) {
    throw new DomainInvariantError("Coding task requires a context package");
  }

  if (!task.codingPromptId) {
    throw new DomainInvariantError("Coding task requires a coding prompt");
  }

  if (task.ipsArtifactIds.length === 0) {
    throw new DomainInvariantError("Coding task requires IPS artifact references");
  }

  if (task.acceptanceCriteria.length === 0) {
    throw new DomainInvariantError("Coding task requires explicit validation criteria");
  }

  const linkedArtifacts = artifacts.filter((artifact) => task.ipsArtifactIds.includes(artifact.id));
  if (linkedArtifacts.some((artifact) => artifact.status === "draft" || artifact.missingMarkers.length > 0)) {
    throw new DomainInvariantError("Draft or incomplete IPS artifacts cannot authorize coding");
  }
}

function transitionTask(
  task: Task,
  targetStatus: TaskStatus,
  eventWriter: EventWriter,
  context: LifecycleContext
): Task {
  const updated: Task = {
    ...task,
    status: targetStatus
  };

  eventWriter.append({
    type: "task.status_changed",
    projectId: task.projectId,
    goalId: task.goalId,
    taskId: task.id,
    actor: context.actor,
    source: context.source,
    payload: {
      from: task.status,
      to: targetStatus
    }
  });

  return updated;
}

function isCodingTask(task: Task): boolean {
  return task.type === "code" || task.type === "coding";
}
