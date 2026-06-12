# CP-GK-06: IPS Gates, Context Packages, And Coding Prompts

```yaml
id: CP-GK-06
status: approved
source_execution_plan: implementation-goals/GOAL-06-ips-gates.execution-plan.md
owner: orchestrator
created: 2026-06-12
last_updated: 2026-06-12
completeness_level: complete
```

## Target Task

Implement Goal 06 IPS settings, pre-coding gate evaluation, context package records, coding prompt records, validation evidence records, and IPS blocker creation for GoalKeeper.

## Upstream Traceability

- `implementation-goals/GOAL-06-ips-gates.execution-plan.md`
- `implementation-goals/GOAL-06-ips-gates.md`
- `implementation-goals/GOAL-05-planning-task-creation.md`
- `docs/IMPLEMENTATION_SPEC.md`
- `docs/IPS_INTEGRATION.md`
- `docs/AGENT_ORCHESTRATION.md`
- `docs/governance/PROJECT_INVARIANTS.md`
- `docs/process/OPERATIONAL_GATES.md`
- `/Users/Sergej.Stasok/Documents/Gitlab/intent-preservation-system/AGENTS.md`
- `/Users/Sergej.Stasok/Documents/Gitlab/intent-preservation-system/17_governance/AI_AGENT_RULES.md`
- `/Users/Sergej.Stasok/Documents/Gitlab/intent-preservation-system/17_governance/PROJECT_INVARIANTS.md`

## Included Documents

- `docs/IPS_INTEGRATION.md`: source of mandatory IPS gate requirements, artifact chain, fail-closed behavior, and project IPS settings.
- `docs/IMPLEMENTATION_SPEC.md`: source of pre-execution IPS requirements and validation/report lifecycle.
- `docs/AGENT_ORCHESTRATION.md`: source of executor routing boundary: coding executor selection is downstream of IPS.
- `docs/governance/PROJECT_INVARIANTS.md`: source of invariant evidence required by this goal.
- `docs/process/OPERATIONAL_GATES.md`: source of gate evidence and failure policy.
- `implementation-goals/GOAL-05-planning-task-creation.md`: source of approved-plan and task creation dependency.
- `implementation-goals/GOAL-06-ips-gates.md`: source of acceptance criteria and allowed changes.

## Excluded Documents

- Goal 07 executor orchestration is excluded because this goal must not start executors.
- Goal 08 validation reports are excluded except for storing gate evidence records required before execution.
- Deployment and hardening documents are excluded because production deployment is out of scope.
- IPS reference repository files are read-only reference material and must not be modified.

## Constraints

- Coding tasks must fail closed without complete upstream traceability.
- Draft artifacts and artifacts with execution-critical missing or unknown markers cannot authorize coding.
- Coding prompt records can only be generated from an approved, complete execution plan artifact.
- Context package records must link to task, goal, plan, and upstream artifacts.
- Gate results must be stored as validation evidence.
- Runtime logic must use project IPS settings instead of a single hard-coded IPS path.
- No executor startup, routing, deployment, dashboard work, or real production data.

## Allowed Changes

- `src/domain/ips.ts`
- `src/domain/ips.test.ts`
- Narrow changes to `src/domain/types.ts` or `src/domain/lifecycle.ts` if needed for stronger IPS contracts.
- Goal 06 process artifacts and implementation state.

## Forbidden Changes

- Do not start or simulate executors.
- Do not make coding execution pass with draft artifacts.
- Do not silently ignore missing markers.
- Do not hard-code the local IPS reference repo as a runtime requirement.
- Do not deploy or edit remote server files.

## Agent Prompt

Implement the IPS service described by `implementation-goals/GOAL-06-ips-gates.execution-plan.md`. Keep behavior pure and deterministic, use explicit IDs and context, return updated records instead of mutating caller-owned inputs, and preserve fail-closed semantics for every missing or incomplete execution-critical IPS artifact.

## Validation Instructions

Run:

```bash
npm test
npm run typecheck
npm run lint
git diff --check
python3 scripts/strict_doc_audit.py --format markdown --fail-on-issues
python3 scripts/pre_coding_gate.py --root . --goal implementation-goals/GOAL-06-ips-gates.md
python3 scripts/deployment_readiness_gate.py --root .
```
