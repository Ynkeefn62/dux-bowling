import type { Metadata } from 'next';
import LearnTabs from './LearnTabs';

export const metadata: Metadata = {
  title: 'Learn more — Dux Bowling',
  description:
    'The Dux Setter and the Dux platform, explained for bowling alleys, bowlers and investors.',
};

export default function LearnPage() {
  return (
    <main>
      <section>
        <div className="wrap">
          <p className="eyebrow">Learn more</p>
          <h1 className="stripe sec" style={{ fontSize: 'clamp(30px,6vw,48px)' }}>
            The machine, the platform, and the opening
          </h1>
          <hr className="rule" />
          <p className="lede">
            A modern freestanding pinsetter built on off-the-shelf industrial components — one that sets any
            pin configuration on command and turns every lane into a connected game platform. Pick the view
            that fits you.
          </p>
          <div style={{ marginTop: 28 }}>
            <LearnTabs />
          </div>
        </div>
      </section>
    </main>
  );
}
