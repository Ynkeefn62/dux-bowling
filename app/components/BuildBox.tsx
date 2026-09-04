'use client';
import { useState } from 'react';

type Item = { key: string; src: string; blurb: string };

const PARTS: Item[] = [
  { key: 'Distributor', src: '/video/dux-pin-distributor.mp4',
    blurb: 'The part no other pinsetter has. Pins are separated, oriented and placed one at a time into whichever positions the software asked for — the full ten, a single sleeper, a tournament leave. The rack is built to order before it ever reaches the deck.' },
  { key: 'Elevator', src: '/video/dux-elevator.mp4',
    blurb: 'Pins knocked down on the deck are collected and carried back to the top of the machine to be separated and re-used, on stock belting and a standard gearmotor.' },
  { key: 'Descender', src: '/video/dux-descender.mp4',
    blurb: 'The loaded plate lowers to the deck and sets the pins. Because it holds an exact commanded pattern, the same rack repeats ball after ball — and a rack disturbed by a stray ball is restored precisely, with nobody walking the lane.' },
  { key: 'Sweeper', src: '/video/dux-sweeper.mp4',
    blurb: 'Between balls the sweeper clears fallen pins off the deck so the next rack sets cleanly. One driven bar on a single axis, with home and limit sensing.' },
  { key: 'Ball return', src: '/video/dux-ball-return.mp4',
    blurb: 'The ball is captured behind the deck and sent back to the bowler. The return exits either side, so a house with shared returns keeps the layout it already has.' },
];

const GAMES: Item[] = [
  { key: 'Open play', src: '/gifs/dux-open-play.gif',
    blurb: 'Classic duckpin, three balls a frame, scored automatically for every bowler on the lane.' },
  { key: 'Practice', src: '/gifs/dux-practice-mode.gif',
    blurb: 'Pick any leave — the 7-10, a sleeper, your personal nemesis — and the machine re-sets that exact rack every single ball.' },
  { key: 'Spare', src: '/gifs/dux-spare.gif',
    blurb: 'Call your rack and clear it, and everyone else has to match. Miss and you take a letter. Spell S-P-A-R-E and you are out.' },
  { key: 'Strike derby', src: '/gifs/dux-strike-derby.gif',
    blurb: 'Ten rolls at a full rack. Every strike scores a point and earns a bonus roll. Ties go to sudden death.' },
  { key: 'Dux hunt', src: '/gifs/dux-hunt.gif',
    blurb: 'An arcade wave-shooter scored by real pinfall. A fresh scatter of pins each round, and the bar keeps rising.' },
];

function Picker({ items, label }: { items: Item[]; label: string }) {
  const [i, setI] = useState(0);
  const cur = items[i];
  const isVideo = cur.src.endsWith('.mp4');
  return (
    <>
      <div className="gamepick" role="tablist" aria-label={label}>
        {items.map((x, k) => (
          <button key={x.key} role="tab" aria-selected={k === i} data-on={k === i ? '1' : '0'} onClick={() => setI(k)}>
            {x.key}
          </button>
        ))}
      </div>
      <div className="gameview">
        {isVideo ? (
          <video key={cur.src} src={cur.src} autoPlay loop muted playsInline aria-label={`${cur.key}: ${cur.blurb}`} />
        ) : (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img key={cur.src} src={cur.src} alt={`${cur.key}: ${cur.blurb}`} loading="lazy" />
        )}
        <div>
          <h3 className="stripe sub" style={{ fontSize: 20 }}>{cur.key}</h3>
          <p className="lede" style={{ fontSize: 14 }}>{cur.blurb}</p>
        </div>
      </div>
    </>
  );
}

export default function BuildBox() {
  return (
    <div className="buildbox">
      <div className="part">
        <p className="eyebrow">The pinsetter</p>
        <h3 className="stripe sub">A machine that sets any rack</h3>
        <p className="lede">
          Every pinsetter ever sold sets one thing: the full rack. The Dux Setter&apos;s distributor places pins one
          at a time into any pattern you ask for. Real freestanding duckpin action, no strings — built almost
          entirely from stock industrial parts, so wear items carry catalog numbers and any automation tech or
          machine shop can service it.
        </p>
        <Picker items={PARTS} label="Pinsetter components" />
      </div>

      <div className="part">
        <p className="eyebrow">The software</p>
        <h3 className="stripe sub">A growing suite of games, built on custom pin configurations</h3>
        <p className="lede">
          Because the machine can set any rack on command, the platform runs games no bowling center has ever
          been able to offer — and we keep adding to them. Every ball is tracked pin by pin, so scoring is
          automatic and each bowler&apos;s stats, avatar and achievements live in one account that follows them
          to any Dux lane.
        </p>
        <Picker items={GAMES} label="Game modes" />
      </div>
    </div>
  );
}
