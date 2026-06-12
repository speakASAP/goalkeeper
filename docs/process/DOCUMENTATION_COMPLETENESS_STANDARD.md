# GoalKeeper Documentation Completeness Standard

```yaml
id: GK-DOC-COMPLETENESS
status: approved
owner: project owner
created: 2026-06-11
last_updated: 2026-06-11
completeness_level: complete
upstream:
  - /Users/Sergej.Stasok/Documents/Gitlab/intent-preservation-system/23_documentation_contracts/DOCUMENTATION_COMPLETENESS_STANDARD.md
downstream:
  - implementation-goals/README.md
  - docs/process/OPERATIONAL_GATES.md
related_adrs: []
```

## Purpose

GoalKeeper uses documentation as execution control, not as background notes. This standard defines the minimum shape required for implementation artifacts so agents can detect missing intent before coding.

## Completeness Levels

```yaml
completeness_level: missing | skeletal | partial | complete | validated
```

- `missing`: the artifact does not exist.
- `skeletal`: headings exist, but execution-critical content is absent.
- `partial`: useful content exists, but required sections or evidence are missing.
- `complete`: required sections exist and contain meaningful content.
- `validated`: complete and checked against upstream intent.

## Metadata Block

Major process artifacts should start with:

```yaml
id: DOC-ID
status: draft | reviewed | approved | deprecated
owner: TBD
created: YYYY-MM-DD
last_updated: YYYY-MM-DD
completeness_level: skeletal | partial | complete | validated
upstream:
  - path/to/upstream.md
downstream:
  - path/to/downstream.md
related_adrs:
  - ADR-xxx
```

Existing narrative docs do not need to be rewritten immediately. New goal execution plans, context packages, coding prompts, validation reports, ADRs, and readiness reports must follow this standard.

## Missing And Unknown Markers

Use exact markers so gates can detect incomplete artifacts:

```text
[MISSING: describe what is missing and who should provide it]
[UNKNOWN: describe what is unknown and how to discover it]
```

Execution-critical markers block coding and deployment. Non-critical markers must be listed in the final report.

## Required Sections

### Goal Prompt

- Outcome
- Dependencies
- IPS intent
- Allowed changes
- Forbidden changes
- Acceptance criteria
- Validation commands
- Final report

### Execution Plan

- Metadata
- Upstream traceability
- Goal impact
- Project invariants
- Sensitive-data handling
- Contract/schema impact
- Replay/determinism impact
- Scope
- Non-goals
- Files to inspect
- Files to create
- Files to modify
- Files that must not be modified
- Implementation steps
- Test plan
- Validation plan
- Gate commands
- Documentation updates
- Rollback plan
- Agent handoff prompt
- Completion checklist

### Context Package

- Target task
- Upstream traceability
- Included documents
- Excluded documents
- Constraints
- Allowed changes
- Forbidden changes
- Agent prompt
- Validation instructions

### Coding Prompt

- Task summary
- Execution plan link
- Context package link
- Allowed changes
- Forbidden changes
- Implementation instructions
- Acceptance criteria
- Validation commands
- Expected output

### Validation Report

- Artifact validated
- Validation scope
- Evidence
- Gate evidence
- Invariant evidence
- Sensitive-data evidence
- Replay/determinism evidence when applicable
- Passed criteria
- Failed criteria
- Deviations
- Recommendation

### ADR

- Status
- Context
- Decision
- Consequences
- Alternatives considered
- Validation or rollback signal

## Agent Gap Behavior

Agents may add missing sections to mutable documents when the content is derivable from approved upstream documents. If a detail cannot be inferred, the agent must add a `[MISSING: ...]` or `[UNKNOWN: ...]` marker instead of inventing it.
