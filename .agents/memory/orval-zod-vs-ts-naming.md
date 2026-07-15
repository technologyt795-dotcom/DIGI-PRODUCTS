---
name: Orval codegen naming mismatch (Zod vs TS types)
description: Why imports from @workspace/api-zod use different names than @workspace/api-client-react for the same OpenAPI schema.
---

The orval codegen pipeline used for `lib/api-zod` and `lib/api-client-react` does NOT use the same naming convention for request-body schemas in both outputs, even though both are generated from the same `openapi.yaml`.

- `lib/api-client-react` (TS types, from `api.schemas.ts`) keeps the original OpenAPI component names, e.g. `CategoryInput`, `ProductInput`, `AdminLoginInput`.
- `lib/api-zod` (Zod validators) flattens referenced request bodies into **operation-based** names instead, e.g. `CreateCategoryBody`, `UpdateCategoryBody`, `CreateProductBody`, `UpdateProductBody`, `AdminLoginBody`.

**Why:** Discovered when backend route files imported `CategoryInput`/`ProductInput`/`AdminLoginInput` from `@workspace/api-zod` for `.safeParse()` calls — these names don't exist there, causing a build failure. The frontend imports of the same conceptual type from `@workspace/api-client-react` worked fine since that package does use the component name.

**How to apply:** When wiring a new admin/write endpoint, grep the actual generated file (`lib/api-zod/src/generated/api.ts`) for `export const <Verb><Entity>Body` rather than assuming the Zod schema name matches the OpenAPI `$ref`/component name.
