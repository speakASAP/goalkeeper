# Tasks: goalkeeper

## Backlog

- [ ] TASK-GK-001: Sync compact root queue with authoritative implementation state.
  - Current status: `main...origin/main` at `f58577f`; `BUSINESS.md`, `SYSTEM.md`, and `TASKS.md` are untracked; `docs/IMPLEMENTATION_STATE.md` is tracked and says no active, running, or blocked goals.
  - Missing queue / standard-file issue: root `TASKS.md` existed but did not summarize the current owner-approved next action from `docs/IMPLEMENTATION_STATE.md`.
  - Risk: GoalKeeper governs orchestration behavior; a stale or vague root queue can misroute workers away from the authoritative implementation state.
  - Suggested owner decision: approve root `TASKS.md` as a compact mirror of the authoritative state and open no implementation worker until the owner selects a new GoalKeeper goal.
  - Future implementation agent allowed files: `TASKS.md` only unless the owner separately approves tracking existing `BUSINESS.md` and `SYSTEM.md`.
  - Future implementation agent forbidden files: source code, implementation-goal files, deployment scripts, generated reports, `docs/IMPLEMENTATION_STATE.md`, state files, runtime config, secrets, and worker execution.
  - Validation checks: `git status --short --branch`; `git diff --check -- .`; if future code/runtime work is approved, `npm run lint`, `npm test`, and `scripts/smoke_test.sh` as applicable.
  - Merge order: land this queue after lower-risk docs queues; treat future GoalKeeper implementation as integration-sensitive.

## Completed

- [x] 2026-06-21 Added `BUSINESS.md`, `SYSTEM.md`, and `TASKS.md` to restore agent-doc quartet coverage.
