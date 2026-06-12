# PROMPT-GK-04: Intent Capture Approval And Memory

```yaml
id: PROMPT-GK-04
status: approved
source_execution_plan: implementation-goals/GOAL-04-intent-memory.execution-plan.md
source_context_package: implementation-goals/GOAL-04-intent-memory.context-package.md
owner: orchestrator
created: 2026-06-12
last_updated: 2026-06-12
completeness_level: complete
```

## Task Summary

Implement GoalKeeper's domain-level intent memory flow from raw Telegram goal text to immutable raw intent, normalized intent card, approval decision, correction records, first-class decisions, and stale downstream artifact marking.

## Execution Plan Link

`implementation-goals/GOAL-04-intent-memory.execution-plan.md`

## Context Package Link

`implementation-goals/GOAL-04-intent-memory.context-package.md`

## Allowed Changes

- Create `src/domain/intent-memory.ts` and `src/domain/intent-memory.test.ts`.
- Modify `src/domain/types.ts` for required intent card, stale reason, and result types.
- Modify `src/domain/lifecycle.ts` or `src/domain/lifecycle.test.ts` only if needed to preserve Goal 04 lifecycle acceptance criteria.
- Update Goal 04 validation and implementation state after validation.

## Forbidden Changes

- Do not implement plan generation, task creation, or executor launching.
- Do not integrate a real LLM provider.
- Do not overwrite raw intent or mutate caller-owned records.
- Do not add dashboard UI or deployment behavior.
- Do not weaken existing IPS or validation guards.

## Implementation Instructions

Add pure TypeScript functions that clone records instead of mutating inputs. Use existing `DomainInvariantError`, `LifecycleContext`, `EventWriter`, and domain types where appropriate. Approval should produce a goal in `intent_approved`, an approval decision, and audit events. Correction should create a correction intent record, create a decision, and return stale versions of affected plans, tasks, and IPS artifacts with reasons. Treat `context_package` and `coding_prompt` IPS artifacts as stale when a correction affects coding context.

## Acceptance Criteria

- Goal cannot be planned before intent approval.
- Raw intent is immutable.
- User correction creates a new intent record.
- Corrections can mark affected plans, tasks, context packages, and coding prompts stale.
- Decisions are stored as first-class records.
- Tests cover approval, correction, and blocked planning.

## Validation Commands

```bash
npm test
npm run typecheck
npm run lint
git diff --check
python3 scripts/strict_doc_audit.py --format markdown --fail-on-issues
python3 scripts/pre_coding_gate.py --root . --goal implementation-goals/GOAL-04-intent-memory.md
```

## Expected Output

Return changed files, intent lifecycle behavior implemented, stale artifact behavior, validation evidence, deviations, risks, and next recommended command.
