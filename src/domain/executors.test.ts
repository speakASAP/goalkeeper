import assert from "node:assert/strict";
import { test } from "node:test";
import {
  createInteractiveQuestionBlocker,
  matchExecutor,
  redactSecrets,
  routeTaskForExecution,
  runCliCommand,
  selectReadyTasks,
  summarizeEnv
} from "./executors.js";
import { DomainInvariantError } from "./lifecycle.js";
import type { Executor, Task } from "./types.js";

const now = new Date("2026-06-12T12:00:00.000Z");
const projectRoot = "/tmp/goalkeeper-project";

function baseTask(overrides: Partial<Task> = {}): Task {
  return {
    id: "task-1",
    projectId: "project-1",
    goalId: "goal-1",
    planStepId: "step-1",
    type: "verify",
    status: "created",
    priority: 1,
    payload: {
      riskLevel: "low",
      toolRequirements: ["test_run"]
    },
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

function baseExecutor(overrides: Partial<Executor> = {}): Executor {
  return {
    id: "shell-safe",
    kind: "cli",
    displayName: "Safe Shell",
    enabled: true,
    capabilities: ["shell", "test_run", "code_edit"],
    allowedProjectRoots: ["/tmp"],
    requiresApproval: false,
    riskLevel: "medium",
    commandTemplate: "node",
    timeoutSeconds: 5,
    maxRetries: 2,
    createdAt: now,
    updatedAt: now,
    ...overrides
  };
}

test("worker selects only tasks whose dependencies are done and retry budget remains", () => {
  const dependency = baseTask({ id: "task-0", status: "done", priority: 1 });
  const ready = baseTask({ id: "task-1", dependsOnTaskIds: ["task-0"], priority: 2 });
  const blockedByDependency = baseTask({ id: "task-2", dependsOnTaskIds: ["missing"], priority: 1 });
  const awaitingApproval = baseTask({ id: "task-3", status: "pending_approval" });
  const retryReady = baseTask({ id: "task-4", status: "failed", attempt: 1, maxAttempts: 3, priority: 0 });
  const retryExhausted = baseTask({ id: "task-5", status: "failed", attempt: 3, maxAttempts: 3 });

  const result = selectReadyTasks({
    tasks: [ready, blockedByDependency, dependency, awaitingApproval, retryReady, retryExhausted]
  });

  assert.deepEqual(
    result.ready.map((task) => task.id),
    ["task-4", "task-1"]
  );
  assert.ok(result.blocked.some((item) => item.task.id === "task-2" && item.reason.includes("dependency")));
  assert.ok(result.blocked.some((item) => item.task.id === "task-3" && item.reason.includes("not ready")));
  assert.ok(result.blocked.some((item) => item.task.id === "task-5" && item.reason.includes("retry budget")));
});

test("registry matching rejects disabled, unauthorized, incapable, and excessive-risk executors", () => {
  assert.equal(
    matchExecutor({
      executor: baseExecutor(),
      projectRoot,
      requiredCapabilities: ["test_run"],
      riskLevel: "low"
    }).eligible,
    true
  );

  const disabled = matchExecutor({
    executor: baseExecutor({ enabled: false }),
    projectRoot,
    requiredCapabilities: ["test_run"],
    riskLevel: "low"
  });
  assert.equal(disabled.eligible, false);
  assert.ok(disabled.reasons.includes("Executor is disabled"));

  const unauthorized = matchExecutor({
    executor: baseExecutor({ allowedProjectRoots: ["/srv/other"] }),
    projectRoot,
    requiredCapabilities: ["test_run"],
    riskLevel: "low"
  });
  assert.equal(unauthorized.eligible, false);
  assert.ok(unauthorized.reasons.includes("Project root is not allowed for this executor"));

  const incapable = matchExecutor({
    executor: baseExecutor({ capabilities: ["shell"] }),
    projectRoot,
    requiredCapabilities: ["test_run"],
    riskLevel: "low"
  });
  assert.equal(incapable.eligible, false);
  assert.ok(incapable.missingCapabilities.includes("test_run"));

  const risky = matchExecutor({
    executor: baseExecutor({ riskLevel: "low" }),
    projectRoot,
    requiredCapabilities: ["test_run"],
    riskLevel: "high"
  });
  assert.equal(risky.eligible, false);
  assert.ok(risky.reasons.some((reason) => reason.includes("exceeds executor")));
});

test("routing stores selected executor, reason, fallbacks, and approval gates", () => {
  const decision = routeTaskForExecution({
    task: baseTask({ approvalRequired: true }),
    projectRoot,
    executors: [
      baseExecutor({ id: "secondary" }),
      baseExecutor({ id: "preferred", requiresApproval: true })
    ],
    requiredCapabilities: ["test_run"],
    preferredExecutorIds: ["preferred"]
  });

  assert.equal(decision.status, "selected");
  assert.equal(decision.selectedExecutorId, "preferred");
  assert.ok(decision.reason.includes("Selected preferred"));
  assert.deepEqual(decision.fallbackExecutorIds, ["secondary"]);
  assert.equal(decision.approvalRequired, true);
  assert.deepEqual(decision.requiredApprovalGates, ["owner_execution_approval"]);
});

test("coding tasks with missing IPS gate are blocked before executor fallback", () => {
  const decision = routeTaskForExecution({
    task: baseTask({
      type: "code",
      payload: { riskLevel: "medium", toolRequirements: ["code_edit"] },
      ipsGateStatus: "failed",
      contextPackageId: undefined,
      codingPromptId: undefined,
      ipsArtifactIds: []
    }),
    projectRoot,
    executors: [baseExecutor({ id: "codex-cli" })],
    requiredCapabilities: ["code_edit"]
  });

  assert.equal(decision.status, "blocked");
  assert.equal(decision.selectedExecutorId, undefined);
  assert.deepEqual(decision.fallbackExecutorIds, []);
  assert.deepEqual(decision.requiredApprovalGates, ["ips_pre_coding_gate"]);
  assert.ok(decision.reason.includes("IPS pre-coding gate"));
});

test("coding tasks with passed IPS artifacts can be routed", () => {
  const decision = routeTaskForExecution({
    task: baseTask({
      type: "code",
      payload: { riskLevel: "medium", toolRequirements: ["code_edit"] },
      ipsGateStatus: "passed",
      contextPackageId: "context-1",
      codingPromptId: "prompt-1",
      ipsArtifactIds: ["context-1", "prompt-1", "validation-1"]
    }),
    projectRoot,
    executors: [baseExecutor({ id: "codex-cli" })],
    requiredCapabilities: ["code_edit"]
  });

  assert.equal(decision.status, "selected");
  assert.equal(decision.selectedExecutorId, "codex-cli");
});

test("CLI adapter captures command evidence and redacts secrets", async () => {
  const result = await runCliCommand({
    executionId: "execution-1",
    task: baseTask(),
    executor: baseExecutor({ allowedProjectRoots: [process.cwd()] }),
    command: {
      executable: process.execPath,
      args: ["-e", "console.log('token=super-secret'); console.error('Bearer abc.def')"],
      cwd: process.cwd(),
      env: { API_KEY: "secret-value" },
      timeoutMs: 2_000
    },
    now
  });

  assert.equal(result.execution.status, "succeeded");
  assert.equal(result.execution.command?.includes("super-secret"), false);
  assert.equal(result.stdoutSummary.includes("super-secret"), false);
  assert.equal(result.stderrSummary.includes("abc.def"), false);
  assert.equal(result.execution.cwd, process.cwd());
  assert.equal(result.execution.startedAt?.toISOString(), now.toISOString());
  assert.ok(result.execution.endedAt);
  assert.ok(typeof result.execution.durationMs === "number");
  assert.equal(result.execution.exitCode, 0);
  assert.equal(result.timedOut, false);
});

test("CLI adapter records timeout status", async () => {
  const result = await runCliCommand({
    executionId: "execution-timeout",
    task: baseTask(),
    executor: baseExecutor({ allowedProjectRoots: [process.cwd()], timeoutSeconds: 1 }),
    command: {
      executable: process.execPath,
      args: ["-e", "setTimeout(() => {}, 2000)"],
      cwd: process.cwd(),
      timeoutMs: 50
    },
    now
  });

  assert.equal(result.execution.status, "timed_out");
  assert.equal(result.timedOut, true);
});

test("CLI adapter refuses disabled executors and unauthorized cwd", async () => {
  await assert.rejects(
    () =>
      runCliCommand({
        executionId: "execution-disabled",
        task: baseTask(),
        executor: baseExecutor({ enabled: false }),
        command: { executable: process.execPath, args: ["-e", ""], cwd: process.cwd() }
      }),
    DomainInvariantError
  );

  await assert.rejects(
    () =>
      runCliCommand({
        executionId: "execution-root",
        task: baseTask(),
        executor: baseExecutor({ allowedProjectRoots: ["/definitely-not-this-root"] }),
        command: { executable: process.execPath, args: ["-e", ""], cwd: process.cwd() }
      }),
    /outside the executor allowed roots/
  );
});

test("interactive blockers become structured owner questions", () => {
  const blocker = createInteractiveQuestionBlocker({
    id: "blocker-1",
    projectId: "project-1",
    goalId: "goal-1",
    taskId: "task-1",
    question: "Which executor should handle this task?",
    reason: "Two enabled executors have the same score.",
    options: ["Codex CLI", "Claude Code"],
    recommendation: "Codex CLI",
    impact: "The task remains paused until the owner chooses an executor.",
    now
  });

  assert.equal(blocker.type, "needs_user_answer");
  assert.equal(blocker.status, "open");
  assert.deepEqual(blocker.options, ["Codex CLI", "Claude Code"]);
});

test("redaction covers text and environment summaries", () => {
  assert.equal(redactSecrets("password=hunter2 token=abc Bearer xyz"), "password=[REDACTED] token=[REDACTED] Bearer [REDACTED]");
  assert.deepEqual(summarizeEnv({ TELEGRAM_BOT_TOKEN: "123:abc", SAFE_FLAG: "on" }), {
    SAFE_FLAG: "on",
    TELEGRAM_BOT_TOKEN: "[REDACTED]"
  });
});
