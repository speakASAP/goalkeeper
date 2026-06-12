# GOAL 10: Hardening, Admin Controls, Backup, And Deployment

## User Command

```text
GOALKEEPER ORCHESTRATOR: implement goal number 10
```

## Outcome

Harden the MVP for real use: idempotency, rate limits, structured logs, admin commands, backup/export, deployment configuration, production readiness gate, and documented rollout to `alfares`.

## Branch

```text
feature/gk-goal-10-hardening-deployment
```

## Dependencies

- Goal 09 done.

## IPS Intent

Deployment and production operations are high-risk. They require validation evidence and explicit owner approval before changing the live service.

## Required Subagents

- Worker A: idempotency, rate limits, admin commands.
- Worker B: structured logging, backup/export.
- Worker C: deployment scripts/config/docs.
- Validator: production readiness checklist and smoke tests.
- Merge agent: integrate all prior goal branches before deployment.

## Allowed Changes

- Reliability/security hardening.
- Admin Telegram commands.
- Backup/export commands.
- Docker/deploy config.
- Smoke tests.
- Production runbook.
- State updates.

## Forbidden Changes

- Do not deploy to production without explicit owner approval in the current session.
- Do not overwrite old RunLayer production service without a rollback plan.
- Do not commit secrets.

## IPS Preflight

Run all available gates before deployment work:

```bash
python3 scripts/strict_doc_audit.py --format markdown --fail-on-issues
python3 scripts/pre_coding_gate.py --root .
python3 scripts/deployment_readiness_gate.py --root .
```

If scripts are absent, record the fallback checklist and block actual deployment until owner approval.

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
```

Run deployment readiness checks if present.

## Final Report

Include hardening summary, deployment readiness, approval needed before production rollout, and final project status.
