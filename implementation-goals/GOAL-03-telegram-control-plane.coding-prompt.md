# PROMPT-GK-03: Telegram Control Plane MVP

```yaml
id: PROMPT-GK-03
status: approved
source_execution_plan: implementation-goals/GOAL-03-telegram-control-plane.execution-plan.md
source_context_package: implementation-goals/GOAL-03-telegram-control-plane.context-package.md
owner: orchestrator
created: 2026-06-12
last_updated: 2026-06-12
completeness_level: complete
```

## Task Summary

Implement the Telegram control-plane MVP for GoalKeeper: webhook route, Telegram update DTOs, user allowlist authorization, command parsing, idempotent callback dispatch boundary, compact renderers, environment documentation, and tests.

## Execution Plan Link

`implementation-goals/GOAL-03-telegram-control-plane.execution-plan.md`

## Context Package Link

`implementation-goals/GOAL-03-telegram-control-plane.context-package.md`

## Allowed Changes

- Add `src/modules/telegram/` source and tests.
- Modify `src/app.ts` to register the Telegram route.
- Modify `src/config/env.ts` to parse Telegram settings.
- Modify `.env.example` to document Telegram settings.
- Add Goal 03 validation report and update `docs/IMPLEMENTATION_STATE.md`.

## Forbidden Changes

- Do not implement full intent extraction, planning, task creation, task execution, or executor routing.
- Do not deploy.
- Do not add real bot tokens, real Telegram user IDs, raw production data, or secrets to code, tests, docs, or reports.
- Do not log or render Telegram bot tokens.

## Implementation Instructions

1. Add small, typed Telegram DTOs for message and callback query updates.
2. Add an authorization helper that checks `from.id` against configured allowed user IDs.
3. Add deterministic command parsing for `/start`, `/projects`, `/new_project`, `/register_project`, `/goal`, `/goals`, `/tasks`, `/status`, and `/blocked`.
4. Add callback parsing for bounded action payloads and an idempotent dispatcher that handles duplicate callback query IDs without re-running the handler.
5. Add renderer functions for command acknowledgements and service stubs.
6. Add `POST /telegram/webhook` with optional webhook secret header validation, authorization, command handling, callback handling, and safe malformed update handling.
7. Add tests with Fastify injection and pure function coverage.

## Acceptance Criteria

- `/start`, `/projects`, `/new_project`, `/register_project`, `/goal`, `/goals`, `/tasks`, `/status`, and `/blocked` have MVP behavior or explicit service stubs.
- Unauthorized user receives denial.
- Callback dispatch is idempotent at the handler boundary.
- Telegram token is never logged or rendered.
- Tests cover parser, auth, callbacks, and representative renderers.

## Validation Commands

```bash
npm test
npm run typecheck
npm run lint
python3 scripts/strict_doc_audit.py --format markdown --fail-on-issues
python3 scripts/pre_coding_gate.py --root . --goal implementation-goals/GOAL-03-telegram-control-plane.md
```

## Expected Output

Finish with an Intent Compliance Report listing implemented Telegram commands, service stubs left for Goals 04 and 05, changed files, validation evidence, risks, and the next action. Update the Goal 03 validation report and implementation state before committing.
