import assert from "node:assert/strict";
import { test } from "node:test";
import { InMemoryEventWriter } from "../../domain/events.js";
import { DomainTelegramIntentCaptureService } from "./intent-capture.js";

test("Telegram intent capture creates raw intent and stops at owner approval", () => {
  const events = new InMemoryEventWriter();
  const service = new DomainTelegramIntentCaptureService({
    eventWriter: events,
    now: () => new Date("2026-06-12T10:00:00.000Z")
  });

  const result = service.captureRawIntent({
    rawIntent: "Build GoalKeeper with Telegram-first intent preservation",
    actorId: "telegram:101",
    chatId: 101,
    messageId: 30
  });

  assert.equal(result.goal.id, "telegram-goal-101-30");
  assert.equal(result.goal.status, "intent_ready");
  assert.equal(result.goal.rawIntent, "Build GoalKeeper with Telegram-first intent preservation");
  assert.equal(result.rawIntentRecord.kind, "raw");
  assert.equal(result.rawIntentRecord.content, result.goal.rawIntent);
  assert.equal(result.rawIntentRecord.source, "telegram");
  assert.ok(events.list().some((event) => event.type === "goal.status_changed"));
});
