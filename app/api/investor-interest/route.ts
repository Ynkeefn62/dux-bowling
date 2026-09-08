import { NextResponse } from 'next/server';
import { insertRow, supabaseReady } from '../../lib/supabase';
import { send, siteUrl } from '../../lib/mail';
import { confirmEmail, SUBJECT } from '../../lib/forms';

export const dynamic = 'force-dynamic';

const isEmail = (s: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s);
const str = (v: unknown, max = 4000) => String(v ?? '').trim().slice(0, max);

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Bad request' }, { status: 400 });
  }
  const name = str(body.name, 80);
  const email = str(body.email, 120);
  if (name.length < 2) return NextResponse.json({ ok: false, error: 'Please add your name.' }, { status: 400 });
  if (!isEmail(email)) return NextResponse.json({ ok: false, error: 'Please add a valid email.' }, { status: 400 });

  const row = {
    name,
    email,
    organization: str(body.organization, 140) || null,
    investor_type: str(body.investor_type, 60) || null,
    meet: str(body.meet, 80) || null,
    ideas: str(body.ideas) || null,
    status: 'pending',
  };

  if (!supabaseReady()) {
    return NextResponse.json({ ok: false, error: 'The form is not connected yet. Please email andrew@duxbowling.com.' }, { status: 500 });
  }
  const res = await insertRow('investor_interest', row);
  if (!res.ok || !res.row) {
    return NextResponse.json({ ok: false, error: 'Could not save that. Please email andrew@duxbowling.com.' }, { status: 500 });
  }

  const link = `${siteUrl(req)}/confirm?k=investor&t=${res.row.confirm_token}`;
  const sent = await send({
    to: email,
    subject: SUBJECT.investor,
    html: confirmEmail('investor', res.row, link),
  });

  return NextResponse.json({ ok: true, emailed: sent });
}
