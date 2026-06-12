# GOAL 03: Telegram Control Plane MVP

## User Command

```text
GOALKEEPER ORCHESTRATOR: implement goal number 3
```

## Outcome

Implement the Telegram webhook, allowlist, command parser, callback handler foundation, and compact message renderers.

## Branch

```text
feature/gk-goal-03-telegram-control-plane
```

## Dependencies

- Goal 01 done.
- Goal 02 done.

Goal 04 can run in parallel if service interfaces are stable.

## IPS Intent

Telegram is the primary control plane. It captures user intent and approvals, but it must not execute coding work directly from raw messages.

## Required Subagents

- Worker A: webhook, Telegram update DTOs, allowlist/auth.
- Worker B: command parser and callback dispatcher.
- Worker C: message renderers.
- Validator: mocked Telegram update tests.

## Allowed Changes

- Telegram module.
- Command parser.
- Callback dispatcher.
- Message renderers.
- Telegram env docs.
- Tests.

## Forbidden Changes

- Do not implement full intent extraction in this goal.
- Do not implement planning or task execution.
- Do not deploy.

## IPS Preflight

Verify sensitive-data handling for Telegram bot token, user IDs, callback payloads, and logs.

## Acceptance Criteria

- `/start`, `/projects`, `/new_project`, `/register_project`, `/goal`, `/goals`, `/tasks`, `/status`, `/blocked` have MVP behavior or explicit service stubs.
- Unauthorized user receives denial.
- Callback dispatch is idempotent at the handler boundary.
- Telegram token is never logged.
- Tests cover parser, auth, and representative renderers.

## Validation Commands

```bash
npm test
npm run typecheck
npm run lint
```

## Final Report

Include supported commands, files changed, validation run, and any service stubs left for Goals 04-05.
