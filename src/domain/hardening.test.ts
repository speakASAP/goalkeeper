import assert from "node:assert/strict";
import { test } from "node:test";
import {
  assessAuditJourney,
  createBackupExportManifest,
  createStructuredLog,
  evaluateConfirmation,
  evaluateIdempotency,
  evaluateRateLimit,
  summarizeDeploymentReadiness,
  summarizeSmokeTest
} from "./hardening.js";

test("idempotency allows first action and blocks completed duplicate side effects", () => {
  const requestedAt = new Date("2026-06-12T10:00:00.000Z");
  const action = {
    key: "callback:approve_plan:plan-1",
    kind: "telegram_callback" as const,
    actorId: "telegram:101",
    scope: "project-1",
    requestedAt
  };

  assert.deepEqual(evaluateIdempotency(action, []), {
    key: action.key,
    status: "new",
    shouldExecute: true,
    reason: "No matching idempotency record exists."
  });

  const duplicate = evaluateIdempotency(action, [
    {
      key: action.key,
      kind: action.kind,
      actorId: action.actorId,
      scope: action.scope,
      status: "completed",
      resultRef: "event-1",
      createdAt: requestedAt,
      updatedAt: requestedAt
    }
  ]);

  assert.equal(duplicate.status, "duplicate");
  assert.equal(duplicate.shouldExecute, false);
  assert.equal(duplicate.existingResultRef, "event-1");
});

test("idempotency permits retry only after a failed matching action", () => {
  const now = new Date("2026-06-12T10:00:00.000Z");
  const decision = evaluateIdempotency(
    {
      key: "task:retry:task-1",
      kind: "task_action",
      actorId: "system",
      scope: "project-1",
      requestedAt: now
    },
    [
      {
        key: "task:retry:task-1",
        kind: "task_action",
        actorId: "system",
        scope: "project-1",
        status: "failed",
        resultRef: "execution-1",
        createdAt: now,
        updatedAt: now
      }
    ]
  );

  assert.equal(decision.status, "retryable");
  assert.equal(decision.shouldExecute, true);
  assert.equal(decision.existingResultRef, "execution-1");
});

test("rate limit blocks repeated admin commands in the active window", () => {
  const now = new Date("2026-06-12T12:00:00.000Z");
  const decision = evaluateRateLimit({
    actorId: "telegram:101",
    scope: "project-1",
    kind: "admin_command",
    now,
    policy: { maxEvents: 2, windowMs: 60_000 },
    events: [
      {
        actorId: "telegram:101",
        scope: "project-1",
        kind: "admin_command",
        occurredAt: new Date("2026-06-12T11:59:10.000Z")
      },
      {
        actorId: "telegram:101",
        scope: "project-1",
        kind: "admin_command",
        occurredAt: new Date("2026-06-12T11:59:50.000Z")
      }
    ]
  });

  assert.equal(decision.allowed, false);
  assert.equal(decision.remaining, 0);
  assert.equal(decision.resetAt.toISOString(), "2026-06-12T12:00:10.000Z");
});

test("confirmation requires owner approval for production deployment", () => {
  const decision = evaluateConfirmation({
    actionId: "deploy-production",
    kind: "deployment",
    actorId: "telegram:101",
    target: "production",
    riskLevel: "high",
    deployment: true,
    confirmedActionIds: [],
    ownerApprovedDeployment: false
  });

  assert.equal(decision.status, "owner_approval_required");
  assert.equal(decision.approvalBoundary, "production_deployment");
});

test("confirmation requires explicit confirmation for destructive admin actions", () => {
  const blocked = evaluateConfirmation({
    actionId: "delete-project-1",
    kind: "admin_command",
    actorId: "telegram:101",
    target: "project-1",
    riskLevel: "high",
    destructive: true,
    confirmedActionIds: [],
    ownerApprovedDeployment: false
  });
  assert.equal(blocked.status, "confirmation_required");
  assert.equal(blocked.requiredConfirmation, "confirm:delete-project-1");

  const allowed = evaluateConfirmation({
    actionId: "delete-project-1",
    kind: "admin_command",
    actorId: "telegram:101",
    target: "project-1",
    riskLevel: "high",
    destructive: true,
    confirmedActionIds: ["delete-project-1"],
    ownerApprovedDeployment: false
  });
  assert.equal(allowed.status, "allowed");
});

test("audit journey assessment reports missing traceability links", () => {
  const assessment = assessAuditJourney({
    goalId: "goal-1",
    rawIntentRecordIds: ["intent-raw-1"],
    approvedIntentRecordIds: ["intent-approval-1"],
    planIds: ["plan-1"],
    taskIds: ["task-1"],
    executionIds: [],
    validationReportIds: ["validation-1"],
    reportIds: []
  });

  assert.equal(assessment.complete, false);
  assert.deepEqual(assessment.missing, ["executions", "completion reports"]);
  assert.ok(assessment.evidence.includes("raw intent: intent-raw-1"));
});

test("structured logs redact secret-like keys and values", () => {
  const log = createStructuredLog({
    level: "info",
    event: "telegram_webhook",
    message: "Webhook handled",
    at: new Date("2026-06-12T12:00:00.000Z"),
    actorId: "telegram:101",
    correlationId: "corr-1",
    fields: {
      telegramBotToken: "123:secret",
      authorization: "Bearer abc.def",
      nested: {
        databaseUrl: "postgres://user:pass@example.test/db",
        safe: "kept"
      }
    }
  });

  assert.equal(log.fields.telegramBotToken, "[REDACTED]");
  assert.equal(log.fields.authorization, "[REDACTED]");
  assert.deepEqual(log.fields.nested, {
    databaseUrl: "[REDACTED]",
    safe: "kept"
  });
});

test("backup export manifest contains references and redaction notice", () => {
  const manifest = createBackupExportManifest({
    exportId: "export-1",
    projectId: "project-1",
    createdAt: new Date("2026-06-12T12:00:00.000Z"),
    goals: ["goal-1", "goal-1"],
    tasks: ["task-1"],
    executions: ["execution-1"],
    artifacts: ["implementation-goals/GOAL-10-hardening-deployment.validation-report.md"],
    decisions: ["decision-1"],
    events: ["event-1"]
  });

  assert.deepEqual(manifest.goals, ["goal-1"]);
  assert.equal(manifest.redacted, true);
  assert.match(manifest.retentionNote, /secrets and raw production data are excluded/);
  assert.ok(manifest.evidence.includes("1 executions"));
});

test("deployment readiness blocks without smoke test and rollback evidence", () => {
  const summary = summarizeDeploymentReadiness({
    productionTarget: "alfares",
    deploymentApprovalGranted: false,
    rollbackPlanRef: undefined,
    smokeTestRef: undefined,
    unresolvedBlockers: [],
    validationCommands: [{ command: "npm test", status: "passed", summary: "ok" }]
  });

  assert.equal(summary.status, "blocked");
  assert.equal(summary.ownerApprovalRequired, true);
  assert.ok(summary.blockers.includes("Rollback plan is missing."));
  assert.ok(summary.blockers.includes("Smoke test evidence is missing."));
});

test("deployment readiness can be ready for owner approval without deploying", () => {
  const summary = summarizeDeploymentReadiness({
    productionTarget: "alfares",
    deploymentApprovalGranted: false,
    rollbackPlanRef: "docs/DEPLOYMENT_RUNBOOK.md#rollback",
    smokeTestRef: "scripts/smoke_test.sh local",
    unresolvedBlockers: [],
    validationCommands: [
      { command: "npm test", status: "passed", summary: "ok" },
      { command: "deployment_readiness_gate", status: "passed", summary: "ok" }
    ]
  });

  assert.equal(summary.status, "ready_for_owner_approval");
  assert.equal(summary.ownerApprovalRequired, true);
  assert.deepEqual(summary.failedCommands, []);
});

test("smoke test summary requires GoalKeeper health response", () => {
  const passed = summarizeSmokeTest({
    targetUrl: "http://127.0.0.1:3000/health",
    healthStatus: 200,
    responseService: "goalkeeper",
    responseStatus: "ok",
    checkedAt: new Date("2026-06-12T12:00:00.000Z")
  });
  assert.equal(passed.status, "passed");
  assert.ok(passed.evidence.includes("service=goalkeeper"));

  const failed = summarizeSmokeTest({
    targetUrl: "http://127.0.0.1:3000/health",
    healthStatus: 500,
    error: "connection refused",
    checkedAt: new Date("2026-06-12T12:00:00.000Z")
  });
  assert.equal(failed.status, "failed");
  assert.match(failed.recommendation, /Do not deploy/);
});
