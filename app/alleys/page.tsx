import type { Metadata } from 'next';
import AlleyForm from './AlleyForm';

export const metadata: Metadata = {
  title: 'For alleys — Dux Bowling',
  description: 'Tell us how your duckpin machines are holding up, and raise your hand for a pilot.',
};

export default function AlleysPage() {
  return (
    <main>
      <section>
        <div className="wrap" style={{ maxWidth: 820 }}>
          <p className="eyebrow">For bowling alleys</p>
          <h1 className="stripe sec" style={{ fontSize: 'clamp(30px,6vw,46px)' }}>
            Tell us about your house
          </h1>
          <hr className="rule" />
          <p className="lede">
            We are building the first new freestanding duckpin pinsetter since 1973, and we would rather design it
            around what operators actually deal with than guess. Answer what you can — every question is optional
            except your name, email and alley. It takes about five minutes.
          </p>
          <div style={{ marginTop: 28 }}>
            <AlleyForm />
          </div>
        </div>
      </section>
    </main>
  );
}
