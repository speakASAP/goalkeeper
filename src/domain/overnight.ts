import type { Blocker, Execution, Executor, Project, RiskLevel, Task } from "./types.js";

export type OvernightMode = "off" | "monitor" | "execute";
export type AutonomousTaskDecisionStatus = "eligible" | "blocked" | "awaiting_owner" | "not_ready";
export type DigestBucketName = "completed" | "failed" | "partial" | "blocked" | "awaitingUser";
export type AgentActivityStatus = "running" | "idle" | "disabled";

export interface OvernightPolicy {
  enabled: boolean;
  mode: OvernightMode;
  maxConcurrentTasks: number;
  maxRiskLevel: RiskLevel;
  requireApprovalForDestructive: boolean;
  requireApprovalForDeployment: boolean;
  allowSelfImprovement: boolean;
}

export interface AutonomousTaskDecision {
  taskId: string;
  status: AutonomousTaskDecisionStatus;
  reason: string;
  requiredGates: string[];
}

export interface OvernightTaskSnapshot {
  task: Task;
  executions?: Execution[];
  blockers?: Blocker[];
}

export interface OvernightDigest {
  projectId: string;
  periodStart: Date;
  periodEnd: Date;
  completed: OvernightDigestItem[];
  failed: OvernightDigestItem[];
  partial: OvernightDigestItem[];
  blocked: OvernightDigestItem[];
  awaitingUser: OvernightDigestItem[];
  blockerGroups: BlockerGroup[];
  validationEvidence: string[];
  summary: string;
}

export interface OvernightDigestItem {
  taskId: string;
  goalId: string;
  title: string;
  status: Task["status"];
  executorId?: string;
  evidence: string[];
  reason?: string;
}

export interface BlockerGroup {
  projectId: string;
  goalId?: string;
  type: Blocker["type"];
  taskIds: string[];
  count: number;
  question?: string;
  reason: string;
  recommendation?: string;
  impact: string;
}

export interface AgentStatusView {
  agentId: string;
  status: AgentActivityStatus;
  runningTaskIds: string[];
  currentStep: string;
  lastUpdate?: string;
}

export interface ExecutorStatusView {
  executorId: string;
  displayName: string;
  kind: Executor["kind"];
  status: AgentActivityStatus;
  capabilities: string[];
  approvalRequired: boolean;
  maxRiskLevel: RiskLevel;
  runningTaskIds: string[];
  lastExecutionSummary?: string;
}

export interface TaskLogEntry {
  at: Date;
  source: "task" | "execution" | "blocker" | "validation";
  status: string;
  summary: string;
}

export interface TaskLogSummary {
  taskId: string;
  goalId: string;
  status: Task["status"];
  entries: TaskLogEntry[];
  artifactRefs: string[];
  validationEvidence: string[];
}

export interface GoalKeeperSelfProjectOptions {
  now: Date;
  localPath: string;
  repoRef?: string;
}

const RISK_RANK: Record<RiskLevel, number> = {
  low: 1,
  medium: 2,
  high: 3
};

export const DEFAULT_OVERNIGHT_POLICY: OvernightPolicy = {
  enabled: false,
  mode: "monitor",
  maxConcurrentTasks: 1,
  maxRiskLevel: "medium",
  requireApprovalForDestructive: true,
  requireApprovalForDeployment: true,
  allowSelfImprovement: true
};

export function evaluateAutonomousTask(input: {
  project: Project;
  policy: OvernightPolicy;
  task: Task;
  runningTaskCount: number;
  executors: Executor[];
}): AutonomousTaskDecision {
  if (!input.policy.enabled || input.policy.mode === "off" || !input.project.overnightModeEnabled) {
    return block(input.task.id, "Overnight mode is disabled", ["overnight_policy"]);
  }

  if (input.project.status !== "active") {
    return block(input.task.id, "Project is not active", ["project_active"]);
  }

  if (input.runningTaskCount >= Math.min(input.policy.maxConcurrentTasks, input.project.concurrencyLimit)) {
    return notReady(input.task.id, "Project concurrency limit has been reached", ["project_concurrency"]);
  }

  if (input.task.status === "awaiting_user" || input.task.status === "pending_approval" || input.task.approvalRequired) {
    return awaiting(input.task.id, "Owner approval or answer is required", ["owner_approval"]);
  }

  if (!["created", "approved", "failed"].includes(input.task.status)) {
    return notReady(input.task.id, `Task status ${input.task.status} is not ready for autonomous execution`, [
      "task_readiness"
    ]);
  }

  const taskRisk = readTaskRisk(input.task);
  if (RISK_RANK[taskRisk] > RISK_RANK[input.policy.maxRiskLevel]) {
    return awaiting(input.task.id, `Task risk ${taskRisk} exceeds overnight policy maximum ${input.policy.maxRiskLevel}`, [
      "risk_approval"
    ]);
  }

  if (requiresDestructiveApproval(input.task) && input.policy.requireApprovalForDestructive) {
    return awaiting(input.task.id, "Destructive task requires owner approval", ["destructive_command_approval"]);
  }

  if (requiresDeploymentApproval(input.task) && input.policy.requireApprovalForDeployment) {
    return awaiting(input.task.id, "Deployment task requires owner approval", ["deployment_approval"]);
  }

  if (isCodingTask(input.task) && !hasPassedCodingIps(input.task)) {
    return block(input.task.id, "Coding task is missing passed IPS gate, context package, or coding prompt", [
      "ips_pre_coding_gate"
    ]);
  }

  if (input.executors.every((executor) => !executor.enabled)) {
    return block(input.task.id, "No enabled executor is available", ["executor_available"]);
  }

  if (input.policy.mode === "monitor") {
    return notReady(input.task.id, "Overnight mode is monitoring only; execution is paused", ["overnight_execute_mode"]);
  }

  return {
    taskId: input.task.id,
    status: "eligible",
    reason: "Task is eligible for bounded overnight execution",
    requiredGates: []
  };
}

export function composeOvernightDigest(input: {
  projectId: string;
  periodStart: Date;
  periodEnd: Date;
  snapshots: OvernightTaskSnapshot[];
}): OvernightDigest {
  const digest: OvernightDigest = {
    projectId: input.projectId,
    periodStart: input.periodStart,
    periodEnd: input.periodEnd,
    completed: [],
    failed: [],
    partial: [],
    blocked: [],
    awaitingUser: [],
    blockerGroups: aggregateBlockers(input.snapshots.flatMap((snapshot) => snapshot.blockers ?? [])),
    validationEvidence: compact(
      input.snapshots.flatMap((snapshot) => [
        ...(snapshot.task.validationResult?.evidence ?? []),
        ...(snapshot.executions ?? []).flatMap((execution) => execution.artifactRefs)
      ])
    ),
    summary: ""
  };

  for (const snapshot of input.snapshots) {
    digest[bucketForTask(snapshot.task)].push(toDigestItem(snapshot));
  }

  digest.summary = [
    `Completed: ${digest.completed.length}`,
    `Failed: ${digest.failed.length}`,
    `Partial: ${digest.partial.length}`,
    `Blocked: ${digest.blocked.length}`,
    `Awaiting owner: ${digest.awaitingUser.length}`
  ].join("; ");

  return digest;
}

export function aggregateBlockers(blockers: Blocker[]): BlockerGroup[] {
  const groups = new Map<string, BlockerGroup>();
  for (const blocker of blockers.filter((item) => item.status === "open")) {
    const key = [blocker.projectId, blocker.goalId ?? "", blocker.type, blocker.question ?? blocker.reason].join(":");
    const existing = groups.get(key);
    if (existing) {
      existing.count += 1;
      if (blocker.taskId) {
        existing.taskIds.push(blocker.taskId);
      }
      continue;
    }

    groups.set(key, {
      projectId: blocker.projectId,
      goalId: blocker.goalId,
      type: blocker.type,
      taskIds: blocker.taskId ? [blocker.taskId] : [],
      count: 1,
      question: blocker.question,
      reason: blocker.reason,
      recommendation: blocker.recommendation,
      impact: blocker.impact
    });
  }

  return [...groups.values()].map((group) => ({
    ...group,
    taskIds: compact(group.taskIds)
  }));
}

export function composeAgentStatus(tasks: Task[], executions: Execution[]): AgentStatusView[] {
  const agentIds = compact(tasks.map((task) => task.assignedAgentId ?? task.selectedExecutorId ?? ""));
  return agentIds.map((agentId) => {
    const agentTasks = tasks.filter((task) => (task.assignedAgentId ?? task.selectedExecutorId) === agentId);
    const runningTasks = agentTasks.filter((task) => ["assigned", "in_progress", "validation"].includes(task.status));
    const latestExecution =
      latestExecutionForTasks(
        executions,
        runningTasks.map((task) => task.id)
      ) ??
      latestExecutionForTasks(
        executions,
        agentTasks.map((task) => task.id)
      );

    return {
      agentId,
      status: runningTasks.length > 0 ? "running" : "idle",
      runningTaskIds: runningTasks.map((task) => task.id),
      currentStep: runningTasks[0]?.blockedReason ?? runningTasks[0]?.type ?? "No active task",
      lastUpdate: latestExecution?.summary
    };
  });
}

export function composeExecutorStatus(executors: Executor[], executions: Execution[]): ExecutorStatusView[] {
  return executors.map((executor) => {
    const executorExecutions = executions.filter((execution) => execution.executorId === executor.id);
    const runningTaskIds = executorExecutions
      .filter((execution) => execution.status === "running" || execution.status === "queued")
      .map((execution) => execution.taskId);
    const latest = latestExecution(executorExecutions);

    return {
      executorId: executor.id,
      displayName: executor.displayName,
      kind: executor.kind,
      status: !executor.enabled ? "disabled" : runningTaskIds.length > 0 ? "running" : "idle",
      capabilities: executor.capabilities,
      approvalRequired: executor.requiresApproval,
      maxRiskLevel: executor.riskLevel,
      runningTaskIds,
      lastExecutionSummary: latest?.summary
    };
  });
}

export function summarizeTaskLog(input: {
  task: Task;
  executions: Execution[];
  blockers?: Blocker[];
  maxEntries?: number;
}): TaskLogSummary {
  const entries: TaskLogEntry[] = [
    {
      at: input.task.createdAt,
      source: "task",
      status: input.task.status,
      summary: input.task.blockedReason ?? `Task ${input.task.type} is ${input.task.status}`
    },
    ...input.executions.map((execution) => ({
      at: execution.endedAt ?? execution.startedAt ?? input.task.createdAt,
      source: "execution" as const,
      status: execution.status,
      summary: summarizeExecutionForLog(execution)
    })),
    ...(input.blockers ?? []).map((blocker) => ({
      at: blocker.createdAt,
      source: "blocker" as const,
      status: blocker.status,
      summary: blocker.question ? `${blocker.reason}: ${blocker.question}` : blocker.reason
    })),
    ...(input.task.validationResult
      ? [
          {
            at: input.task.validationResult.validatedAt,
            source: "validation" as const,
            status: input.task.validationResult.status,
            summary: input.task.validationResult.summary
          }
        ]
      : [])
  ];

  const sorted = entries.sort((left, right) => right.at.getTime() - left.at.getTime());
  return {
    taskId: input.task.id,
    goalId: input.task.goalId,
    status: input.task.status,
    entries: sorted.slice(0, input.maxEntries ?? 5),
    artifactRefs: compact(input.executions.flatMap((execution) => execution.artifactRefs)),
    validationEvidence: compact(input.task.validationResult?.evidence ?? [])
  };
}

export function createGoalKeeperSelfProject(options: GoalKeeperSelfProjectOptions): Project {
  return {
    id: "project-goalkeeper",
    slug: "goalkeeper",
    name: "GoalKeeper",
    description: "GoalKeeper self-improvement project managed through the same IPS-gated workflow.",
    repoRef: options.repoRef ?? "local:goalkeeper",
    localPath: options.localPath,
    preferredExecutors: ["codex-cli"],
    commandPresets: {
      test: "npm test",
      typecheck: "npm run typecheck",
      lint: "npm run lint"
    },
    ipsEnabled: true,
    ipsRoot: options.localPath,
    ipsSettings: {
      requiredChain: "raw_intent -> approved_goal_intent -> approved_plan -> task -> approved_execution_plan -> context_package -> coding_prompt -> validation_report",
      selfImprovementUsesSamePath: true,
      deploymentRequiresOwnerApproval: true
    },
    overnightModeEnabled: false,
    concurrencyLimit: 1,
    status: "active",
    defaultApprovalMode: "manual",
    riskLevel: "medium",
    createdAt: options.now,
    updatedAt: options.now
  };
}

function bucketForTask(task: Task): DigestBucketName {
  if (task.status === "done" && task.validationResult?.status === "passed") {
    return "completed";
  }

  if (task.status === "failed" || task.validationResult?.status === "failed") {
    return "failed";
  }

  if (task.status === "blocked") {
    return "blocked";
  }

  if (task.status === "awaiting_user" || task.status === "pending_approval") {
    return "awaitingUser";
  }

  return "partial";
}

function toDigestItem(snapshot: OvernightTaskSnapshot): OvernightDigestItem {
  const latest = latestExecution(snapshot.executions ?? []);
  return {
    taskId: snapshot.task.id,
    goalId: snapshot.task.goalId,
    title: readTaskTitle(snapshot.task),
    status: snapshot.task.status,
    executorId: snapshot.task.selectedExecutorId ?? latest?.executorId,
    evidence: compact([...(snapshot.task.validationResult?.evidence ?? []), latest?.summary ?? ""]),
    reason: snapshot.task.blockedReason ?? snapshot.blockers?.find((blocker) => blocker.status === "open")?.reason
  };
}

function hasPassedCodingIps(task: Task): boolean {
  return (
    task.ipsGateStatus === "passed" &&
    Boolean(task.contextPackageId) &&
    Boolean(task.codingPromptId) &&
    task.ipsArtifactIds.length > 0
  );
}

function isCodingTask(task: Task): boolean {
  return ["code", "coding", "implementation"].includes(task.type) || task.payload.requiresCoding === true;
}

function requiresDeploymentApproval(task: Task): boolean {
  return task.type === "deployment" || task.payload.requiresDeployment === true;
}

function requiresDestructiveApproval(task: Task): boolean {
  return task.payload.destructive === true || task.payload.requiresDestructiveApproval === true;
}

function readTaskRisk(task: Task): RiskLevel {
  const risk = task.payload.riskLevel;
  return risk === "low" || risk === "medium" || risk === "high" ? risk : "medium";
}

function readTaskTitle(task: Task): string {
  return typeof task.payload.title === "string" && task.payload.title.trim() ? task.payload.title.trim() : task.id;
}

function latestExecutionForTasks(executions: Execution[], taskIds: string[]): Execution | undefined {
  return latestExecution(executions.filter((execution) => taskIds.includes(execution.taskId)));
}

function latestExecution(executions: Execution[]): Execution | undefined {
  return [...executions].sort((left, right) => executionTime(right) - executionTime(left))[0];
}

function executionTime(execution: Execution): number {
  return (execution.endedAt ?? execution.startedAt ?? new Date(0)).getTime();
}

function summarizeExecutionForLog(execution: Execution): string {
  return compact([execution.summary ?? "", execution.artifactRefs.length > 0 ? `Artifacts: ${execution.artifactRefs.join(", ")}` : ""])[0] ?? `Execution ${execution.id}`;
}

function block(taskId: string, reason: string, requiredGates: string[]): AutonomousTaskDecision {
  return { taskId, status: "blocked", reason, requiredGates };
}

function awaiting(taskId: string, reason: string, requiredGates: string[]): AutonomousTaskDecision {
  return { taskId, status: "awaiting_owner", reason, requiredGates };
}

function notReady(taskId: string, reason: string, requiredGates: string[]): AutonomousTaskDecision {
  return { taskId, status: "not_ready", reason, requiredGates };
}

function compact(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}
