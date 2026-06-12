# CP-GK-04: Intent Capture Approval And Memory

```yaml
id: CP-GK-04
status: approved
source_execution_plan: implementation-goals/GOAL-04-intent-memory.execution-plan.md
owner: orchestrator
created: 2026-06-12
last_updated: 2026-06-12
completeness_level: complete
```

## Target Task

Implement Goal 04 intent capture, approval, correction, decision, and stale artifact memory for GoalKeeper.

## Upstream Traceability

- `implementation-goals/GOAL-04-intent-memory.execution-plan.md`
- `implementation-goals/GOAL-04-intent-memory.md`
- `docs/INTENT_MEMORY.md`
- `docs/DOMAIN_MODEL.md`
- `docs/IMPLEMENTATION_SPEC.md`
- `docs/IPS_INTEGRATION.md`
- `docs/governance/PROJECT_INVARIANTS.md`

## Included Documents

- `docs/INTENT_MEMORY.md`: source of raw intent, normalized intent, corrections, decisions, and retrospective memory behavior.
- `docs/DOMAIN_MODEL.md`: source of goal statuses, intent records, decisions, plans, tasks, and IPS artifact relationships.
- `docs/IMPLEMENTATION_SPEC.md`: source of Telegram-to-goal lifecycle and intent approval requirements.
- `docs/IPS_INTEGRATION.md`: source of fail-closed traceability and stale artifact requirements.
- `implementation-goals/GOAL-04-intent-memory.md`: source of acceptance criteria and allowed scope.

## Excluded Documents

- Goal 03 Telegram runtime files are excluded because this branch is isolated from Goal 03 and Telegram hook integration will be handled during the Wave 3 merge.
- Planning, task creation, executor orchestration, validation reporting, and deployment goal documents are excluded except for invariant references.
- IPS reference repository files are excluded from writes; they are reference material only.

## Constraints

- Raw user intent must remain immutable.
- Normalized intent must be separate from source text.
- Planning must remain blocked before intent approval.
- Corrections create new intent records and do not rewrite prior raw or summary records.
- Approval and correction decisions must be first-class domain records.
- Corrections must be able to stale affected plans, tasks, context packages, and coding prompts.
- Use synthetic local data only and keep all text English-only.

## Allowed Changes

- `src/domain/intent-memory.ts`
- `src/domain/intent-memory.test.ts`
- Minimal type additions in `src/domain/types.ts`
- Minimal lifecycle guard additions in `src/domain/lifecycle.ts` and tests if needed
- Goal 04 implementation artifacts and `docs/IMPLEMENTATION_STATE.md`

## Forbidden Changes

- Do not implement a real LLM provider.
- Do not create executable tasks from unapproved intent.
- Do not modify Goal 03 Telegram files in this isolated branch.
- Do not add executor routing or worker behavior.
- Do not deploy or edit remote server files.

## Agent Prompt

Implement the intent-memory service described by `implementation-goals/GOAL-04-intent-memory.execution-plan.md`. Keep the service pure and deterministic, using explicit inputs and returned records. Preserve the existing Goal 02 lifecycle guards, add missing intent semantics, and cover the behavior with Node test runner tests.

## Validation Instructions

Run:

```bash
npm test
npm run typecheck
npm run lint
git diff --check
python3 scripts/strict_doc_audit.py --format markdown --fail-on-issues
python3 scripts/pre_coding_gate.py --root . --goal implementation-goals/GOAL-04-intent-memory.md
```
