# PROMPT-GK-02: Domain Persistence And Lifecycle

```yaml
id: PROMPT-GK-02
status: approved
source_execution_plan: implementation-goals/GOAL-02-domain-persistence.execution-plan.md
source_context_package: implementation-goals/GOAL-02-domain-persistence.context-package.md
owner: orchestrator
created: 2026-06-12
last_updated: 2026-06-12
completeness_level: complete
```

## Task Summary

Implement GoalKeeper's core domain persistence schema and lifecycle rules for projects, goals, intent records, plans, plan steps, tasks, executors, executions, IPS artifacts, blockers, overnight reports, decisions, and events.

## Execution Plan Link

`implementation-goals/GOAL-02-domain-persistence.execution-plan.md`

## Context Package Link

`implementation-goals/GOAL-02-domain-persistence.context-package.md`

## Allowed Changes

- Create `src/domain/types.ts`, `src/domain/events.ts`, `src/domain/lifecycle.ts`, and `src/domain/lifecycle.test.ts`.
- Create `src/db/migrations/0001_domain_persistence.sql`.
- Update Goal 02 validation and implementation state after validation.
- Adjust `package.json` only if a migration validation command is needed.

## Forbidden Changes

- Do not implement Telegram UI or webhook behavior.
- Do not launch or simulate external CLI agents.
- Do not add dashboard-first workflows.
- Do not modify remote production files or deploy.
- Do not weaken IPS gates or omit IPS fields because later goals have not consumed them yet.

## Implementation Instructions

Define explicit TypeScript status unions and interfaces that mirror `docs/DOMAIN_MODEL.md`. Add deterministic lifecycle functions that clone updated records instead of mutating caller-owned inputs. Use an event writer abstraction to append lifecycle events for each successful transition. SQL migrations should define core tables, enum-like checks, foreign keys, JSONB fields for structured arrays/payloads, append-only comments where relevant, and constraints that encode traceability where practical.

## Acceptance Criteria

- Migrations create all core tables or document an MVP-equivalent persisted collection.
- Status transitions enforce goal and task invariants.
- Raw intent is immutable through domain services.
- Task `done` requires validation pass.
- Coding tasks cannot be marked executable without IPS references.
- Every lifecycle transition writes an event.
- Tests cover happy path and invalid transitions.

## Validation Commands

```bash
npm test
npm run typecheck
npm run lint
python3 scripts/strict_doc_audit.py --format markdown --fail-on-issues
python3 scripts/pre_coding_gate.py --root . --goal implementation-goals/GOAL-02-domain-persistence.md
```

## Expected Output

Return changed files, schema summary, lifecycle rules implemented, validation evidence, deviations, risks, and next recommended command.
