import assert from "node:assert/strict";
import { test } from "node:test";
import { authorizeTelegramUpdate } from "./auth.js";
import type { TelegramUpdate } from "./types.js";

test("authorizes Telegram message actor from allowlist", () => {
  const update: TelegramUpdate = {
    update_id: 1,
    message: {
      message_id: 10,
      from: { id: 101, first_name: "Owner" },
      chat: { id: 101, type: "private" },
      text: "/start"
    }
  };

  assert.deepEqual(authorizeTelegramUpdate(update, [101]), { authorized: true, userId: 101 });
  assert.deepEqual(authorizeTelegramUpdate(update, [202]), { authorized: false, userId: 101 });
});

test("authorizes Telegram callback actor from allowlist", () => {
  const update: TelegramUpdate = {
    update_id: 2,
    callback_query: {
      id: "callback-1",
      from: { id: 303 },
      data: "approve_intent"
    }
  };

  assert.deepEqual(authorizeTelegramUpdate(update, [303]), { authorized: true, userId: 303 });
});

test("rejects update without actor", () => {
  assert.deepEqual(authorizeTelegramUpdate({ update_id: 3 }, [101]), { authorized: false });
});
