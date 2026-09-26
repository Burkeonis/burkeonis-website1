import { getCommerceBindings, getSelfMirrorProEntitlement, isSelfMirrorProActive, verifySelfMirrorSessionToken } from "../../../lib/commerce";

export const dynamic = "force-dynamic";
const COOKIE = "self_mirror_pro_session";

function cookieValue(request: Request, name: string): string | null {
  const cookie = request.headers.get("cookie") ?? "";
  for (const part of cookie.split(";")) {
    const [key, ...value] = part.trim().split("=");
    if (key === name) return decodeURIComponent(value.join("="));
  }
  return null;
}

export async function GET(request: Request): Promise<Response> {
  const bindings = await getCommerceBindings();
  if (!bindings.COMMERCE_DB || !bindings.SELF_MIRROR_SESSION_SECRET) {
    return Response.json({ pro: false }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
  const token = cookieValue(request, COOKIE);
  const customerId = token ? await verifySelfMirrorSessionToken(token, bindings.SELF_MIRROR_SESSION_SECRET) : null;
  if (!customerId) return Response.json({ pro: false }, { headers: { "Cache-Control": "no-store" } });
  const entitlement = await getSelfMirrorProEntitlement(bindings.COMMERCE_DB, customerId);
  return Response.json({
    pro: Boolean(entitlement && isSelfMirrorProActive(entitlement.status)),
    status: entitlement?.status ?? null,
    currentPeriodEnd: entitlement?.currentPeriodEnd ?? null,
  }, { headers: { "Cache-Control": "no-store" } });
}
