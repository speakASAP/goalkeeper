# GoalKeeper Documentation

Research date: 2026-06-11.

This repository describes a new service version to be implemented from scratch instead of the RunLayer service.

## Overview

GoalKeeper is a server-side system for managing all projects through goals while preserving the owner's original intent: why a goal was created, which constraints matter, which decisions the human made, what the agent understood, which tasks were derived from the goal, and why.

Beyond tracking, GoalKeeper must orchestrate task execution across different AI agents and tools: Codex, Claude Code, OpenCode, CLI commands, MCP tools, internal worker processes, and external services.

Target state: the owner can submit a task in Telegram and go to sleep while GoalKeeper develops projects, starts agents on the server, tracks progress, asks questions only for blockers, and delivers a morning report. The same system must be able to improve itself through the same safe workflow.

The main user interface for the new version is Telegram. A dashboard may exist later as a secondary audit interface, but not as the primary control surface.

## Files

- [AGENTS.md](AGENTS.md) - one-command continuation and required agent rules for this repository.
- [IMPLEMENTATION_ORCHESTRATOR.md](docs/IMPLEMENTATION_ORCHESTRATOR.md) - master prompt for new Codex sessions: how to choose the next goal, start subagents, follow IPS, and update state.
- [IMPLEMENTATION_STATE.md](docs/IMPLEMENTATION_STATE.md) - current implementation state, goal roadmap, dependencies, branches, and validation evidence.
- [implementation-goals/](implementation-goals/) - separate executable goal prompts for work in different windows/branches.
- [branch-workflow.md](docs/orchestration/branch-workflow.md) - branch, worktree, merge, and validation workflow for sequential and parallel goals.
- [idea.md](docs/idea.md) - complete product idea, target operating model, lifecycle, IPS contract, MVP scope, and non-goals.
- [PRODUCT_BRIEF.md](docs/PRODUCT_BRIEF.md) - business idea and product frame.
- [RUNLAYER_RESEARCH.md](docs/RUNLAYER_RESEARCH.md) - findings from the legacy RunLayer.
- [IMPLEMENTATION_SPEC.md](docs/IMPLEMENTATION_SPEC.md) - complete specification for the new system.
- [DOMAIN_MODEL.md](docs/DOMAIN_MODEL.md) - entities, states, and invariants.
- [TELEGRAM_INTERFACE.md](docs/TELEGRAM_INTERFACE.md) - Telegram commands, scenarios, and messages.
- [INTENT_MEMORY.md](docs/INTENT_MEMORY.md) - how to store intent and decision context.
- [IPS_INTEGRATION.md](docs/IPS_INTEGRATION.md) - mandatory Intent Preservation System integration.
- [PROJECT_INVARIANTS.md](docs/governance/PROJECT_INVARIANTS.md) - non-negotiable implementation invariants derived from product intent and IPS.
- [DOCUMENTATION_COMPLETENESS_STANDARD.md](docs/process/DOCUMENTATION_COMPLETENESS_STANDARD.md) - required shape for execution plans, context packages, prompts, and validation reports.
- [OPERATIONAL_GATES.md](docs/process/OPERATIONAL_GATES.md) - pre-coding, integration-readiness, and deployment-readiness gate rules.
- [AGENT_GAP_FILLING_RULES.md](docs/process/AGENT_GAP_FILLING_RULES.md) - how agents should handle missing documentation without inventing intent.
- [SYSTEM_ARCHITECTURE.md](docs/SYSTEM_ARCHITECTURE.md) - architecture, modules, and external integrations.
- [AUTONOMOUS_DEVELOPMENT.md](docs/AUTONOMOUS_DEVELOPMENT.md) - autonomous development, overnight mode, and self-improvement.
- [AGENT_ORCHESTRATION.md](docs/AGENT_ORCHESTRATION.md) - starting CLI/MCP/AI agents and routing tasks between executors.
- [AGENT_IMPLEMENTATION_TASKS.md](docs/AGENT_IMPLEMENTATION_TASKS.md) - implementation plan for an AI agent.

## Local Development

GoalKeeper currently starts as a TypeScript Fastify modular monolith. The first runtime surface is a health endpoint used to validate the foundation.

```bash
npm install
npm run build
npm run typecheck
npm test
npm run start:dev
npm run smoke -- http://127.0.0.1:3000
curl -s http://127.0.0.1:3000/health
```

Environment defaults are documented in `.env.example`.

Telegram webhook configuration is also documented in `.env.example`:

- `TELEGRAM_BOT_TOKEN` stores the bot token and must not be logged or committed with a real value.
- `TELEGRAM_WEBHOOK_SECRET` optionally validates Telegram's webhook secret header.
- `TELEGRAM_ALLOWED_USER_IDS` is a comma-separated allowlist of approved Telegram user IDs.


## Ecosystem Integration

GoalKeeper now has Kubernetes onboarding artifacts for the Alfares/Statex ecosystem:

- service name: `goalkeeper`;
- public URL: `https://goalkeeper.alfares.cz`;
- internal URL: `http://goalkeeper.statex-apps.svc.cluster.local:3392`;
- deployment script: `scripts/deploy.sh`;
- manifests: `k8s/`;
- Vault path: `secret/prod/goalkeeper`;
- integration health: `GET /health/integrations`.

See [docs/ECOSYSTEM_INTEGRATION.md](docs/ECOSYSTEM_INTEGRATION.md) for shared auth, notifications, database-server, docs-rag, logging, monitoring, Vault, and newcomer onboarding details.

## Hardening And Deployment Readiness

GoalKeeper includes local hardening helpers for idempotency, rate-limit decisions, destructive-action confirmation, redacted structured logs, backup/export manifests, deployment-readiness summaries, and smoke-test summaries. Telegram command parsing and renderers are prepared for `/admin`, `/backup_export`, `/smoke_test`, and `/deployment_readiness`; these surfaces summarize intent and required approvals but do not run destructive or production actions by themselves.

Production rollout is controlled by [docs/DEPLOYMENT_RUNBOOK.md](docs/DEPLOYMENT_RUNBOOK.md). Deployment requires validation evidence, smoke-test evidence, rollback notes, and explicit owner approval in the deployment session.

## Architecture Entry Points

- `src/main.ts` - process entrypoint and HTTP listener.
- `src/app.ts` - Fastify application factory and route registration.
- `src/config/env.ts` - environment parsing.
- `src/health/health.test.ts` - health endpoint test.
- `src/domain/executors.ts` - executor registry, routing, worker readiness, CLI adapter, MCP adapter interface, timeout handling, and log redaction.

## Executor Orchestration

GoalKeeper routes work only through explicit executor adapters. The domain executor layer matches enabled executors by capability, allowed project root, risk level, approval policy, and project preference; records the selected executor and routing reason; and refuses coding tasks unless the IPS pre-coding gate has passed with context package and coding prompt references.

The CLI adapter is intentionally narrow: it runs a provided executable with arguments from an allowed working directory, captures command evidence, stdout/stderr summaries, timestamps, exit status, timeout status, and redacts secret-looking values before persistence or reporting. MCP support is represented as an adapter interface until a concrete MCP runtime is wired in a later goal.

## Main Principle

Tasks must not live separately from their goal. Every task must answer:

- which goal it came from;
- which intent it preserves;
- which human decision authorized execution;
- which acceptance criteria prove completion;
- what changed in the project after execution.

## IPS As A Mandatory Contract

GoalKeeper must preserve intent not as a helpful note, but as a hard gate before execution. Coding tasks require this chain:

```text
raw intent -> approved goal intent -> goal impact -> approved plan -> task -> approved execution plan -> context package -> coding prompt -> code -> validation report
```

If any link is missing, incomplete, in a draft state, or contains `[MISSING: ...]` in an execution-critical section, the system must stop coding, create a blocker, and request clarification or prepare draft documents. The agent must not guess the goal, scope, approval, or validation criteria.

## Process Gates

GoalKeeper carries lightweight local gates adapted from the Intent Preservation System reference project:

```bash
python3 scripts/strict_doc_audit.py --format markdown --fail-on-issues
python3 scripts/pre_coding_gate.py --root . --goal implementation-goals/GOAL-01-foundation.md
python3 scripts/deployment_readiness_gate.py --root .
```

These scripts do not replace the full IPS engine. They provide a local fail-closed baseline so implementation sessions can catch missing process artifacts, unresolved execution-critical markers, and missing validation evidence early.

## One-Command Continuation

In a new Codex session opened in this repository, use:

```text
GOALKEEPER ORCHESTRATOR: continue implementation
```

or:

```text
Continue implementation of this project.
```

The agent must read `AGENTS.md`, inspect `docs/IMPLEMENTATION_STATE.md`, and continue from the next valid goal without asking the user to restate context.

For a shell-visible reminder of the next checkpoint, run:

```bash
./scripts/next_goal.sh
```

This script intentionally does not decide anything by itself. It prints the authoritative `Next Action` from `docs/IMPLEMENTATION_STATE.md` so a new orchestrator session can resume without copying stale context.
