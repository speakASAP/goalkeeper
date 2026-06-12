# Telegram Interface

## Principles

- Telegram is the main interface, not just notifications.
- Messages must be short and actionable.
- Every approval message must show enough context to make a decision.
- Critical actions use inline buttons.
- Destructive actions require confirmation.
- All Telegram commands, examples, bot messages, button labels, reports, and blocker text must be written in English only.

## Commands

### Project

```text
/projects
/new_project
/project <slug>
/register_project <slug> <path>
/pause_project <slug>
/resume_project <slug>
/overnight <on|off> [project_slug]
```

### Goal

```text
/goal <text>
/goals
/goal_status <goal_id_or_number>
/cancel_goal <goal_id_or_number>
/replan <goal_id_or_number>
```

### Tasks

```text
/tasks
/blocked
/approve <task_id_or_number>
/reject <task_id_or_number> <reason>
/retry <task_id_or_number>
```

### Agents And Execution

```text
/agents
/executors
/agent_status
/task_log <task_id_or_number>
```

### Context

```text
/memory <project_slug>
/decisions <goal_id_or_number>
/summary <goal_id_or_number>
/why_blocked <goal_id_or_number>
/ips <project_slug>
/overnight_report [project_slug]
/self_improve <text>
```

## Natural Language

The bot should accept natural language, for example:

```text
Create a goal: build the GoalKeeper MVP where I manage the project from Telegram
```

```text
Add a constraint: do not copy the old RunLayer, only use the lifecycle idea
```

```text
Show what is currently blocking goalkeeper
```

```text
I do not like the task list frontend in GoalKeeper. Make it clearer and add an agent filter.
```

## Goal Creation UX

User:

```text
/goal Build a new RunLayer version with Telegram control and intent preservation
```

Bot:

```text
I understood the goal this way:

Outcome: a new GoalKeeper system instead of the old RunLayer.
Intent: manage projects based on goals while preserving the original meaning of decisions.
Interface: Telegram-first.
Constraints:
1. Do not copy the old architecture.
2. Human approvals are mandatory for critical steps.
3. Documentation is needed for the AI implementation agent.

Success:
1. A project and goal can be created from Telegram.
2. The goal turns into a plan.
3. Tasks are linked to intent.
4. All decisions are preserved.
```

Buttons:

- Approve intent
- Edit
- Add constraint
- Cancel

## Plan Approval UX

Bot:

```text
Plan for goal "GoalKeeper MVP":

1. Create the Project/Goal/Intent/Task domain model.
2. Implement the Telegram webhook and allowlist.
3. Build the approve intent -> approve plan -> create tasks flow.
4. Add worker execution and validation.
5. Add a completion report.

Risk: medium.
Human gates: plan approval, task approval, destructive actions.
```

Buttons:

- Approve plan
- Regenerate
- Edit step
- Ask why
- Cancel goal

## Task Approval UX

Bot:

```text
Task approval needed.

Goal: GoalKeeper MVP
Task: Implement Telegram webhook
Why: without the webhook, the user cannot manage goals from Telegram.
Acceptance:
1. Webhook accepts Telegram updates.
2. User ID is checked against the allowlist.
3. Commands are routed to project/goal/task handlers.
```

Buttons:

- Approve
- Reject
- Add instruction
- Show intent
- Show IPS context

## Awaiting User UX

Bot:

```text
The agent needs an answer.

Goal: GoalKeeper MVP
Question: use NestJS or Fastify for the first version?
Context: the old RunLayer used NestJS, but the new system can be simpler.
Recommendation: NestJS if we want to reuse patterns; Fastify if we want a lightweight start.
```

Buttons:

- NestJS
- Fastify
- Explain more
- Defer

## Status UX

User:

```text
/status
```

Bot:

```text
Active projects: 1

GoalKeeper
Goal: MVP Telegram-first goal management
Status: active, 42%
Open tasks: 5
Blocked: 1 awaiting your answer
Last event: task.validation_started
```

## Agents UX

User:

```text
/agents
```

Bot:

```text
Agents running: 3

1. Codex CLI
Task: Implement Telegram webhook
Project: goalkeeper
Elapsed: 12m
State: running tests

2. Claude Code
Task: Review IPS gate integration
Project: goalkeeper
Elapsed: 4m
State: reading context package

Blocked: 1 task awaiting your answer
```

## Overnight Report UX

Bot:

```text
Overnight report: 23:00-07:00

Completed:
1. Telegram command parser
2. Executor registry migration

Partial:
1. Codex executor adapter - tests failing on timeout handling

Blocked:
1. Deployment policy needs your approval

Questions:
1. Should GoalKeeper auto-deploy staging after tests pass?
```

Buttons:

- Approve staging deploy
- Answer questions
- Show logs
- Continue work

## IPS Gate Failed UX

Bot:

```text
Coding paused: IPS pre-coding gate failed.

Task: Improve task list frontend
Missing:
1. Goal impact mapping
2. Execution plan approval
3. Validation criteria

I can generate draft missing docs with [MISSING] markers, or ask you for the missing intent.
Coding will not resume until execution-critical gaps are resolved and the execution plan is approved.
```

Buttons:

- Generate drafts
- Ask me questions
- Show IPS gaps
- Cancel task

## Notification Rules

Send Telegram messages for:

- intent ready for approval;
- plan ready for approval;
- task pending approval;
- task awaiting user answer;
- IPS gate failed;
- executor started long-running task;
- overnight report ready;
- goal blocked;
- goal completed;
- daily digest.

Do not spam for:

- every internal worker heartbeat;
- every retry unless it needs human attention;
- low-level logs.
