# Research: Legacy RunLayer On `alfares`

## Verified Service

- Remote repo: `/home/ssf/Documents/Github/runlayer`
- URL: `https://runlayer.alfares.cz/`
- Health on 2026-06-11: `{"status":"ok","service":"runlayer"}`
- Stack: NestJS 10, TypeScript, TypeORM, PostgreSQL schema `runlayer`, Redis, RabbitMQ, static frontend in `public/`.

## What It Does

RunLayer implements a project control plane:

- stores projects;
- stores goals;
- creates tasks from goals;
- runs coordinator cycles;
- assigns tasks to worker agents;
- validates output;
- shows a dashboard;
- sends notifications through notifications-microservice;
- uses ai-microservice for LLM calls;
- pulls context through docs-rag-microservice for explore/investigate tasks.

## Found Original Concept

From `BUSINESS.md`:

- build an autonomous AI orchestration system;
- manage 20-50+ projects in the Statex ecosystem 24/7;
- minimize human involvement to critical decisions;
- success metric: 20+ autonomous projects and less than 1 hour of human intervention per week;
- target: task success rate > 85% without human involvement.

From `README.md` and the landing page:

- RunLayer is positioned as an AI operating layer for project execution;
- "Goals become plans";
- "Agents do the work";
- "Validation catches drift";
- "Humans approve decisions";
- the system should turn approved goals into delegated, validated execution.

## Legacy Goal Lifecycle

The discovered smoke test describes the main path:

1. Create project.
2. Create goal.
3. Human approval.
4. Coordinator dispatches plan task.
5. Worker generates plan.
6. Coordinator activates goal.
7. Execution tasks are created.
8. Tasks reach terminal states.
9. Goal progress is updated.
10. Project test data is cleaned up.

In code this is represented as:

- `Goal.status`: `queued`, `planning`, `approved`, `active`, `completed`, `cancelled`.
- `Goal.proposedPlan`: JSON plan with task steps.
- `Task.status`: `created`, `assigned`, `in_progress`, `validation`, `done`, `failed`, `cancelled`, `awaiting_user`, `pending_approval`.
- `Project.executionMode`: `auto` is effectively disabled right now; all tasks require manual approval.
- `ProjectCoordinatorService` executes the plan by priority groups.
- `TasksService.markDone` requires `_validation.passed === true`.
- After goal completion, a `notify` task is created to send a message.

## What Is Useful To Carry Over

- Goal-first model.
- Human approval gates.
- Planning before creating execution tasks.
- Explicit acceptance criteria on tasks.
- Task and goal statuses.
- Task idempotency through a stable key.
- Goal progress derived from task statuses.
- Validation before `done`.
- Lifecycle events: `goal.created`, `goal.activated`, `goal.completed`, `task.created`, `task.completed`, `cycle.started`, `cycle.completed`.
- Notifications as a separate layer.
- RAG/context retrieval for research tasks.

## What Not To Copy

- Dashboard-first control.
- Mixing old and new controllers/modules.
- Duplicate goal implementations in different folders.
- Strong coupling to Statex-specific microservice names in the core.
- Automatic goal completion without a clear human-readable audit.
- Intent as part of `userContext` inside a task instead of a separate memory model.
- Docs RAG as an optional prompt block instead of persistent project memory.

## Conclusion

Legacy RunLayer is a good prototype of an orchestration loop, but not the final architecture. The new system should preserve "goal -> intent -> plan -> tasks -> approvals -> result", while implementing it as a Telegram-first GoalKeeper with separate intent memory and clean domain boundaries.
