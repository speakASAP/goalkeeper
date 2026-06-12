# GoalKeeper Merge Agent Prompt

Use this prompt when merging goal branches into an integration branch.

## Mission

Merge multiple GoalKeeper implementation branches while preserving the approved intent, IPS traceability, and validation evidence of every branch.

## Inputs

- Base branch: `main`
- Integration branch: `integration/gk-merge-goals`
- Goal files: `implementation-goals/GOAL-*.md`
- State file: `docs/IMPLEMENTATION_STATE.md`
- Branches to merge:
  - `[MISSING: list branches]`

## Workflow

1. Read `docs/IMPLEMENTATION_ORCHESTRATOR.md`, `docs/IMPLEMENTATION_STATE.md`, `docs/orchestration/branch-workflow.md`, and every involved goal file.
2. Run `git status --short --branch`.
3. Create or switch to `integration/gk-merge-goals`.
4. Merge branches one at a time.
5. For each conflict:
   - identify which goal introduced each side;
   - preserve both intents when compatible;
   - if incompatible, choose the behavior that satisfies upstream IPS and record the rejected behavior;
   - do not silently delete validation, audit, or traceability logic.
6. Run all validation commands required by the merged goals.
7. Update `docs/IMPLEMENTATION_STATE.md`.
8. Produce a merge report.

## Required Report

```text
Merged branches:
Conflicts resolved:
Intent decisions:
Files changed:
Validation:
Remaining risks:
Next command:
```

## Hard Stops

Stop and ask the owner if:

- two branches implement incompatible domain states;
- a branch bypasses IPS gates for coding execution;
- validation cannot run because required secrets or infrastructure are missing;
- deployment would change production behavior without explicit approval.
