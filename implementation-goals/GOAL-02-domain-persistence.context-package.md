# CP-GK-02: Domain Persistence And Lifecycle

```yaml
id: CP-GK-02
status: approved
source_execution_plan: implementation-goals/GOAL-02-domain-persistence.execution-plan.md
owner: orchestrator
created: 2026-06-12
last_updated: 2026-06-12
completeness_level: complete
```

## Target Task

Implement Goal 02 domain persistence and lifecycle rules for GoalKeeper.

## Upstream Traceability

- `implementation-goals/GOAL-02-domain-persistence.execution-plan.md`
- `implementation-goals/GOAL-02-domain-persistence.md`
- `docs/DOMAIN_MODEL.md`
- `docs/IMPLEMENTATION_SPEC.md`
- `docs/SYSTEM_ARCHITECTURE.md`
- `docs/IPS_INTEGRATION.md`
- `docs/governance/PROJECT_INVARIANTS.md`

## Included Documents

- `docs/DOMAIN_MODEL.md`: source of entity fields, states, and invariants.
- `docs/SYSTEM_ARCHITECTURE.md`: source of modular-monolith boundaries and persistence placement.
- `docs/IPS_INTEGRATION.md`: source of fail-closed IPS execution rules.
- `docs/governance/PROJECT_INVARIANTS.md`: source of mandatory implementation invariants.
- `implementation-goals/GOAL-02-domain-persistence.md`: source of acceptance criteria and allowed scope.

## Excluded Documents

- Telegram implementation documents are excluded because Telegram UI is Goal 03 scope.
- Executor orchestration implementation details are excluded except where executor and execution records are needed for traceability.
- Production deployment documents are excluded because deployment is Goal 10 scope.

## Constraints

- Preserve raw intent immutability.
- Preserve task-to-goal and task-to-plan-step traceability.
- Require validation pass before a task becomes `done`.
- Require approved IPS execution plan, context package, coding prompt, and passed gate before a coding task becomes executable.
- Emit an event for every lifecycle transition.
- Keep records append-only where the domain model requires it.
- Use English-only artifacts and synthetic data.

## Allowed Changes

- `src/domain/`
- `src/db/migrations/`
- Goal 02 implementation artifacts.
- Goal 02 validation report.
- `docs/IMPLEMENTATION_STATE.md`
- `package.json` only for validation scripts if needed.

## Forbidden Changes

- Telegram runtime implementation.
- External executor launching.
- Production deployment or remote server changes.
- IPS reference repository edits.
- Dashboard-first UI.

## Agent Prompt

Implement the TypeScript domain contracts, lifecycle services, audit event writer, SQL migration, and tests described by `implementation-goals/GOAL-02-domain-persistence.execution-plan.md`. Keep implementation deterministic, dependency-light, and aligned with the current Fastify modular-monolith skeleton.

## Validation Instructions

Run:

```bash
npm test
npm run typecheck
npm run lint
python3 scripts/strict_doc_audit.py --format markdown --fail-on-issues
python3 scripts/pre_coding_gate.py --root . --goal implementation-goals/GOAL-02-domain-persistence.md
```
