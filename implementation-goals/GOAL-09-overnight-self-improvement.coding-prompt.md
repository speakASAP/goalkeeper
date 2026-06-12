# PROMPT-GK-09: Overnight Mode And Self-Improvement Coding Prompt

```yaml
id: PROMPT-GK-09
status: approved
source_execution_plan: implementation-goals/GOAL-09-overnight-self-improvement.execution-plan.md
source_context_package: implementation-goals/GOAL-09-overnight-self-improvement.context-package.md
owner: orchestrator
created: 2026-06-12
last_updated: 2026-06-12
completeness_level: complete
```

## Task Summary

Implement the Goal 09 MVP for autonomous overnight monitoring, digest reporting, blocker aggregation, Telegram status commands, task-log summaries, and GoalKeeper self-improvement project registration.

## Execution Plan Link

`implementation-goals/GOAL-09-overnight-self-improvement.execution-plan.md`

## Context Package Link

`implementation-goals/GOAL-09-overnight-self-improvement.context-package.md`

## Allowed Changes

- `src/domain/overnight.ts`
- `src/domain/overnight.test.ts`
- `src/domain/types.ts`
- `src/modules/telegram/commands.ts`
- `src/modules/telegram/commands.test.ts`
- `src/modules/telegram/renderers.ts`
- `src/modules/telegram/renderers.test.ts`
- Goal 09 implementation artifacts and implementation state documentation

## Forbidden Changes

- Do not weaken IPS gates or validation requirements.
- Do not introduce real autonomous execution side effects in Telegram handlers.
- Do not auto-run high-risk, destructive, or deployment actions.
- Do not render raw logs, secrets, tokens, or production data in Telegram messages.
- Do not make a dashboard the primary control surface.

## Implementation Instructions

Follow existing TypeScript domain patterns and keep the overnight module pure and deterministic. Model policy and snapshot inputs explicitly, return blocked or awaiting-owner decisions when required evidence is missing, and render Telegram-facing summaries that are compact enough for chat. Self-improvement bootstrap must produce a normal tracked project record with IPS enabled, approval required, safe concurrency, and GoalKeeper repository metadata.

## Acceptance Criteria

- `/overnight` or equivalent policy command exists.
- Digest separates completed, failed, partial, blocked, and awaiting-user work.
- `/agents`, `/executors`, and `/task_log` expose useful state.
- Blockers are aggregated and actionable.
- GoalKeeper can register itself as a tracked project.
- Self-improvement tasks go through the same IPS path and fail closed without required artifacts.

## Validation Commands

```bash
npm test
npm run typecheck
npm run lint
git diff --check
python3 scripts/strict_doc_audit.py --format markdown --fail-on-issues
python3 scripts/pre_coding_gate.py --root . --goal implementation-goals/GOAL-09-overnight-self-improvement.md
python3 scripts/deployment_readiness_gate.py --root .
```

## Expected Output

Return an Intent Compliance Report with changed files, validation evidence, autonomous-mode behavior, sample digest behavior, safety gates, self-improvement behavior, and hardening gaps. Update `docs/IMPLEMENTATION_STATE.md` before committing.
