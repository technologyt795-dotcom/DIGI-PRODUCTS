---
name: Design subagent dynamic-hook bug
description: A specific invalid-hook-call bug pattern the design subagent has produced when trying to debounce state inside a page component.
---

When briefing/reviewing a DESIGN subagent's frontend output, check pages with search/debounce logic (e.g. a products listing page) for this bug pattern:

```tsx
import('react').then(({ useEffect }) => {
  useEffect(() => { ... }, [dep]);
});
```

This is an invalid hook call (hooks can't run inside a `.then()` callback) and throws "Invalid hook call" at runtime, breaking the whole page behind a Vite error overlay.

**Why:** The subagent seems to reach for a dynamic `import('react')` instead of a static import when adding `useEffect` after the fact, likely because it edited the component without updating the top-level import list.

**How to apply:** After a design subagent finishes a page with debounced search/filtering, grep the artifact's `src/pages` for `import('react')` before considering the work done. Fix by adding `useEffect` to the normal `import { ... } from 'react'` line and calling it directly in the component body.
