import type { DomainEvent, JsonValue } from "./types.js";

export interface EventWriter {
  append(event: Omit<DomainEvent, "id" | "createdAt">): DomainEvent;
}

export class InMemoryEventWriter implements EventWriter {
  private readonly eventLog: DomainEvent[] = [];
  private sequence = 0;

  append(event: Omit<DomainEvent, "id" | "createdAt">): DomainEvent {
    this.sequence += 1;

    const persisted: DomainEvent = {
      ...event,
      id: `event_${this.sequence}`,
      createdAt: new Date()
    };

    this.eventLog.push(structuredCloneEvent(persisted));
    return structuredCloneEvent(persisted);
  }

  list(): DomainEvent[] {
    return this.eventLog.map(structuredCloneEvent);
  }
}

function structuredCloneEvent(event: DomainEvent): DomainEvent {
  return {
    ...event,
    createdAt: new Date(event.createdAt),
    payload: cloneJsonRecord(event.payload)
  };
}

function cloneJsonRecord(value: Record<string, JsonValue>): Record<string, JsonValue> {
  return JSON.parse(JSON.stringify(value)) as Record<string, JsonValue>;
}
