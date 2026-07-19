# Self Mirror release tests

- Root site and every existing static page load.
- RAD link and external RAD application remain unchanged and functional.
- `/self-mirror` redirects to `/self-mirror/`.
- Free Mirror mode works anonymously within its Worker-enforced quota.
- Mediator, Abyss and Builder reject anonymous and Free requests server-side.
- Firebase email/password, reset and Google sign-in work on the preview hostname.
- Monthly and yearly Stripe test Checkout sessions complete with `4242 4242 4242 4242`.
- Decline behavior is tested with Stripe's current official test cards.
- Signed webhooks update D1; invalid signatures fail.
- Cancellation, period-end cancellation, failed payment and expiration return access to Free.
- Customer Portal opens only for the authenticated mapped customer.
- IndexedDB migration, selective deletion and complete deletion work.
- Encrypted backup round-trip works; wrong passwords fail safely.
- Ollama connection and unavailable/CORS states never trigger cloud fallback.
- Browser source and network responses contain no private service secrets.
- Mobile layouts, keyboard navigation, focus visibility and reduced motion are verified.
