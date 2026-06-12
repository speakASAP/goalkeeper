# GOAL 06: IPS Gates, Context Packages, And Coding Prompts

## User Command

```text
GOALKEEPER ORCHESTRATOR: implement goal number 6
```

## Outcome

Implement GoalKeeper's IPS integration layer: project IPS settings, artifact linkage, pre-coding gate checks, context package records, coding prompt records, validation report records, and blocker creation when IPS requirements are missing.

## Branch

```text
feature/gk-goal-06-ips-gates
```

## Dependencies

- Goal 02 done.
- Goal 05 done.

Storage-only work can start earlier, but enforcement depends on planning and task creation.

## IPS Intent

This goal is the control layer that prevents agents from coding from vague requests. Coding execution must fail closed unless the IPS chain is complete and approved.

## Required Subagents

- Explorer A: inspect local IPS repo `/Users/Sergej.Stasok/Documents/Gitlab/intent-preservation-system` and summarize usable commands/interfaces.
- Worker A: IPS settings and artifact model/service.
- Worker B: pre-coding gate runner and blocker creation.
- Worker C: context package and coding prompt generator records.
- Validator: test fail-closed behavior.

## Allowed Changes

- IPS module.
- Gate runner abstraction.
- Artifact records.
- Blocker creation.
- Context package generation records.
- Coding prompt generation records.
- Tests for pass/fail gate states.
- Documentation updates.

## Forbidden Changes

- Do not make coding execution pass with draft artifacts.
- Do not silently ignore unresolved missing-marker placeholders.
- Do not couple to one hard-coded filesystem path without project settings.

## IPS Preflight

This goal modifies the IPS enforcement layer itself. Before editing:

1. Read `IPS_INTEGRATION.md` completely.
2. Inspect the local IPS repo if available.
3. Create explicit acceptance tests for fail-closed behavior before or alongside implementation.

## Acceptance Criteria

- Project stores IPS settings.
- Pre-coding gate refuses tasks with missing upstream traceability.
- Draft or incomplete execution-critical artifacts block coding.
- Missing IPS data creates a blocker instead of invented context.
- Context package records link to task/goal/plan artifacts.
- Coding prompt records can only be generated from approved execution plans.
- Gate results are stored as validation evidence.

## Validation Commands

```bash
npm test
npm run typecheck
npm run lint
```

Run available IPS scripts if present.

## Final Report

Include IPS behavior implemented, fail-closed test evidence, and any gaps that block Goal 07.
