import Stripe from 'stripe';
import { describe, expect, it } from 'vitest';
import { verifyStripeEvent } from '../src/billing/routes';
import type { Env } from '../src/env';

const webhookSecret = 'whsec_test_self_mirror_signature';
const stripe = new Stripe('sk_test_local_only', { httpClient: Stripe.createFetchHttpClient() });
const env = {
  STRIPE_SECRET_KEY: 'sk_test_local_only',
  STRIPE_WEBHOOK_SECRET: webhookSecret,
} as Env;

describe('Stripe webhook verification', () => {
  it('accepts an event signed with the configured test secret', async () => {
    const payload = JSON.stringify({ id: 'evt_test', object: 'event', type: 'customer.subscription.updated' });
    const signature = stripe.webhooks.generateTestHeaderString({ payload, secret: webhookSecret });
    await expect(verifyStripeEvent(payload, signature, env)).resolves.toMatchObject({ id: 'evt_test' });
  });

  it('rejects an invalid signature', async () => {
    const payload = JSON.stringify({ id: 'evt_bad', object: 'event' });
    await expect(verifyStripeEvent(payload, 't=1,v1=bad', env)).rejects.toThrow();
  });
});
