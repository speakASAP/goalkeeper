# Implementation Spec: GoalKeeper

## 1. Product Scope

GoalKeeper must let the owner manage projects from Telegram:

- register any existing or new project;
- create a project;
- describe a goal;
- clarify intent;
- approve a plan;
- approve or reject tasks;
- answer an agent if it is blocked;
- start task execution through different AI agents, CLI, and MCP tools;
- leave the system working autonomously while the owner is offline/sleeping;
- improve the GoalKeeper system itself through the same workflow;
- see progress;
- receive a report;
- resume context later without losing meaning.

## 2. Architecture

Recommended first implementation:

- Backend: TypeScript + NestJS or Fastify.
- DB: PostgreSQL.
- Queue: Redis/BullMQ or RabbitMQ.
- Telegram: bot webhook.
- AI gateway: separate adapter so the provider can be changed.
- Worker execution: separate worker process.
- Executor registry: adapters for Codex, Claude Code, OpenCode, shell commands, MCP tools, HTTP services.
- IPS integration: pre-coding gates, context packages, coding prompts, validation reports.
- Intent memory: tables first, embeddings/RAG later.
- Audit/event log: append-only events.

Modules:

- `projects` - projects and settings.
- `goals` - goals and lifecycle.
- `intent` - preserving original intent, clarifications, and decisions.
- `planning` - plan generation and review.
- `tasks` - tasks, dependencies, and statuses.
- `approvals` - human gates.
- `telegram` - commands, callback buttons, routing.
- `agents` - AI-agent task execution.
- `executors` - registry and startup for Codex/Claude Code/OpenCode/CLI/MCP/HTTP executors.
- `routing` - selecting the right executor for a task.
- `ips` - Intent Preservation System integration, context package generation, pre-coding gates.
- `validation` - result validation.
- `memory` - summaries, decisions, artifacts.
- `notifications` - digest, reminders, escalations.
- `audit` - immutable event log.

## 3. Core Flow

### 3.1 Create Project

User:

```text
/new_project goalkeeper
```

Bot asks:

- project name;
- repository/path if exists;
- production/staging URLs;
- command presets;
- preferred executors;
- English-only communication and documentation policy;
- human approval mode;
- risk level.

System creates `Project`.

### 3.2 Capture Goal

User:

```text
/goal Build a new RunLayer version with Telegram control and intent preservation
```

System creates a draft goal and extracts:

- desired outcome;
- motivation;
- constraints;
- non-goals;
- success criteria;
- known context;
- open questions.

If required fields are missing, bot asks short clarifying questions. The original text must remain stored unchanged.

### 3.3 Clarify Intent

The bot should not immediately create tasks from vague text. It should produce an "intent card":

- "I understood the goal this way..."
- "Critical constraints..."
- "What will count as success..."
- "What we are not doing..."

User can answer:

- `Approve`
- `Fix`
- `Add constraint`
- `Defer`

### 3.4 Plan

After intent approval, planning agent creates 3-10 plan steps:

- task type;
- description;
- priority/order;
- dependencies;
- acceptance criteria;
- required tools;
- risk level;
- whether human approval is needed before execution.

Plan status becomes `awaiting_plan_approval`.

### 3.5 Approve Plan

Telegram bot renders plan as compact numbered list with buttons:

- Approve plan.
- Edit step.
- Remove step.
- Add step.
- Ask why.
- Regenerate.

After approval, system creates tasks.

### 3.6 Execute Tasks

Worker picks tasks whose dependencies are satisfied and approval gates are cleared. Before execution, the routing module selects an executor: internal worker, shell command, AI CLI agent, MCP tool, or external HTTP service.

Non-coding tasks may prepare missing documentation, ask clarification questions, run audits, or generate draft IPS artifacts. They must not modify production code or generate a coding prompt.

Before any coding executor starts, IPS gates must pass:

- upstream traceability exists;
- goal impact mapping exists;
- execution plan exists and is approved;
- context package exists or is generated;
- coding prompt exists and was generated from the approved execution plan;
- validation criteria are explicit;
- project invariants and sensitive-data classification are declared.

If any gate fails, the task moves to `blocked` or `awaiting_user`, a Telegram blocker is created, and no coding executor is launched. GoalKeeper must fail closed rather than allowing an agent to infer missing intent.

Task execution must include:

- task input;
- relevant intent context;
- acceptance criteria;
- previous decisions;
- project memory;
- upstream traceability and goal impact references;
- approved execution plan reference;
- context package and coding prompt references for coding tasks;
- selected executor and routing reason;
- allowed project root and tool permissions;
- output schema.

The executor can run on the user's server and may call:

- Codex CLI / Codex agent;
- Claude Code;
- OpenCode;
- local shell commands;
- MCP tools;
- custom project services.

All command/tool calls must be stored as execution records and summarized back to Telegram.

### 3.6.1 Overnight Autonomous Work

The system must support long-running autonomous work while the owner is offline:

- multiple agents may run in parallel;
- progress is stored as events and execution records;
- Telegram receives only meaningful checkpoints and blockers;
- risky/destructive/deploy actions pause for approval;
- morning/digest reports summarize completed, failed, partial, and blocked work.

### 3.6.2 Self-Improvement

GoalKeeper must be registered as a project in itself. Feature requests for GoalKeeper received through Telegram follow the same path:

```text
Telegram request -> Goal -> IPS goal impact -> plan -> tasks -> executor run -> validation -> report
```

Self-modification cannot bypass IPS gates, validation, or deployment approval.


### 3.7 Validate

Validation includes:

- schema validation;
- acceptance criteria check;
- optional LLM semantic review;
- optional human review for risky tasks.

No task can become `done` without validation result.

### 3.8 Complete Goal

Goal is complete when:

- all required tasks are `done`;
- no blocking failed tasks exist;
- acceptance criteria are met;
- final summary is generated;
- user receives completion report in Telegram.

Completion report must include:

- what was done;
- files/artifacts changed;
- decisions made;
- unresolved risks;
- next recommended goals.

## 4. Telegram-First Requirements

Telegram is the control plane. Every important state transition must be possible from Telegram:

- approve goal intent;
- approve plan;
- approve task;
- reject task with reason;
- answer agent question;
- pause/resume project;
- request status;
- ask "why is this blocked?";
- request summary.

Dashboard can be read-only in MVP or omitted.

## 5. Intent Preservation Requirements

Intent must be stored separately from tasks.

For every goal, store:

- raw user message;
- normalized intent;
- constraints;
- success criteria;
- non-goals;
- assumptions;
- clarifying Q&A;
- human decisions;
- plan versions;
- final retrospective.

When any agent receives a task, it must receive a distilled intent bundle:

- goal summary;
- relevant constraints;
- current decision log;
- task-specific acceptance criteria;
- why this task exists.

### 5.1 IPS Execution Contract

Coding tasks require an explicit IPS chain:

```text
raw intent -> approved goal intent -> goal impact -> approved plan -> task -> approved execution plan -> context package -> coding prompt -> validation report
```

Rules:

- Raw user intent is immutable.
- Human corrections create new records and may mark impacted plans/tasks as stale.
- Goal intent approval is required before planning.
- Plan approval is required before task creation for execution.
- An approved execution plan is required before generating a coding prompt.
- A context package must be generated from traceability links first; RAG/search may only add supporting context.
- `[MISSING: ...]` markers are allowed in draft documentation, but they block coding when they affect scope, constraints, approvals, data handling, contracts, replay/determinism, operational gates, or validation.
- IPS gate failure creates a blocker and event; it never silently downgrades to a warning.
- Validation must prove both technical completion and alignment with the preserved intent.

## 6. API Surface

Minimum HTTP API:

- `POST /projects`
- `GET /projects`
- `GET /projects/:id`
- `POST /projects/:id/goals`
- `GET /projects/:id/goals`
- `GET /goals/:id`
- `PATCH /goals/:id`
- `POST /goals/:id/approve-intent`
- `POST /goals/:id/plan`
- `POST /goals/:id/approve-plan`
- `POST /goals/:id/cancel`
- `POST /tasks/:id/approve`
- `POST /tasks/:id/reject`
- `POST /tasks/:id/answer`
- `POST /tasks/:id/retry`
- `GET /tasks/:id`
- `GET /executors`
- `POST /executors`
- `PATCH /executors/:id`
- `GET /tasks/:id/executions`
- `POST /tasks/:id/ips/pre-coding-gate`
- `GET /tasks/:id/context-package`
- `POST /projects/:id/overnight-mode`
- `GET /projects/:id/overnight-report`
- `GET /events?projectId=...`
- `POST /telegram/webhook`

## 7. Events

Append-only events are required:

- `project.created`
- `goal.created`
- `goal.intent_extracted`
- `goal.intent_approved`
- `goal.plan_proposed`
- `goal.plan_approved`
- `task.created`
- `task.approval_requested`
- `task.approved`
- `task.routed`
- `task.ips_gate_started`
- `task.ips_gate_failed`
- `task.ips_gate_passed`
- `context_package.generated`
- `coding_prompt.generated`
- `task.started`
- `task.awaiting_user`
- `execution.started`
- `execution.log`
- `execution.completed`
- `execution.failed`
- `task.validation_started`
- `task.completed`
- `task.failed`
- `goal.completed`
- `goal.cancelled`
- `overnight.report_ready`
- `self_improvement.requested`
- `decision.recorded`

Events must include:

- actor: `human`, `system`, `agent`;
- source: `telegram`, `api`, `worker`, `scheduler`;
- correlation IDs;
- previous and next status where applicable.

## 8. Security

- Telegram user allowlist for MVP.
- Admin user IDs in env.
- Never expose secrets in Telegram messages.
- Keep all documentation, prompts, reports, examples, Telegram copy, comments, and user-facing text in English only.
- All agent tool access must be scoped by project.
- CLI execution must be restricted to allowed project roots.
- MCP calls must be audited.
- Secrets must be redacted from stored logs and Telegram messages.
- Destructive actions require explicit confirmation.
- Production deploys require explicit approval unless a project policy allows auto-deploy.
- Coding tasks require IPS pre-coding gate.
- Store all human approvals with Telegram user ID and timestamp.

## 9. MVP Acceptance Criteria

MVP is complete when:

- user can create project from Telegram;
- user can create a goal from Telegram;
- system extracts intent and asks for approval;
- system proposes plan;
- user approves plan in Telegram;
- tasks are created with dependencies and acceptance criteria;
- IPS pre-coding gate blocks vague or untraceable coding work;
- context package/coding prompt is generated for coding executors;
- at least one AI CLI or worker executor can execute a task on the server;
- executor routing is stored and visible;
- command/tool execution logs are persisted;
- system can run long-running work and send a digest report;
- GoalKeeper can be registered as its own project for self-improvement tasks;
- validation gates task completion;
- user can approve/reject pending tasks;
- goal completion report is sent to Telegram;
- all state is persisted in PostgreSQL;
- event log can reconstruct the goal journey;
- every coding execution record links to the approved execution plan, context package, coding prompt, and validation report used for that run;
- strict documentation audit rejects non-English project text before goal closure or deployment.
