import assert from "node:assert/strict";
import { test } from "node:test";
import { parseTelegramCommand } from "./commands.js";

test("parses supported commands and arguments", () => {
  assert.deepEqual(parseTelegramCommand("/goal Build the MVP"), {
    kind: "command",
    command: "goal",
    args: "Build the MVP"
  });

  assert.deepEqual(parseTelegramCommand("/register_project goalkeeper /srv/goalkeeper"), {
    kind: "command",
    command: "register_project",
    args: "goalkeeper /srv/goalkeeper"
  });

  assert.deepEqual(parseTelegramCommand("/overnight enable"), {
    kind: "command",
    command: "overnight",
    args: "enable"
  });

  assert.deepEqual(parseTelegramCommand("/task_log task-123"), {
    kind: "command",
    command: "task_log",
    args: "task-123"
  });

  assert.deepEqual(parseTelegramCommand("/backup_export project-1"), {
    kind: "command",
    command: "backup_export",
    args: "project-1"
  });

  assert.deepEqual(parseTelegramCommand("/deployment_readiness"), {
    kind: "command",
    command: "deployment_readiness",
    args: ""
  });
});

test("parses bot mentions and normalizes command casing", () => {
  assert.deepEqual(parseTelegramCommand("/Projects@GoalKeeperBot"), {
    kind: "command",
    command: "projects",
    args: ""
  });

  assert.deepEqual(parseTelegramCommand("/Agents@GoalKeeperBot"), {
    kind: "command",
    command: "agents",
    args: ""
  });

  assert.deepEqual(parseTelegramCommand("/Smoke_Test@GoalKeeperBot http://127.0.0.1:3000"), {
    kind: "command",
    command: "smoke_test",
    args: "http://127.0.0.1:3000"
  });
});

test("returns unknown command and plain text results", () => {
  assert.deepEqual(parseTelegramCommand("/deploy now"), {
    kind: "unknown",
    command: "deploy",
    args: "now"
  });

  assert.deepEqual(parseTelegramCommand("show status"), {
    kind: "text",
    text: "show status"
  });
});
