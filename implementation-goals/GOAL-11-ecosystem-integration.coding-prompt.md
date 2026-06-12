# Coding Prompt: Goal 11 Ecosystem Integration And Kubernetes Onboarding

```yaml
id: GK-GOAL-11-CODING-PROMPT
status: approved
owner: project owner
created: 2026-06-12
last_updated: 2026-06-12
completeness_level: complete
upstream:
  - implementation-goals/GOAL-11-ecosystem-integration.execution-plan.md
  - implementation-goals/GOAL-11-ecosystem-integration.context-package.md
downstream:
  - implementation-goals/GOAL-11-ecosystem-integration.validation-report.md
related_adrs: []
```

## Task Summary

Make GoalKeeper deployable and discoverable as a Statex Kubernetes service using shared auth, notifications, database-server, docs-rag, logging, monitoring, and Vault conventions.

## Execution Plan Link

`implementation-goals/GOAL-11-ecosystem-integration.execution-plan.md`

## Context Package Link

`implementation-goals/GOAL-11-ecosystem-integration.context-package.md`

## Allowed Changes

- Runtime config parsing.
- Integration health endpoint and tests.
- Dockerfile.
- K8s manifests.
- Deployment script.
- Ecosystem integration docs.
- Monitoring/shared registration patches.

## Forbidden Changes

- Secret values.
- RunLayer replacement.
- Unapproved production data access.
- IPS gate weakening.

## Implementation Instructions

Follow existing Statex Kubernetes patterns: image `localhost:5000/<service>:<tag>`, namespace `statex-apps`, Traefik ingress, ExternalSecret from Vault, `/health` probes, and Prometheus blackbox registration.

## Acceptance Criteria

Match the Goal 11 acceptance criteria exactly.

## Validation Commands

Use the command list in the execution plan and record results in the validation report.

## Expected Output

Changed files, validation report, deployment status, and a concise Intent Compliance Report.
