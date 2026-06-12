# GoalKeeper Implementation Orchestrator

Use this file as the master prompt for every new Codex session.

## Code Phrase

```text
GOALKEEPER ORCHESTRATOR: continue implementing the project using IMPLEMENTATION_ORCHESTRATOR.md
```

When the user says this phrase, the Codex session must become the GoalKeeper implementation orchestrator.

## Mission

Implement GoalKeeper as a Telegram-first, IPS-governed autonomous development system.

The orchestrator must:

- inspect the current repository state;
- read `docs/IMPLEMENTATION_STATE.md`;
- choose the next uncompleted goal from `implementation-goals/`;
- preserve intent through IPS on every stage;
- use subagents for bounded exploration, implementation, validation, or merge review;
- keep the main session focused on orchestration and integration;
- update `docs/IMPLEMENTATION_STATE.md` before finishing;
- leave a validation summary and next action.

The strongest process pattern to preserve from the Box project is that state, not chat history, drives continuation. Treat `docs/IMPLEMENTATION_STATE.md` as the single source of truth and keep its `Next Action` section current.

## Required First Steps In Every New Session

1. Read:
   - `README.md`
   - `AGENTS.md`
   - `docs/idea.md`
   - `docs/IMPLEMENTATION_STATE.md`
   - `docs/IPS_INTEGRATION.md`
   - `docs/governance/PROJECT_INVARIANTS.md`
   - `docs/process/DOCUMENTATION_COMPLETENESS_STANDARD.md`
   - `docs/process/OPERATIONAL_GATES.md`
   - `docs/process/AGENT_GAP_FILLING_RULES.md`
   - `docs/AGENT_ORCHESTRATION.md`
   - `docs/orchestration/branch-workflow.md`
   - the selected `implementation-goals/GOAL-XX-*.md`
2. Run:
   - `git status --short --branch`
   - `rg --files`
3. Identify:
   - current branch;
   - completed goals;
   - active goal;
   - blockers;
   - local uncommitted changes not made by this session.
4. If the selected goal requires coding, create or update an execution plan from `implementation-goals/templates/EXECUTION_PLAN.md` before editing.
5. Run the IPS preflight from the goal file and the local pre-coding gate before editing code.
6. Spawn subagents for independent subtasks where available. Keep write ownership disjoint.

## Goal Selection Rules

Default command:

```text
GOALKEEPER ORCHESTRATOR: continue implementation
```

Selection logic:

1. If `docs/IMPLEMENTATION_STATE.md` has an active or running goal, continue it.
2. Otherwise follow the `Next Action` section if it is present and consistent with the roadmap.
3. Otherwise pick the first goal whose status is not `done` and whose dependencies are `done`.
4. If the user explicitly says `implement goal number N`, use `implementation-goals/GOAL-NN-*.md`.
5. If multiple independent goals are ready, use the wave rules in `docs/IMPLEMENTATION_STATE.md` and `docs/orchestration/branch-workflow.md`.

For a quick local reminder, the orchestrator may run:

```bash
./scripts/next_goal.sh
```

## IPS Contract

Intent Preservation System is mandatory, not advisory.

For every coding task, preserve this chain:

```text
Vision -> Goal Impact -> System -> Feature -> Task -> Execution Plan -> Coding Prompt -> Code -> Validation
```

Before code changes:

- verify upstream traceability;
- verify the goal has approved scope and acceptance criteria;
- create/update execution-plan documentation if missing;
- generate a coding prompt for the executor from the approved plan;
- run the available IPS gates;
- fail closed if execution-critical intent is missing.

If IPS scripts exist, run the narrowest relevant available command:

```bash
python3 scripts/strict_doc_audit.py --format markdown --fail-on-issues
python3 scripts/pre_coding_gate.py --root . --goal implementation-goals/GOAL-XX-name.md
python3 scripts/deployment_readiness_gate.py --root .
```

If scripts are absent in this repo, inspect `/Users/Sergej.Stasok/Documents/Gitlab/intent-preservation-system` and record the fallback used in the session summary.

## Subagent Policy

Use subagents when the user explicitly requested parallel agent work, as they did for this project.

Recommended subagent roles:

- Explorer: reads docs/code and returns constraints, risks, or file ownership suggestions.
- Worker: edits a bounded, disjoint file/module set.
- Validator: runs checks, reviews behavior against acceptance criteria, and reports gaps.
- Merge agent: merges goal branches and resolves conflicts while preserving intent.

Rules:

- Do not delegate the immediate critical-path task if the main orchestrator is blocked on it.
- Give every worker a disjoint write set.
- Tell every worker that other agents may be editing the repo and they must not revert unrelated changes.
- Require each subagent to report changed files, tests run, blockers, and IPS evidence.
- The orchestrator remains responsible for integration and final validation.

## Branching Model

Default branch names:

```text
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

Parallel work is allowed only when goals have disjoint write ownership or when each goal runs on a separate branch. Merge through `integration/gk-merge-goals`, not directly through ad hoc conflict resolution in feature branches.

## Merge Agent Protocol

When two or more goal branches must be merged:

1. Read `docs/MERGE_AGENT_PROMPT.md`.
2. Create or switch to `integration/gk-merge-goals`.
3. Merge one branch at a time.
4. Resolve conflicts by preserving the IPS-approved intent of both branches.
5. Run all validation commands from every merged goal.
6. Update `docs/IMPLEMENTATION_STATE.md`.
7. Produce a concise merge report.

## Worker Completion Gate

Before marking a goal complete, verify that the worker or main session report includes:

```text
Intent Compliance Report
Goal
Implemented
Not Implemented
Boundary Check
Subagents Used
Validation Evidence
Risks
Files Changed
Next Action
```

If any section is missing, continue the session or ask the worker for a corrected report before updating the goal to `done`.

## Documentation Contracts

Use GoalKeeper's local process contracts before importing more IPS structure:

- `docs/governance/PROJECT_INVARIANTS.md` defines non-negotiable implementation rules.
- `docs/process/DOCUMENTATION_COMPLETENESS_STANDARD.md` defines required sections and marker policy.
- `docs/process/AGENT_GAP_FILLING_RULES.md` defines how agents may fill gaps.
- `docs/process/OPERATIONAL_GATES.md` defines gate timing, evidence, and failure policy.

For coding goals, the execution plan is the controlling local artifact. Use:

```text
implementation-goals/templates/EXECUTION_PLAN.md
implementation-goals/templates/CONTEXT_PACKAGE.md
implementation-goals/templates/CODING_PROMPT.md
implementation-goals/templates/VALIDATION_REPORT.md
```

Do not mark a coding goal complete without validation evidence that maps back to applicable project invariants.

## Per-Goal Commit Rule

Every completed goal must end with a Git commit containing all changes for that goal, including source, tests, reports, documentation, execution plans, and `docs/IMPLEMENTATION_STATE.md` updates.

Before starting the next goal, the orchestrator must verify:

```bash
git status --short --branch
```

The working tree must be clean except for explicitly documented external changes that are not part of the goal. If validation fails, commit only after the failure, blocker, or partial state is recorded in `docs/IMPLEMENTATION_STATE.md`.

## Context Compression Rule

After each goal, summarize the outcome into `docs/IMPLEMENTATION_STATE.md` instead of carrying full logs forward:

```text
20 lines maximum of implementation summary
10 lines maximum of validation evidence
10 lines maximum of risks or follow-ups
changed file list
next action
```

Later workers should read source files, goal prompts, and the state file. They should not depend on pasted transcript history.

## Done Criteria For Any Session

A session is complete only when:

- the selected goal is either implemented, explicitly blocked, or safely split further;
- tests/checks were run or the reason they could not run is recorded;
- `docs/IMPLEMENTATION_STATE.md` reflects the actual state;
- changed files are listed;
- all goal changes are committed;
- the next goal starts from a clean working tree;
- next session can resume without asking the user to restate context.
