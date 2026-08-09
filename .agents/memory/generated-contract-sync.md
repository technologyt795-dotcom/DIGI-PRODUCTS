---
name: Keep generated API contracts in sync
description: A settings field must exist in the OpenAPI contract and every generated request/response validator and type used by the client.
---

When a UI setting updates locally but does not persist, inspect the generated API request validator before changing the UI or database code. A stale generated contract can silently strip an otherwise valid field from the request.

**Why:** The hero background opacity control was wired in the UI and server, but the generated update schema omitted the field, so the value never reached persistence.

**How to apply:** Regenerate API clients after OpenAPI changes; if codegen is unavailable, update all affected generated validators/types consistently and restore codegen availability before the next contract change.