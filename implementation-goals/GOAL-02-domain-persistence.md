# GOAL 02: Domain Persistence And Lifecycle

## User Command

```text
GOALKEEPER ORCHESTRATOR: implement goal number 2
```

## Outcome

Implement the core persistence model and lifecycle rules for projects, goals, intent records, plans, plan steps, tasks, executors, executions, IPS artifacts, decisions, and events.

## Branch

```text
feature/gk-goal-02-domain-persistence
```

## Dependencies

- Goal 01 done.

## IPS Intent

The database must make intent and traceability first-class. Tasks must never be detached from goals, plan steps, approvals, validation, or events.

## Required Subagents

Use subagents with disjoint ownership:

- Explorer A: inspect Goal 01 code and recommend persistence approach.
- Worker A: schema/migrations/entities.
- Worker B: domain services/status transitions/tests.
- Validator: review invariants from `DOMAIN_MODEL.md`.

## Allowed Changes

- Persistence configuration.
- Migrations/schema.
- Domain entities/models.
- Repositories/services.
- Lifecycle transition guards.
- Audit event writer.
- Unit tests.
- Seed/dev fixtures if useful.
- State file update.

## Forbidden Changes

- Do not implement Telegram UI.
- Do not launch external CLI agents.
- Do not bypass IPS fields because they are not used yet.

## IPS Preflight

Verify this goal preserves:

```text
Goal -> Plan -> PlanStep -> Task -> Execution -> Validation/Event
```

If any required field from `DOMAIN_MODEL.md` is omitted, document the MVP reason and create a TODO with acceptance impact.

## Acceptance Criteria

- Migrations create all core tables or equivalent persisted collections.
- Status transitions enforce invariants.
- Raw intent is immutable.
- Task `done` requires validation pass.
- Coding task cannot be marked executable without IPS references.
- Every lifecycle transition writes an event.
- Tests cover happy path and invalid transitions.

## Validation Commands

```bash
npm test
npm run typecheck
npm run lint
```

Add migration validation command if the chosen stack supports it.

## Final Report

Include schema summary, lifecycle rules implemented, tests run, and next recommended command.
