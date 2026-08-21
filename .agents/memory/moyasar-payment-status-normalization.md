---
name: Moyasar payment status normalization
description: Moyasar callbacks can vary payment status casing and use authorized/captured states.
---

Normalize the gateway status before comparing it. Treat `paid` and `captured` as successful, and treat `authorized` as successful only when the gateway response is explicitly `APPROVED` and order metadata, amount, and currency all match.

**Why:** The storefront previously displayed a payment as failed when Moyasar/bank data indicated approval through a different status representation.

**How to apply:** Keep the integrity checks server-side; never mark an order paid from the approval message alone.