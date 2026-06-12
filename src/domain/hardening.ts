import type { JsonValue, RiskLevel } from "./types.js";

export type HardeningActionKind =
  | "telegram_callback"
  | "task_action"
  | "admin_command"
  | "backup_export"
  | "smoke_test"
  | "deployment";

export type IdempotencyRecordStatus = "started" | "completed" | "failed";
export type IdempotencyDecisionStatus = "new" | "duplicate" | "retryable";
export type ConfirmationDecisionStatus = "allowed" | "confirmation_required" | "owner_approval_required";
export type DeploymentReadinessStatus = "ready_for_owner_approval" | "blocked";
export type SmokeTestStatus = "passed" | "failed";
export type StructuredLogLevel = "debug" | "info" | "warn" | "error";

export interface IdempotencyAction {
  key: string;
  kind: HardeningActionKind;
  actorId: string;
  scope: string;
  requestedAt: Date;
}

export interface IdempotencyRecord {
  key: string;
  kind: HardeningActionKind;
  actorId: string;
  scope: string;
  status: IdempotencyRecordStatus;
  resultRef?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IdempotencyDecision {
  key: string;
  status: IdempotencyDecisionStatus;
  shouldExecute: boolean;
  reason: string;
  existingResultRef?: string;
}

export interface RateLimitPolicy {
  maxEvents: number;
  windowMs: number;
}

export interface RateLimitEvent {
  actorId: string;
  scope: string;
  kind: HardeningActionKind;
  occurredAt: Date;
}

export interface RateLimitDecision {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  reason: string;
}

export interface ConfirmationInput {
  actionId: string;
  kind: HardeningActionKind;
  actorId: string;
  target: string;
  riskLevel: RiskLevel;
  destructive?: boolean;
  deployment?: boolean;
  confirmedActionIds: string[];
  ownerApprovedDeployment?: boolean;
}

export interface ConfirmationDecision {
  actionId: string;
  status: ConfirmationDecisionStatus;
  reason: string;
  requiredConfirmation?: string;
  approvalBoundary?: string;
}

export interface AuditJourneyInput {
  goalId: string;
  rawIntentRecordIds: string[];
  approvedIntentRecordIds: string[];
  planIds: string[];
  taskIds: string[];
  executionIds: string[];
  validationReportIds: string[];
  reportIds: string[];
}

export interface AuditJourneyAssessment {
  goalId: string;
  complete: boolean;
  missing: string[];
  evidence: string[];
}

export interface StructuredLogEntry {
  level: StructuredLogLevel;
  event: string;
  message: string;
  at: Date;
  actorId?: string;
  correlationId?: string;
  fields: Record<string, JsonValue>;
}

export interface BackupExportManifest {
  exportId: string;
  projectId: string;
  createdAt: Date;
  redacted: true;
  goals: string[];
  tasks: string[];
  executions: string[];
  artifacts: string[];
  decisions: string[];
  events: string[];
  retentionNote: string;
  evidence: string[];
}

export interface DeploymentReadinessInput {
  validationCommands: ValidationCommandResult[];
  deploymentApprovalGranted: boolean;
  rollbackPlanRef?: string;
  smokeTestRef?: string;
  unresolvedBlockers: string[];
  productionTarget: string;
}

export interface ValidationCommandResult {
  command: string;
  status: "passed" | "failed";
  summary: string;
}

export interface DeploymentReadinessSummary {
  status: DeploymentReadinessStatus;
  productionTarget: string;
  ownerApprovalRequired: boolean;
  rollbackPlanRef?: string;
  smokeTestRef?: string;
  passedCommands: string[];
  failedCommands: string[];
  blockers: string[];
  recommendation: string;
}

export interface SmokeTestResultInput {
  targetUrl: string;
  healthStatus?: number;
  responseService?: string;
  responseStatus?: string;
  error?: string;
  checkedAt: Date;
}

export interface SmokeTestSummary {
  targetUrl: string;
  status: SmokeTestStatus;
  checkedAt: Date;
  evidence: string[];
  recommendation: string;
}

const SECRET_KEY_PATTERN = /(token|secret|password|credential|authorization|api[_-]?key|database[_-]?url|bot[_-]?token)/iu;
const SECRET_VALUE_PATTERN = /(bearer\s+[a-z0-9._-]+|xox[baprs]-[a-z0-9-]+|sk-[a-z0-9_-]{8,})/iu;
const REDACTED = "[REDACTED]";

export function evaluateIdempotency(action: IdempotencyAction, records: IdempotencyRecord[]): IdempotencyDecision {
  const existing = records.find(
    (record) =>
      record.key === action.key &&
      record.kind === action.kind &&
      record.actorId === action.actorId &&
      record.scope === action.scope
  );

  if (!existing) {
    return {
      key: action.key,
      status: "new",
      shouldExecute: true,
      reason: "No matching idempotency record exists."
    };
  }

  if (existing.status === "failed") {
    return {
      key: action.key,
      status: "retryable",
      shouldExecute: true,
      reason: "Previous matching action failed and may be retried.",
      existingResultRef: existing.resultRef
    };
  }

  return {
    key: action.key,
    status: "duplicate",
    shouldExecute: false,
    reason: `Matching action is already ${existing.status}; side effects must not run again.`,
    existingResultRef: existing.resultRef
  };
}

export function evaluateRateLimit(input: {
  actorId: string;
  scope: string;
  kind: HardeningActionKind;
  now: Date;
  policy: RateLimitPolicy;
  events: RateLimitEvent[];
}): RateLimitDecision {
  const windowStart = input.now.getTime() - input.policy.windowMs;
  const matchingEvents = input.events
    .filter(
      (event) =>
        event.actorId === input.actorId &&
        event.scope === input.scope &&
        event.kind === input.kind &&
        event.occurredAt.getTime() > windowStart &&
        event.occurredAt.getTime() <= input.now.getTime()
    )
    .sort((left, right) => left.occurredAt.getTime() - right.occurredAt.getTime());

  const remaining = Math.max(input.policy.maxEvents - matchingEvents.length, 0);
  const resetAt = matchingEvents[0]
    ? new Date(matchingEvents[0].occurredAt.getTime() + input.policy.windowMs)
    : new Date(input.now.getTime() + input.policy.windowMs);

  if (matchingEvents.length >= input.policy.maxEvents) {
    return {
      allowed: false,
      remaining: 0,
      resetAt,
      reason: `Rate limit reached for ${input.kind} in ${input.scope}.`
    };
  }

  return {
    allowed: true,
    remaining: remaining - 1,
    resetAt,
    reason: "Rate limit allows this action."
  };
}

export function evaluateConfirmation(input: ConfirmationInput): ConfirmationDecision {
  if (input.deployment && !input.ownerApprovedDeployment) {
    return {
      actionId: input.actionId,
      status: "owner_approval_required",
      reason: "Production deployment requires explicit owner approval.",
      approvalBoundary: "production_deployment"
    };
  }

  const requiresConfirmation = input.destructive === true || input.riskLevel === "high" || input.kind === "admin_command";
  if (requiresConfirmation && !input.confirmedActionIds.includes(input.actionId)) {
    return {
      actionId: input.actionId,
      status: "confirmation_required",
      reason: "High-risk, destructive, or admin action requires confirmation.",
      requiredConfirmation: `confirm:${input.actionId}`
    };
  }

  return {
    actionId: input.actionId,
    status: "allowed",
    reason: "Action may proceed within approved hardening policy."
  };
}

export function assessAuditJourney(input: AuditJourneyInput): AuditJourneyAssessment {
  const required: Array<[string, string[]]> = [
    ["raw intent", input.rawIntentRecordIds],
    ["approved intent", input.approvedIntentRecordIds],
    ["approved plan", input.planIds],
    ["tasks", input.taskIds],
    ["executions", input.executionIds],
    ["validation reports", input.validationReportIds],
    ["completion reports", input.reportIds]
  ];
  const missing = required.filter(([, values]) => values.length === 0).map(([label]) => label);

  return {
    goalId: input.goalId,
    complete: missing.length === 0,
    missing,
    evidence: required.flatMap(([label, values]) => values.map((value) => `${label}: ${value}`))
  };
}

export function createStructuredLog(input: Omit<StructuredLogEntry, "fields"> & { fields: Record<string, JsonValue> }): StructuredLogEntry {
  return {
    ...input,
    fields: redactJsonObject(input.fields)
  };
}

export function redactJsonValue(value: JsonValue, key = ""): JsonValue {
  if (SECRET_KEY_PATTERN.test(key)) {
    return REDACTED;
  }

  if (typeof value === "string") {
    return SECRET_VALUE_PATTERN.test(value) ? REDACTED : value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => redactJsonValue(item));
  }

  if (value && typeof value === "object") {
    return redactJsonObject(value);
  }

  return value;
}

export function createBackupExportManifest(input: {
  exportId: string;
  projectId: string;
  createdAt: Date;
  goals: string[];
  tasks: string[];
  executions: string[];
  artifacts: string[];
  decisions: string[];
  events: string[];
}): BackupExportManifest {
  const evidence = [
    `${input.goals.length} goals`,
    `${input.tasks.length} tasks`,
    `${input.executions.length} executions`,
    `${input.artifacts.length} artifacts`,
    `${input.decisions.length} decisions`,
    `${input.events.length} events`
  ];

  return {
    exportId: input.exportId,
    projectId: input.projectId,
    createdAt: input.createdAt,
    redacted: true,
    goals: compact(input.goals),
    tasks: compact(input.tasks),
    executions: compact(input.executions),
    artifacts: compact(input.artifacts),
    decisions: compact(input.decisions),
    events: compact(input.events),
    retentionNote: "Export manifest contains references and redacted summaries only; secrets and raw production data are excluded.",
    evidence
  };
}

export function summarizeDeploymentReadiness(input: DeploymentReadinessInput): DeploymentReadinessSummary {
  const failedCommands = input.validationCommands
    .filter((command) => command.status === "failed")
    .map((command) => command.command);
  const passedCommands = input.validationCommands
    .filter((command) => command.status === "passed")
    .map((command) => command.command);
  const blockers = [
    ...input.unresolvedBlockers,
    ...failedCommands.map((command) => `Validation failed: ${command}`),
    input.rollbackPlanRef ? "" : "Rollback plan is missing.",
    input.smokeTestRef ? "" : "Smoke test evidence is missing."
  ].filter(Boolean);

  const readyExceptApproval = blockers.length === 0;

  return {
    status: readyExceptApproval ? "ready_for_owner_approval" : "blocked",
    productionTarget: input.productionTarget,
    ownerApprovalRequired: !input.deploymentApprovalGranted,
    rollbackPlanRef: input.rollbackPlanRef,
    smokeTestRef: input.smokeTestRef,
    passedCommands,
    failedCommands,
    blockers,
    recommendation: readyExceptApproval
      ? "Review readiness evidence and request explicit owner approval before production deployment."
      : "Resolve blockers before asking for production deployment approval."
  };
}

export function summarizeSmokeTest(input: SmokeTestResultInput): SmokeTestSummary {
  const passed = input.healthStatus === 200 && input.responseService === "goalkeeper" && input.responseStatus === "ok";

  return {
    targetUrl: input.targetUrl,
    status: passed ? "passed" : "failed",
    checkedAt: input.checkedAt,
    evidence: compact([
      input.healthStatus ? `HTTP ${input.healthStatus}` : "",
      input.responseService ? `service=${input.responseService}` : "",
      input.responseStatus ? `status=${input.responseStatus}` : "",
      input.error ? `error=${input.error}` : ""
    ]),
    recommendation: passed
      ? "Health endpoint is reachable and reports GoalKeeper ok."
      : "Do not deploy or promote until the health endpoint smoke test passes."
  };
}

function redactJsonObject(value: { [key: string]: JsonValue }): Record<string, JsonValue> {
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, redactJsonValue(item, key)]));
}

function compact(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}
