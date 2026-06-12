# GOAL 04: Intent Capture, Approval, And Memory

## User Command

```text
GOALKEEPER ORCHESTRATOR: implement goal number 4
```

## Outcome

Implement the flow from raw Telegram goal text to immutable raw intent, normalized intent, constraints, success criteria, non-goals, approval, correction, decisions, and stale artifact marking.

## Branch

```text
feature/gk-goal-04-intent-memory
```

## Dependencies

- Goal 01 done.
- Goal 02 done.

Can run parallel with Goal 03 if Telegram-facing contracts are stable.

## IPS Intent

The original user intent must remain immutable. Corrections add new records and affect downstream plans/tasks/context/coding prompts instead of silently overwriting meaning.

## Required Subagents

- Worker A: intent services and normalized intent card model.
- Worker B: correction/decision/stale artifact logic.
- Worker C: Telegram integration hooks if Goal 03 is already merged.
- Validator: lifecycle tests for approval and correction.

## Allowed Changes

- Intent module.
- Goal intent status transitions.
- Intent approval/correction services.
- Decision records.
- Stale downstream artifact marking.
- Tests.

## Forbidden Changes

- Do not create executable tasks from unapproved intent.
- Do not overwrite raw intent.
- Do not require a real LLM provider; use an adapter/stub if needed.

## IPS Preflight

Verify:

- raw intent immutability;
- normalized intent separated from source text;
- correction behavior;
- stale artifact behavior;
- plan-before-approval is blocked.

## Acceptance Criteria

- Goal cannot be planned before intent approval.
- Raw intent is immutable.
- User correction creates a new intent record.
- Corrections can mark affected plans, tasks, context packages, and coding prompts stale.
- Decisions are stored as first-class records.
- Tests cover approval, correction, and blocked planning.

## Validation Commands

```bash
npm test
npm run typecheck
npm run lint
```

## Final Report

Include intent lifecycle implemented, stale behavior, tests, and next recommended command.
