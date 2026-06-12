# EP-GK-02: Domain Persistence And Lifecycle

```yaml
id: EP-GK-02
status: approved
source_goal: implementation-goals/GOAL-02-domain-persistence.md
owner: orchestrator
created: 2026-06-12
last_updated: 2026-06-12
completeness_level: complete
branch: feature/gk-goal-02-domain-persistence
```

## Metadata

Goal 02 implements the core persisted domain model and lifecycle guards after Goal 01 established the Fastify TypeScript skeleton. This plan is approved for bounded implementation on `feature/gk-goal-02-domain-persistence`.

## Upstream Traceability

- `README.md`
- `docs/idea.md`
- `docs/PRODUCT_BRIEF.md`
- `docs/IMPLEMENTATION_SPEC.md`
- `docs/DOMAIN_MODEL.md`
- `docs/SYSTEM_ARCHITECTURE.md`
- `docs/IPS_INTEGRATION.md`
- `docs/governance/PROJECT_INVARIANTS.md`
- `docs/process/OPERATIONAL_GATES.md`
- `implementation-goals/GOAL-02-domain-persistence.md`

## Goal Impact

This goal makes intent, lifecycle state, validation, IPS references, executor records, decisions, blockers, and append-only events first-class system data. It enables later Telegram, planning, IPS, routing, execution, and reporting goals to work from traceable records instead of ad hoc task state.

## Project Invariants

- `GK-INV-001`: Preserved. No dashboard or dashboard-first workflow is introduced.
- `GK-INV-002`: Preserved. Domain tables and lifecycle guards require task-to-goal, plan, IPS, and validation links before coding execution or completion.
- `GK-INV-003`: Preserved. Executor and execution records are modeled explicitly; no fake execution path is added.
- `GK-INV-004`: Preserved. The implementation does not add owner questions for routine engineering details.
- `GK-INV-005`: Preserved. The implementation stays inside the modular monolith.
- `GK-INV-006`: Preserved. Missing execution-critical IPS references block coding task executability.
- `GK-INV-007`: Preserved. Tests and examples use synthetic identifiers only.
- `GK-INV-008`: Preserved. Self-improvement remains subject to the same domain lifecycle.
- `GK-INV-009`: Not applicable. No production deployment is in scope.
- `GK-INV-010`: Preserved. All new artifacts and user-facing text are English-only.

## Sensitive-Data Handling

Data classification is synthetic local development data. No secrets, raw production data, customer data, real Telegram IDs, or live repository credentials may be added to prompts, tests, migration examples, logs, or reports.

## Contract/Schema Impact

This goal adds the initial PostgreSQL schema contract under `src/db/migrations/` and TypeScript domain contracts under `src/domain/`. The migration must cover the core tables from `docs/DOMAIN_MODEL.md` or document any deliberate MVP omission.

## Replay/Determinism Impact

Lifecycle services must be deterministic for the same input state. Audit events and execution records are append-only. Tasks use `idempotency_key`, dependency arrays, attempt counters, and explicit validation/IPS fields to support replay and debugging.

## Scope

- Add explicit domain model types for projects, goals, intent records, plans, plan steps, tasks, executors, executions, IPS artifacts, blockers, overnight reports, decisions, and events.
- Add lifecycle transition services for goals, tasks, and raw intent records.
- Add an audit event writer abstraction.
- Add PostgreSQL migrations for the core tables and constraints.
- Add tests for happy-path and invalid transitions.
- Add validation and state documentation for Goal 02.

## Non-Goals

- Telegram bot, webhook, command parsing, or callbacks.
- AI planning, executor process launching, queue workers, or external CLI/MCP adapters.
- Production deployment.
- A web dashboard.
- Full ORM selection or live database connection pooling unless required by validation.

## Files To Inspect

- `package.json`
- `tsconfig.json`
- `src/app.ts`
- `src/health/health.test.ts`
- `docs/DOMAIN_MODEL.md`
- `docs/SYSTEM_ARCHITECTURE.md`
- `docs/IPS_INTEGRATION.md`
- `implementation-goals/GOAL-02-domain-persistence.md`

## Files To Create

- `implementation-goals/GOAL-02-domain-persistence.context-package.md`
- `implementation-goals/GOAL-02-domain-persistence.coding-prompt.md`
- `implementation-goals/GOAL-02-domain-persistence.validation-report.md`
- `src/domain/types.ts`
- `src/domain/events.ts`
- `src/domain/lifecycle.ts`
- `src/domain/lifecycle.test.ts`
- `src/db/migrations/0001_domain_persistence.sql`

## Files To Modify

- `docs/IMPLEMENTATION_STATE.md`
- `package.json` only if a migration validation script is added.

## Files That Must Not Be Modified

- IPS reference repository files.
- Production deployment files or remote server files.
- Telegram implementation files beyond existing documentation.
- `dist/` build output except through normal build commands.

## Implementation Steps

1. Create Goal 02 context package and coding prompt from this execution plan.
2. Run the local pre-coding gate for Goal 02.
3. Add TypeScript domain contracts that match `docs/DOMAIN_MODEL.md`.
4. Add lifecycle services that enforce approved goal transitions, task dependencies, validation-before-done, coding-task IPS references, and raw intent immutability.
5. Add append-only audit event writing through an in-memory event sink abstraction used by lifecycle services.
6. Add PostgreSQL migration SQL for all core tables and key constraints.
7. Add unit tests for valid and invalid lifecycle paths.
8. Run validation commands and update the validation report and implementation state.
9. Commit all Goal 02 changes.

## Test Plan

- Unit tests for goal intent approval, planning, activation, completion, cancellation, and invalid transitions.
- Unit tests for task approval, start, dependency blocking, coding IPS gate blocking, validation, completion, failure, and rejection reason handling.
- Unit tests proving raw intent records cannot be mutated through the domain service.
- Unit tests proving lifecycle transitions emit events.

## Validation Plan

- `npm test`
- `npm run typecheck`
- `npm run lint`
- `python3 scripts/strict_doc_audit.py --format markdown --fail-on-issues`
- `python3 scripts/pre_coding_gate.py --root . --goal implementation-goals/GOAL-02-domain-persistence.md`

## Gate Commands

```bash
python3 scripts/pre_coding_gate.py --root . --goal implementation-goals/GOAL-02-domain-persistence.md
python3 scripts/deployment_readiness_gate.py --root .
```

## Documentation Updates

- Update `docs/IMPLEMENTATION_STATE.md` with active branch, validation evidence, Goal 02 completion state, and next action.
- Add `implementation-goals/GOAL-02-domain-persistence.validation-report.md`.

## Rollback Plan

Revert the Goal 02 commit or remove the new `src/domain/`, `src/db/migrations/`, Goal 02 artifacts, and state-file updates. No production data or remote deployment is touched.

## Agent Handoff Prompt

Implement Goal 02 within the files and scope listed above. Preserve `Goal -> Plan -> PlanStep -> Task -> Execution -> Validation/Event` traceability, enforce raw intent immutability, block `done` without validation pass, block coding executability without approved IPS artifacts, and write an event for every lifecycle transition. Do not implement Telegram UI or external executor launching.

## Completion Checklist

- [ ] Implementation complete
- [ ] Tests complete
- [ ] Validation evidence collected
- [ ] Documentation updated
- [ ] Deviations documented
