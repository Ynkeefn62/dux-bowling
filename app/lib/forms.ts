// One place that knows what each form collects, how to render it in an email,
// and where it lives in the database.

export type Kind = 'alley' | 'bowler' | 'investor';

export const TABLE: Record<Kind, string> = {
  alley: 'alley_interest',
  bowler: 'bowler_signups',
  investor: 'investor_interest',
};

export const NAME_FIELD: Record<Kind, string> = {
  alley: 'contact_name',
  bowler: 'name',
  investor: 'name',
};

/** Field order and labels used when echoing answers back in an email. */
export const LABELS: Record<Kind, [string, string][]> = {
  alley: [
    ['contact_name', 'Your name'],
    ['role', 'Role'],
    ['email', 'Email'],
    ['phone', 'Phone'],
    ['alley_name', 'Alley'],
    ['location', 'City / state'],
    ['years', 'Years as owner or operator'],
    ['duckpin_lanes', 'Duckpin lanes'],
    ['tenpin_lanes', 'Ten-pin lanes'],
    ['satisfaction', 'Sherman satisfaction (1-10)'],
    ['third_party', 'Third-party entertainment or scoring system'],
    ['maintenance', 'Servicing and maintenance'],
    ['like_dislike', 'Likes and dislikes about the Sherman'],
    ['one_feature', 'One feature they would add'],
    ['experience', 'Experience running the alley'],
    ['downtime', 'Downtime'],
    ['leagues', 'Leagues and tournaments'],
    ['startup', 'Replacing or expanding, and trying a startup'],
    ['meet', 'Willing to meet'],
    ['anything_else', 'Anything else'],
  ],
  bowler: [
    ['name', 'Name'],
    ['email', 'Email'],
    ['home_alley', 'Home alley'],
    ['ideas', 'Ideas for a Dux lane'],
    ['show_on_board', 'Show on the public board'],
  ],
  investor: [
    ['name', 'Name'],
    ['email', 'Email'],
    ['organization', 'Firm or organization'],
    ['investor_type', 'Investor type'],
    ['meet', 'Would like to meet'],
    ['ideas', 'Questions, ideas or things they want to see'],
  ],
};

export const SUBJECT: Record<Kind, string> = {
  alley: 'Confirm your Dux Bowling response',
  bowler: 'Confirm your Dux Bowling signup',
  investor: 'Confirm your message to Dux Bowling',
};

export const esc = (v: unknown) =>
  String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

const pretty = (v: unknown) => {
  if (v === true) return 'Yes';
  if (v === false) return 'No';
  return esc(v).replace(/\n/g, '<br/>');
};

/** Renders the submitted answers as an HTML block. */
export function renderAnswers(kind: Kind, row: Record<string, unknown>): string {
  const rows = LABELS[kind]
    .filter(([k]) => {
      const v = row[k];
      return v !== null && v !== undefined && v !== '' && !(typeof v === 'number' && Number.isNaN(v));
    })
    .map(
      ([k, label]) =>
        `<tr>
           <td style="padding:8px 14px 8px 0;vertical-align:top;color:#5a6285;font-size:12px;width:210px">${label}</td>
           <td style="padding:8px 0;vertical-align:top;color:#141a30;font-size:14px">${pretty(row[k])}</td>
         </tr>`
    )
    .join('');
  return `<table style="border-collapse:collapse;width:100%">${rows}</table>`;
}

const SHELL = (title: string, intro: string, inner: string, cta?: { href: string; label: string }) => `
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f2ede4;padding:26px">
  <div style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e0d8c8">
    <div style="background:#141a30;padding:22px 26px">
      <div style="color:#e8834a;font-size:26px;font-weight:700;letter-spacing:4px">DUX BOWLING</div>
      <div style="color:#8b93b8;font-size:11px;letter-spacing:2px;margin-top:4px">THE DUCKPIN PINSETTER, REINVENTED</div>
    </div>
    <div style="padding:26px">
      <h1 style="margin:0 0 10px;font-size:20px;color:#141a30">${title}</h1>
      <p style="margin:0 0 18px;font-size:14px;line-height:1.65;color:#4a5270">${intro}</p>
      ${
        cta
          ? `<p style="margin:0 0 22px">
               <a href="${cta.href}" style="display:inline-block;background:#e8834a;color:#1a0f06;text-decoration:none;
                  font-size:14px;font-weight:600;padding:14px 24px;border-radius:10px">${cta.label}</a>
             </p>
             <p style="margin:0 0 22px;font-size:11.5px;color:#8b93b8;word-break:break-all">
               Or paste this into your browser:<br/>${cta.href}
             </p>`
          : ''
      }
      <div style="border-top:1px solid #e6e0d4;padding-top:16px">
        <div style="font-size:11px;letter-spacing:2px;color:#8b93b8;margin-bottom:8px">WHAT YOU SENT</div>
        ${inner}
      </div>
    </div>
    <div style="padding:16px 26px;background:#faf7f1;border-top:1px solid #e6e0d4;font-size:11px;color:#8b93b8">
      Dux Bowling LLC &middot; Frederick, Maryland &middot; andrew@duxbowling.com
    </div>
  </div>
</div>`;

/** Email sent to the person who filled the form, containing their answers + the confirm link. */
export function confirmEmail(kind: Kind, row: Record<string, unknown>, link: string): string {
  const intro =
    kind === 'bowler'
      ? 'Thanks for signing up. Please confirm your email so we can add you to the list — your answers are below for your records.'
      : 'Thanks for taking the time. Please confirm your email so we know it is really you, and your response will be sent along to Andrew. Everything you submitted is below for your records.';
  return SHELL(
    kind === 'bowler' ? 'Confirm your signup' : 'Confirm your response',
    intro,
    renderAnswers(kind, row),
    { href: link, label: kind === 'bowler' ? 'Confirm my signup' : 'Confirm my response' }
  );
}

/** Email sent to Andrew once the submitter has confirmed. */
export function notifyEmail(kind: Kind, row: Record<string, unknown>): string {
  const who =
    kind === 'alley'
      ? `${esc(row.contact_name)} — ${esc(row.alley_name)}`
      : `${esc(row.name)}${row.organization ? ` — ${esc(row.organization)}` : ''}`;
  const label = kind === 'alley' ? 'Alley response' : kind === 'bowler' ? 'Bowler signup' : 'Investor enquiry';
  return SHELL(
    `${label}: ${who}`,
    `Confirmed by email at ${new Date().toISOString().replace('T', ' ').slice(0, 16)} UTC. Reply straight to this address to reach them.`,
    renderAnswers(kind, row)
  );
}
