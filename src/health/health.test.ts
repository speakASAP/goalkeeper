import assert from "node:assert/strict";
import { test } from "node:test";
import { buildApp, type HealthResponse } from "../app.js";

test("GET /health returns service status", async () => {
  const app = buildApp();

  const response = await app.inject({
    method: "GET",
    url: "/health"
  });

  assert.equal(response.statusCode, 200);

  const body = response.json<HealthResponse>();
  assert.equal(body.status, "ok");
  assert.equal(body.service, "goalkeeper");
  assert.match(body.timestamp, /^\d{4}-\d{2}-\d{2}T/);
});
