'use client';
import { useState } from 'react';

type Point = {
  id: string;
  name: string;
  sub: string;
  x: number;
  y: number;
  detail: string;
  hero?: boolean;
  ghost?: boolean;
};

type Exhibit = {
  key: 'hardware' | 'software';
  label: string;
  xTitle: string;
  xLeft: string;
  xRight: string;
  yTitle: string;
  yLow: string;
  yHigh: string;
  note: string;
  points: Point[];
};

const HARDWARE: Exhibit = {
  key: 'hardware',
  label: 'The machine',
  xTitle: 'Level of difficulty',
  xLeft: 'Ten pin — easier',
  xRight: 'Duckpin — harder',
  yTitle: 'Level of authenticity',
  yLow: 'String — less authentic',
  yHigh: 'Freestanding — more authentic',
  note:
    'No freestanding duckpin pinsetter has been manufactured since Sherman ceased production in 1973; surviving machines run on scavenged parts. Every duckpin system sold today is a string pinsetter.',
  points: [
    { id: 'gsnxt', name: 'Brunswick GS NXT', sub: 'free-fall ten-pin', x: 0.11, y: 0.86,
      detail: 'The current flagship free-fall ten-pin machine. Real pin action, high reliability — and no duckpin version.' },
    { id: 'edge', name: 'QubicaAMF EDGE / 82-90XLi', sub: 'free-fall ten-pin', x: 0.30, y: 0.75,
      detail: 'Descendants of the 82-70 design still in production. The ten-pin standard, sold worldwide, ten-pin only.' },
    { id: 'boost', name: 'Brunswick Boost ST', sub: 'USBC-certified string', x: 0.09, y: 0.46,
      detail: 'A dual-purpose string machine certified by USBC. Certified strings must run at least 54 inches specifically to imitate free-fall action.' },
    { id: 'conq', name: 'QubicaAMF Conqueror', sub: 'string ten-pin', x: 0.28, y: 0.34,
      detail: 'QubicaAMF\u2019s answer to low-cost string entrants, backed by their global service network.' },
    { id: 'aero', name: 'Flying AEROPIN', sub: 'USBC-certified string', x: 0.15, y: 0.19,
      detail: 'Certified string pinsetter competing hard on total cost of ownership rather than pin action.' },
    { id: 'mini', name: 'Mini bowling systems', sub: 'short lane, light ball', x: 0.03, y: 0.06,
      detail: 'Shortened lanes and light balls built for casual play in entertainment venues. Easy by design, and not duckpin.' },
    { id: 'bsocial', name: 'Brunswick Duckpin Social', sub: 'StringPin', x: 0.72, y: 0.44,
      detail: 'Brunswick\u2019s StringPin machine configured for duckpin — the biggest name currently selling into duckpin, on strings.' },
    { id: 'funk', name: 'Funk Bowling duckpin', sub: 'string', x: 0.87, y: 0.25,
      detail: 'Turnkey duckpin packages for venues adding bowling as an attraction. String technology throughout.' },
    { id: 'infinity', name: 'Infinity Bol duckpin', sub: 'string', x: 0.68, y: 0.12,
      detail: 'Custom-built social duckpin installations, credited with starting the social duckpin wave in 2016. String pinsetters.' },
    { id: 'fsdb', name: 'Flying FSDB duckpin', sub: 'string, shortened lane', x: 0.45, y: 0.05,
      detail: 'Compact duckpin with a customizable lane length as short as 9.2 metres — easier than a regulation duckpin house.' },
    { id: 'sherman', name: 'Sherman duckpin setter', sub: 'out of production since 1973', x: 0.72, y: 0.80, ghost: true,
      detail: 'The only freestanding duckpin pinsetter ever mass produced. Sherman closed in 1973; roughly 35 duckpin centers keep the survivors alive on parts scavenged from houses that have closed.' },
    { id: 'dux', name: 'Dux Setter', sub: 'freestanding duckpin', x: 0.91, y: 0.93, hero: true,
      detail: 'Freestanding duckpin action with no strings, built on catalog industrial parts — and a distributor that places pins one at a time into any pattern you ask for.' },
  ],
};

const SOFTWARE: Exhibit = {
  key: 'software',
  label: 'The platform',
  xTitle: 'Length of data retention',
  xLeft: 'Session only',
  xRight: 'Permanent profile',
  yTitle: 'Level of fun',
  yLow: 'Scorekeeping only',
  yHigh: 'Games & competition',
  note:
    'Center scoring systems are siloed to one house and built around the session: open-play scores disappear when the game ends. Lanetalk keeps a permanent profile but adds no gameplay. Dux keeps the record and the games in one account.',
  points: [
    { id: 'paper', name: 'Paper sheets / legacy duckpin', sub: 'no bowler record at all', x: 0.04, y: 0.05,
      detail: 'How much of duckpin still runs today: a printed sheet, a pencil, and nothing kept once the night is over.' },
    { id: 'stel', name: 'Steltronic Focus', sub: 'center-siloed scoring', x: 0.26, y: 0.36,
      detail: 'Solid, well-priced scoring built for the front desk. Your history lives in that one building.' },
    { id: 'sync', name: 'Brunswick Sync', sub: 'center-siloed, session-based', x: 0.34, y: 0.56,
      detail: 'Lane animations, themes and touchscreens designed around open play; league history lives in separate software.' },
    { id: 'besx', name: 'QubicaAMF BES X + HyperBowling', sub: 'rich games, session-based', x: 0.22, y: 0.82,
      detail: 'The most entertaining lane software in the industry — video-game-like play with progressive levels. It is genuinely fun, and it forgets you when you leave.' },
    { id: 'bls', name: 'CDE BLS league software', sub: 'league records only', x: 0.78, y: 0.10,
      detail: 'The long-standing standard for league secretaries. Deep records, no gameplay, and nothing for open play.' },
    { id: 'lanetalk', name: 'Lanetalk', sub: 'permanent profile, no gameplay', x: 0.86, y: 0.36,
      detail: 'A lifetime bowler profile across roughly 1,700 connected centers with real stats — built for ten-pin league bowlers, with almost no duckpin presence.' },
    { id: 'duxp', name: 'Dux platform', sub: 'profile + games', x: 0.91, y: 0.93, hero: true,
      detail: 'One account that follows a bowler to any Dux lane: stats, avatars, achievements, leagues — and a growing suite of games only possible when the machine can set any rack.' },
  ],
};

const EXHIBITS = [HARDWARE, SOFTWARE];
const W = 720;
const H = 440;
const M = { l: 74, r: 26, t: 26, b: 66 };

export default function Positioning({ only }: { only?: 'hardware' | 'software' }) {
  const list = only ? EXHIBITS.filter((e) => e.key === only) : EXHIBITS;
  const [tab, setTab] = useState(0);
  const [sel, setSel] = useState<string | null>(null);
  const ex = list[Math.min(tab, list.length - 1)];
  const px = (x: number) => M.l + x * (W - M.l - M.r);
  const py = (y: number) => H - M.b - y * (H - M.t - M.b);
  const active = ex.points.find((p) => p.id === sel) ?? ex.points.find((p) => p.hero)!;

  return (
    <div className="exhibit">
      <div className="exhibit-head">
        <div>
          <div className="eyebrow">Market positioning</div>
          <strong style={{ fontSize: 15, letterSpacing: '0.05em' }}>{ex.label}</strong>
        </div>
        {list.length > 1 && (
          <div className="toggle">
            {list.map((e, i) => (
              <button key={e.key} data-on={i === tab ? '1' : '0'} onClick={() => { setTab(i); setSel(null); }}>
                {e.key}
              </button>
            ))}
          </div>
        )}
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={`${ex.label} positioning chart`}>
        <rect x={px(0.5)} y={py(1)} width={px(1) - px(0.5)} height={py(0.5) - py(1)} fill="#1c2440" opacity="0.55" />
        <line x1={px(0.5)} y1={py(0)} x2={px(0.5)} y2={py(1)} stroke="#2a3355" strokeDasharray="2 4" />
        <line x1={px(0)} y1={py(0.5)} x2={px(1)} y2={py(0.5)} stroke="#2a3355" strokeDasharray="2 4" />
        <line x1={px(0)} y1={py(0)} x2={px(1) + 12} y2={py(0)} stroke="#5a6285" strokeWidth="1.3" />
        <line x1={px(0)} y1={py(0)} x2={px(0)} y2={py(1) - 12} stroke="#5a6285" strokeWidth="1.3" />
        <text x={px(0)} y={py(0) + 22} fill="#8b93b8" fontSize="9.5" letterSpacing="1.4">{ex.xLeft.toUpperCase()}</text>
        <text x={px(1) + 12} y={py(0) + 22} fill="#8b93b8" fontSize="9.5" letterSpacing="1.4" textAnchor="end">{ex.xRight.toUpperCase()}</text>
        <text x={(px(0) + px(1)) / 2} y={py(0) + 42} fill="#f2ede4" fontSize="11" letterSpacing="2" textAnchor="middle">{ex.xTitle.toUpperCase()}</text>
        <text transform={`translate(${px(0) - 16} ${py(0)}) rotate(-90)`} fill="#8b93b8" fontSize="9.5" letterSpacing="1.4">{ex.yLow.toUpperCase()}</text>
        <text transform={`translate(${px(0) - 16} ${py(1) - 12}) rotate(-90)`} fill="#8b93b8" fontSize="9.5" letterSpacing="1.4" textAnchor="end">{ex.yHigh.toUpperCase()}</text>
        <text transform={`translate(${px(0) - 40} ${(py(0) + py(1)) / 2}) rotate(-90)`} fill="#f2ede4" fontSize="11" letterSpacing="2" textAnchor="middle">{ex.yTitle.toUpperCase()}</text>

        {ex.points.map((p) => {
          const on = p.id === active.id;
          const fill = p.hero ? '#e8834a' : p.ghost ? '#5a6285' : '#f2ede4';
          return (
            <g key={p.id} className="dot-hit" onClick={() => setSel(p.id)} onMouseEnter={() => setSel(p.id)}>
              <circle cx={px(p.x)} cy={py(p.y)} r="16" fill="transparent" />
              {(p.hero || on) && (
                <circle cx={px(p.x)} cy={py(p.y)} r={p.hero ? 13 : 11} fill="none" stroke={fill} strokeWidth="1.1" opacity="0.9" />
              )}
              <circle cx={px(p.x)} cy={py(p.y)} r={p.hero ? 7 : 4.5} fill={fill} />
              <text
                x={p.x > 0.55 ? px(p.x) - 14 : px(p.x) + 14}
                y={py(p.y) + 3.5}
                textAnchor={p.x > 0.55 ? 'end' : 'start'}
                fill={fill}
                fontSize={p.hero ? 13 : 10.5}
                fontWeight={p.hero ? 700 : 400}
                opacity={on || p.hero ? 1 : 0.82}
              >
                {p.name}
              </text>
            </g>
          );
        })}
      </svg>

      <div className="readout">
        <b>{active.name}</b>
        <span className="chip" style={{ marginLeft: 8 }}>{active.sub}</span>
        <p>{active.detail}</p>
      </div>
      <p style={{ color: '#5a6285', fontSize: 11.5, lineHeight: 1.65, marginTop: 10 }}>{ex.note}</p>
    </div>
  );
}
