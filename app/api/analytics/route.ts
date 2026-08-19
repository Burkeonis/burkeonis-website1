import { PRIMARY_PRODUCT_CODE, getCommerceBindings, recordAnalyticsEvent } from "../../lib/commerce";

export const dynamic = "force-dynamic";

const allowedEvents = new Set([
  "pattern_files_viewed",
  "pattern_files_checkout_started",
  "pattern_files_checkout_unavailable",
]);

export async function POST(request: Request): Promise<Response> {
  const bindings = await getCommerceBindings();
  if (!bindings.COMMERCE_DB) return new Response(null, { status: 204 });

  let payload: { event?: unknown; addShadowWork?: unknown };
  try {
    payload = (await request.json()) as { event?: unknown; addShadowWork?: unknown };
  } catch {
    return new Response(null, { status: 400 });
  }

  if (typeof payload.event !== "string" || !allowedEvents.has(payload.event)) {
    return new Response(null, { status: 400 });
  }

  await recordAnalyticsEvent(bindings.COMMERCE_DB, {
    eventName: payload.event,
    productCode: PRIMARY_PRODUCT_CODE,
    addShadowWork: payload.addShadowWork === true,
  });

  return new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
}
