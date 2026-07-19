# Test deployment

No production deployment is authorized.

1. Create the test D1 database.
2. Replace the test D1 ID in `workers/self-mirror-api/wrangler.toml`.
3. Apply `migrations/0001_initial.sql` to the remote test database.
4. Add Worker test variables and secrets.
5. Deploy the Worker with `npm run deploy:test` from `workers/self-mirror-api`.
6. Route the test Worker to `/api/self-mirror/*` on a preview/test hostname.
7. Configure Cloudflare Pages build command as `npm run pages:build` and output directory as `dist`.
8. Add Firebase web configuration to the Pages preview environment.
9. Register the Stripe test webhook URL.
10. Complete the test checklist before requesting production approval.
