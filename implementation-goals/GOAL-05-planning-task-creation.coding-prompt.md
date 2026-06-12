# PROMPT-GK-05: Planning And Task Creation

```yaml
id: PROMPT-GK-05
status: approved
source_execution_plan: implementation-goals/GOAL-05-planning-task-creation.execution-plan.md
source_context_package: implementation-goals/GOAL-05-planning-task-creation.context-package.md
owner: orchestrator
created: 2026-06-12
last_updated: 2026-06-12
completeness_level: complete
```

## Task Summary

Implement GoalKeeper's domain-level planning lifecycle from approved goal intent to proposed plan, regenerated plan versions, owner plan decisions, approved plan, and task records derived from approved plan steps.

## Execution Plan Link

`implementation-goals/GOAL-05-planning-task-creation.execution-plan.md`

## Context Package Link

`implementation-goals/GOAL-05-planning-task-creation.context-package.md`

## Allowed Changes

- Create `src/domain/planning.ts` and `src/domain/planning.test.ts`.
- Modify `src/domain/types.ts` or `src/domain/lifecycle.ts` only if required for planning semantics.
- Modify `src/modules/telegram/callbacks.ts` and tests for plan callback actions.
- Modify `src/modules/telegram/renderers.ts` and tests for plan review rendering.
- Update Goal 05 validation and implementation state after validation.

## Forbidden Changes

- Do not implement task execution, executor routing, worker loops, or CLI/MCP adapters.
- Do not integrate a real LLM provider.
- Do not create tasks from draft, rejected, or superseded plans.
- Do not weaken existing IPS or lifecycle guards.
- Do not add dashboard UI or deployment behavior.

## Implementation Instructions

Add pure TypeScript functions that clone records instead of mutating caller-owned inputs. Use existing `DomainInvariantError`, `LifecycleContext`, `EventWriter`, and domain types where appropriate. Planning should require `intent_approved`, transition the goal through `planning` to `awaiting_plan_approval`, and create a proposed plan with validated steps. Regeneration should create a higher version and supersede prior proposed plans. Approval should create an owner decision, mark the selected plan approved, supersede other plans for the goal, transition the goal to `active`, and create tasks from plan steps with dependency mapping and explicit acceptance criteria.

## Acceptance Criteria

- Plan regeneration creates a new version.
- Only one approved plan is active for a goal.
- Approved plan creates tasks with dependencies and acceptance criteria.
- Goal moves to `active` only after plan approval.
- Tests cover invalid plan and task creation attempts.

## Validation Commands

```bash
npm test
npm run typecheck
npm run lint
git diff --check
python3 scripts/strict_doc_audit.py --format markdown --fail-on-issues
python3 scripts/pre_coding_gate.py --root . --goal implementation-goals/GOAL-05-planning-task-creation.md
python3 scripts/deployment_readiness_gate.py --root .
```

## Expected Output

Return changed files, planning lifecycle behavior implemented, task creation behavior, Telegram plan review support, validation evidence, deviations, risks, and Goal 06 readiness.
