---
name: Artifact secret refresh
description: Secret changes may require restarting the managed artifact workflow before backend routes can read them.
---

When a managed backend reports a configured secret as missing or rejects a value unexpectedly, restart its artifact workflow before changing application logic.

**Why:** The running process can retain its previous environment snapshot even after a secret is added or updated.

**How to apply:** Confirm secret existence without reading its value, restart the exact managed workflow, then verify the protected endpoint with the secret supplied through the environment.