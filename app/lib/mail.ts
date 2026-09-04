// Transactional email via Resend. Supabase stores the data; it is not an email
// service for arbitrary mail, so sending runs through a provider.
type SendArgs = { to: string; subject: string; html: string; replyTo?: string };

export async function send({ to, subject, html, replyTo }: SendArgs): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.MAIL_FROM || 'Dux Bowling <onboarding@resend.dev>';
  if (!key) return false;
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({ from, to: [to], subject, html, ...(replyTo ? { reply_to: [replyTo] } : {}) }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export const notifyAddress = () => process.env.NOTIFY_EMAIL || 'andrew@duxbowling.com';

/** Absolute site origin, for building confirmation links. */
export function siteUrl(req?: Request): string {
  const env = process.env.SITE_URL;
  if (env) return env.replace(/\/$/, '');
  if (req) {
    const h = new Headers(req.headers);
    const host = h.get('x-forwarded-host') || h.get('host');
    const proto = h.get('x-forwarded-proto') || 'https';
    if (host) return `${proto}://${host}`;
  }
  return 'https://duxbowling.com';
}
