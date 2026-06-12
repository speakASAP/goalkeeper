# GoalKeeper Project Invariants

```yaml
id: GK-PROJECT-INVARIANTS
status: approved
owner: project owner
created: 2026-06-11
last_updated: 2026-06-11
completeness_level: complete
upstream:
  - README.md
  - docs/PRODUCT_BRIEF.md
  - docs/IMPLEMENTATION_SPEC.md
  - docs/IPS_INTEGRATION.md
downstream:
  - implementation-goals/README.md
  - docs/IMPLEMENTATION_ORCHESTRATOR.md
related_adrs: []
```

## Purpose

These invariants are non-negotiable rules for GoalKeeper implementation. Every goal, execution plan, worker prompt, validation report, and deployment-readiness check must preserve them.

## Invariants

| ID | Level | Source | Rule | Forbidden outcome | Validation method | Gate applicability | Owner |
|---|---|---|---|---|---|---|---|
| GK-INV-001 | product | `README.md`, `docs/PRODUCT_BRIEF.md` | Telegram is the primary control plane for MVP. | Dashboard-first rebuild or workflow requiring dashboard operation. | Goal scope review and final report boundary check. | Pre-coding, deployment-readiness | Project owner |
| GK-INV-002 | operational | `docs/IPS_INTEGRATION.md` | Coding tasks must preserve the intent chain from raw request through validation. | Executor starts from a vague task title or plan summary without traceability. | Pre-coding gate and Intent Compliance Report. | Pre-coding, integration-readiness, deployment-readiness | Orchestrator |
| GK-INV-003 | operational | `docs/AGENT_ORCHESTRATION.md` | Executors must run through explicit adapters and produce execution evidence. | Fake autonomous execution, simulated worker results, or untracked CLI/MCP activity. | Execution record review and validation report. | Pre-coding, deployment-readiness | Orchestrator |
| GK-INV-004 | product | `docs/IMPLEMENTATION_SPEC.md` | Owner questions are only for true blockers, scope decisions, or intent decisions. | Routine implementation details pushed back to the owner. | Session report blocker review. | Pre-coding, deployment-readiness | Orchestrator |
| GK-INV-005 | architecture | `docs/SYSTEM_ARCHITECTURE.md` | MVP remains a modular monolith unless a later approved decision changes it. | Premature microservice split or external platform dependency without approval. | Architecture review in execution plan. | Pre-coding, integration-readiness | Orchestrator |
| GK-INV-006 | operational | `docs/IPS_INTEGRATION.md` | Missing execution-critical documentation must fail closed. | `[MISSING: ...]` markers ignored in execution plans, coding prompts, or validation criteria. | Strict document audit and pre-coding gate. | Pre-coding, deployment-readiness | Orchestrator |
| GK-INV-007 | security | `docs/IPS_INTEGRATION.md` | Prompts, tests, examples, logs, screenshots, and reports must not contain secrets or raw production data. | Secret or raw production sample copied into an AI prompt or artifact. | Sensitive-data review in execution plan and validation report. | Pre-coding, deployment-readiness | Orchestrator |
| GK-INV-008 | operational | `docs/AUTONOMOUS_DEVELOPMENT.md` | Self-improvement must use the same IPS-gated workflow as external project work. | GoalKeeper modifies itself through an ungated shortcut. | Self-improvement execution plan and validation report. | Pre-coding, deployment-readiness | Orchestrator |
| GK-INV-009 | release | `docs/IMPLEMENTATION_STATE.md` | Production deployment requires explicit owner approval. | Deployment to production as part of ordinary implementation. | Deployment-readiness report and owner checkpoint. | Deployment-readiness | Project owner |
| GK-INV-010 | documentation | `README.md`, `docs/IMPLEMENTATION_SPEC.md`, `docs/TELEGRAM_INTERFACE.md` | All project documentation, implementation artifacts, prompts, reports, examples, Telegram copy, comments, and user-facing text must be maintained in English only. | Russian, Czech, or any other non-English project text added to repository artifacts or UI copy. | Strict documentation audit and final report language review. | Pre-coding, integration-readiness, deployment-readiness | Orchestrator |

## Usage

Every execution plan must list the applicable invariant IDs and explain how the implementation preserves them. If an invariant is not applicable, the plan must say why.

Every final session report must include invariant evidence in the `Intent Compliance Report`. A goal cannot be marked `done` while an applicable invariant has no validation evidence.
