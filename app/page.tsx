import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Self Mirror — See the pattern before it chooses for you",
  description: "Self Mirror separates facts from assumptions, exposes contradictions, tracks patterns, and helps you choose the next honest move.",
};

const Arrow = () => <span aria-hidden="true">↗</span>;

const productAreas = [
  ["Mirror", "Separate what happened from the story you built around it."],
  ["Mediator", "Read both sides of a conflict without choosing a hero."],
  ["Abyss", "Find the identity, payoff, and fear underneath the loop."],
  ["Memory", "Keep an optional local record of patterns you want to track."],
  ["Timeline", "Put events in order so repetition becomes harder to deny."],
  ["Triggers", "Connect the moment, the body response, and the next choice."],
  ["Vault", "Bring screenshots, notes, and conversation evidence into one file."],
  ["Insights", "Track contradictions, confidence, and evidence over time."],
  ["Reports", "Export a profile you control and can erase whenever you want."],
];

const ecosystem = [
  ["Shadow Work", "Work with the parts you hide, deny, or project.", "/shadow-work"],
  ["Relationship Tools", "Examine conflict, attachment, and repair.", "/tools"],
  ["Misophonia", "Separate the sound from the story attached to it.", "/misophonia"],
  ["RAD / Overload", "Tools for body-first reactions and learned defenses.", "/rad"],
  ["Pattern Files", "Guided files for the patterns you are ready to name.", "/pattern-files"],
  ["Music + No Last Words", "The things that could not be said normally.", "/no-last-words"],
];

export default function Home() {
  return (
    <main>
      <header className="site-header flagship-header">
        <a className="wordmark" href="#top" aria-label="Burkeonis home">BURKEONIS</a>
        <nav aria-label="Primary navigation"><a href="#how">How it works</a><a href="#inside">Inside Self Mirror</a><a href="#ecosystem">More from Burkeonis</a></nav>
        <a className="button button-small button-outline" href="/self-mirror">Open Self Mirror</a>
      </header>

      <section className="flagship-hero" id="top">
        <div className="flagship-glow" aria-hidden="true" />
        <div className="shell flagship-hero-grid">
          <div className="flagship-copy">
            <p className="eyebrow">The Burkeonis flagship</p>
            <h1>See the pattern<br />before it chooses<br /><em>for you.</em></h1>
            <p className="hero-lede">Paste the situation. Add the screenshots. Tell it what happened. Self Mirror separates facts from assumptions, exposes contradictions, and shows you the next honest move.</p>
            <div className="actions"><a className="button button-primary" href="/self-mirror">Open Self Mirror</a><a className="text-link" href="#how">See how it works <Arrow /></a></div>
            <p className="privacy-line">Private browser preview · No account required · You control what is remembered</p>
          </div>
          <div className="pro-preview" aria-label="Self Mirror Pro interface preview">
            <aside><span className="app-brand">SELF MIRROR</span><small>REFLECT</small>{["Mirror", "Mediator", "Abyss"].map((item, index) => <span className={index === 0 ? "active" : ""} key={item}>{index === 0 ? "◉" : "◇"} {item}</span>)}<small>YOUR PATTERN</small>{["Memory", "Timeline", "Triggers", "Vault", "Insights", "Reports"].map(item => <span key={item}>{item}</span>)}</aside>
            <div className="pro-main"><div className="app-topline"><span>MIRROR / NEW REFLECTION</span><span>LOCAL FIRST</span></div><div className="prompt-card"><small>WHAT HAPPENED?</small><p>Write it raw. Add context, screenshots, or the full conversation.</p><div className="prompt-lines"><i /><i /><i /></div><button>REFLECT IN MIRROR MODE</button></div><div className="result-grid"><div><small>FACTS</small><strong>What the evidence supports</strong></div><div><small>PATTERNS</small><strong>What keeps repeating</strong></div><div><small>BLIND SPOTS</small><strong>What may be outside the frame</strong></div><div><small>NEXT MOVE</small><strong>One action you can take</strong></div></div></div>
          </div>
        </div>
      </section>

      <section className="proof-strip" id="how"><div className="shell"><p>It does not just answer you.</p><h2>It helps you see what keeps happening.</h2><div className="proof-grid"><div><span>01</span><strong>Bring the evidence</strong><p>Write the account or add screenshots and text files.</p></div><div><span>02</span><strong>Choose the lens</strong><p>Use Mirror, Mediator, Abyss, Builder, or Bullshit Detector.</p></div><div><span>03</span><strong>Make the next move</strong><p>Leave with facts, patterns, blind spots, and one concrete action.</p></div></div></div></section>

      <section className="inside shell" id="inside"><p className="eyebrow">Inside Self Mirror</p><div className="inside-heading"><h2>One place to track<br />the whole pattern.</h2><p>A reflection can be useful once. Self Mirror becomes more useful when you can connect the conflict, the trigger, the contradiction, and the choice that followed.</p></div><div className="area-grid">{productAreas.map(([title, copy], index) => <article key={title}><span>{String(index + 1).padStart(2, "0")}</span><h3>{title}</h3><p>{copy}</p></article>)}</div><a className="button button-primary" href="/self-mirror">Start a reflection</a></section>

      <section className="control-band"><div className="shell control-grid"><div><p className="eyebrow">Your history stays yours</p><h2>Memory is a choice,<br />not a trap.</h2></div><div className="control-list"><p><strong>Local by default</strong><span>The public preview works in your browser.</span></p><p><strong>Evidence over certainty</strong><span>Insights show their basis and avoid pretending to diagnose you.</span></p><p><strong>Export or erase</strong><span>Turn memory on, inspect it, download it, or clear it.</span></p></div></div></section>

      <section className="ecosystem shell" id="ecosystem"><div className="ecosystem-heading"><div><p className="eyebrow">The rest of Burkeonis</p><h2>Go deeper when<br />you know the pattern.</h2></div><p>Self Mirror is the front door. These are the focused tools, protocols, and creative work behind it.</p></div><div className="ecosystem-grid">{ecosystem.map(([title, copy, href]) => <a href={href} key={title}><h3>{title}</h3><p>{copy}</p><span>Explore <Arrow /></span></a>)}</div></section>

      <section className="final-cta"><div className="shell"><p className="eyebrow">Be honest for one minute</p><h2>The pattern is already<br />telling on itself.</h2><p>Put it in front of you. Look at what is actually there.</p><a className="button button-primary" href="/self-mirror">Open Self Mirror</a></div></section>

      <footer><div className="shell footer-grid"><div><a className="wordmark" href="#top">BURKEONIS</a><p>I made something out of the mess.</p><a href="mailto:hello@burkeonis.com">hello@burkeonis.com</a></div><div><strong>Self Mirror</strong><a href="/self-mirror">Open the app</a><a href="#how">How it works</a><a href="#inside">What is inside</a></div><div><strong>Explore</strong><a href="/pattern-files">Pattern Files</a><a href="/tools">Tools</a><a href="/music">Music</a><a href="/blog">Blog</a></div><div><strong>Legal</strong><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="/disclaimer">Disclaimer</a><a href="/refund">Refunds</a></div></div><div className="shell copyright">© 2026 BURKEONIS. ALL RIGHTS RESERVED.</div></footer>
    </main>
  );
}
