export interface AppConfig {
  host: string;
  port: number;
  logLevel: string;
  nodeEnv: string;
  telegram: TelegramConfig;
}

export interface TelegramConfig {
  botToken?: string;
  webhookSecret?: string;
  allowedUserIds: number[];
}

function parsePort(value: string | undefined): number {
  if (!value) {
    return 3000;
  }

  const port = Number.parseInt(value, 10);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid PORT value: ${value}`);
  }

  return port;
}

function parseAllowedUserIds(value: string | undefined): number[] {
  if (!value?.trim()) {
    return [];
  }

  return value
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean)
    .map((id) => {
      const numericId = Number.parseInt(id, 10);
      if (!Number.isSafeInteger(numericId) || numericId <= 0) {
        throw new Error(`Invalid TELEGRAM_ALLOWED_USER_IDS value: ${id}`);
      }

      return numericId;
    });
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  return {
    host: env.HOST ?? "127.0.0.1",
    port: parsePort(env.PORT),
    logLevel: env.LOG_LEVEL ?? "info",
    nodeEnv: env.NODE_ENV ?? "development",
    telegram: {
      botToken: env.TELEGRAM_BOT_TOKEN,
      webhookSecret: env.TELEGRAM_WEBHOOK_SECRET,
      allowedUserIds: parseAllowedUserIds(env.TELEGRAM_ALLOWED_USER_IDS)
    }
  };
}
