import { NextResponse } from 'next/server';
import { insertRow, supabaseReady } from '../../lib/supabase';
import { notify, esc } from '../../lib/mail';

export const dynamic = 'force-dynamic';

const isEmail = (s: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s);

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Bad request' }, { status: 400 });
  }

  const name = String(body.name ?? '').trim().slice(0, 60);
  const email = String(body.email ?? '').trim().slice(0, 120);
  const homeAlley = String(body.home_alley ?? '').trim().slice(0, 120);
  const showOnBoard = Boolean(body.show_on_board);

  if (name.length < 2) return NextResponse.json({ ok: false, error: 'Please add your name.' }, { status: 400 });
  if (!isEmail(email)) return NextResponse.json({ ok: false, error: 'Please add a valid email.' }, { status: 400 });

  // Only a first name and last initial are ever shown publicly.
  const parts = name.split(/\s+/);
  const display =
    parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.` : parts[0];

  if (supabaseReady()) {
    const res = await insertRow('bowler_signups', {
      name,
      email,
      home_alley: homeAlley || null,
      display_name: display,
      show_on_board: showOnBoard,
    });
    if (!res.ok && !/duplicate/i.test(res.error ?? '')) {
      return NextResponse.json({ ok: false, error: 'Could not save right now.' }, { status: 500 });
    }
  }

  await notify(`New Dux bowler: ${name}`, [
    `<b>${esc(name)}</b> signed up as an interested bowler.`,
    `Email: ${esc(email)}`,
    `Home alley: ${esc(homeAlley || '—')}`,
    `Show on public board: ${showOnBoard ? 'yes' : 'no'}`,
  ]);

  return NextResponse.json({ ok: true, display });
}
