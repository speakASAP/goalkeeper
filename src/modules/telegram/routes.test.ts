import assert from "node:assert/strict";
import { test } from "node:test";
import { buildApp } from "../../app.js";
import type { AppConfig } from "../../config/env.js";
import type { TelegramWebhookResponse } from "./types.js";

const config: AppConfig = {
  host: "127.0.0.1",
  port: 3000,
  logLevel: "silent",
  nodeEnv: "test",
  serviceName: "goalkeeper",
  telegram: {
    botToken: "fake-token-for-tests",
    webhookSecret: "secret-for-tests",
    allowedUserIds: [101]
  },
  ecosystem: {
    database: {
      port: 5432
    },
    redis: {
      port: 6379
    }
  }
};

test("Telegram webhook denies invalid secret", async () => {
  const app = buildApp({ config });

  const response = await app.inject({
    method: "POST",
    url: "/telegram/webhook",
    payload: { update_id: 1 }
  });

  assert.equal(response.statusCode, 401);
  assert.equal(response.json<TelegramWebhookResponse>().reason, "invalid_webhook_secret");
});

test("Telegram webhook denies unauthorized user", async () => {
  const app = buildApp({ config });

  const response = await app.inject({
    method: "POST",
    url: "/telegram/webhook",
    headers: { "x-telegram-bot-api-secret-token": "secret-for-tests" },
    payload: {
      update_id: 2,
      message: {
        message_id: 20,
        from: { id: 202 },
        chat: { id: 202, type: "private" },
        text: "/start"
      }
    }
  });

  const body = response.json<TelegramWebhookResponse>();
  assert.equal(response.statusCode, 200);
  assert.equal(body.handled, false);
  assert.equal(body.reason, "unauthorized");
  assert.match(body.message?.text ?? "", /Access denied/);
});

test("Telegram webhook handles authorized command", async () => {
  const app = buildApp({ config });

  const response = await app.inject({
    method: "POST",
    url: "/telegram/webhook",
    headers: { "x-telegram-bot-api-secret-token": "secret-for-tests" },
    payload: {
      update_id: 3,
      message: {
        message_id: 30,
        from: { id: 101 },
        chat: { id: 101, type: "private" },
        text: "/goal Build GoalKeeper MVP"
      }
    }
  });

  const body = response.json<TelegramWebhookResponse>();
  assert.equal(response.statusCode, 200);
  assert.equal(body.handled, true);
  assert.equal(body.reason, "command");
  assert.match(body.message?.text ?? "", /Goal captured as raw intent/);
  assert.match(body.message?.text ?? "", /Goal: telegram-goal-101-30/);
  assert.match(body.message?.text ?? "", /Status: intent ready for owner approval/);
  assert.match(body.message?.text ?? "", /No planning or coding started/);
  assert.equal(body.message?.buttons?.[0]?.[0]?.callbackData, "approve_intent:telegram-goal-101-30");
});

test("Telegram webhook handles duplicate callbacks idempotently", async () => {
  const app = buildApp({ config });
  const payload = {
    update_id: 4,
    callback_query: {
      id: "callback-1",
      from: { id: 101 },
      data: "approve_intent:goal-1"
    }
  };

  const first = await app.inject({
    method: "POST",
    url: "/telegram/webhook",
    headers: { "x-telegram-bot-api-secret-token": "secret-for-tests" },
    payload
  });
  const second = await app.inject({
    method: "POST",
    url: "/telegram/webhook",
    headers: { "x-telegram-bot-api-secret-token": "secret-for-tests" },
    payload
  });

  assert.equal(first.json<TelegramWebhookResponse>().reason, "handled");
  assert.equal(second.json<TelegramWebhookResponse>().reason, "duplicate");
  assert.match(second.json<TelegramWebhookResponse>().message?.text ?? "", /already handled/);
});
