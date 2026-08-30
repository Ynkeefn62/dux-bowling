import { NextResponse } from 'next/server';
import { insertRow, supabaseReady } from '../../lib/supabase';
import { notify, esc } from '../../lib/mail';

export const dynamic = 'force-dynamic';

const isEmail = (s: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s);
const str = (v: unknown, max = 4000) => String(v ?? '').trim().slice(0, max);
const num = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 && n < 500 ? Math.round(n) : null;
};

const LABELS: [string, string][] = [
  ['years', 'Years as owner/operator'],
  ['experience', 'Experience — best and worst'],
  ['duckpin_lanes', 'Duckpin lanes'],
  ['tenpin_lanes', 'Ten-pin lanes'],
  ['downtime', 'Downtime'],
  ['leagues', 'Leagues and tournaments'],
  ['satisfaction', 'Sherman satisfaction (1-10)'],
  ['third_party', 'Third-party entertainment/scoring system'],
  ['maintenance', 'Servicing and maintenance cost'],
  ['like_dislike', 'Likes and dislikes about the Sherman'],
  ['one_feature', 'One feature they would add'],
  ['startup', 'Replacing/expanding, and trying a startup'],
  ['meet', 'Willing to meet'],
  ['anything_else', 'Anything else'],
];

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Bad request' }, { status: 400 });
  }

  const contact = str(body.contact_name, 80);
  const email = str(body.email, 120);
  const alley = str(body.alley_name, 120);
  if (contact.length < 2) return NextResponse.json({ ok: false, error: 'Please add your name.' }, { status: 400 });
  if (!isEmail(email)) return NextResponse.json({ ok: false, error: 'Please add a valid email.' }, { status: 400 });
  if (alley.length < 2) return NextResponse.json({ ok: false, error: 'Please add your alley name.' }, { status: 400 });

  const row = {
    contact_name: contact,
    email,
    phone: str(body.phone, 40) || null,
    role: str(body.role, 60) || null,
    alley_name: alley,
    location: str(body.location, 120) || null,
    years: str(body.years, 80) || null,
    duckpin_lanes: num(body.duckpin_lanes),
    tenpin_lanes: num(body.tenpin_lanes),
    satisfaction: num(body.satisfaction),
    experience: str(body.experience) || null,
    downtime: str(body.downtime) || null,
    leagues: str(body.leagues) || null,
    third_party: str(body.third_party) || null,
    maintenance: str(body.maintenance) || null,
    like_dislike: str(body.like_dislike) || null,
    one_feature: str(body.one_feature) || null,
    startup: str(body.startup) || null,
    meet: str(body.meet, 80) || null,
    anything_else: str(body.anything_else) || null,
  };

  let stored = false;
  if (supabaseReady()) {
    const res = await insertRow('alley_interest', row);
    stored = res.ok;
  }

  const lines = [
    `<b>${esc(alley)}</b> — ${esc(contact)}${row.role ? ` (${esc(row.role)})` : ''}`,
    `${esc(email)}${row.phone ? ` &middot; ${esc(row.phone)}` : ''}${row.location ? ` &middot; ${esc(row.location)}` : ''}`,
    '<hr/>',
    ...LABELS.filter(([k]) => (row as Record<string, unknown>)[k])
      .map(([k, label]) => `<b>${label}:</b><br/>${esc((row as Record<string, unknown>)[k]).replace(/\n/g, '<br/>')}`),
  ];
  const mailed = await notify(`Alley interest: ${alley}`, lines);

  if (!stored && !mailed) {
    return NextResponse.json(
      { ok: false, error: 'We could not record that. Please email andrew@duxbowling.com directly.' },
      { status: 500 }
    );
  }
  return NextResponse.json({ ok: true });
}
