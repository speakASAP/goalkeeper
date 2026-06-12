export type TelegramCallbackAction =
  | "approve_intent"
  | "edit_intent"
  | "add_constraint"
  | "cancel_goal"
  | "approve_plan"
  | "reject_plan"
  | "regenerate_plan"
  | "edit_plan"
  | "ask_why"
  | "retry_task"
  | "reject_task"
  | "ack_task_report"
  | "ack_goal_report"
  | "noop";

const SUPPORTED_CALLBACK_ACTIONS = new Set<TelegramCallbackAction>([
  "approve_intent",
  "edit_intent",
  "add_constraint",
  "cancel_goal",
  "approve_plan",
  "reject_plan",
  "regenerate_plan",
  "edit_plan",
  "ask_why",
  "retry_task",
  "reject_task",
  "ack_task_report",
  "ack_goal_report",
  "noop"
]);

export interface ParsedTelegramCallback {
  action: TelegramCallbackAction;
  targetId?: string;
}

export interface TelegramCallbackDispatchResult {
  status: "handled" | "duplicate" | "invalid";
  callback?: ParsedTelegramCallback;
}

export type TelegramCallbackHandler = (callback: ParsedTelegramCallback) => TelegramCallbackDispatchResult;

export class IdempotentTelegramCallbackDispatcher {
  private readonly processedCallbackIds = new Set<string>();

  dispatch(callbackQueryId: string, data: string | undefined): TelegramCallbackDispatchResult {
    if (this.processedCallbackIds.has(callbackQueryId)) {
      return { status: "duplicate" };
    }

    const callback = parseTelegramCallback(data);
    if (!callback) {
      this.processedCallbackIds.add(callbackQueryId);
      return { status: "invalid" };
    }

    this.processedCallbackIds.add(callbackQueryId);
    return { status: "handled", callback };
  }
}

export function parseTelegramCallback(data: string | undefined): ParsedTelegramCallback | undefined {
  if (!data) {
    return undefined;
  }

  const [action, targetId] = data.split(":", 2);
  if (!isSupportedCallbackAction(action)) {
    return undefined;
  }

  return {
    action,
    targetId: targetId?.trim() || undefined
  };
}

function isSupportedCallbackAction(action: string | undefined): action is TelegramCallbackAction {
  return typeof action === "string" && SUPPORTED_CALLBACK_ACTIONS.has(action as TelegramCallbackAction);
}
