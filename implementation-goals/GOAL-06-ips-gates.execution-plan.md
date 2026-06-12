# EP-GK-06: IPS Gates, Context Packages, And Coding Prompts

```yaml
id: EP-GK-06
status: approved
source_goal: implementation-goals/GOAL-06-ips-gates.md
owner: orchestrator
created: 2026-06-12
last_updated: 2026-06-12
completeness_level: complete
branch: feature/gk-goal-06-ips-gates
```

## Metadata

Goal 06 implements the bounded IPS enforcement layer for coding tasks on `feature/gk-goal-06-ips-gates`. The plan is approved for pure domain implementation, tests, process artifacts, validation reporting, and state updates. It does not authorize executor startup or production deployment.

## Upstream Traceability

- `README.md`
- `docs/idea.md`
- `docs/PRODUCT_BRIEF.md`
- `docs/IMPLEMENTATION_SPEC.md`
- `docs/IPS_INTEGRATION.md`
- `docs/AGENT_ORCHESTRATION.md`
- `docs/governance/PROJECT_INVARIANTS.md`
- `docs/process/DOCUMENTATION_COMPLETENESS_STANDARD.md`
- `docs/process/OPERATIONAL_GATES.md`
- `docs/process/AGENT_GAP_FILLING_RULES.md`
- `implementation-goals/GOAL-05-planning-task-creation.md`
- `implementation-goals/GOAL-06-ips-gates.md`
- `/Users/Sergej.Stasok/Documents/Gitlab/intent-preservation-system/AGENTS.md`
- `/Users/Sergej.Stasok/Documents/Gitlab/intent-preservation-system/17_governance/AI_AGENT_RULES.md`
- `/Users/Sergej.Stasok/Documents/Gitlab/intent-preservation-system/17_governance/PROJECT_INVARIANTS.md`

## Goal Impact

This goal adds the fail-closed control layer between approved tasks and future executor routing. Coding tasks will be refused unless they have enabled project IPS settings, upstream traceability, approved execution-critical artifacts, generated context package and coding prompt records, explicit validation criteria, and stored gate evidence. Missing or draft IPS data creates an open blocker instead of inferred context.

## Project Invariants

- `GK-INV-001`: Preserved. This goal does not introduce a dashboard workflow; blockers remain Telegram-visible domain records for later Telegram rendering.
- `GK-INV-002`: Preserved. The pre-coding gate verifies the intent chain before coding tasks can proceed.
- `GK-INV-003`: Preserved. No executor is started and no fake execution records are created.
- `GK-INV-004`: Preserved. Owner questions are represented only for true IPS blockers.
- `GK-INV-005`: Preserved. Implementation remains inside the TypeScript Fastify modular monolith.
- `GK-INV-006`: Preserved. Draft artifacts, missing markers, missing traceability, and missing validation criteria fail closed.
- `GK-INV-007`: Preserved. Tests and artifacts use synthetic local data and no secrets.
- `GK-INV-008`: Preserved. GoalKeeper self-improvement tasks would use this same IPS gate path.
- `GK-INV-009`: Not applicable. Production deployment is out of scope.
- `GK-INV-010`: Preserved. All repository text remains English-only.

## Sensitive-Data Handling

Data classification is synthetic local development data. Generated tests, artifacts, gate evidence, context package records, coding prompt records, blockers, and validation reports must not include secrets, real Telegram IDs, bot tokens, production data, customer data, repository credentials, or live logs.

## Contract/Schema Impact

This goal extends TypeScript domain contracts around `Project.ipsSettings`, `IpsArtifact`, `Task.ipsGateStatus`, `contextPackageId`, `codingPromptId`, `ipsArtifactIds`, `Blocker`, and validation evidence. Existing Goal 02 migration already contains IPS artifacts and blockers, so no new migration is planned unless the existing persisted shape cannot represent the domain behavior.

## Replay/Determinism Impact

Gate evaluation must be deterministic for the same task, project, goal, plan, artifacts, gate command results, explicit IDs, context, and clock. Context package and coding prompt record creation uses explicit IDs and stores upstream artifact links so future executor orchestration can replay why a task was allowed or blocked.

## Scope

- Add a pure IPS domain module for project IPS settings validation, pre-coding gate evaluation, blocker creation, gate evidence records, context package records, and coding prompt records.
- Add tests covering missing traceability, disabled or incomplete project IPS settings, draft artifacts, missing markers, missing validation criteria, blocker creation, successful gate evidence, and generation ordering.
- Keep runtime executor routing, CLI/MCP adapters, worker loops, real filesystem scanning, and Telegram message sending out of scope.
- Update Goal 06 process artifacts, validation report, and implementation state.

## Non-Goals

- Starting Codex, Claude Code, OpenCode, shell, MCP, HTTP, or internal executors.
- Running project-specific pre-coding commands from the runtime service.
- Building a dashboard or deployment workflow.
- Hard-coding the IPS reference repository path into runtime logic.
- Allowing draft artifacts or generated context alone to authorize coding.

## Files To Inspect

- `src/domain/types.ts`
- `src/domain/lifecycle.ts`
- `src/domain/planning.ts`
- `src/domain/events.ts`
- `src/domain/lifecycle.test.ts`
- `src/domain/planning.test.ts`
- `docs/IPS_INTEGRATION.md`
- `docs/process/OPERATIONAL_GATES.md`
- `implementation-goals/GOAL-06-ips-gates.md`

## Files To Create

- `implementation-goals/GOAL-06-ips-gates.context-package.md`
- `implementation-goals/GOAL-06-ips-gates.coding-prompt.md`
- `implementation-goals/GOAL-06-ips-gates.validation-report.md`
- `src/domain/ips.ts`
- `src/domain/ips.test.ts`

## Files To Modify

- `src/domain/types.ts` only for narrow IPS settings or gate-evidence types if needed.
- `src/domain/lifecycle.ts` only if existing lifecycle guards need to consume stronger IPS semantics.
- `docs/IMPLEMENTATION_STATE.md`

## Files That Must Not Be Modified

- IPS reference repository files.
- Production deployment files or remote server files.
- Executor, worker, routing, and validation-report runtime modules that belong to later goals.
- Dashboard UI files.
- `dist/` build output except through normal build commands.

## Implementation Steps

1. Create Goal 06 context package and coding prompt from this execution plan.
2. Run strict documentation audit and the local pre-coding gate for Goal 06 before source edits.
3. Add IPS settings and gate input/result contracts that use project settings instead of hard-coded paths.
4. Implement pre-coding gate evaluation for coding tasks, including traceability, approved execution plan, context package, coding prompt, validation criteria, invariants, sensitive-data classification, contract/schema impact, replay/determinism impact, operational gates, artifact statuses, and missing markers.
5. Implement blocker creation when gate evaluation fails or blocks.
6. Implement context package and coding prompt artifact record generation from approved upstream artifacts only.
7. Implement validation evidence artifact records from gate results.
8. Add focused tests for fail-closed and pass cases.
9. Run validation commands, update the validation report and implementation state, then commit all Goal 06 changes.

## Test Plan

- Unit test project IPS settings require enabled IPS and configurable roots/docs/commands.
- Unit test missing upstream traceability blocks a coding task and creates an open IPS blocker.
- Unit test draft or marker-bearing execution-critical artifacts block coding.
- Unit test coding prompt generation fails unless the execution plan is approved and complete.
- Unit test context package records link to task, goal, plan, and upstream artifacts.
- Unit test a complete artifact chain passes and stores validation evidence.
- Unit test non-coding tasks return `not_required` without creating blockers.

## Validation Plan

- `npm test`
- `npm run typecheck`
- `npm run lint`
- `git diff --check`
- `python3 scripts/strict_doc_audit.py --format markdown --fail-on-issues`
- `python3 scripts/pre_coding_gate.py --root . --goal implementation-goals/GOAL-06-ips-gates.md`
- `python3 scripts/deployment_readiness_gate.py --root .`

## Gate Commands

```bash
python3 scripts/pre_coding_gate.py --root . --goal implementation-goals/GOAL-06-ips-gates.md
python3 scripts/deployment_readiness_gate.py --root .
```

## Documentation Updates

- Add Goal 06 execution plan, context package, coding prompt, and validation report.
- Update `docs/IMPLEMENTATION_STATE.md` with Goal 06 completion evidence and next action.

## Rollback Plan

Revert the Goal 06 commit or remove the new IPS service, tests, Goal 06 artifacts, and state-file updates. No production data, remote server files, external services, or executor runs are touched.

## Agent Handoff Prompt

Implement Goal 06 within the files and scope listed above. Preserve fail-closed IPS behavior: coding tasks require enabled project IPS settings, complete upstream traceability, approved execution-critical artifacts, context package and coding prompt links, explicit validation criteria, and stored gate evidence. Missing or draft data must create a blocker and must not launch or authorize executors.

## Completion Checklist

- [ ] Implementation complete
- [ ] Tests complete
- [ ] Validation evidence collected
- [ ] Documentation updated
- [ ] Deviations documented
