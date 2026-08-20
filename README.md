# burkeonis-website1

The Burkeonis website: a [vinext](https://github.com/cloudflare/vinext)
(Next.js on Vite) app that deploys to **Cloudflare Workers** and sells
digital products ("The Pattern Files" / "Shadow Work Protocol") through a
**Stripe Checkout** commerce flow backed by Cloudflare **D1** (orders) and
**R2** (product files).

## Prerequisites

- Node.js `>=22.13.0`
- A Cloudflare account with Workers, D1, and R2 access (for deploys)
- A Stripe account (test and live modes) for commerce

## Stack

- **Framework:** [vinext](https://github.com/cloudflare/vinext) (Next.js API compatibility layer running on Vite + Cloudflare's Vite plugin)
- **Hosting:** Cloudflare Workers, configured in [`wrangler.jsonc`](./wrangler.jsonc)
  - `main`: `dist/server/index.js` (the built Worker entry)
  - `assets`: `dist/client` (the built static/client output)
  - D1 binding `COMMERCE_DB` — stores orders and fulfillment state
  - R2 binding `PRODUCT_FILES` — stores the purchasable ZIP files
- **Payments:** Stripe Checkout + webhooks (`app/api/checkout`, commerce logic in `app/lib/commerce.ts`)
- **Downloads:** signed, time-limited download tokens (`app/api/download`)

Deploys happen automatically via Cloudflare's Git integration when `main` is
pushed. There is no separate CI pipeline in this repo beyond the build/test
scripts below.

## Environment configuration (Cloudflare Worker bindings)

Configured in the Cloudflare dashboard under **Workers & Pages → Settings →
Variables and Secrets** (not committed to git). Non-secret values that are
safe to keep in source control live in `wrangler.jsonc`'s `vars` block;
everything else is set directly in the Cloudflare dashboard per environment
(test vs. live Stripe keys differ).

**Secrets** (encrypted, dashboard-only):
- `STRIPE_SECRET_KEY` — Stripe secret key for the active mode (test/live)
- `STRIPE_WEBHOOK_SECRET` — signing secret for the `checkout.session.completed` webhook
- `DOWNLOAD_TOKEN_SECRET` — HMAC secret used to sign download tokens

**Plain vars** (see `wrangler.jsonc`, or override per-environment in the dashboard):
- `STRIPE_PATTERN_FILES_PRICE_ID` — Stripe Price ID for the base product
- `STRIPE_SHADOW_WORK_PRICE_ID` — Stripe Price ID for the order-bump product
- `PATTERN_FILES_OBJECT_KEY` — R2 object key for the base ZIP
- `PATTERN_FILES_WITH_SHADOW_OBJECT_KEY` — R2 object key for the bundled ZIP

## Included Shape

- `app/` — site code (pages, API routes, commerce UI)
- `app/lib/commerce.ts` — Stripe session creation, webhook signature verification, download token signing/verification, and the `configurationProblem()` check that reports missing bindings
- `app/api/checkout/` — creates the Stripe Checkout session
- `app/api/download/` — verifies a download token and streams the file from R2
- `db/` — Drizzle schema/client for the D1-backed orders table
- `wrangler.jsonc` — the Cloudflare Worker configuration (bindings, vars)

## Diagnostic Commands

- `npm run install:ci` — bounded, non-retrying lockfile install
- `npm run dev` — start the local Vite/vinext dev server
- `npm run build` — build and validate the deployable artifact
- `npm run start` — run the built app locally
- `npm test` — build, then run the rendered-HTML checks
- `npm run validate:artifact` — recheck an existing build artifact
- `npm run db:generate` — generate Drizzle migrations after schema changes

## Learn More

- [vinext Documentation](https://github.com/cloudflare/vinext)
- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Drizzle D1 Guide](https://orm.drizzle.team/docs/get-started/d1-new)
- [Stripe Checkout Documentation](https://docs.stripe.com/checkout)

