# Self Mirror test configuration

## Cloudflare secrets

Set these with `wrangler secret put NAME --env test`:

- `GEMINI_API_KEY`
- `STRIPE_SECRET_KEY` using a Stripe `sk_test_` key only
- `STRIPE_WEBHOOK_SECRET` using the test endpoint `whsec_` secret
- `ANON_SESSION_SECRET` generated from at least 32 random bytes
- `TURNSTILE_SECRET_KEY` when Turnstile enforcement is enabled

Never commit these values.

## Cloudflare variables

- `FIREBASE_PROJECT_ID`
- `STRIPE_MONTHLY_PRICE_ID`
- `STRIPE_YEARLY_PRICE_ID`
- `APP_ORIGIN`
- `AI_PROVIDER`
- `AI_MODEL`
- `DOCTRINE_VERSION`
- `FREE_REQUEST_LIMIT`
- `PRO_REQUEST_LIMIT`
- `INPUT_COST_MICROS_PER_MILLION`
- `OUTPUT_COST_MICROS_PER_MILLION`
- feature flags from `wrangler.toml`

## Firebase web configuration

Copy `self-mirror/.env.example` to `.env.local` for local testing. Firebase web configuration is public configuration, but Firebase Admin credentials must never be added.

Enable Email/Password and Google providers. Add `burkeonis.com` and the preview domain as authorized domains.

## Stripe test products

Create one product named `Self Mirror Pro` with two recurring test prices:

- Monthly recurring price
- Yearly recurring price

Copy their `price_` identifiers into the Worker test variables. Configure a test Customer Portal and a webhook endpoint for:

- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.paid`
- `invoice.payment_failed`

Webhook target: `/api/self-mirror/billing/webhook`.
