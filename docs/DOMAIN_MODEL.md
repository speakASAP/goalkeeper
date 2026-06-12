# Domain Model

## Project

Represents a long-lived workspace.

Fields:

- `id`
- `slug`
- `name`
- `description`
- `repo_ref`
- `local_path`
- `production_url`
- `staging_url`
- `preferred_executors`
- `command_presets`
- `ips_enabled`
- `ips_root`
- `ips_settings`
- `overnight_mode_enabled`
- `concurrency_limit`
- `status`: `active`, `paused`, `completed`, `archived`
- `default_approval_mode`: `manual`, `semi_auto`
- `risk_level`: `low`, `medium`, `high`
- `created_at`, `updated_at`

Invariant:

- A project can have many goals.
- A project can have many active goals, but MVP may restrict execution to one active goal per project for simplicity.
- If `ips_enabled` is true, coding execution for the project must fail closed when IPS artifacts or approvals are missing.

## Goal

Represents desired outcome, not a task.

Fields:

- `id`
- `project_id`
- `title`
- `raw_intent`
- `normalized_intent`
- `status`
- `priority`
- `success_criteria`
- `constraints`
- `non_goals`
- `assumptions`
- `completion_pct`
- `created_by`
- `created_at`, `updated_at`, `completed_at`

Statuses:

- `draft` - raw user goal captured, intent not approved.
- `clarifying` - system needs more info.
- `intent_ready` - extracted intent is ready for approval.
- `intent_approved` - human approved meaning and constraints.
- `planning` - AI is creating plan.
- `awaiting_plan_approval` - plan is ready for human review.
- `active` - tasks can execute.
- `blocked` - goal cannot proceed without input.
- `completed` - success criteria met.
- `cancelled` - human cancelled.

Invariant:

- A goal cannot move to `planning` before intent is approved.
- A goal cannot move to `active` before plan is approved.
- A goal cannot complete if required tasks are open or failed.

## IntentRecord

First-class memory unit for why something exists.

Fields:

- `id`
- `goal_id`
- `kind`: `raw`, `summary`, `constraint`, `decision`, `assumption`, `correction`, `retrospective`
- `content`
- `source`: `telegram`, `api`, `agent`, `system`
- `actor_id`
- `confidence`
- `created_at`

Invariant:

- Raw user intent is immutable.
- Corrections create new records; they do not overwrite raw intent.

## Plan

Versioned proposed execution plan.

Fields:

- `id`
- `goal_id`
- `version`
- `status`: `proposed`, `approved`, `rejected`, `superseded`
- `summary`
- `created_by_agent`
- `created_at`, `approved_at`, `approved_by`

Invariant:

- Only one approved plan is active for a goal.
- Replanning creates a new version.

## PlanStep

A step that may become one or more tasks.

Fields:

- `id`
- `plan_id`
- `index`
- `title`
- `description`
- `type`
- `priority`
- `depends_on_step_ids`
- `acceptance_criteria`
- `approval_required`
- `risk_level`
- `target_service`
- `tool_requirements`
- `preferred_executor_id`

## Task

Executable unit derived from a goal/plan step.

Fields:

- `id`
- `project_id`
- `goal_id`
- `plan_step_id`
- `parent_task_id`
- `type`
- `status`
- `priority`
- `payload`
- `acceptance_criteria`
- `depends_on_task_ids`
- `approval_required`
- `idempotency_key`
- `assigned_agent_id`
- `selected_executor_id`
- `routing_reason`
- `ips_gate_status`
- `context_package_id`
- `coding_prompt_id`
- `ips_artifact_ids`
- `intent_bundle_snapshot`
- `ips_blocker_id`
- `attempt`
- `max_attempts`
- `output`
- `validation_result`
- `blocked_reason`
- `created_at`, `started_at`, `completed_at`

Statuses:

- `created`
- `pending_approval`
- `approved`
- `assigned`
- `in_progress`
- `awaiting_user`
- `validation`
- `done`
- `failed`
- `blocked`
- `cancelled`

Invariant:

- `done` requires validation pass.
- Task cannot start until dependencies are terminal-success or explicitly skipped.
- Rejection must include a reason.
- Task execution must be linked to an executor or internal worker.
- Coding tasks cannot start unless IPS pre-coding gate passes and the task references an approved execution plan, context package, and coding prompt.
- Draft IPS artifacts can be created by documentation tasks, but they are not sufficient for coding execution.
- IPS gate failure creates a blocker and prevents routing to coding executors.

## Executor

Represents an AI agent, CLI command runner, MCP tool, HTTP service, or internal worker that can execute tasks.

Fields:

- `id`
- `kind`: `cli`, `mcp`, `http`, `internal`
- `display_name`
- `enabled`
- `capabilities`
- `allowed_project_roots`
- `requires_approval`
- `risk_level`
- `command_template`
- `timeout_seconds`
- `max_retries`
- `created_at`, `updated_at`

Examples:

- `codex-cli`
- `claude-code`
- `opencode`
- `shell`
- `mcp-filesystem`
- `mcp-git`
- `internal-notify`

Invariant:

- Executor cannot run outside its allowed roots.
- Executor configuration must not expose secrets to Telegram.
- Disabled executor cannot receive new tasks.

## Execution

Immutable record of one attempt to run a task by an executor.

Fields:

- `id`
- `task_id`
- `executor_id`
- `executor_kind`
- `command`
- `cwd`
- `status`: `queued`, `running`, `succeeded`, `failed`, `cancelled`, `timed_out`
- `started_at`
- `ended_at`
- `duration_ms`
- `exit_code`
- `stdout_ref`
- `stderr_ref`
- `artifact_refs`
- `token_usage`
- `cost_estimate`
- `summary`

Invariant:

- Every CLI/MCP/HTTP/internal task run creates an `Execution`.
- Execution records are append-only.
- Logs are redacted before storage and Telegram summaries.

## IpsArtifact

Represents an IPS artifact generated or linked for a GoalKeeper task.

Fields:

- `id`
- `project_id`
- `goal_id`
- `task_id`
- `kind`: `goal_impact`, `task_doc`, `execution_plan`, `context_package`, `coding_prompt`, `validation_report`, `audit_report`
- `path`
- `status`: `draft`, `approved`, `used`, `obsolete`, `failed`
- `approved_by`
- `approved_at`
- `source`
- `summary`
- `missing_markers`
- `upstream_artifact_ids`
- `created_at`, `updated_at`

Invariant:

- Coding executor input must reference a context package and coding prompt.
- Coding prompts must be generated from approved execution plans.
- Validation report must exist before a coding task is treated as complete.
- Execution-critical `[MISSING: ...]` markers block coding until resolved.
- Missing human intent is represented with `[MISSING: ...]` markers or Telegram blockers, not invented.

## Blocker

Structured reason why execution is paused.

Fields:

- `id`
- `project_id`
- `goal_id`
- `task_id`
- `type`: `needs_user_answer`, `ips_gate_failed`, `approval_required`, `executor_failed`, `validation_failed`, `deployment_approval_required`
- `question`
- `reason`
- `options`
- `recommendation`
- `impact`
- `status`: `open`, `answered`, `resolved`, `cancelled`
- `created_at`, `resolved_at`

Invariant:

- A blocker that needs human input must be sent to Telegram.
- Answering a blocker creates a `Decision` and updates intent memory where relevant.

## OvernightReport

Summary of autonomous work done while the owner was offline.

Fields:

- `id`
- `project_id`
- `period_start`
- `period_end`
- `completed_tasks`
- `failed_tasks`
- `blocked_tasks`
- `partial_tasks`
- `questions_for_owner`
- `validation_evidence`
- `summary`
- `created_at`

## Decision

Human or system decision that affects execution.

Fields:

- `id`
- `project_id`
- `goal_id`
- `task_id`
- `decision_type`
- `question`
- `answer`
- `options`
- `chosen_option`
- `actor_id`
- `source`
- `created_at`

Examples:

- approve intent;
- approve plan;
- approve task;
- reject task;
- choose architecture option;
- skip failed plan step;
- pause project.

## Event

Append-only audit log.

Fields:

- `id`
- `type`
- `project_id`
- `goal_id`
- `task_id`
- `actor`
- `source`
- `payload`
- `created_at`

Invariant:

- Event records are never edited.
- System state can be debugged from event history.
