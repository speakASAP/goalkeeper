# Agent Implementation Tasks

This file is intended for the AI agent that will implement GoalKeeper.

## Phase 0: Repository Setup

- Create clean project skeleton.
- Add `.env.example`.
- Add database migration system.
- Add test runner.
- Add lint/typecheck scripts.
- Add README with local run commands.

Acceptance:

- `npm test` or equivalent runs.
- App starts locally.
- Health endpoint works.

## Phase 1: Domain Persistence

Implement tables/entities:

- projects;
- goals;
- intent_records;
- plans;
- plan_steps;
- tasks;
- executors;
- executions;
- ips_artifacts;
- decisions;
- events.

Acceptance:

- Migrations create all tables.
- Unit tests cover status transitions.
- Event is written for each lifecycle transition.

## Phase 2: Telegram Bot

Implement:

- webhook endpoint;
- Telegram user allowlist;
- command parser;
- callback button handler;
- message renderer.

Acceptance:

- `/start`, `/projects`, `/new_project`, `/goal`, `/goals`, `/tasks`, `/status` work.
- Unauthorized Telegram user receives denial message.
- Callback buttons mutate state idempotently.

## Phase 3: Goal Intent Flow

Implement:

- create goal from Telegram text;
- raw intent immutable storage;
- AI intent extraction;
- intent approval;
- correction flow.
- stale-plan/task detection when intent changes.

Acceptance:

- Goal cannot be planned before intent approval.
- Corrections are stored as new records.
- User can approve intent from Telegram.
- Intent corrections can block or mark affected plans, context packages, and coding prompts as stale.

## Phase 4: Planning

Implement:

- planning agent adapter;
- plan versioning;
- plan approval UI in Telegram;
- task creation from approved plan.

Acceptance:

- Goal moves `intent_approved -> planning -> awaiting_plan_approval -> active`.
- Plan regeneration creates new version.
- Approved plan creates tasks with acceptance criteria and dependencies.

## Phase 4.5: IPS Integration

Implement:

- project-level IPS settings;
- pre-coding gate runner;
- goal impact artifact linkage;
- approved execution plan artifact linkage;
- context package generator record;
- coding prompt generator record;
- validation report record;
- Telegram blocker when IPS requirements are missing.

Acceptance:

- Coding task cannot start if IPS gate fails.
- Missing IPS data creates a blocker instead of invented context.
- Draft IPS artifacts can be created for remediation, but cannot authorize coding.
- Coding prompt generation requires an approved execution plan.
- Executor input includes approved execution plan, context package, and coding prompt references.
- Coding execution records link to validation report evidence.

## Phase 5: Task Execution

Implement:

- worker loop;
- dependency resolver;
- approval gates;
- executor registry;
- routing module;
- AI CLI executor adapter;
- shell executor adapter;
- MCP executor adapter interface;
- structured output schema.

Acceptance:

- Worker only runs approved/ready tasks.
- Worker refuses coding execution unless IPS gate status is passed.
- Task is routed to a selected executor with stored reason.
- Task output is stored.
- Execution record captures command/tool call summary.
- Failed task includes reason and retry path.

## Phase 6: Validation

Implement:

- deterministic checks;
- LLM semantic validation adapter;
- validation result stored on task;
- no `done` without validation pass.

Acceptance:

- Invalid output cannot mark task done.
- Human can reject a task and provide feedback.
- Retry includes prior failure context.

## Phase 7: Completion And Reports

Implement:

- goal progress calculation;
- completion detection;
- Telegram completion report;
- final retrospective memory record.

Acceptance:

- Completed goal sends concise report.
- Report lists tasks, decisions, artifacts, risks.
- Event log reconstructs full journey.

## Phase 7.5: Autonomous Overnight Mode

Implement:

- long-running task monitor;
- digest report generator;
- Telegram `/overnight` or project policy command;
- blocker aggregation;
- self-improvement project registration for GoalKeeper itself.

Acceptance:

- User can leave tasks running and later receive a report.
- Report separates completed, failed, partial, blocked, and waiting-for-user work.
- GoalKeeper self-improvement tasks go through the same IPS and validation gates.

## Phase 8: Hardening

Implement:

- idempotency keys;
- rate limits;
- structured logs;
- admin commands;
- backup/export of memory.

Acceptance:

- Duplicate Telegram callback does not duplicate tasks.
- Destructive commands require confirmation.
- Audit trail is complete.
