// Email notification via Resend. Silently no-ops when unconfigured so a form
// submission is never lost just because email is not wired up yet.
export async function notify(subject: string, lines: string[]): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  const to = process.env.NOTIFY_EMAIL || 'andrew@duxbowling.com';
  const from = process.env.MAIL_FROM || 'Dux Bowling <onboarding@resend.dev>';
  if (!key) return false;
  const html = `<div style="font-family:system-ui,sans-serif;font-size:14px;line-height:1.65">
    ${lines.map((l) => `<p style="margin:0 0 10px">${l}</p>`).join('')}
  </div>`;
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({ from, to: [to], subject, html }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export const esc = (s: unknown) =>
  String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
