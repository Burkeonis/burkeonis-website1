import { ORDER_BUMP_CODE, PRIMARY_PRODUCT_CODE, getCommerceBindings, recordAnalyticsEvent, recordPaidOrder, verifyStripeSignature } from "../../../lib/commerce";

export const dynamic = "force-dynamic";

type StripeEvent = { id?: string; type?: string; data?: { object?: { id?: string } } };
type StripeCheckoutSession = { id?: string; livemode?: boolean; payment_status?: string; customer?: string | null; customer_details?: { email?: string | null } | null; metadata?: Record<string, string | undefined> | null };

function text(body: string, status: number): Response {
  return new Response(body, { status, headers: { "Cache-Control": "no-store", "Content-Type": "text/plain; charset=utf-8" } });
}

async function retrieveSession(sessionId: string, secretKey: string): Promise<StripeCheckoutSession | null> {
  const response = await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`, { headers: { Authorization: `Basic ${btoa(`${secretKey}:`)}` } });
  if (!response.ok) return null;
  return (await response.json()) as StripeCheckoutSession;
}

export async function POST(request: Request): Promise<Response> {
  const bindings = await getCommerceBindings();
  if (!bindings.COMMERCE_DB || !bindings.STRIPE_WEBHOOK_SECRET || !bindings.STRIPE_SECRET_KEY) return text("Commerce webhook is not configured.", 503);

  const isTestMode = bindings.STRIPE_SECRET_KEY.startsWith("sk_test_");
  const isLiveMode = bindings.STRIPE_SECRET_KEY.startsWith("sk_live_");
  if (!isTestMode && !isLiveMode) return text("Stripe webhook is not configured with a valid secret key.", 503);

  const rawPayload = await request.text();
  const signatureIsValid = await verifyStripeSignature(rawPayload, request.headers.get("Stripe-Signature"), bindings.STRIPE_WEBHOOK_SECRET);
  if (!signatureIsValid) return text("Invalid Stripe signature.", 400);

  let event: StripeEvent;
  try { event = JSON.parse(rawPayload) as StripeEvent; } catch { return text("Invalid webhook payload.", 400); }

  const supportedEvent = event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded";
  if (!supportedEvent) return text("Ignored event.", 200);

  const eventId = event.id;
  const sessionId = event.data?.object?.id;
  if (!eventId || !sessionId) return text("Incomplete Checkout event.", 400);

  const session = await retrieveSession(sessionId, bindings.STRIPE_SECRET_KEY);
  if (!session || session.id !== sessionId || session.livemode !== isLiveMode || session.payment_status !== "paid" || session.metadata?.product_code !== PRIMARY_PRODUCT_CODE) {
    return text("Checkout session is not eligible for fulfillment.", 400);
  }

  const addShadowWork = session.metadata.includes_shadow_work === "true" && session.metadata.order_bump_code === ORDER_BUMP_CODE;

  await recordPaidOrder(bindings.COMMERCE_DB, {
    checkoutSessionId: sessionId,
    stripeEventId: eventId,
    email: session.customer_details?.email ?? null,
    customerId: session.customer ?? null,
    addShadowWork,
  });
  await recordAnalyticsEvent(bindings.COMMERCE_DB, { eventName: "pattern_files_purchase_confirmed", addShadowWork });

  return text("Received.", 200);
}
