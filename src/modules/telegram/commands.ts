export type TelegramCommandName =
  | "start"
  | "projects"
  | "new_project"
  | "register_project"
  | "goal"
  | "goals"
  | "tasks"
  | "status"
  | "blocked"
  | "overnight"
  | "agents"
  | "executors"
  | "task_log"
  | "admin"
  | "backup_export"
  | "smoke_test"
  | "deployment_readiness";

const SUPPORTED_COMMANDS = new Set<TelegramCommandName>([
  "start",
  "projects",
  "new_project",
  "register_project",
  "goal",
  "goals",
  "tasks",
  "status",
  "blocked",
  "overnight",
  "agents",
  "executors",
  "task_log",
  "admin",
  "backup_export",
  "smoke_test",
  "deployment_readiness"
]);

export interface ParsedTelegramCommand {
  kind: "command";
  command: TelegramCommandName;
  args: string;
}

export interface UnknownTelegramCommand {
  kind: "unknown";
  command?: string;
  args: string;
}

export interface NonCommandMessage {
  kind: "text";
  text: string;
}

export type TelegramCommandParseResult = ParsedTelegramCommand | UnknownTelegramCommand | NonCommandMessage;

export function parseTelegramCommand(text: string | undefined): TelegramCommandParseResult {
  const trimmed = text?.trim() ?? "";
  if (!trimmed.startsWith("/")) {
    return { kind: "text", text: trimmed };
  }

  const [rawCommand = "", ...argParts] = trimmed.slice(1).split(/\s+/u);
  const command = rawCommand.split("@", 1)[0]?.toLowerCase();
  const args = argParts.join(" ").trim();

  if (isSupportedCommand(command)) {
    return { kind: "command", command, args };
  }

  return { kind: "unknown", command, args };
}

function isSupportedCommand(command: string | undefined): command is TelegramCommandName {
  return typeof command === "string" && SUPPORTED_COMMANDS.has(command as TelegramCommandName);
}
