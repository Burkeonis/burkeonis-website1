import { PRIMARY_PRODUCT_CODE, getCommerceBindings, recordAnalyticsEvent } from "../../lib/commerce";

export const dynamic = "force-dynamic";

const allowedEvents = new Set([
  "pattern_files_viewed",
  "pattern_files_checkout_started",
  "pattern_files_checkout_unavailable",
  "self_mirror_viewed",
  "self_mirror_returned",
  "self_mirror_quick_completed",
  "self_mirror_next_move_selected",
  "self_mirror_daily_clicked",
  "self_mirror_deeper_clicked",
  "self_mirror_share_clicked",
  "self_mirror_field_test_clicked",
]);

export async function POST(request: Request): Promise<Response> {
  const bindings = await getCommerceBindings();
  if (!bindings.COMMERCE_DB) return new Response(null, { status: 204 });

  let payload: { event?: unknown; addShadowWork?: unknown; product?: unknown };
  try {
    payload = (await request.json()) as { event?: unknown; addShadowWork?: unknown; product?: unknown };
  } catch {
    return new Response(null, { status: 400 });
  }

  if (typeof payload.event !== "string" || !allowedEvents.has(payload.event)) {
    return new Response(null, { status: 400 });
  }

  await recordAnalyticsEvent(bindings.COMMERCE_DB, {
    eventName: payload.event,
    productCode: payload.product === "self-mirror-field-test" ? "self-mirror-field-test" : PRIMARY_PRODUCT_CODE,
    addShadowWork: payload.addShadowWork === true,
  });

  return new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
}
