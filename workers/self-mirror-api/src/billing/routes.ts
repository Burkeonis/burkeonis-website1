import { z } from 'zod';
import Stripe from 'stripe';
import type { Env } from '../env';
import { requireFirebaseUser } from '../auth/firebase';
import { getEntitlement } from '../entitlements/repository';
import { json, safeError } from '../http';
import { recordEvent } from '../observability/events';
import { stripeFor } from './stripe';

const checkoutSchema = z.object({ cadence: z.enum(['monthly', 'yearly']) });

async function findOrCreateCustomer(env: Env, uid: string, email?: string) {
  const existing = await env.DB.prepare(
    'SELECT stripe_customer_id FROM users WHERE firebase_uid = ?',
  ).bind(uid).first<{ stripe_customer_id: string | null }>();
  if (existing?.stripe_customer_id) return existing.stripe_customer_id;

  const stripe = stripeFor(env);
  const customer = await stripe.customers.create({
    email,
    metadata: { firebase_uid: uid },
  });
  await env.DB.prepare(
    `INSERT INTO users (firebase_uid, stripe_customer_id, created_at, updated_at)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(firebase_uid) DO UPDATE SET stripe_customer_id = excluded.stripe_customer_id, updated_at = excluded.updated_at`,
  ).bind(uid, customer.id, Date.now(), Date.now()).run();
  return customer.id;
}

export async function checkout(request: Request, env: Env) {
  if (env.ENVIRONMENT === 'production') return safeError('LIVE_BILLING_DISABLED', 503);
  if (env.BILLING_ENABLED !== 'true') return safeError('BILLING_DISABLED', 503);
  const user = await requireFirebaseUser(request, env);
  if (!user.emailVerified) return safeError('EMAIL_VERIFICATION_REQUIRED', 403);
  const parsed = checkoutSchema.safeParse(await request.json());
  if (!parsed.success) return safeError('INVALID_CHECKOUT_REQUEST', 400);

  const customer = await findOrCreateCustomer(env, user.uid, user.email);
  const price = parsed.data.cadence === 'monthly'
    ? env.STRIPE_MONTHLY_PRICE_ID
    : env.STRIPE_YEARLY_PRICE_ID;
  const session = await stripeFor(env).checkout.sessions.create({
    mode: 'subscription',
    customer,
    line_items: [{ price, quantity: 1 }],
    success_url: `${env.APP_ORIGIN}/self-mirror/?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${env.APP_ORIGIN}/self-mirror/?checkout=cancelled`,
    client_reference_id: user.uid,
    allow_promotion_codes: true,
    subscription_data: { metadata: { firebase_uid: user.uid } },
    metadata: { firebase_uid: user.uid, cadence: parsed.data.cadence },
  });
  return json({ url: session.url });
}

export async function portal(request: Request, env: Env) {
  if (env.ENVIRONMENT === 'production') return safeError('LIVE_BILLING_DISABLED', 503);
  const user = await requireFirebaseUser(request, env);
  const row = await env.DB.prepare(
    'SELECT stripe_customer_id FROM users WHERE firebase_uid = ?',
  ).bind(user.uid).first<{ stripe_customer_id: string | null }>();
  if (!row?.stripe_customer_id) return safeError('NO_BILLING_ACCOUNT', 404);
  const session = await stripeFor(env).billingPortal.sessions.create({
    customer: row.stripe_customer_id,
    return_url: `${env.APP_ORIGIN}/self-mirror/?billing=returned`,
  });
  return json({ url: session.url });
}

export async function status(request: Request, env: Env) {
  const user = await requireFirebaseUser(request, env);
  const entitlement = await getEntitlement(env, user.uid);
  return json({ entitlement });
}

function subscriptionValues(subscription: Stripe.Subscription) {
  const value = subscription as Stripe.Subscription & {
    current_period_end?: number;
    current_period_start?: number;
  };
  const priceId = subscription.items.data[0]?.price.id;
  return {
    uid: subscription.metadata.firebase_uid,
    customerId: typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id,
    subscriptionId: subscription.id,
    status: subscription.status,
    currentPeriodEnd: value.current_period_end ?? null,
    cancelAtPeriodEnd: subscription.cancel_at_period_end ? 1 : 0,
    cadence: priceId,
  };
}

async function syncSubscription(env: Env, subscription: Stripe.Subscription) {
  const values = subscriptionValues(subscription);
  let uid: string | undefined = values.uid || undefined;
  if (!uid) {
    const user = await env.DB.prepare(
      'SELECT firebase_uid FROM users WHERE stripe_customer_id = ?',
    ).bind(values.customerId).first<{ firebase_uid: string }>();
    uid = user?.firebase_uid;
  }
  if (!uid) throw new Error('STRIPE_UID_MISSING');
  const resolvedUid = uid;

  const active = ['active', 'trialing'].includes(values.status);
  const plan = active ? 'pro' : 'free';
  await env.DB.batch([
    env.DB.prepare(
      `INSERT INTO users (firebase_uid, stripe_customer_id, created_at, updated_at)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(firebase_uid) DO UPDATE SET stripe_customer_id = excluded.stripe_customer_id, updated_at = excluded.updated_at`,
    ).bind(resolvedUid, values.customerId, Date.now(), Date.now()),
    env.DB.prepare(
      `INSERT INTO entitlements (
        firebase_uid, stripe_subscription_id, plan, subscription_status,
        current_period_end, cancel_at_period_end, last_webhook_update, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(firebase_uid) DO UPDATE SET
        stripe_subscription_id = excluded.stripe_subscription_id,
        plan = excluded.plan,
        subscription_status = excluded.subscription_status,
        current_period_end = excluded.current_period_end,
        cancel_at_period_end = excluded.cancel_at_period_end,
        last_webhook_update = excluded.last_webhook_update,
        updated_at = excluded.updated_at`,
    ).bind(
      resolvedUid, values.subscriptionId, plan, values.status, values.currentPeriodEnd,
      values.cancelAtPeriodEnd, Date.now(), Date.now(),
    ),
  ]);
}

export async function webhook(request: Request, env: Env) {
  const signature = request.headers.get('stripe-signature');
  if (!signature) return safeError('INVALID_WEBHOOK_SIGNATURE', 400);
  const rawBody = await request.text();
  let event: Stripe.Event;
  try {
    event = await verifyStripeEvent(rawBody, signature, env);
  } catch {
    await recordEvent(env, 'stripe_webhook_failed', 'invalid_signature');
    return safeError('INVALID_WEBHOOK_SIGNATURE', 400);
  }

  const duplicate = await env.DB.prepare(
    'SELECT stripe_event_id FROM webhook_events WHERE stripe_event_id = ?',
  ).bind(event.id).first();
  if (duplicate) return json({ received: true, duplicate: true });

  try {
    if (event.type.startsWith('customer.subscription.')) {
      await syncSubscription(env, event.data.object as Stripe.Subscription);
    } else if (event.type === 'invoice.payment_failed' || event.type === 'invoice.paid') {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId = typeof invoice.parent?.subscription_details?.subscription === 'string'
        ? invoice.parent.subscription_details.subscription
        : invoice.parent?.subscription_details?.subscription?.id;
      if (subscriptionId) {
        const subscription = await stripeFor(env).subscriptions.retrieve(subscriptionId);
        await syncSubscription(env, subscription);
      }
    }
    await env.DB.prepare(
      `INSERT INTO webhook_events (stripe_event_id, event_type, processed_at, processing_status)
       VALUES (?, ?, ?, 'processed')`,
    ).bind(event.id, event.type, Date.now()).run();
    await recordEvent(env, 'stripe_webhook_processed', event.type);
    return json({ received: true });
  } catch {
    await recordEvent(env, 'stripe_webhook_failed', event.type);
    return safeError('WEBHOOK_PROCESSING_FAILED', 500);
  }
}

export const verifyStripeEvent = (rawBody: string, signature: string, env: Env) =>
  stripeFor(env).webhooks.constructEventAsync(
    rawBody,
    signature,
    env.STRIPE_WEBHOOK_SECRET,
    undefined,
    Stripe.createSubtleCryptoProvider(),
  );
