# PROMPT-GK-10: Hardening And Deployment Readiness Coding Prompt

```yaml
id: PROMPT-GK-10
status: approved
source_execution_plan: implementation-goals/GOAL-10-hardening-deployment.execution-plan.md
source_context_package: implementation-goals/GOAL-10-hardening-deployment.context-package.md
owner: orchestrator
created: 2026-06-12
last_updated: 2026-06-12
completeness_level: complete
```

## Task Summary

Implement Goal 10 hardening for idempotency, rate limits, destructive-action confirmation, structured log redaction, backup/export manifests, admin/readiness Telegram commands, local smoke testing, and deployment documentation. Do not deploy to production.

## Execution Plan Link

`implementation-goals/GOAL-10-hardening-deployment.execution-plan.md`

## Context Package Link

`implementation-goals/GOAL-10-hardening-deployment.context-package.md`

## Allowed Changes

- `src/domain/hardening.ts`
- `src/domain/hardening.test.ts`
- `src/modules/telegram/commands.ts`
- `src/modules/telegram/commands.test.ts`
- `src/modules/telegram/renderers.ts`
- `src/modules/telegram/renderers.test.ts`
- `scripts/smoke_test.sh`
- `docs/DEPLOYMENT_RUNBOOK.md`
- `README.md`
- `.env.example`
- Goal 10 implementation artifacts and implementation state documentation

## Forbidden Changes

- Do not deploy to production.
- Do not mutate `alfares` or replace legacy RunLayer.
- Do not commit secrets, real credentials, raw production logs, or customer data.
- Do not weaken IPS, validation, executor, approval, or deployment-readiness gates.
- Do not introduce a dashboard-first admin workflow.
- Do not run real destructive commands from tests or command handlers.

## Implementation Instructions

Follow existing TypeScript domain patterns and keep hardening logic pure and deterministic. Use explicit timestamps for replayable idempotency and rate-limit decisions. Return confirmation-required decisions for destructive, admin, and deployment actions. Redact secret-like keys and values before logs, exports, or Telegram summaries. Keep Telegram output compact and owner-oriented. Add local smoke-test support and deployment runbook steps that make production rollout require explicit owner approval.

## Acceptance Criteria

- Duplicate callbacks/tasks do not create duplicate side effects.
- Destructive commands require confirmation.
- Audit trail is complete enough to reconstruct a goal journey.
- Backup/export command exists.
- Deployment configuration is documented and tested locally.
- Smoke test exists.
- Production deployment requires explicit approval and includes rollback notes.

## Validation Commands

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

## Expected Output

Return an Intent Compliance Report with changed files, validation evidence, hardening behavior, backup/export behavior, deployment readiness status, production approval boundary, risks, and next action. Update `docs/IMPLEMENTATION_STATE.md` before committing.
