# GOAL 07: Executor Orchestration, Worker Loop, And Routing

## User Command

```text
GOALKEEPER ORCHESTRATOR: implement goal number 7
```

## Outcome

Implement dependency-aware task execution with a worker loop, executor registry, routing module, CLI/shell adapter, MCP adapter interface, structured execution records, retries, timeouts, and IPS enforcement before coding executors.

## Branch

```text
feature/gk-goal-07-executor-orchestration
```

## Dependencies

- Goal 02 done.
- Goal 06 done.

## IPS Intent

Execution is downstream of intent preservation. Routing must refuse coding executors unless IPS gate status is passed and context package/coding prompt references exist.

## Required Subagents

- Worker A: executor registry and capability matching.
- Worker B: worker loop, dependency resolver, retry/timeout model.
- Worker C: CLI/shell adapter and execution record capture.
- Worker D: MCP adapter interface.
- Validator: tests routing refusal when IPS fails.

## Allowed Changes

- Worker module.
- Executor registry.
- Routing module.
- CLI/shell executor.
- MCP executor interface.
- Execution records/log redaction.
- Tests.
- README operational notes.

## Forbidden Changes

- Do not run destructive commands in tests.
- Do not execute production deploy.
- Do not store secrets in execution logs.
- Do not route around IPS failures.

## IPS Preflight

Before implementation, verify Goal 06 exists and tests fail-closed behavior. If not, block this goal.

## Acceptance Criteria

- Worker only runs ready tasks whose dependencies are satisfied.
- Routing stores selected executor and reason.
- Disabled or unauthorized executors cannot receive tasks.
- CLI execution captures command, cwd, start/end timestamps, stdout/stderr summary, status, and timeout.
- Secrets are redacted from logs.
- Coding tasks with failed/missing IPS gate are blocked, not routed.
- Interactive blockers become structured questions.

## Validation Commands

```bash
npm test
npm run typecheck
npm run lint
```

Add adapter-specific tests with harmless commands only.

## Final Report

Include executor interfaces, routing behavior, tests run, and next recommended command.
