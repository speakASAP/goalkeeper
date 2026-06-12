# Autonomous Development Operating Model

## Target Outcome

GoalKeeper must become the system that lets the owner develop all projects at any time, including while the owner is offline or sleeping.

The owner should be able to write in Telegram:

```text
Add a feature to GoalKeeper that shows active agents and their current tasks.
```

GoalKeeper should then:

1. Capture the raw request.
2. Preserve intent through Intent Preservation System gates.
3. Clarify missing requirements if necessary.
4. Create or update the goal.
5. Generate an execution plan.
6. Select one or more executors.
7. Run agents on the server.
8. Monitor progress.
9. Ask questions in Telegram only when human input is required.
10. Validate results.
11. Report what was implemented, what failed, what remains, and how the owner can help.

## Overnight Mode

Overnight mode means the owner can safely delegate work and return later to a structured report.

Requirements:

- Agents can run for long periods without blocking Telegram.
- Multiple agents can work in parallel on different tasks or projects.
- Work is bounded by approved scope, allowed files, and executor permissions.
- Coding work is bounded by the approved IPS chain: intent, goal impact, plan, execution plan, context package, coding prompt, and validation criteria.
- The system pauses automatically at risk gates.
- The system sends Telegram questions only for real blockers.
- The final report is concise but complete.

## Self-Improvement

GoalKeeper must be able to improve itself using the same workflow it uses for external projects.

Example:

```text
I do not like the task list frontend in GoalKeeper. Make it clearer and add an agent filter.
```

Required self-improvement flow:

1. Register GoalKeeper itself as a tracked project.
2. Treat the Telegram request as a new goal.
3. Preserve and approve the intent.
4. Create and approve the plan.
5. Create or link goal impact, task, and approved execution plan artifacts.
6. Generate a context package from GoalKeeper docs and current code.
7. Generate a coding prompt from the approved execution plan and context package.
8. Run IPS pre-coding gates.
9. Route implementation to an executor only after the gate passes.
10. Run tests/build/visual checks.
11. Produce validation evidence.
12. Ask for approval before deploy if deploy is risky.
13. Report back to Telegram.

Self-improvement must not bypass governance. The fact that GoalKeeper modifies itself makes IPS integration more important, not less.

## Progress Visibility

The owner should be able to ask at any time:

```text
/status
/agents
/project goalkeeper
/goal 12
/why_blocked
```

The system should answer:

- which projects are active;
- which goals are active;
- which agents are running;
- what each agent is doing;
- what changed since last report;
- what is blocked;
- what needs owner input;
- estimated next checkpoint.

## Telegram Reports

A completed task report must include:

- goal;
- task;
- executor;
- summary of work;
- files/artifacts changed;
- tests/validation run;
- result: completed, failed, partial, blocked;
- remaining risks;
- next action.

A completed goal report must include:

- original user intent;
- final interpretation;
- tasks completed;
- decisions made;
- validation evidence;
- what was not done;
- recommended next goals.

## Agent Blockers

When an agent needs help, it should not simply fail. It should create a structured blocker.

Blocker fields:

- question;
- why the answer is needed;
- options if known;
- recommended option;
- impact of each option;
- what happens if the owner does not answer.

The bot sends the blocker to Telegram and pauses the task as `awaiting_user`.

## Parallelism

The system must support:

- multiple active projects;
- multiple active goals;
- multiple agents;
- dependency-aware parallel execution;
- per-project concurrency limits;
- global resource limits;
- per-executor health and timeout handling.

Parallel work must never break traceability. Every task still needs:

- project;
- goal;
- plan step;
- intent package;
- executor;
- execution record;
- validation result.

## Safety Gates

Autonomy is allowed only inside explicit boundaries.

Required gates:

- intent approval for vague or high-impact goals;
- plan approval before coding;
- pre-coding IPS gate;
- approved execution plan before coding prompt generation;
- context package and coding prompt before coding executor routing;
- destructive-command approval;
- deployment approval for production systems;
- validation report before completion;
- post-run summary.

The owner may later configure semi-auto policies, but MVP should prefer safe manual gates.
