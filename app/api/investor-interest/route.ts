import { NextResponse } from 'next/server';
import { insertRow, supabaseReady } from '../../lib/supabase';
import { notify, esc } from '../../lib/mail';

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
  };

  let stored = false;
  if (supabaseReady()) stored = (await insertRow('investor_interest', row)).ok;

  const mailed = await notify(`Investor interest: ${name}`, [
    `<b>${esc(name)}</b>${row.organization ? ` — ${esc(row.organization)}` : ''}`,
    `${esc(email)}${row.investor_type ? ` &middot; ${esc(row.investor_type)}` : ''}`,
    row.meet ? `<b>Meeting:</b> ${esc(row.meet)}` : '',
    row.ideas ? `<b>Questions / ideas:</b><br/>${esc(row.ideas).replace(/\n/g, '<br/>')}` : '',
  ].filter(Boolean));

  if (!stored && !mailed) {
    return NextResponse.json(
      { ok: false, error: 'We could not record that. Please email andrew@duxbowling.com directly.' },
      { status: 500 }
    );
  }
  return NextResponse.json({ ok: true });
}
