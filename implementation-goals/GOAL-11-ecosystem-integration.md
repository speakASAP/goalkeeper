# Goal 11: Ecosystem Integration And Kubernetes Onboarding

```yaml
id: GK-GOAL-11-ECOSYSTEM-INTEGRATION
status: approved
owner: project owner
created: 2026-06-12
last_updated: 2026-06-12
completeness_level: complete
upstream:
  - docs/IMPLEMENTATION_STATE.md
  - docs/DEPLOYMENT_RUNBOOK.md
  - docs/IMPLEMENTATION_SPEC.md
  - docs/IPS_INTEGRATION.md
  - /home/ssf/Documents/Github/shared/ECOSYSTEM_MAP.md
  - /home/ssf/Documents/Github/monitoring-microservice/AGENTS.md
downstream:
  - docs/ECOSYSTEM_INTEGRATION.md
  - k8s/
  - scripts/deploy.sh
related_adrs: []
```

## Outcome

Register GoalKeeper as a first-class Statex Kubernetes service with Vault-backed secrets, shared service configuration, deployment automation, and monitoring registration.

## Dependencies

- Completed Goal 10 hardening and deployment readiness.
- Existing `statex-apps` Kubernetes namespace.
- Existing shared services: auth, notifications, database-server PostgreSQL/Redis, docs-rag, logging, and monitoring.
- Existing Vault `ClusterSecretStore` named `vault-backend`.

## IPS Intent

This goal preserves the Telegram-first GoalKeeper product while moving the runtime into the existing ecosystem. It must not turn GoalKeeper into a dashboard-first product, bypass IPS gates, expose secrets, or replace RunLayer traffic without explicit approval.

## Allowed Changes

- Add Dockerfile, Kubernetes manifests, and deployment script.
- Add runtime configuration for shared ecosystem service URLs.
- Add a configuration-only integration health endpoint.
- Add documentation and validation evidence.
- Register GoalKeeper in monitoring and shared ecosystem service maps.

## Forbidden Changes

- Do not commit real tokens, passwords, JWTs, or Vault root material.
- Do not invent Vault secret values.
- Do not remove RunLayer or redirect RunLayer traffic.
- Do not deploy if Vault secret sync is not ready.
- Do not bypass owner approval for production deployment if the deployment command is not explicitly requested.

## Acceptance Criteria

- GoalKeeper has Kubernetes manifests for ConfigMap, ExternalSecret, Deployment, Service, and Ingress.
- GoalKeeper uses Vault-backed ExternalSecret path `secret/prod/goalkeeper`.
- GoalKeeper is configured for auth, notifications, database-server, docs-rag, logging, and monitoring service URLs.
- GoalKeeper exposes `/health` and `/health/integrations`.
- Deployment script validates required shared services and Vault secret readiness.
- Monitoring registry and Prometheus blackbox targets include GoalKeeper.
- Documentation explains onboarding and remaining secret requirements without exposing secrets.

## Validation Commands

```bash
npm test
npm run typecheck
npm run build
python3 scripts/strict_doc_audit.py --format markdown --fail-on-issues
python3 scripts/pre_coding_gate.py --root . --goal implementation-goals/GOAL-11-ecosystem-integration.md
python3 scripts/deployment_readiness_gate.py --root .
kubectl get deploy,svc,ingress,externalsecret -n statex-apps | grep goalkeeper
```

## Final Report

The final report must include an Intent Compliance Report, changed files, validation evidence, production deployment status, blockers, and next command.
