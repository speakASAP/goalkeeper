# PROMPT-GK-08: Validation, Retry, And Completion Reports

```yaml
id: PROMPT-GK-08
status: approved
source_execution_plan: implementation-goals/GOAL-08-validation-reports.execution-plan.md
source_context_package: implementation-goals/GOAL-08-validation-reports.context-package.md
owner: orchestrator
created: 2026-06-12
last_updated: 2026-06-12
completeness_level: complete
```

## Task Summary

Implement Goal 08 validation and reporting support: deterministic task validation reports, semantic validation adapter stub, human rejection and retry context, completion detection, and Telegram task/goal reports.

## Execution Plan Link

- `implementation-goals/GOAL-08-validation-reports.execution-plan.md`

## Context Package Link

- `implementation-goals/GOAL-08-validation-reports.context-package.md`

## Allowed Changes

- Create `src/domain/validation.ts`.
- Create `src/domain/validation.test.ts`.
- Modify `src/domain/types.ts` only for narrow validation/report contracts if needed.
- Modify `src/modules/telegram/renderers.ts`.
- Modify `src/modules/telegram/renderers.test.ts`.
- Update Goal 08 process artifacts and `docs/IMPLEMENTATION_STATE.md`.

## Forbidden Changes

- Do not deploy production changes or run remote server commands.
- Do not implement real LLM semantic validation.
- Do not add dashboard UI.
- Do not include secrets, raw production data, or full stdout/stderr logs in tests or reports.
- Do not weaken validation-before-done, IPS gate enforcement, or executor evidence requirements.

## Implementation Instructions

1. Add a pure domain validation module with deterministic functions for task validation, rejection/retry preparation, completion detection, and report composition.
2. Require acceptance criteria, successful execution evidence, artifact references when expected, and intent alignment evidence before a task validation report can pass.
3. Model semantic validation as an interface plus supplied stub result; do not call external services.
4. Preserve human rejection reason, retry feedback, previous attempt, and retry budget.
5. Refuse goal completion when any required task is not `done`, has failed validation, or is cancelled/blocked/failed.
6. Render compact Telegram task and goal reports that include executor, artifacts, validation, risks, original intent, final interpretation, decisions, and what was not done.
7. Keep tests synthetic and deterministic.

## Acceptance Criteria

- Invalid output cannot mark task done.
- Human rejection creates feedback and retry context.
- Task report includes executor, changed artifacts, validation, and risks.
- Goal report includes original intent, final interpretation, decisions, and validation evidence.
- Completion detection refuses incomplete or failed required tasks.
- Reports avoid raw secrets and full logs.

## Validation Commands

```bash
npm test
npm run typecheck
npm run lint
git diff --check
python3 scripts/strict_doc_audit.py --format markdown --fail-on-issues
python3 scripts/pre_coding_gate.py --root . --goal implementation-goals/GOAL-08-validation-reports.md
python3 scripts/deployment_readiness_gate.py --root .
```

## Expected Output

Return an Intent Compliance Report with implemented behavior, files changed, validation evidence, remaining autonomous-mode gaps, deviations, and next action. Update the Goal 08 validation report and implementation state before committing.
