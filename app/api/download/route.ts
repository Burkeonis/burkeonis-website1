import { getCommerceBindings, getPaidOrder, recordDelivery, verifyDownloadToken } from "../../lib/commerce";

export const dynamic = "force-dynamic";

function failure(message: string, status: number): Response {
  return new Response(message, { status, headers: { "Cache-Control": "no-store", "Content-Type": "text/plain; charset=utf-8" } });
}

export async function GET(request: Request): Promise<Response> {
  const bindings = await getCommerceBindings();
  if (!bindings.COMMERCE_DB || !bindings.PRODUCT_FILES || !bindings.DOWNLOAD_TOKEN_SECRET) {
    return failure("Secure delivery is not configured.", 503);
  }

  const token = new URL(request.url).searchParams.get("token");
  if (!token) return failure("A valid download token is required.", 400);

  const checkoutSessionId = await verifyDownloadToken(token, bindings.DOWNLOAD_TOKEN_SECRET);
  if (!checkoutSessionId) return failure("This download link is invalid or has expired.", 403);

  const order = await getPaidOrder(bindings.COMMERCE_DB, checkoutSessionId);
  if (!order) return failure("No fulfilled order was found for this download.", 403);

  const objectKey = order.addShadowWork ? bindings.PATTERN_FILES_WITH_SHADOW_OBJECT_KEY : bindings.PATTERN_FILES_OBJECT_KEY;
  if (!objectKey) return failure("The selected product package is not configured.", 503);

  const product = await bindings.PRODUCT_FILES.get(objectKey);
  if (!product?.body) return failure("The protected product package is unavailable.", 404);

  await recordDelivery(bindings.COMMERCE_DB, checkoutSessionId);
  const filename = order.addShadowWork ? "burkeonis-pattern-files-plus-shadow-work.zip" : "burkeonis-pattern-files-core.zip";

  return new Response(product.body, {
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Type": product.httpMetadata?.contentType ?? "application/zip",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
