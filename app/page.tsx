import Link from 'next/link';
import Timeline from './components/Timeline';

function Neon() {
  return (
    <svg className="neon" viewBox="0 0 341 206" role="img" aria-label="Dux Bowling">
      <defs>
        <g id="nd"><path d="M15 15 V105" /><path d="M15 15 H45 A45 45 0 0 1 45 105 H15" /></g>
        <g id="nu"><path d="M145 15 V75 A30 32 0 0 0 205 75 V15" /></g>
        <g id="nx"><path d="M254 15 L314 105" /><path d="M314 15 L254 105" /></g>
        {['d', 'u', 'x'].map((k) => (
          <mask key={k} id={`m${k}`}>
            <g transform="translate(6 6)" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <use href={`#n${k}`} stroke="#fff" strokeWidth="30" />
              <use href={`#n${k}`} stroke="#000" strokeWidth="9" />
            </g>
          </mask>
        ))}
      </defs>
      <g className="lt d"><rect width="341" height="206" fill="#e8834a" mask="url(#md)" /></g>
      <g className="lt u"><rect width="341" height="206" fill="#e8834a" mask="url(#mu)" /></g>
      <g className="lt x"><rect width="341" height="206" fill="#e8834a" mask="url(#mx)" /></g>
      <g className="bw" transform="translate(8 160)" fill="none" stroke="#f2ede4" strokeWidth="8"
         strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4 V36" /><path d="M4 4 H16 A8 8 0 0 1 16 20 H4" /><path d="M16 20 A8 8 0 0 1 16 36 H4" />
        <path d="M52 20 A16 16 0 1 0 84 20 A16 16 0 1 0 52 20" />
        <path d="M112 4 L119 36 L126 12 L133 36 L140 4" />
        <path d="M168 4 V36 H186" /><path d="M212 4 V36" /><path d="M240 36 V4 L262 36 V4" />
        <path d="M315.6 7.2 A16 16 0 1 0 322 20 H308" />
      </g>
    </svg>
  );
}

export default function Home() {
  return (
    <main>
      <div className="wrap">
        <div className="hero-wrap">
          <div>
            <Neon />
            <p className="eyebrow" style={{ marginTop: 18 }}>
              The first new duckpin pinsetter since 1973
            </p>
            <p className="lede" style={{ marginTop: 14, fontSize: 16 }}>
              Duckpin never got its modern era. The last freestanding pinsetter was built in 1973, and the
              houses still standing keep the game alive on parts scavenged from the ones that closed. We are
              building the machine that ends that — and the software that makes every lane worth coming back to.
            </p>
            <div className="btnrow" style={{ marginTop: 24 }}>
              <Link className="btn primary" href="/alleys">I run an alley</Link>
              <Link className="btn" href="/bowlers">I bowl duckpin</Link>
              <Link className="btn" href="/learn">Learn more</Link>
            </div>
          </div>
          <div className="hero-duck">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/duck.png" alt="" aria-hidden="true" />
          </div>
        </div>
      </div>

      <section className="tight">
        <div className="wrap">
          <div className="grid g3">
            <div className="card tile">
              <b>50+ years</b>
              <span>since the last freestanding duckpin pinsetter was manufactured.</span>
            </div>
            <div className="card tile">
              <b>Zero</b>
              <span>companies making a freestanding replacement machine today.</span>
            </div>
            <div className="card tile">
              <b>~35 centers</b>
              <span>left nationwide, and falling as machines fail beyond repair.</span>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="wrap">
          <p className="eyebrow">What we are building</p>
          <h2 className="stripe sec">One machine. A whole platform.</h2>
          <hr className="rule" />
          <div className="grid g2">
            <div className="card tile">
              <b>A pinsetter that sets any rack</b>
              <span>
                Every pinsetter ever sold sets one thing: the full rack. The Dux Setter places pins one at a
                time into any pattern you ask for — the full ten, a sleeper, a split, anything. Real
                freestanding duckpin action, no strings. Built on catalog industrial parts, so any automation
                tech or machine shop can service it.
              </span>
            </div>
            <div className="card tile" style={{ padding: 0, overflow: 'hidden' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/gifs/dux-practice-mode.gif" alt="Practice mode: choosing a custom pin configuration and the machine setting it" loading="lazy" />
              <div style={{ padding: 20 }}>
                <b>Practice any rack, on demand</b>
                <span>
                  Pick the 7-10, a sleeper, your personal nemesis &mdash; the machine sets it, and re-sets it
                  every single ball. No legacy pinsetter can do this.
                </span>
              </div>
            </div>
            <div className="card tile">
              <b>Software that remembers the bowler</b>
              <span>
                Because the machine can set any rack, the platform runs games no bowling center has ever
                offered — and keeps every bowler&apos;s stats, avatar and achievements in one account that
                follows them to any Dux lane.
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="tight">
        <div className="wrap">
          <p className="eyebrow">Where we are</p>
          <h2 className="stripe sec">Design done. Prototype next.</h2>
          <hr className="rule" />
          <p className="lede">Tap a stage to see what it involves.</p>
          <Timeline />
        </div>
      </section>

      <section>
        <div className="wrap">
          <div className="card" style={{ borderColor: '#6b3a1e' }}>
            <p className="eyebrow">Founding partner program</p>
            <h3 className="stripe sub" style={{ marginTop: 6 }}>
              We are looking for the first alley
            </h3>
            <p className="lede">
              We are selecting a small group of duckpin houses to pilot the Dux Setter on a few lanes — free,
              supported, and shaped by their feedback. If you run a house, the most useful thing you can do
              right now is tell us how your machines are actually holding up.
            </p>
            <div className="btnrow" style={{ marginTop: 18 }}>
              <Link className="btn primary" href="/alleys">Tell us about your alley</Link>
              <Link className="btn" href="/learn">See the detail</Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
