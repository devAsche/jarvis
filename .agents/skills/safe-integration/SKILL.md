---
name: safe-integration
description: Use when adding or reviewing Shopify, Gmail, Calendar, TickTick, voice, supplier or other external APIs, webhooks and job automation in JARVIS.
---
# Safe provider integration

1. Read `docs/04_SECURITY.md`, `docs/05_DATA_AND_API.md`, `docs/06_INTEGRATIONS.md`.
2. Check current official API, required scopes/terms/rate limits and whether credential configuration is actually present. Never claim ChatGPT plugin auth equals local app access.
3. Write fixture and contract tests **before** external requests. Keep `fetch` and external `execute` as separate interfaces.
4. For events: verify provider signature/raw body → validate → dedupe → persist → queue → log. Unknown status=unknown, not success.
5. Start read-only. External writes, new spend and live publish require reviewed design and authenticated human approval. Test duplication, TTL, payload mutation, retry and kill-switch.
6. Redact private data, token and PII in code, logs, tests and screenshots; request permission before any paid/new connection.
