# EP-GK-05: Planning And Task Creation

```yaml
id: EP-GK-05
status: approved
source_goal: implementation-goals/GOAL-05-planning-task-creation.md
owner: orchestrator
created: 2026-06-12
last_updated: 2026-06-12
completeness_level: complete
branch: feature/gk-goal-05-planning-task-creation
```

## Metadata

Goal 05 implements the approved-intent planning lifecycle, plan versioning, owner plan decisions, and deterministic task creation from approved plans. This plan is approved for bounded implementation on `feature/gk-goal-05-planning-task-creation`.

## Upstream Traceability

- `README.md`
- `docs/idea.md`
- `docs/PRODUCT_BRIEF.md`
- `docs/IMPLEMENTATION_SPEC.md`
- `docs/IPS_INTEGRATION.md`
- `docs/DOMAIN_MODEL.md`
- `docs/TELEGRAM_INTERFACE.md`
- `docs/governance/PROJECT_INVARIANTS.md`
- `docs/process/OPERATIONAL_GATES.md`
- `implementation-goals/GOAL-03-telegram-control-plane.md`
- `implementation-goals/GOAL-04-intent-memory.md`
- `implementation-goals/GOAL-05-planning-task-creation.md`

## Goal Impact

This goal bridges approved goal intent to executable task records without launching executors. It gives GoalKeeper a plan review checkpoint where the owner can approve, reject, or regenerate a proposed plan before task creation, preserving the product chain from raw request to approved intent, approved plan, and bounded tasks.

## Project Invariants

- `GK-INV-001`: Preserved. Plan approval and review are exposed through Telegram renderers and callbacks; no dashboard-first workflow is introduced.
- `GK-INV-002`: Preserved. Planning requires `intent_approved`; task creation requires an approved plan with traceable steps and acceptance criteria.
- `GK-INV-003`: Preserved. No executor launching, simulated execution, or untracked worker activity is added.
- `GK-INV-004`: Preserved. Owner questions remain limited to plan approval, rejection, regeneration, or true planning blockers.
- `GK-INV-005`: Preserved. Implementation remains inside the TypeScript Fastify modular monolith.
- `GK-INV-006`: Preserved. Draft, rejected, superseded, or incomplete plans cannot create tasks.
- `GK-INV-007`: Preserved. Tests use synthetic local data only.
- `GK-INV-008`: Preserved. GoalKeeper self-improvement goals would use the same approved-intent and approved-plan path.
- `GK-INV-009`: Not applicable. Production deployment is out of scope.
- `GK-INV-010`: Preserved. All artifacts, tests, and user-facing text remain English-only.

## Sensitive-Data Handling

Data classification is synthetic local development data. Tests and artifacts must not include live Telegram IDs, bot tokens, secrets, raw production messages, customer data, repository credentials, or real project logs.

## Contract/Schema Impact

This goal adds pure TypeScript planning service behavior around existing `Plan`, `PlanStep`, `Task`, `Decision`, and `Goal` contracts. It may add narrow type aliases or helper result interfaces, but it should not add a new database migration unless a required persisted field cannot be represented by the existing Goal 02 schema.

## Replay/Determinism Impact

Planning and task creation must be deterministic for the same inputs, IDs, context, and clock. Regeneration creates a new plan version and supersedes previous proposed plans. Approval creates one active approved plan for a goal and creates tasks with stable idempotency keys derived from goal, plan version, and plan step.

## Scope

- Add a pure planning module with a planner adapter interface and deterministic stub adapter.
- Add plan proposal and regeneration behavior with monotonically increasing versions.
- Add plan approval and rejection behavior with first-class decisions and audit events.
- Add task creation from approved plan steps, including dependencies, acceptance criteria, risk, approval requirements, and tool requirements.
- Add Telegram plan rendering and callback parser support for plan approval, rejection, regeneration, and why/explanation actions.
- Add focused tests for valid and invalid planning/task-creation attempts.

## Non-Goals

- Real LLM provider integration.
- Task execution, routing, worker loops, CLI/MCP adapters, or validation result processing.
- IPS context package or coding prompt generation for created tasks.
- Production deployment or remote server edits.
- Dashboard UI.

## Files To Inspect

- `src/domain/types.ts`
- `src/domain/lifecycle.ts`
- `src/domain/intent-memory.ts`
- `src/domain/events.ts`
- `src/modules/telegram/callbacks.ts`
- `src/modules/telegram/renderers.ts`
- `implementation-goals/GOAL-05-planning-task-creation.md`
- `docs/IMPLEMENTATION_SPEC.md`
- `docs/IPS_INTEGRATION.md`

## Files To Create

- `implementation-goals/GOAL-05-planning-task-creation.context-package.md`
- `implementation-goals/GOAL-05-planning-task-creation.coding-prompt.md`
- `implementation-goals/GOAL-05-planning-task-creation.validation-report.md`
- `src/domain/planning.ts`
- `src/domain/planning.test.ts`

## Files To Modify

- `src/domain/types.ts` only for required planning result types or narrow contract additions.
- `src/domain/lifecycle.ts` only if existing lifecycle guards need to call the new planning semantics.
- `src/modules/telegram/callbacks.ts`
- `src/modules/telegram/callbacks.test.ts`
- `src/modules/telegram/renderers.ts`
- `src/modules/telegram/renderers.test.ts`
- `docs/IMPLEMENTATION_STATE.md`

## Files That Must Not Be Modified

- IPS reference repository files.
- Production deployment files or remote server files.
- Executor, worker, routing, validation-report, and IPS-gate modules that belong to later goals.
- `dist/` build output except through normal build commands.

## Implementation Steps

1. Create Goal 05 context package and coding prompt from this execution plan.
2. Run strict documentation audit and the local pre-coding gate for Goal 05.
3. Add pure planning adapter, proposal, regeneration, approval, rejection, and task-creation functions.
4. Ensure plan generation fails unless the goal is `intent_approved` and task creation fails unless the plan is approved.
5. Ensure approval supersedes other proposed/approved plans for the same goal so only one approved plan remains active.
6. Map plan-step dependencies to created task dependencies without allowing dangling step references.
7. Add Telegram plan rendering and callback parsing support without executing tasks.
8. Add tests for acceptance criteria and invalid attempts.
9. Run validation commands, update the validation report and implementation state, then commit all Goal 05 changes.

## Test Plan

- Unit test proposing a plan from approved intent moves the goal through `planning` to `awaiting_plan_approval`.
- Unit test planning before intent approval is rejected.
- Unit test regeneration creates a higher plan version and supersedes prior proposed plans.
- Unit test approval leaves only one approved plan active and creates an owner decision.
- Unit test rejected, proposed, or superseded plans cannot create tasks.
- Unit test approved plan creates tasks with dependencies, acceptance criteria, approval requirements, risk, and tool requirements.
- Unit test plan steps without acceptance criteria or dangling dependencies are rejected.
- Unit test Telegram callbacks and renderers expose plan actions without starting execution.

## Validation Plan

- `npm test`
- `npm run typecheck`
- `npm run lint`
- `git diff --check`
- `python3 scripts/strict_doc_audit.py --format markdown --fail-on-issues`
- `python3 scripts/pre_coding_gate.py --root . --goal implementation-goals/GOAL-05-planning-task-creation.md`
- `python3 scripts/deployment_readiness_gate.py --root .`

## Gate Commands

```bash
python3 scripts/pre_coding_gate.py --root . --goal implementation-goals/GOAL-05-planning-task-creation.md
python3 scripts/deployment_readiness_gate.py --root .
```

## Documentation Updates

- Add Goal 05 execution plan, context package, coding prompt, and validation report.
- Update `docs/IMPLEMENTATION_STATE.md` with Goal 05 completion evidence and next action.

## Rollback Plan

Revert the Goal 05 commit or remove the new planning service, tests, Telegram plan renderer/callback changes, Goal 05 artifacts, and state-file updates. No production data, remote server files, or external services are touched.

## Agent Handoff Prompt

Implement Goal 05 within the files and scope listed above. Preserve approved intent before planning, approved plan before task creation, single active approved plan per goal, plan versioning, acceptance criteria, dependencies, risk, approval requirements, and tool requirements. Do not implement task execution, executor routing, IPS gate enforcement, real LLM providers, dashboard UI, or deployment.

## Completion Checklist

- [ ] Implementation complete
- [ ] Tests complete
- [ ] Validation evidence collected
- [ ] Documentation updated
- [ ] Deviations documented
