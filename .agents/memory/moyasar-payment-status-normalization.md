---
name: Moyasar payment status normalization
description: Moyasar callbacks can vary payment status casing and use authorized/captured states.
---

Normalize the gateway status before comparing it. Treat `paid` and `captured` as successful, and treat `authorized` as successful only when the gateway response is explicitly `APPROVED` and order metadata, amount, and currency all match.

**Why:** The storefront previously displayed a payment as failed when Moyasar/bank data indicated approval through a different status representation.

**How to apply:** Keep the integrity checks server-side; never mark an order paid from the approval message alone.

Moyasar verification returns HTTP 401 with `Invalid authorization credentials` when the configured secret is rejected, even if the publishable and secret keys are both intended for Test. Trimming whitespace does not fix a genuinely invalid, revoked, or wrong-type key.

**Why:** Payment creation can still open the hosted form with the publishable key, while server-side retrieval fails with the secret key.

**How to apply:** Confirm the secret is the Moyasar Test Secret Key (not the publishable key), replace/regenerate it in workspace Secrets, restart the API, and create a new payment.