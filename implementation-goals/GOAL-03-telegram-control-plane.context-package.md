# CP-GK-03: Telegram Control Plane MVP

```yaml
id: CP-GK-03
status: approved
source_execution_plan: implementation-goals/GOAL-03-telegram-control-plane.execution-plan.md
owner: orchestrator
created: 2026-06-12
last_updated: 2026-06-12
completeness_level: complete
```

## Target Task

Implement Goal 03: Telegram webhook, allowlist, command parser, callback handler foundation, and compact message renderers.

## Upstream Traceability

- `README.md`
- `docs/idea.md`
- `docs/PRODUCT_BRIEF.md`
- `docs/IMPLEMENTATION_SPEC.md`
- `docs/SYSTEM_ARCHITECTURE.md`
- `docs/TELEGRAM_INTERFACE.md`
- `docs/IPS_INTEGRATION.md`
- `docs/governance/PROJECT_INVARIANTS.md`
- `docs/process/OPERATIONAL_GATES.md`
- `implementation-goals/GOAL-03-telegram-control-plane.md`
- `implementation-goals/GOAL-03-telegram-control-plane.execution-plan.md`

## Included Documents

- `src/app.ts`: current Fastify app factory and route registration style.
- `src/config/env.ts`: current environment parsing style.
- `src/domain/types.ts`: domain status names used by Telegram renderer stubs.
- `src/health/health.test.ts`: current Fastify injection test style.
- `docs/TELEGRAM_INTERFACE.md`: required commands and UX copy boundaries.
- `implementation-goals/GOAL-03-telegram-control-plane.md`: goal acceptance criteria and forbidden scope.

## Excluded Documents

- IPS reference repository implementation files are excluded because local GoalKeeper process documents define the required gate baseline for this goal.
- Legacy RunLayer remote files are excluded because Goal 03 is local GoalKeeper implementation only and deployment is forbidden.

## Constraints

- Telegram is the primary control plane.
- Unauthorized users receive a denial and no downstream command handling.
- `/goal` captures raw text only; no full intent extraction, planning, task creation, or coding execution occurs in this goal.
- Callback dispatch is idempotent at the handler boundary.
- Telegram bot token is never logged, rendered, or included in tests.
- All user-facing text is English-only.

## Allowed Changes

- `src/modules/telegram/`
- `src/app.ts`
- `src/config/env.ts`
- `.env.example`
- Goal 03 process artifacts and validation report
- `docs/IMPLEMENTATION_STATE.md`

## Forbidden Changes

- Full intent memory implementation.
- Planning or task creation implementation.
- Executor, worker, CLI, MCP, or autonomous execution implementation.
- Production deployment or remote server changes.
- Raw production data, real bot tokens, or real Telegram user IDs in tests or docs.

## Agent Prompt

Use the approved execution plan to implement a bounded Telegram control-plane MVP. Keep service actions as explicit stubs where later goals need intent memory or planning. Favor deterministic pure functions for parsers, authorization, callbacks, and renderers, then register them through a small Fastify route.

## Validation Instructions

Run:

```bash
npm test
npm run typecheck
npm run lint
python3 scripts/strict_doc_audit.py --format markdown --fail-on-issues
python3 scripts/pre_coding_gate.py --root . --goal implementation-goals/GOAL-03-telegram-control-plane.md
```

Record command results in the Goal 03 validation report and `docs/IMPLEMENTATION_STATE.md`.
