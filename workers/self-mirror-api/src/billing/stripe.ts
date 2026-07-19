import Stripe from 'stripe';
import type { Env } from '../env';

export const stripeFor = (env: Env) => new Stripe(env.STRIPE_SECRET_KEY, {
  httpClient: Stripe.createFetchHttpClient(),
  maxNetworkRetries: 2,
  timeout: 20_000,
});
