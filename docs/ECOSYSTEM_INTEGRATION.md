# GoalKeeper Ecosystem Integration

```yaml
id: GK-ECOSYSTEM-INTEGRATION
status: approved
owner: project owner
created: 2026-06-12
last_updated: 2026-06-12
completeness_level: complete
upstream:
  - implementation-goals/GOAL-11-ecosystem-integration.md
  - docs/IMPLEMENTATION_SPEC.md
  - docs/IPS_INTEGRATION.md
  - /home/ssf/Documents/Github/shared/ECOSYSTEM_MAP.md
downstream:
  - k8s/
  - scripts/deploy.sh
related_adrs: []
```

## Purpose

This document records how GoalKeeper is onboarded into the Alfares/Statex microservice ecosystem.

## Runtime Identity

| Field | Value |
| --- | --- |
| Service name | `goalkeeper` |
| Namespace | `statex-apps` |
| Internal URL | `http://goalkeeper.statex-apps.svc.cluster.local:3392` |
| Public URL | `https://goalkeeper.alfares.cz` |
| Health | `GET /health` |
| Integration health | `GET /health/integrations` |
| Category | orchestration |

## Shared Services

| Service | Purpose | Internal target |
| --- | --- | --- |
| `auth-microservice` | Login, JWT validation, hosted auth flows, RBAC authority | `http://auth-microservice.statex-apps.svc.cluster.local:3370` |
| `notifications-microservice` | Telegram/email/WhatsApp delivery and escalation channel | `http://notifications-microservice.statex-apps.svc.cluster.local:3368` |
| `db-server-postgres` | Shared PostgreSQL runtime storage | `db-server-postgres:5432` |
| `db-server-redis` | Shared Redis queue/cache endpoint for future workers | `db-server-redis:6379` |
| `docs-rag-microservice` | Ecosystem documentation retrieval for agent context | `http://docs-rag-microservice.statex-apps.svc.cluster.local:3397` |
| `logging-microservice` | Structured log sink | `http://logging-microservice.statex-apps.svc.cluster.local:3367` |
| `monitoring-microservice` | Service registry and operational UI | `http://monitoring-microservice.statex-apps.svc.cluster.local:3395` |

## Vault Contract

GoalKeeper uses ExternalSecret `goalkeeper-secret`, backed by `ClusterSecretStore/vault-backend`, reading from:

```text
secret/prod/goalkeeper
```

Required properties:

```text
DB_PASSWORD
TELEGRAM_BOT_TOKEN
TELEGRAM_WEBHOOK_SECRET
TELEGRAM_ALLOWED_USER_IDS
JWT_TOKEN
INTERNAL_SERVICE_TOKEN
NOTIFICATIONS_SERVICE_TOKEN
```

Real values must be written to Vault only. They must not be committed to Git, copied into prompts, or printed in validation reports.

## Kubernetes Artifacts

| File | Purpose |
| --- | --- |
| `k8s/configmap.yaml` | Non-secret runtime configuration and shared service URLs |
| `k8s/external-secret.yaml` | Vault to Kubernetes Secret mapping |
| `k8s/deployment.yaml` | GoalKeeper pod, probes, resource limits, and controlled host mounts |
| `k8s/service.yaml` | ClusterIP service on port `3392` |
| `k8s/ingress.yaml` | Traefik ingress for `goalkeeper.alfares.cz` |
| `scripts/deploy.sh` | Build, push, apply manifests, wait for Vault secret, rollout, and smoke checks |

## Monitoring Registration

GoalKeeper must be listed in:

- `/home/ssf/Documents/Github/monitoring-microservice/src/config/ecosystem-services.ts`
- `/home/ssf/Documents/Github/monitoring-microservice/k8s/prometheus/configmap-config.yaml`
- `/home/ssf/Documents/Github/shared/ECOSYSTEM_MAP.md`

Prometheus blackbox target:

```text
http://goalkeeper:3392/health
```

## Deployment Command

From the remote repository only:

```bash
ssh alfares 'cd /home/ssf/Documents/Github/goalkeeper && ./scripts/deploy.sh'
```

The script fails if shared Kubernetes services are missing, `vault-backend` is unavailable, the GoalKeeper ExternalSecret is not ready, rollout fails, or public smoke test fails.

## Newcomer Checklist

1. Confirm repository has `AGENTS.md`, `README.md`, `BUSINESS.md` or equivalent product docs, `SYSTEM.md` or architecture docs, and task/state documentation.
2. Confirm service appears in `shared/ECOSYSTEM_MAP.md` with port, domain, category, and integration matrix entries.
3. Confirm Kubernetes manifests exist under service-owned `k8s/`.
4. Confirm secrets are declared through ExternalSecret and Vault path, not raw Kubernetes Secret manifests.
5. Confirm deployment script builds and pushes to `localhost:5000` and waits for rollout.
6. Confirm `/health` works internally and publicly after ingress.
7. Confirm monitoring registry and Prometheus blackbox config include the service.
8. Confirm production deployment and replacement of existing traffic are owner-approved.

## Current Deployment Status

GoalKeeper is ready for Kubernetes onboarding once the required Vault keys exist at `secret/prod/goalkeeper`. Production deployment should be executed through `scripts/deploy.sh` and then verified with `scripts/smoke_test.sh https://goalkeeper.alfares.cz`.
