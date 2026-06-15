# Repository Agent Instructions

Shared rules live here:

- Codex profile: `/home/ssf/.codex/AGENTS.md`
- Cross-agent standard: `/home/ssf/.ai-agent-standards/CROSS_AGENT_AUTOMATION_STANDARD.md`
- Repository operations: `AGENT_OPERATIONS.md`

Read those first, then follow the repository-specific notes below and the current planning/status files.


## Repository-Specific Notes

# GoalKeeper Agent Instructions

## One-Command Continuation

When the user says:

```text
GOALKEEPER ORCHESTRATOR: continue implementation
```

or:

```text
Continue implementation of this project.
```

act as the GoalKeeper implementation orchestrator.

Do not ask the user which goal is next. Determine the next action from:

```text
docs/IMPLEMENTATION_STATE.md
docs/IMPLEMENTATION_ORCHESTRATOR.md
implementation-goals/README.md
```

Then continue from the latest checkpoint.

## Required Reading

Before implementation, branch orchestration, or launching workers, read:

```text
README.md
docs/idea.md
docs/PRODUCT_BRIEF.md
docs/IMPLEMENTATION_SPEC.md
docs/IPS_INTEGRATION.md
docs/governance/PROJECT_INVARIANTS.md
docs/process/DOCUMENTATION_COMPLETENESS_STANDARD.md
docs/process/OPERATIONAL_GATES.md
docs/process/AGENT_GAP_FILLING_RULES.md
docs/AGENT_ORCHESTRATION.md
docs/IMPLEMENTATION_STATE.md
docs/IMPLEMENTATION_ORCHESTRATOR.md
implementation-goals/README.md
```

For a specific goal, also read the matching file in `implementation-goals/`.

If available, use the Intent Preservation System reference material:

```text
/Users/Sergej.Stasok/Documents/Gitlab/intent-preservation-system/AGENTS.md
/Users/Sergej.Stasok/Documents/Gitlab/intent-preservation-system/17_governance/AI_AGENT_RULES.md
/Users/Sergej.Stasok/Documents/Gitlab/intent-preservation-system/17_governance/PROJECT_INVARIANTS.md
```

## Core Intent

```text
Telegram-first GoalKeeper.
Server-side autonomous development control plane.
Preserve original human intent from raw request through goal, plan, task, execution, validation, and report.
Run CLI, MCP, AI-agent, and internal workers through explicit executor adapters.
Ask the owner only for true blockers or scope/intent decisions.
No dashboard-first rebuild.
No fake autonomous execution.
No bypass around IPS gates for coding tasks.
No uncontrolled scope growth.
English-only documentation, prompts, reports, comments, and user-facing text.
```

## Orchestrator Duties

1. Read `docs/IMPLEMENTATION_STATE.md`.
2. Identify the active goal, next ready goal, or blocked checkpoint.
3. Run only the next valid goal according to `implementation-goals/README.md`.
4. Use isolated branches or worktrees for parallel goals.
5. Keep write ownership disjoint when using workers or subagents.
6. Update `docs/IMPLEMENTATION_STATE.md` after every implementation session.
7. Require an `Intent Compliance Report` before marking a goal complete.
8. Run or document validation before moving to the next goal.
9. For coding work, create or update an execution plan from `implementation-goals/templates/EXECUTION_PLAN.md` before editing code.
10. Run the narrowest relevant gate from `docs/process/OPERATIONAL_GATES.md`.
11. After each goal is complete, commit all goal changes and verify a clean working tree before starting the next goal.

## Branch Rules

Use the branch and worktree workflow in:

```text
docs/orchestration/branch-workflow.md
```

Sequential goals may run on one goal branch merged back immediately after validation.

Parallel goals must use separate branches or worktrees. Merge parallel work through:

```text
integration/gk-merge-goals
docs/MERGE_AGENT_PROMPT.md
```

## User Checkpoints

The user should only need to review:

```text
goal completion reports
running app URLs or screenshots when available
validation summaries
merge conflict decisions if any
MVP boundary or IPS deviations
production deployment approval
```

Ask the user only when a decision cannot be safely inferred from the docs and current repository state.
