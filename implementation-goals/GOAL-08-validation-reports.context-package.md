# CP-GK-08: Validation, Retry, And Completion Reports

```yaml
id: CP-GK-08
status: approved
source_execution_plan: implementation-goals/GOAL-08-validation-reports.execution-plan.md
owner: orchestrator
created: 2026-06-12
last_updated: 2026-06-12
completeness_level: complete
```

## Target Task

Implement Goal 08 deterministic validation, semantic validation adapter stub, human rejection and retry context, goal completion detection, and Telegram task/goal reports.

## Upstream Traceability

- `implementation-goals/GOAL-08-validation-reports.execution-plan.md`
- `implementation-goals/GOAL-08-validation-reports.md`
- `implementation-goals/GOAL-07-executor-orchestration.md`
- `docs/IMPLEMENTATION_SPEC.md`
- `docs/IPS_INTEGRATION.md`
- `docs/AGENT_ORCHESTRATION.md`
- `docs/governance/PROJECT_INVARIANTS.md`
- `docs/process/OPERATIONAL_GATES.md`
- `/Users/Sergej.Stasok/Documents/Gitlab/intent-preservation-system/AGENTS.md`
- `/Users/Sergej.Stasok/Documents/Gitlab/intent-preservation-system/17_governance/AI_AGENT_RULES.md`
- `/Users/Sergej.Stasok/Documents/Gitlab/intent-preservation-system/17_governance/PROJECT_INVARIANTS.md`

## Included Documents

- `docs/IMPLEMENTATION_SPEC.md`: source of validation, task completion, and goal completion requirements.
- `docs/IPS_INTEGRATION.md`: source of validation as proof of alignment with preserved intent.
- `docs/AGENT_ORCHESTRATION.md`: source of execution record and executor evidence requirements.
- `docs/governance/PROJECT_INVARIANTS.md`: source of invariant evidence required by validation reports.
- `implementation-goals/GOAL-07-executor-orchestration.md`: source of upstream executor evidence behavior.
- `implementation-goals/GOAL-08-validation-reports.md`: source of Goal 08 acceptance criteria and allowed changes.
- `src/domain/lifecycle.ts`: existing validation-before-done and goal completion invariants.
- `src/domain/executors.ts`: existing execution evidence and routing result contracts.
- `src/modules/telegram/renderers.ts`: existing Telegram rendering patterns.

## Excluded Documents

- Goal 09 overnight self-improvement is excluded except for leaving a clean report path for later digest work.
- Goal 10 hardening and production deployment are excluded because deployment is out of scope.
- Dashboard files are excluded because Telegram remains the primary control plane.
- Remote RunLayer files are excluded because this goal is local GoalKeeper implementation only.

## Constraints

- Validation must check acceptance criteria and intent alignment evidence, not only command success.
- Failed validation or missing evidence must block task completion.
- Goal completion must refuse incomplete, failed, blocked, cancelled, or unvalidated required tasks.
- Human rejection must create feedback and retry context without discarding executor evidence.
- Reports must use summaries and artifact references, not raw logs or secrets.
- Semantic validation remains an adapter stub; no LLM or network call is allowed.

## Allowed Changes

- `src/domain/validation.ts`
- `src/domain/validation.test.ts`
- Narrow type additions in `src/domain/types.ts` if needed.
- `src/modules/telegram/renderers.ts`
- `src/modules/telegram/renderers.test.ts`
- Goal 08 process artifacts and implementation state.

## Forbidden Changes

- Do not deploy production changes.
- Do not run remote server commands.
- Do not send or store raw secrets or full execution logs in reports.
- Do not allow task or goal completion without passed validation.
- Do not implement overnight autonomous mode or deployment approval flow.

## Agent Prompt

Implement the validation and reporting domain layer described by `implementation-goals/GOAL-08-validation-reports.execution-plan.md`. Keep validation deterministic and fail-closed. Compose reports from preserved intent, decisions, executor evidence, artifacts, validation evidence, risks, and not-done items. Add Telegram renderers that provide compact owner-facing summaries without raw logs.

## Validation Instructions

Run:

```bash
npm test
npm run typecheck
npm run lint
git diff --check
python3 scripts/strict_doc_audit.py --format markdown --fail-on-issues
python3 scripts/pre_coding_gate.py --root . --goal implementation-goals/GOAL-08-validation-reports.md
python3 scripts/deployment_readiness_gate.py --root .
```
