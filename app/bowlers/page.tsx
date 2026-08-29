import type { Metadata } from 'next';
import BowlerSignup from './BowlerSignup';

export const metadata: Metadata = {
  title: 'For bowlers — Dux Bowling',
  description: 'Sign up to show your interest in bowling on a Dux lane.',
};

export default function BowlersPage() {
  return (
    <main>
      <section>
        <div className="wrap" style={{ maxWidth: 860 }}>
          <p className="eyebrow">For bowlers</p>
          <h1 className="stripe sec" style={{ fontSize: 'clamp(30px,6vw,46px)' }}>
            Put your name on the lane
          </h1>
          <hr className="rule" />
          <p className="lede">
            We are building a duckpin pinsetter that can set any rack, and a platform that keeps your stats,
            your avatar and your achievements in one account that follows you to any Dux lane. Add your name
            and we will tell you the moment there is one near you — and the more names we have, the easier it
            is to convince an alley to host the first machine.
          </p>
          <div style={{ marginTop: 28 }}>
            <BowlerSignup />
          </div>
        </div>
      </section>
    </main>
  );
}
