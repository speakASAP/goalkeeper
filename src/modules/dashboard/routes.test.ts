import assert from "node:assert/strict";
import { test } from "node:test";
import { buildApp } from "../../app.js";
import { buildDashboardState } from "./routes.js";

test("GET /dashboard returns the orchestrator dashboard shell", async () => {
  const app = buildApp();

  const response = await app.inject({
    method: "GET",
    url: "/dashboard"
  });

  assert.equal(response.statusCode, 200);
  assert.match(response.headers["content-type"]?.toString() ?? "", /^text\/html/);
  assert.match(response.body, /GoalKeeper/);
  assert.match(response.body, /Orchestrator Overview/);
  assert.match(response.body, /Telegram Command Surface/);
});

test("GET /dashboard/state returns parsed implementation state", async () => {
  const app = buildApp();

  const response = await app.inject({
    method: "GET",
    url: "/dashboard/state"
  });

  assert.equal(response.statusCode, 200);

  const body = response.json<ReturnType<typeof buildDashboardState>>();
  assert.equal(body.currentStatus.activeGoal, "none");
  assert.ok(body.roadmap.length >= 10);
  assert.ok(body.commandSurface.includes("/deployment_readiness"));
  assert.ok(body.nextAction.includes("All implementation goals through Goal 11 are complete"));
});

test("buildDashboardState extracts roadmap and validation evidence from markdown", () => {
  const state = buildDashboardState(`
## Current Status

- Active goal: none
- Active branch: feature/example
- Current wave: Wave 1
- Completed goals: 01 Foundation
- Running goals: none
- Blocked goals: none
- IPS mode: mandatory fail-closed
- Production deployment status: not deployed

## Goal Roadmap

| Goal | File | Status | Branch | Depends On | Parallel Notes |
|---|---|---|---|---|---|
| 01 | \`implementation-goals/GOAL-01-foundation.md\` | done | \`feature/gk-goal-01-foundation\` | none | Blocks most coding goals |

## Validation Evidence Log

\`\`\`text
2026-06-12: Goal 01 validation passed.
\`\`\`

## Next Action

Record evidence.
`);

  assert.equal(state.currentStatus.activeBranch, "feature/example");
  assert.equal(state.roadmap[0]?.goal, "01");
  assert.equal(state.roadmap[0]?.file, "implementation-goals/GOAL-01-foundation.md");
  assert.deepEqual(state.validationEvidence, ["2026-06-12: Goal 01 validation passed."]);
  assert.equal(state.nextAction, "Record evidence.");
});
