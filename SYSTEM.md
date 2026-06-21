# System: goalkeeper

## Architecture

TypeScript Fastify modular monolith. Current runtime exposes a health endpoint and executor-routing foundation while the repository tracks implementation through `docs/IMPLEMENTATION_STATE.md`, `docs/IMPLEMENTATION_ORCHESTRATOR.md`, and `implementation-goals/`.

## Integrations

| Service | Usage |
| --- | --- |
| `database-server` | PostgreSQL and Redis backing services |
| `docs-rag-microservice` | Retrieval-first documentation context |
| `logging-microservice` | Structured logs |
| `monitoring-microservice` | Monitoring integration |
| `notifications-microservice` | Owner notifications |
| `vault` | Secret source at `secret/prod/goalkeeper` |
| `kubernetes` | Deployment target via `k8s/` and `scripts/deploy.sh` |

## Current State

Stage: implementation foundation with Kubernetes onboarding artifacts present.

## Known Issues

- [MISSING: repo-local STATE.json or equivalent compact status file]
