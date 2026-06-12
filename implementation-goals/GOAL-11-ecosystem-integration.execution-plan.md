# Execution Plan: Goal 11 Ecosystem Integration And Kubernetes Onboarding

```yaml
id: GK-GOAL-11-EXECUTION-PLAN
status: approved
owner: project owner
created: 2026-06-12
last_updated: 2026-06-12
completeness_level: complete
upstream:
  - implementation-goals/GOAL-11-ecosystem-integration.md
  - docs/DEPLOYMENT_RUNBOOK.md
  - docs/IPS_INTEGRATION.md
  - docs/governance/PROJECT_INVARIANTS.md
downstream:
  - Dockerfile
  - k8s/configmap.yaml
  - k8s/external-secret.yaml
  - k8s/deployment.yaml
  - k8s/service.yaml
  - k8s/ingress.yaml
  - scripts/deploy.sh
  - docs/ECOSYSTEM_INTEGRATION.md
related_adrs: []
```

## Upstream Traceability

The owner requested GoalKeeper to join the existing Kubernetes microservice ecosystem, use shared auth, notifications, database-server, docs-rag, Kubernetes Vault, and monitoring. This maps to the GoalKeeper deployment and executor-control-plane requirements in `docs/IMPLEMENTATION_SPEC.md` and the IPS deployment gates in `docs/IPS_INTEGRATION.md`.

## Goal Impact

GoalKeeper becomes deployable and observable as an ecosystem service while preserving the MVP boundary: Telegram remains primary, IPS remains fail-closed, and production secrets remain in Vault.

## Project Invariants

- `GK-INV-001`: Preserved. Deployment does not introduce dashboard-first workflows.
- `GK-INV-002`: Preserved. Goal 11 has traceability and execution artifacts.
- `GK-INV-003`: Preserved. Executor host mounts are explicit and auditable.
- `GK-INV-004`: Preserved. Blockers are limited to missing secret/deployment facts.
- `GK-INV-005`: Preserved. GoalKeeper remains a modular monolith.
- `GK-INV-006`: Preserved. No execution-critical missing markers are introduced.
- `GK-INV-007`: Preserved. No real secrets are committed.
- `GK-INV-009`: Preserved. Deployment script exists; live rollout must pass Vault readiness.
- `GK-INV-010`: Preserved. Artifacts are English-only.

## Sensitive-Data Handling

Secrets are referenced only by key names and Vault paths. Real token, password, and bot values are not stored in documentation, tests, manifests, logs, or reports.

## Contract/Schema Impact

Adds HTTP endpoint `GET /health/integrations`. No database schema changes are made in this goal.

## Replay/Determinism Impact

Deployment is deterministic for a given Git commit and image tag. The script tags images by commit SHA by default and checks rollout health.

## Scope

- Runtime configuration parsing for ecosystem URLs.
- Configuration-only integration health route.
- Dockerfile and Kubernetes manifests.
- Deployment script with preflight, Vault readiness, rollout, and smoke checks.
- Documentation and monitoring/shared registration patches.

## Non-Goals

- Implementing full database repositories.
- Implementing notification sending workflows.
- Implementing Auth login UI inside GoalKeeper.
- Writing Vault secret values.
- Replacing RunLayer production traffic.

## Files To Inspect

- `src/app.ts`
- `src/config/env.ts`
- `scripts/smoke_test.sh`
- `docs/DEPLOYMENT_RUNBOOK.md`
- `/home/ssf/Documents/Github/shared/ECOSYSTEM_MAP.md`
- `/home/ssf/Documents/Github/monitoring-microservice/src/config/ecosystem-services.ts`
- `/home/ssf/Documents/Github/monitoring-microservice/k8s/prometheus/configmap-config.yaml`

## Files To Create

- `Dockerfile`
- `k8s/configmap.yaml`
- `k8s/external-secret.yaml`
- `k8s/deployment.yaml`
- `k8s/service.yaml`
- `k8s/ingress.yaml`
- `scripts/deploy.sh`
- `docs/ECOSYSTEM_INTEGRATION.md`
- `src/modules/ecosystem/routes.ts`
- `src/modules/ecosystem/routes.test.ts`

## Files To Modify

- `.env.example`
- `README.md`
- `src/app.ts`
- `src/config/env.ts`
- `docs/IMPLEMENTATION_STATE.md`
- `/home/ssf/Documents/Github/shared/ECOSYSTEM_MAP.md`
- `/home/ssf/Documents/Github/monitoring-microservice/src/config/ecosystem-services.ts`
- `/home/ssf/Documents/Github/monitoring-microservice/k8s/prometheus/configmap-config.yaml`

## Files That Must Not Be Modified

- Real `.env` files.
- Vault init files or unseal material.
- RunLayer ingress/manifests.
- Auth, notifications, docs-rag, database-server source code.

## Implementation Steps

1. Add ecosystem config parsing without storing secrets.
2. Add `/health/integrations` route and tests.
3. Add Dockerfile and Kubernetes manifests following existing Statex conventions.
4. Add deployment script with preflight and rollout checks.
5. Add onboarding documentation and validation report.
6. Register GoalKeeper in monitoring and shared ecosystem maps.
7. Run validation commands and update state.

## Test Plan

Run unit tests, TypeScript typecheck, build, documentation gates, and Kubernetes manifest dry checks where available.

## Validation Plan

Validation must include application tests, IPS gates, Kubernetes resource discovery, and documentation of any deployment blockers.

## Gate Commands

```bash
npm test
npm run typecheck
npm run build
python3 scripts/strict_doc_audit.py --format markdown --fail-on-issues
python3 scripts/pre_coding_gate.py --root . --goal implementation-goals/GOAL-11-ecosystem-integration.md
python3 scripts/deployment_readiness_gate.py --root .
```

## Documentation Updates

Add `docs/ECOSYSTEM_INTEGRATION.md` and update `docs/IMPLEMENTATION_STATE.md` with validation evidence and next action.

## Rollback Plan

If deployment fails, remove only GoalKeeper Kubernetes resources with `kubectl delete -f k8s/` after confirming no live traffic depends on them. Do not alter shared services or RunLayer during rollback.

## Agent Handoff Prompt

Implement only the Goal 11 deployment/onboarding scope. Do not add secret values, do not replace RunLayer, and do not weaken IPS gates.

## Completion Checklist

- [x] Execution plan exists.
- [x] Context package exists.
- [x] Coding prompt exists.
- [ ] Validation report updated with command evidence.
- [ ] GoalKeeper changes committed.
- [ ] Monitoring/shared registration changes committed or reported.
