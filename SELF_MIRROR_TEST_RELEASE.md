# Self Mirror integration TEST-mode release notes

Branch: `integration/self-mirror-ai-pro`. Do not merge or deploy before a build and an authorized TEST-mode end-to-end run.

## Cloudflare Worker

- `wrangler.jsonc` binds Workers AI as `AI`, D1 as `COMMERCE_DB`, static assets as `ASSETS`, and product R2 as `PRODUCT_FILES`.
- Set secret `SELF_MIRROR_RATE_LIMIT_SECRET` to a new unpredictable value of at least 32 characters. Do not use the Stripe or session secret. The endpoint fails closed without it or D1.
- Set secret `SELF_MIRROR_SESSION_SECRET` to an independent strong value for signed Pro cookies.
- Optional Worker variables `SELF_MIRROR_FREE_DAILY_LIMIT` (1–3, default 3) and `SELF_MIRROR_PRO_DAILY_LIMIT` (1–30, default 30) can lower limits. Invalid or higher values fail closed.
- The route uses `@cf/meta/llama-3.3-70b-instruct-fp8-fast` with Workers AI `json_schema` response format. Test this against the actual bound runtime before release.
- D1 lazily creates `self_mirror_reflection_usage`; its unique subject/day row is incremented atomically. Rows older than two UTC days are deleted during requests.

Anonymous preview identity is the Cloudflare-supplied `CF-Connecting-IP` header, HMAC-SHA-256 hashed with the rate-limit secret. Raw IPs and Reflection content are never placed in D1 or analytics. People sharing an IP share the three-use allowance. VPNs and rotating IPs can evade this limit; Cloudflare edge/WAF controls may be needed for broad abuse. Missing IP fails closed unless a verified active Pro session identifies the customer. Pro keys are HMACs of the verified Stripe customer ID. Every Pro request rechecks the D1 entitlement; a browser `pro` value has no authority. Each accepted attempt consumes allowance even if AI later fails, protecting cost.

## Stripe TEST mode

- `STRIPE_SECRET_KEY`: `sk_test_` key.
- `STRIPE_WEBHOOK_SECRET`: matching TEST endpoint signing secret.
- `STRIPE_SELF_MIRROR_PRO_PRICE_ID`: recurring TEST price. Do not set a live price against a test key.
- Deliver `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `customer.subscription.created`, `customer.subscription.updated`, and `customer.subscription.deleted` to `/api/webhooks/stripe`.
- Keep existing one-time commerce: `DOWNLOAD_TOKEN_SECRET`, `STRIPE_PATTERN_FILES_PRICE_ID`, optional `STRIPE_SHADOW_WORK_PRICE_ID`, `PATTERN_FILES_OBJECT_KEY`, `PATTERN_FILES_WITH_SHADOW_OBJECT_KEY`, `COMMERCE_DB`, and `PRODUCT_FILES`. Existing product-specific prices in commerce code remain unchanged.

The Pro checkout return visits `/api/self-mirror/session`, which retrieves the Checkout Session from Stripe and requires an active/trialing D1 entitlement before setting a 30-day signed, HttpOnly, Secure, SameSite=Lax cookie. The entitlement endpoint verifies that cookie and rechecks D1 each time. Subscription lifecycle webhooks retrieve current Stripe state before updating D1, so delayed events cannot restore stale active access. Cancellation or deletion updates the entitlement; inactive statuses deny Pro. If Stripe retrieval fails, the webhook returns a retryable error. The public Pro purchase CTA remains hidden.

## Verification gate

Run `npm ci`, the focused Node tests, browser syntax checks, and `npx next build` in an environment with npm registry access. Then test Workers AI and Stripe webhook/session/entitlement behavior on a nonproduction TEST-mode runtime, without a real charge. This branch has not passed the combined build or live binding test.
