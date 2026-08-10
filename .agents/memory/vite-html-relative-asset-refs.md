---
name: Vite HTML relative asset references
description: Relative directory-like references in the HTML shell can make Vite treat a directory as a build asset.
---

When the Vite artifact uses a required `BASE_PATH`, keep module, favicon, and other source asset references in the HTML shell in the project's normal root-relative form; generate canonical URLs at runtime instead of using `./` placeholders.

**Why:** Vite can fail with `EISDIR` when it tries to process a directory-like relative reference such as `./` or a relative source path during production build.

**How to apply:** If the production origin is unavailable, do not invent it in static SEO tags. Use safe default metadata in `index.html` and set canonical/Open Graph URLs dynamically from the current origin after the app loads.