# GoalKeeper Production Post-Deploy Smoke Verification

```yaml
id: GK-PRODUCTION-POST-DEPLOY-SMOKE-2026-06-12
status: blocked
owner: orchestrator
created: 2026-06-12
last_updated: 2026-06-12
completeness_level: partial
upstream:
  - docs/DEPLOYMENT_RUNBOOK.md
  - docs/IMPLEMENTATION_STATE.md
  - reports/validation/production-deployment-approval-2026-06-12.md
downstream:
  - docs/IMPLEMENTATION_STATE.md
related_adrs: []
```

## Verification Scope

Verify the owner-reported GoalKeeper production deployment by discovering the production base URL and running the documented post-deploy smoke contract against `/health`.

## Expected Contract

The production smoke check must pass only when:

- `/health` is reachable.
- HTTP status is `200`.
- JSON field `service` is `goalkeeper`.
- JSON field `status` is `ok`.

## Evidence Collected

Commands run on 2026-06-12:

```text
ssh alfares 'cd /home/ssf/Documents/Github/goalkeeper && pwd && git status --short --branch && git log --oneline -n 5'
```

Result:

```text
bash: line 1: cd: /home/ssf/Documents/Github/goalkeeper: No such file or directory
```

```text
ssh alfares 'ls -la /home/ssf/Documents/Github'
```

Result:

```text
No `goalkeeper` repository directory was present under /home/ssf/Documents/Github.
```

```text
ssh alfares 'ps -axo pid,command | grep -i goalkeeper | grep -v grep'
```

Result:

```text
No process with `goalkeeper` in the command was found.
```

```text
curl -s --max-time 10 https://goalkeeper.alfares.cz/health
```

Result:

```text
404 page not found
```

```text
curl -s --max-time 10 https://runlayer.alfares.cz/health
```

Result:

```json
{"status":"ok","service":"runlayer","ts":"2026-06-12T14:22:42.862Z"}
```

```text
scripts/smoke_test.sh https://runlayer.alfares.cz
```

Result:

```json
{
  "status": "failed",
  "url": "https://runlayer.alfares.cz/health",
  "error": "fetch failed"
}
```

The direct `curl` result is enough to rule out `https://runlayer.alfares.cz` as a passing GoalKeeper production smoke target because it reports `service: runlayer`, not `service: goalkeeper`.

## Gate Evidence

- No production deployment command was run.
- No destructive command was run.
- No production file was changed.
- No secret, environment value, or production data was recorded.

## Invariant Evidence

- `GK-INV-001`: Preserved. Verification did not introduce a dashboard-first workflow.
- `GK-INV-002`: Preserved. This report extends the Goal 10 deployment evidence chain.
- `GK-INV-003`: Preserved. The report records actual read-only commands and observed responses.
- `GK-INV-004`: Preserved. The remaining blocker is a true deployment evidence blocker: the production base URL is not recorded.
- `GK-INV-007`: Preserved. No secrets or raw production data were captured.
- `GK-INV-009`: Preserved. No additional production change was performed without explicit owner approval.
- `GK-INV-010`: Preserved. This report is English-only.

## Result

Post-deploy smoke verification is blocked. The repository still lacks a production base URL that returns GoalKeeper health output. The discovered candidates do not pass:

- `https://goalkeeper.alfares.cz/health`: returns `404 page not found`.
- `https://runlayer.alfares.cz/health`: returns `service: runlayer`.

## Next Action

Record the actual GoalKeeper production base URL, or update deployment/ingress so the approved GoalKeeper deployment is reachable at a known URL, then rerun:

```bash
scripts/smoke_test.sh <production-base-url>
```
