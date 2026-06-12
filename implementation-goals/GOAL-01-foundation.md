# GOAL 01: Foundation And Repository Skeleton

## User Command

```text
GOALKEEPER ORCHESTRATOR: implement goal number 1
```

## Outcome

Create the initial runnable GoalKeeper application skeleton with explicit framework choice, local commands, baseline configuration, health endpoint, test runner, lint/typecheck path, and project documentation.

This goal establishes the foundation for all later coding sessions.

## Branch

```text
feature/gk-goal-01-foundation
```

## Dependencies

None.

## IPS Intent

Preserve the core product intent:

- Telegram is the primary UI.
- GoalKeeper manages goals, intent, plans, tasks, executors, validation, and audit.
- Coding work must eventually be gated by IPS.
- MVP should be a modular monolith, not premature microservices.

## Required Subagents

Spawn at least one explorer subagent before coding:

- Explorer A: inspect docs and recommend the smallest viable backend stack and folder structure.

Optional worker split after the framework is chosen:

- Worker A owns app skeleton and health endpoint.
- Worker B owns test/lint/typecheck scripts and README setup instructions.

Do not give two workers the same file ownership unless one is read-only.

## Allowed Changes

- Create app source tree.
- Add package/config files.
- Add `.env.example`.
- Add health endpoint.
- Add minimal tests.
- Update README with local run commands.
- Update `docs/IMPLEMENTATION_STATE.md`.

## Forbidden Changes

- Do not deploy.
- Do not implement Telegram flows yet.
- Do not implement database lifecycle beyond minimal connection/config placeholders.
- Do not remove existing documentation.

## Implementation Notes

Recommended default unless inspection proves otherwise:

- TypeScript.
- NestJS if module boundaries are useful and setup is practical.
- Fastify if the agent chooses a lighter stack and documents why.
- PostgreSQL and Redis may be configured but do not need full runtime integration in this goal.

## IPS Preflight

Before editing:

1. Read `IPS_INTEGRATION.md`.
2. Confirm this goal is foundation work, not feature coding against production behavior.
3. If IPS scripts exist locally, run the documentation audit if available.
4. Record missing IPS scripts as a non-blocking foundation note, not a bypass for later coding goals.

## Acceptance Criteria

- App starts locally with a documented command.
- Health endpoint returns OK.
- Test command runs.
- Lint or typecheck command exists and runs, or a documented blocker explains why not.
- README documents setup, env, run, test, and architecture entry points.
- `docs/IMPLEMENTATION_STATE.md` marks Goal 01 correctly.

## Validation Commands

Run the commands that exist after implementation, for example:

```bash
npm install
npm test
npm run typecheck
npm run lint
npm run start:dev
curl -s http://127.0.0.1:3000/health
```

If dependencies cannot be installed because network is restricted, request escalation or record the blocker.

## Final Report

Include:

- framework chosen and why;
- changed files;
- commands run;
- app URL if started;
- remaining blockers;
- next recommended command: `GOALKEEPER ORCHESTRATOR: implement goal number 2`.
