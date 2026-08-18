---
name: Orval codegen input validation
description: Durable safeguards for OpenAPI code generation in this workspace.
---

Validate the OpenAPI document before running Orval, especially after editing YAML schemas. A duplicate YAML key can cause Orval to clean generated folders and then fail while resolving the input. Keep the Orval input path stable and verify the parsed document before regenerating.

**Why:** Orval cleans its configured output directories before parsing/generating; an invalid YAML document can therefore leave tracked generated clients temporarily missing.

**How to apply:** Run a YAML parse check and `pnpm --filter @workspace/api-spec run codegen` after OpenAPI changes. If the workspace runner cannot resolve the relative input, use the config's resolved path rather than changing generated files manually.