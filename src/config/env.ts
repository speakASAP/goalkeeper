export interface AppConfig {
  host: string;
  port: number;
  logLevel: string;
  nodeEnv: string;
  serviceName: string;
  domain?: string;
  publicBaseUrl?: string;
  telegram: TelegramConfig;
  ecosystem: EcosystemConfig;
}

export interface TelegramConfig {
  botToken?: string;
  webhookSecret?: string;
  allowedUserIds: number[];
}

export interface EcosystemConfig {
  authServiceUrl?: string;
  authPublicUrl?: string;
  notificationsServiceUrl?: string;
  docsRagServiceUrl?: string;
  loggingServiceUrl?: string;
  monitoringServiceUrl?: string;
  database: DatabaseConfig;
  redis: RedisConfig;
}

export interface DatabaseConfig {
  host?: string;
  port: number;
  name?: string;
  user?: string;
}

export interface RedisConfig {
  host?: string;
  port: number;
}

function optionalValue(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function parsePort(value: string | undefined, defaultPort = 3000): number {
  if (!value) {
    return defaultPort;
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
    serviceName: env.SERVICE_NAME ?? "goalkeeper",
    domain: optionalValue(env.DOMAIN),
    publicBaseUrl: optionalValue(env.PUBLIC_BASE_URL),
    telegram: {
      botToken: optionalValue(env.TELEGRAM_BOT_TOKEN),
      webhookSecret: optionalValue(env.TELEGRAM_WEBHOOK_SECRET),
      allowedUserIds: parseAllowedUserIds(env.TELEGRAM_ALLOWED_USER_IDS)
    },
    ecosystem: {
      authServiceUrl: optionalValue(env.AUTH_SERVICE_URL),
      authPublicUrl: optionalValue(env.AUTH_SERVICE_PUBLIC_URL),
      notificationsServiceUrl: optionalValue(env.NOTIFICATIONS_SERVICE_URL),
      docsRagServiceUrl: optionalValue(env.DOCS_RAG_SERVICE_URL),
      loggingServiceUrl: optionalValue(env.LOGGING_SERVICE_URL),
      monitoringServiceUrl: optionalValue(env.MONITORING_SERVICE_URL),
      database: {
        host: optionalValue(env.DB_HOST),
        port: parsePort(env.DB_PORT, 5432),
        name: optionalValue(env.DB_NAME),
        user: optionalValue(env.DB_USER)
      },
      redis: {
        host: optionalValue(env.REDIS_HOST),
        port: parsePort(env.REDIS_PORT, 6379)
      }
    }
  };
}
