import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DEFAULT_OVERNIGHT_POLICY,
  aggregateBlockers,
  composeAgentStatus,
  composeExecutorStatus,
  composeOvernightDigest,
  createGoalKeeperSelfProject,
  evaluateAutonomousTask,
  summarizeTaskLog
} from "./overnight.js";
import type { Blocker, Execution, Executor, Project, Task } from "./types.js";

const now = new Date("2026-06-12T22:00:00.000Z");

function baseProject(overrides: Partial<Project> = {}): Project {
  return {
    id: "project-1",
    slug: "demo",
    name: "Demo",
    preferredExecutors: ["codex-cli"],
    commandPresets: {},
    ipsEnabled: true,
    ipsSettings: {},
    overnightModeEnabled: true,
    concurrencyLimit: 2,
    status: "active",
    defaultApprovalMode: "manual",
    riskLevel: "medium",
    createdAt: now,
    updatedAt: now,
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
    status: "approved",
    priority: 1,
    payload: {
      title: "Implement safe status view",
      riskLevel: "medium",
      toolRequirements: ["code_edit"]
    },
    acceptanceCriteria: ["Status is visible"],
    dependsOnTaskIds: [],
    approvalRequired: false,
    idempotencyKey: "task-1:v1",
    selectedExecutorId: "codex-cli",
    ipsGateStatus: "passed",
    contextPackageId: "context-1",
    codingPromptId: "prompt-1",
    ipsArtifactIds: ["context-1", "prompt-1"],
    attempt: 0,
    maxAttempts: 3,
    createdAt: now,
    ...overrides
  };
}

function baseExecutor(overrides: Partial<Executor> = {}): Executor {
  return {
    id: "codex-cli",
    kind: "cli",
    displayName: "Codex CLI",
    enabled: true,
    capabilities: ["code_edit", "test_run"],
    allowedProjectRoots: ["/Users/Sergej.Stasok/Documents/Gitlab"],
    requiresApproval: false,
    riskLevel: "medium",
    timeoutSeconds: 1800,
    maxRetries: 2,
    createdAt: now,
    updatedAt: now,
    ...overrides
  };
}

function baseExecution(overrides: Partial<Execution> = {}): Execution {
  return {
    id: "execution-1",
    taskId: "task-1",
    executorId: "codex-cli",
    executorKind: "cli",
    status: "succeeded",
    startedAt: now,
    endedAt: new Date("2026-06-12T22:10:00.000Z"),
    artifactRefs: ["src/domain/overnight.ts"],
    summary: "Implemented status view and ran tests",
    ...overrides
  };
}

function baseBlocker(overrides: Partial<Blocker> = {}): Blocker {
  return {
    id: "blocker-1",
    projectId: "project-1",
    goalId: "goal-1",
    taskId: "task-1",
    type: "needs_user_answer",
    question: "Approve this risky change?",
    reason: "Owner approval is required",
    options: ["Approve", "Reject"],
    recommendation: "Approve after reviewing the plan",
    impact: "Task remains paused until answered",
    status: "open",
    createdAt: now,
    ...overrides
  };
}

test("autonomous execution is eligible only when overnight policy and IPS gates pass", () => {
  const decision = evaluateAutonomousTask({
    project: baseProject(),
    policy: { ...DEFAULT_OVERNIGHT_POLICY, enabled: true, mode: "execute" },
    task: baseTask(),
    runningTaskCount: 0,
    executors: [baseExecutor()]
  });

  assert.equal(decision.status, "eligible");

  const blocked = evaluateAutonomousTask({
    project: baseProject(),
    policy: { ...DEFAULT_OVERNIGHT_POLICY, enabled: true, mode: "execute" },
    task: baseTask({
      ipsGateStatus: "failed",
      contextPackageId: undefined,
      codingPromptId: undefined,
      ipsArtifactIds: []
    }),
    runningTaskCount: 0,
    executors: [baseExecutor()]
  });

  assert.equal(blocked.status, "blocked");
  assert.deepEqual(blocked.requiredGates, ["ips_pre_coding_gate"]);
});

test("overnight policy pauses monitoring-only, high-risk, destructive, and deployment work", () => {
  const monitorOnly = evaluateAutonomousTask({
    project: baseProject(),
    policy: { ...DEFAULT_OVERNIGHT_POLICY, enabled: true, mode: "monitor" },
    task: baseTask(),
    runningTaskCount: 0,
    executors: [baseExecutor()]
  });
  assert.equal(monitorOnly.status, "not_ready");

  const highRisk = evaluateAutonomousTask({
    project: baseProject(),
    policy: { ...DEFAULT_OVERNIGHT_POLICY, enabled: true, mode: "execute", maxRiskLevel: "medium" },
    task: baseTask({ payload: { title: "Replace deployment", riskLevel: "high" } }),
    runningTaskCount: 0,
    executors: [baseExecutor({ riskLevel: "high" })]
  });
  assert.equal(highRisk.status, "awaiting_owner");
  assert.deepEqual(highRisk.requiredGates, ["risk_approval"]);

  const deployment = evaluateAutonomousTask({
    project: baseProject(),
    policy: { ...DEFAULT_OVERNIGHT_POLICY, enabled: true, mode: "execute" },
    task: baseTask({ type: "deployment", payload: { title: "Deploy", riskLevel: "medium" } }),
    runningTaskCount: 0,
    executors: [baseExecutor()]
  });
  assert.equal(deployment.status, "awaiting_owner");
  assert.deepEqual(deployment.requiredGates, ["deployment_approval"]);
});

test("overnight digest separates completed, failed, partial, blocked, and awaiting owner work", () => {
  const digest = composeOvernightDigest({
    projectId: "project-1",
    periodStart: new Date("2026-06-12T20:00:00.000Z"),
    periodEnd: now,
    snapshots: [
      {
        task: baseTask({
          id: "task-complete",
          status: "done",
          validationResult: {
            status: "passed",
            summary: "Validation passed",
            evidence: ["npm test passed"],
            validatedAt: now
          }
        }),
        executions: [baseExecution({ taskId: "task-complete" })]
      },
      { task: baseTask({ id: "task-failed", status: "failed" }) },
      { task: baseTask({ id: "task-partial", status: "in_progress" }) },
      { task: baseTask({ id: "task-blocked", status: "blocked", blockedReason: "IPS gate failed" }) },
      { task: baseTask({ id: "task-awaiting", status: "awaiting_user" }), blockers: [baseBlocker()] }
    ]
  });

  assert.deepEqual(
    [digest.completed, digest.failed, digest.partial, digest.blocked, digest.awaitingUser].map((bucket) => bucket.length),
    [1, 1, 1, 1, 1]
  );
  assert.match(digest.summary, /Completed: 1/);
  assert.deepEqual(digest.validationEvidence, ["npm test passed", "src/domain/overnight.ts"]);
  assert.equal(digest.blockerGroups.length, 1);
});

test("blockers are aggregated by project, goal, type, and question", () => {
  const groups = aggregateBlockers([
    baseBlocker({ id: "blocker-1", taskId: "task-1" }),
    baseBlocker({ id: "blocker-2", taskId: "task-2" }),
    baseBlocker({ id: "blocker-closed", taskId: "task-3", status: "resolved" })
  ]);

  assert.equal(groups.length, 1);
  assert.equal(groups[0]?.count, 2);
  assert.deepEqual(groups[0]?.taskIds, ["task-1", "task-2"]);
});

test("agent and executor status views summarize running work", () => {
  const tasks = [
    baseTask({ id: "task-1", status: "in_progress", assignedAgentId: "agent-codex" }),
    baseTask({ id: "task-2", status: "done", assignedAgentId: "agent-codex" })
  ];
  const executions = [
    baseExecution({ taskId: "task-1", status: "running", endedAt: undefined, summary: "Running tests" }),
    baseExecution({ taskId: "task-2", status: "succeeded", summary: "Completed docs" })
  ];

  const agents = composeAgentStatus(tasks, executions);
  assert.equal(agents[0]?.status, "running");
  assert.deepEqual(agents[0]?.runningTaskIds, ["task-1"]);
  assert.equal(agents[0]?.lastUpdate, "Running tests");

  const executors = composeExecutorStatus([baseExecutor()], executions);
  assert.equal(executors[0]?.status, "running");
  assert.deepEqual(executors[0]?.runningTaskIds, ["task-1"]);
});

test("task log summary uses execution summaries, blockers, artifacts, and validation evidence", () => {
  const task = baseTask({
    status: "blocked",
    validationResult: {
      status: "failed",
      summary: "Validation failed",
      evidence: ["npm test failed"],
      validatedAt: new Date("2026-06-12T22:20:00.000Z")
    }
  });
  const log = summarizeTaskLog({
    task,
    executions: [baseExecution()],
    blockers: [baseBlocker()],
    maxEntries: 3
  });

  assert.equal(log.entries.length, 3);
  assert.deepEqual(log.artifactRefs, ["src/domain/overnight.ts"]);
  assert.deepEqual(log.validationEvidence, ["npm test failed"]);
  assert.ok(log.entries.some((entry) => entry.source === "validation"));
});

test("GoalKeeper self-project bootstrap requires IPS and manual approvals", () => {
  const project = createGoalKeeperSelfProject({
    now,
    localPath: "/Users/Sergej.Stasok/Documents/Gitlab/goalkeeper"
  });

  assert.equal(project.slug, "goalkeeper");
  assert.equal(project.ipsEnabled, true);
  assert.equal(project.defaultApprovalMode, "manual");
  assert.equal(project.overnightModeEnabled, false);
  assert.equal(project.concurrencyLimit, 1);
  assert.equal(project.ipsSettings.selfImprovementUsesSamePath, true);
});
