# CP-GK-07: Executor Orchestration, Worker Loop, And Routing

```yaml
id: CP-GK-07
status: approved
source_execution_plan: implementation-goals/GOAL-07-executor-orchestration.execution-plan.md
owner: orchestrator
created: 2026-06-12
last_updated: 2026-06-12
completeness_level: complete
```

## Target Task

Implement Goal 07 executor registry, routing, worker readiness selection, CLI/shell adapter, MCP adapter interface, structured execution records, retries, timeouts, redaction, and IPS enforcement before coding executors.

## Upstream Traceability

- `implementation-goals/GOAL-07-executor-orchestration.execution-plan.md`
- `implementation-goals/GOAL-07-executor-orchestration.md`
- `implementation-goals/GOAL-06-ips-gates.md`
- `docs/IMPLEMENTATION_SPEC.md`
- `docs/IPS_INTEGRATION.md`
- `docs/AGENT_ORCHESTRATION.md`
- `docs/AUTONOMOUS_DEVELOPMENT.md`
- `docs/SYSTEM_ARCHITECTURE.md`
- `docs/governance/PROJECT_INVARIANTS.md`
- `docs/process/OPERATIONAL_GATES.md`
- `/Users/Sergej.Stasok/Documents/Gitlab/intent-preservation-system/AGENTS.md`
- `/Users/Sergej.Stasok/Documents/Gitlab/intent-preservation-system/17_governance/AI_AGENT_RULES.md`
- `/Users/Sergej.Stasok/Documents/Gitlab/intent-preservation-system/17_governance/PROJECT_INVARIANTS.md`

## Included Documents

- `docs/AGENT_ORCHESTRATION.md`: source of adapter interface, executor registry fields, routing inputs/outputs, CLI execution requirements, MCP execution requirements, execution record shape, and safety rules.
- `docs/SYSTEM_ARCHITECTURE.md`: source of module boundaries and the worker/executor/routing position in the modular monolith.
- `docs/IMPLEMENTATION_SPEC.md`: source of task execution lifecycle, IPS preconditions, execution record requirements, and Telegram blocker expectations.
- `docs/IPS_INTEGRATION.md`: source of fail-closed IPS requirements before coding executor routing.
- `docs/AUTONOMOUS_DEVELOPMENT.md`: source of long-running worker, progress, blocker, and autonomy constraints.
- `docs/governance/PROJECT_INVARIANTS.md`: source of invariant evidence required by this goal.
- `implementation-goals/GOAL-06-ips-gates.md`: source of dependency behavior for IPS gate status and artifact links.
- `implementation-goals/GOAL-07-executor-orchestration.md`: source of Goal 07 acceptance criteria and allowed changes.

## Excluded Documents

- Goal 08 validation reports are excluded except for keeping execution records ready for later validation.
- Goal 09 overnight mode is excluded except for preserving worker and blocker semantics needed later.
- Goal 10 deployment hardening is excluded because production deployment is out of scope.
- Dashboard files are excluded because Telegram remains the primary control plane.

## Constraints

- Coding executors must not be selected unless IPS gate status is passed and context package plus coding prompt references exist.
- Every selected executor must be explicit, enabled, root-authorized, capability-compatible, and risk-compatible.
- CLI tests must use harmless commands only.
- Execution logs and summaries must redact secret-looking values.
- Interactive blockers must become structured questions instead of unstructured failures.
- Worker readiness must respect task dependencies and retry budget.
- MCP support is interface-only in this goal.

## Allowed Changes

- `src/domain/executors.ts`
- `src/domain/executors.test.ts`
- Narrow type additions in `src/domain/types.ts` if needed.
- `README.md` operational notes.
- Goal 07 process artifacts and implementation state.

## Forbidden Changes

- Do not execute destructive commands.
- Do not run production deploys or remote server commands.
- Do not call real MCP servers or AI CLI agents.
- Do not allow coding task routing around IPS failure.
- Do not store secrets or raw production data in test fixtures, logs, prompts, or reports.

## Agent Prompt

Implement the executor orchestration domain layer described by `implementation-goals/GOAL-07-executor-orchestration.execution-plan.md`. Keep routing deterministic and auditable. Use explicit adapters for execution. Block coding tasks unless the Goal 06 IPS chain is already passed and linked. Capture harmless CLI execution evidence with redacted logs and timeout behavior.

## Validation Instructions

Run:

```bash
npm test
npm run typecheck
npm run lint
git diff --check
python3 scripts/strict_doc_audit.py --format markdown --fail-on-issues
python3 scripts/pre_coding_gate.py --root . --goal implementation-goals/GOAL-07-executor-orchestration.md
python3 scripts/deployment_readiness_gate.py --root .
```
