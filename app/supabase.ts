// Minimal server-side Supabase REST helper. No client library needed, and the
// service-role key never leaves the server.
const URL_ = process.env.SUPABASE_URL || '';
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export const supabaseReady = () => Boolean(URL_ && KEY);

type Row = Record<string, unknown>;

export async function insertRow(table: string, row: Row): Promise<{ ok: boolean; error?: string }> {
  if (!supabaseReady()) return { ok: false, error: 'Supabase is not configured' };
  const res = await fetch(`${URL_}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: KEY,
      Authorization: `Bearer ${KEY}`,
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(row),
    cache: 'no-store',
  });
  if (!res.ok) return { ok: false, error: `${res.status} ${await res.text()}` };
  return { ok: true };
}

export async function selectRows<T>(
  table: string,
  query: string
): Promise<{ ok: boolean; rows: T[]; error?: string }> {
  if (!supabaseReady()) return { ok: false, rows: [], error: 'Supabase is not configured' };
  const res = await fetch(`${URL_}/rest/v1/${table}?${query}`, {
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
    cache: 'no-store',
  });
  if (!res.ok) return { ok: false, rows: [], error: `${res.status} ${await res.text()}` };
  return { ok: true, rows: (await res.json()) as T[] };
}
