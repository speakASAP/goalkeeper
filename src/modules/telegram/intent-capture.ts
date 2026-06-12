import { InMemoryEventWriter, type EventWriter } from "../../domain/events.js";
import { createRawIntentRecord } from "../../domain/intent-memory.js";
import { transitionGoal } from "../../domain/lifecycle.js";
import type { Goal, IntentRecord } from "../../domain/types.js";

export interface TelegramIntentCaptureInput {
  rawIntent: string;
  actorId: string;
  chatId: number;
  messageId: number;
  now?: Date;
}

export interface TelegramIntentCaptureResult {
  goal: Goal;
  rawIntentRecord: IntentRecord;
}

export interface TelegramIntentCaptureService {
  captureRawIntent(input: TelegramIntentCaptureInput): TelegramIntentCaptureResult;
}

export class DomainTelegramIntentCaptureService implements TelegramIntentCaptureService {
  constructor(
    private readonly options: {
      eventWriter?: EventWriter;
      projectId?: string;
      now?: () => Date;
    } = {}
  ) {}

  captureRawIntent(input: TelegramIntentCaptureInput): TelegramIntentCaptureResult {
    const now = input.now ?? this.options.now?.() ?? new Date();
    const eventWriter = this.options.eventWriter ?? new InMemoryEventWriter();
    const goalId = `telegram-goal-${input.chatId}-${input.messageId}`;
    const goal: Goal = {
      id: goalId,
      projectId: this.options.projectId ?? "telegram-inbox",
      title: summarizeGoalTitle(input.rawIntent),
      rawIntent: input.rawIntent,
      status: "draft",
      priority: 1,
      successCriteria: [],
      constraints: [],
      nonGoals: [],
      assumptions: [],
      completionPct: 0,
      createdBy: input.actorId,
      createdAt: now,
      updatedAt: now
    };
    const rawIntentRecord = createRawIntentRecord(goal, `${goalId}-raw-intent`, {
      actor: input.actorId,
      source: "telegram",
      now
    });
    const intentReadyGoal = transitionGoal(goal, "intent_ready", {
      eventWriter,
      context: {
        actor: input.actorId,
        source: "telegram",
        now
      }
    });

    return {
      goal: intentReadyGoal,
      rawIntentRecord
    };
  }
}

function summarizeGoalTitle(rawIntent: string): string {
  const normalized = rawIntent.trim().replace(/\s+/gu, " ");
  if (normalized.length <= 80) {
    return normalized;
  }

  return `${normalized.slice(0, 77)}...`;
}
