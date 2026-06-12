import type { FastifyInstance } from "fastify";
import type { EcosystemConfig } from "../../config/env.js";

export interface EcosystemDependencyStatus {
  id: string;
  kind: "http" | "postgres" | "redis" | "monitoring";
  configured: boolean;
  required: boolean;
  target?: string;
}

export interface EcosystemHealthResponse {
  status: "ok" | "degraded";
  service: "goalkeeper";
  timestamp: string;
  dependencies: EcosystemDependencyStatus[];
}

export interface RegisterEcosystemRoutesOptions {
  config: EcosystemConfig;
}

function httpDependency(id: string, target: string | undefined, required = true): EcosystemDependencyStatus {
  return {
    id,
    kind: id === "monitoring-microservice" ? "monitoring" : "http",
    configured: Boolean(target),
    required,
    target
  };
}

function buildDependencyStatuses(config: EcosystemConfig): EcosystemDependencyStatus[] {
  return [
    httpDependency("auth-microservice", config.authServiceUrl),
    httpDependency("notifications-microservice", config.notificationsServiceUrl),
    httpDependency("docs-rag-microservice", config.docsRagServiceUrl),
    httpDependency("logging-microservice", config.loggingServiceUrl, false),
    httpDependency("monitoring-microservice", config.monitoringServiceUrl, false),
    {
      id: "db-server-postgres",
      kind: "postgres",
      configured: Boolean(config.database.host && config.database.name && config.database.user),
      required: true,
      target: config.database.host ? `${config.database.host}:${config.database.port}/${config.database.name ?? ""}` : undefined
    },
    {
      id: "db-server-redis",
      kind: "redis",
      configured: Boolean(config.redis.host),
      required: false,
      target: config.redis.host ? `${config.redis.host}:${config.redis.port}` : undefined
    }
  ];
}

export function registerEcosystemRoutes(
  app: FastifyInstance,
  options: RegisterEcosystemRoutesOptions
): void {
  app.get<{ Reply: EcosystemHealthResponse }>("/health/integrations", async () => {
    const dependencies = buildDependencyStatuses(options.config);
    const missingRequired = dependencies.some((dependency) => dependency.required && !dependency.configured);

    return {
      status: missingRequired ? "degraded" : "ok",
      service: "goalkeeper",
      timestamp: new Date().toISOString(),
      dependencies
    };
  });
}
