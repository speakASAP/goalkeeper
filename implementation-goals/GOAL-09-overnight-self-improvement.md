# GOAL 09: Autonomous Overnight Mode And Self-Improvement

## User Command

```text
GOALKEEPER ORCHESTRATOR: implement goal number 9
```

## Outcome

Implement MVP autonomous overnight mode, long-running task monitor, digest reports, blocker aggregation, agent/executor status commands, task logs, and GoalKeeper self-improvement project registration.

## Branch

```text
feature/gk-goal-09-overnight-self-improvement
```

## Dependencies

- Goal 08 done.

## IPS Intent

Autonomy is allowed only inside approved scope, risk gates, concurrency limits, validation, and IPS. Self-improvement must use the same IPS path as external projects.

## Required Subagents

- Worker A: overnight policy and monitor.
- Worker B: digest reports and blocker aggregation.
- Worker C: `/agents`, `/executors`, `/task_log` commands.
- Worker D: self-improvement project registration.
- Validator: simulated overnight run with completed, failed, partial, blocked, and awaiting-user tasks.

## Allowed Changes

- Overnight mode services.
- Monitoring/status services.
- Telegram status commands.
- Digest rendering.
- Self-improvement project bootstrap.
- Tests.

## Forbidden Changes

- Do not weaken IPS gates for autonomous work.
- Do not auto-run high-risk or destructive commands.
- Do not spam Telegram with raw logs.

## IPS Preflight

Verify overnight work remains bounded by:

- approved intent;
- approved plan;
- IPS gates;
- executor permissions;
- per-project concurrency limits;
- validation before completion.

## Acceptance Criteria

- `/overnight` or equivalent policy command exists.
- Digest separates completed, failed, partial, blocked, and awaiting-user work.
- `/agents`, `/executors`, and `/task_log` expose useful state.
- Blockers are aggregated and actionable.
- GoalKeeper can register itself as a tracked project.
- Self-improvement tasks go through the same IPS path.

## Validation Commands

```bash
npm test
npm run typecheck
npm run lint
```

## Final Report

Include autonomous-mode behavior, safety gates, sample digest, and hardening gaps.
