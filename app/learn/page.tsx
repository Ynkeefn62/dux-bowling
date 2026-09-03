import type { Metadata } from 'next';
import Link from 'next/link';
import MediaSlider, { Slide } from '../components/MediaSlider';

export const metadata: Metadata = {
  title: 'Learn more — Dux Bowling',
  description: 'How the Dux Setter works, and what the software does with it.',
};

const HARDWARE: Slide[] = [
  {
    src: '/video/dux-pin-distributor.mp4',
    name: 'Pin separator and distributor',
    blurb:
      'This is the part no other pinsetter has. Pins arrive in a jumble and are separated, oriented and then placed one at a time into a removable basket plate — into whichever positions the software asked for. The full ten, a single sleeper, a tournament leave: the rack is built to order before it ever reaches the deck.',
  },
  {
    src: '/video/dux-elevator.mp4',
    name: 'Elevator',
    blurb:
      'Pins knocked down on the deck are collected and carried back up to the top of the machine to be separated and re-used. It runs on stock belting and a standard gearmotor, so a worn part is a catalog order rather than a hunt through a closed alley.',
  },
  {
    src: '/video/dux-descender.mp4',
    name: 'Descender',
    blurb:
      'The loaded basket plate is lowered to the pin deck and the pins are set. Because the plate holds an exact commanded pattern, the same rack can be reproduced ball after ball — and a partial rack disturbed by a stray ball can be restored precisely, with nobody walking down the lane.',
  },
  {
    src: '/video/dux-sweeper.mp4',
    name: 'Sweeper',
    blurb:
      'Between balls the sweeper clears fallen pins off the deck so the next rack can be set cleanly. A simple driven bar on a single axis, with home and limit sensing, keeps the cycle fast and predictable.',
  },
  {
    src: '/video/dux-ball-return.mp4',
    name: 'Ball return',
    blurb:
      'The ball is captured behind the deck and sent back to the bowler. The return exits either side of the machine, so a house with shared returns between lanes keeps the layout it already has.',
  },
];

const SOFTWARE: Slide[] = [
  {
    src: '/gifs/dux-open-play.gif',
    name: 'Open play',
    blurb:
      'Classic duckpin, three balls a frame, scored automatically for every bowler on the lane. Pin-level detection means strikes, spares and splits are called for you, and the whole game lands in each bowler\u2019s history when it ends.',
  },
  {
    src: '/gifs/dux-practice-mode.gif',
    name: 'Practice mode',
    blurb:
      'Choose a preset leave or build your own rack pin by pin, and the machine re-sets that exact configuration every ball. Conversion rate is tracked as you go. This is the mode that is simply impossible on a machine that can only set a full rack.',
  },
  {
    src: '/gifs/dux-spare.gif',
    name: 'Spare elimination',
    blurb:
      'A bowler calls a rack and has to clear it. Everyone else must match. Miss, and you take a letter — spell S-P-A-R-E and you are out. The whole game only works because any player can summon any rack on demand.',
  },
  {
    src: '/gifs/dux-strike-derby.gif',
    name: 'Strike derby',
    blurb:
      'Ten rolls at a full rack. Every strike scores a point and earns a bonus roll, so a hot hand keeps bowling. Ties go to sudden death, one rack at a time.',
  },
  {
    src: '/gifs/dux-hunt.gif',
    name: 'Dux hunt',
    blurb:
      'An arcade wave-shooter where the targets are real pins. Each round the machine sets a fresh scatter, the bar to clear keeps rising, and your score is driven entirely by actual pinfall.',
  },
];

export default function LearnPage() {
  return (
    <main>
      <section>
        <div className="wrap">
          <p className="eyebrow">Learn more</p>
          <h1 className="stripe sec" style={{ fontSize: 'clamp(30px,6vw,48px)' }}>
            How it works
          </h1>
          <hr className="rule" />
          <p className="lede">
            A modern freestanding pinsetter built on off-the-shelf industrial components, and the software that
            becomes possible once a machine can set any rack on command. Step through both below.
          </p>
        </div>
      </section>

      <section className="tight">
        <div className="wrap">
          <p className="eyebrow">The hardware</p>
          <h2 className="stripe sec" style={{ fontSize: 'clamp(22px,4.4vw,32px)' }}>
            Inside the Dux Setter
          </h2>
          <hr className="rule" />
          <MediaSlider slides={HARDWARE} label="Hardware" idPrefix="hw" />
        </div>
      </section>

      <section className="tight">
        <div className="wrap">
          <p className="eyebrow">The software</p>
          <h2 className="stripe sec" style={{ fontSize: 'clamp(22px,4.4vw,32px)' }}>
            What the platform does with it
          </h2>
          <hr className="rule" />
          <MediaSlider slides={SOFTWARE} label="Software" idPrefix="sw" />
        </div>
      </section>

      <section>
        <div className="wrap">
          <p className="eyebrow">Go deeper</p>
          <h2 className="stripe sec" style={{ fontSize: 'clamp(22px,4.4vw,32px)' }}>
            Pick the view that fits you
          </h2>
          <hr className="rule" />
          <div className="aud">
            <Link className="card" href="/alleys">
              <b>For alleys</b>
              <span>
                The alley dashboard, lower maintenance, new ways lanes earn — and the questionnaire that shapes
                what we build.
              </span>
              <span className="go">For alleys &rarr;</span>
            </Link>
            <Link className="card" href="/bowlers">
              <b>For bowlers</b>
              <span>
                Build an avatar, track every ball you throw, follow your friends — and tell us what you want on
                the lane.
              </span>
              <span className="go">For bowlers &rarr;</span>
            </Link>
            <Link className="card" href="/investors">
              <b>For investors</b>
              <span>
                Where we sit against every machine and platform on the market, and how to start a conversation.
              </span>
              <span className="go">For investors &rarr;</span>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
