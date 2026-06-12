export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export type ProjectStatus = "active" | "paused" | "completed" | "archived";
export type ApprovalMode = "manual" | "semi_auto";
export type RiskLevel = "low" | "medium" | "high";

export interface Project {
  id: string;
  slug: string;
  name: string;
  description?: string;
  repoRef?: string;
  localPath?: string;
  productionUrl?: string;
  stagingUrl?: string;
  preferredExecutors: string[];
  commandPresets: Record<string, string>;
  ipsEnabled: boolean;
  ipsRoot?: string;
  ipsSettings: Record<string, JsonValue>;
  overnightModeEnabled: boolean;
  concurrencyLimit: number;
  status: ProjectStatus;
  defaultApprovalMode: ApprovalMode;
  riskLevel: RiskLevel;
  createdAt: Date;
  updatedAt: Date;
}

export type GoalStatus =
  | "draft"
  | "clarifying"
  | "intent_ready"
  | "intent_approved"
  | "planning"
  | "awaiting_plan_approval"
  | "active"
  | "blocked"
  | "completed"
  | "cancelled";

export interface Goal {
  id: string;
  projectId: string;
  title: string;
  readonly rawIntent: string;
  normalizedIntent?: string;
  status: GoalStatus;
  priority: number;
  successCriteria: string[];
  constraints: string[];
  nonGoals: string[];
  assumptions: string[];
  completionPct: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export type IntentRecordKind =
  | "raw"
  | "summary"
  | "constraint"
  | "decision"
  | "assumption"
  | "correction"
  | "retrospective";

export type IntentRecordSource = "telegram" | "api" | "agent" | "system";

export interface IntentRecord {
  id: string;
  goalId: string;
  kind: IntentRecordKind;
  content: string;
  source: IntentRecordSource;
  actorId: string;
  confidence?: number;
  createdAt: Date;
}

export type PlanStatus = "proposed" | "approved" | "rejected" | "superseded";

export interface Plan {
  id: string;
  goalId: string;
  version: number;
  status: PlanStatus;
  summary: string;
  createdByAgent: string;
  createdAt: Date;
  approvedAt?: Date;
  approvedBy?: string;
}

export interface PlanStep {
  id: string;
  planId: string;
  index: number;
  title: string;
  description: string;
  type: string;
  priority: number;
  dependsOnStepIds: string[];
  acceptanceCriteria: string[];
  approvalRequired: boolean;
  riskLevel: RiskLevel;
  targetService?: string;
  toolRequirements: string[];
  preferredExecutorId?: string;
}

export type TaskStatus =
  | "created"
  | "pending_approval"
  | "approved"
  | "assigned"
  | "in_progress"
  | "awaiting_user"
  | "validation"
  | "done"
  | "failed"
  | "blocked"
  | "cancelled";

export type IpsGateStatus = "not_required" | "pending" | "passed" | "failed" | "blocked";

export interface TaskValidationResult {
  status: "passed" | "failed";
  summary: string;
  evidence: string[];
  validatedAt: Date;
}

export interface Task {
  id: string;
  projectId: string;
  goalId: string;
  planStepId: string;
  parentTaskId?: string;
  type: string;
  status: TaskStatus;
  priority: number;
  payload: Record<string, JsonValue>;
  acceptanceCriteria: string[];
  dependsOnTaskIds: string[];
  approvalRequired: boolean;
  idempotencyKey: string;
  assignedAgentId?: string;
  selectedExecutorId?: string;
  routingReason?: string;
  ipsGateStatus: IpsGateStatus;
  contextPackageId?: string;
  codingPromptId?: string;
  ipsArtifactIds: string[];
  intentBundleSnapshot?: Record<string, JsonValue>;
  ipsBlockerId?: string;
  attempt: number;
  maxAttempts: number;
  output?: Record<string, JsonValue>;
  validationResult?: TaskValidationResult;
  blockedReason?: string;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

export type ExecutorKind = "cli" | "mcp" | "http" | "internal";
export type ExecutionStatus = "queued" | "running" | "succeeded" | "failed" | "cancelled" | "timed_out";

export interface Executor {
  id: string;
  kind: ExecutorKind;
  displayName: string;
  enabled: boolean;
  capabilities: string[];
  allowedProjectRoots: string[];
  requiresApproval: boolean;
  riskLevel: RiskLevel;
  commandTemplate?: string;
  timeoutSeconds: number;
  maxRetries: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Execution {
  id: string;
  taskId: string;
  executorId: string;
  executorKind: ExecutorKind;
  command?: string;
  cwd?: string;
  status: ExecutionStatus;
  startedAt?: Date;
  endedAt?: Date;
  durationMs?: number;
  exitCode?: number;
  stdoutRef?: string;
  stderrRef?: string;
  artifactRefs: string[];
  tokenUsage?: Record<string, JsonValue>;
  costEstimate?: number;
  summary?: string;
}

export type IpsArtifactKind =
  | "goal_impact"
  | "task_doc"
  | "execution_plan"
  | "context_package"
  | "coding_prompt"
  | "validation_report"
  | "audit_report";

export type IpsArtifactStatus = "draft" | "approved" | "used" | "obsolete" | "failed";

export interface IpsArtifact {
  id: string;
  projectId: string;
  goalId: string;
  taskId?: string;
  kind: IpsArtifactKind;
  path: string;
  status: IpsArtifactStatus;
  approvedBy?: string;
  approvedAt?: Date;
  source: string;
  summary: string;
  missingMarkers: string[];
  upstreamArtifactIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

export type BlockerType =
  | "needs_user_answer"
  | "ips_gate_failed"
  | "approval_required"
  | "executor_failed"
  | "validation_failed"
  | "deployment_approval_required";

export type BlockerStatus = "open" | "answered" | "resolved" | "cancelled";

export interface Blocker {
  id: string;
  projectId: string;
  goalId?: string;
  taskId?: string;
  type: BlockerType;
  question?: string;
  reason: string;
  options: string[];
  recommendation?: string;
  impact: string;
  status: BlockerStatus;
  createdAt: Date;
  resolvedAt?: Date;
}

export interface OvernightReport {
  id: string;
  projectId: string;
  periodStart: Date;
  periodEnd: Date;
  completedTasks: string[];
  failedTasks: string[];
  blockedTasks: string[];
  partialTasks: string[];
  questionsForOwner: string[];
  validationEvidence: string[];
  summary: string;
  createdAt: Date;
}

export interface Decision {
  id: string;
  projectId: string;
  goalId?: string;
  taskId?: string;
  decisionType: string;
  question?: string;
  answer: string;
  options: string[];
  chosenOption?: string;
  actorId: string;
  source: IntentRecordSource;
  createdAt: Date;
}

export interface DomainEvent {
  id: string;
  type: string;
  projectId?: string;
  goalId?: string;
  taskId?: string;
  actor: string;
  source: string;
  payload: Record<string, JsonValue>;
  createdAt: Date;
}
