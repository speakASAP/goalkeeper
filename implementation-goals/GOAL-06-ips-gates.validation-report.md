# VAL-GK-06: IPS Gates, Context Packages, And Coding Prompts

```yaml
id: VAL-GK-06
status: passed
validated_artifact: implementation-goals/GOAL-06-ips-gates.md
owner: orchestrator
created: 2026-06-12
last_updated: 2026-06-12
completeness_level: validated
branch: feature/gk-goal-06-ips-gates
```

## Artifact Validated

Goal 06 IPS settings, pre-coding gate evaluation, context package record generation, coding prompt record generation, validation evidence records, and blocker creation on `feature/gk-goal-06-ips-gates`.

## Validation Scope

- Goal 06 execution plan, context package, and coding prompt.
- Pure domain IPS service.
- Project IPS settings validation from project configuration.
- Fail-closed pre-coding gate behavior for coding tasks.
- IPS blocker creation for missing or incomplete execution-critical artifacts.
- Context package and coding prompt artifact generation from approved upstream artifacts.
- Gate validation evidence artifact records.
- Local GoalKeeper process gates.

## Evidence

- `npm test`: passed, 50 tests.
- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `git diff --check`: passed.

## Gate Evidence

- `python3 scripts/strict_doc_audit.py --format markdown --fail-on-issues`: passed before source edits and after implementation.
- `python3 scripts/pre_coding_gate.py --root . --goal implementation-goals/GOAL-06-ips-gates.md`: passed after marker wording remediation and after implementation.
- `python3 scripts/deployment_readiness_gate.py --root .`: passed. No deployment was performed and owner approval remains required.

## Invariant Evidence

- `GK-INV-001`: No dashboard workflow was introduced; IPS blockers are domain records for Telegram-visible handling in later integration.
- `GK-INV-002`: Coding tasks require upstream traceability, approved plans, approved IPS artifacts, context package, coding prompt, validation criteria, and gate evidence.
- `GK-INV-003`: No executor launching, routing, fake execution, or worker loop was added.
- `GK-INV-004`: Missing IPS data creates a blocker only for a true execution blocker.
- `GK-INV-005`: Implementation remains inside the TypeScript Fastify modular monolith.
- `GK-INV-006`: Draft artifacts, missing markers, missing traceability, and failed gate evidence block coding.
- `GK-INV-007`: Tests and artifacts use synthetic local data only.
- `GK-INV-008`: Self-improvement tasks would use the same IPS gate service.
- `GK-INV-009`: No production deployment performed.
- `GK-INV-010`: Strict documentation audit passed.

## Sensitive-Data Evidence

No secrets, real Telegram IDs, bot tokens, production data, customer data, credentials, screenshots, or live logs were added. Tests use synthetic identifiers and local placeholder paths only.

## Replay/Determinism Evidence

The IPS service is deterministic for the same project, goal, plan, task, artifact list, gate evidence, explicit IDs, context, and clock. Context packages, coding prompts, validation evidence, blockers, and task links are returned as explicit records.

## Passed Criteria

- Project stores and validates IPS settings.
- Pre-coding gate refuses tasks with missing upstream traceability.
- Draft or incomplete execution-critical artifacts block coding.
- Missing IPS data creates a blocker instead of invented context.
- Context package records link to task, goal, plan, and upstream artifacts.
- Coding prompt records can only be generated from approved execution plans.
- Gate results are stored as validation evidence.

## Failed Criteria

None.

## Deviations

The original Goal 06 prompt contained a literal missing-marker example inside a forbidden-change sentence, which caused the lightweight pre-coding gate to treat the prompt as unresolved. The sentence was reworded without changing intent. Runtime command execution of IPS scripts remains out of scope for Goal 06 and belongs with Goal 07 executor orchestration.

## Recommendation

Commit Goal 06, then proceed to Goal 07 executor orchestration using the IPS gate result as the required boundary before any coding executor can be selected.
