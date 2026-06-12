# EP-GK-10: Hardening And Deployment Readiness Execution Plan

```yaml
id: EP-GK-10
status: approved
source_goal: implementation-goals/GOAL-10-hardening-deployment.md
owner: orchestrator
created: 2026-06-12
last_updated: 2026-06-12
completeness_level: complete
branch: feature/gk-goal-10-hardening-deployment
```

## Metadata

Goal 10 hardens the GoalKeeper MVP for real use and prepares a documented deployment path. The work is approved for this implementation session by the explicit user command: `GOALKEEPER ORCHESTRATOR: implement goal number 10`. Production deployment is not approved by this command.

## Upstream Traceability

- `README.md`
- `docs/idea.md`
- `docs/PRODUCT_BRIEF.md`
- `docs/IMPLEMENTATION_SPEC.md`
- `docs/IPS_INTEGRATION.md`
- `docs/AGENT_ORCHESTRATION.md`
- `docs/IMPLEMENTATION_STATE.md`
- `docs/governance/PROJECT_INVARIANTS.md`
- `docs/process/OPERATIONAL_GATES.md`
- `implementation-goals/GOAL-09-overnight-self-improvement.md`
- `implementation-goals/GOAL-10-hardening-deployment.md`

## Goal Impact

This goal moves GoalKeeper from MVP feature coverage toward production readiness. The implementation must make repeated Telegram callbacks and task actions idempotent, add owner/admin control surfaces for risky actions, keep user-visible hardening inside Telegram, add backup/export support, add structured operational logging, and document a deployment path with rollback and owner approval gates.

## Project Invariants

- `GK-INV-001`: Preserved by exposing admin, backup, smoke, and deployment readiness controls through Telegram command parsing/rendering rather than introducing a dashboard-first flow.
- `GK-INV-002`: Preserved by keeping deployment and hardening tasks traceable to this execution plan, context package, coding prompt, and validation report.
- `GK-INV-003`: Preserved by modeling hardening, confirmation, export, logging, and smoke-test evidence explicitly instead of simulating execution.
- `GK-INV-004`: Preserved by requiring owner input only for destructive/admin/deployment approval and true blockers.
- `GK-INV-005`: Preserved by remaining in the existing TypeScript Fastify modular monolith.
- `GK-INV-006`: Preserved by running strict audit, pre-coding, and deployment-readiness gates and failing closed on unresolved markers.
- `GK-INV-007`: Preserved by redacting logs, using synthetic tests, and avoiding real secrets or raw production data in artifacts.
- `GK-INV-008`: Preserved by keeping GoalKeeper self-improvement and deployment work within the same IPS-gated process.
- `GK-INV-009`: Preserved by documenting production deployment as blocked until explicit owner approval in a deployment runbook.
- `GK-INV-010`: Preserved by keeping all documentation, comments, tests, reports, and user-facing copy English-only.

## Sensitive-Data Handling

All tests and examples must use synthetic IDs, commands, paths, environment names, and payloads. Structured logs, exports, reports, and Telegram renderers must summarize sensitive values and redact secret-like keys or values. No real Telegram token, database URL, production credential, raw production log, customer data, or live server output may be committed.

## Contract/Schema Impact

Domain type additions are expected for idempotency records, rate-limit decisions, confirmation requests, admin command outcomes, export manifests, structured log entries, deployment readiness summaries, and smoke-test results. Database migrations are out of scope unless a narrow in-repo persistence contract is already required by the existing domain layer; in-memory/domain-only hardening support is acceptable for this goal.

## Replay/Determinism Impact

Idempotency and confirmation checks must be deterministic for the same action key, actor, scope, timestamp, and stored decision state. Rate-limit checks must use an injected clock or explicit timestamp. Export manifest and smoke-test summary generation must be deterministic for the same inputs. Duplicate callbacks and duplicate task actions must not create duplicate side effects.

## Scope

- Add pure domain hardening services for idempotency, rate limiting, confirmation gates, admin command decisions, structured log redaction, backup/export manifest generation, deployment readiness summaries, and smoke-test summaries.
- Add Telegram command parsing/rendering for admin, backup/export, smoke-test, and deployment-readiness flows.
- Add deployment configuration and runbook documentation that can be validated locally without production rollout.
- Add a local smoke-test script for the health endpoint and documented deployment-readiness checks.
- Add focused tests for duplicate callback/action handling, rate-limit decisions, destructive command confirmation, export manifest creation, structured log redaction, deployment approval gating, and smoke-test summary behavior.
- Update implementation state and produce a validation report.

## Non-Goals

- No production deployment.
- No replacement of old RunLayer production service.
- No committed secrets, production data, or live credential examples.
- No dashboard-first admin interface.
- No real destructive command execution in tests.
- No broad persistence migration unless required by the existing contracts.
- No weakening of IPS, validation, or approval requirements.

## Files To Inspect

- `src/domain/types.ts`
- `src/domain/executors.ts`
- `src/domain/overnight.ts`
- `src/domain/validation.ts`
- `src/domain/*test.ts`
- `src/modules/telegram/commands.ts`
- `src/modules/telegram/renderers.ts`
- `src/modules/telegram/*test.ts`
- `src/config/env.ts`
- `src/app.ts`
- `scripts/`
- `.env.example`
- `README.md`

## Files To Create

- `src/domain/hardening.ts`
- `src/domain/hardening.test.ts`
- `scripts/smoke_test.sh`
- `docs/DEPLOYMENT_RUNBOOK.md`
- `implementation-goals/GOAL-10-hardening-deployment.context-package.md`
- `implementation-goals/GOAL-10-hardening-deployment.coding-prompt.md`
- `implementation-goals/GOAL-10-hardening-deployment.validation-report.md`

## Files To Modify

- `src/modules/telegram/commands.ts`
- `src/modules/telegram/commands.test.ts`
- `src/modules/telegram/renderers.ts`
- `src/modules/telegram/renderers.test.ts`
- `README.md`
- `.env.example`
- `docs/IMPLEMENTATION_STATE.md`
- `package.json` only if adding a smoke-test script entry is useful

## Files That Must Not Be Modified

- `.env` or any secret-bearing local file
- Production server files outside this repository
- Intent Preservation System reference repository files
- Legacy RunLayer deployment on `alfares`
- `package-lock.json` unless a dependency change is explicitly required

## Implementation Steps

1. Inspect the existing domain and Telegram patterns from Goals 07-09.
2. Implement a pure `hardening` domain module for idempotency, rate limits, confirmation gates, admin outcomes, structured log redaction, export manifests, deployment readiness, and smoke-test summaries.
3. Add Telegram command parsing and renderers for hardening status, admin confirmation, backup/export, smoke-test, and deployment-readiness summaries.
4. Add a local smoke-test script and deployment runbook with rollback notes and explicit owner approval before production deployment.
5. Add tests covering duplicate handling, rate limits, destructive confirmation, redaction, export manifest, deployment approval gate, smoke-test summaries, and Telegram command/rendering behavior.
6. Run validation commands and IPS gates.
7. Update the Goal 10 validation report and implementation state.
8. Commit all Goal 10 changes and verify a clean working tree.

## Test Plan

- Domain tests for idempotent repeated actions and duplicate callback/task behavior.
- Domain tests for rate-limit allow/block decisions using explicit timestamps.
- Domain tests that destructive or deployment actions require confirmation and owner approval.
- Domain tests for backup/export manifest creation and structured log redaction.
- Domain tests for deployment readiness and smoke-test summary outcomes.
- Telegram command tests for admin, backup/export, smoke-test, and deployment-readiness commands.
- Telegram renderer tests proving summaries are concise and do not expose secret values.

## Validation Plan

Run:

```bash
npm test
npm run typecheck
npm run lint
npm run build
git diff --check
python3 scripts/strict_doc_audit.py --format markdown --fail-on-issues
python3 scripts/pre_coding_gate.py --root . --goal implementation-goals/GOAL-10-hardening-deployment.md
python3 scripts/deployment_readiness_gate.py --root .
```

If a local app is started for smoke testing, run `scripts/smoke_test.sh http://127.0.0.1:<port>` and record the evidence. Do not target production without explicit owner approval.

## Gate Commands

```bash
python3 scripts/strict_doc_audit.py --format markdown --fail-on-issues
python3 scripts/pre_coding_gate.py --root . --goal implementation-goals/GOAL-10-hardening-deployment.md
python3 scripts/deployment_readiness_gate.py --root .
```

## Documentation Updates

- Add Goal 10 context package, coding prompt, and validation report.
- Add `docs/DEPLOYMENT_RUNBOOK.md` with local validation, rollout, rollback, and owner approval requirements.
- Update `README.md` and `.env.example` with hardening, export, and deployment-readiness notes if needed.
- Update `docs/IMPLEMENTATION_STATE.md` with compressed state, evidence, blockers, and next action.

## Rollback Plan

Revert the Goal 10 commit to remove the hardening domain module, Telegram hardening commands/renderers, smoke-test script, runbook, tests, and process artifacts. No production deployment or external server change is part of this goal.

## Agent Handoff Prompt

Implement Goal 10 on `feature/gk-goal-10-hardening-deployment`. Preserve Telegram-first control, IPS fail-closed behavior, explicit confirmation for destructive/deployment actions, structured audit evidence, secret redaction, deterministic idempotency/rate-limit behavior, backup/export support, smoke-test evidence, and deployment documentation. Do not deploy to production or touch the legacy RunLayer service. Stay within the files listed in this plan, run the validation commands, and document deviations.

## Completion Checklist

- [x] Implementation complete
- [x] Tests complete
- [x] Validation evidence collected
- [x] Documentation updated
- [x] Deviations documented
