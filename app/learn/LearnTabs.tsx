'use client';
import { useState } from 'react';
import Link from 'next/link';
import Positioning from '../components/Positioning';

const GAMES = [
  { src: '/gifs/dux-open-play.gif', name: 'Open play', note: 'Classic duckpin, three balls a frame, scored automatically.' },
  { src: '/gifs/dux-practice-mode.gif', name: 'Practice mode', note: 'Pick any pin configuration; the machine re-sets it every ball, as many times as you like.' },
  { src: '/gifs/dux-spare.gif', name: 'Spare elimination', note: 'Call your rack. Miss the match, take a letter. Spell SPARE and you are out.' },
  { src: '/gifs/dux-strike-derby.gif', name: 'Strike derby', note: 'Ten rolls, full racks, most strikes wins — bonus roll for every strike.' },
  { src: '/gifs/dux-hunt.gif', name: 'Dux hunt', note: 'An arcade wave-shooter scored by real pinfall. Beat the bar or you are out.' },
];

function Games({ limit }: { limit?: number }) {
  const list = limit ? GAMES.slice(0, limit) : GAMES;
  return (
    <div className="games">
      {list.map((g) => (
        <div className="game" key={g.src}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={g.src} alt={`${g.name} gameplay`} loading="lazy" />
          <div className="cap">
            <b>{g.name}</b>
            <span>{g.note}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

const TABS = ['For alleys', 'For bowlers', 'For investors'] as const;

export default function LearnTabs() {
  const [tab, setTab] = useState(0);
  return (
    <>
      <div className="tabs" role="tablist">
        {TABS.map((t, i) => (
          <button key={t} role="tab" aria-selected={i === tab} data-on={i === tab ? '1' : '0'} onClick={() => setTab(i)}>
            {t}
          </button>
        ))}
      </div>

      {tab === 0 && (
        <div>
          <h3 className="stripe sub">Your pinsetters deserve retirement</h3>
          <p className="lede">
            Most duckpin houses run machines older than their bowlers, kept alive on salvaged parts, weekend
            mechanics and luck. Here is what changes.
          </p>
          <div className="grid g2" style={{ marginTop: 20 }}>
            <div className="card tile"><b>Easier maintenance</b><span>No more scavenging for parts that stopped being made decades ago. Wear items carry catalog part numbers and fabricated parts ship with full drawings. We are also exploring a staff engineer who maintains the pinsetters for every alley in a region.</span></div>
            <div className="card tile"><b>Alley dashboard</b><span>Stat tracking across all your lanes, anomaly detection that flags any lane scoring lower than expected, plus maintenance requests and a feedback form built into the app.</span></div>
            <div className="card tile"><b>Leagues and tournaments</b><span>Automated sign-ups, scoring, scheduling and alerts delivered straight to your bowlers — no binder, no phone tree, no printout on the corkboard.</span></div>
            <div className="card tile"><b>Increased revenue</b><span>Expanded game options appeal to bowlers of every skill level and cut lane downtime. Saved games and league sign-ups bring customers back.</span></div>
            <div className="card tile"><b>Set any rack on command</b><span>Sell serious practice: any split, any pattern, every time. When a ball kicks out of the gutter and topples a partial rack, the machine restores the exact configuration itself — nobody walks the lane.</span></div>
            <div className="card tile"><b>We value feedback</b><span>We are excited to work with each alley to understand what it needs. Because we are building from scratch, we can design a future where everyone wins.</span></div>
          </div>
          <div className="btnrow" style={{ marginTop: 22 }}>
            <Link className="btn primary" href="/alleys">Tell us about your alley</Link>
          </div>
        </div>
      )}

      {tab === 1 && (
        <div>
          <h3 className="stripe sub">Bowl like it&apos;s 2026</h3>
          <p className="lede">
            Duckpin is the hardest, most charming game in bowling — and it has been stuck with chalkboard-era
            tech for fifty years. On a Dux lane, every ball you throw becomes something.
          </p>
          <div style={{ marginTop: 22 }}><Games /></div>
          <div className="grid g2" style={{ marginTop: 18 }}>
            <div className="card tile"><b>Account and avatar</b><span>Build your own avatar, earn patches and trophies as you bowl, and see yourself on the lane monitor every frame.</span></div>
            <div className="card tile"><b>Score tracking</b><span>A personal dashboard of your stats, with the ability to drill into performance by alley, lane, game number and more.</span></div>
            <div className="card tile"><b>Leagues and tournaments</b><span>Sign up in the app, follow live scoring and standings, and get a push notification the moment weather closes a night.</span></div>
            <div className="card tile"><b>Follow your friends</b><span>Follow the bowlers you know, look at their stats, and compare your game to theirs.</span></div>
          </div>
          <div className="btnrow" style={{ marginTop: 22 }}>
            <Link className="btn primary" href="/bowlers">Add your name</Link>
          </div>
        </div>
      )}

      {tab === 2 && (
        <div>
          <h3 className="stripe sub">A stranded sport with no supplier</h3>
          <p className="lede">
            Duckpin is not a niche version of ten-pin — it is the most accessible version of bowling, stranded
            for fifty years without a machine. Handheld balls with no finger holes mean young kids,
            grandparents and anyone who cannot grip a house ball are all in the game. No perfect game has ever
            been bowled in over a century of duckpin. And it runs on the same lane dimensions as ten-pin, so
            houses can convert lanes without construction.
          </p>
          <div className="grid g3" style={{ marginTop: 20 }}>
            <div className="card tile"><b>The gap</b><span>Zero manufacturers make a freestanding duckpin pinsetter. Every duckpin system sold today uses strings, which produce measurably different pin action.</span></div>
            <div className="card tile"><b>The wedge</b><span>~35 surviving duckpin centers are a beachhead, not the market. The same machine and platform apply to ten-pin houses adding duckpin lanes without construction.</span></div>
            <div className="card tile"><b>The moat</b><span>A configurable distributor that places pins one at a time into any commanded pattern — provisional patent in process — plus the software only that capability makes possible.</span></div>
          </div>
          <div style={{ marginTop: 24 }}><Positioning /></div>
          <p className="lede" style={{ marginTop: 18 }}>
            Explore both exhibits above — switch between the machine and the platform, and tap any competitor
            to see where they sit and why.
          </p>
        </div>
      )}
    </>
  );
}
