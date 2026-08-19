import {
  ORDER_BUMP_CODE,
  PRIMARY_PRODUCT_CODE,
  configurationProblem,
  getCommerceBindings,
  getSiteOrigin,
  parseCheckoutSelection,
} from "../../lib/commerce";

export const dynamic = "force-dynamic";

function json(body: unknown, status = 200): Response {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST(request: Request): Promise<Response> {
  let rawSelection: unknown;
  try {
    rawSelection = await request.json();
  } catch {
    return json({ error: "A valid product selection is required." }, 400);
  }

  const selection = parseCheckoutSelection(rawSelection);
  if (!selection) return json({ error: "This product selection is not available." }, 400);

  const bindings = await getCommerceBindings();
  const configurationIssue = configurationProblem(bindings);
  if (configurationIssue) return json({ error: configurationIssue }, 503);

  const isTestMode = bindings.STRIPE_SECRET_KEY?.startsWith("sk_test_") ?? false;
  const isLiveMode = bindings.STRIPE_SECRET_KEY?.startsWith("sk_live_") ?? false;
  if (!isTestMode && !isLiveMode) {
    return json({ error: "Stripe checkout is not configured with a valid secret key." }, 503);
  }

  if (selection.addShadowWork && !bindings.STRIPE_SHADOW_WORK_PRICE_ID) {
    return json({ error: "The optional protocol is not configured for checkout yet." }, 503);
  }

  const origin = getSiteOrigin(request);
  const form = new URLSearchParams({
    mode: "payment",
    customer_creation: "always",
    success_url: `${origin}/order/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/order/cancel`,
    "line_items[0][price]": bindings.STRIPE_PATTERN_FILES_PRICE_ID!,
    "line_items[0][quantity]": "1",
    "metadata[product_code]": PRIMARY_PRODUCT_CODE,
    "metadata[includes_shadow_work]": String(selection.addShadowWork),
  });

  if (selection.addShadowWork) {
    form.set("line_items[1][price]", bindings.STRIPE_SHADOW_WORK_PRICE_ID!);
    form.set("line_items[1][quantity]", "1");
    form.set("metadata[order_bump_code]", ORDER_BUMP_CODE);
  }

  const authorization = `Basic ${btoa(`${bindings.STRIPE_SECRET_KEY}:`)}`;
  const stripeResponse = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: authorization,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: form.toString(),
  });

  if (!stripeResponse.ok) {
    console.error("Stripe Checkout Session creation failed", await stripeResponse.text());
    return json({ error: "Checkout could not be started. Please try again." }, 502);
  }

  const session = (await stripeResponse.json()) as { id?: string; url?: string; livemode?: boolean };
  if (!session.id || !session.url || session.livemode !== isLiveMode) {
    return json({ error: "The payment service returned a checkout session in the wrong mode." }, 502);
  }

  return json({ checkoutUrl: session.url });
}
