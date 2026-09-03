import { NextResponse } from 'next/server';
import { upsertRow, supabaseReady } from '../../lib/supabase';
import { send, siteUrl } from '../../lib/mail';
import { confirmEmail, SUBJECT } from '../../lib/forms';

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
  const ideas = String(body.ideas ?? '').trim().slice(0, 4000);
  const showOnBoard = Boolean(body.show_on_board);

  if (name.length < 2) return NextResponse.json({ ok: false, error: 'Please add your name.' }, { status: 400 });
  if (!isEmail(email)) return NextResponse.json({ ok: false, error: 'Please add a valid email.' }, { status: 400 });

  // Only a first name and last initial are ever shown publicly.
  const parts = name.split(/\s+/);
  const display = parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.` : parts[0];

  if (!supabaseReady()) {
    return NextResponse.json({ ok: false, error: 'Signup is not connected yet. Please email andrew@duxbowling.com.' }, { status: 500 });
  }

  // Re-submitting with the same email refreshes the row and re-sends the link.
  const res = await upsertRow(
    'bowler_signups',
    {
      name,
      email,
      home_alley: homeAlley || null,
      ideas: ideas || null,
      display_name: display,
      show_on_board: showOnBoard,
      status: 'pending',
      confirmed_at: null,
    },
    'email'
  );
  const row = res.rows[0];
  if (!res.ok || !row) {
    return NextResponse.json({ ok: false, error: 'Could not save that. Please email andrew@duxbowling.com.' }, { status: 500 });
  }

  const link = `${siteUrl(req)}/confirm?k=bowler&t=${row.confirm_token}`;
  const sent = await send({
    to: email,
    subject: SUBJECT.bowler,
    html: confirmEmail('bowler', row, link),
  });

  return NextResponse.json({ ok: true, emailed: sent });
}
