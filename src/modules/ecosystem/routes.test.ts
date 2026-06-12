import assert from "node:assert/strict";
import { test } from "node:test";
import { buildApp } from "../../app.js";
import { loadConfig } from "../../config/env.js";

test("GET /health/integrations reports configured ecosystem dependencies", async () => {
  const app = buildApp({
    config: loadConfig({
      HOST: "127.0.0.1",
      PORT: "3000",
      AUTH_SERVICE_URL: "http://auth-microservice.statex-apps.svc.cluster.local:3370",
      NOTIFICATIONS_SERVICE_URL: "http://notifications-microservice.statex-apps.svc.cluster.local:3368",
      DOCS_RAG_SERVICE_URL: "http://docs-rag-microservice.statex-apps.svc.cluster.local:3397",
      LOGGING_SERVICE_URL: "http://logging-microservice.statex-apps.svc.cluster.local:3367",
      MONITORING_SERVICE_URL: "http://monitoring-microservice.statex-apps.svc.cluster.local:3395",
      DB_HOST: "db-server-postgres",
      DB_PORT: "5432",
      DB_NAME: "goalkeeper",
      DB_USER: "dbadmin",
      REDIS_HOST: "db-server-redis",
      REDIS_PORT: "6379"
    })
  });

  const response = await app.inject({ method: "GET", url: "/health/integrations" });
  assert.equal(response.statusCode, 200);

  const payload = response.json();
  assert.equal(payload.status, "ok");
  assert.equal(payload.service, "goalkeeper");
  assert.equal(payload.dependencies.length, 7);
  assert.equal(payload.dependencies.every((dependency: { configured: boolean }) => dependency.configured), true);
});

test("GET /health/integrations degrades when required dependencies are missing", async () => {
  const app = buildApp({ config: loadConfig({ HOST: "127.0.0.1", PORT: "3000" }) });

  const response = await app.inject({ method: "GET", url: "/health/integrations" });
  assert.equal(response.statusCode, 200);

  const payload = response.json();
  assert.equal(payload.status, "degraded");
  assert.equal(
    payload.dependencies.some(
      (dependency: { id: string; required: boolean; configured: boolean }) =>
        dependency.id === "auth-microservice" && dependency.required && !dependency.configured
    ),
    true
  );
});
