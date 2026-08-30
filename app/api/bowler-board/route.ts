import { NextResponse } from 'next/server';
import { selectRows, supabaseReady } from '../../lib/supabase';

export const dynamic = 'force-dynamic';

type Row = { display_name: string; home_alley: string | null; created_at: string };

export async function GET() {
  if (!supabaseReady()) return NextResponse.json({ ok: true, board: [], count: 0 });
  const { ok, rows } = await selectRows<Row>(
    'bowler_signups',
    'select=display_name,home_alley,created_at&show_on_board=eq.true&order=created_at.desc&limit=200'
  );
  if (!ok) return NextResponse.json({ ok: true, board: [], count: 0 });
  return NextResponse.json({ ok: true, board: rows, count: rows.length });
}
