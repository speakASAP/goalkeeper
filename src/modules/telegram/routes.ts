import type { FastifyInstance } from "fastify";
import type { TelegramConfig } from "../../config/env.js";
import { authorizeTelegramUpdate } from "./auth.js";
import { IdempotentTelegramCallbackDispatcher } from "./callbacks.js";
import { parseTelegramCommand } from "./commands.js";
import { DomainTelegramIntentCaptureService, type TelegramIntentCaptureService } from "./intent-capture.js";
import { renderCallbackResult, renderCapturedGoalIntent, renderParseResult, renderUnauthorized } from "./renderers.js";
import type { TelegramUpdate, TelegramWebhookResponse } from "./types.js";

export interface TelegramRouteOptions {
  config: TelegramConfig;
  callbackDispatcher?: IdempotentTelegramCallbackDispatcher;
  intentCaptureService?: TelegramIntentCaptureService;
}

export function registerTelegramRoutes(app: FastifyInstance, options: TelegramRouteOptions): void {
  const callbackDispatcher = options.callbackDispatcher ?? new IdempotentTelegramCallbackDispatcher();
  const intentCaptureService = options.intentCaptureService ?? new DomainTelegramIntentCaptureService();

  app.post<{ Body: TelegramUpdate; Reply: TelegramWebhookResponse }>("/telegram/webhook", async (request, reply) => {
    if (!isWebhookSecretValid(request.headers["x-telegram-bot-api-secret-token"], options.config.webhookSecret)) {
      reply.code(401);
      return {
        ok: true,
        handled: false,
        reason: "invalid_webhook_secret"
      };
    }

    const update = request.body;
    const auth = authorizeTelegramUpdate(update, options.config.allowedUserIds);
    if (!auth.authorized) {
      return {
        ok: true,
        handled: false,
        reason: "unauthorized",
        message: renderUnauthorized()
      };
    }

    if (update.callback_query) {
      const result = callbackDispatcher.dispatch(update.callback_query.id, update.callback_query.data);
      return {
        ok: true,
        handled: result.status !== "invalid",
        reason: result.status,
        message: renderCallbackResult(result)
      };
    }

    if (update.message) {
      const parsed = parseTelegramCommand(update.message.text);
      if (parsed.kind === "command" && parsed.command === "goal" && parsed.args) {
        const result = intentCaptureService.captureRawIntent({
          rawIntent: parsed.args,
          actorId: `telegram:${auth.userId}`,
          chatId: update.message.chat.id,
          messageId: update.message.message_id
        });

        return {
          ok: true,
          handled: true,
          reason: "command",
          message: renderCapturedGoalIntent(result)
        };
      }

      return {
        ok: true,
        handled: parsed.kind === "command",
        reason: parsed.kind,
        message: renderParseResult(parsed)
      };
    }

    return {
      ok: true,
      handled: false,
      reason: "unsupported_update"
    };
  });
}

function isWebhookSecretValid(headerValue: string | string[] | undefined, expectedSecret: string | undefined): boolean {
  if (!expectedSecret) {
    return true;
  }

  return headerValue === expectedSecret;
}
