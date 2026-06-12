# GoalKeeper Branch And Worktree Workflow

## Purpose

This workflow allows the orchestrator to run sequential and parallel implementation sessions while preserving IPS traceability, avoiding file conflicts, and keeping `docs/IMPLEMENTATION_STATE.md` authoritative.

## Branch Naming

Use these branch names:

```text
main
feature/gk-goal-01-foundation
feature/gk-goal-02-domain-persistence
feature/gk-goal-03-telegram-control-plane
feature/gk-goal-04-intent-memory
feature/gk-goal-05-planning-task-creation
feature/gk-goal-06-ips-gates
feature/gk-goal-07-executor-orchestration
feature/gk-goal-08-validation-reports
feature/gk-goal-09-overnight-self-improvement
feature/gk-goal-10-hardening-deployment
integration/gk-merge-goals
```

## Sequential Goals

Run Goal 01 and Goal 02 sequentially because they define the application skeleton and shared domain contracts.

Recommended pattern:

```bash
git switch -c feature/gk-goal-01-foundation
# implement the goal
# run validation from the goal file
git status --short --branch
git add <goal files>
git commit -m "Implement Goal 01 foundation"
git status --short --branch
git switch main
git merge --no-ff feature/gk-goal-01-foundation
```

Repeat for the next sequential goal after updating `docs/IMPLEMENTATION_STATE.md`.

Before switching goals, confirm:

```bash
./scripts/next_goal.sh
git status --short --branch
```

The script output must match the goal selected by `docs/IMPLEMENTATION_STATE.md`, and the current goal branch must be clean after its goal commit.

## Commit Boundary

Each goal has a mandatory commit boundary. A goal is not complete until:

- validation evidence is recorded;
- `docs/IMPLEMENTATION_STATE.md` is updated;
- all source, tests, reports, and documentation changes for the goal are committed;
- `git status --short --branch` confirms a clean working tree.

Do not begin the next goal from an uncommitted codebase. If a goal is blocked or partially complete, commit only after the blocker and current state are documented.

## Parallel Goals

Goals 03 and 04 may run in parallel after Goal 02 if their write ownership is kept separate:

```text
feature/gk-goal-03-telegram-control-plane
feature/gk-goal-04-intent-memory
```

Goal 06 storage work may begin before Goal 05 only if it does not enforce gates against incomplete planning contracts. Goal 07 may split internally only after executor registry interfaces are stable.

Preferred worktree layout:

```text
/Users/Sergej.Stasok/Documents/Gitlab/goalkeeper
/Users/Sergej.Stasok/Documents/Gitlab/goalkeeper-worktrees/goal-03
/Users/Sergej.Stasok/Documents/Gitlab/goalkeeper-worktrees/goal-04
/Users/Sergej.Stasok/Documents/Gitlab/goalkeeper-worktrees/goal-06
/Users/Sergej.Stasok/Documents/Gitlab/goalkeeper-worktrees/goal-07
```

Example:

```bash
mkdir -p /Users/Sergej.Stasok/Documents/Gitlab/goalkeeper-worktrees
git worktree add -b feature/gk-goal-03-telegram-control-plane /Users/Sergej.Stasok/Documents/Gitlab/goalkeeper-worktrees/goal-03 main
git worktree add -b feature/gk-goal-04-intent-memory /Users/Sergej.Stasok/Documents/Gitlab/goalkeeper-worktrees/goal-04 main
```

## Merge Goal

After parallel branches finish, run the merge protocol in:

```text
docs/MERGE_AGENT_PROMPT.md
```

The merge agent must:

```text
create or switch to integration/gk-merge-goals from main
merge one feature branch at a time
resolve conflicts by preserving the approved IPS intent of both branches
run validation commands from every merged goal
update docs/IMPLEMENTATION_STATE.md
merge integration/gk-merge-goals back to main only after validation passes or failures are documented
```

## Validation Gate

Before marking any merged wave complete:

```text
verify acceptance criteria from every involved goal
verify IPS traceability was not removed during conflict resolution
verify Telegram remains the primary control plane
verify no goal introduced dashboard-first or fake autonomous behavior
record commands and results in docs/IMPLEMENTATION_STATE.md
```

For parallel waves, run a dedicated merge/integration checkpoint even when Git reports a clean merge. The checkpoint must validate combined behavior, not only conflict absence.

## Production Deployment

Do not deploy to `alfares` or replace the legacy RunLayer service without explicit owner approval.

Deployment work belongs to Goal 10 unless the owner explicitly asks for an earlier deployment checkpoint.
