import type { Metadata } from 'next';
import Positioning from '../components/Positioning';
import MarketStats from './MarketStats';
import InvestorForm from './InvestorForm';

export const metadata: Metadata = {
  title: 'For investors — Dux Bowling',
  description: 'Market positioning for the Dux Setter and the Dux platform.',
};

export default function InvestorsPage() {
  return (
    <main>
      <section>
        <div className="wrap">
          <p className="eyebrow">For investors</p>
          <h1 className="stripe sec" style={{ fontSize: 'clamp(30px,6vw,46px)' }}>
            A stranded sport with no supplier
          </h1>
          <hr className="rule" />
          <p className="lede">
            Duckpin is not a niche version of ten-pin — it is the most accessible version of bowling, stranded
            for fifty years without a machine. Handheld balls with no finger holes mean young kids, grandparents
            and anyone who cannot grip a house ball are all in the game. No perfect game has ever been bowled in
            over a century of duckpin. And it runs on the same lane dimensions as ten-pin, so houses can convert
            lanes without construction.
          </p>
          <div className="grid g3" style={{ marginTop: 22 }}>
            <div className="card tile">
              <b>The gap</b>
              <span>
                Zero manufacturers make a freestanding duckpin pinsetter. Every duckpin system sold today uses
                strings, which produce measurably different pin action.
              </span>
            </div>
            <div className="card tile">
              <b>The wedge</b>
              <span>
                ~35 surviving duckpin centers are a beachhead, not the market. The same machine and platform
                apply to ten-pin houses adding duckpin lanes without construction.
              </span>
            </div>
            <div className="card tile">
              <b>The moat</b>
              <span>
                A configurable distributor that places pins one at a time into any commanded pattern —
                provisional patent in process — plus the software only that capability makes possible.
              </span>
            </div>
          </div>
        </div>
      </section>

      <MarketStats />

      <section className="tight">
        <div className="wrap">
          <p className="eyebrow">Market positioning</p>
          <h2 className="stripe sec" style={{ fontSize: 'clamp(22px,4.4vw,32px)' }}>
            Where we sit
          </h2>
          <hr className="rule" />
          <p className="lede">
            Switch between the machine and the platform, then tap any competitor to see where they sit and why.
            The detail stays put until you tap another, and each links out to that company&apos;s own product page.
          </p>
          <div style={{ marginTop: 20 }}>
            <Positioning />
          </div>
        </div>
      </section>

      <section>
        <div className="wrap" style={{ maxWidth: 820 }}>
          <p className="eyebrow">Start a conversation</p>
          <h2 className="stripe sec" style={{ fontSize: 'clamp(22px,4.4vw,32px)' }}>
            Get in touch
          </h2>
          <hr className="rule" />
          <p className="lede">
            Tell us what you would want to see, and whether it makes sense to talk.
          </p>
          <div style={{ marginTop: 24 }}>
            <InvestorForm />
          </div>
        </div>
      </section>
    </main>
  );
}
