import type { Metadata } from "next";
import Link from "next/link";
import SignupGate from "./signup-gate";

export const metadata: Metadata = {
  title: "The First Pattern File — Free",
  description: "Separate the event from the story before the loop decides what happens next. A free, one-page protocol from Burkeonis.",
  alternates: { canonical: "/first-pattern-file" },
};

const DOWNLOAD_TEXT = `THE FIRST PATTERN FILE — BURKEONIS

Separate the event from the story before the loop decides what happens next.

Before you react, write four lines.

1. EVENT
Write only what a camera would have recorded. No tone, no intention, no
meaning attached. "She didn't reply for six hours" — not "she ignored me."
If you catch yourself writing a motive, you've already moved to step two.
Stop and start the sentence over with just the fact.

2. STORY
Write what you made the event mean. The sentence that actually ran through
your head, exactly as it sounded, even if it's ugly: "I don't matter."
"They're pulling away." "This always happens." This is not the truth —
it's the interpretation your mind attached to the event. Naming it
separates it from the event itself. That's the whole point.

3. PATTERN
Ask where you've felt this exact story before. Not this exact event — this
exact story. If "I don't matter" or "this always happens" has shown up in
other rooms, with other people, over other events, that's not evidence the
story is true. That's evidence you're standing in a pattern, and the
pattern is doing the talking, not the moment.

4. NEXT MOVE
One exact thing, small enough you'll actually do it, that you control
completely regardless of what the other person does next. Not "communicate
better." Something like: "Wait until I've written the event and the story
before I send a message," or "Ask one question before I assume the
answer."

That's the file. One pattern, one sitting, four lines.

If this pattern shows up more than once, the full Pattern Files walks all
five: identity, burnout, career, conflict, relationship.
burkeonis.com/pattern-files

— Burkeonis
`;

export default function FirstPatternFilePage() {
  return (
    <main className="commerce-page pfc-page">
      <header className="commerce-header">
        <Link className="wordmark" href="/">BURKEONIS</Link>
        <a className="text-link" href="#get-the-file">Get the file ↓</a>
      </header>

      <section className="product-hero pfc-hero">
        <div className="commerce-shell product-hero-grid">
          <div>
            <p className="eyebrow">Free — the first case file</p>
            <h1>Separate the event<br />from the story.</h1>
            <p className="commerce-lede">
              The argument didn&apos;t start when they said that. It started when you decided what it meant.
              A plan changes. A message sits unanswered. Somebody gets quiet — and the mind adds the rest:
              <em> I don&apos;t matter. They don&apos;t care. This always happens.</em>
            </p>
            <p className="commerce-lede pfc-sub">Event ≠ meaning. This file is the four lines that catch the difference, before the loop decides what happens next.</p>
            <div className="product-actions"><a className="button button-primary" href="#get-the-file">Get the free file</a></div>
            <p className="product-proof">One page · Instant access · No account · Not therapy or a diagnosis</p>
          </div>
          <aside className="case-file-stack pfc-stack" aria-label="First Pattern File preview">
            <div className="case-file case-file-front pfc-cover">
              <span>FIRST PATTERN FILE</span>
              <strong>THE LOOP</strong>
              <i>Event ≠ meaning.</i>
            </div>
          </aside>
        </div>
      </section>

      <section className="product-section commerce-shell pfc-content">
        <SignupGate downloadText={DOWNLOAD_TEXT}>
          <div className="pfc-steps">
            <article className="pfc-step">
              <span>01</span>
              <h3>Event</h3>
              <p>Write only what a camera would have recorded. No tone, no intention, no meaning attached. &ldquo;She didn&apos;t reply for six hours&rdquo; — not &ldquo;she ignored me.&rdquo; If you catch yourself writing a motive, you&apos;ve already moved to step two. Stop and start the sentence over with just the fact.</p>
            </article>
            <article className="pfc-step">
              <span>02</span>
              <h3>Story</h3>
              <p>Write what you made the event mean. The sentence that actually ran through your head, exactly as it sounded, even if it&apos;s ugly: &ldquo;I don&apos;t matter.&rdquo; &ldquo;They&apos;re pulling away.&rdquo; &ldquo;This always happens.&rdquo; This is not the truth — it&apos;s the interpretation your mind attached to the event. Naming it separates it from the event itself. That&apos;s the whole point.</p>
            </article>
            <article className="pfc-step">
              <span>03</span>
              <h3>Pattern</h3>
              <p>Ask where you&apos;ve felt this exact story before. Not this exact event — this exact story. If &ldquo;I don&apos;t matter&rdquo; or &ldquo;this always happens&rdquo; has shown up in other rooms, with other people, over other events, that&apos;s not evidence the story is true. That&apos;s evidence you&apos;re standing in a pattern, and the pattern is doing the talking, not the moment.</p>
            </article>
            <article className="pfc-step">
              <span>04</span>
              <h3>Next move</h3>
              <p>One exact thing, small enough you&apos;ll actually do it, that you control completely regardless of what the other person does next. Not &ldquo;communicate better.&rdquo; Something like: &ldquo;Wait until I&apos;ve written the event and the story before I send a message,&rdquo; or &ldquo;Ask one question before I assume the answer.&rdquo;</p>
            </article>
          </div>
          <p className="pfc-closing">That&apos;s the file. One pattern, one sitting, four lines. If this one shows up more than once, <Link href="/pattern-files" className="text-link">the full Pattern Files walks all five ↗</Link></p>
        </SignupGate>
      </section>

      <footer className="commerce-footer"><div className="commerce-shell footer-line"><Link className="wordmark" href="/">BURKEONIS</Link><div><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></div><span>© 2026 BURKEONIS. ALL RIGHTS RESERVED.</span></div></footer>
    </main>
  );
}
