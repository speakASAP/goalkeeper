# GoalKeeper Deployment Runbook

```yaml
id: GK-DEPLOYMENT-RUNBOOK
status: approved
owner: orchestrator
created: 2026-06-12
last_updated: 2026-06-12
completeness_level: complete
upstream:
  - docs/IMPLEMENTATION_SPEC.md
  - docs/IPS_INTEGRATION.md
  - docs/process/OPERATIONAL_GATES.md
  - implementation-goals/GOAL-10-hardening-deployment.md
downstream:
  - implementation-goals/GOAL-10-hardening-deployment.validation-report.md
related_adrs: []
```

## Purpose

This runbook defines the safe path from a validated local GoalKeeper build to a production rollout. It does not grant production approval by itself. Production deployment requires explicit owner approval after validation evidence, smoke-test evidence, and rollback notes are reviewed.

## Production Boundary

- Target server alias: `alfares`.
- GoalKeeper must not replace the legacy RunLayer service without explicit owner approval.
- GoalKeeper must not deploy to production from an ordinary implementation session.
- Deployment commands must run only after a deployment-readiness report is complete and the owner approves production rollout in the current session.
- Secrets must be configured through the target runtime environment, not committed to Git.

## Required Evidence Before Approval

Run from the repository root:

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

For local runtime smoke testing:

```bash
npm run build
npm start
scripts/smoke_test.sh http://127.0.0.1:3000
```

If another port is used, pass the actual base URL to `scripts/smoke_test.sh`.

## Local Configuration Checklist

- `NODE_ENV` is set for the target runtime.
- `HOST` and `PORT` match the runtime ingress.
- `LOG_LEVEL` is appropriate for production operations.
- `TELEGRAM_BOT_TOKEN` is configured as a secret value.
- `TELEGRAM_WEBHOOK_SECRET` is configured if Telegram webhook validation is enabled.
- `TELEGRAM_ALLOWED_USER_IDS` contains only approved owner/admin Telegram IDs.
- Database, queue, or executor credentials added in later goals must be provided through runtime secrets only.

## Rollout Procedure

1. Verify the working tree is clean on the deployment candidate commit.
2. Run all required evidence commands.
3. Start the app locally or in staging and run `scripts/smoke_test.sh <base-url>`.
4. Prepare a deployment-readiness summary with validation evidence, smoke-test evidence, and this rollback plan reference.
5. Ask the owner for explicit production deployment approval.
6. Only after approval, deploy the approved commit with the selected production mechanism.
7. Run `scripts/smoke_test.sh <production-base-url>` after rollout.
8. Report the deployed commit, smoke-test result, and any follow-up risks to Telegram.

## Rollback

Rollback must be available before rollout starts:

- Keep the previous production image, process definition, or release artifact available.
- Record the current production commit or image tag before deployment.
- If the post-deploy smoke test fails, restore the previous release and rerun the smoke test.
- If Telegram webhook handling fails, disable the new webhook or route traffic back to the previous service before further changes.
- Record rollback commands and results as execution evidence.

## Smoke Test Contract

The smoke test is intentionally narrow for the MVP. It verifies:

- `/health` is reachable.
- HTTP status is `200`.
- JSON field `service` is `goalkeeper`.
- JSON field `status` is `ok`.

Passing this smoke test is necessary but not sufficient for production approval. Full approval still requires validation commands, IPS gates, rollback notes, and owner approval.

## Forbidden During Goal 10

- Do not run production deployment commands.
- Do not replace the old RunLayer service.
- Do not commit `.env` or any real secret value.
- Do not use production data in tests, prompts, logs, screenshots, reports, or export examples.
