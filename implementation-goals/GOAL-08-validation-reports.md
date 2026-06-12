# GOAL 08: Validation, Retry, And Completion Reports

## User Command

```text
GOALKEEPER ORCHESTRATOR: implement goal number 8
```

## Outcome

Implement deterministic validation, semantic validation adapter stub, human reject/retry flow, validation result storage, no-done-without-validation enforcement, goal completion detection, and Telegram final reports.

## Branch

```text
feature/gk-goal-08-validation-reports
```

## Dependencies

- Goal 03 done.
- Goal 07 done.

## IPS Intent

Validation must prove that execution served the original approved intent, not merely that commands passed.

## Required Subagents

- Worker A: validation module and validation result enforcement.
- Worker B: retry and human rejection flow.
- Worker C: Telegram task/goal completion reports.
- Validator: end-to-end lifecycle test from goal to report.

## Allowed Changes

- Validation module.
- Report renderers.
- Retry services.
- Completion detection.
- Tests.

## Forbidden Changes

- Do not auto-deploy production changes.
- Do not mark tasks done without validation.
- Do not send raw secrets or full logs to Telegram.

## IPS Preflight

Verify reports include original user intent, approved interpretation, decisions, validation evidence, and what was not done.

## Acceptance Criteria

- Invalid output cannot mark task done.
- Human rejection creates feedback and retry context.
- Task report includes executor, changed artifacts, validation, risks.
- Goal report includes original intent, final interpretation, decisions, validation evidence.
- Completion detection refuses incomplete or failed required tasks.

## Validation Commands

```bash
npm test
npm run typecheck
npm run lint
```

Add end-to-end tests where feasible with mocked Telegram and executor adapters.

## Final Report

Include report examples, validation enforcement evidence, and remaining autonomous-mode gaps.
