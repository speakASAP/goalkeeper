# EP-GK-07: Executor Orchestration, Worker Loop, And Routing

```yaml
id: EP-GK-07
status: approved
source_goal: implementation-goals/GOAL-07-executor-orchestration.md
owner: orchestrator
created: 2026-06-12
last_updated: 2026-06-12
completeness_level: complete
branch: feature/gk-goal-07-executor-orchestration
```

## Metadata

Goal 07 implements the bounded executor orchestration domain layer on `feature/gk-goal-07-executor-orchestration`. The plan is approved for pure domain implementation, harmless CLI adapter tests, process artifacts, validation reporting, README operational notes, and state updates. It does not authorize production deployment, destructive command execution, or bypassing Goal 06 IPS gates.

## Upstream Traceability

- `README.md`
- `docs/idea.md`
- `docs/PRODUCT_BRIEF.md`
- `docs/IMPLEMENTATION_SPEC.md`
- `docs/IPS_INTEGRATION.md`
- `docs/AGENT_ORCHESTRATION.md`
- `docs/AUTONOMOUS_DEVELOPMENT.md`
- `docs/SYSTEM_ARCHITECTURE.md`
- `docs/governance/PROJECT_INVARIANTS.md`
- `docs/process/DOCUMENTATION_COMPLETENESS_STANDARD.md`
- `docs/process/OPERATIONAL_GATES.md`
- `docs/process/AGENT_GAP_FILLING_RULES.md`
- `implementation-goals/GOAL-06-ips-gates.md`
- `implementation-goals/GOAL-07-executor-orchestration.md`
- `/Users/Sergej.Stasok/Documents/Gitlab/intent-preservation-system/AGENTS.md`
- `/Users/Sergej.Stasok/Documents/Gitlab/intent-preservation-system/17_governance/AI_AGENT_RULES.md`
- `/Users/Sergej.Stasok/Documents/Gitlab/intent-preservation-system/17_governance/PROJECT_INVARIANTS.md`

## Goal Impact

This goal adds the execution control layer downstream of Goal 06. Ready tasks can be selected by dependency state, routed to an enabled executor with an auditable reason, and executed through explicit adapters that capture immutable execution evidence. Coding tasks remain blocked until the Goal 06 IPS result has passed and context package plus coding prompt references are present.

## Project Invariants

- `GK-INV-001`: Preserved. No dashboard workflow is introduced; structured blockers and questions remain available for Telegram rendering.
- `GK-INV-002`: Preserved. Coding task routing requires passed IPS gate status and artifact links.
- `GK-INV-003`: Preserved. Executors run through explicit adapters and produce execution records instead of simulated results.
- `GK-INV-004`: Preserved. User questions are created only when execution cannot continue without a true blocker.
- `GK-INV-005`: Preserved. Implementation remains inside the TypeScript Fastify modular monolith.
- `GK-INV-006`: Preserved. Missing or failed IPS evidence blocks coding execution.
- `GK-INV-007`: Preserved. Tests use harmless synthetic commands and redact secret-looking values from logs.
- `GK-INV-008`: Preserved. GoalKeeper self-improvement work would use the same executor and IPS routing path.
- `GK-INV-009`: Not applicable. Production deployment is out of scope.
- `GK-INV-010`: Preserved. All repository text remains English-only.

## Sensitive-Data Handling

Data classification is synthetic local development data. Executor tests may capture stdout and stderr from harmless local commands only. Execution logs, records, reports, and tests must redact secret-looking environment values, bearer tokens, API keys, bot tokens, and password-style assignments before persistence or display. No real Telegram bot token, production data, repository credential, or raw customer data may be used.

## Contract/Schema Impact

This goal adds TypeScript domain contracts for executors, routing decisions, worker task selection, execution records, adapter results, retry policy, timeouts, and structured executor blockers. The existing Goal 02 migration already includes executor and execution tables, so no database migration is planned unless the existing persisted shape cannot represent the new contracts.

## Replay/Determinism Impact

Routing and worker readiness evaluation must be deterministic for the same task list, dependency status, executor registry, project root, risk, required capabilities, preferred executors, IPS status, and clock inputs. CLI adapter execution records include start and end timestamps, command, cwd, status, exit code, summaries, and timeout status so later validation can replay why a task ran or was blocked.

## Scope

- Add executor registry, capability matching, root authorization, and risk/approval checks.
- Add routing that selects enabled executors, records reasons and fallbacks, and blocks coding tasks without passed IPS evidence.
- Add worker readiness selection for tasks whose dependencies are satisfied and retry budgets allow execution.
- Add a CLI/shell adapter for harmless command execution with timeout handling, stdout/stderr summary capture, and secret redaction.
- Add an MCP adapter interface without binding to a concrete MCP server.
- Add structured blocker/question output for interactive execution blockers.
- Add focused unit tests and README operational notes.
- Update Goal 07 process artifacts, validation report, and implementation state.

## Non-Goals

- No production deploy or remote server command execution.
- No destructive command tests.
- No real Codex, Claude Code, OpenCode, MCP, database, browser, or HTTP service startup.
- No dashboard UI.
- No changes that make coding execution possible without passed IPS evidence.
- No broad persistence rewrite beyond narrow type updates if needed.

## Files To Inspect

- `src/domain/types.ts`
- `src/domain/ips.ts`
- `src/domain/ips.test.ts`
- `src/domain/planning.ts`
- `src/domain/lifecycle.ts`
- `src/domain/events.ts`
- `docs/AGENT_ORCHESTRATION.md`
- `docs/SYSTEM_ARCHITECTURE.md`
- `implementation-goals/GOAL-06-ips-gates.md`
- `implementation-goals/GOAL-07-executor-orchestration.md`

## Files To Create

- `implementation-goals/GOAL-07-executor-orchestration.context-package.md`
- `implementation-goals/GOAL-07-executor-orchestration.coding-prompt.md`
- `implementation-goals/GOAL-07-executor-orchestration.validation-report.md`
- `src/domain/executors.ts`
- `src/domain/executors.test.ts`

## Files To Modify

- `src/domain/types.ts` only for narrow executor, routing, worker, or execution record contracts if needed.
- `README.md` for concise operational notes about executor orchestration.
- `docs/IMPLEMENTATION_STATE.md`

## Files That Must Not Be Modified

- IPS reference repository files.
- Production deployment files or remote server files.
- Dashboard UI files.
- Telegram behavior files unless a narrow type import requires it.
- `dist/` build output except through normal build commands.

## Implementation Steps

1. Create Goal 07 context package and coding prompt from this execution plan.
2. Run strict documentation audit, the Goal 06 dependency preflight, and the local pre-coding gate for Goal 07 before source edits.
3. Inspect current domain task, IPS, lifecycle, planning, and event contracts.
4. Implement executor registry and capability matching with enabled, root, risk, and approval constraints.
5. Implement routing decisions that block coding tasks unless IPS status is `passed` and context package plus coding prompt references are present.
6. Implement worker readiness selection based on task status, dependency completion, retry budget, and routing result.
7. Implement CLI/shell adapter execution with timeout, stdout/stderr summaries, secret redaction, and structured execution records.
8. Add MCP adapter interface types and structured interactive blocker questions.
9. Add focused tests for registry matching, disabled/unauthorized executors, dependency readiness, routing evidence, IPS refusal, timeout handling, redaction, retry behavior, and interactive blockers.
10. Run validation commands, update the validation report and implementation state, then commit all Goal 07 changes.

## Test Plan

- Unit test worker only selects tasks whose dependencies are satisfied.
- Unit test disabled executors and unauthorized project roots cannot receive tasks.
- Unit test routing records selected executor, reason, fallbacks, and approval requirement.
- Unit test coding tasks with missing or failed IPS gate return blocked routing, not fallback execution.
- Unit test CLI adapter captures command, cwd, start/end timestamps, stdout/stderr summaries, status, exit code, and timeout.
- Unit test redaction removes secret-looking values from stdout, stderr, command summaries, and env summaries.
- Unit test interactive adapter blocker becomes a structured question and `awaiting_user`-style result.

## Validation Plan

- `npm test`
- `npm run typecheck`
- `npm run lint`
- `git diff --check`
- `python3 scripts/strict_doc_audit.py --format markdown --fail-on-issues`
- `python3 scripts/pre_coding_gate.py --root . --goal implementation-goals/GOAL-07-executor-orchestration.md`
- `python3 scripts/deployment_readiness_gate.py --root .`

## Gate Commands

```bash
python3 scripts/pre_coding_gate.py --root . --goal implementation-goals/GOAL-07-executor-orchestration.md
python3 scripts/deployment_readiness_gate.py --root .
```

## Documentation Updates

- Add Goal 07 execution plan, context package, coding prompt, and validation report.
- Update `README.md` with concise executor orchestration operational notes.
- Update `docs/IMPLEMENTATION_STATE.md` with Goal 07 completion evidence and next action.

## Rollback Plan

Revert the Goal 07 commit or remove the new executor service, tests, Goal 07 artifacts, README note, and state-file updates. No production data, remote server files, external services, or destructive commands are touched.

## Agent Handoff Prompt

Implement Goal 07 within the files and scope listed above. Preserve explicit adapter-based execution and fail-closed IPS routing: coding tasks require passed IPS status plus context package and coding prompt references before any executor can be selected. Use harmless synthetic command tests only, redact secret-like values, and produce immutable execution records with routing evidence.

## Completion Checklist

- [ ] Implementation complete
- [ ] Tests complete
- [ ] Validation evidence collected
- [ ] Documentation updated
- [ ] Deviations documented
