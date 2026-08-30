'use client';
import { useState } from 'react';

const GAMES = [
  {
    key: 'Open play',
    src: '/gifs/dux-open-play.gif',
    blurb:
      'Classic duckpin, three balls a frame, scored automatically across every bowler on the lane — no sheet, no pencil, no arguing about the tenth frame.',
  },
  {
    key: 'Practice',
    src: '/gifs/dux-practice-mode.gif',
    blurb:
      'Pick any leave — the 7-10, a sleeper, your personal nemesis — and the machine re-sets that exact rack every single ball, for as long as you want to work on it.',
  },
  {
    key: 'Spare',
    src: '/gifs/dux-spare.gif',
    blurb:
      'Call your rack and clear it, and everyone else has to match it. Miss, and you take a letter. Spell S-P-A-R-E and you are out.',
  },
  {
    key: 'Strike derby',
    src: '/gifs/dux-strike-derby.gif',
    blurb:
      'Ten rolls at a full rack. Every strike scores a point and earns a bonus roll. Ties go to sudden death.',
  },
  {
    key: 'Dux hunt',
    src: '/gifs/dux-hunt.gif',
    blurb:
      'An arcade wave-shooter scored by real pinfall. The machine sets a fresh scatter of pins each round, and the bar keeps rising.',
  },
];

export default function BuildBox() {
  const [g, setG] = useState(0);
  const game = GAMES[g];
  return (
    <div className="buildbox">
      <div className="part">
        <p className="eyebrow">The pinsetter</p>
        <h3 className="stripe sub">A machine that sets any rack</h3>
        <p className="lede">
          Every pinsetter ever sold sets one thing: the full rack. The Dux Setter&apos;s distributor places
          pins one at a time into any pattern you ask for — the full ten, a sleeper, a split, anything. Real
          freestanding duckpin action, no strings. It is built almost entirely from stock industrial parts, so
          wear items carry catalog numbers and any automation tech or machine shop can service it. And when a
          ball kicks out of the gutter and topples a partial rack, the machine restores the exact configuration
          itself — nobody walks the lane.
        </p>
      </div>

      <div className="part">
        <p className="eyebrow">The software</p>
        <h3 className="stripe sub">A growing suite of games, built on custom pin configurations</h3>
        <p className="lede">
          Because the machine can set any rack on command, the platform can run games no bowling center has
          ever been able to offer — and we keep adding to them. Every ball is tracked pin by pin, so scoring is
          automatic and every bowler&apos;s stats, avatar and achievements live in one account that follows them
          to any Dux lane.
        </p>

        <div className="gamepick" role="tablist" aria-label="Game modes">
          {GAMES.map((x, i) => (
            <button key={x.key} role="tab" aria-selected={i === g} data-on={i === g ? '1' : '0'} onClick={() => setG(i)}>
              {x.key}
            </button>
          ))}
        </div>

        <div className="gameview">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img key={game.src} src={game.src} alt={`${game.key} gameplay`} loading="lazy" />
          <div>
            <h3 className="stripe sub" style={{ fontSize: 21 }}>{game.key}</h3>
            <p className="lede" style={{ fontSize: 14 }}>{game.blurb}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
