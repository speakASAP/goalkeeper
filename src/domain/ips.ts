import type { EventWriter } from "./events.js";
import {
  DomainInvariantError,
  blockCodingTaskForIpsFailure,
  type LifecycleContext
} from "./lifecycle.js";
import type { Blocker, Goal, IpsArtifact, IpsArtifactKind, JsonValue, Plan, Project, Task } from "./types.js";

export interface ProjectIpsSettings {
  ipsRoot: string;
  visionDoc: string;
  goalImpactDir: string;
  tasksDir: string;
  executionPlansDir: string;
  contextPackagesDir: string;
  promptsDir: string;
  validationDir: string;
  projectInvariantsDoc: string;
  auditCommands: string[];
  operationalGates: string[];
  sensitiveDataClassification: string;
  contractSchemaImpact: string;
  replayDeterminismImpact: string;
}

export interface GateCommandEvidence {
  command: string;
  status: "passed" | "failed" | "not_applicable";
  summary: string;
  reportPath?: string;
  exitCode?: number;
}

export interface ArtifactRecordIds {
  contextPackageId: string;
  codingPromptId: string;
  validationReportId: string;
}

export interface PreCodingGateIds {
  validationReportId: string;
  blockerId: string;
}

export interface PreCodingGateResult {
  task: Task;
  status: "not_required" | "passed" | "failed";
  validationArtifact?: IpsArtifact;
  blocker?: Blocker;
  reasons: string[];
}

const COMPLETE_STATUSES = new Set(["approved", "used"]);
const EXECUTION_PLAN_READY_STATUSES = new Set(["approved", "used"]);
const REQUIRED_SETTINGS: Array<keyof Omit<ProjectIpsSettings, "ipsRoot">> = [
  "visionDoc",
  "goalImpactDir",
  "tasksDir",
  "executionPlansDir",
  "contextPackagesDir",
  "promptsDir",
  "validationDir",
  "projectInvariantsDoc",
  "auditCommands",
  "operationalGates",
  "sensitiveDataClassification",
  "contractSchemaImpact",
  "replayDeterminismImpact"
];

export function readProjectIpsSettings(project: Project): ProjectIpsSettings {
  if (!project.ipsEnabled) {
    throw new DomainInvariantError("Project IPS settings must be enabled before coding tasks can run");
  }

  const ipsRoot = requireProjectPath(project.ipsRoot, "Project IPS root is required");
  const settings = project.ipsSettings;
  const parsed: ProjectIpsSettings = {
    ipsRoot,
    visionDoc: requireSettingText(settings, "visionDoc"),
    goalImpactDir: requireSettingText(settings, "goalImpactDir"),
    tasksDir: requireSettingText(settings, "tasksDir"),
    executionPlansDir: requireSettingText(settings, "executionPlansDir"),
    contextPackagesDir: requireSettingText(settings, "contextPackagesDir"),
    promptsDir: requireSettingText(settings, "promptsDir"),
    validationDir: requireSettingText(settings, "validationDir"),
    projectInvariantsDoc: requireSettingText(settings, "projectInvariantsDoc"),
    auditCommands: requireSettingList(settings, "auditCommands"),
    operationalGates: requireSettingList(settings, "operationalGates"),
    sensitiveDataClassification: requireSettingText(settings, "sensitiveDataClassification"),
    contractSchemaImpact: requireSettingText(settings, "contractSchemaImpact"),
    replayDeterminismImpact: requireSettingText(settings, "replayDeterminismImpact")
  };

  for (const key of REQUIRED_SETTINGS) {
    const value = parsed[key];
    if (Array.isArray(value) ? value.length === 0 : !value.trim()) {
      throw new DomainInvariantError(`Project IPS setting is incomplete: ${key}`);
    }
  }

  return parsed;
}

export function createContextPackageRecord(options: {
  project: Project;
  goal: Goal;
  plan: Plan;
  task: Task;
  artifacts: IpsArtifact[];
  id: string;
  path: string;
  eventWriter: EventWriter;
  context: LifecycleContext;
}): { task: Task; artifact: IpsArtifact } {
  assertCodingTraceability(options.project, options.goal, options.plan, options.task);
  readProjectIpsSettings(options.project);

  const upstreamArtifacts = [
    requireCompleteArtifact(options.artifacts, "goal_impact", options),
    requireCompleteArtifact(options.artifacts, "task_doc", options),
    requireExecutionPlanArtifact(options.artifacts, options)
  ];
  const now = options.context.now ?? new Date();
  const artifact = createArtifact({
    id: options.id,
    project: options.project,
    goal: options.goal,
    task: options.task,
    kind: "context_package",
    path: options.path,
    status: "approved",
    source: "goalkeeper-ips-service",
    summary: `Context package for task ${options.task.id} generated from approved IPS artifacts`,
    upstreamArtifactIds: upstreamArtifacts.map((artifact) => artifact.id),
    now
  });
  const task = linkTaskArtifact(
    {
      ...options.task,
      contextPackageId: artifact.id
    },
    artifact.id
  );

  options.eventWriter.append({
    type: "ips.context_package_created",
    projectId: options.project.id,
    goalId: options.goal.id,
    taskId: options.task.id,
    actor: options.context.actor,
    source: options.context.source,
    payload: {
      artifactId: artifact.id,
      upstreamArtifactIds: artifact.upstreamArtifactIds
    }
  });

  return { task, artifact };
}

export function createCodingPromptRecord(options: {
  project: Project;
  goal: Goal;
  plan: Plan;
  task: Task;
  artifacts: IpsArtifact[];
  id: string;
  path: string;
  eventWriter: EventWriter;
  context: LifecycleContext;
}): { task: Task; artifact: IpsArtifact } {
  assertCodingTraceability(options.project, options.goal, options.plan, options.task);
  readProjectIpsSettings(options.project);

  const executionPlan = requireExecutionPlanArtifact(options.artifacts, options);
  const contextPackage = requireCompleteArtifact(options.artifacts, "context_package", options);
  if (options.task.contextPackageId !== contextPackage.id) {
    throw new DomainInvariantError("Coding prompt generation requires the task's linked context package");
  }

  const now = options.context.now ?? new Date();
  const artifact = createArtifact({
    id: options.id,
    project: options.project,
    goal: options.goal,
    task: options.task,
    kind: "coding_prompt",
    path: options.path,
    status: "approved",
    source: "goalkeeper-ips-service",
    summary: `Coding prompt for task ${options.task.id} generated from approved execution plan ${executionPlan.id}`,
    upstreamArtifactIds: uniqueIds([executionPlan.id, contextPackage.id, ...contextPackage.upstreamArtifactIds]),
    now
  });
  const task = linkTaskArtifact(
    {
      ...options.task,
      codingPromptId: artifact.id
    },
    artifact.id
  );

  options.eventWriter.append({
    type: "ips.coding_prompt_created",
    projectId: options.project.id,
    goalId: options.goal.id,
    taskId: options.task.id,
    actor: options.context.actor,
    source: options.context.source,
    payload: {
      artifactId: artifact.id,
      executionPlanArtifactId: executionPlan.id,
      contextPackageArtifactId: contextPackage.id
    }
  });

  return { task, artifact };
}

export function runPreCodingGate(options: {
  project: Project;
  goal: Goal;
  plan: Plan;
  task: Task;
  artifacts: IpsArtifact[];
  gateEvidence: GateCommandEvidence[];
  ids: PreCodingGateIds;
  eventWriter: EventWriter;
  context: LifecycleContext;
}): PreCodingGateResult {
  if (!isCodingTask(options.task)) {
    return {
      task: {
        ...options.task,
        ipsGateStatus: "not_required"
      },
      status: "not_required",
      reasons: []
    };
  }

  const reasons = collectPreCodingGateFailures(options);
  const passed = reasons.length === 0;
  const validationArtifact = createGateValidationArtifact({
    ...options,
    id: options.ids.validationReportId,
    status: passed ? "used" : "failed",
    reasons
  });
  const taskWithEvidence = linkTaskArtifact(options.task, validationArtifact.id);

  options.eventWriter.append({
    type: "ips.pre_coding_gate_checked",
    projectId: options.project.id,
    goalId: options.goal.id,
    taskId: options.task.id,
    actor: options.context.actor,
    source: options.context.source,
    payload: {
      status: passed ? "passed" : "failed",
      validationArtifactId: validationArtifact.id,
      reasons
    }
  });

  if (passed) {
    return {
      task: {
        ...taskWithEvidence,
        ipsGateStatus: "passed"
      },
      status: "passed",
      validationArtifact,
      reasons: []
    };
  }

  const blocker = createIpsBlocker({
    id: options.ids.blockerId,
    project: options.project,
    goal: options.goal,
    task: options.task,
    reasons,
    now: options.context.now ?? new Date()
  });
  const blockedTask = blockCodingTaskForIpsFailure(taskWithEvidence, blocker, options.eventWriter, options.context);

  return {
    task: blockedTask,
    status: "failed",
    validationArtifact,
    blocker,
    reasons
  };
}

function collectPreCodingGateFailures(options: {
  project: Project;
  goal: Goal;
  plan: Plan;
  task: Task;
  artifacts: IpsArtifact[];
  gateEvidence: GateCommandEvidence[];
}): string[] {
  const reasons: string[] = [];

  try {
    readProjectIpsSettings(options.project);
  } catch (error) {
    if (error instanceof DomainInvariantError) {
      reasons.push(error.message);
    } else {
      throw error;
    }
  }

  collectTraceabilityFailures(options, reasons);
  collectArtifactFailures(options, reasons);
  collectGateEvidenceFailures(options.gateEvidence, reasons);

  if (options.task.acceptanceCriteria.length === 0) {
    reasons.push("Coding task requires explicit validation criteria");
  }

  return reasons;
}

function collectTraceabilityFailures(
  options: { project: Project; goal: Goal; plan: Plan; task: Task },
  reasons: string[]
): void {
  if (options.goal.projectId !== options.project.id) {
    reasons.push("Goal must belong to the project under IPS gate evaluation");
  }

  if (options.task.projectId !== options.project.id || options.task.goalId !== options.goal.id) {
    reasons.push("Task must trace to the evaluated project and goal");
  }

  if (options.plan.goalId !== options.goal.id || options.plan.status !== "approved") {
    reasons.push("Coding task requires an approved plan linked to the goal");
  }

  const snapshot = options.task.intentBundleSnapshot ?? {};
  if (snapshot.goalId !== options.goal.id || snapshot.planId !== options.plan.id || snapshot.planStepId !== options.task.planStepId) {
    reasons.push("Coding task is missing upstream intent bundle traceability");
  }

  if (!Array.isArray(snapshot.successCriteria) || snapshot.successCriteria.length === 0) {
    reasons.push("Coding task intent bundle requires goal success criteria");
  }
}

function collectArtifactFailures(
  options: { project: Project; goal: Goal; plan: Plan; task: Task; artifacts: IpsArtifact[] },
  reasons: string[]
): void {
  for (const kind of ["goal_impact", "task_doc", "execution_plan", "context_package", "coding_prompt"] as const) {
    const artifact =
      kind === "context_package" && options.task.contextPackageId
        ? options.artifacts.find((candidate) => candidate.id === options.task.contextPackageId && candidate.kind === kind)
        : kind === "coding_prompt" && options.task.codingPromptId
          ? options.artifacts.find((candidate) => candidate.id === options.task.codingPromptId && candidate.kind === kind)
          : options.artifacts.find((candidate) => candidate.kind === kind);

    if (!artifact) {
      reasons.push(`Missing required IPS artifact: ${kind}`);
      continue;
    }

    try {
      assertArtifactUsable(artifact, kind, options);
    } catch (error) {
      if (error instanceof DomainInvariantError) {
        reasons.push(error.message);
      } else {
        throw error;
      }
    }
  }
}

function collectGateEvidenceFailures(evidence: GateCommandEvidence[], reasons: string[]): void {
  if (evidence.length === 0) {
    reasons.push("Pre-coding gate command evidence is required");
    return;
  }

  for (const item of evidence) {
    if (!item.command.trim()) {
      reasons.push("Gate command evidence requires a command");
    }

    if (!item.summary.trim()) {
      reasons.push(`Gate command evidence requires a summary: ${item.command || "unknown command"}`);
    }

    if (item.status === "failed") {
      reasons.push(`Gate command failed: ${item.command}`);
    }
  }
}

function createGateValidationArtifact(options: {
  project: Project;
  goal: Goal;
  task: Task;
  artifacts: IpsArtifact[];
  gateEvidence: GateCommandEvidence[];
  id: string;
  status: "used" | "failed";
  reasons: string[];
  context: LifecycleContext;
}): IpsArtifact {
  const now = options.context.now ?? new Date();
  const upstreamArtifactIds = options.artifacts
    .filter((artifact) => artifact.taskId === options.task.id || artifact.goalId === options.goal.id)
    .map((artifact) => artifact.id);
  const path = `${readValidationDir(options.project)}/${options.id}.md`;
  return createArtifact({
    id: options.id,
    project: options.project,
    goal: options.goal,
    task: options.task,
    kind: "validation_report",
    path,
    status: options.status,
    source: options.gateEvidence.map((item) => `${item.command}: ${item.status}`).join("; ") || "goalkeeper-ips-service",
    summary: options.status === "used" ? "Pre-coding gate passed" : `Pre-coding gate failed: ${options.reasons.join("; ")}`,
    upstreamArtifactIds: uniqueIds(upstreamArtifactIds),
    now
  });
}

function createIpsBlocker(options: {
  id: string;
  project: Project;
  goal: Goal;
  task: Task;
  reasons: string[];
  now: Date;
}): Blocker {
  return {
    id: options.id,
    projectId: options.project.id,
    goalId: options.goal.id,
    taskId: options.task.id,
    type: "ips_gate_failed",
    reason: options.reasons.join("; "),
    question: "Resolve the IPS pre-coding blocker before starting this coding task.",
    options: ["Provide missing IPS artifact", "Approve completed artifact", "Revise task scope"],
    recommendation: "Complete the IPS chain and rerun the pre-coding gate.",
    impact: "Coding executor cannot run until the IPS gate passes.",
    status: "open",
    createdAt: options.now
  };
}

function requireCompleteArtifact(
  artifacts: IpsArtifact[],
  kind: IpsArtifactKind,
  options: { project: Project; goal: Goal; task: Task }
): IpsArtifact {
  const artifact = artifacts.find((candidate) => candidate.kind === kind);
  if (!artifact) {
    throw new DomainInvariantError(`Missing required IPS artifact: ${kind}`);
  }

  assertArtifactUsable(artifact, kind, options);
  return artifact;
}

function requireExecutionPlanArtifact(
  artifacts: IpsArtifact[],
  options: { project: Project; goal: Goal; task: Task }
): IpsArtifact {
  const artifact = requireCompleteArtifact(artifacts, "execution_plan", options);
  if (!EXECUTION_PLAN_READY_STATUSES.has(artifact.status)) {
    throw new DomainInvariantError("Coding prompt generation requires an approved execution plan");
  }

  return artifact;
}

function assertArtifactUsable(
  artifact: IpsArtifact,
  kind: IpsArtifactKind,
  options: { project: Project; goal: Goal; task: Task }
): void {
  if (artifact.projectId !== options.project.id || artifact.goalId !== options.goal.id) {
    throw new DomainInvariantError(`IPS artifact has broken project or goal traceability: ${artifact.id}`);
  }

  if (kind !== "goal_impact" && artifact.taskId !== options.task.id) {
    throw new DomainInvariantError(`IPS artifact must link to the coding task: ${artifact.id}`);
  }

  if (!COMPLETE_STATUSES.has(artifact.status)) {
    throw new DomainInvariantError(`IPS artifact is not approved for coding: ${artifact.id}`);
  }

  if (artifact.missingMarkers.length > 0) {
    throw new DomainInvariantError(`IPS artifact has unresolved missing markers: ${artifact.id}`);
  }

  if (!artifact.path.trim()) {
    throw new DomainInvariantError(`IPS artifact requires a path: ${artifact.id}`);
  }
}

function assertCodingTraceability(project: Project, goal: Goal, plan: Plan, task: Task): void {
  const reasons: string[] = [];
  collectTraceabilityFailures({ project, goal, plan, task }, reasons);
  if (reasons.length > 0) {
    throw new DomainInvariantError(reasons.join("; "));
  }
}

function createArtifact(input: {
  id: string;
  project: Project;
  goal: Goal;
  task: Task;
  kind: IpsArtifactKind;
  path: string;
  status: "approved" | "used" | "failed";
  source: string;
  summary: string;
  upstreamArtifactIds: string[];
  now: Date;
}): IpsArtifact {
  return {
    id: requireText(input.id, "IPS artifact ID is required"),
    projectId: input.project.id,
    goalId: input.goal.id,
    taskId: input.task.id,
    kind: input.kind,
    path: requireText(input.path, "IPS artifact path is required"),
    status: input.status,
    source: requireText(input.source, "IPS artifact source is required"),
    summary: requireText(input.summary, "IPS artifact summary is required"),
    missingMarkers: [],
    upstreamArtifactIds: uniqueIds(input.upstreamArtifactIds),
    createdAt: input.now,
    updatedAt: input.now
  };
}

function linkTaskArtifact(task: Task, artifactId: string): Task {
  return {
    ...task,
    ipsArtifactIds: uniqueIds([...task.ipsArtifactIds, artifactId])
  };
}

function readValidationDir(project: Project): string {
  const value = project.ipsSettings.validationDir;
  return typeof value === "string" && value.trim() ? value.trim() : "reports/validation";
}

function requireProjectPath(value: string | undefined, message: string): string {
  return requireText(value ?? "", message);
}

function requireSettingText(settings: Record<string, JsonValue>, key: keyof ProjectIpsSettings): string {
  const value = settings[key];
  if (typeof value !== "string") {
    throw new DomainInvariantError(`Project IPS setting is required: ${key}`);
  }

  return requireText(value, `Project IPS setting is required: ${key}`);
}

function requireSettingList(settings: Record<string, JsonValue>, key: keyof ProjectIpsSettings): string[] {
  const value = settings[key];
  if (!Array.isArray(value) || !value.every((item) => typeof item === "string" && item.trim())) {
    throw new DomainInvariantError(`Project IPS setting list is required: ${key}`);
  }

  return value.map((item) => String(item).trim());
}

function requireText(value: string, message: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new DomainInvariantError(message);
  }

  return trimmed;
}

function uniqueIds(values: string[]): string[] {
  return [...new Set(values.filter((value) => value.trim()))];
}

function isCodingTask(task: Task): boolean {
  return task.type === "code" || task.type === "coding";
}
