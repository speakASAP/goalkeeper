# Business: goalkeeper

## Goal

Build a Telegram-first project operating system that preserves owner intent from request through planning, execution, validation, and final reporting across multiple AI executors and tools.

## Constraints

- Telegram is the primary control plane; dashboard surfaces are secondary.
- Coding work must stop when the IPS chain is incomplete, draft-only, or contains execution-critical `[MISSING: ...]` markers.
- Do not commit secrets, raw production data, or real Telegram credentials.
- Deployment remains approval-gated by the repository runbook.

## Consumers

The owner and approved operators coordinating multi-project autonomous execution through Telegram.

## SLA

- Local health: `http://127.0.0.1:3000/health`
- Production URL: `https://goalkeeper.alfares.cz`
- Internal URL: `http://goalkeeper.statex-apps.svc.cluster.local:3392`
