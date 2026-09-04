import Link from 'next/link';
import Timeline from './components/Timeline';
import BuildBox from './components/BuildBox';

function NeonDux() {
  return (
    <svg
      className="neon"
      viewBox="0 0 341 132"
      role="img"
      aria-label="Dux"
    >
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
      <g className="lt d"><rect width="341" height="132" fill="var(--orange-soft)" mask="url(#md)" /></g>
      <g className="lt u"><rect width="341" height="132" fill="var(--orange-soft)" mask="url(#mu)" /></g>
      <g className="lt x"><rect width="341" height="132" fill="var(--orange-soft)" mask="url(#mx)" /></g>
    </svg>
  );
}

export default function Home() {
  return (
    <main>
      <div className="wrap">
        <div className="hero-wrap">
          <div>
            <NeonDux />
            <div className="wordmark hero-word">BOWLING</div>
            <p className="eyebrow" style={{ marginTop: 16 }}>
              The first new duckpin pinsetter since 1973
            </p>
            <p className="lede" style={{ marginTop: 14, fontSize: 16 }}>
              Duckpin never got its modern era. The last freestanding pinsetter was built in 1973, and the
              houses still standing keep the game alive on parts scavenged from the ones that closed. We are
              building the machine that ends that &mdash; and the software that makes every lane worth coming
              back to.
            </p>
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
          <BuildBox />
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
            <h3 className="stripe sub" style={{ marginTop: 6 }}>We are looking for the first alley</h3>
            <p className="lede">
              We are selecting a small group of duckpin houses to pilot the Dux Setter on a few lanes,
              supported and shaped by their feedback. If you run a house, the most useful thing you can do
              right now is tell us how your machines are actually holding up.
            </p>
            <div className="btnrow" style={{ marginTop: 18 }}>
              <Link className="btn primary" href="/alleys">Tell us about your alley</Link>
              <Link className="btn" href="/learn">See how it works</Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
