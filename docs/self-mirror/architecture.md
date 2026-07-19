# Self Mirror architecture

Self Mirror is a local-first application served at `/self-mirror/`.

- IndexedDB stores reflections, sessions, memory, settings and Mirror Test results.
- Firebase Authentication supplies identity only.
- Cloudflare D1 stores user-to-Stripe mapping, entitlements, quotas and operational events.
- The Cloudflare Worker verifies identity, quota and entitlement before calling an interchangeable AI provider.
- Stripe Checkout and Customer Portal handle payment data in test mode.
- Ollama communicates directly from the browser to the user's local Ollama process and never silently falls back to cloud AI.

Private reflection bodies are not stored in Firebase, D1, Stripe or Worker logs.

Doctrine version `1.0.0` is attached to structured reflections. The Worker is the authority for the production doctrine and provider selection.
