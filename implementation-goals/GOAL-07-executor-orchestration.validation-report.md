# VAL-GK-07: Executor Orchestration, Worker Loop, And Routing

```yaml
id: VAL-GK-07
status: approved
validated_artifact: implementation-goals/GOAL-07-executor-orchestration.md
owner: validator
created: 2026-06-12
last_updated: 2026-06-12
completeness_level: validated
```

## Artifact Validated

Goal 07 executor orchestration on branch `feature/gk-goal-07-executor-orchestration`, including execution plan, context package, coding prompt, `src/domain/executors.ts`, `src/domain/executors.test.ts`, README operational notes, and implementation state update.

## Validation Scope

Validation covered executor registry matching, project-root authorization, risk constraints, approval gates, routing decisions and fallbacks, dependency-aware worker readiness, retry budget handling, CLI command evidence capture, timeout status, secret redaction, MCP adapter interface shape, interactive blocker creation, and fail-closed refusal for coding tasks without passed IPS evidence.

## Evidence

- `npm test`: passed with 60 tests.
- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `git diff --check`: passed.
- Manual source review confirmed the concrete CLI adapter uses harmless executable/argument execution without shell interpolation and validates allowed working directories.

## Gate Evidence

- `python3 scripts/strict_doc_audit.py --format markdown --fail-on-issues`: passed.
- `python3 scripts/pre_coding_gate.py --root . --goal implementation-goals/GOAL-06-ips-gates.md`: passed before Goal 7 source edits as dependency preflight.
- `python3 scripts/pre_coding_gate.py --root . --goal implementation-goals/GOAL-07-executor-orchestration.md`: passed before and after source edits.
- `python3 scripts/deployment_readiness_gate.py --root .`: passed. Production deployment was not performed and still requires owner approval.

## Invariant Evidence

- `GK-INV-001`: Preserved. No dashboard workflow was introduced.
- `GK-INV-002`: Preserved. Coding routing blocks unless IPS status is passed and context package plus coding prompt references exist.
- `GK-INV-003`: Preserved. Executor work goes through explicit adapter contracts and produces execution records.
- `GK-INV-004`: Preserved. Interactive blockers are structured owner questions only when execution cannot continue.
- `GK-INV-005`: Preserved. The implementation remains inside the TypeScript Fastify modular monolith domain layer.
- `GK-INV-006`: Preserved. Missing or failed IPS evidence blocks coding task routing.
- `GK-INV-007`: Preserved. Tests use synthetic local command output and redaction checks for secret-looking values.
- `GK-INV-008`: Preserved. Self-improvement coding tasks would use the same IPS-gated routing path.
- `GK-INV-009`: Not applicable. Deployment was out of scope and not performed.
- `GK-INV-010`: Preserved. Added documentation, tests, comments, and user-facing strings are English-only.

## Sensitive-Data Evidence

Tests use synthetic values such as `token=super-secret`, `Bearer abc.def`, and `API_KEY=secret-value` only to verify redaction. No real Telegram token, production data, repository credential, customer data, screenshot, or live log was added.

## Replay/Determinism Evidence

Registry matching, routing, and worker readiness are deterministic for the same task set, executor list, project root, capabilities, risk level, preference order, and IPS status. CLI execution records capture command, cwd, timestamps, duration, exit code, status, stdout/stderr summaries, timeout status, and redacted environment summary so later validation can audit what ran.

## Passed Criteria

- Worker only runs ready tasks whose dependencies are satisfied.
- Routing stores selected executor and reason.
- Disabled or unauthorized executors cannot receive tasks.
- CLI execution captures command, cwd, start/end timestamps, stdout/stderr summary, status, and timeout.
- Secrets are redacted from logs and environment summaries.
- Coding tasks with failed or missing IPS gate are blocked, not routed.
- Interactive blockers become structured questions.

## Failed Criteria

None.

## Deviations

Required subagent roles were implemented directly in the main session instead of spawning separate workers because the code surface was compact and write ownership would have overlapped in `src/domain/executors.ts` and `src/domain/executors.test.ts`. No scope expansion was introduced.

## Recommendation

Proceed to Goal 08 Validation Reports after committing Goal 07 and verifying a clean worktree. Do not deploy to production without explicit owner approval.
