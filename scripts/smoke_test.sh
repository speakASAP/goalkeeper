#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-http://127.0.0.1:3000}"
HEALTH_URL="${BASE_URL%/}/health"
NODE_BIN="${NODE_BIN:-node}"

"${NODE_BIN}" - "${HEALTH_URL}" <<'NODE'
const healthUrl = process.argv[2];

try {
  const response = await fetch(healthUrl, {
    headers: {
      "cache-control": "no-cache"
    }
  });
  const body = await response.json().catch(() => ({}));

  if (response.status !== 200 || body.status !== "ok" || body.service !== "goalkeeper") {
    console.error(
      JSON.stringify(
        {
          status: "failed",
          url: healthUrl,
          httpStatus: response.status,
          service: body.service ?? null,
          healthStatus: body.status ?? null
        },
        null,
        2
      )
    );
    process.exit(1);
  }

  console.log(
    JSON.stringify(
      {
        status: "passed",
        url: healthUrl,
        httpStatus: response.status,
        service: body.service,
        healthStatus: body.status
      },
      null,
      2
    )
  );
} catch (error) {
  console.error(
    JSON.stringify(
      {
        status: "failed",
        url: healthUrl,
        error: error instanceof Error ? error.message : String(error)
      },
      null,
      2
    )
  );
  process.exit(1);
}
NODE
