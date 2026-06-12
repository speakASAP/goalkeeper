# EP-GK-09: Overnight Mode And Self-Improvement Execution Plan

```yaml
id: EP-GK-09
status: approved
source_goal: implementation-goals/GOAL-09-overnight-self-improvement.md
owner: orchestrator
created: 2026-06-12
last_updated: 2026-06-12
completeness_level: complete
branch: feature/gk-goal-09-overnight-self-improvement
```

## Metadata

Goal 09 implements MVP autonomous overnight monitoring, digest reporting, status commands, task-log summaries, blocker aggregation, and GoalKeeper self-improvement project registration. The work is approved for this implementation session by the explicit user command: `GOALKEEPER ORCHESTRATOR: implement goal number 9`.

## Upstream Traceability

- `README.md`
- `docs/idea.md`
- `docs/PRODUCT_BRIEF.md`
- `docs/IMPLEMENTATION_SPEC.md`
- `docs/AUTONOMOUS_DEVELOPMENT.md`
- `docs/AGENT_ORCHESTRATION.md`
- `docs/IPS_INTEGRATION.md`
- `docs/governance/PROJECT_INVARIANTS.md`
- `implementation-goals/GOAL-08-validation-reports.md`
- `implementation-goals/GOAL-09-overnight-self-improvement.md`

## Goal Impact

This goal moves GoalKeeper from one-task execution and validation toward bounded autonomous operation. The implementation must let the owner enable overnight policy, inspect active agents and executors, review concise task logs, receive a digest of completed, failed, partial, blocked, and awaiting-user work, and register GoalKeeper itself as a normal tracked project. Self-improvement must remain inside the same IPS path as external projects.

## Project Invariants

- `GK-INV-001`: Telegram remains the primary control plane through `/overnight`, `/agents`, `/executors`, and `/task_log` command support.
- `GK-INV-002`: Autonomous coding work is allowed only when IPS gate and artifact references are present.
- `GK-INV-003`: Monitor output is derived from executor and execution evidence; no fake autonomous results are introduced.
- `GK-INV-004`: Owner prompts are limited to structured blockers and awaiting-user work.
- `GK-INV-005`: Implementation remains in the TypeScript Fastify modular monolith.
- `GK-INV-006`: Missing IPS evidence blocks autonomous coding eligibility.
- `GK-INV-007`: Digest and task-log renderers summarize evidence and do not include raw logs or secrets.
- `GK-INV-008`: GoalKeeper self-improvement is registered as a tracked project with IPS enabled and no shortcut execution.
- `GK-INV-009`: Production deployment is out of scope and requires owner approval.
- `GK-INV-010`: All docs, tests, reports, and user-facing strings remain English-only.

## Sensitive-Data Handling

Tests and examples use synthetic IDs, paths, task titles, evidence summaries, and repository metadata. Task-log and digest outputs must include summarized events, evidence names, artifact references, and blockers only; raw stdout, stderr, tokens, secrets, production logs, and customer data must not be rendered.

## Contract/Schema Impact

Domain type additions are expected for overnight policy, monitor snapshots, agent/executor status views, task-log summaries, digest reports, blocker groups, and self-improvement bootstrap records. The existing database migration is not changed in this goal; runtime persistence integration remains for later hardening unless a narrow type extension is needed.

## Replay/Determinism Impact

Monitor and digest generation must be deterministic for the same input snapshot, task set, execution summaries, blockers, and policy. Retry or execution launch side effects are not implemented in this goal. Overnight eligibility must fail closed when risk, approval, concurrency, dependency, executor, validation, or IPS evidence is incomplete.

## Scope

- Add a pure domain overnight/autonomy service.
- Add digest, blocker aggregation, agent status, executor status, and task-log summary composition.
- Add Telegram command parsing and renderers for overnight policy/status, agent state, executor state, and task logs.
- Add GoalKeeper self-improvement project bootstrap support that marks IPS as required.
- Add tests covering completed, failed, partial, blocked, awaiting-user, and gated self-improvement scenarios.
- Update implementation state and validation report after checks pass.

## Non-Goals

- No production deployment.
- No real scheduler, queue, or long-running process manager.
- No dashboard-first UI.
- No high-risk, destructive, or deployment command auto-run.
- No bypass around IPS gates, task validation, approval gates, or executor permissions.
- No raw log streaming to Telegram.

## Files To Inspect

- `src/domain/types.ts`
- `src/domain/executors.ts`
- `src/domain/validation.ts`
- `src/domain/*test.ts`
- `src/modules/telegram/commands.ts`
- `src/modules/telegram/renderers.ts`
- `src/modules/telegram/*test.ts`
- `docs/AUTONOMOUS_DEVELOPMENT.md`
- `docs/AGENT_ORCHESTRATION.md`

## Files To Create

- `src/domain/overnight.ts`
- `src/domain/overnight.test.ts`
- `implementation-goals/GOAL-09-overnight-self-improvement.context-package.md`
- `implementation-goals/GOAL-09-overnight-self-improvement.coding-prompt.md`
- `implementation-goals/GOAL-09-overnight-self-improvement.validation-report.md`

## Files To Modify

- `src/domain/types.ts`
- `src/modules/telegram/commands.ts`
- `src/modules/telegram/commands.test.ts`
- `src/modules/telegram/renderers.ts`
- `src/modules/telegram/renderers.test.ts`
- `docs/IMPLEMENTATION_STATE.md`
- `README.md` if a compact operational note is needed

## Files That Must Not Be Modified

- `.env` or secret-bearing local files
- `package-lock.json` unless dependency changes are explicitly required
- Production deployment scripts or server manifests
- Intent Preservation System reference repository files

## Implementation Steps

1. Define overnight policy, monitor input, digest, blocker, task-log, status, and self-improvement types.
2. Implement deterministic pure functions for overnight eligibility, digest composition, blocker aggregation, task-log summarization, status views, and GoalKeeper project bootstrap.
3. Add Telegram command parsing for `/overnight`, `/agents`, `/executors`, and `/task_log`.
4. Add Telegram renderers that provide concise summaries without raw logs.
5. Add focused tests for overnight policy gating, digest buckets, blockers, status commands, task logs, and self-improvement IPS requirements.
6. Run validation and gates, update the validation report and implementation state, then commit the goal.

## Test Plan

- Domain tests for autonomous eligibility and fail-closed gates.
- Domain tests for digest grouping across completed, failed, partial, blocked, and awaiting-user tasks.
- Domain tests for blocker aggregation and GoalKeeper self-improvement project bootstrap.
- Telegram command tests for `/overnight`, `/agents`, `/executors`, and `/task_log`.
- Telegram renderer tests for overnight digest/status output and task-log redaction boundaries.

## Validation Plan

Run:

```bash
npm test
npm run typecheck
npm run lint
git diff --check
python3 scripts/strict_doc_audit.py --format markdown --fail-on-issues
python3 scripts/pre_coding_gate.py --root . --goal implementation-goals/GOAL-09-overnight-self-improvement.md
python3 scripts/deployment_readiness_gate.py --root .
```

## Gate Commands

```bash
python3 scripts/strict_doc_audit.py --format markdown --fail-on-issues
python3 scripts/pre_coding_gate.py --root . --goal implementation-goals/GOAL-09-overnight-self-improvement.md
python3 scripts/deployment_readiness_gate.py --root .
```

## Documentation Updates

- Add goal 9 context package, coding prompt, and validation report.
- Update `docs/IMPLEMENTATION_STATE.md` with compressed implementation state, evidence, and next action.
- Update `README.md` only if the new operational surface needs a short user-facing entry.

## Rollback Plan

Revert the Goal 09 commit to remove the overnight domain module, Telegram commands/renderers, tests, and process artifacts. No migration or production deployment is part of this goal.

## Agent Handoff Prompt

Implement Goal 09 on `feature/gk-goal-09-overnight-self-improvement`. Preserve Telegram-first control, IPS fail-closed behavior, explicit executor evidence, summarized logs only, and GoalKeeper self-improvement through the same tracked project and IPS path. Stay within the files listed in this plan, run the validation commands, and document any deviation.

## Completion Checklist

- [x] Implementation complete
- [x] Tests complete
- [x] Validation evidence collected
- [x] Documentation updated
- [x] Deviations documented
