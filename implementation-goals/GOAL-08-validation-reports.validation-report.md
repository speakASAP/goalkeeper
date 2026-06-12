# VAL-GK-08: Validation, Retry, And Completion Reports

```yaml
id: VAL-GK-08
status: approved
validated_artifact: implementation-goals/GOAL-08-validation-reports.md
owner: validator
created: 2026-06-12
last_updated: 2026-06-12
completeness_level: validated
```

## Artifact Validated

Goal 08 validation, retry, and completion reporting on branch `feature/gk-goal-08-validation-reports`, including execution plan, context package, coding prompt, `src/domain/validation.ts`, `src/domain/validation.test.ts`, Telegram report renderers, callback parsing for report actions, and implementation state update.

## Validation Scope

Validation covered deterministic task validation, semantic validation adapter stub behavior, invalid-output refusal, task validation result conversion, human rejection feedback and retry context, retry budget exhaustion, goal completion refusal for incomplete or unvalidated tasks, goal completion report composition, Telegram task validation reports, Telegram goal completion reports, and callback parsing for retry/reject/acknowledge actions.

## Evidence

- `npm test`: passed with 68 tests.
- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `git diff --check`: passed.
- Manual source review confirmed reports use summaries, evidence names, and artifact refs instead of full stdout/stderr logs.

## Gate Evidence

- `python3 scripts/strict_doc_audit.py --format markdown --fail-on-issues`: passed before and after source edits.
- `python3 scripts/pre_coding_gate.py --root . --goal implementation-goals/GOAL-08-validation-reports.md`: passed before and after source edits.
- `python3 scripts/deployment_readiness_gate.py --root .`: passed. Production deployment was not performed and still requires owner approval.

## Invariant Evidence

- `GK-INV-001`: Preserved. Validation and completion reports are Telegram-renderable; no dashboard workflow was introduced.
- `GK-INV-002`: Preserved. Task and goal reports include preserved intent, approved interpretation, execution evidence, and validation evidence.
- `GK-INV-003`: Preserved. Reports consume explicit executor IDs, execution IDs, evidence, and artifact references.
- `GK-INV-004`: Preserved. Owner rejection is explicit feedback for retry when validation cannot accept the result.
- `GK-INV-005`: Preserved. The implementation remains inside the TypeScript Fastify modular monolith.
- `GK-INV-006`: Preserved. Missing evidence, invalid output, failed semantic validation, or unvalidated tasks block completion.
- `GK-INV-007`: Preserved. Tests use synthetic data, and renderers avoid raw logs and secrets.
- `GK-INV-008`: Preserved. GoalKeeper self-improvement tasks would use the same validation and completion-report path.
- `GK-INV-009`: Not applicable. Deployment was out of scope and not performed.
- `GK-INV-010`: Preserved. Added documentation, tests, and user-facing strings are English-only.

## Sensitive-Data Evidence

Tests use synthetic goal, task, decision, executor, artifact, and validation evidence values. Telegram reports render evidence summaries and artifact refs only. No real Telegram token, production data, repository credential, customer data, screenshot, or live log was added.

## Replay/Determinism Evidence

Task validation is deterministic for the same task, execution records, acceptance criteria, intent fields, semantic validation result, artifact refs, and validation evidence. Goal completion assessment is deterministic for the same goal, task set, decisions, and task reports. Retry context records rejection reason, feedback, previous attempt, remaining attempts, and timestamp so future workers can replay why the retry was prepared.

## Passed Criteria

- Invalid output cannot produce a passed validation report or mark a task done.
- Human rejection creates feedback and retry context.
- Retry preparation refuses exhausted retry budgets.
- Task reports include executor, artifacts, validation evidence, risks, and not-done items.
- Goal reports include original intent, final interpretation, decisions, validation evidence, artifacts, and risks.
- Completion detection refuses incomplete or unvalidated required tasks.
- Telegram report renderers avoid full execution logs.

## Failed Criteria

None.

## Deviations

Required subagent roles were implemented directly in the main session instead of spawning separate workers because the code surface was compact and write ownership would have overlapped across `src/domain/validation.ts`, `src/domain/validation.test.ts`, and Telegram renderer tests. The semantic validator is an adapter/stub only, as required by the goal.

## Recommendation

Proceed to Goal 09 Overnight Self-Improvement after committing Goal 08 and verifying a clean worktree. Do not deploy to production without explicit owner approval.
