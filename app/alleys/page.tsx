import type { Metadata } from 'next';
import AlleyForm from './AlleyForm';

export const metadata: Metadata = {
  title: 'For alleys — Dux Bowling',
  description: 'The alley dashboard, lower maintenance, and new ways lanes earn.',
};

export default function AlleysPage() {
  return (
    <main>
      <section>
        <div className="wrap">
          <p className="eyebrow">For bowling alleys</p>
          <h1 className="stripe sec" style={{ fontSize: 'clamp(30px,6vw,46px)' }}>
            Your pinsetters deserve retirement
          </h1>
          <hr className="rule" />
          <p className="lede">
            Most duckpin houses run machines older than their bowlers, kept alive on salvaged parts, weekend
            mechanics and luck. Here is what changes when the machine is new and the software is built around
            your business.
          </p>
        </div>
      </section>

      <section className="tight">
        <div className="wrap">
          <p className="eyebrow">The alley dashboard</p>
          <h2 className="stripe sec" style={{ fontSize: 'clamp(22px,4.4vw,32px)' }}>
            Every lane, on one screen
          </h2>
          <hr className="rule" />
          <div className="grid g2">
            <div className="card tile">
              <b>Stat tracking across all lanes</b>
              <span>
                Games, scores and throughput per lane, per day, per league night — so you can see which lanes
                earn and which sit idle.
              </span>
            </div>
            <div className="card tile">
              <b>Anomaly detection</b>
              <span>
                When a lane starts scoring lower than expected, that is usually the machine telling you
                something. The dashboard flags it before your bowlers complain.
              </span>
            </div>
            <div className="card tile">
              <b>Maintenance requests in the app</b>
              <span>
                Raise a service request against a specific lane, with the recent history attached — and send
                feedback straight to us from the same screen.
              </span>
            </div>
            <div className="card tile">
              <b>League and tournament tools</b>
              <span>
                Automated sign-ups, scoring, scheduling and alerts to your bowlers. Handicaps and prize funds
                compute themselves, so your league secretary gets their evenings back.
              </span>
            </div>
          </div>
          <div className="btnrow" style={{ marginTop: 18 }}>
            <a className="btn" href="/demos/dux-admin-leagues.html" target="_blank" rel="noopener noreferrer">
              Open the league admin demo
            </a>
          </div>
        </div>
      </section>

      <section className="tight">
        <div className="wrap">
          <p className="eyebrow">What it does for your house</p>
          <h2 className="stripe sec" style={{ fontSize: 'clamp(22px,4.4vw,32px)' }}>
            The benefits, plainly
          </h2>
          <hr className="rule" />
          <div className="grid g2">
            <div className="card tile">
              <b>Easier maintenance</b>
              <span>
                No more scavenging for parts that stopped being made decades ago. Wear items carry catalog part
                numbers and fabricated parts ship with full drawings, so any automation tech or machine shop can
                support the machine. We are also exploring a staff engineer who maintains the pinsetters for
                every alley in a region.
              </span>
            </div>
            <div className="card tile">
              <b>Increased revenue</b>
              <span>
                Expanded game options appeal to bowlers of every skill level and cut lane downtime. Saved games
                and league sign-ups bring customers back.
              </span>
            </div>
            <div className="card tile">
              <b>Set any rack on command</b>
              <span>
                Sell serious practice: any split, any pattern, every time. And when a ball kicks out of the
                gutter and topples a partial rack, the machine restores the exact configuration itself — nobody
                walks the lane.
              </span>
            </div>
            <div className="card tile">
              <b>We value feedback</b>
              <span>
                We are excited to work with each alley to understand what it needs. Because we are building from
                scratch, we can design a future where everyone wins.
              </span>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="wrap" style={{ maxWidth: 820 }}>
          <p className="eyebrow">Tell us about your house</p>
          <h2 className="stripe sec" style={{ fontSize: 'clamp(22px,4.4vw,32px)' }}>
            The questionnaire
          </h2>
          <hr className="rule" />
          <p className="lede">
            We would rather design this around what operators actually deal with than guess. Answer what you
            can — everything is optional except your name, email and alley. About five minutes.
          </p>
          <div style={{ marginTop: 26 }}>
            <AlleyForm />
          </div>
        </div>
      </section>
    </main>
  );
}
