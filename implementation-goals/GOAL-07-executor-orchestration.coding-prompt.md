# PROMPT-GK-07: Executor Orchestration, Worker Loop, And Routing

```yaml
id: PROMPT-GK-07
status: approved
source_execution_plan: implementation-goals/GOAL-07-executor-orchestration.execution-plan.md
source_context_package: implementation-goals/GOAL-07-executor-orchestration.context-package.md
owner: orchestrator
created: 2026-06-12
last_updated: 2026-06-12
completeness_level: complete
```

## Task Summary

Implement GoalKeeper's executor orchestration domain layer so ready tasks can be routed and executed through explicit adapters while coding execution remains blocked unless IPS evidence has passed.

## Execution Plan Link

`implementation-goals/GOAL-07-executor-orchestration.execution-plan.md`

## Context Package Link

`implementation-goals/GOAL-07-executor-orchestration.context-package.md`

## Allowed Changes

- Create `src/domain/executors.ts` and `src/domain/executors.test.ts`.
- Modify `src/domain/types.ts` only for narrow executor, routing, worker, or execution record contracts if needed.
- Update `README.md` with concise executor orchestration operational notes.
- Update Goal 07 validation and implementation state after validation.

## Forbidden Changes

- Do not execute destructive commands in tests.
- Do not start real Codex, Claude Code, OpenCode, MCP, HTTP, or production services.
- Do not route coding tasks when IPS gate status is missing, failed, blocked, or lacks context package or coding prompt references.
- Do not store secret values in command summaries, logs, prompts, tests, or reports.
- Do not add dashboard-first behavior or deployment behavior.

## Implementation Instructions

Add pure TypeScript routing and worker functions plus a concrete CLI/shell adapter. The registry must match executors by enabled status, capabilities, allowed project root, risk level, approval requirement, and optional project preferences. Routing must return selected executor, reason, fallback IDs, approval requirement, or a blocked decision with a Telegram-visible reason. Worker readiness must select only pending tasks whose dependencies are complete and retry budget remains. CLI execution must capture command, cwd, timestamps, duration, exit code, status, stdout/stderr summaries, timeout, and redacted environment summary. MCP support should be represented as an adapter interface only.

## Acceptance Criteria

- Worker only runs ready tasks whose dependencies are satisfied.
- Routing stores selected executor and reason.
- Disabled or unauthorized executors cannot receive tasks.
- CLI execution captures command, cwd, start/end timestamps, stdout/stderr summary, status, and timeout.
- Secrets are redacted from logs.
- Coding tasks with failed or missing IPS gate are blocked, not routed.
- Interactive blockers become structured questions.

## Validation Commands

```bash
npm test
npm run typecheck
npm run lint
git diff --check
python3 scripts/strict_doc_audit.py --format markdown --fail-on-issues
python3 scripts/pre_coding_gate.py --root . --goal implementation-goals/GOAL-07-executor-orchestration.md
python3 scripts/deployment_readiness_gate.py --root .
```

## Expected Output

Return changed files, executor interfaces, routing and worker behavior, CLI adapter evidence capture, redaction behavior, IPS refusal behavior, validation evidence, deviations, risks, and Goal 08 readiness.
