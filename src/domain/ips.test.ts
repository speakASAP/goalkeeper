import assert from "node:assert/strict";
import { test } from "node:test";
import { InMemoryEventWriter } from "./events.js";
import {
  createCodingPromptRecord,
  createContextPackageRecord,
  readProjectIpsSettings,
  runPreCodingGate
} from "./ips.js";
import { DomainInvariantError } from "./lifecycle.js";
import type { Goal, IpsArtifact, Plan, Project, Task } from "./types.js";

const now = new Date("2026-06-12T10:00:00.000Z");
const context = { actor: "test-agent", source: "node-test", now };

function baseProject(overrides: Partial<Project> = {}): Project {
  return {
    id: "project-1",
    slug: "goalkeeper",
    name: "GoalKeeper",
    preferredExecutors: ["codex-cli"],
    commandPresets: {},
    ipsEnabled: true,
    ipsRoot: "/repo/ips",
    ipsSettings: {
      visionDoc: "01_vision/VISION.md",
      goalImpactDir: "22_goal_impact",
      tasksDir: "11_tasks",
      executionPlansDir: "21_execution_plans",
      contextPackagesDir: "13_context_packages",
      promptsDir: "14_prompts",
      validationDir: "12_validation",
      projectInvariantsDoc: "17_governance/PROJECT_INVARIANTS.md",
      auditCommands: ["python3 scripts/pre_coding_gate.py --root ."],
      operationalGates: ["pre-coding"],
      sensitiveDataClassification: "synthetic local development data",
      contractSchemaImpact: "TypeScript domain contracts only",
      replayDeterminismImpact: "Deterministic for explicit inputs"
    },
    overnightModeEnabled: false,
    concurrencyLimit: 1,
    status: "active",
    defaultApprovalMode: "manual",
    riskLevel: "medium",
    createdAt: now,
    updatedAt: now,
    ...overrides
  };
}

function baseGoal(overrides: Partial<Goal> = {}): Goal {
  return {
    id: "goal-1",
    projectId: "project-1",
    title: "Implement IPS gates",
    rawIntent: "Prevent coding without IPS traceability",
    normalizedIntent: "Add fail-closed IPS gates",
    status: "active",
    priority: 1,
    successCriteria: ["Coding tasks fail closed without IPS artifacts"],
    constraints: ["Telegram-first", "IPS mandatory"],
    nonGoals: ["Executor startup"],
    assumptions: [],
    completionPct: 0,
    createdBy: "owner",
    createdAt: now,
    updatedAt: now,
    ...overrides
  };
}

function basePlan(overrides: Partial<Plan> = {}): Plan {
  return {
    id: "plan-1",
    goalId: "goal-1",
    version: 1,
    status: "approved",
    summary: "Add IPS gate enforcement",
    createdByAgent: "planner",
    createdAt: now,
    approvedAt: now,
    approvedBy: "owner",
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
    payload: {},
    acceptanceCriteria: ["IPS gate tests pass"],
    dependsOnTaskIds: [],
    approvalRequired: false,
    idempotencyKey: "goal-1:plan-1:step-1",
    ipsGateStatus: "pending",
    ipsArtifactIds: [],
    intentBundleSnapshot: {
      goalId: "goal-1",
      planId: "plan-1",
      planVersion: 1,
      planStepId: "step-1",
      normalizedIntent: "Add fail-closed IPS gates",
      constraints: ["IPS mandatory"],
      nonGoals: ["Executor startup"],
      successCriteria: ["Coding tasks fail closed without IPS artifacts"],
      stepAcceptanceCriteria: ["IPS gate tests pass"]
    },
    attempt: 0,
    maxAttempts: 3,
    createdAt: now,
    ...overrides
  };
}

function artifact(kind: IpsArtifact["kind"], overrides: Partial<IpsArtifact> = {}): IpsArtifact {
  return {
    id: `${kind}-1`,
    projectId: "project-1",
    goalId: "goal-1",
    taskId: kind === "goal_impact" ? undefined : "task-1",
    kind,
    path: `ips/${kind}.md`,
    status: "approved",
    source: "test",
    summary: `${kind} artifact`,
    missingMarkers: [],
    upstreamArtifactIds: [],
    createdAt: now,
    updatedAt: now,
    ...overrides
  };
}

function upstreamArtifacts(overrides: Partial<Record<IpsArtifact["kind"], Partial<IpsArtifact>>> = {}): IpsArtifact[] {
  return [
    artifact("goal_impact", overrides.goal_impact),
    artifact("task_doc", overrides.task_doc),
    artifact("execution_plan", overrides.execution_plan)
  ];
}

const gateEvidence = [
  {
    command: "python3 scripts/pre_coding_gate.py --root .",
    status: "passed" as const,
    summary: "Pre-coding gate passed",
    reportPath: "reports/validation/ips-pre-coding-gate.json",
    exitCode: 0
  }
];

test("project IPS settings require enabled IPS and explicit project paths", () => {
  const settings = readProjectIpsSettings(baseProject());
  assert.equal(settings.ipsRoot, "/repo/ips");
  assert.deepEqual(settings.auditCommands, ["python3 scripts/pre_coding_gate.py --root ."]);

  assert.throws(() => readProjectIpsSettings(baseProject({ ipsEnabled: false })), /enabled/);
  assert.throws(() => readProjectIpsSettings(baseProject({ ipsRoot: undefined })), /IPS root/);
  assert.throws(
    () =>
      readProjectIpsSettings(
        baseProject({
          ipsSettings: {
            ...baseProject().ipsSettings,
            auditCommands: []
          }
        })
      ),
    /auditCommands/
  );
});

test("missing upstream traceability blocks coding and creates an IPS blocker", () => {
  const events = new InMemoryEventWriter();
  const result = runPreCodingGate({
    project: baseProject(),
    goal: baseGoal(),
    plan: basePlan(),
    task: baseTask({ intentBundleSnapshot: undefined }),
    artifacts: [],
    gateEvidence: [],
    ids: { validationReportId: "validation-1", blockerId: "blocker-1" },
    eventWriter: events,
    context
  });

  assert.equal(result.status, "failed");
  assert.equal(result.task.status, "blocked");
  assert.equal(result.task.ipsGateStatus, "failed");
  assert.equal(result.blocker?.type, "ips_gate_failed");
  assert.ok(result.reasons.some((reason) => reason.includes("intent bundle")));
  assert.ok(result.reasons.some((reason) => reason.includes("goal_impact")));
  assert.equal(result.validationArtifact?.status, "failed");
  assert.ok(events.list().some((event) => event.type === "ips.pre_coding_gate_checked"));
});

test("draft or incomplete execution-critical artifacts block coding", () => {
  const events = new InMemoryEventWriter();
  const result = runPreCodingGate({
    project: baseProject(),
    goal: baseGoal(),
    plan: basePlan(),
    task: baseTask({ contextPackageId: "context_package-1", codingPromptId: "coding_prompt-1" }),
    artifacts: [
      ...upstreamArtifacts({
        execution_plan: { status: "draft" }
      }),
      artifact("context_package"),
      artifact("coding_prompt", { missingMarkers: ["scope requires owner approval"] })
    ],
    gateEvidence,
    ids: { validationReportId: "validation-1", blockerId: "blocker-1" },
    eventWriter: events,
    context
  });

  assert.equal(result.status, "failed");
  assert.ok(result.reasons.some((reason) => reason.includes("not approved")));
  assert.ok(result.reasons.some((reason) => reason.includes("unresolved missing markers")));
  assert.equal(result.blocker?.status, "open");
});

test("context package records link task, goal, plan, and approved upstream artifacts", () => {
  const events = new InMemoryEventWriter();
  const result = createContextPackageRecord({
    project: baseProject(),
    goal: baseGoal(),
    plan: basePlan(),
    task: baseTask(),
    artifacts: upstreamArtifacts(),
    id: "context-package-1",
    path: "13_context_packages/task-1.md",
    eventWriter: events,
    context
  });

  assert.equal(result.artifact.kind, "context_package");
  assert.equal(result.artifact.taskId, "task-1");
  assert.deepEqual(result.artifact.upstreamArtifactIds, ["goal_impact-1", "task_doc-1", "execution_plan-1"]);
  assert.equal(result.task.contextPackageId, "context-package-1");
  assert.ok(result.task.ipsArtifactIds.includes("context-package-1"));
  assert.ok(events.list().some((event) => event.type === "ips.context_package_created"));
});

test("coding prompt records require an approved execution plan and linked context package", () => {
  const events = new InMemoryEventWriter();
  const contextPackage = artifact("context_package", {
    id: "context-package-1",
    upstreamArtifactIds: ["goal_impact-1", "task_doc-1", "execution_plan-1"]
  });

  assert.throws(
    () =>
      createCodingPromptRecord({
        project: baseProject(),
        goal: baseGoal(),
        plan: basePlan(),
        task: baseTask({ contextPackageId: "context-package-1" }),
        artifacts: [...upstreamArtifacts({ execution_plan: { status: "draft" } }), contextPackage],
        id: "coding-prompt-1",
        path: "14_prompts/task-1.md",
        eventWriter: events,
        context
      }),
    /not approved|approved execution plan/
  );

  const result = createCodingPromptRecord({
    project: baseProject(),
    goal: baseGoal(),
    plan: basePlan(),
    task: baseTask({ contextPackageId: "context-package-1", ipsArtifactIds: ["context-package-1"] }),
    artifacts: [...upstreamArtifacts(), contextPackage],
    id: "coding-prompt-1",
    path: "14_prompts/task-1.md",
    eventWriter: events,
    context
  });

  assert.equal(result.artifact.kind, "coding_prompt");
  assert.equal(result.task.codingPromptId, "coding-prompt-1");
  assert.ok(result.artifact.upstreamArtifactIds.includes("execution_plan-1"));
  assert.ok(result.artifact.upstreamArtifactIds.includes("context-package-1"));
  assert.ok(events.list().some((event) => event.type === "ips.coding_prompt_created"));
});

test("complete IPS chain passes and stores validation evidence", () => {
  const events = new InMemoryEventWriter();
  const base = {
    project: baseProject(),
    goal: baseGoal(),
    plan: basePlan(),
    task: baseTask(),
    eventWriter: events,
    context
  };
  const contextPackage = createContextPackageRecord({
    ...base,
    artifacts: upstreamArtifacts(),
    id: "context_package-1",
    path: "13_context_packages/task-1.md"
  });
  const codingPrompt = createCodingPromptRecord({
    ...base,
    task: contextPackage.task,
    artifacts: [...upstreamArtifacts(), contextPackage.artifact],
    id: "coding_prompt-1",
    path: "14_prompts/task-1.md"
  });
  const result = runPreCodingGate({
    ...base,
    task: codingPrompt.task,
    artifacts: [...upstreamArtifacts(), contextPackage.artifact, codingPrompt.artifact],
    gateEvidence,
    ids: { validationReportId: "validation_report-1", blockerId: "blocker-1" }
  });

  assert.equal(result.status, "passed");
  assert.equal(result.task.ipsGateStatus, "passed");
  assert.equal(result.validationArtifact?.kind, "validation_report");
  assert.equal(result.validationArtifact?.status, "used");
  assert.equal(result.blocker, undefined);
  assert.ok(result.task.ipsArtifactIds.includes("validation_report-1"));
});

test("non-coding tasks do not require IPS pre-coding artifacts", () => {
  const events = new InMemoryEventWriter();
  const result = runPreCodingGate({
    project: baseProject(),
    goal: baseGoal(),
    plan: basePlan(),
    task: baseTask({ type: "verify", ipsGateStatus: "pending" }),
    artifacts: [],
    gateEvidence: [],
    ids: { validationReportId: "validation-1", blockerId: "blocker-1" },
    eventWriter: events,
    context
  });

  assert.equal(result.status, "not_required");
  assert.equal(result.task.ipsGateStatus, "not_required");
  assert.equal(result.blocker, undefined);
});
