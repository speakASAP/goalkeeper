# EP-GK-01: Foundation And Repository Skeleton

```yaml
id: EP-GK-01
status: approved
source_goal: implementation-goals/GOAL-01-foundation.md
owner: orchestrator
created: 2026-06-11
last_updated: 2026-06-11
completeness_level: complete
branch: feature/gk-goal-01-foundation
```

## Metadata

Goal 01 establishes the first runnable GoalKeeper application skeleton on `feature/gk-goal-01-foundation`.

## Upstream Traceability

- `README.md`
- `docs/idea.md`
- `docs/PRODUCT_BRIEF.md`
- `docs/IMPLEMENTATION_SPEC.md`
- `docs/IPS_INTEGRATION.md`
- `docs/governance/PROJECT_INVARIANTS.md`
- `implementation-goals/GOAL-01-foundation.md`

## Goal Impact

This goal creates the technical baseline required before Telegram-first goal orchestration, IPS gates, executor routing, validation reports, and overnight mode can be implemented.

## Project Invariants

- `GK-INV-001`: no dashboard-first work is introduced.
- `GK-INV-002`: local process gates and execution-plan traceability are preserved.
- `GK-INV-003`: executor orchestration is not faked in foundation work.
- `GK-INV-005`: the skeleton remains a modular monolith.
- `GK-INV-006`: no execution-critical missing markers remain in this plan.
- `GK-INV-007`: no secrets or production data are added.
- `GK-INV-009`: no production deployment is performed.
- `GK-INV-010`: repository artifacts remain English-only.

## Sensitive-Data Handling

Only placeholder environment values are added in `.env.example`. No secrets, raw production data, logs, screenshots, or private credentials are added.

## Contract/Schema Impact

No database schema or external API contract is introduced. The only runtime contract is a local `/health` endpoint returning service status.

## Replay/Determinism Impact

Foundation commands are deterministic at the repository level: install dependencies, build TypeScript, run tests, run typecheck, and call `/health`.

## Scope

- Add a TypeScript backend skeleton.
- Add a documented health endpoint.
- Add package scripts for build, test, typecheck, lint alias, and local development.
- Add minimal tests.
- Add environment example.
- Update implementation process docs with required per-goal commits.
- Update implementation state with Goal 01 progress and validation evidence.

## Non-Goals

- No Telegram bot implementation.
- No database lifecycle implementation.
- No queue, executor, or IPS runtime implementation.
- No deployment.
- No dashboard.

## Files To Inspect

- `README.md`
- `docs/IMPLEMENTATION_STATE.md`
- `docs/IMPLEMENTATION_ORCHESTRATOR.md`
- `docs/orchestration/branch-workflow.md`
- `implementation-goals/README.md`
- `implementation-goals/GOAL-01-foundation.md`

## Files To Create

- `package.json`
- `package-lock.json`
- `tsconfig.json`
- `.env.example`
- `src/app.ts`
- `src/main.ts`
- `src/config/env.ts`
- `src/health/health.test.ts`
- `implementation-goals/GOAL-01-foundation.execution-plan.md`

## Files To Modify

- `AGENTS.md`
- `README.md`
- `docs/IMPLEMENTATION_STATE.md`
- `docs/IMPLEMENTATION_ORCHESTRATOR.md`
- `docs/orchestration/branch-workflow.md`
- `implementation-goals/README.md`

## Files That Must Not Be Modified

- Production deployment manifests or remote server files.
- Existing process scripts except when a validation issue requires a narrow fix.

## Implementation Steps

1. Add the execution plan and per-goal commit rule to process documentation.
2. Add the TypeScript Fastify skeleton and health endpoint.
3. Install dependencies and commit the lockfile.
4. Run strict audit, pre-coding gate, build, typecheck, test, and health endpoint validation.
5. Update implementation state and commit all goal changes.

## Test Plan

- Unit test the health endpoint through Fastify injection.
- Typecheck the TypeScript project.
- Build the project.
- Start the server locally and call `/health`.

## Validation Plan

Validation passes when all Goal 01 acceptance criteria pass and `git status --short --branch` is clean after the final commit.

## Gate Commands

```bash
python3 scripts/strict_doc_audit.py --format markdown --fail-on-issues
python3 scripts/pre_coding_gate.py --root . --goal implementation-goals/GOAL-01-foundation.md
npm run build
npm run typecheck
npm test
curl -s http://127.0.0.1:3000/health
```

## Documentation Updates

- README local setup and architecture entry points.
- Implementation state validation evidence and next action.
- Orchestrator, goal roadmap, and branch workflow commit rules.

## Rollback Plan

Revert the Goal 01 commit or delete the feature branch before merge if validation fails and remediation is not practical.

## Agent Handoff Prompt

Implement only Goal 01 foundation scope. Preserve Telegram-first and IPS-gated intent. Do not implement Telegram, database lifecycle, executor orchestration, or deployment.

## Completion Checklist

- [x] Implementation complete
- [x] Tests complete
- [x] Validation evidence collected
- [x] Documentation updated
- [x] Goal commit created
- [x] Working tree clean after commit
- [x] Deviations documented
