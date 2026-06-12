import { spawn } from "node:child_process";
import path from "node:path";
import { DomainInvariantError } from "./lifecycle.js";
import type { Blocker, Execution, Executor, ExecutorKind, ExecutionStatus, JsonValue, RiskLevel, Task } from "./types.js";

export type RoutingStatus = "selected" | "blocked";
export type WorkerReadyStatus = "ready" | "blocked";

export interface CapabilityMatch {
  executor: Executor;
  eligible: boolean;
  matchedCapabilities: string[];
  missingCapabilities: string[];
  reasons: string[];
  approvalRequired: boolean;
}

export interface RoutingDecision {
  status: RoutingStatus;
  taskId: string;
  selectedExecutor?: Executor;
  selectedExecutorId?: string;
  reason: string;
  fallbackExecutorIds: string[];
  approvalRequired: boolean;
  requiredApprovalGates: string[];
}

export interface RouteTaskOptions {
  task: Task;
  executors: Executor[];
  projectRoot: string;
  requiredCapabilities?: string[];
  preferredExecutorIds?: string[];
  riskLevel?: RiskLevel;
}

export interface ReadyTaskSelection {
  ready: Task[];
  blocked: Array<{
    task: Task;
    reason: string;
  }>;
}

export interface CliCommand {
  executable: string;
  args?: string[];
  cwd: string;
  env?: Record<string, string | undefined>;
  timeoutMs?: number;
}

export interface CliRunOptions {
  executionId: string;
  task: Task;
  executor: Executor;
  command: CliCommand;
  now?: Date;
  maxSummaryBytes?: number;
}

export interface CliRunResult {
  execution: Execution;
  stdoutSummary: string;
  stderrSummary: string;
  timedOut: boolean;
}

export interface ExecutorQuestionInput {
  id: string;
  projectId: string;
  goalId?: string;
  taskId?: string;
  question: string;
  reason: string;
  options: string[];
  recommendation?: string;
  impact: string;
  now: Date;
}

export interface ExecutorAdapterRunResult {
  status: "succeeded" | "failed" | "timed_out" | "awaiting_user";
  execution?: Execution;
  blocker?: Blocker;
}

export interface ExecutorAdapter {
  readonly id: string;
  readonly kind: ExecutorKind;
  readonly capabilities: string[];
  canRun(task: Task, context: RouteTaskOptions): Promise<CapabilityMatch> | CapabilityMatch;
  run(task: Task, context: Record<string, JsonValue>): Promise<ExecutorAdapterRunResult>;
}

export interface McpToolCall {
  toolName: string;
  arguments: Record<string, JsonValue>;
  timeoutMs?: number;
}

export interface McpExecutorAdapter extends ExecutorAdapter {
  readonly kind: "mcp";
  callTool(call: McpToolCall): Promise<ExecutorAdapterRunResult>;
}

const RISK_RANK: Record<RiskLevel, number> = {
  low: 1,
  medium: 2,
  high: 3
};

const DEFAULT_SUMMARY_BYTES = 4_000;
const SECRET_PATTERNS = [
  /\b(Bearer\s+)[A-Za-z0-9._~+/=-]+/gi,
  /\b((?:api[_-]?key|token|secret|password|passwd|pwd|telegram_bot_token)\s*[=:]\s*)("[^"]*"|'[^']*'|[^\s&]+)/gi,
  /\b((?:API[_-]?KEY|TOKEN|SECRET|PASSWORD|PASSWD|PWD|TELEGRAM_BOT_TOKEN)\s*[=:]\s*)("[^"]*"|'[^']*'|[^\s&]+)/g
];

export function matchExecutor(options: {
  executor: Executor;
  projectRoot: string;
  requiredCapabilities: string[];
  riskLevel: RiskLevel;
}): CapabilityMatch {
  const reasons: string[] = [];
  const missingCapabilities = options.requiredCapabilities.filter(
    (capability) => !options.executor.capabilities.includes(capability)
  );
  const matchedCapabilities = options.requiredCapabilities.filter((capability) =>
    options.executor.capabilities.includes(capability)
  );

  if (!options.executor.enabled) {
    reasons.push("Executor is disabled");
  }

  if (missingCapabilities.length > 0) {
    reasons.push(`Missing capabilities: ${missingCapabilities.join(", ")}`);
  }

  if (!isProjectRootAllowed(options.projectRoot, options.executor.allowedProjectRoots)) {
    reasons.push("Project root is not allowed for this executor");
  }

  if (RISK_RANK[options.riskLevel] > RISK_RANK[options.executor.riskLevel]) {
    reasons.push(`Task risk ${options.riskLevel} exceeds executor maximum ${options.executor.riskLevel}`);
  }

  return {
    executor: options.executor,
    eligible: reasons.length === 0,
    matchedCapabilities,
    missingCapabilities,
    reasons,
    approvalRequired: options.executor.requiresApproval
  };
}

export function routeTaskForExecution(options: RouteTaskOptions): RoutingDecision {
  const projectRoot = requireText(options.projectRoot, "Project root is required for routing");
  const requiredCapabilities = normalizeCapabilities(
    options.requiredCapabilities ?? inferRequiredCapabilities(options.task)
  );
  const riskLevel = options.riskLevel ?? inferTaskRisk(options.task);

  const ipsBlockReason = codingIpsBlockReason(options.task);
  if (ipsBlockReason) {
    return {
      status: "blocked",
      taskId: options.task.id,
      reason: ipsBlockReason,
      fallbackExecutorIds: [],
      approvalRequired: false,
      requiredApprovalGates: ["ips_pre_coding_gate"]
    };
  }

  const matches = options.executors.map((executor) =>
    matchExecutor({
      executor,
      projectRoot,
      requiredCapabilities,
      riskLevel
    })
  );
  const eligible = sortEligibleMatches(matches, options.preferredExecutorIds ?? []);
  const fallbackExecutorIds = eligible.slice(1).map((match) => match.executor.id);

  if (eligible.length === 0) {
    return {
      status: "blocked",
      taskId: options.task.id,
      reason: summarizeMatchFailures(matches),
      fallbackExecutorIds: [],
      approvalRequired: false,
      requiredApprovalGates: []
    };
  }

  const selected = eligible[0];
  const reason = [
    `Selected ${selected.executor.id}`,
    `matched capabilities: ${selected.matchedCapabilities.join(", ") || "none required"}`,
    `project root authorized: ${projectRoot}`,
    `risk accepted: ${riskLevel}`
  ].join("; ");

  return {
    status: "selected",
    taskId: options.task.id,
    selectedExecutor: selected.executor,
    selectedExecutorId: selected.executor.id,
    reason,
    fallbackExecutorIds,
    approvalRequired: selected.approvalRequired || options.task.approvalRequired,
    requiredApprovalGates: selected.approvalRequired || options.task.approvalRequired ? ["owner_execution_approval"] : []
  };
}

export function selectReadyTasks(options: { tasks: Task[]; limit?: number }): ReadyTaskSelection {
  const taskMap = new Map(options.tasks.map((task) => [task.id, task]));
  const ready: Task[] = [];
  const blocked: ReadyTaskSelection["blocked"] = [];

  for (const task of options.tasks) {
    const baseReason = taskReadinessBlockReason(task, taskMap);
    if (baseReason) {
      blocked.push({ task, reason: baseReason });
      continue;
    }

    ready.push(task);
  }

  ready.sort((left, right) => left.priority - right.priority || left.createdAt.getTime() - right.createdAt.getTime());
  return {
    ready: typeof options.limit === "number" ? ready.slice(0, options.limit) : ready,
    blocked
  };
}

export async function runCliCommand(options: CliRunOptions): Promise<CliRunResult> {
  if (options.executor.kind !== "cli") {
    throw new DomainInvariantError("CLI command execution requires a CLI executor");
  }

  if (!options.executor.enabled) {
    throw new DomainInvariantError("Disabled executors cannot run commands");
  }

  const cwd = requireText(options.command.cwd, "CLI command cwd is required");
  if (!isProjectRootAllowed(cwd, options.executor.allowedProjectRoots)) {
    throw new DomainInvariantError("CLI command cwd is outside the executor allowed roots");
  }

  const executable = requireText(options.command.executable, "CLI command executable is required");
  const args = options.command.args ?? [];
  const startedAt = options.now ?? new Date();
  const startedMs = startedAt.getTime();
  const envSummary = summarizeEnv(options.command.env ?? {});
  const commandSummary = redactSecrets([executable, ...args].join(" "));
  const timeoutMs = options.command.timeoutMs ?? options.executor.timeoutSeconds * 1000;
  const maxSummaryBytes = options.maxSummaryBytes ?? DEFAULT_SUMMARY_BYTES;

  return await new Promise<CliRunResult>((resolve) => {
    let stdout = "";
    let stderr = "";
    let timedOut = false;
    let settled = false;

    const child = spawn(executable, args, {
      cwd,
      env: { ...process.env, ...options.command.env },
      shell: false,
      windowsHide: true
    });

    const timeout = setTimeout(() => {
      timedOut = true;
      child.kill("SIGTERM");
    }, timeoutMs);

    child.stdout?.on("data", (chunk: Buffer) => {
      stdout += chunk.toString("utf8");
    });

    child.stderr?.on("data", (chunk: Buffer) => {
      stderr += chunk.toString("utf8");
    });

    child.on("error", (error) => {
      stderr += `${error.name}: ${error.message}`;
    });

    child.on("close", (exitCode) => {
      if (settled) {
        return;
      }

      settled = true;
      clearTimeout(timeout);
      const endedAt = new Date();
      const status = executionStatusFromExit(exitCode, timedOut);
      const stdoutSummary = summarizeText(redactSecrets(stdout), maxSummaryBytes);
      const stderrSummary = summarizeText(redactSecrets(stderr), maxSummaryBytes);
      const durationMs = Math.max(0, endedAt.getTime() - startedMs);

      resolve({
        execution: {
          id: options.executionId,
          taskId: options.task.id,
          executorId: options.executor.id,
          executorKind: options.executor.kind,
          command: commandSummary,
          cwd,
          status,
          startedAt,
          endedAt,
          durationMs,
          exitCode: exitCode ?? undefined,
          stdoutRef: stdoutSummary,
          stderrRef: stderrSummary,
          artifactRefs: [],
          summary: summarizeExecution(status, stdoutSummary, stderrSummary, envSummary)
        },
        stdoutSummary,
        stderrSummary,
        timedOut
      });
    });
  });
}

export function createInteractiveQuestionBlocker(input: ExecutorQuestionInput): Blocker {
  const question = requireText(input.question, "Executor blocker question is required");
  const reason = requireText(input.reason, "Executor blocker reason is required");
  const options = input.options.map((option) => option.trim()).filter(Boolean);
  if (options.length === 0) {
    throw new DomainInvariantError("Executor blocker requires at least one option");
  }

  return {
    id: requireText(input.id, "Executor blocker ID is required"),
    projectId: requireText(input.projectId, "Executor blocker project ID is required"),
    goalId: input.goalId,
    taskId: input.taskId,
    type: "needs_user_answer",
    question,
    reason,
    options,
    recommendation: input.recommendation?.trim() || undefined,
    impact: requireText(input.impact, "Executor blocker impact is required"),
    status: "open",
    createdAt: input.now
  };
}

export function redactSecrets(value: string): string {
  return SECRET_PATTERNS.reduce(
    (redacted, pattern) => redacted.replace(pattern, (_match, prefix: string) => `${prefix}[REDACTED]`),
    value
  );
}

export function summarizeEnv(env: Record<string, string | undefined>): Record<string, JsonValue> {
  return Object.fromEntries(
    Object.entries(env)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, value]) => [key, value === undefined ? null : redactSecrets(`${key}=${value}`).slice(key.length + 1)])
  );
}

function taskReadinessBlockReason(task: Task, taskMap: Map<string, Task>): string | undefined {
  if (task.status !== "created" && task.status !== "approved" && task.status !== "failed") {
    return `Task status is not ready for worker execution: ${task.status}`;
  }

  if (task.status === "failed" && task.attempt >= task.maxAttempts) {
    return "Task retry budget is exhausted";
  }

  for (const dependencyId of task.dependsOnTaskIds) {
    const dependency = taskMap.get(dependencyId);
    if (!dependency || dependency.status !== "done") {
      return `Task dependency is not done: ${dependencyId}`;
    }
  }

  return undefined;
}

function sortEligibleMatches(matches: CapabilityMatch[], preferredExecutorIds: string[]): CapabilityMatch[] {
  const preferredIndex = new Map(preferredExecutorIds.map((id, index) => [id, index]));
  return matches
    .filter((match) => match.eligible)
    .sort((left, right) => {
      const leftPreferred = preferredIndex.get(left.executor.id) ?? Number.MAX_SAFE_INTEGER;
      const rightPreferred = preferredIndex.get(right.executor.id) ?? Number.MAX_SAFE_INTEGER;
      if (leftPreferred !== rightPreferred) {
        return leftPreferred - rightPreferred;
      }

      return right.matchedCapabilities.length - left.matchedCapabilities.length || left.executor.id.localeCompare(right.executor.id);
    });
}

function summarizeMatchFailures(matches: CapabilityMatch[]): string {
  if (matches.length === 0) {
    return "No executors are registered";
  }

  return matches
    .map((match) => `${match.executor.id}: ${match.reasons.join("; ") || "not selected"}`)
    .join(" | ");
}

function codingIpsBlockReason(task: Task): string | undefined {
  if (!isCodingTask(task)) {
    return undefined;
  }

  if (task.ipsGateStatus !== "passed") {
    return "Coding task routing blocked: IPS pre-coding gate has not passed";
  }

  if (!task.contextPackageId) {
    return "Coding task routing blocked: context package reference is missing";
  }

  if (!task.codingPromptId) {
    return "Coding task routing blocked: coding prompt reference is missing";
  }

  if (task.ipsArtifactIds.length === 0) {
    return "Coding task routing blocked: IPS artifact references are missing";
  }

  return undefined;
}

function inferRequiredCapabilities(task: Task): string[] {
  const toolRequirements = jsonStringList(task.payload.toolRequirements);
  const capabilities = [...toolRequirements];
  if (isCodingTask(task)) {
    capabilities.push("code_edit");
  }

  if (task.type === "verify" || task.type === "test") {
    capabilities.push("test_run");
  }

  if (task.type === "notify") {
    capabilities.push("notify");
  }

  return capabilities;
}

function inferTaskRisk(task: Task): RiskLevel {
  const value = task.payload.riskLevel;
  return value === "low" || value === "medium" || value === "high" ? value : "medium";
}

function normalizeCapabilities(capabilities: string[]): string[] {
  return [...new Set(capabilities.map((capability) => capability.trim()).filter(Boolean))];
}

function jsonStringList(value: JsonValue | undefined): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean);
}

function isProjectRootAllowed(projectRoot: string, allowedRoots: string[]): boolean {
  const resolvedProjectRoot = path.resolve(projectRoot);
  return allowedRoots.some((allowedRoot) => {
    const resolvedAllowedRoot = path.resolve(allowedRoot);
    const relative = path.relative(resolvedAllowedRoot, resolvedProjectRoot);
    return relative === "" || (!!relative && !relative.startsWith("..") && !path.isAbsolute(relative));
  });
}

function executionStatusFromExit(exitCode: number | null, timedOut: boolean): ExecutionStatus {
  if (timedOut) {
    return "timed_out";
  }

  return exitCode === 0 ? "succeeded" : "failed";
}

function summarizeText(value: string, maxBytes: number): string {
  const normalized = value.replace(/\r\n/g, "\n").trim();
  if (Buffer.byteLength(normalized, "utf8") <= maxBytes) {
    return normalized;
  }

  return `${normalized.slice(0, maxBytes)}...[truncated]`;
}

function summarizeExecution(
  status: ExecutionStatus,
  stdoutSummary: string,
  stderrSummary: string,
  envSummary: Record<string, JsonValue>
): string {
  const envKeys = Object.keys(envSummary);
  const parts = [`CLI execution ${status}`];
  if (stdoutSummary) {
    parts.push(`stdout: ${stdoutSummary}`);
  }

  if (stderrSummary) {
    parts.push(`stderr: ${stderrSummary}`);
  }

  if (envKeys.length > 0) {
    parts.push(`env keys: ${envKeys.join(", ")}`);
  }

  return parts.join("; ");
}

function isCodingTask(task: Task): boolean {
  return task.type === "code" || task.type === "coding";
}

function requireText(value: string, message: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new DomainInvariantError(message);
  }

  return trimmed;
}
