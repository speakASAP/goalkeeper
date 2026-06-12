# GoalKeeper Production Deployment Approval Packet

```yaml
id: GK-PRODUCTION-DEPLOYMENT-APPROVAL-2026-06-12
status: post_deploy_smoke_blocked
owner: project owner
prepared_by: orchestrator
created: 2026-06-12
last_updated: 2026-06-12
completeness_level: complete
upstream:
  - docs/DEPLOYMENT_RUNBOOK.md
  - docs/IMPLEMENTATION_STATE.md
  - docs/IMPLEMENTATION_SPEC.md
  - docs/IPS_INTEGRATION.md
  - implementation-goals/GOAL-10-hardening-deployment.md
  - implementation-goals/GOAL-10-hardening-deployment.validation-report.md
downstream:
  - docs/IMPLEMENTATION_STATE.md
related_adrs: []
```

## Decision Requested

Approve or reject production rollout of GoalKeeper candidate commit:

```text
582d1bd2b04f08e4d33f96ebd84fb978af849cc0
```

Short commit:

```text
582d1bd
```

Branch:

```text
feature/gk-goal-10-hardening-deployment
```

Production deployment was approved and performed outside this artifact, then reported by the owner in the deployment session.

## Deployment Boundary

- Target server alias: `alfares`.
- Legacy RunLayer replacement is forbidden unless explicitly approved with rollback readiness.
- Secrets must be configured through runtime environment variables, not committed to Git.
- Telegram remains the primary MVP control plane.
- Production deployment, destructive actions, and admin actions require explicit owner approval.

## Fresh Validation Evidence

Prepared on 2026-06-12 at 08:30 CEST from the repository root.

```text
npm run typecheck: passed
npm run lint: passed
npm test: passed, 94 tests
npm run build: passed
git diff --check: passed
python3 scripts/strict_doc_audit.py --format markdown --fail-on-issues: passed
python3 scripts/pre_coding_gate.py --root . --goal implementation-goals/GOAL-10-hardening-deployment.md: passed
python3 scripts/deployment_readiness_gate.py --root .: passed
npm run smoke -- http://127.0.0.1:3301: passed
```

Smoke-test result:

```json
{
  "status": "passed",
  "url": "http://127.0.0.1:3301/health",
  "httpStatus": 200,
  "service": "goalkeeper",
  "healthStatus": "ok"
}
```

The first sandbox-local smoke request could not reach the elevated temporary local server and failed with `fetch failed`. The smoke command was rerun in the same elevated local network context as the server and passed. The temporary local server was stopped after validation.

## Goal Completion Evidence

All implementation goals are marked complete in `docs/IMPLEMENTATION_STATE.md`:

- Goal 01 Foundation
- Goal 02 Domain Persistence
- Goal 03 Telegram Control Plane MVP
- Goal 04 Intent Capture Approval And Memory
- Goal 05 Planning And Task Creation
- Goal 06 IPS Gates Context Packages And Coding Prompts
- Goal 07 Executor Orchestration Worker Loop And Routing
- Goal 08 Validation Retry And Completion Reports
- Goal 09 Overnight Self-Improvement
- Goal 10 Hardening Deployment

Goal 10 validation report status is `approved` and records no failed criteria.

## Intent Compliance

- `GK-INV-001`: Preserved. The MVP remains Telegram-first.
- `GK-INV-002`: Preserved. Goal 10 has execution plan, context package, coding prompt, validation report, and gate evidence.
- `GK-INV-003`: Preserved. Executor and hardening behavior records deterministic evidence instead of simulated work.
- `GK-INV-004`: Preserved. Owner approval is requested only for the true production deployment boundary.
- `GK-INV-006`: Preserved. Strict documentation audit and pre-coding gate passed.
- `GK-INV-007`: Preserved. No secrets or raw production data were added to the approval packet.
- `GK-INV-009`: Preserved. Production deployment remains blocked until owner approval.
- `GK-INV-010`: Preserved. Approval packet is English-only.

## Required Production Configuration

Before rollout, verify production runtime configuration:

- `NODE_ENV` is set for production.
- `HOST` and `PORT` match the selected ingress or process manager.
- `LOG_LEVEL` is appropriate for production.
- `TELEGRAM_BOT_TOKEN` is configured as a secret.
- `TELEGRAM_WEBHOOK_SECRET` is configured if webhook validation is enabled.
- `TELEGRAM_ALLOWED_USER_IDS` contains only approved owner/admin Telegram IDs.
- Any database, queue, executor, or external-service credentials are configured only as runtime secrets.

## Rollout Checklist

1. Record the current production release, image tag, process definition, or commit before changing anything.
2. Confirm the approved candidate commit is `582d1bd2b04f08e4d33f96ebd84fb978af849cc0`.
3. Configure runtime secrets on `alfares`.
4. Deploy using the selected production mechanism from `docs/DEPLOYMENT_RUNBOOK.md`.
5. Run `scripts/smoke_test.sh <production-base-url>` after rollout.
6. Confirm `/health` returns service `goalkeeper` and status `ok`.
7. Report deployed commit, smoke-test result, and any follow-up risk.

## Rollback Checklist

Rollback must be ready before rollout starts:

- Keep the previous production image, process definition, or release artifact available.
- Record the previous production commit or image tag.
- If post-deploy smoke test fails, restore the previous release and rerun smoke.
- If Telegram webhook handling fails, disable the new webhook or route traffic back to the previous service.
- Record rollback commands and results as execution evidence.

## Approval Options

Owner may approve with one of these explicit decisions:

```text
Approved: deploy GoalKeeper candidate 582d1bd2b04f08e4d33f96ebd84fb978af849cc0 to production on alfares.
```

or:

```text
Rejected: do not deploy GoalKeeper candidate 582d1bd2b04f08e4d33f96ebd84fb978af849cc0 to production.
```

or:

```text
Blocked: resolve the following production readiness issue before deployment: <issue>.
```

## Post-Deployment Owner Report

On 2026-06-12, the owner reported:

```text
Deployed. Seems it is everything is okay.
```

The production base URL was not recorded in the repository at the time of this update, so an independent post-deploy smoke test against production was not run from this session.

## Post-Deployment Verification Attempt

On 2026-06-12, a read-only verification attempt was recorded in:

```text
reports/validation/production-deployment-smoke-2026-06-12.md
```

Result:

```text
blocked
```

The expected remote repository path `/home/ssf/Documents/Github/goalkeeper` did not exist on `alfares`, no process containing `goalkeeper` in its command was found, `https://goalkeeper.alfares.cz/health` returned `404 page not found`, and `https://runlayer.alfares.cz/health` returned `service: runlayer`. The independent GoalKeeper post-deploy smoke check remains blocked until the actual production base URL is recorded or the GoalKeeper deployment is exposed at a known URL.

Recommended follow-up evidence:

```bash
scripts/smoke_test.sh <production-base-url>
```

Expected result:

```json
{
  "status": "passed",
  "httpStatus": 200,
  "service": "goalkeeper",
  "healthStatus": "ok"
}
```

## Recommendation

GoalKeeper has owner-reported production deployment success. Record the production base URL and run the post-deploy smoke test to close the deployment evidence loop.
