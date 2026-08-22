const Arrow = () => <span aria-hidden="true">↗</span>;

const Waveform = () => (
  <div className="waveform" aria-hidden="true">
    {[18, 34, 52, 24, 66, 40, 74, 30, 56, 82, 46, 64, 28, 50, 72, 36, 60, 22, 44, 68, 32, 54, 26, 40, 18].map(
      (height, index) => <i key={index} style={{ height }} />
    )}
  </div>
);

export default function Home() {
  return (
    <main>
      <header className="site-header">
        <a className="wordmark" href="#top" aria-label="Burkeonis home">BURKEONIS</a>
        <nav aria-label="Primary navigation">
          <a href="#mirror">Self Mirror</a>
          <a href="#tools">Tools</a>
          <a href="#music">Music</a>
          <a href="#last-words">No Last Words</a>
          <a href="#about">About</a>
        </nav>
        <a className="button button-small button-outline" href="/pattern-files">Get the Pattern Files</a>
      </header>

      <section className="hero" id="top">
        <div className="hero-art" aria-hidden="true" />
        <div className="hero-content shell">
          <div className="hero-copy">
            <p className="eyebrow">Control vs Chaos</p>
            <h1>Stop pretending<br />you’re fine.</h1>
            <p className="hero-lede">You know when you’re lying to yourself.<br className="desktop-only" /> This is where you stop.</p>
            <div className="actions"><a className="button button-primary" href="/pattern-files">Get the Pattern Files</a><a className="text-link" href="#manifesto">Explore Burkeonis <Arrow /></a></div>
          </div>
        </div>
        <a className="scroll-cue" href="#manifesto" aria-label="Scroll to manifesto">↓</a>
      </section>

      <section className="manifesto shell" id="manifesto">
        <p className="eyebrow">Why I built this</p><h2>I got tired of my<br />own bullshit.</h2><p className="section-lede">I did not build Burkeonis because I figured life out. I built it because I kept fucking mine up and blaming everything except the patterns I refused to face.</p>
        <div className="feature-grid">
          <article className="feature-card mirror-card"><span className="card-number">01</span><div className="card-mark cracked-mirror" aria-hidden="true" /><h3>Self Mirror</h3><p>See the shit you keep doing. See why you do it. Stop calling it bad luck.</p><a href="#mirror">Open Self Mirror <Arrow /></a></article>
          <article className="feature-card shadow-card"><span className="card-number">02</span><div className="card-mark fracture" aria-hidden="true" /><h3>Shadow Work</h3><p>Deal with the parts of yourself you hide, deny, and blame on everyone else.</p><a href="#tools">Enter the shadow <Arrow /></a></article>
          <article className="feature-card tools-card"><span className="card-number">03</span><div className="card-mark gear" aria-hidden="true">×</div><h3>Tools That Work</h3><p>Things you can actually use. No empty quotes. No pretending a checklist fixes your life.</p><a href="#tools">View tools <Arrow /></a></article>
        </div>
      </section>

      <section className="mirror-section section-band" id="mirror"><div className="shell mirror-layout"><div className="section-copy"><p className="eyebrow">This is the main thing</p><h2>The mirror<br />doesn’t flinch.</h2><p>Self Mirror helps you inspect what you say in the moment. It catches contradictions, separates facts from assumptions, and puts the pattern back in front of you.</p><ul className="mode-list"><li><strong>Mirror</strong><span>Shows you what you keep missing.</span></li><li><strong>Mediator</strong><span>Looks at both sides without kissing anyone’s ass.</span></li><li><strong>Abyss</strong><span>Goes after the shit underneath all of it.</span></li></ul><a className="button button-primary" href="/self-mirror">Open Self Mirror</a></div><div className="app-window" aria-label="Self Mirror interface preview"><aside><span className="app-brand">SELF MIRROR</span><small>MODES</small><button className="active">◉ Mirror</button><button>◇ Mediator</button><button>▽ Abyss</button><small>INSIGHTS</small><button>Patterns</button><button>Entries</button><button>Reflections</button></aside><div className="app-main"><div className="app-topline"><span>MIRROR</span><span>PRIVATE BY DESIGN</span></div><div className="profile-grid"><div className="profile-orbit"><div className="profile-core">YOU</div><span className="orbit orbit-one" /><span className="orbit orbit-two" /></div><div className="pattern-list"><span>Pattern overview</span><label>Avoidance <i style={{ width: "72%" }} /></label><label>Control <i style={{ width: "64%" }} /></label><label>People pleasing <i style={{ width: "48%" }} /></label><label>Perfectionism <i style={{ width: "36%" }} /></label></div></div><div className="insight-row"><div><small>LAST ENTRY</small><p>“I shut down when things get real.”</p></div><div><small>NEXT MOVE</small><p>Challenge the story. Choose differently.</p></div></div></div></div></div></section>

      <section className="last-words shell" id="last-words"><div className="grief-art" aria-hidden="true"><span>✦</span></div><div className="last-words-copy"><p className="eyebrow">No Last Words</p><h2>For everything you<br />never got to say.</h2><p>Sometimes someone is just gone. No warning. No clean ending. No answers. You are left holding every word you thought you had more time to say.</p><a className="button button-primary" href="/no-last-words">Hear No Last Words</a></div><div className="player"><div className="player-meta"><span>NO LAST WORDS</span><small>Jeffery Burke</small></div><Waveform /><div className="player-controls"><span>1:34</span><button aria-label="Play No Last Words">▶</button><span>4:12</span></div></div></section>

      <section className="work shell" id="tools"><div className="work-heading"><p className="eyebrow">What I made from it</p><h2>I could let it ruin me.<br />Or I could use it.</h2></div><div className="work-grid"><article className="music-panel" id="music"><div className="panel-heading"><div><small>The shit I could not say normally</small><h3>Music</h3></div><a href="/music">Browse all <Arrow /></a></div><div className="albums"><div className="album"><div className="album-art art-one" /><strong>The Cage Door</strong><small>Single</small></div><div className="album"><div className="album-art art-two" /><strong>Mirror for the Mob</strong><small>Single</small></div><div className="album"><div className="album-art art-three" /><strong>Life Happens</strong><small>Single</small></div></div></article><article className="tools-panel"><div className="panel-heading"><div><small>Do the work or do not</small><h3>Workbooks + Tools</h3></div><a href="/tools">View all <Arrow /></a></div><div className="books"><div className="book"><span>IDENTITY<br />CHECK</span><small>WORKBOOK</small></div><div className="book"><span>SHADOW<br />AUDIT</span><small>WORKBOOK</small></div><div className="book"><span>BREAK THE<br />PATTERN</span><small>WORKBOOK</small></div></div></article></div></section>

      <section className="final-cta" id="about"><div className="chain chain-left" aria-hidden="true" /><div className="chain chain-right" aria-hidden="true" /><div className="shell"><p className="eyebrow">Be honest for one minute</p><h2>If nothing changes<br />then nothing changes.</h2><p>You already know what you keep avoiding.</p><a className="button button-primary" href="/pattern-files">Start with the Pattern Files</a></div></section>

      <footer><div className="shell footer-grid"><div><a className="wordmark" href="#top">BURKEONIS</a><p>I made something out of the mess.</p><a href="mailto:hello@burkeonis.com">hello@burkeonis.com</a></div><div><strong>Navigate</strong><a href="#mirror">Self Mirror</a><a href="#tools">Tools</a><a href="#music">Music</a><a href="#last-words">No Last Words</a></div><div><strong>Explore</strong><a href="/shadow-work">Shadow Work</a><a href="/misophonia">Misophonia</a><a href="/rad">Adults with RAD</a><a href="/about">About</a><a href="/blog">Blog</a><a href="/first-pattern-file">Free Pattern File</a></div><div><strong>Legal</strong><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="/disclaimer">Disclaimer</a><a href="/refund">Refunds</a></div></div><div className="shell copyright">© 2026 BURKEONIS. ALL RIGHTS RESERVED.</div></footer>
    </main>
  );
}
