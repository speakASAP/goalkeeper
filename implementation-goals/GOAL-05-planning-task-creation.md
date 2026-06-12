# GOAL 05: Planning And Task Creation

## User Command

```text
GOALKEEPER ORCHESTRATOR: implement goal number 5
```

## Outcome

Implement planning adapter, plan versioning, plan approval UI/service integration, and task creation from approved plans.

## Branch

```text
feature/gk-goal-05-planning-task-creation
```

## Dependencies

- Goal 03 done.
- Goal 04 done.

## IPS Intent

Tasks must be derived from approved intent and approved plans. A plan step must carry acceptance criteria, dependencies, risk, approval requirements, and required tools.

## Required Subagents

- Worker A: planning adapter interface and plan versioning.
- Worker B: plan approval/rejection/regeneration services.
- Worker C: task creation from approved plans.
- Validator: lifecycle test for `intent_approved -> planning -> awaiting_plan_approval -> active`.

## Allowed Changes

- Planning module.
- AI planner adapter or stub.
- Plan approval services.
- Task creation services.
- Telegram plan rendering hooks if Goal 03 exists.
- Tests.

## Forbidden Changes

- Do not execute tasks.
- Do not create tasks from draft/rejected plans.
- Do not skip acceptance criteria.

## IPS Preflight

Verify approved intent is required before planning and approved plan is required before task creation.

## Acceptance Criteria

- Plan regeneration creates a new version.
- Only one approved plan is active for a goal.
- Approved plan creates tasks with dependencies and acceptance criteria.
- Goal moves to `active` only after plan approval.
- Tests cover invalid plan/task creation attempts.

## Validation Commands

```bash
npm test
npm run typecheck
npm run lint
```

## Final Report

Include planning lifecycle, task creation behavior, validation, and Goal 06 readiness.
