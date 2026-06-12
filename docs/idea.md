# Idea: GoalKeeper

## Short Description

GoalKeeper is a personal operating system for development and goal-driven project management. The user writes a goal in Telegram in natural language. The system preserves the original meaning of the request, clarifies missing details, turns the goal into a plan, gets human approvals at critical steps, creates tasks, selects suitable executors, runs AI agents and tools on the server, verifies the result, and returns a clear report.

The main idea of the project: the owner should manage many projects through a chain, not through a manual task tracker or constant agent supervision:

```text
human intent -> approved goal -> plan -> tasks -> executors -> validation -> report -> project memory
```

GoalKeeper must not be just a task list. It must be a system that understands why a task exists, which decisions have already been made, which constraints must not be violated, what result counts as success, and what evidence is required before work can be considered complete.

## Why This Project Exists

Modern AI agents can already write code, run commands, read repositories, work with MCP tools, test interfaces, and prepare reports. Without a control layer, they often work unsafely:

- they receive a vague request and invent the goal themselves;
- they lose the owner's original intent;
- they mix the desired outcome with technical implementation;
- they change code without enough context;
- they pass only syntax checks but do not verify alignment with the original goal;
- they require constant owner supervision;
- they leave no useful memory of why a decision was made.

GoalKeeper is the management layer between the human and executors. It should let the owner delegate work to AI agents without losing control over meaning, boundaries, quality, and change safety.

## Source Of The Idea

The project grows out of experience with the old RunLayer.

RunLayer already tested an important concept:

- goals become plans;
- plans become tasks;
- agents execute work;
- a validator checks the result;
- the human joins only for important decisions;
- the system should run many projects with minimal manual involvement.

Target metrics from the old idea:

- 20+ active projects managed by the system;
- less than 1 hour of manual intervention per week;
- more than 85% of tasks complete without human involvement.

GoalKeeper keeps RunLayer's strengths:

- goal-first approach;
- planning before execution;
- approval gates;
- task acceptance criteria;
- goal and task statuses;
- task idempotency;
- goal progress derived from task statuses;
- validation before `done`;
- lifecycle events;
- notifications and reports.

But GoalKeeper changes the product center:

- Telegram-first, not dashboard-first;
- not just a task orchestrator, but a system for preserving intent and achieving goals;
- not automatic execution of every request, but autonomy within approved boundaries;
- not context as a random prompt/RAG block, but separate intent memory;
- not the old mixed RunLayer architecture, but a clean modular domain model;
- not "the agent will figure it out", but a strict IPS contract before coding execution.

## Target Experience

The owner writes in Telegram:

```text
Add a new active agents screen to project X and show what they are working on now.
```

GoalKeeper must:

1. Preserve the original text unchanged.
2. Understand which project the request belongs to.
3. Extract outcome, motivation, constraints, non-goals, and success criteria.
4. Show the user an intent-understanding card.
5. Ask for confirmation or clarification.
6. Create a plan after approval.
7. Show the plan in Telegram.
8. Let the user approve, edit, or regenerate the plan.
9. Create tasks with dependencies and acceptance criteria.
10. Check IPS gates for coding tasks.
11. Generate a context package and coding prompt from the approved execution plan.
12. Select an executor: Codex, Claude Code, OpenCode, shell, MCP tool, internal worker, or HTTP service.
13. Run the executor on the server in the allowed project root.
14. Save execution records, logs, artifacts, and events.
15. Stop and ask the user if there is a blocker.
16. Validate the result.
17. Send a Telegram report: what was done, what changed, what was checked, and what risks remain.
18. Update project memory so future tasks account for the decisions made.

Ideal state: the owner can set several goals in the evening, enable overnight mode, and receive a morning report:

- what is complete;
- what is partially done;
- what failed;
- which agents worked;
- which checks passed;
- where an owner answer is needed;
- which next steps are recommended.

## Audience

GoalKeeper is intended for:

- an owner or founder managing several digital projects;
- a technical lead who wants to delegate routine development to AI agents;
- a team where different AI agents must work in a coordinated way;
- an agentic workflow where approval, audit trail, intent preservation, and validation matter;
- GoalKeeper itself, because the system must be able to develop itself through the same safe process.

## Main Value

The user manages projects from Telegram with short commands and natural language. GoalKeeper handles:

- project registration;
- goal creation;
- intent extraction and preservation;
- clarifying questions;
- plan approval;
- task creation;
- dependency control;
- task-specific context preparation;
- IPS pre-coding gates;
- context package generation;
- coding prompt generation;
- executor selection;
- AI CLI agent, shell command, MCP tool, and internal worker execution;
- log and artifact collection;
- result validation;
- reports;
- reminders, escalations, and blockers;
- long-term decision memory.

The owner should make meaning-level and risky decisions instead of manually managing every small task.

## Telegram-First Principle

Telegram is the primary control plane, not just a notification channel.

Key actions must be available through Telegram:

- create a project;
- register an existing repository;
- create a goal;
- approve intent;
- correct intent;
- add a constraint;
- approve a plan;
- edit a plan step;
- approve or reject a task;
- answer an agent question;
- view active projects;
- view active goals;
- view active agents;
- understand why a task is blocked;
- enable or disable overnight mode;
- receive a summary or overnight report;
- start a self-improvement goal for GoalKeeper itself.

A dashboard may appear later as a secondary audit/read-only interface, but it is not the center of the MVP. The system must not become dashboard-first again.

## Main Lifecycle

### 1. Project

A Project is a long-lived workspace: a repository, service, product, client project, or GoalKeeper itself.

For each project, store:

- name and slug;
- local path or remote repo;
- production/staging URLs;
- preferred executors;
- command presets;
- IPS settings;
- approval mode;
- risk level;
- concurrency limit;
- deployment notes;
- status.

GoalKeeper must be able to track projects it did not create. It is important not only to create new projects, but also to connect existing repositories and services.

### 2. Goal

A Goal is a desired result, not a task.

Example goals:

```text
Build a Telegram-first MVP for GoalKeeper.
```

```text
Add an active agents report to the RunLayer project.
```

```text
Run hardening before deployment.
```

A Goal moves through these statuses:

- `draft` - raw request saved;
- `clarifying` - the system needs clarification;
- `intent_ready` - normalized intent is ready for approval;
- `intent_approved` - the human confirmed the meaning;
- `planning` - AI is preparing a plan;
- `awaiting_plan_approval` - the plan is waiting for a decision;
- `active` - tasks can run;
- `blocked` - input or missing context is needed;
- `completed` - success criteria are satisfied;
- `cancelled` - the human cancelled the goal.

Invariants:

- a goal cannot move to planning before intent approval;
- a goal cannot become active before plan approval;
- a goal cannot complete while required tasks are open or failed.

### 3. Intent

Intent is the main memory object.

GoalKeeper must store:

- raw user message;
- normalized intent;
- motivation;
- desired outcome;
- constraints;
- non-goals;
- assumptions;
- success criteria;
- clarifying Q&A;
- corrections;
- approvals;
- rejected options;
- decisions;
- final retrospective.

Raw intent is immutable. If the user clarifies the meaning, the system does not rewrite the original request. It creates a correction record and updates the distilled summary.

Example:

```text
No, I meant control through Telegram, not a new dashboard.
```

After this message, GoalKeeper must:

- record the correction;
- update the distilled intent;
- mark affected plans, tasks, context packages, and coding prompts as stale;
- propose replanning if the change affects execution.

### 4. Plan

After intent approval, the AI planner creates a plan with 3-10 steps.

Each step must have:

- title;
- description;
- type;
- priority;
- dependencies;
- acceptance criteria;
- risk level;
- required tools;
- approval requirement;
- possible executor.

The plan is versioned. Replanning creates a new version instead of rewriting history.

Only one approved plan can be active for a goal.

### 5. Task

A Task is an executable unit that appears from an approved plan.

Each task must know:

- project;
- goal;
- plan step;
- dependencies;
- acceptance criteria;
- approval requirement;
- selected executor;
- routing reason;
- intent bundle snapshot;
- IPS artifacts;
- context package;
- coding prompt;
- validation result;
- blocker reason, if any.

A task must not exist separately from a goal. Every task must answer:

- why it is needed;
- which intent it preserves;
- which constraints apply;
- which human decision authorized execution;
- which acceptance criteria prove completion;
- how the result will be validated.

### 6. Execution

An Execution is an immutable record of one attempt to run a task with a specific executor.

GoalKeeper must record:

- executor id;
- executor kind;
- command/tool call;
- cwd;
- status;
- start/end time;
- duration;
- exit code;
- stdout/stderr refs;
- artifacts;
- token usage;
- cost estimate;
- summary;
- links to the approved execution plan, context package, coding prompt, and validation report for coding work.

Execution records are needed to reconstruct what actually happened, not just to see the final task status.

### 7. Validation

No task can become `done` without a validation pass.

Validation can include:

- schema validation;
- tests;
- lint/typecheck/build;
- browser/visual checks;
- deterministic command checks;
- semantic LLM review;
- human review for risky tasks;
- acceptance criteria check;
- intent alignment check.

Validation must prove not only technical correctness, but also alignment with the preserved intent.

## IPS As The Boundary Of Autonomy

The Intent Preservation System is a mandatory part of GoalKeeper. It is not optional documentation, but a hard execution contract.

For coding work, this chain is mandatory:

```text
raw intent
 -> approved goal intent
 -> goal impact
 -> approved plan
 -> task
 -> approved execution plan
 -> context package
 -> coding prompt
 -> code
 -> validation report
```

If any link is missing, in a draft state, contains execution-critical `[MISSING: ...]`, lacks upstream traceability, or lacks approval, GoalKeeper must stop coding execution.

It must:

- create a blocker;
- record an event;
- explain the problem in Telegram;
- request the missing input or prepare draft documentation;
- not run the coding executor.

Draft documents are allowed only for remediation. They help expose gaps, but they do not authorize code changes.

A coding prompt can be created only from an approved execution plan and a complete context package.

## What IPS Gates Check

Before starting a coding executor, GoalKeeper must check:

- upstream traceability exists;
- goal impact mapping exists;
- approved execution plan exists;
- context package exists or can be generated from graph links;
- coding prompt is generated from the approved execution plan;
- validation criteria are explicit;
- project invariants are declared;
- sensitive-data classification is declared;
- contract/schema impact is declared;
- replay/determinism impact is declared where relevant;
- operational gates are named;
- there is no execution-critical `[MISSING: ...]`;
- there is no draft approval state.

If the gate fails, routing must not choose a fallback executor. The routing result must be `blocked` with a Telegram-visible reason.

## Context Package

Every executor must receive prepared context, not a raw Telegram request.

The context package must be assembled as:

```text
Task
 -> PlanStep
 -> Plan
 -> Goal
 -> IntentRecords
 -> Goal impact / IPS artifacts
 -> Decisions / ADRs
 -> Project memory
 -> Relevant files/docs
 -> Validation rules
 -> Constraints and non-goals
```

RAG, search, and embeddings can add supporting context, but they do not replace the traceability graph. Missing graph links are a blocker.

## Executors And Orchestration

GoalKeeper must orchestrate different executors through one adapter interface.

Executor types:

- `internal` - built-in GoalKeeper operations;
- `cli` - Codex CLI, Claude Code, OpenCode, shell commands;
- `mcp` - MCP filesystem/git/postgres/browser/docs/tools;
- `http` - external services with a task execution endpoint.

Each executor must describe:

- stable id;
- kind;
- display name;
- capabilities;
- allowed project roots;
- risk level;
- whether approval is required;
- command template;
- env policy;
- timeout;
- retries.

Routing must be explicit and auditable:

- which executor was selected;
- why;
- which fallback executors are possible;
- which approval gates are required;
- why routing is blocked if IPS did not pass.

Domain logic must not depend on whether a task is executed by Codex, Claude Code, OpenCode, shell, or MCP. It should know capabilities, permissions, context, output schema, and validation requirements.

## Execution Safety

GoalKeeper runs commands and agents on the server, so safety is part of the product idea.

Rules:

- an executor does not work outside allowed project roots;
- secrets are not sent to Telegram;
- secrets are redacted from logs and reports;
- destructive commands require explicit confirmation;
- production deployment requires approval;
- high-risk tasks require approval even in semi-auto mode;
- a Telegram user allowlist is mandatory in the MVP;
- admin Telegram IDs are stored in env;
- MCP calls are audited;
- CLI execution runs in a worker process, not in the webhook handler;
- executor output is not treated as truth without validation.

## Overnight Mode

Overnight mode lets the owner safely leave work running overnight.

The system must:

- run long-running tasks outside the Telegram request lifecycle;
- support multiple agents;
- account for dependencies;
- respect per-project concurrency limits;
- stop automatically at risk gates;
- send messages only for meaningful checkpoints and blockers;
- send a structured digest in the morning.

The report must separate:

- completed;
- partial;
- failed;
- blocked;
- awaiting user;
- skipped;
- recommended next actions.

Overnight mode does not mean "do anything". It means autonomous work inside approved intent, approved plan, executor permissions, IPS gates, and validation rules.

## Self-Improvement

GoalKeeper must be registered as a project inside itself.

Any request to change GoalKeeper follows the same path:

```text
Telegram request
 -> Goal
 -> intent approval
 -> plan approval
 -> IPS goal impact
 -> task
 -> approved execution plan
 -> context package
 -> coding prompt
 -> executor run
 -> validation
 -> report
```

Self-improvement cannot bypass governance. Because GoalKeeper will manage other projects, its own changes must be especially traceable.

## Event Log And Audit

GoalKeeper must maintain an append-only event log.

Events must make it possible to reconstruct the journey:

- who created the goal;
- which raw intent was saved;
- what AI understood;
- which questions were asked;
- what the user approved;
- which plan was proposed;
- which tasks were created;
- which executor was selected and why;
- which commands or tools were run;
- which validation checks passed;
- where a blocker occurred;
- why the goal completed.

Events must include:

- actor: `human`, `system`, `agent`;
- source: `telegram`, `api`, `worker`, `scheduler`;
- correlation ids;
- previous/next status where relevant.

## Project Memory

GoalKeeper must remember not only current statuses, but also the semantic history of a project.

Memory has two layers:

1. Append-only records: raw intent, corrections, decisions, events, executions, validation reports.
2. Distilled summaries: the current short version of intent, project summary, latest decisions, known risks.

Distilled summaries can be updated. Original records must not be overwritten.

This memory is needed so future agents do not start from zero every time and do not repeat rejected decisions.

## MVP

The MVP is useful when the user can:

- create or register a project from Telegram;
- create a goal from Telegram;
- see extracted intent;
- approve or correct intent;
- receive a proposed plan;
- approve the plan;
- receive tasks with dependencies and acceptance criteria;
- approve or reject a risky task;
- see why a task is blocked;
- run at least one executor on the server;
- see an execution record;
- receive a validation result;
- receive a goal completion report;
- enable overnight mode and receive a digest;
- register GoalKeeper as a self-improvement project.

Technically, the MVP must have:

- backend service;
- PostgreSQL persistence;
- queue/worker process;
- Telegram webhook;
- allowlist/admin IDs;
- project/goal/intent/plan/task/execution/validation/event models;
- executor registry;
- routing module;
- at least a shell executor;
- at least one AI CLI executor, preferably Codex or Claude Code;
- IPS settings;
- pre-coding gate;
- context package record;
- coding prompt record;
- validation report record;
- Telegram blocker flow.

## Non-Goals For The First Version

The first version must not include:

- a large dashboard as the main interface;
- line-by-line copying of the old RunLayer;
- microservice splitting before the lifecycle is stable;
- managing 50 projects before a reliable MVP exists;
- fully autonomous execution without approvals;
- coding from a vague Telegram request;
- coding from draft IPS artifacts;
- production deployment without explicit owner approval;
- real IoT/payment/ERP/CRM/BI features;
- multi-tenant enterprise SaaS;
- white label;
- provider lock-in in domain logic;
- storing secrets in Telegram or log summaries;
- silent agent-driven scope expansion.

## Architectural Shape

The recommended start is a modular monolith.

Target shape:

```text
Telegram
   |
   v
GoalKeeper API
   |-- PostgreSQL
   |-- Redis/BullMQ or queue
   |-- AI Provider Adapter
   |-- Executor Registry
   |-- Worker Process
   |-- CLI/MCP Tool Adapters
   |-- IPS Gate/Context Package Adapter
   |-- Notification Adapter
```

Modules:

- `projects`;
- `goals`;
- `intent`;
- `planning`;
- `tasks`;
- `approvals`;
- `telegram`;
- `agents`;
- `executors`;
- `routing`;
- `ips`;
- `validation`;
- `memory`;
- `notifications`;
- `audit`.

Microservices can be extracted later, after the lifecycle, IPS gates, and executor model become reliable.

## Product Principles

### Goal-First

The user sets goals instead of manually creating a set of technical tasks. Tasks appear from an approved plan and preserve the link to intent.

### Intent-First

Meaning matters more than formal status. If a task is technically complete but does not match intent, it is not complete.

### Telegram-First

Control must be available from Telegram. The dashboard is secondary.

### Fail Closed

If intent, approval, traceability, validation criteria, or IPS artifacts are missing, the system stops coding instead of guessing.

### Human Gates For Risk

Autonomy is allowed only inside approved boundaries. Risky, destructive, and production actions require an explicit owner decision.

### Executor Neutrality

GoalKeeper must not be tied to one agent. Codex, Claude Code, OpenCode, shell, MCP, and HTTP services are executors behind a shared interface.

### Validation Before Done

`done` without a validation pass is impossible.

### Auditability

Every important change, decision, run, and result must be recoverable from the event log and execution records.

### Self-Improvement Through The Same Rules

GoalKeeper evolves through the same lifecycle it applies to other projects.

## Final Formula

GoalKeeper is a Telegram-first autonomous project operating system that:

- accepts human goals;
- preserves intent;
- turns intent into an approved plan;
- creates traceable tasks;
- prepares safe context for AI agents;
- runs executors on the server;
- stops on missing intent or risk;
- validates the result;
- tells the owner only what matters;
- accumulates memory and decisions;
- can improve itself without bypassing governance.

The main success criterion: the owner can manage development for several projects through short Telegram messages and receive high-quality, validated results without constant manual supervision, while the system preserves the original meaning of goals and prevents agents from writing code from guesses.
