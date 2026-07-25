# Burkeonis Security Baseline

Burkeonis handles private reflection, grief, relationship, recovery, and creative material. Security and privacy are release requirements, not optional polish.

## Current public-site controls

- HTTPS enforced by Cloudflare.
- HSTS enabled.
- Content Security Policy blocks third-party scripts and connections by default.
- Framing is denied to reduce clickjacking risk.
- Browser permissions such as camera, microphone, geolocation, USB, and payment are disabled unless a future feature explicitly requires them.
- Self Mirror screenshot OCR and text analysis run in the browser. Files are not uploaded by the static site.
- Private interactive pages use no-store cache rules.
- No Stripe secret key may appear in this repository or any browser-delivered file.

## Payment and membership release blockers

Paid access must not be implemented by hiding links or trusting browser storage. Before live sales begin, the Atlas backend must provide all of the following:

1. Stripe Checkout Sessions created server-side.
2. Stripe webhook signature verification using the raw request body.
3. Idempotent webhook processing using Stripe event IDs.
4. Membership state stored server-side and tied to the authenticated user.
5. Entitlement checks performed server-side for every protected resource or action.
6. Customer Portal access created server-side for cancellation and billing changes.
7. No trust in price IDs, plan names, payment status, or roles supplied by the browser.
8. Rate limits for authentication, AI requests, uploads, and checkout creation.
9. Secure cookies using HttpOnly, Secure, SameSite, short-lived sessions, and rotation after authentication.
10. Audit logs for sign-in, subscription changes, entitlement changes, exports, and destructive actions.

## Data rules

- Collect the minimum data needed for the requested feature.
- Do not use private journals, grief writing, uploaded conversations, or Vault files for advertising.
- Do not expose one user's records to another user through predictable IDs.
- Validate file type, file size, ownership, and authorization on the server before accepting or returning uploads.
- Encrypt sensitive stored content at rest and in transit.
- Provide account export and deletion paths before public launch.
- Keep production, preview, and development data separated.

## Secrets

Secrets belong in encrypted environment variables or the Cloudflare secret store. Never commit:

- Stripe secret or restricted keys
- Stripe webhook secrets
- database credentials
- session signing secrets
- private API keys
- service-account credentials

If a secret is exposed, remove it from use immediately and rotate it. Deleting it from the latest commit is not sufficient because Git history may retain it.

## Reporting a vulnerability

Do not publish exploitable security details in a public issue. Contact `hello@burkeonis.com` with the affected URL, steps to reproduce, impact, and any supporting evidence.
