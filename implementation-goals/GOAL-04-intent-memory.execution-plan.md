# EP-GK-04: Intent Capture Approval And Memory

```yaml
id: EP-GK-04
status: approved
source_goal: implementation-goals/GOAL-04-intent-memory.md
owner: orchestrator
created: 2026-06-12
last_updated: 2026-06-12
completeness_level: complete
branch: feature/gk-goal-04-intent-memory
```

## Metadata

Goal 04 implements intent capture, normalized intent approval, corrections, decisions, and stale downstream artifact marking after Goal 02 established the domain contracts. This plan is approved for bounded implementation on `feature/gk-goal-04-intent-memory`.

## Upstream Traceability

- `README.md`
- `docs/idea.md`
- `docs/PRODUCT_BRIEF.md`
- `docs/IMPLEMENTATION_SPEC.md`
- `docs/IPS_INTEGRATION.md`
- `docs/INTENT_MEMORY.md`
- `docs/DOMAIN_MODEL.md`
- `docs/governance/PROJECT_INVARIANTS.md`
- `docs/process/OPERATIONAL_GATES.md`
- `implementation-goals/GOAL-04-intent-memory.md`

## Goal Impact

This goal makes the original owner request immutable and gives GoalKeeper a service boundary for turning raw goal text into a reviewable intent card. It enables later planning and task creation to rely on approved meaning instead of vague Telegram text, and it ensures corrections create auditable records and mark affected downstream artifacts stale.

## Project Invariants

- `GK-INV-001`: Preserved. No dashboard or dashboard-first workflow is introduced.
- `GK-INV-002`: Preserved. Intent services enforce raw request preservation, intent approval before planning, and correction-to-artifact traceability.
- `GK-INV-003`: Preserved. No executor launching or simulated autonomous execution is added.
- `GK-INV-004`: Preserved. Owner input is modeled only for intent approval, correction, or decision records.
- `GK-INV-005`: Preserved. Implementation remains inside the TypeScript modular monolith.
- `GK-INV-006`: Preserved. Corrections stale downstream IPS artifacts instead of allowing stale context or prompts to authorize coding.
- `GK-INV-007`: Preserved. Tests use synthetic local text and identifiers only.
- `GK-INV-008`: Preserved. GoalKeeper self-improvement would use the same intent lifecycle.
- `GK-INV-009`: Not applicable. Production deployment is out of scope.
- `GK-INV-010`: Preserved. All artifacts, comments, tests, and user-facing text remain English-only.

## Sensitive-Data Handling

Data classification is synthetic local development data. Tests and examples must not include real Telegram user IDs, live bot tokens, secrets, raw production messages, customer data, or repository credentials.

## Contract/Schema Impact

This goal extends in-memory TypeScript domain contracts and lifecycle behavior. It may add fields to intent and artifact types needed for approval, correction, stale reasons, and decision links. It should not add a new database migration unless a required persisted field cannot be represented by existing Goal 02 schema contracts.

## Replay/Determinism Impact

Intent lifecycle functions must be deterministic for the same input records, context, and clock. Raw intent stays immutable. Corrections return new records and explicit stale artifact results so future replay can explain why a plan, task, context package, or coding prompt was invalidated.

## Scope

- Add an intent-memory service for raw capture, normalized intent card creation, approval, corrections, decisions, and stale marking.
- Extend domain types only where Goal 04 requires stronger intent semantics.
- Add lifecycle tests for approval, correction, decision records, stale downstream artifacts, and blocked planning before intent approval.
- Add Goal 04 context package, coding prompt, validation report, and state updates.

## Non-Goals

- Real LLM extraction or provider integration.
- Plan generation or task creation.
- Telegram webhook, command parser, or callback changes.
- Database runtime wiring or live PostgreSQL validation.
- Executor routing, worker execution, or deployment.
- Dashboard UI.

## Files To Inspect

- `src/domain/types.ts`
- `src/domain/lifecycle.ts`
- `src/domain/lifecycle.test.ts`
- `src/domain/events.ts`
- `docs/INTENT_MEMORY.md`
- `docs/DOMAIN_MODEL.md`
- `docs/IMPLEMENTATION_SPEC.md`
- `docs/IPS_INTEGRATION.md`
- `implementation-goals/GOAL-04-intent-memory.md`

## Files To Create

- `implementation-goals/GOAL-04-intent-memory.context-package.md`
- `implementation-goals/GOAL-04-intent-memory.coding-prompt.md`
- `implementation-goals/GOAL-04-intent-memory.validation-report.md`
- `src/domain/intent-memory.ts`
- `src/domain/intent-memory.test.ts`

## Files To Modify

- `src/domain/types.ts`
- `src/domain/lifecycle.ts` only if existing lifecycle guards need to call the new intent semantics.
- `src/domain/lifecycle.test.ts` only for lifecycle guard coverage.
- `docs/IMPLEMENTATION_STATE.md`

## Files That Must Not Be Modified

- IPS reference repository files.
- Production deployment files or remote server files.
- Goal 03 Telegram implementation files on another branch.
- Executor, worker, planning, and validation modules that belong to later goals.
- `dist/` build output except through normal build commands.

## Implementation Steps

1. Create Goal 04 context package and coding prompt from this execution plan.
2. Run the local pre-coding gate for Goal 04.
3. Inspect the existing domain contracts and lifecycle tests from Goal 02.
4. Add intent-memory types and service functions for raw capture, normalized intent cards, approval, correction, decisions, and stale artifact marking.
5. Keep raw intent immutable by returning new records and throwing on invalid updates.
6. Ensure corrections can stale plans, tasks, context packages, and coding prompts through explicit returned records and events.
7. Add unit tests for acceptance criteria and lifecycle edge cases.
8. Run validation commands and update the validation report and implementation state.
9. Commit all Goal 04 changes.

## Test Plan

- Unit test raw goal capture creates immutable raw intent and a normalized card without overwriting source text.
- Unit test intent approval transitions a goal to `intent_approved` and emits decision/event evidence.
- Unit test planning before intent approval remains blocked.
- Unit test correction creates a new intent record and does not mutate raw or prior summary records.
- Unit test correction stale marking affects approved/proposed plans, active tasks, context packages, and coding prompts.
- Unit test first-class decisions are created for approval and correction flows.

## Validation Plan

- `npm test`
- `npm run typecheck`
- `npm run lint`
- `git diff --check`
- `python3 scripts/strict_doc_audit.py --format markdown --fail-on-issues`
- `python3 scripts/pre_coding_gate.py --root . --goal implementation-goals/GOAL-04-intent-memory.md`

## Gate Commands

```bash
python3 scripts/pre_coding_gate.py --root . --goal implementation-goals/GOAL-04-intent-memory.md
python3 scripts/deployment_readiness_gate.py --root .
```

## Documentation Updates

- Add Goal 04 context package, coding prompt, and validation report.
- Update `docs/IMPLEMENTATION_STATE.md` with Goal 04 completion evidence and next action.

## Rollback Plan

Revert the Goal 04 commit or remove the new intent-memory service, tests, Goal 04 artifacts, and state-file updates. No production data, remote server files, or external services are touched.

## Agent Handoff Prompt

Implement Goal 04 within the files and scope listed above. Preserve raw intent immutability, require approved normalized intent before planning, store approval and correction decisions as first-class records, and mark downstream plans, tasks, context packages, and coding prompts stale after corrections. Do not implement planning, task creation, LLM extraction, Telegram hooks, executor routing, or deployment.

## Completion Checklist

- [ ] Implementation complete
- [ ] Tests complete
- [ ] Validation evidence collected
- [ ] Documentation updated
- [ ] Deviations documented
