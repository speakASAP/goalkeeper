# Intent Memory

## Problem

The old RunLayer stored part of the context in `Task.userContext` and part in `Goal.description`, but intent was not a standalone entity. Because of this, an agent can complete a task formally while losing the meaning: why the work is being done, what must not be broken, and which decisions the human has already made.

GoalKeeper must make intent the primary memory layer.

## What To Store

For each goal:

- raw user message;
- normalized intent;
- constraints;
- success criteria;
- non-goals;
- assumptions;
- clarifying questions and answers;
- human approvals;
- plan versions;
- rejected options;
- task outputs;
- final retrospective.

## Intent Bundle For Agents

Every worker task must receive an intent bundle. For coding tasks, this bundle is part of the IPS execution contract and must be stored as an immutable snapshot on the task/execution record.

```json
{
  "goal": {
    "title": "Build GoalKeeper MVP",
    "intent": "Telegram-first goal management with preserved human intent",
    "success_criteria": [],
    "constraints": [],
    "non_goals": []
  },
  "why_this_task_exists": "...",
  "upstream_traceability": [],
  "goal_impact_refs": [],
  "approved_execution_plan_ref": "...",
  "context_package_ref": "...",
  "coding_prompt_ref": "...",
  "relevant_decisions": [],
  "acceptance_criteria": [],
  "validation_criteria": [],
  "project_memory": {
    "current_state": "...",
    "important_files": [],
    "known_risks": []
  }
}
```

If any coding-task field above is missing or contains unresolved `[MISSING: ...]` markers for scope, approval, constraints, data handling, contract/schema impact, replay/determinism, gates, or validation, GoalKeeper must create a blocker instead of starting an executor.

## Distillation

Memory should have two layers:

1. Full append-only records.
2. Distilled current summary.

The distilled summary can be overwritten, but the source records cannot.

## RAG

RAG should not be only "docs context before prompt". It should retrieve:

- previous goals in the same project;
- decisions relevant to current task;
- constraints;
- rejected approaches;
- similar completed tasks;
- latest project summary.

MVP can start without embeddings by using:

- goal_id links;
- tags;
- full-text search;
- manually maintained summaries.

Embeddings can be added after lifecycle is stable.

## Human Corrections

When user says:

```text
No, I meant Telegram control, not a dashboard.
```

System must:

- create `IntentRecord(kind=correction)`;
- update distilled intent;
- mark impacted plan/tasks as stale if needed;
- ask whether to replan.

If the correction affects a coding task that already has a context package or coding prompt, those artifacts become stale and must be regenerated from the updated intent before execution continues.

## Decision Log

Every approval must become a decision record:

- who approved;
- what was approved;
- what context was shown;
- when;
- optional comment.

This is more important than storing only final statuses.
