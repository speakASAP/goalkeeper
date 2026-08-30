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

- No repository-defined repo-local STATE.json or equivalent compact status file

## Purpose
A server-side system that preserves owner intent through planning, execution, validation, and reporting across multiple executor adapters.

## Responsibilities
Provide the behavior and runtime described by the tracked project documentation.

## Non-Responsibilities
Do not add integrations, persistence, or product scope not declared by repository sources.

## Inputs
Inputs are the browser, runtime, and configuration inputs described in existing project sources.

## Outputs
Outputs are the user-visible or operational results described in existing project sources.

## Dependencies
TypeScript Fastify service at goalkeeper.alfares.cz with declared PostgreSQL, Redis, notifications, logging, docs-RAG, monitoring, and Vault-backed runtime integrations.

## Upstream Traceability
The approved business baseline and vision define this system’s intent.

## Downstream Artifacts
The integration contract and bootstrap chain record planning evidence.

## Validation Criteria
Run the IPS planning validator and applicable existing project checks.

## Open Questions
No new open question is asserted by this documentation-only adoption.
Status: reviewed
completeness_level: complete
