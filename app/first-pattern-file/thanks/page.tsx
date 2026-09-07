import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Your Pattern Autopsy Is Ready", robots: { index: false, follow: false } };

export default function PatternAutopsyThanksPage() {
  return (
    <main className="commerce-page pfc-thanks">
      <header className="commerce-header"><Link className="wordmark" href="/">BURKEONIS</Link><Link className="text-link" href="/pattern-files">Pattern Files ↗</Link></header>
      <section className="commerce-shell order-state">
        <p className="eyebrow">Field study unlocked</p><h1>Now cut it<br />open.</h1>
        <p className="commerce-lede">Your Pattern Autopsy is ready. Download it, choose one repeating situation, and tell the truth on paper before the pattern edits the story again.</p>
        <div className="product-actions"><a className="button button-primary" href="/downloads/burkeonis-the-pattern-autopsy.pdf" download>Download the PDF</a><Link className="button button-outline" href="/pattern-files">See the complete Pattern Files</Link></div>
        <p className="product-proof">Save the PDF somewhere private. This work can get honest fast.</p>
      </section>
    </main>
  );
}
