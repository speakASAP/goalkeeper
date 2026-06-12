import assert from "node:assert/strict";
import { test } from "node:test";
import { IdempotentTelegramCallbackDispatcher, parseTelegramCallback } from "./callbacks.js";

test("parses supported callback payloads", () => {
  assert.deepEqual(parseTelegramCallback("approve_intent:goal-1"), {
    action: "approve_intent",
    targetId: "goal-1"
  });

  assert.deepEqual(parseTelegramCallback("reject_plan:plan-1"), {
    action: "reject_plan",
    targetId: "plan-1"
  });

  assert.deepEqual(parseTelegramCallback("retry_task:task-1"), {
    action: "retry_task",
    targetId: "task-1"
  });

  assert.deepEqual(parseTelegramCallback("ack_goal_report:goal-1"), {
    action: "ack_goal_report",
    targetId: "goal-1"
  });

  assert.deepEqual(parseTelegramCallback("cancel_goal"), {
    action: "cancel_goal",
    targetId: undefined
  });
});

test("rejects unsupported callback payloads", () => {
  assert.equal(parseTelegramCallback(undefined), undefined);
  assert.equal(parseTelegramCallback("run_coding_executor:task-1"), undefined);
});

test("dispatches each callback query id once", () => {
  const dispatcher = new IdempotentTelegramCallbackDispatcher();

  assert.equal(dispatcher.dispatch("cb-1", "approve_intent:goal-1").status, "handled");
  assert.equal(dispatcher.dispatch("cb-1", "approve_intent:goal-1").status, "duplicate");
  assert.equal(dispatcher.dispatch("cb-2", "unknown").status, "invalid");
  assert.equal(dispatcher.dispatch("cb-2", "approve_intent").status, "duplicate");
});
