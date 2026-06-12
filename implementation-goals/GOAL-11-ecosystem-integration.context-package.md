# Context Package: Goal 11 Ecosystem Integration And Kubernetes Onboarding

```yaml
id: GK-GOAL-11-CONTEXT
status: approved
owner: project owner
created: 2026-06-12
last_updated: 2026-06-12
completeness_level: complete
upstream:
  - implementation-goals/GOAL-11-ecosystem-integration.execution-plan.md
downstream:
  - implementation-goals/GOAL-11-ecosystem-integration.coding-prompt.md
related_adrs: []
```

## Target Task

Create GoalKeeper Kubernetes onboarding, Vault-backed secret references, deployment automation, and ecosystem monitoring registration.

## Upstream Traceability

The task follows the owner request to integrate GoalKeeper into the Alfares/Statex microservice ecosystem and the GoalKeeper specification requiring PostgreSQL, Telegram control, executor orchestration, notifications, and IPS gates.

## Included Documents

- GoalKeeper `README.md`
- GoalKeeper `docs/IMPLEMENTATION_SPEC.md`
- GoalKeeper `docs/IPS_INTEGRATION.md`
- GoalKeeper `docs/DEPLOYMENT_RUNBOOK.md`
- GoalKeeper `docs/governance/PROJECT_INVARIANTS.md`
- Shared ecosystem `ECOSYSTEM_MAP.md`
- Monitoring service registry and Prometheus config
- Existing Kubernetes manifests from notifications, auth, docs-rag, database-server, monitoring, and RunLayer

## Excluded Documents

- Real environment files and secret stores.
- Vault init files and token material.
- Production data and logs.

## Constraints

- Use `statex-apps` namespace.
- Use Vault through ExternalSecret and `vault-backend` ClusterSecretStore.
- Use shared service DNS names inside Kubernetes.
- Keep GoalKeeper on a new port and domain without replacing RunLayer.
- Keep docs and user-facing text English-only.

## Allowed Changes

Deployment, configuration, monitoring registration, and documentation changes directly tied to Goal 11.

## Forbidden Changes

No secret values, no RunLayer traffic replacement, no dashboard-first workflows, no bypass of IPS gates.

## Agent Prompt

Implement the Goal 11 artifacts in the remote GoalKeeper repository and minimal ecosystem registry patches in monitoring/shared. Preserve the approved execution plan and report any production deployment blockers.

## Validation Instructions

Run the commands from the execution plan. If Kubernetes deployment is blocked by missing Vault values or cluster permissions, document the blocker and do not invent values.
