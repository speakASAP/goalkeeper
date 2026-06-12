# GoalKeeper Implementation Goals

This directory contains executable goal prompts for separate Codex sessions.

Use the master command from `../docs/IMPLEMENTATION_ORCHESTRATOR.md` in a fresh session, then specify a goal number when needed:

```text
GOALKEEPER ORCHESTRATOR: implement goal number 1
```

To print the current resume checkpoint from the shell:

```bash
./scripts/next_goal.sh
```

## Goals

1. `GOAL-01-foundation.md` - project skeleton, local commands, baseline architecture.
2. `GOAL-02-domain-persistence.md` - database schema, lifecycle states, audit events.
3. `GOAL-03-telegram-control-plane.md` - Telegram webhook, allowlist, command parser, callbacks, renderers.
4. `GOAL-04-intent-memory.md` - raw intent, normalized intent, approval, corrections, stale artifacts.
5. `GOAL-05-planning-task-creation.md` - planning adapter, plan approval, task creation.
6. `GOAL-06-ips-gates.md` - IPS settings, gates, context packages, coding prompts.
7. `GOAL-07-executor-orchestration.md` - worker loop, executor registry, routing, CLI/MCP adapters.
8. `GOAL-08-validation-reports.md` - validation, retry, completion reports.
9. `GOAL-09-overnight-self-improvement.md` - autonomous monitor, digest, self-improvement project.
10. `GOAL-10-hardening-deployment.md` - reliability, security, admin, deployment.

## Parallelization

Safe default:

```text
01 -> 02 -> 03 + 04 -> 05 -> 06 -> 07 -> 08 -> 09 -> 10
```

`03` and `04` may proceed in parallel after `02` if both branches avoid changing the same domain contracts. `06` storage work can begin before `05`, but gate enforcement depends on planning. `07` can split internally across subagents after the registry interfaces are defined. Merge through `docs/MERGE_AGENT_PROMPT.md`.

## Execution Waves

Use the wave table in `../docs/IMPLEMENTATION_STATE.md` as the operational view of this roadmap. A wave may advance only after:

- every goal in the wave has an `Intent Compliance Report`;
- validation evidence is recorded;
- merge/integration work is complete for parallel branches;
- the `Next Action` section is updated.

## Source Documents

Every implementation session must read these documents first:

```text
AGENTS.md
README.md
docs/idea.md
docs/PRODUCT_BRIEF.md
docs/IMPLEMENTATION_SPEC.md
docs/IPS_INTEGRATION.md
docs/governance/PROJECT_INVARIANTS.md
docs/process/DOCUMENTATION_COMPLETENESS_STANDARD.md
docs/process/OPERATIONAL_GATES.md
docs/process/AGENT_GAP_FILLING_RULES.md
docs/IMPLEMENTATION_STATE.md
docs/IMPLEMENTATION_ORCHESTRATOR.md
docs/orchestration/branch-workflow.md
```

When available, also read the Intent Preservation System governance docs listed in `AGENTS.md`.

## Required Workflow For Every Goal

Every goal session must:

1. Read the source documents and the selected `GOAL-XX-*.md`.
2. Run `git status --short --branch` before editing.
3. Create or update a local execution plan before coding, using `templates/EXECUTION_PLAN.md`.
4. Keep implementation within the selected goal scope.
5. Split work into subagents only when ownership is disjoint.
6. Generate or update a context package and coding prompt for coding work when the goal is not foundation-only.
7. Run the narrowest relevant validation and gate commands.
8. Produce an `Intent Compliance Report`.
9. Update `docs/IMPLEMENTATION_STATE.md` with status, validation evidence, blockers, and next action.
10. Commit all goal changes after validation and state updates.
11. Verify `git status --short --branch` is clean before starting the next goal.

## Local Process Templates

Use these templates for goal execution artifacts:

- `templates/EXECUTION_PLAN.md`
- `templates/CONTEXT_PACKAGE.md`
- `templates/CODING_PROMPT.md`
- `templates/VALIDATION_REPORT.md`

## Required Final Report Shape

Every goal, merge, or validation session must end with:

```markdown
## Intent Compliance Report

### Goal
...

### Implemented
...

### Not Implemented
...

### Boundary Check
...

### Subagents Used
...

### Validation Evidence
...

### Risks
...

### Files Changed
...

### Next Action
...
```

## Global Non-Goals

Do not implement:

```text
dashboard-first primary UI
fake autonomous execution without executor evidence
production deployment without owner approval
unapproved replacement of the legacy RunLayer service
multi-tenant enterprise expansion
real payment, IoT, or unrelated SaaS features
IPS bypasses for coding work
```
