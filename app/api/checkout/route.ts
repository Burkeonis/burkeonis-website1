import {
  ORDER_BUMP_CODE,
  PRIMARY_PRODUCT_CODE,
  getPaidProduct,
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

export async function GET(request: Request): Promise<Response> {
  const productCode = new URL(request.url).searchParams.get("product");
  const product = getPaidProduct(productCode);
  if (!product || !productCode) return Response.redirect(new URL("/tools.html", request.url), 303);

  const bindings = await getCommerceBindings();
  if (!bindings.STRIPE_SECRET_KEY) return json({ error: "Secure checkout is temporarily unavailable." }, 503);
  const isLiveMode = bindings.STRIPE_SECRET_KEY.startsWith("sk_live_");
  if (!isLiveMode && !bindings.STRIPE_SECRET_KEY.startsWith("sk_test_")) return json({ error: "Stripe checkout is not configured." }, 503);

  const origin = getSiteOrigin(request);
  const form = new URLSearchParams({
    mode: "payment",
    customer_creation: "always",
    success_url: `${origin}/order/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/order/cancel`,
    "line_items[0][price]": product.priceId,
    "line_items[0][quantity]": "1",
    "metadata[product_code]": productCode,
  });
  const stripeResponse = await fetch("https://api.stripe.com/v1/checkout/sessions", { method: "POST", headers: { Authorization: `Basic ${btoa(`${bindings.STRIPE_SECRET_KEY}:`)}`, "Content-Type": "application/x-www-form-urlencoded" }, body: form.toString() });
  if (!stripeResponse.ok) return json({ error: "Checkout could not be started. Please try again." }, 502);
  const session = (await stripeResponse.json()) as { url?: string; livemode?: boolean };
  if (!session.url || session.livemode !== isLiveMode) return json({ error: "Checkout could not be verified." }, 502);
  return Response.redirect(session.url, 303);
}
