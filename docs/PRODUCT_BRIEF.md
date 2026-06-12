# Product Brief: GoalKeeper

## Idea

GoalKeeper is a personal goal-driven project operating system. The user writes a goal in Telegram in natural language, the system clarifies the intent, turns the goal into a task plan, shows critical decisions to the human, and then drives the project to the result.

The system must track any user project and orchestrate task execution across different AI agents and tools: Codex, Claude Code, OpenCode, CLI commands, MCP tools, internal worker processes, and external services.

The end goal is to let the owner develop projects at any time. They can submit a task in Telegram, go to sleep, and during the night one or more agents will code, verify, ask questions only when necessary, and prepare a report.

The Intent Preservation System is mandatory: no coding task may start without preserved intent, upstream traceability, an approved execution plan, a context package, a coding prompt, and validation criteria.

IPS is the boundary of autonomy. If intent, scope, approval, validation, or traceability are incomplete, the system must stop, create a blocker, and request clarification instead of allowing an agent to continue with a "best effort" implementation.

The system must manage projects not as a task list, but as a chain of intent:

1. The human states a goal.
2. The system preserves the original intent and constraints.
3. AI proposes a plan.
4. The human approves or adjusts the plan.
5. The system creates tasks and executes them through agents or external services.
6. After each step, the system updates goal state and asks the human only where a decision is needed.
7. On completion, the system stores the summary, decisions, artifacts, and lessons learned.

## Business Idea From RunLayer

The old RunLayer idea was described as a "Project OS": an operating system for 20-50+ digital projects where AI worker agents handle routine work, a validator checks the result, and the human makes only critical decisions.

Target metrics from the old idea:

- 20+ projects operate autonomously;
- less than 1 hour of manual intervention per week;
- more than 85% of tasks complete without human involvement.

GoalKeeper keeps this idea but changes the product center:

- from dashboard-first to Telegram-first;
- from "task orchestrator" to "system for preserving intent and achieving goals";
- from executing everything automatically to explicit human gates;
- from the old mixed architecture to a clean domain model and modular implementation.

## Audience

- A founder or owner of multiple projects.
- A technical leader who wants to delegate execution to AI agents without losing control.
- An agentic team that needs to manage many client engagements through goals and approvals.

## Key Value

The user manages projects from Telegram with short commands and natural language. The system handles:

- goal decomposition;
- context preservation;
- reminders and escalations;
- dependency control;
- task preparation for AI agents;
- executor selection for each task;
- CLI/MCP/tool execution on the server;
- pre-coding IPS gates and context package generation;
- result validation;
- plain-language reporting to the human.

## Non-Goals For The First Version

- Do not build a large web dashboard as the main interface.
- Do not copy the old RunLayer line by line.
- Do not build a fully autonomous system without approvals.
- Do not try to manage 50 projects immediately without a reliable lifecycle and intent memory.
- Do not allow agents to write code from vague intent without IPS traceability and validation gates.
- Do not treat draft IPS documents as approval for coding; drafts only record gaps.
