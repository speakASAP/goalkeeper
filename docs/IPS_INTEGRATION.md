# Intent Preservation System Integration

## Requirement

GoalKeeper must integrate Intent Preservation System (IPS) at every level. IPS is not an optional documentation add-on. It is the control layer that prevents AI agents from drifting away from the owner's intent.

Local IPS reference:

```text
/Users/Sergej.Stasok/Documents/Gitlab/intent-preservation-system
```

GoalKeeper must preserve this chain:

```text
Vision -> Goal Impact -> System -> Feature -> Task -> Execution Plan -> Coding Prompt -> Code -> Validation
```

## Stop-The-Line Contract

For GoalKeeper, IPS is a hard execution contract.

Coding work must fail closed. If any required IPS artifact, approval, traceability edge, validation criterion, or human decision is missing, GoalKeeper must pause the task, create a blocker, and ask the owner or generate draft documentation with explicit `[MISSING: ...]` markers. It must not let an executor continue by guessing intent.

The only allowed draft behavior is documentation remediation: creating or updating mutable IPS documents so gaps become visible. Draft goal impact records, draft execution plans, or draft context packages are not permission to write code. A coding prompt may be generated only from an approved execution plan and a task with complete upstream traceability.

## Why This Matters

The owner wants to delegate work to AI agents while avoiding the common failure mode:

- vague request becomes vague task;
- agent guesses intent;
- code changes drift from the original goal;
- validation checks only syntax, not purpose;
- work must be redone.

IPS prevents this by forcing every coding task to carry upstream traceability, scope, constraints, context package, and validation criteria.

## Mandatory IPS Gates

Before any coding executor runs, GoalKeeper must verify:

- upstream traceability exists;
- goal impact mapping exists;
- execution plan exists and is approved;
- coding prompt was generated from the approved execution plan, not from a vague task summary;
- context package exists or can be generated;
- validation criteria are explicit;
- project invariants are declared;
- sensitive-data classification is declared;
- contract/schema impact is declared;
- replay/determinism impact is declared where relevant;
- operational gates are named.

Passing the gate means all required artifacts are present, linked, and internally consistent. A missing field, a `[MISSING: ...]` marker in an execution-critical section, or a draft approval state must block coding.

These checks map to the IPS commands:

```bash
python3 scripts/strict_doc_audit.py --format markdown --fail-on-issues
python3 scripts/pre_coding_gate.py --root .
python3 scripts/deployment_readiness_gate.py --root .
```

GoalKeeper must run the narrowest relevant gate automatically when the scripts exist in the project.

For self-improvement, high-risk work, contract/schema changes, data-bearing examples, deployment work, or cross-system behavior, GoalKeeper must run all available IPS gates and store the command results as validation evidence.

GoalKeeper's local process baseline is defined in:

```text
docs/governance/PROJECT_INVARIANTS.md
docs/process/DOCUMENTATION_COMPLETENESS_STANDARD.md
docs/process/OPERATIONAL_GATES.md
docs/process/AGENT_GAP_FILLING_RULES.md
implementation-goals/templates/
```

These files adapt the best IPS process patterns to the current GoalKeeper repository. They are mandatory for GoalKeeper implementation sessions even before the full runtime IPS integration exists.

## IPS As A Project Capability

Each tracked project should have IPS metadata:

- `ips_enabled`;
- `ips_root`;
- `vision_doc`;
- `constitution_doc`;
- `goal_impact_dir`;
- `tasks_dir`;
- `execution_plans_dir`;
- `context_packages_dir`;
- `prompts_dir`;
- `validation_dir`;
- `audit_commands`.

If a project does not yet use IPS, GoalKeeper should be able to create a minimal IPS scaffold or mark documentation gaps with `[MISSING: ...]` instead of inventing details.

Creating the scaffold does not bypass the gate. The first coding task in that project still requires approved intent, approved execution plan, generated context package, generated coding prompt, explicit validation criteria, and any required operational gates.

## Context Package Generation

GoalKeeper must generate context packages for executors.

Pipeline:

```text
Task ID
  -> load task metadata
  -> follow graph to feature
  -> follow graph to subsystem
  -> follow graph to system
  -> include relevant ADRs
  -> include validation rules
  -> include dependency docs
  -> optionally run vector/keyword search
  -> summarize oversized docs
  -> generate context package
  -> generate coding prompt
```

Mandatory context must come from graph/traceability, not semantic similarity alone.

RAG or keyword search may add supporting context, but it cannot replace upstream traceability. If graph links are missing, GoalKeeper must surface a blocker before coding.

## GoalKeeper Domain Mapping To IPS

| GoalKeeper | IPS |
|---|---|
| Project | IPS repository/project |
| Goal | Vision goal or goal impact record |
| IntentRecord | Vision evolution, decision, goal impact note |
| Plan | Execution plan |
| PlanStep | Task or execution-plan step |
| Task | IPS task |
| Executor input | Context package + coding prompt |
| ValidationResult | Validation report |
| Decision | ADR or decision/event record |
| Final report | Audit/validation summary |

## Runtime Rules For Agents

Every executor must receive:

- task summary;
- upstream traceability;
- approved execution plan reference;
- context package reference;
- coding prompt reference for coding tasks;
- allowed changes;
- forbidden changes;
- required context;
- implementation instructions;
- acceptance criteria;
- validation commands;
- expected final report format.

This matches the IPS coding prompt template.

Agents must not:

- invent business goals or approvals;
- remove traceability;
- change ADR decisions without a new ADR proposal;
- convert vague tasks directly into code;
- skip execution plans or validation;
- put secrets or raw production data into prompts/logs/reports;
- modify files outside execution-plan scope without reporting deviation.

If an executor discovers that the approved plan is wrong or incomplete, it must stop or mark a deviation for review. It may not silently expand scope and continue.

## Self-Improvement With IPS

When GoalKeeper modifies itself, IPS gates are mandatory.

Self-improvement sequence:

```text
Telegram request
  -> GoalKeeper goal
  -> IPS goal impact
  -> IPS task
  -> IPS execution plan
  -> IPS context package
  -> coding prompt
  -> executor run
  -> validation report
  -> Telegram summary
```

No self-modification should be treated as a quick task outside the IPS chain.

This is especially important because GoalKeeper is the system that will preserve intent for other projects. A self-improvement shortcut would weaken the control layer that future goals depend on.

## Documentation Gap Behavior

If required IPS documents are missing:

- create draft mutable documents where allowed;
- add `[MISSING: ...]` markers for unknown facts;
- ask the owner in Telegram when human intent is required;
- do not fabricate vision, approvals, or architecture decisions;
- do not generate a coding prompt until the missing execution-critical fields are resolved and the execution plan is approved.

## MVP Requirements

MVP must include:

- project-level IPS settings;
- pre-coding gate check;
- context package record;
- coding prompt record;
- validation report record;
- Telegram blocker when IPS gate fails;
- ability to resume once missing intent/context is supplied.

MVP acceptance is not met if coding tasks can start from a Telegram request, a task title, or a plan summary alone. The stored execution record must point back to the preserved intent chain and the validation evidence that proves the result served that intent.
