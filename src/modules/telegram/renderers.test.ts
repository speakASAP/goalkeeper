import assert from "node:assert/strict";
import { test } from "node:test";
import {
  renderCallbackResult,
  renderCapturedGoalIntent,
  renderCommand,
  renderAuditJourneyAssessment,
  renderBackupExportManifest,
  renderConfirmationDecision,
  renderDeploymentReadiness,
  renderGoalCompletionReport,
  renderAgentStatus,
  renderParseResult,
  renderPlanReview,
  renderExecutorStatus,
  renderOvernightDigest,
  renderOvernightPolicy,
  renderSmokeTestSummary,
  renderTaskLogSummary,
  renderTaskValidationReport,
  renderUnauthorized
} from "./renderers.js";

test("renders unauthorized denial without allowlist details", () => {
  const message = renderUnauthorized();
  assert.match(message.text, /Access denied/);
  assert.doesNotMatch(message.text, /101/);
});

test("renders goal capture as raw intent stub without starting coding", () => {
  const message = renderCommand({
    kind: "command",
    command: "goal",
    args: "Build Telegram-first goal management"
  });

  assert.match(message.text, /Goal captured as raw intent/);
  assert.match(message.text, /No planning or coding started/);
  assert.equal(message.buttons?.length, 2);
});

test("renders captured raw intent with target-specific approval callbacks", () => {
  const message = renderCapturedGoalIntent({
    goal: {
      id: "goal-1",
      projectId: "telegram-inbox",
      title: "Build Telegram-first goal management",
      rawIntent: "Build Telegram-first goal management",
      status: "intent_ready",
      priority: 1,
      successCriteria: [],
      constraints: [],
      nonGoals: [],
      assumptions: [],
      completionPct: 0,
      createdBy: "telegram:101",
      createdAt: new Date("2026-06-12T10:00:00.000Z"),
      updatedAt: new Date("2026-06-12T10:00:00.000Z")
    },
    rawIntentRecord: {
      id: "intent-raw-1",
      goalId: "goal-1",
      kind: "raw",
      content: "Build Telegram-first goal management",
      source: "telegram",
      actorId: "telegram:101",
      createdAt: new Date("2026-06-12T10:00:00.000Z")
    }
  });

  assert.match(message.text, /Status: intent ready for owner approval/);
  assert.equal(message.buttons?.[0]?.[0]?.callbackData, "approve_intent:goal-1");
  assert.equal(message.buttons?.[1]?.[0]?.callbackData, "add_constraint:goal-1");
});

test("renders unknown command and duplicate callback messages", () => {
  assert.match(renderParseResult({ kind: "unknown", command: "deploy", args: "" }).text, /Unknown command/);
  assert.match(renderCallbackResult({ status: "duplicate" }).text, /already handled/);
});

test("renders plan review with approval controls without starting execution", () => {
  const message = renderPlanReview(
    {
      id: "plan-1",
      goalId: "goal-1",
      version: 2,
      status: "proposed",
      summary: "Build Telegram plan review",
      createdByAgent: "test-planner",
      createdAt: new Date("2026-06-12T10:00:00.000Z")
    },
    [
      {
        id: "step-1",
        planId: "plan-1",
        index: 1,
        title: "Create renderer",
        description: "Render plan in Telegram",
        type: "code",
        priority: 1,
        dependsOnStepIds: [],
        acceptanceCriteria: ["Plan is visible"],
        approvalRequired: true,
        riskLevel: "medium",
        toolRequirements: ["code_edit"]
      }
    ]
  );

  assert.match(message.text, /Plan v2/);
  assert.match(message.text, /No tasks will execute until the plan is approved/);
  assert.equal(message.buttons?.[0]?.[0]?.callbackData, "approve_plan:plan-1");
  assert.equal(message.buttons?.[1]?.[1]?.callbackData, "reject_plan:plan-1");
});

test("renders task validation report without full execution logs", () => {
  const message = renderTaskValidationReport({
    taskId: "task-1",
    goalId: "goal-1",
    projectId: "project-1",
    status: "failed",
    summary: "Task validation failed: Task output is marked invalid",
    executorId: "shell-safe",
    executionIds: ["execution-1"],
    changedArtifactRefs: ["src/domain/validation.ts"],
    validationEvidence: ["npm test failed invalid output check"],
    risks: ["Needs retry with owner feedback"],
    passedCriteria: [],
    failedCriteria: ["Task output is marked invalid"],
    notDone: ["Task cannot be marked done until validation passes"],
    originalIntent: "Validate before completion",
    approvedInterpretation: "Invalid output must be rejected",
    semanticValidation: {
      status: "passed",
      summary: "Intent evidence present",
      evidence: ["npm test failed invalid output check"]
    },
    validatedAt: new Date("2026-06-12T13:00:00.000Z")
  });

  assert.match(message.text, /Task validation failed/);
  assert.match(message.text, /Executor: shell-safe/);
  assert.match(message.text, /src\/domain\/validation.ts/);
  assert.doesNotMatch(message.text, /stdout/);
  assert.equal(message.buttons?.[0]?.[0]?.callbackData, "retry_task:task-1");
});

test("renders goal completion report with intent, decisions, validation, and risks", () => {
  const message = renderGoalCompletionReport({
    goalId: "goal-1",
    projectId: "project-1",
    title: "Validation reports",
    originalIntent: "Prove work served the owner intent",
    finalInterpretation: "Reports include evidence and risks",
    decisions: ["Accept report after adding risks"],
    completedTaskIds: ["task-1", "task-2"],
    validationEvidence: ["npm test passed", "typecheck passed"],
    changedArtifactRefs: ["src/domain/validation.ts"],
    risks: ["Overnight digest is future work"],
    notDone: [],
    completedAt: new Date("2026-06-12T13:00:00.000Z")
  });

  assert.match(message.text, /Goal completion report/);
  assert.match(message.text, /Original intent: Prove work served the owner intent/);
  assert.match(message.text, /Decisions: Accept report after adding risks/);
  assert.match(message.text, /Validation: npm test passed; typecheck passed/);
  assert.equal(message.buttons?.[0]?.[0]?.callbackData, "ack_goal_report:goal-1");
});

test("renders overnight policy and command stubs without starting execution", () => {
  const commandMessage = renderCommand({
    kind: "command",
    command: "overnight",
    args: "enable"
  });
  assert.match(commandMessage.text, /Overnight mode can monitor approved work/);
  assert.match(commandMessage.text, /IPS gates/);

  const policyMessage = renderOvernightPolicy({
    enabled: true,
    mode: "execute",
    maxConcurrentTasks: 1,
    maxRiskLevel: "medium",
    requireApprovalForDestructive: true,
    requireApprovalForDeployment: true,
    allowSelfImprovement: true
  });
  assert.match(policyMessage.text, /Overnight mode is enabled/);
  assert.match(policyMessage.text, /Self-improvement allowed: yes, through IPS only/);
  assert.match(policyMessage.text, /deployment work pauses/);
});

test("renders overnight digest buckets and blocker summary", () => {
  const message = renderOvernightDigest({
    projectId: "project-1",
    periodStart: new Date("2026-06-12T20:00:00.000Z"),
    periodEnd: new Date("2026-06-12T22:00:00.000Z"),
    completed: [
      {
        taskId: "task-complete",
        goalId: "goal-1",
        title: "Complete",
        status: "done",
        executorId: "codex-cli",
        evidence: ["npm test passed"]
      }
    ],
    failed: [
      {
        taskId: "task-failed",
        goalId: "goal-1",
        title: "Failed",
        status: "failed",
        evidence: ["validation failed"]
      }
    ],
    partial: [],
    blocked: [],
    awaitingUser: [],
    blockerGroups: [
      {
        projectId: "project-1",
        goalId: "goal-1",
        type: "needs_user_answer",
        taskIds: ["task-1"],
        count: 1,
        question: "Approve risk?",
        reason: "Risk gate",
        impact: "Task remains paused"
      }
    ],
    validationEvidence: ["npm test passed"],
    summary: "Completed: 1; Failed: 1; Partial: 0; Blocked: 0; Awaiting owner: 0"
  });

  assert.match(message.text, /Overnight digest/);
  assert.match(message.text, /Completed: task-complete/);
  assert.match(message.text, /Failed: task-failed/);
  assert.match(message.text, /Open blockers: needs_user_answer x1/);
});

test("renders agent and executor status summaries", () => {
  const agentMessage = renderAgentStatus([
    {
      agentId: "agent-codex",
      status: "running",
      runningTaskIds: ["task-1"],
      currentStep: "running tests",
      lastUpdate: "Updated renderers"
    }
  ]);
  assert.match(agentMessage.text, /agent-codex: running/);
  assert.match(agentMessage.text, /Tasks: task-1/);

  const executorMessage = renderExecutorStatus([
    {
      executorId: "codex-cli",
      displayName: "Codex CLI",
      kind: "cli",
      status: "idle",
      capabilities: ["code_edit", "test_run"],
      approvalRequired: true,
      maxRiskLevel: "medium",
      runningTaskIds: [],
      lastExecutionSummary: "Completed validation"
    }
  ]);
  assert.match(executorMessage.text, /Codex CLI/);
  assert.match(executorMessage.text, /Owner approval required/);
  assert.match(executorMessage.text, /Capabilities: code_edit; test_run/);
});

test("renders task log summary without raw stdout or stderr labels", () => {
  const message = renderTaskLogSummary({
    taskId: "task-1",
    goalId: "goal-1",
    status: "blocked",
    artifactRefs: ["src/domain/overnight.ts"],
    validationEvidence: ["npm test failed"],
    entries: [
      {
        at: new Date("2026-06-12T22:00:00.000Z"),
        source: "execution",
        status: "failed",
        summary: "Tests failed after implementation"
      },
      {
        at: new Date("2026-06-12T22:01:00.000Z"),
        source: "blocker",
        status: "open",
        summary: "Owner approval is required"
      }
    ]
  });

  assert.match(message.text, /Task log: task-1/);
  assert.match(message.text, /src\/domain\/overnight.ts/);
  assert.doesNotMatch(message.text, /stdout/);
  assert.doesNotMatch(message.text, /stderr/);
});

test("renders hardening command stubs without executing admin or deployment actions", () => {
  const admin = renderCommand({
    kind: "command",
    command: "admin",
    args: "pause project-1"
  });
  assert.match(admin.text, /Admin control is ready/);
  assert.match(admin.text, /require explicit confirmation/);

  const exportMessage = renderCommand({
    kind: "command",
    command: "backup_export",
    args: "project-1"
  });
  assert.match(exportMessage.text, /Backup export is ready/);
  assert.match(exportMessage.text, /secrets and raw production data are excluded/);

  const smoke = renderCommand({
    kind: "command",
    command: "smoke_test",
    args: "http://127.0.0.1:3000"
  });
  assert.match(smoke.text, /Smoke test is ready/);
  assert.match(smoke.text, /health endpoint/);

  const readiness = renderCommand({
    kind: "command",
    command: "deployment_readiness",
    args: ""
  });
  assert.match(readiness.text, /explicit owner approval/);
});

test("renders confirmation decision with production approval boundary", () => {
  const message = renderConfirmationDecision({
    actionId: "deploy-production",
    status: "owner_approval_required",
    reason: "Production deployment requires explicit owner approval.",
    approvalBoundary: "production_deployment"
  });

  assert.match(message.text, /deploy-production/);
  assert.match(message.text, /Owner Approval Required/i);
  assert.match(message.text, /production deployment/i);
});

test("renders backup export manifest as redacted references", () => {
  const message = renderBackupExportManifest({
    exportId: "export-1",
    projectId: "project-1",
    createdAt: new Date("2026-06-12T12:00:00.000Z"),
    redacted: true,
    goals: ["goal-1"],
    tasks: ["task-1"],
    executions: ["execution-1"],
    artifacts: ["validation-report.md"],
    decisions: ["decision-1"],
    events: ["event-1"],
    evidence: ["1 goals", "1 tasks"],
    retentionNote: "Export manifest contains references and redacted summaries only; secrets are excluded."
  });

  assert.match(message.text, /Backup export: export-1/);
  assert.match(message.text, /validation-report\.md/);
  assert.doesNotMatch(message.text, /token/);
});

test("renders audit journey, smoke test, and deployment readiness summaries", () => {
  const audit = renderAuditJourneyAssessment({
    goalId: "goal-1",
    complete: false,
    missing: ["executions"],
    evidence: ["raw intent: intent-1"]
  });
  assert.match(audit.text, /Status: incomplete/);
  assert.match(audit.text, /Missing: executions/);

  const smoke = renderSmokeTestSummary({
    targetUrl: "http://127.0.0.1:3000/health",
    status: "passed",
    checkedAt: new Date("2026-06-12T12:00:00.000Z"),
    evidence: ["HTTP 200", "service=goalkeeper"],
    recommendation: "Health endpoint is reachable and reports GoalKeeper ok."
  });
  assert.match(smoke.text, /Smoke test/);
  assert.match(smoke.text, /HTTP 200/);

  const readiness = renderDeploymentReadiness({
    status: "ready_for_owner_approval",
    productionTarget: "alfares",
    ownerApprovalRequired: true,
    rollbackPlanRef: "docs/DEPLOYMENT_RUNBOOK.md#rollback",
    smokeTestRef: "scripts/smoke_test.sh local",
    passedCommands: ["npm test"],
    failedCommands: [],
    blockers: [],
    recommendation: "Review readiness evidence and request explicit owner approval before production deployment."
  });
  assert.match(readiness.text, /Target: alfares/);
  assert.match(readiness.text, /explicit owner approval required/);
  assert.match(readiness.text, /rollback/i);
});
