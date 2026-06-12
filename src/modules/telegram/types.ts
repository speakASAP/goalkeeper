export interface TelegramUser {
  id: number;
  is_bot?: boolean;
  first_name?: string;
  username?: string;
}

export interface TelegramChat {
  id: number;
  type: "private" | "group" | "supergroup" | "channel" | string;
}

export interface TelegramMessage {
  message_id: number;
  from?: TelegramUser;
  chat: TelegramChat;
  text?: string;
}

export interface TelegramCallbackQuery {
  id: string;
  from: TelegramUser;
  message?: TelegramMessage;
  data?: string;
}

export interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
  callback_query?: TelegramCallbackQuery;
}

export interface TelegramRenderedMessage {
  text: string;
  buttons?: TelegramInlineButton[][];
}

export interface TelegramInlineButton {
  text: string;
  callbackData: string;
}

export interface TelegramWebhookResponse {
  ok: true;
  handled: boolean;
  reason?: string;
  message?: TelegramRenderedMessage;
}
