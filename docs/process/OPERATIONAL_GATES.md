# GoalKeeper Operational Gates

```yaml
id: GK-OPERATIONAL-GATES
status: approved
owner: project owner
created: 2026-06-11
last_updated: 2026-06-11
completeness_level: complete
upstream:
  - docs/IPS_INTEGRATION.md
  - docs/governance/PROJECT_INVARIANTS.md
  - /Users/Sergej.Stasok/Documents/Gitlab/intent-preservation-system/23_documentation_contracts/OPERATIONAL_GATE_STANDARD.md
downstream:
  - implementation-goals/README.md
  - docs/IMPLEMENTATION_ORCHESTRATOR.md
related_adrs: []
```

## Purpose

Operational gates make the implementation process executable. They define what must be checked before coding, integration, deployment, or goal closure.

## Gate Types

| Gate | Timing | Blocks on |
|---|---|---|
| Pre-coding gate | Before converting a goal/task/execution plan into code. | Missing execution plan, missing traceability, unapproved coding scope, missing validation plan, missing invariants, execution-critical `[MISSING: ...]` markers. |
| Integration-readiness gate | Before merging independent goal branches or worker outputs. | Conflicting ownership, missing validation evidence, failed contracts, missing replay/determinism evidence when applicable, unresolved deviations. |
| Deployment-readiness gate | Before production deployment or marking final hardening complete. | Failed pre-coding evidence, failed strict audit, missing validation report, unresolved markers, protected intent changes, missing owner approval for deployment. |

## Required Evidence

Each gate report must include:

- command executed;
- repository root;
- target artifact;
- status;
- missing files or sections;
- failed checks;
- invariant evidence;
- sensitive-data result;
- next action.

Reports belong under `reports/validation/`. Reports are evidence, not source-of-truth process docs.

## Local Gate Commands

GoalKeeper carries lightweight local gates:

```bash
python3 scripts/strict_doc_audit.py --format markdown --fail-on-issues
python3 scripts/pre_coding_gate.py --root .
python3 scripts/deployment_readiness_gate.py --root .
```

If the full IPS reference implementation is available and relevant to the target project, the orchestrator may run that implementation too. Local gates still define the minimum GoalKeeper process.

## Failure Policy

A failed gate blocks the next delivery phase. Do not weaken a gate to make work pass. Fix the artifact, split the task, or document a human-approved exception.
