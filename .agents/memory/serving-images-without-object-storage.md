---
name: Serving images without object storage
description: How to make generated/seed product or content images reachable by the frontend when there is no object storage integration set up.
---

When a fullstack artifact needs real images for seeded catalog/demo data (e.g. product photos) but no object-storage integration is configured, don't embed images as base64 or reference `attached_assets/` paths directly in API responses — the frontend can't fetch those over HTTP.

Instead:
1. Copy the generated/uploaded images into the api-server's own `public/images/...` directory.
2. Add `express.static(...)` middleware in the api-server's `app.ts` mounted at `/api/images` (or similar), alongside the existing `/api` router mount.
3. Store the resulting path (e.g. `/api/images/products/foo.jpg`) as the image URL in the database and return it as-is in API responses.

**Why:** The frontend and api-server are separate services behind a shared proxy; the api-server already owns the `/api` base path, so serving static assets from within that same base path avoids needing any `BASE_URL`-prefix gymnastics on the frontend and works identically in dev and prod.

**How to apply:** Any time you seed a fullstack artifact with real (generated or uploaded) images and there's no object-storage/S3-style integration in play.
