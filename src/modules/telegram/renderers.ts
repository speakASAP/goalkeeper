import type { TelegramCallbackDispatchResult } from "./callbacks.js";
import type { TelegramCommandParseResult, TelegramCommandName, ParsedTelegramCommand } from "./commands.js";
import type { TelegramIntentCaptureResult } from "./intent-capture.js";
import type { TelegramRenderedMessage } from "./types.js";
import type { Plan, PlanStep } from "../../domain/types.js";
import type { GoalCompletionReport, TaskValidationReport } from "../../domain/validation.js";
import type {
  AgentStatusView,
  BlockerGroup,
  ExecutorStatusView,
  OvernightDigest,
  OvernightPolicy,
  TaskLogSummary
} from "../../domain/overnight.js";
import type {
  AuditJourneyAssessment,
  BackupExportManifest,
  ConfirmationDecision,
  DeploymentReadinessSummary,
  SmokeTestSummary
} from "../../domain/hardening.js";

export function renderUnauthorized(): TelegramRenderedMessage {
  return {
    text: "Access denied. This GoalKeeper bot is limited to approved Telegram users."
  };
}

export function renderStart(): TelegramRenderedMessage {
  return {
    text: [
      "GoalKeeper is ready.",
      "",
      "Use /goal <text> to capture a goal, /projects to view projects, or /status for the current state."
    ].join("\n")
  };
}

export function renderCommand(command: ParsedTelegramCommand): TelegramRenderedMessage {
  switch (command.command) {
    case "start":
      return renderStart();
    case "projects":
      return renderProjectsStub();
    case "new_project":
      return renderNewProjectStub(command.args);
    case "register_project":
      return renderRegisterProjectStub(command.args);
    case "goal":
      return renderGoalCapture(command.args);
    case "goals":
      return renderSimpleStub("Goals", "Goal listing will connect to intent memory and planning in later goals.");
    case "tasks":
      return renderSimpleStub("Tasks", "Task listing will connect after planning creates task records.");
    case "status":
      return renderSimpleStub("Status", "Status reporting is ready for domain services to attach live data.");
    case "blocked":
      return renderSimpleStub("Blocked", "Blocker reporting is ready for IPS and executor blockers.");
    case "overnight":
      return renderSimpleStub(
        "Overnight",
        "Overnight mode can monitor approved work and produce digests. Execution still requires IPS gates and policy."
      );
    case "agents":
      return renderSimpleStub("Agents", "Agent status reporting is ready for live executor activity.");
    case "executors":
      return renderSimpleStub("Executors", "Executor registry status reporting is ready.");
    case "task_log":
      return renderTaskLogUsage(command.args);
    case "admin":
      return renderAdminUsage(command.args);
    case "backup_export":
      return renderBackupExportUsage(command.args);
    case "smoke_test":
      return renderSmokeTestUsage(command.args);
    case "deployment_readiness":
      return renderDeploymentReadinessUsage();
  }
}

export function renderCapturedGoalIntent(result: TelegramIntentCaptureResult): TelegramRenderedMessage {
  return {
    text: [
      "Goal captured as raw intent.",
      "",
      result.rawIntentRecord.content,
      "",
      `Goal: ${result.goal.id}`,
      `Intent record: ${result.rawIntentRecord.id}`,
      "Status: intent ready for owner approval.",
      "",
      "No planning or coding started."
    ].join("\n"),
    buttons: [
      [
        { text: "Approve intent", callbackData: `approve_intent:${result.goal.id}` },
        { text: "Edit", callbackData: `edit_intent:${result.goal.id}` }
      ],
      [
        { text: "Add constraint", callbackData: `add_constraint:${result.goal.id}` },
        { text: "Cancel", callbackData: `cancel_goal:${result.goal.id}` }
      ]
    ]
  };
}

export function renderPlanReview(plan: Plan, steps: PlanStep[]): TelegramRenderedMessage {
  const orderedSteps = [...steps].sort((left, right) => left.index - right.index);

  return {
    text: [
      `Plan v${plan.version}: ${plan.summary}`,
      "",
      ...orderedSteps.map((step) =>
        [
          `${step.index}. ${step.title}`,
          `Type: ${step.type}`,
          `Acceptance: ${step.acceptanceCriteria.join("; ")}`,
          step.dependsOnStepIds.length > 0 ? `Depends on: ${step.dependsOnStepIds.join(", ")}` : "Depends on: none",
          `Risk: ${step.riskLevel}`,
          step.approvalRequired ? "Owner approval required before execution." : "No extra task approval required."
        ].join("\n")
      ),
      "",
      "No tasks will execute until the plan is approved."
    ].join("\n\n"),
    buttons: [
      [
        { text: "Approve plan", callbackData: `approve_plan:${plan.id}` },
        { text: "Regenerate", callbackData: `regenerate_plan:${plan.goalId}` }
      ],
      [
        { text: "Edit", callbackData: `edit_plan:${plan.id}` },
        { text: "Reject", callbackData: `reject_plan:${plan.id}` },
        { text: "Why?", callbackData: `ask_why:${plan.id}` }
      ]
    ]
  };
}

export function renderTaskValidationReport(report: TaskValidationReport): TelegramRenderedMessage {
  const statusLine = report.status === "passed" ? "Task validation passed." : "Task validation failed.";
  const lines = [
    statusLine,
    "",
    `Task: ${report.taskId}`,
    report.executorId ? `Executor: ${report.executorId}` : "Executor: not recorded",
    `Artifacts: ${formatList(report.changedArtifactRefs)}`,
    `Validation: ${formatList(report.validationEvidence)}`,
    `Risks: ${formatList(report.risks)}`,
    `Not done: ${formatList(report.notDone)}`,
    "",
    `Intent: ${report.originalIntent}`,
    `Approved interpretation: ${report.approvedInterpretation}`,
    `Summary: ${report.summary}`
  ];

  return {
    text: lines.join("\n"),
    buttons:
      report.status === "failed"
        ? [
            [
              { text: "Retry", callbackData: `retry_task:${report.taskId}` },
              { text: "Reject", callbackData: `reject_task:${report.taskId}` }
            ]
          ]
        : [[{ text: "Acknowledge", callbackData: `ack_task_report:${report.taskId}` }]]
  };
}

export function renderGoalCompletionReport(report: GoalCompletionReport): TelegramRenderedMessage {
  return {
    text: [
      "Goal completion report.",
      "",
      `Goal: ${report.title}`,
      `Original intent: ${report.originalIntent}`,
      `Final interpretation: ${report.finalInterpretation}`,
      `Completed tasks: ${formatList(report.completedTaskIds)}`,
      `Decisions: ${formatList(report.decisions)}`,
      `Artifacts: ${formatList(report.changedArtifactRefs)}`,
      `Validation: ${formatList(report.validationEvidence)}`,
      `Risks: ${formatList(report.risks)}`,
      `Not done: ${formatList(report.notDone)}`
    ].join("\n"),
    buttons: [[{ text: "Acknowledge", callbackData: `ack_goal_report:${report.goalId}` }]]
  };
}

export function renderOvernightPolicy(policy: OvernightPolicy): TelegramRenderedMessage {
  return {
    text: [
      policy.enabled ? "Overnight mode is enabled." : "Overnight mode is disabled.",
      `Mode: ${policy.mode}`,
      `Max concurrent tasks: ${policy.maxConcurrentTasks}`,
      `Max autonomous risk: ${policy.maxRiskLevel}`,
      `Self-improvement allowed: ${policy.allowSelfImprovement ? "yes, through IPS only" : "no"}`,
      "High-risk, destructive, and deployment work pauses for owner approval."
    ].join("\n")
  };
}

export function renderOvernightDigest(digest: OvernightDigest): TelegramRenderedMessage {
  return {
    text: [
      "Overnight digest.",
      "",
      digest.summary,
      "",
      `Completed: ${formatDigestItems(digest.completed)}`,
      `Failed: ${formatDigestItems(digest.failed)}`,
      `Partial: ${formatDigestItems(digest.partial)}`,
      `Blocked: ${formatDigestItems(digest.blocked)}`,
      `Awaiting owner: ${formatDigestItems(digest.awaitingUser)}`,
      `Validation: ${formatList(digest.validationEvidence)}`,
      `Open blockers: ${formatBlockerGroups(digest.blockerGroups)}`
    ].join("\n")
  };
}

export function renderAgentStatus(agents: AgentStatusView[]): TelegramRenderedMessage {
  return {
    text: [
      "Agents.",
      "",
      agents.length > 0
        ? agents
            .map((agent) =>
              [
                `${agent.agentId}: ${agent.status}`,
                `Tasks: ${formatList(agent.runningTaskIds)}`,
                `Step: ${agent.currentStep}`,
                agent.lastUpdate ? `Last update: ${agent.lastUpdate}` : "Last update: none"
              ].join("\n")
            )
            .join("\n\n")
        : "No agents have active or recent task assignments."
    ].join("\n")
  };
}

export function renderExecutorStatus(executors: ExecutorStatusView[]): TelegramRenderedMessage {
  return {
    text: [
      "Executors.",
      "",
      executors.length > 0
        ? executors
            .map((executor) =>
              [
                `${executor.displayName} (${executor.executorId}): ${executor.status}`,
                `Kind: ${executor.kind}`,
                `Capabilities: ${formatList(executor.capabilities)}`,
                `Max risk: ${executor.maxRiskLevel}`,
                executor.approvalRequired ? "Owner approval required." : "Owner approval not required by executor policy.",
                `Running tasks: ${formatList(executor.runningTaskIds)}`,
                executor.lastExecutionSummary ? `Last summary: ${executor.lastExecutionSummary}` : "Last summary: none"
              ].join("\n")
            )
            .join("\n\n")
        : "No executors are registered."
    ].join("\n")
  };
}

export function renderTaskLogSummary(log: TaskLogSummary): TelegramRenderedMessage {
  return {
    text: [
      `Task log: ${log.taskId}`,
      `Status: ${log.status}`,
      `Artifacts: ${formatList(log.artifactRefs)}`,
      `Validation: ${formatList(log.validationEvidence)}`,
      "",
      log.entries
        .map((entry) => `${entry.at.toISOString()} [${entry.source}/${entry.status}] ${entry.summary}`)
        .join("\n")
    ].join("\n")
  };
}

export function renderConfirmationDecision(decision: ConfirmationDecision): TelegramRenderedMessage {
  const lines = [
    `Action: ${decision.actionId}`,
    `Status: ${formatCommandLikeLabel(decision.status)}`,
    `Reason: ${decision.reason}`
  ];

  if (decision.requiredConfirmation) {
    lines.push(`Required confirmation: ${decision.requiredConfirmation}`);
  }

  if (decision.approvalBoundary) {
    lines.push(`Approval boundary: ${formatCommandLikeLabel(decision.approvalBoundary)}`);
  }

  return { text: lines.join("\n") };
}

export function renderBackupExportManifest(manifest: BackupExportManifest): TelegramRenderedMessage {
  return {
    text: [
      `Backup export: ${manifest.exportId}`,
      `Project: ${manifest.projectId}`,
      `Created: ${manifest.createdAt.toISOString()}`,
      `Goals: ${formatList(manifest.goals)}`,
      `Tasks: ${formatList(manifest.tasks)}`,
      `Executions: ${formatList(manifest.executions)}`,
      `Artifacts: ${formatList(manifest.artifacts)}`,
      `Decisions: ${formatList(manifest.decisions)}`,
      `Events: ${formatList(manifest.events)}`,
      `Evidence: ${formatList(manifest.evidence)}`,
      manifest.retentionNote
    ].join("\n")
  };
}

export function renderAuditJourneyAssessment(assessment: AuditJourneyAssessment): TelegramRenderedMessage {
  return {
    text: [
      `Audit trail: ${assessment.goalId}`,
      assessment.complete ? "Status: complete" : "Status: incomplete",
      `Missing: ${formatList(assessment.missing)}`,
      `Evidence: ${formatList(assessment.evidence)}`
    ].join("\n")
  };
}

export function renderDeploymentReadiness(summary: DeploymentReadinessSummary): TelegramRenderedMessage {
  return {
    text: [
      "Deployment readiness.",
      "",
      `Target: ${summary.productionTarget}`,
      `Status: ${formatCommandLikeLabel(summary.status)}`,
      summary.ownerApprovalRequired
        ? "Production approval: explicit owner approval required."
        : "Production approval: already recorded.",
      `Rollback: ${summary.rollbackPlanRef ?? "missing"}`,
      `Smoke test: ${summary.smokeTestRef ?? "missing"}`,
      `Passed commands: ${formatList(summary.passedCommands)}`,
      `Failed commands: ${formatList(summary.failedCommands)}`,
      `Blockers: ${formatList(summary.blockers)}`,
      `Recommendation: ${summary.recommendation}`
    ].join("\n")
  };
}

export function renderSmokeTestSummary(summary: SmokeTestSummary): TelegramRenderedMessage {
  return {
    text: [
      "Smoke test.",
      "",
      `Target: ${summary.targetUrl}`,
      `Status: ${summary.status}`,
      `Checked: ${summary.checkedAt.toISOString()}`,
      `Evidence: ${formatList(summary.evidence)}`,
      `Recommendation: ${summary.recommendation}`
    ].join("\n")
  };
}

export function renderParseResult(result: TelegramCommandParseResult): TelegramRenderedMessage {
  if (result.kind === "command") {
    return renderCommand(result);
  }

  if (result.kind === "unknown") {
    return {
      text: `Unknown command${result.command ? ` /${result.command}` : ""}. Use /start for available actions.`
    };
  }

  return {
    text: "Send /goal <text> to capture a goal or /start to see available actions."
  };
}

export function renderCallbackResult(result: TelegramCallbackDispatchResult): TelegramRenderedMessage {
  if (result.status === "duplicate") {
    return {
      text: "This Telegram action was already handled."
    };
  }

  if (result.status === "invalid") {
    return {
      text: "This Telegram action is no longer available."
    };
  }

  return {
    text: `Action received: ${formatCommandLikeLabel(result.callback?.action ?? "noop")}.`
  };
}

function renderProjectsStub(): TelegramRenderedMessage {
  return renderSimpleStub("Projects", "Project listing is ready for the persistence service to attach live data.");
}

function renderNewProjectStub(args: string): TelegramRenderedMessage {
  return {
    text: [
      "New project intake is ready.",
      args ? `Draft name: ${args}` : "Next step: provide a project name.",
      "Project creation will be connected to persisted project services in a later goal."
    ].join("\n")
  };
}

function renderRegisterProjectStub(args: string): TelegramRenderedMessage {
  return {
    text: [
      "Project registration intake is ready.",
      args ? `Received: ${args}` : "Usage: /register_project <slug> <path>",
      "Repository registration will be connected to project services in a later goal."
    ].join("\n")
  };
}

function renderTaskLogUsage(args: string): TelegramRenderedMessage {
  return {
    text: args
      ? `Task log lookup is ready for task ${args}. Live logs will show summarized execution evidence only.`
      : "Usage: /task_log <task-id>"
  };
}

function renderAdminUsage(args: string): TelegramRenderedMessage {
  return {
    text: [
      "Admin control is ready.",
      args ? `Requested action: ${args}` : "Usage: /admin <status|confirm action-id|pause project|resume project>",
      "High-risk, destructive, and deployment actions require explicit confirmation and owner approval."
    ].join("\n")
  };
}

function renderBackupExportUsage(args: string): TelegramRenderedMessage {
  return {
    text: [
      "Backup export is ready.",
      args ? `Requested scope: ${args}` : "Usage: /backup_export <project-id|goal-id>",
      "Exports include redacted references and audit evidence only; secrets and raw production data are excluded."
    ].join("\n")
  };
}

function renderSmokeTestUsage(args: string): TelegramRenderedMessage {
  return {
    text: [
      "Smoke test is ready.",
      args ? `Target: ${args}` : "Usage: /smoke_test <base-url>",
      "Smoke tests check the GoalKeeper health endpoint before deployment promotion."
    ].join("\n")
  };
}

function renderDeploymentReadinessUsage(): TelegramRenderedMessage {
  return {
    text: [
      "Deployment readiness check is ready.",
      "It requires passing validation, smoke-test evidence, rollback notes, and explicit owner approval before production rollout."
    ].join("\n")
  };
}

function renderGoalCapture(args: string): TelegramRenderedMessage {
  if (!args) {
    return {
      text: "Usage: /goal <describe the desired outcome>"
    };
  }

  return {
    text: [
      "Goal captured as raw intent.",
      "",
      args,
      "",
      "Intent extraction and approval will run in the intent-memory goal. No planning or coding started."
    ].join("\n"),
    buttons: [
      [
        { text: "Approve intent", callbackData: "approve_intent" },
        { text: "Edit", callbackData: "edit_intent" }
      ],
      [
        { text: "Add constraint", callbackData: "add_constraint" },
        { text: "Cancel", callbackData: "cancel_goal" }
      ]
    ]
  };
}

function renderSimpleStub(title: string, detail: string): TelegramRenderedMessage {
  return {
    text: `${title}: ${detail}`
  };
}

function formatList(values: string[]): string {
  return values.length > 0 ? values.join("; ") : "none";
}

function formatDigestItems(items: OvernightDigest["completed"]): string {
  return items.length > 0
    ? items.map((item) => `${item.taskId} (${item.status}${item.executorId ? `, ${item.executorId}` : ""})`).join("; ")
    : "none";
}

function formatBlockerGroups(groups: BlockerGroup[]): string {
  return groups.length > 0
    ? groups
        .map((group) => `${group.type} x${group.count}: ${group.question ?? group.reason}`)
        .join("; ")
    : "none";
}

function formatCommandLikeLabel(value: TelegramCommandName | string): string {
  return value.replaceAll("_", " ");
}
