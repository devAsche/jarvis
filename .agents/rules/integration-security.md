---
trigger: model_decision
description: "Activate when touching external APIs, email, storefronts, customer data, billing, approval flows, jobs or webhooks."
---
# Integration and security rule

Read `docs/04_SECURITY.md`, `docs/05_DATA_AND_API.md`, `docs/06_INTEGRATIONS.md`. Default MOCK/READ_ONLY; side effects use separately verified authorization; never infer connection from a ChatGPT plugin; never persist secrets or raw customer payload in logs. Implement schema validation, idempotency, stale-state and failure-path tests before considering production connection. Require human approval for external writes or paid API activation.
