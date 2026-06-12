# System Architecture

## Target Shape

GoalKeeper should be a clean Telegram-first service with explicit domain boundaries.

Recommended MVP deployment:

```text
Telegram
   |
   v
GoalKeeper API
   |-- PostgreSQL
   |-- Redis queue
   |-- AI Provider Adapter
   |-- Executor Registry
   |-- Worker Process
   |-- CLI/MCP Tool Adapters
   |-- IPS Gate/Context Package Adapter
   |-- Notification Adapter
```

The MVP can be a modular monolith. Split into microservices only after the lifecycle is stable.

## Why Modular Monolith First

The old RunLayer depended on many ecosystem services:

- `ai-microservice`
- `auth-microservice`
- `notifications-microservice`
- `logging-microservice`
- `docs-rag-microservice`
- Redis
- RabbitMQ
- PostgreSQL
- MCP filesystem/git/postgres clients

That architecture is powerful, but for the rewrite it would slow down validation of the core idea. The first version should make goal/intent/task lifecycle reliable before splitting infrastructure.

## Module Boundaries

### Telegram Module

Responsibilities:

- receive webhook updates;
- authenticate Telegram user ID;
- parse commands and callback buttons;
- render compact messages;
- route user replies to waiting approvals/questions.

### Goal Module

Responsibilities:

- create goals;
- manage goal lifecycle;
- enforce status transitions;
- calculate progress;
- request planning.

### Intent Module

Responsibilities:

- store raw user intent;
- store normalized intent;
- store corrections;
- build task-specific intent bundles;
- preserve decision context.

### Planning Module

Responsibilities:

- call AI planner;
- version plans;
- validate plan shape;
- request plan approval;
- create tasks from approved plan.

### Task Module

Responsibilities:

- create tasks;
- enforce dependencies;
- manage status transitions;
- store task output;
- store blocked reasons.

### Worker Module

Responsibilities:

- pick ready tasks from queue;
- build prompt/input from task + intent bundle + IPS artifacts;
- stop and create blockers when required IPS context is missing;
- call AI provider, CLI executor, MCP executor, or external tool adapter;
- store output;
- request validation.

### Executor Registry Module

Responsibilities:

- register available executors such as Codex, Claude Code, OpenCode, shell, MCP tools, and HTTP services;
- describe executor capabilities;
- enforce allowed project roots and permissions;
- track executor health, timeout, retries, and availability.

### Routing Module

Responsibilities:

- select the best executor for each task;
- record why the executor was selected;
- define fallback executors;
- add approval gates for risky execution.
- refuse coding executor routing until IPS gate status is passed.

### IPS Module

Responsibilities:

- store project-level IPS settings;
- verify pre-coding gates;
- generate or link goal impact records, execution plans, context packages, coding prompts, validation reports;
- create Telegram blockers when IPS data is missing;
- prevent coding executors from running on vague or untraceable work.
- treat draft or incomplete execution-critical IPS artifacts as blockers, not warnings.

### Validation Module

Responsibilities:

- deterministic checks;
- semantic LLM review;
- human review gate for risky outputs;
- final validation result.

### Event/Audit Module

Responsibilities:

- append-only event records;
- correlation IDs;
- decision history;
- debug timeline.

## External Integrations

### AI Provider

Use an adapter interface:

```ts
interface AiProvider {
  complete(input: AiRequest): Promise<AiResponse>;
}
```

Do not hard-code a single AI microservice into domain logic.

### Notifications

For MVP, Telegram itself is the notification layer. Later, add email or external notifications service.

### Auth

For MVP:

- Telegram allowlist;
- admin Telegram IDs in env.

Later:

- web auth;
- OAuth/JWT if dashboard is added.

### Docs RAG

MVP:

- store project summaries and decisions in PostgreSQL;
- simple full-text search over memory records.

Later:

- embeddings;
- docs-rag service;
- repository indexing.

### Worker Tools

MVP worker/executor layer can support limited task types:

- `research`
- `plan`
- `write_doc`
- `code`
- `verify`
- `notify`

Executor kinds:

- `internal` - built-in GoalKeeper worker.
- `cli` - server-side command-line agent such as Codex, Claude Code, OpenCode.
- `mcp` - MCP tool/server call.
- `http` - custom service with a task execution endpoint.

Each tool must declare:

- required permissions;
- allowed project roots;
- output schema;
- validation requirements.

## Data Flow

### Create Goal

```text
Telegram message
 -> Telegram module
 -> Goal created
 -> Intent records written
 -> AI extracts normalized intent
 -> Telegram asks for approval
```

### Approve Plan

```text
Intent approved
 -> Planning module creates plan version
 -> Telegram renders plan
 -> Human approves
 -> Tasks created
 -> Events written
```

### Execute Task

```text
Ready task
 -> Worker loads intent bundle
 -> IPS module verifies pre-coding gate for coding work
 -> IPS module provides context package and coding prompt
 -> Routing module selects executor
 -> Executor runs CLI/MCP/HTTP/internal work
 -> Output stored
 -> Validation runs
 -> Task done/failed/awaiting_user
 -> Telegram notified when needed
```

## Non-Negotiable Invariants

- Raw user intent is immutable.
- Every task must link to a goal.
- Every task must have acceptance criteria.
- Human decisions are stored as decisions, not only status changes.
- No task is `done` without validation.
- Telegram approvals are idempotent.
- Agent output must be structured.
- Every executor run must produce an immutable execution record.
- CLI/MCP access must be scoped to allowed project roots and permissions.
- Coding execution requires approved intent, approved plan, approved execution plan, IPS context package, coding prompt, and validation criteria.
- Missing execution-critical IPS data blocks coding and creates a Telegram-visible blocker.
- RAG/search context can supplement graph traceability but cannot replace it.
- Destructive actions require explicit confirmation.

## Suggested Repository Structure

```text
src/
  app.ts
  modules/
    telegram/
    projects/
    goals/
    intent/
    planning/
    tasks/
    workers/
    executors/
    routing/
    ips/
    validation/
    audit/
    memory/
  db/
    migrations/
  shared/
    contracts/
    logging/
    errors/
```

## Migration From RunLayer

Use old RunLayer as reference for:

- lifecycle states;
- approval gates;
- validation requirement;
- event names;
- progress calculation;
- task idempotency.

Do not migrate:

- duplicate controllers;
- dashboard-first UI;
- hard-coded Statex service map in core domain;
- mixed old `legacy-runlayer` code;
- planning logic that activates goals without explicit intent approval.
