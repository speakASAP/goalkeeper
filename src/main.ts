import { buildApp } from "./app.js";
import { loadConfig } from "./config/env.js";

const config = loadConfig();
const app = buildApp();

try {
  await app.listen({
    host: config.host,
    port: config.port
  });

  app.log.info(`GoalKeeper listening on http://${config.host}:${config.port}`);
} catch (error) {
  app.log.error(error);
  console.error(error);
  process.exit(1);
}
