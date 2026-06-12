# EP-GK-08: Validation, Retry, And Completion Reports

```yaml
id: EP-GK-08
status: approved
source_goal: implementation-goals/GOAL-08-validation-reports.md
owner: orchestrator
created: 2026-06-12
last_updated: 2026-06-12
completeness_level: complete
branch: feature/gk-goal-08-validation-reports
```

## Metadata

Goal 08 implements deterministic validation, retry/rejection handling, completion detection, and Telegram task/goal reports on `feature/gk-goal-08-validation-reports`. The plan is approved for pure domain implementation, report renderers, focused tests, process artifacts, validation reporting, and state updates. It does not authorize production deployment, autonomous overnight mode, or weakening Goal 06/07 IPS and executor evidence.

## Upstream Traceability

- `README.md`
- `docs/idea.md`
- `docs/PRODUCT_BRIEF.md`
- `docs/IMPLEMENTATION_SPEC.md`
- `docs/IPS_INTEGRATION.md`
- `docs/AGENT_ORCHESTRATION.md`
- `docs/governance/PROJECT_INVARIANTS.md`
- `docs/process/DOCUMENTATION_COMPLETENESS_STANDARD.md`
- `docs/process/OPERATIONAL_GATES.md`
- `docs/process/AGENT_GAP_FILLING_RULES.md`
- `implementation-goals/GOAL-07-executor-orchestration.md`
- `implementation-goals/GOAL-08-validation-reports.md`
- `/Users/Sergej.Stasok/Documents/Gitlab/intent-preservation-system/AGENTS.md`
- `/Users/Sergej.Stasok/Documents/Gitlab/intent-preservation-system/17_governance/AI_AGENT_RULES.md`
- `/Users/Sergej.Stasok/Documents/Gitlab/intent-preservation-system/17_governance/PROJECT_INVARIANTS.md`

## Goal Impact

This goal closes the loop after executor runs. It ensures tasks cannot be considered complete unless validation evidence proves acceptance criteria and preserved intent alignment, owner rejections create explicit retry context, incomplete goals cannot be completed, and Telegram reports summarize original intent, final interpretation, decisions, executor evidence, validation evidence, risks, and what was not done.

## Project Invariants

- `GK-INV-001`: Preserved. Reports are Telegram-renderable and no dashboard workflow is introduced.
- `GK-INV-002`: Preserved. Validation reports include original intent, approved interpretation, execution evidence, and validation evidence.
- `GK-INV-003`: Preserved. Task reports consume explicit executor and execution records instead of simulated execution.
- `GK-INV-004`: Preserved. Human rejection is modeled as decision feedback only when validation or owner review cannot accept the result.
- `GK-INV-005`: Preserved. Implementation remains inside the TypeScript Fastify modular monolith.
- `GK-INV-006`: Preserved. Incomplete validation evidence and failed criteria block completion.
- `GK-INV-007`: Preserved. Report renderers use summaries and artifact refs only; tests use synthetic data and no secrets.
- `GK-INV-008`: Preserved. Self-improvement completion would use the same validation and report path.
- `GK-INV-009`: Not applicable. Production deployment is out of scope.
- `GK-INV-010`: Preserved. All repository text remains English-only.

## Sensitive-Data Handling

Data classification is synthetic local development data. Tests and examples must use fake goal, task, executor, artifact, and decision data. Telegram reports must include summaries, artifact references, and evidence names, not full raw logs or secret values. No real Telegram bot token, production log, customer data, or remote credential may be added.

## Contract/Schema Impact

This goal adds TypeScript domain contracts for validation reports, validation report inputs, semantic validation adapter stubs, task retry feedback, task report summaries, and goal completion reports. The existing Goal 02 migration already contains validation report IPS artifacts and task validation fields, so no database migration is planned unless the existing persisted shape cannot represent the new contracts.

## Replay/Determinism Impact

Deterministic validation must produce the same pass/fail result for the same task, execution records, acceptance criteria, evidence, intent summary, and artifact references. Completion detection must be deterministic for the same goal and task set. Retry context must preserve the rejection reason and previous attempt count so later workers can replay why a task was retried.

## Scope

- Add a validation domain module that evaluates execution records, acceptance criteria, artifact references, risks, and intent alignment evidence.
- Add a semantic validation adapter interface and deterministic stub result composition without calling an LLM.
- Add human rejection and retry preparation that records feedback, increments retry context through existing attempt fields, and refuses retry when the budget is exhausted.
- Add goal completion detection and report composition that refuses incomplete, failed, blocked, or unvalidated required tasks.
- Add Telegram renderers for task validation reports and goal completion reports.
- Add focused unit tests covering invalid output, human rejection/retry, task reports, goal reports, and completion refusal.
- Update Goal 08 process artifacts, validation report, and implementation state.

## Non-Goals

- No production deploy or remote server command execution.
- No real LLM semantic validation call.
- No overnight autonomous monitor or digest; that belongs to Goal 09.
- No dashboard UI.
- No persistence migration unless strictly necessary.
- No weakening of lifecycle validation-before-done or Goal 06/07 IPS routing checks.

## Files To Inspect

- `src/domain/types.ts`
- `src/domain/lifecycle.ts`
- `src/domain/executors.ts`
- `src/domain/executors.test.ts`
- `src/modules/telegram/renderers.ts`
- `src/modules/telegram/renderers.test.ts`
- `docs/IMPLEMENTATION_SPEC.md`
- `docs/IPS_INTEGRATION.md`
- `implementation-goals/GOAL-08-validation-reports.md`

## Files To Create

- `implementation-goals/GOAL-08-validation-reports.context-package.md`
- `implementation-goals/GOAL-08-validation-reports.coding-prompt.md`
- `implementation-goals/GOAL-08-validation-reports.validation-report.md`
- `src/domain/validation.ts`
- `src/domain/validation.test.ts`

## Files To Modify

- `src/domain/types.ts` only for narrow validation/report contracts if needed.
- `src/modules/telegram/renderers.ts`
- `src/modules/telegram/renderers.test.ts`
- `docs/IMPLEMENTATION_STATE.md`

## Files That Must Not Be Modified

- IPS reference repository files.
- Production deployment files or remote server files.
- Dashboard UI files.
- Executor routing code except for narrow type compatibility if required.
- `dist/` build output except through normal build commands.

## Implementation Steps

1. Create Goal 08 context package and coding prompt from this execution plan.
2. Run strict documentation audit, the Goal 08 pre-coding gate, and deployment-readiness gate before source edits.
3. Implement deterministic validation report composition for task output, executor evidence, acceptance criteria, artifact refs, risks, and intent alignment.
4. Add a semantic validation adapter interface and a deterministic adapter result path without external calls.
5. Implement owner rejection and retry preparation with feedback context and retry-budget enforcement.
6. Implement goal completion detection and final goal report composition.
7. Add Telegram renderers for task reports and goal reports that avoid full logs and secrets.
8. Add focused tests for validation failure, validation pass, report content, retry context, budget exhaustion, and completion refusal.
9. Run validation commands, update the validation report and implementation state, then commit all Goal 08 changes.

## Test Plan

- Unit test invalid output cannot produce a passed task validation report.
- Unit test passed validation requires acceptance criteria, executor evidence, and intent alignment evidence.
- Unit test human rejection creates feedback and retry context.
- Unit test retry preparation refuses exhausted retry budgets.
- Unit test task reports include executor, artifacts, validation evidence, risks, and not-done items.
- Unit test goal reports include original intent, final interpretation, decisions, validation evidence, and completed task summaries.
- Unit test completion detection refuses incomplete, failed, blocked, cancelled, or unvalidated required tasks.
- Unit test Telegram renderers produce compact report text without full stdout/stderr logs.

## Validation Plan

- `npm test`
- `npm run typecheck`
- `npm run lint`
- `git diff --check`
- `python3 scripts/strict_doc_audit.py --format markdown --fail-on-issues`
- `python3 scripts/pre_coding_gate.py --root . --goal implementation-goals/GOAL-08-validation-reports.md`
- `python3 scripts/deployment_readiness_gate.py --root .`

## Gate Commands

```bash
python3 scripts/pre_coding_gate.py --root . --goal implementation-goals/GOAL-08-validation-reports.md
python3 scripts/deployment_readiness_gate.py --root .
```

## Documentation Updates

- Add Goal 08 execution plan, context package, coding prompt, and validation report.
- Update `docs/IMPLEMENTATION_STATE.md` with Goal 08 completion evidence and next action.

## Rollback Plan

Revert the Goal 08 commit or remove the new validation service, tests, Telegram report renderers, Goal 08 artifacts, and state-file updates. No production data, remote server files, external services, or destructive commands are touched.

## Agent Handoff Prompt

Implement Goal 08 within the files and scope listed above. Preserve validation as proof of intent alignment, not just command success. Do not mark tasks or goals complete without passed validation evidence. Keep reports concise, Telegram-renderable, and free of raw logs or secrets. Use deterministic tests and no external semantic validation calls.

## Completion Checklist

- [ ] Implementation complete
- [ ] Tests complete
- [ ] Validation evidence collected
- [ ] Documentation updated
- [ ] Deviations documented
