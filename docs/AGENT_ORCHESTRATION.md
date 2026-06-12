# Agent Orchestration

## Core Requirement

GoalKeeper must orchestrate work across different AI agents and execution tools, not only track tasks.

The system should be able to:

- track any user project;
- understand goals and tasks across projects;
- choose an appropriate agent/tool for each task;
- run command-line tools on the user's server;
- run MCP tools when available;
- ask the user questions through Telegram;
- report progress through Telegram;
- store all decisions, commands, outputs, and artifacts.

Examples of supported agents/tools:

- Codex CLI / Codex agent;
- Claude Code;
- OpenCode;
- other AI CLI agents;
- local shell commands;
- MCP filesystem/git/postgres/browser tools;
- custom HTTP services;
- future provider-specific agents.

## Execution Model

GoalKeeper should treat every external executor as an adapter behind one common interface.

```ts
interface ExecutorAdapter {
  id: string;
  kind: 'cli' | 'mcp' | 'http' | 'internal';
  capabilities: string[];
  canRun(task: Task, context: ExecutionContext): Promise<CapabilityMatch>;
  run(task: Task, context: ExecutionContext): Promise<ExecutionResult>;
}
```

The domain logic must not know whether a task is handled by Codex, Claude Code, OpenCode, a shell command, or an MCP tool. It should only know:

- what capability is needed;
- what permissions are required;
- what context must be passed;
- what output schema is expected;
- how to validate the result.

For coding tasks, executor selection is downstream of IPS. Routing must not choose a coding executor until the task has approved intent, approved plan, approved execution plan, context package, coding prompt, explicit validation criteria, and a passed IPS pre-coding gate.

## Agent Registry

GoalKeeper needs an agent/tool registry.

Each registered executor should define:

- `id`: stable identifier, e.g. `codex-cli`, `claude-code`, `opencode`, `mcp-filesystem`.
- `kind`: `cli`, `mcp`, `http`, `internal`.
- `display_name`.
- `enabled`.
- `capabilities`: e.g. `code_edit`, `repo_review`, `shell`, `test_run`, `browser_check`, `db_query`, `docs_write`.
- `allowed_project_roots`.
- `risk_level`: max risk the executor may handle automatically.
- `requires_approval`: whether user approval is required before execution.
- `command_template` for CLI tools.
- `env_policy`: which environment variables are allowed.
- `timeout_seconds`.
- `max_retries`.

Example:

```json
{
  "id": "codex-cli",
  "kind": "cli",
  "display_name": "Codex CLI",
  "enabled": true,
  "capabilities": ["code_edit", "repo_review", "test_run", "shell"],
  "allowed_project_roots": ["/home/ssf/Documents/Github"],
  "requires_approval": true,
  "command_template": "codex run --json",
  "timeout_seconds": 1800
}
```

## Task Routing

Task routing should be explicit and auditable.

Routing input:

- task type;
- required capabilities;
- project root;
- risk level;
- required tools;
- user preference;
- previous executor performance;
- current executor availability.
- IPS gate status and artifact references for coding work.

Routing output:

- selected executor;
- reason;
- fallback executors;
- required approval gates.

Example:

```json
{
  "task_id": "task_123",
  "selected_executor": "codex-cli",
  "reason": "Task requires code_edit and test_run in a local repository; Codex CLI has matching capabilities.",
  "fallbacks": ["claude-code", "opencode"],
  "approval_required": true
}
```

If IPS gate status is missing, failed, or blocked, routing output must be `blocked` with a Telegram-visible reason instead of a fallback executor.

## CLI Execution

The server must support safe command-line execution.

Requirements:

- run commands only from allowed project roots;
- store command, cwd, env summary, start/end timestamps;
- stream progress logs into task events;
- capture stdout/stderr;
- enforce timeout;
- kill process on timeout;
- redact secrets before storing or sending to Telegram;
- require approval for destructive/high-risk commands;
- support interactive blockers by converting them into Telegram questions.

Execution should happen in a worker process, not inside the Telegram request handler.

CLI coding agents must receive generated context packages and coding prompts. They must not receive only the raw Telegram request, a loose task title, or a broad repository instruction.

## MCP Execution

MCP tools should be exposed as executors or tool capabilities.

MCP use cases:

- filesystem read/write;
- git operations;
- database inspection;
- browser validation;
- document/spreadsheet/presentation generation;
- project-specific tools.

MCP tool calls must be logged as execution steps:

- tool name;
- arguments after secret redaction;
- result summary;
- error if failed.

## Telegram Progress Loop

For long tasks, Telegram must show progress without overwhelming the user.

Send messages for:

- task started;
- task needs approval;
- task needs user answer;
- task failed;
- task completed;
- goal completed;
- daily digest.

Avoid sending every stdout line. Instead, aggregate:

- current step;
- elapsed time;
- last meaningful log line;
- whether user action is needed.

Example status:

```text
Task running: Implement Telegram webhook
Executor: Codex CLI
Elapsed: 7m
Current step: running tests
Last update: fixed command parser and added webhook tests
```

## User Questions

If an executor cannot continue, it must produce a structured question:

```json
{
  "question": "Which framework should be used for the new backend?",
  "options": ["NestJS", "Fastify"],
  "recommendation": "NestJS",
  "reason": "The old RunLayer used NestJS and the domain is module-heavy."
}
```

GoalKeeper sends this to Telegram and pauses the task as `awaiting_user`.

When the user answers:

- record a `Decision`;
- append answer to intent memory;
- resume the task with the answer in context.

## Project Tracking For Any Project

GoalKeeper should be able to track projects that it did not create.

Project registration should support:

- local path on server;
- remote git URL;
- production/staging URLs;
- docs path;
- default agent preferences;
- command presets;
- environment notes;
- deployment notes;
- owner-specific constraints.

Project state should include:

- active goals;
- queued goals;
- active tasks;
- blocked tasks;
- last executor activity;
- last deployment or artifact update;
- open questions for the user.

## Execution Records

Every executor run must create an immutable `Execution` record.

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
- `cost_estimate`
- `token_usage`
- `summary`

For coding executions, the record must also link to:

- approved execution plan;
- context package;
- coding prompt;
- validation report;
- any blocker or deviation raised during the run.

## Safety Rules

- No executor may operate outside allowed roots.
- No secret values are sent to Telegram.
- Destructive commands require explicit confirmation.
- High-risk tasks require approval even in semi-auto mode.
- The system must remember who approved a task and what context was shown.
- Executor output is never trusted blindly; validation still runs.
- Coding executors do not run from draft IPS artifacts or incomplete intent.
- Missing traceability creates a blocker; it is not routed to a "best effort" agent.

## MVP Executor Set

MVP should support at least:

- `shell` executor for safe predefined commands;
- one AI CLI executor, preferably Codex or Claude Code;
- `mcp-filesystem` if available;
- internal `notify` executor for Telegram messages.

After MVP:

- add multiple AI CLI adapters;
- add executor scoring;
- add parallel task execution;
- add cost/performance tracking per executor;
- add per-project default executor policies.
