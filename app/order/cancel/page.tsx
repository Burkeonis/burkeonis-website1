import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Checkout cancelled | Burkeonis", description: "Your Burkeonis checkout session was cancelled.", robots: { index: false, follow: false } };

export default function OrderCancelPage() {
  return (
    <main className="commerce-page"><header className="commerce-header"><Link className="wordmark" href="/">BURKEONIS</Link><Link className="text-link" href="/pattern-files">Return to product</Link></header><section className="commerce-shell order-state"><p className="eyebrow">Checkout cancelled</p><h1>No payment.<br />No pressure.</h1><p className="commerce-lede">Your order was not completed and no digital access has been activated.</p><Link className="button button-primary" href="/pattern-files">Return to the Pattern Files</Link></section></main>
  );
}
