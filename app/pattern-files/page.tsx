import type { Metadata } from "next";
import Link from "next/link";
import CheckoutButton from "./checkout-button";
import PatternFilesPageView from "./page-view";

export const metadata: Metadata = {
  title: "The Pattern Files",
  description: "Five direct self-reflection case files for examining the patterns, costs, and decisions you keep repeating.",
  alternates: { canonical: "/pattern-files" },
};

const files = [
  ["01", "Identity", "The roles, masks, beliefs, and performance you keep calling a personality."],
  ["02", "Burnout", "The capacity debt, ignored warning signs, and boundary failures beneath the exhaustion."],
  ["03", "Career", "The difference between ambition, fear, sunk cost, safety, and your next deliberate move."],
  ["04", "Conflict", "The trigger point, escalation pattern, unspoken resentment, and terms worth naming."],
  ["05", "Relationship", "The pattern between what happened, what you assumed, what you tolerated, and what repeats."],
];

export default function PatternFilesPage() {
  return (
    <main className="commerce-page">
      <PatternFilesPageView />
      <header className="commerce-header">
        <Link className="wordmark" href="/">BURKEONIS</Link>
        <nav aria-label="Product navigation"><a href="#inside">Inside</a><a href="#fit">Who it is for</a><a href="#checkout">Get the files</a></nav>
      </header>

      <section className="product-hero">
        <div className="commerce-shell product-hero-grid">
          <div>
            <p className="eyebrow">Five case files. One honest audit.</p>
            <h1>The pattern<br />files.</h1>
            <p className="commerce-lede">You do not need another quote telling you to heal. You need a place to put the evidence, name the cost, and decide what changes next.</p>
            <div className="product-actions"><a className="button button-primary" href="#checkout">Get the files</a><a className="text-link" href="#inside">See what is inside ↓</a></div>
            <p className="product-proof">Five printable PDFs · Immediate digital delivery after confirmed payment · No subscription</p>
          </div>
          <aside className="case-file-stack" aria-label="Pattern Files preview"><div className="case-file case-file-back"><span>CASE FILE 05</span><strong>RELATIONSHIP</strong></div><div className="case-file case-file-middle"><span>CASE FILE 03</span><strong>CAREER</strong></div><div className="case-file case-file-front"><span>CASE FILE 01</span><strong>IDENTITY</strong><i>Patterns don’t lie.</i></div></aside>
        </div>
      </section>

      <section className="product-section commerce-shell" id="inside">
        <div className="section-intro"><p className="eyebrow">What you receive</p><h2>Not prompts.<br />A method.</h2><p className="commerce-lede">Every file moves from observable facts to the story you assigned, the pattern underneath it, and one action you can take within 24 hours.</p></div>
        <div className="file-grid">{files.map(([number, name, description]) => <article className="file-card" key={name}><span>{number}</span><h3>{name}</h3><p>{description}</p><small>13-page protocol</small></article>)}</div>
      </section>

      <section className="product-section product-split" id="fit"><div className="commerce-shell split-grid"><div><p className="eyebrow">Who it is for</p><h2>For people done<br />with vague.</h2><p className="commerce-lede">For people who can see a loop forming and want a structured way to examine it without generic prompts or pretending intent is the same as action.</p></div><div className="boundary-card"><strong>What it is</strong><p>Self-guided reflective worksheets for personal use, printed or completed digitally.</p><strong>What it is not</strong><p>Therapy, diagnosis, clinical care, crisis support, legal advice, financial advice, or a promise that a worksheet will change your life.</p></div></div></section>

      <section className="product-section commerce-shell product-checkout-section"><div className="checkout-copy-block"><p className="eyebrow">Start with the evidence</p><h2>Stop calling it<br />bad luck.</h2><p className="commerce-lede">Look at what keeps repeating: what happened, what you made it mean, what it cost, and what you will do differently next.</p><p className="refund-copy">Digital-download refund terms are available before purchase.</p><Link className="text-link" href="/refund">Read the refund terms ↗</Link></div><CheckoutButton /></section>

      <footer className="commerce-footer"><div className="commerce-shell footer-line"><Link className="wordmark" href="/">BURKEONIS</Link><div><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/refund">Refunds</Link><Link href="/disclaimer">Disclaimer</Link></div><span>© 2026 BURKEONIS. ALL RIGHTS RESERVED.</span></div></footer>
    </main>
  );
}
