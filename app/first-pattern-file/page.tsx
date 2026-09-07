import type { Metadata } from "next";
import Link from "next/link";
import SignupGate from "./signup-gate";

export const metadata: Metadata = {
  title: "The Pattern Autopsy — Free Burkeonis Field Study",
  description: "Stop arguing with the surface. Cut open the pattern underneath it with a free, brutally honest Burkeonis field study.",
  alternates: { canonical: "/first-pattern-file" },
  openGraph: {
    title: "The Pattern Autopsy — Free Burkeonis Field Study",
    description: "The event happened once. The story may have been running for years. Find the loop before it runs you again.",
    images: ["/pattern-autopsy-cover.png"],
  },
};

export default function FirstPatternFilePage() {
  return (
    <main className="commerce-page pfc-page">
      <header className="commerce-header">
        <Link className="wordmark" href="/">BURKEONIS</Link>
        <a className="text-link" href="#get-the-file">Get the field study ↓</a>
      </header>
      <section className="product-hero pfc-hero">
        <div className="commerce-shell product-hero-grid">
          <div>
            <p className="eyebrow">Free field study · 7 days · zero bullshit</p>
            <h1>Stop fighting<br />the surface.</h1>
            <p className="commerce-lede">The event happened once. The story may have been running for years. <em>The Pattern Autopsy</em> helps you catch what happened, what you made it mean, who paid for it, and what the pattern has been protecting.</p>
            <p className="commerce-lede pfc-sub">This is not a motivational worksheet. It is a seven-day evidence file for people who are done letting the same wound wear different faces.</p>
            <div className="product-actions"><a className="button button-primary" href="#get-the-file">Send me the autopsy</a></div>
            <p className="product-proof">Instant PDF · Private work · No charge · Unsubscribe anytime</p>
          </div>
          <aside className="pfc-cover-art" aria-label="The Pattern Autopsy cover">
            <img src="/pattern-autopsy-cover.png" alt="Burkeonis Pattern Autopsy field study cover" />
            <span className="pfc-stamp">FIELD STUDY // 001</span>
          </aside>
        </div>
      </section>
      <section className="product-section commerce-shell pfc-content">
        <div className="pfc-reveal-grid">
          <div><p className="eyebrow">What this exposes</p><h2>The part nobody wants to name.</h2></div>
          <div className="pfc-points">
            <p><strong>What actually happened</strong><span>Strip the camera facts away from the story your nervous system added.</span></p>
            <p><strong>What it made you believe</strong><span>Name the sentence that hijacked the room before you acted like it was truth.</span></p>
            <p><strong>Who paid for the pattern</strong><span>Track the cost in trust, time, money, connection, and self-respect.</span></p>
            <p><strong>What changes next</strong><span>Finish with one controlled move you can prove, not another promise you can forget.</span></p>
          </div>
        </div>
        <SignupGate />
        <div className="pfc-proof-band"><p>One pattern. Seven days. Real evidence.</p><span>You do not need a new identity. You need proof that the old loop is no longer in charge.</span></div>
      </section>
      <footer className="commerce-footer"><div className="commerce-shell footer-line"><Link className="wordmark" href="/">BURKEONIS</Link><div><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/disclaimer">Disclaimer</Link></div><span>© 2026 BURKEONIS. ALL RIGHTS RESERVED.</span></div></footer>
    </main>
  );
}
