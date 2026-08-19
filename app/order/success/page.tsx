import type { Metadata } from "next";
import Link from "next/link";
import { createDownloadToken, getCommerceBindings, getPaidOrder } from "../../lib/commerce";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Order confirmed | Burkeonis", description: "Your Burkeonis order confirmation and secure delivery link.", robots: { index: false, follow: false } };

type SuccessPageProps = { searchParams: Promise<{ session_id?: string | string[] }> };

export default async function OrderSuccessPage({ searchParams }: SuccessPageProps) {
  const { session_id: sessionParameter } = await searchParams;
  const sessionId = typeof sessionParameter === "string" ? sessionParameter : null;
  const bindings = await getCommerceBindings();
  let state: "missing" | "pending" | "ready" = "missing";
  let downloadHref: string | null = null;
  let hasOrderBump = false;

  if (sessionId && bindings.COMMERCE_DB && bindings.DOWNLOAD_TOKEN_SECRET) {
    const order = await getPaidOrder(bindings.COMMERCE_DB, sessionId);
    if (order) {
      const token = await createDownloadToken(order.checkoutSessionId, bindings.DOWNLOAD_TOKEN_SECRET);
      downloadHref = `/api/download?token=${encodeURIComponent(token)}`;
      hasOrderBump = order.addShadowWork;
      state = "ready";
    } else state = "pending";
  } else if (sessionId) state = "pending";

  return (
    <main className="commerce-page"><header className="commerce-header"><Link className="wordmark" href="/">BURKEONIS</Link><Link className="text-link" href="/pattern-files">Return to product</Link></header><section className="commerce-shell order-state"><p className="eyebrow">Order status</p>
      {state === "ready" ? <><h1>Payment confirmed.<br />Your files are ready.</h1><p className="commerce-lede">Your access was confirmed by Stripe. This secure download link expires after 15 minutes.</p><a className="button button-primary" href={downloadHref!}>Download the Pattern Files</a>{hasOrderBump && <p className="status-note">Your Shadow Work Protocol is included in this download.</p>}</> : state === "pending" ? <><h1>Payment received.<br />Confirming access.</h1><p className="commerce-lede">The order is being verified before files are released. Refresh this page shortly. If access does not appear, contact hello@burkeonis.com with your receipt.</p><Link className="button button-outline" href="/pattern-files">Back to the product page</Link></> : <><h1>We need the order link<br />to confirm access.</h1><p className="commerce-lede">Open the confirmation link from your payment return page, or contact hello@burkeonis.com with your receipt.</p><Link className="button button-outline" href="/pattern-files">Back to the product page</Link></>}
    </section></main>
  );
}
