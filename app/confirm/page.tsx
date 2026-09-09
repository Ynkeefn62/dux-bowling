import type { Metadata } from 'next';
import Link from 'next/link';
import { patchRows, selectRows, supabaseReady } from '../lib/supabase';
import { send, notifyAddress } from '../lib/mail';
import { Kind, TABLE, NAME_FIELD, notifyEmail } from '../lib/forms';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Confirm — Dux Bowling',
  robots: { index: false, follow: false },
};

type Row = Record<string, unknown>;
type Result = 'ok' | 'already' | 'bad' | 'unconfigured';

const isKind = (v: string | undefined): v is Kind =>
  v === 'alley' || v === 'bowler' || v === 'investor';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function confirm(kind: Kind, token: string): Promise<{ result: Result; row?: Row }> {
  if (!supabaseReady()) return { result: 'unconfigured' };
  const table = TABLE[kind];

  const found = await selectRows<Row>(table, `select=*&confirm_token=eq.${token}&limit=1`);
  const existing = found.rows[0];
  if (!found.ok || !existing) return { result: 'bad' };
  if (existing.status === 'confirmed') return { result: 'already', row: existing };

  const patched = await patchRows<Row>(table, `confirm_token=eq.${token}&status=eq.pending`, {
    status: 'confirmed',
    confirmed_at: new Date().toISOString(),
  });
  const row = patched.rows[0] ?? existing;
  if (!patched.ok) return { result: 'bad' };

  // Andrew only ever hears about confirmed submissions.
  await send({
    to: notifyAddress(),
    subject:
      kind === 'alley'
        ? `Alley response confirmed: ${String(row.alley_name ?? row.contact_name ?? '')}`
        : kind === 'bowler'
        ? `Bowler signup confirmed: ${String(row.name ?? '')}`
        : `Investor enquiry confirmed: ${String(row.name ?? '')}`,
    html: notifyEmail(kind, row),
    replyTo: String(row.email ?? ''),
  });

  return { result: 'ok', row };
}

export default async function ConfirmPage({
  searchParams,
}: {
  searchParams: { k?: string; t?: string };
}) {
  const kind = searchParams.k;
  const token = searchParams.t ?? '';
  const valid = isKind(kind) && UUID.test(token);
  const { result, row } = valid
    ? await confirm(kind, token)
    : { result: 'bad' as Result, row: undefined };

  const name = row && isKind(kind) ? String(row[NAME_FIELD[kind]] ?? '') : '';
  const first = name.split(/\s+/)[0];

  return (
    <main>
      <section>
        <div className="wrap" style={{ maxWidth: 640 }}>
          <div className="card" style={{ borderColor: result === 'bad' ? undefined : '#6b3a1e', padding: '42px 26px', textAlign: 'center' }}>
            {result === 'ok' && (
              <>
                <p className="eyebrow">Confirmed</p>
                <h1 className="stripe sec" style={{ color: 'var(--orange)', fontSize: 'clamp(26px,5vw,38px)' }}>
                  {first ? `Thank you, ${first}.` : 'Thank you.'}
                </h1>
                <hr className="rule" style={{ margin: '14px auto 18px' }} />
                <p className="lede" style={{ margin: '0 auto' }}>
                  {kind === 'bowler'
                    ? 'You are on the list, and your name is on the board. We will let you know the moment there is a Dux lane near you.'
                    : 'Your response is on its way to Andrew, and he will follow up personally. A copy is in your inbox for your records.'}
                </p>
              </>
            )}

            {result === 'already' && (
              <>
                <p className="eyebrow">Already confirmed</p>
                <h1 className="stripe sec" style={{ fontSize: 'clamp(24px,4.4vw,32px)' }}>You are all set.</h1>
                <hr className="rule" style={{ margin: '14px auto 18px' }} />
                <p className="lede" style={{ margin: '0 auto' }}>
                  This link was already used, so there is nothing more to do. If you meant to send something new,
                  fill the form in again and we will send a fresh link.
                </p>
              </>
            )}

            {result === 'bad' && (
              <>
                <p className="eyebrow">Link not recognised</p>
                <h1 className="stripe sec" style={{ fontSize: 'clamp(24px,4.4vw,32px)' }}>That link didn&apos;t work.</h1>
                <hr className="rule" style={{ margin: '14px auto 18px' }} />
                <p className="lede" style={{ margin: '0 auto' }}>
                  It may have been copied incompletely. Try tapping the button in the email again, or send the form
                  once more and we will email you a new link.
                </p>
              </>
            )}

            {result === 'unconfigured' && (
              <>
                <p className="eyebrow">Not connected yet</p>
                <h1 className="stripe sec" style={{ fontSize: 'clamp(24px,4.4vw,32px)' }}>Almost there.</h1>
                <hr className="rule" style={{ margin: '14px auto 18px' }} />
                <p className="lede" style={{ margin: '0 auto' }}>
                  Confirmation is not switched on for this environment yet. Please email{' '}
                  <a href="mailto:andrew@duxbowling.com" style={{ color: 'var(--orange)' }}>andrew@duxbowling.com</a>.
                </p>
              </>
            )}

            <div className="btnrow" style={{ justifyContent: 'center', marginTop: 24 }}>
              <Link className="btn primary" href="/">Back to Dux Bowling</Link>
              {kind === 'bowler' && result === 'ok' && (
                <Link className="btn" href="/bowlers">See the board</Link>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
