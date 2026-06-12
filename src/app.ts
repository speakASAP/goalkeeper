import Fastify, { type FastifyInstance } from "fastify";
import { loadConfig, type AppConfig } from "./config/env.js";
import { registerDashboardRoutes } from "./modules/dashboard/routes.js";
import { registerTelegramRoutes } from "./modules/telegram/routes.js";

export interface HealthResponse {
  status: "ok";
  service: "goalkeeper";
  timestamp: string;
}

export interface BuildAppOptions {
  config?: AppConfig;
}

export function buildApp(options: BuildAppOptions = {}): FastifyInstance {
  const config = options.config ?? loadConfig();
  const app = Fastify({
    logger: false
  });

  app.get<{ Reply: HealthResponse }>("/health", async () => ({
    status: "ok",
    service: "goalkeeper",
    timestamp: new Date().toISOString()
  }));

  registerDashboardRoutes(app);
  registerTelegramRoutes(app, { config: config.telegram });

  return app;
}
