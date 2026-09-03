import type { Metadata } from 'next';
import BowlerSignup from './BowlerSignup';

export const metadata: Metadata = {
  title: 'For bowlers — Dux Bowling',
  description: 'Build an avatar, track every ball you throw, and put your name on the lane.',
};

export default function BowlersPage() {
  return (
    <main>
      <section>
        <div className="wrap">
          <p className="eyebrow">For bowlers</p>
          <h1 className="stripe sec" style={{ fontSize: 'clamp(30px,6vw,46px)' }}>
            Bowl like it&apos;s 2026
          </h1>
          <hr className="rule" />
          <p className="lede">
            Duckpin is the hardest, most charming game in bowling — and it has been stuck with chalkboard-era
            tech for fifty years. On a Dux lane, every ball you throw becomes something.
          </p>
        </div>
      </section>

      <section className="tight">
        <div className="wrap">
          <p className="eyebrow">Your avatar</p>
          <h2 className="stripe sec" style={{ fontSize: 'clamp(22px,4.4vw,32px)' }}>
            Build a bowler that&apos;s yours
          </h2>
          <hr className="rule" />
          <div className="grid g2">
            <div className="card tile">
              <b>Billions of combinations</b>
              <span>
                Skin tone, eyes, expression, hair, facial hair and its own colour, glasses or shades, hats,
                bowling shirt and style, accent colour, pants, and the ball in your hand — an arcade-styled
                pixel bowler built the way you want.
              </span>
            </div>
            <div className="card tile">
              <b>On the lane monitor</b>
              <span>
                Your avatar shows up on the alley screen when it is your turn, and follows you to any Dux lane.
                Earn patches and trophies as you bowl and they ride along with it.
              </span>
            </div>
          </div>
          <div className="btnrow" style={{ marginTop: 18 }}>
            <a className="btn primary" href="/demos/dux-avatar-arcade.html" target="_blank" rel="noopener noreferrer">
              Try the avatar creator
            </a>
          </div>
        </div>
      </section>

      <section className="tight">
        <div className="wrap">
          <p className="eyebrow">Your dashboard</p>
          <h2 className="stripe sec" style={{ fontSize: 'clamp(22px,4.4vw,32px)' }}>
            Every ball, remembered
          </h2>
          <hr className="rule" />
          <div className="grid g2">
            <div className="card tile">
              <b>Real stats, not just a score</b>
              <span>
                Average, strike rate, spare rate, single-pin conversion and first-ball average — tracked from
                every pin on every ball. Legacy scoring literally cannot see this.
              </span>
            </div>
            <div className="card tile">
              <b>Drill into anything</b>
              <span>
                Break performance down by alley, by lane, by game number, by league night. Find out that you
                are quietly terrible on lane 7 and do something about it.
              </span>
            </div>
            <div className="card tile">
              <b>Records and achievements</b>
              <span>
                High game, high series, longest strike streak, clean games, the 150 club. Earned on the lane,
                saved to your profile.
              </span>
            </div>
            <div className="card tile">
              <b>Leagues and friends</b>
              <span>
                Sign up in the app, follow live standings, get a push when weather closes a night — and follow
                other bowlers to compare your game against theirs.
              </span>
            </div>
          </div>
          <div className="btnrow" style={{ marginTop: 18 }}>
            <a className="btn" href="/demos/dux-bowler-dashboard.html" target="_blank" rel="noopener noreferrer">
              Open the bowler dashboard demo
            </a>
          </div>
        </div>
      </section>

      <section>
        <div className="wrap" style={{ maxWidth: 860 }}>
          <p className="eyebrow">Add your name</p>
          <h2 className="stripe sec" style={{ fontSize: 'clamp(22px,4.4vw,32px)' }}>
            Put your name on the lane
          </h2>
          <hr className="rule" />
          <p className="lede">
            We will tell you the moment there is a Dux lane near you — and the more names we have, the easier it
            is to convince an alley to host the first machine.
          </p>
          <div style={{ marginTop: 26 }}>
            <BowlerSignup />
          </div>
        </div>
      </section>
    </main>
  );
}
