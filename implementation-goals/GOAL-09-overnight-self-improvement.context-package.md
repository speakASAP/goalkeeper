# CP-GK-09: Overnight Mode And Self-Improvement Context Package

```yaml
id: CP-GK-09
status: approved
source_execution_plan: implementation-goals/GOAL-09-overnight-self-improvement.execution-plan.md
owner: orchestrator
created: 2026-06-12
last_updated: 2026-06-12
completeness_level: complete
```

## Target Task

Implement Goal 09 autonomous overnight mode and self-improvement MVP support.

## Upstream Traceability

- `implementation-goals/GOAL-09-overnight-self-improvement.md`
- `implementation-goals/GOAL-09-overnight-self-improvement.execution-plan.md`
- `docs/AUTONOMOUS_DEVELOPMENT.md`
- `docs/AGENT_ORCHESTRATION.md`
- `docs/IPS_INTEGRATION.md`
- `docs/governance/PROJECT_INVARIANTS.md`
- `docs/IMPLEMENTATION_SPEC.md`

## Included Documents

- `docs/AUTONOMOUS_DEVELOPMENT.md`: Defines overnight mode, self-improvement, progress visibility, reports, blockers, parallelism, and safety gates.
- `docs/AGENT_ORCHESTRATION.md`: Defines executor adapters, registry, routing, execution records, and Telegram progress summaries.
- `docs/IPS_INTEGRATION.md`: Defines fail-closed coding task gates and self-improvement workflow.
- `implementation-goals/GOAL-09-overnight-self-improvement.md`: Defines the goal outcome and acceptance criteria.
- `src/domain/executors.ts` and `src/domain/validation.ts`: Existing execution and validation surfaces that Goal 09 builds on.
- `src/modules/telegram/commands.ts` and `src/modules/telegram/renderers.ts`: Existing Telegram parsing and rendering conventions.

## Excluded Documents

- Remote deployment instructions: deployment is not in scope.
- Dashboard documents: dashboard is not MVP-critical and must not become the primary control surface.
- Intent Preservation System source repository files: used as governance reference only, not modified.

## Constraints

- Autonomous work must stay within approved scope, risk, concurrency, dependencies, validation, and IPS gates.
- Coding tasks with missing IPS artifacts, failed gates, draft prompts, or missing validation must be blocked.
- High-risk, destructive, and deployment actions require owner approval.
- Telegram summaries must be concise and must not expose raw stdout, stderr, secrets, or production data.
- Self-improvement must register GoalKeeper as a normal tracked project with IPS enabled and cannot bypass the same path as external projects.

## Allowed Changes

- Domain autonomy/overnight module and tests.
- Telegram command parser updates and tests.
- Telegram renderers and tests.
- Goal 09 implementation artifacts and state documentation.
- Compact README note if useful.

## Forbidden Changes

- Production deployment or deploy-script changes.
- Weakening IPS, validation, or executor routing checks.
- Adding real credentials, raw production logs, or secret-like examples.
- Adding a dashboard-first user interface.
- Starting real long-running workers from tests or command handlers.

## Agent Prompt

Build a deterministic MVP domain layer for overnight autonomy and self-improvement. It should produce eligibility decisions, digest buckets, blocker summaries, agent/executor status views, task-log summaries, and a GoalKeeper self-project bootstrap record. Add Telegram commands and renderers for owner visibility. Keep execution side effects out of scope; this goal prepares the safe monitoring and reporting layer.

## Validation Instructions

Run the goal validation commands from the execution plan. Tests must cover completed, failed, partial, blocked, and awaiting-user digest categories; IPS fail-closed behavior; blocker aggregation; `/overnight`, `/agents`, `/executors`, and `/task_log` parsing; and renderer output that summarizes evidence without raw logs.
