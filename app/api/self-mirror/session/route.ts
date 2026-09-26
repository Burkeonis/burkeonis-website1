import { getCommerceBindings, getSelfMirrorProEntitlement, isSelfMirrorProActive, SELF_MIRROR_PRO_CODE, createSelfMirrorSessionToken } from "../../../lib/commerce";

export const dynamic = "force-dynamic";
const COOKIE = "self_mirror_pro_session";

type StripeSession = { id?: string; livemode?: boolean; mode?: string; customer?: string | null; metadata?: Record<string,string|undefined> | null };

export async function GET(request: Request): Promise<Response> {
  const sessionId = new URL(request.url).searchParams.get("session_id");
  const bindings = await getCommerceBindings();
  if (!sessionId || !bindings.STRIPE_SECRET_KEY || !bindings.COMMERCE_DB || !bindings.SELF_MIRROR_SESSION_SECRET) return Response.redirect(new URL("/self-mirror", request.url), 303);

  const stripeResponse = await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`, { headers: { Authorization: `Basic ${btoa(`${bindings.STRIPE_SECRET_KEY}:`)}` } });
  if (!stripeResponse.ok) return Response.redirect(new URL("/self-mirror", request.url), 303);
  const session = (await stripeResponse.json()) as StripeSession;
  const live = bindings.STRIPE_SECRET_KEY.startsWith("sk_live_");
  if (session.id !== sessionId || session.livemode !== live || session.mode !== "subscription" || session.metadata?.product_code !== SELF_MIRROR_PRO_CODE || !session.customer) return Response.redirect(new URL("/self-mirror", request.url), 303);

  const entitlement = await getSelfMirrorProEntitlement(bindings.COMMERCE_DB, session.customer);
  if (!entitlement || !isSelfMirrorProActive(entitlement.status)) return Response.redirect(new URL("/self-mirror?pro=pending", request.url), 303);

  const token = await createSelfMirrorSessionToken(session.customer, bindings.SELF_MIRROR_SESSION_SECRET);
  const response = Response.redirect(new URL("/self-mirror?pro=active", request.url), 303);
  response.headers.append("Set-Cookie", `${COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000`);
  return response;
}
