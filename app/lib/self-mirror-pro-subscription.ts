import { SELF_MIRROR_PRO_CODE, getSelfMirrorProEntitlement, upsertSelfMirrorProEntitlement } from "./commerce.ts";
import type { CommerceBindings } from "./commerce.ts";

type StripeSubscription = {
  id: string;
  livemode: boolean;
  customer: string;
  status: string;
  created: number;
  current_period_end?: number;
  metadata?: { product_code?: string };
};

async function retrieveSubscription(id: string, secretKey: string, live: boolean, customerId?: string): Promise<StripeSubscription | null> {
  try {
    const response = await fetch(`https://api.stripe.com/v1/subscriptions/${encodeURIComponent(id)}`, {
      headers: { Authorization: `Basic ${btoa(`${secretKey}:`)}` },
    });
    if (!response.ok) return null;
    const subscription = await response.json() as StripeSubscription | null;
    if (!subscription || subscription.id !== id || subscription.livemode !== live ||
        typeof subscription.customer !== "string" || !subscription.customer ||
        (customerId !== undefined && subscription.customer !== customerId) ||
        typeof subscription.status !== "string" || !subscription.status ||
        subscription.metadata?.product_code !== SELF_MIRROR_PRO_CODE ||
        !Number.isSafeInteger(subscription.created) || subscription.created <= 0) return null;
    return subscription;
  } catch {
    return null;
  }
}

// Both Checkout and lifecycle events reconcile through the same ownership rule.
// null means verification/contention failed and the webhook must be retried.
export async function syncSelfMirrorProSubscription(
  db: NonNullable<CommerceBindings["COMMERCE_DB"]>,
  input: { subscriptionId: string; secretKey: string; live: boolean; customerId?: string; email?: string | null },
): Promise<{ outcome: "applied" | "ignored"; status: string } | null> {
  const subscription = await retrieveSubscription(input.subscriptionId, input.secretKey, input.live, input.customerId);
  if (!subscription) return null;

  for (let attempt = 0; attempt < 5; attempt++) {
    const current = await getSelfMirrorProEntitlement(db, subscription.customer);
    if (current && current.subscriptionId !== subscription.id) {
      const owner = await retrieveSubscription(current.subscriptionId, input.secretKey, input.live, subscription.customer);
      if (!owner) return null;
      // Only Stripe subscription creation time establishes a newer owner.
      // Equal timestamps are ambiguous; keep the existing entitlement intact.
      if (subscription.created <= owner.created) return { outcome: "ignored", status: subscription.status };
    }

    const applied = await upsertSelfMirrorProEntitlement(db, {
      customerId: subscription.customer,
      email: input.email,
      subscriptionId: subscription.id,
      status: subscription.status,
      currentPeriodEnd: subscription.current_period_end ? new Date(subscription.current_period_end * 1000).toISOString() : null,
    }, current?.subscriptionId ?? null);
    if (applied) return { outcome: "applied", status: subscription.status };
  }
  return null;
}
