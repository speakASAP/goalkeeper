# EP-GK-03: Telegram Control Plane MVP

```yaml
id: EP-GK-03
status: approved
source_goal: implementation-goals/GOAL-03-telegram-control-plane.md
owner: orchestrator
created: 2026-06-12
last_updated: 2026-06-12
completeness_level: complete
branch: feature/gk-goal-03-telegram-control-plane
```

## Metadata

Goal 03 implements the first Telegram-facing control plane after Goal 01 established the Fastify runtime and Goal 02 established domain contracts. This plan is approved for bounded implementation on `feature/gk-goal-03-telegram-control-plane`.

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

## Goal Impact

This goal makes Telegram the first real owner control surface. It accepts webhook updates, verifies the user allowlist, parses MVP commands, dispatches callback payloads idempotently at the handler boundary, and renders compact user-facing messages. It intentionally routes goal, project, task, and approval actions to explicit service stubs so later goals can attach real intent memory, planning, and execution without allowing raw Telegram messages to start coding work.

## Project Invariants

- `GK-INV-001`: Preserved. Telegram is implemented as the primary MVP control plane.
- `GK-INV-002`: Preserved. `/goal` captures raw text only and returns an intent-preservation stub; it does not start coding or planning.
- `GK-INV-003`: Preserved. No fake executor or autonomous work result is introduced.
- `GK-INV-004`: Preserved. Routine engineering choices are handled inside the approved scope.
- `GK-INV-005`: Preserved. The implementation stays inside the Fastify modular monolith.
- `GK-INV-006`: Preserved. Coding and planning remain blocked behind later IPS goals; this goal adds no bypass.
- `GK-INV-007`: Preserved. Tests use synthetic Telegram IDs and callback payloads; bot tokens are never logged or rendered.
- `GK-INV-008`: Preserved. Self-improvement is not implemented and cannot bypass Telegram or IPS controls.
- `GK-INV-009`: Not applicable. No production deployment is in scope.
- `GK-INV-010`: Preserved. All command text, renderer output, tests, and docs are English-only.

## Sensitive-Data Handling

Telegram bot tokens, webhook secrets, user IDs, callback payloads, and update bodies are sensitive operational data. The implementation must not log the bot token. Tests must use synthetic IDs and fake tokens only. Unauthorized denial messages must avoid exposing allowlist contents. Callback payloads are parsed into bounded action data and must not be echoed as trusted executable instructions.

## Contract/Schema Impact

No database schema change is expected. This goal adds HTTP contracts for `POST /telegram/webhook`, command parser contracts, callback dispatch contracts, and renderer contracts. Environment parsing gains Telegram settings for bot token, optional webhook secret, and allowed user IDs.

## Replay/Determinism Impact

Command parsing and renderer output must be deterministic for the same input. Callback dispatch must be idempotent at the handler boundary by tracking processed callback query IDs and returning a duplicate acknowledgement instead of invoking the downstream handler twice.

## Scope

- Add Telegram update DTOs for the subset needed by MVP commands and callbacks.
- Add Telegram environment configuration for token, optional webhook secret, and allowed user IDs.
- Add allowlist authorization by Telegram `from.id`.
- Add command parsing for `/start`, `/projects`, `/new_project`, `/register_project`, `/goal`, `/goals`, `/tasks`, `/status`, and `/blocked`.
- Add callback parser and idempotent callback dispatcher foundation.
- Add compact message renderers for start, unauthorized, project list, new/register project stubs, goal capture stub, goals/tasks/status/blocked stubs, callback acknowledgements, and unknown commands.
- Register a Fastify Telegram webhook route.
- Add tests for parser, auth, callbacks, route behavior, and representative renderers.
- Update Telegram environment documentation.

## Non-Goals

- Full intent extraction or intent approval workflow.
- Planning, task creation, task execution, executor routing, or IPS gate enforcement beyond preserving fail-closed stubs.
- Real Telegram API outbound calls.
- Database persistence for Telegram updates.
- Dashboard work.
- Production deployment.

## Files To Inspect

- `package.json`
- `tsconfig.json`
- `.env.example`
- `src/app.ts`
- `src/config/env.ts`
- `src/domain/types.ts`
- `src/health/health.test.ts`
- `docs/TELEGRAM_INTERFACE.md`
- `implementation-goals/GOAL-03-telegram-control-plane.md`

## Files To Create

- `implementation-goals/GOAL-03-telegram-control-plane.context-package.md`
- `implementation-goals/GOAL-03-telegram-control-plane.coding-prompt.md`
- `implementation-goals/GOAL-03-telegram-control-plane.validation-report.md`
- `src/modules/telegram/auth.ts`
- `src/modules/telegram/auth.test.ts`
- `src/modules/telegram/callbacks.ts`
- `src/modules/telegram/callbacks.test.ts`
- `src/modules/telegram/commands.ts`
- `src/modules/telegram/commands.test.ts`
- `src/modules/telegram/renderers.ts`
- `src/modules/telegram/renderers.test.ts`
- `src/modules/telegram/routes.ts`
- `src/modules/telegram/routes.test.ts`
- `src/modules/telegram/types.ts`

## Files To Modify

- `.env.example`
- `src/app.ts`
- `src/config/env.ts`
- `docs/IMPLEMENTATION_STATE.md`

## Files That Must Not Be Modified

- IPS reference repository files.
- Production deployment files or remote server files.
- Domain persistence migration unless a schema issue unrelated to Goal 03 blocks compilation.
- Executor, worker, planning, and intent-memory modules outside stubs needed for Telegram routing.
- `dist/` build output except through normal build commands.

## Implementation Steps

1. Create Goal 03 context package and coding prompt from this execution plan.
2. Run the local pre-coding gate for Goal 03.
3. Extend environment parsing for Telegram settings without requiring a token in local development.
4. Add Telegram DTOs, authorization helper, and command parser.
5. Add callback parser and in-memory idempotency boundary.
6. Add compact renderer functions.
7. Add the Fastify webhook route and wire it into `buildApp`.
8. Add mocked update tests for authorization, commands, callbacks, renderers, and webhook route behavior.
9. Run validation commands and update the validation report and implementation state.
10. Commit all Goal 03 changes.

## Test Plan

- Unit tests for allowed and unauthorized Telegram user checks.
- Unit tests for all required MVP commands and unknown command fallback.
- Unit tests for callback payload parsing and duplicate callback query handling.
- Unit tests for representative renderers, including denial and goal capture stub messages.
- Fastify injection tests for webhook behavior with authorized, unauthorized, command, callback, and malformed updates.

## Validation Plan

- `npm test`
- `npm run typecheck`
- `npm run lint`
- `python3 scripts/strict_doc_audit.py --format markdown --fail-on-issues`
- `python3 scripts/pre_coding_gate.py --root . --goal implementation-goals/GOAL-03-telegram-control-plane.md`

## Gate Commands

```bash
python3 scripts/pre_coding_gate.py --root . --goal implementation-goals/GOAL-03-telegram-control-plane.md
python3 scripts/deployment_readiness_gate.py --root .
```

## Documentation Updates

- Update `.env.example` with Telegram configuration keys.
- Add `implementation-goals/GOAL-03-telegram-control-plane.validation-report.md`.
- Update `docs/IMPLEMENTATION_STATE.md` with active branch, validation evidence, Goal 03 completion state, and next action.

## Rollback Plan

Revert the Goal 03 commit or remove the new `src/modules/telegram/` module, Goal 03 artifacts, `.env.example` Telegram keys, `src/app.ts` route registration, `src/config/env.ts` Telegram config, and state-file updates. No production data or remote deployment is touched.

## Agent Handoff Prompt

Implement Goal 03 within the files and scope listed above. Build a Telegram webhook, allowlist, command parser, callback dispatcher foundation, and compact renderers. Preserve the Telegram-first MVP and fail-closed IPS intent: raw `/goal` text may be acknowledged and handed to a stub, but it must not trigger planning, task creation, coding execution, or fake autonomous results. Never log or render the bot token.

## Completion Checklist

- [x] Implementation complete
- [x] Tests complete
- [x] Validation evidence collected
- [x] Documentation updated
- [x] Deviations documented
