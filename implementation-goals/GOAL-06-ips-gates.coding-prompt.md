# PROMPT-GK-06: IPS Gates, Context Packages, And Coding Prompts

```yaml
id: PROMPT-GK-06
status: approved
source_execution_plan: implementation-goals/GOAL-06-ips-gates.execution-plan.md
source_context_package: implementation-goals/GOAL-06-ips-gates.context-package.md
owner: orchestrator
created: 2026-06-12
last_updated: 2026-06-12
completeness_level: complete
```

## Task Summary

Implement GoalKeeper's domain-level IPS enforcement layer so coding tasks cannot proceed unless the IPS chain is complete, approved, linked, and backed by validation evidence.

## Execution Plan Link

`implementation-goals/GOAL-06-ips-gates.execution-plan.md`

## Context Package Link

`implementation-goals/GOAL-06-ips-gates.context-package.md`

## Allowed Changes

- Create `src/domain/ips.ts` and `src/domain/ips.test.ts`.
- Modify `src/domain/types.ts` only for narrow IPS settings or gate-evidence contracts if needed.
- Modify `src/domain/lifecycle.ts` only if existing lifecycle guards need to consume stronger IPS semantics.
- Update Goal 06 validation and implementation state after validation.

## Forbidden Changes

- Do not implement executor routing, worker loops, CLI/MCP adapters, or task execution.
- Do not allow coding from draft, obsolete, failed, or marker-bearing IPS artifacts.
- Do not generate coding prompts from vague task summaries or unapproved execution plans.
- Do not hard-code the local IPS reference repository as a runtime requirement.
- Do not add dashboard UI or deployment behavior.

## Implementation Instructions

Add pure TypeScript functions that evaluate coding-task IPS readiness from explicit project, goal, plan, task, artifact, and gate-command evidence inputs. Missing enabled settings, missing traceability, incomplete artifacts, missing context package or coding prompt links, missing validation criteria, and failed gate evidence must return a blocked or failed result and create an `ips_gate_failed` blocker. Context package and coding prompt artifact records must be generated only from approved and complete upstream artifacts. Gate evidence must be represented as validation-report artifacts and linked back to the task.

## Acceptance Criteria

- Project stores and validates IPS settings.
- Pre-coding gate refuses tasks with missing upstream traceability.
- Draft or incomplete execution-critical artifacts block coding.
- Missing IPS data creates a blocker instead of invented context.
- Context package records link to task, goal, plan, and upstream artifacts.
- Coding prompt records can only be generated from approved execution plans.
- Gate results are stored as validation evidence.

## Validation Commands

```bash
npm test
npm run typecheck
npm run lint
git diff --check
python3 scripts/strict_doc_audit.py --format markdown --fail-on-issues
python3 scripts/pre_coding_gate.py --root . --goal implementation-goals/GOAL-06-ips-gates.md
python3 scripts/deployment_readiness_gate.py --root .
```

## Expected Output

Return changed files, IPS fail-closed behavior implemented, blocker creation behavior, artifact generation behavior, validation evidence, deviations, risks, subagent summaries, and Goal 07 readiness.
