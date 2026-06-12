# GoalKeeper Agent Gap Filling Rules

```yaml
id: GK-AGENT-GAP-RULES
status: approved
owner: project owner
created: 2026-06-11
last_updated: 2026-06-11
completeness_level: complete
upstream:
  - docs/process/DOCUMENTATION_COMPLETENESS_STANDARD.md
  - /Users/Sergej.Stasok/Documents/Gitlab/intent-preservation-system/23_documentation_contracts/AGENT_GAP_FILLING_RULES.md
downstream:
  - docs/IMPLEMENTATION_ORCHESTRATOR.md
related_adrs: []
```

## Primary Rule

Do not silently proceed through incomplete documentation. Fill the gap from approved sources or mark it explicitly.

## Allowed Actions

Agents may:

- add missing required sections to mutable documents;
- add `[MISSING: ...]` markers;
- add `[UNKNOWN: ...]` markers;
- create draft execution plans;
- create draft context packages;
- create draft coding prompts from approved execution plans;
- create validation report drafts from actual evidence;
- update `docs/IMPLEMENTATION_STATE.md` with compressed state.

## Forbidden Actions

Agents must not:

- invent business goals;
- invent approval status;
- remove traceability links;
- mark incomplete artifacts as validated;
- convert a task into code without an approved execution plan for coding goals;
- edit outside execution-plan scope without reporting the deviation;
- place secrets or raw production data in prompts, tests, examples, logs, screenshots, plans, or reports.

## Gap Remediation Process

1. Identify the artifact type.
2. Compare the artifact to `docs/process/DOCUMENTATION_COMPLETENESS_STANDARD.md`.
3. Fill missing sections only from approved upstream documents.
4. Add `[MISSING: ...]` or `[UNKNOWN: ...]` when content cannot be inferred.
5. Update the artifact status and `completeness_level`.
6. Record the gap and remediation in the session report.
