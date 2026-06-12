# CP-GK-05: Planning And Task Creation

```yaml
id: CP-GK-05
status: approved
source_execution_plan: implementation-goals/GOAL-05-planning-task-creation.execution-plan.md
owner: orchestrator
created: 2026-06-12
last_updated: 2026-06-12
completeness_level: complete
```

## Target Task

Implement Goal 05 planning adapter, plan versioning, plan approval and rejection behavior, and task creation from approved plans for GoalKeeper.

## Upstream Traceability

- `implementation-goals/GOAL-05-planning-task-creation.execution-plan.md`
- `implementation-goals/GOAL-05-planning-task-creation.md`
- `implementation-goals/GOAL-03-telegram-control-plane.md`
- `implementation-goals/GOAL-04-intent-memory.md`
- `docs/IMPLEMENTATION_SPEC.md`
- `docs/IPS_INTEGRATION.md`
- `docs/DOMAIN_MODEL.md`
- `docs/TELEGRAM_INTERFACE.md`
- `docs/governance/PROJECT_INVARIANTS.md`

## Included Documents

- `docs/IMPLEMENTATION_SPEC.md`: source of planning, approval, task creation, and Telegram control-plane lifecycle.
- `docs/IPS_INTEGRATION.md`: source of approved plan and traceability requirements before coding tasks can later run.
- `docs/DOMAIN_MODEL.md`: source of goal, plan, plan step, task, decision, and event relationships.
- `implementation-goals/GOAL-03-telegram-control-plane.md`: source of Telegram callback and renderer boundaries.
- `implementation-goals/GOAL-04-intent-memory.md`: source of approved intent dependency and stale downstream behavior.
- `implementation-goals/GOAL-05-planning-task-creation.md`: source of acceptance criteria and allowed scope.

## Excluded Documents

- Goal 06 IPS gates are excluded from implementation except for preserving future readiness.
- Goal 07 executor orchestration and worker-loop documents are excluded because Goal 05 must not execute tasks.
- Deployment and hardening documents are excluded because production deployment is out of scope.
- IPS reference repository files are read-only reference material.

## Constraints

- Planning requires approved intent.
- Task creation requires an approved plan.
- Plan regeneration creates a new plan version.
- Only one approved plan may remain active for a goal.
- Plan steps must include acceptance criteria.
- Task records must preserve dependencies, risk, approval requirements, required tools, and acceptance criteria.
- Telegram actions must not start coding or task execution.
- Use synthetic local data only and keep all text English-only.

## Allowed Changes

- `src/domain/planning.ts`
- `src/domain/planning.test.ts`
- Minimal type or lifecycle changes needed for planning invariants.
- Telegram callback and renderer support for plan review actions.
- Goal 05 implementation artifacts and `docs/IMPLEMENTATION_STATE.md`.

## Forbidden Changes

- Do not implement real LLM planning.
- Do not execute tasks or select executors.
- Do not generate IPS context packages or coding prompts for created runtime tasks.
- Do not deploy or edit remote server files.
- Do not add dashboard UI.

## Agent Prompt

Implement the planning and task-creation service described by `implementation-goals/GOAL-05-planning-task-creation.execution-plan.md`. Keep the service pure and deterministic, using explicit inputs, IDs, context, and returned records. Preserve the existing lifecycle guards, add missing planning semantics, and cover behavior with Node test runner tests.

## Validation Instructions

Run:

```bash
npm test
npm run typecheck
npm run lint
git diff --check
python3 scripts/strict_doc_audit.py --format markdown --fail-on-issues
python3 scripts/pre_coding_gate.py --root . --goal implementation-goals/GOAL-05-planning-task-creation.md
python3 scripts/deployment_readiness_gate.py --root .
```
