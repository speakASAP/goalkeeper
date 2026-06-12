import type { TelegramCallbackQuery, TelegramMessage, TelegramUpdate, TelegramUser } from "./types.js";

export interface TelegramAuthResult {
  authorized: boolean;
  userId?: number;
}

export function getTelegramActor(update: TelegramUpdate): TelegramUser | undefined {
  return getMessageActor(update.message) ?? getCallbackActor(update.callback_query);
}

export function authorizeTelegramUpdate(update: TelegramUpdate, allowedUserIds: number[]): TelegramAuthResult {
  const actor = getTelegramActor(update);
  if (!actor) {
    return { authorized: false };
  }

  return {
    authorized: allowedUserIds.includes(actor.id),
    userId: actor.id
  };
}

function getMessageActor(message: TelegramMessage | undefined): TelegramUser | undefined {
  return message?.from;
}

function getCallbackActor(callbackQuery: TelegramCallbackQuery | undefined): TelegramUser | undefined {
  return callbackQuery?.from;
}
