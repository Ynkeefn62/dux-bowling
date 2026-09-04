'use client';
import { useState } from 'react';
import SentModal from '../components/SentModal';
import { lookupZip } from '../lib/zip';

type Vals = Record<string, string | number | boolean>;

const REQUIRED: [string, string][] = [
  ['contact_name', 'your name'],
  ['role', 'your role'],
  ['email', 'your email'],
  ['alley_name', 'your alley name'],
  ['zip', 'your zip code'],
  ['duckpin_lanes', 'the number of duckpin lanes'],
  ['satisfaction', 'your satisfaction rating'],
  ['meet', 'whether we can meet'],
];

const STARTUP_Qs: { id: string; q: string; hint?: string }[] = [
  {
    id: 'startup',
    q: 'Would you consider replacing or expanding your duckpin lanes?',
    hint: 'Would you try a product from a startup? What would you need to see to feel comfortable? Would you pilot a brand-new pinsetter if special benefits came with it?',
  },
  {
    id: 'replace_timing',
    q: 'When would you want to replace your pinsetters?',
    hint: 'For example: within 3 months, within a year, in 1-2 years, no plans yet',
  },
  {
    id: 'price_expectation',
    q: 'What would you be willing to pay for a new pinsetter?',
    hint: 'Is that price negotiable if we can prove savings in maintenance and increased revenue? Would you pay a monthly fee to cover maintenance?',
  },
  {
    id: 'software_interest',
    q: 'Are you interested in the software we are building?',
    hint: 'Would you pay a monthly fee for access to all of the benefits — games, league tools, the alley dashboard?',
  },
  {
    id: 'feedback_culture',
    q: 'Do the companies you work with today let you give feedback that actually improves their product?',
  },
  { id: 'anything_else', q: 'Anything else we should know, or any feedback for us?' },
];

const SHERMAN_Qs: { id: string; q: string; hint?: string }[] = [
  { id: 'third_party', q: 'Is your Sherman pinsetter integrated with a third-party entertainment or scoring system?', hint: 'If so — how much per month, what comes with it, and can you request changes or upgrades?' },
  { id: 'maintenance', q: 'How do you service your Sherman pinsetters?', hint: 'Someone on staff or a contracted engineer? Roughly what per month? Are lanes ever down waiting on repairs?' },
  { id: 'like_dislike', q: 'What do you like about the Sherman pinsetter? What do you not like?' },
  { id: 'one_feature', q: 'If you could add one feature to your current pinsetter, scoring system and maintenance setup, what would it be?' },
];

const BUSINESS_Qs: { id: string; q: string }[] = [
  { id: 'experience', q: 'How has your experience been running the alley? What is the best part, and what is the worst?' },
  { id: 'downtime', q: 'Is there much downtime in your alley? Does it vary between your duckpin and ten-pin lanes?' },
  { id: 'leagues', q: 'Does your alley host leagues and tournaments? Is it a challenge to fill them?' },
];

export default function AlleyForm() {
  const [v, setV] = useState<Vals>({ satisfaction: 0, meet: '', role: '' });
  const [bad, setBad] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [sent, setSent] = useState(false);
  const [zipMsg, setZipMsg] = useState('');

  const set = (k: string, val: string | number | boolean) => {
    setV((p) => ({ ...p, [k]: val }));
    if (bad[k]) setBad((p) => ({ ...p, [k]: false }));
  };
  const s = (k: string) => String(v[k] ?? '');

  async function onZip(value: string) {
    set('zip', value);
    if (!/^\d{5}$/.test(value)) return;
    setZipMsg('Looking up…');
    const hit = await lookupZip(value);
    if (hit) {
      setV((p) => ({ ...p, city: hit.city, state: hit.state, zip: value }));
      setZipMsg(`${hit.city}, ${hit.state}`);
    } else {
      setZipMsg('Could not find that zip — please type your city and state.');
    }
  }

  function validate(): string {
    const missing: string[] = [];
    const nextBad: Record<string, boolean> = {};
    for (const [key, label] of REQUIRED) {
      const val = v[key];
      const empty = val === undefined || val === '' || val === 0 || val === null;
      if (empty) {
        missing.push(label);
        nextBad[key] = true;
      }
    }
    if (s('role') === 'Other' && !s('role_other').trim()) {
      missing.push('your role');
      nextBad.role_other = true;
    }
    const email = s('email');
    if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      missing.push('a valid email');
      nextBad.email = true;
    }
    setBad(nextBad);
    if (!missing.length) return '';
    const first = Object.keys(nextBad)[0];
    document.getElementById(first)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return `Please add ${missing.slice(0, 3).join(', ')}${missing.length > 3 ? ` and ${missing.length - 3} more` : ''}.`;
  }

  async function submit() {
    const problem = validate();
    setErr(problem);
    if (problem) return;
    setBusy(true);
    try {
      const payload = { ...v, location: [s('city'), s('state')].filter(Boolean).join(', ') };
      const res = await fetch('/api/alley-interest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const j = await res.json();
      if (!res.ok || !j.ok) throw new Error(j.error || 'Something went wrong.');
      setSent(true);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Something went wrong. You can also email andrew@duxbowling.com.');
    } finally {
      setBusy(false);
    }
  }

  const Text = ({ id, q, hint }: { id: string; q: string; hint?: string }) => (
    <div className="field" key={id}>
      <label className="q" htmlFor={id}>
        {q}
        {hint && <><br /><span className="opt">{hint}</span></>}
      </label>
      <textarea id={id} className="ta" value={s(id)} onChange={(e) => set(id, e.target.value)} />
    </div>
  );

  if (sent) {
    return (
      <div className="card" style={{ borderColor: 'var(--accent-line)', textAlign: 'center', padding: '46px 20px' }}>
        <h2 className="stripe sec" style={{ color: 'var(--orange)' }}>Check your email.</h2>
        <p className="lede" style={{ margin: '12px auto 0' }}>
          We sent a copy of everything you submitted, with a button to confirm it is really you. One tap and it
          goes straight to Andrew — until then nothing is passed on.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="card" style={{ marginBottom: 16 }}>
        <p className="eyebrow" style={{ marginBottom: 14 }}>About you and your house</p>
        <div className="grid g2">
          <div className="field">
            <label className="q" htmlFor="contact_name">What is your name?<span className="req">*</span></label>
            <input id="contact_name" className="inp" data-bad={bad.contact_name ? '1' : '0'}
              value={s('contact_name')} onChange={(e) => set('contact_name', e.target.value)} />
          </div>
          <div className="field">
            <label className="q" htmlFor="role">Your role<span className="req">*</span></label>
            <select id="role" className="inp" data-bad={bad.role ? '1' : '0'} value={s('role')}
              onChange={(e) => set('role', e.target.value)}>
              <option value="">Select…</option>
              <option>Owner</option><option>General manager</option>
              <option>Mechanic / head tech</option><option>Other</option>
            </select>
            {s('role') === 'Other' && (
              <input id="role_other" className="inp" style={{ marginTop: 8 }} placeholder="Tell us your role"
                data-bad={bad.role_other ? '1' : '0'} value={s('role_other')}
                onChange={(e) => set('role_other', e.target.value)} />
            )}
          </div>
        </div>
        <div className="grid g2">
          <div className="field">
            <label className="q" htmlFor="email">Email<span className="req">*</span></label>
            <input id="email" className="inp" type="email" data-bad={bad.email ? '1' : '0'}
              value={s('email')} onChange={(e) => set('email', e.target.value)} />
          </div>
          <div className="field">
            <label className="q" htmlFor="phone">Phone <span className="opt">optional</span></label>
            <input id="phone" className="inp" value={s('phone')} onChange={(e) => set('phone', e.target.value)} />
          </div>
        </div>
        <div className="field">
          <label className="q" htmlFor="alley_name">Alley name<span className="req">*</span></label>
          <input id="alley_name" className="inp" data-bad={bad.alley_name ? '1' : '0'}
            value={s('alley_name')} onChange={(e) => set('alley_name', e.target.value)} />
        </div>
        <div className="grid g3">
          <div className="field">
            <label className="q" htmlFor="zip">Zip code<span className="req">*</span></label>
            <input id="zip" className="inp" inputMode="numeric" maxLength={5} data-bad={bad.zip ? '1' : '0'}
              value={s('zip')} onChange={(e) => onZip(e.target.value.replace(/\D/g, ''))} />
            {zipMsg && <div className="fielderr" style={{ color: 'var(--ghost)' }}>{zipMsg}</div>}
          </div>
          <div className="field">
            <label className="q" htmlFor="city">City</label>
            <input id="city" className="inp" value={s('city')} onChange={(e) => set('city', e.target.value)} />
          </div>
          <div className="field">
            <label className="q" htmlFor="state">State</label>
            <input id="state" className="inp" maxLength={20} value={s('state')} onChange={(e) => set('state', e.target.value)} />
          </div>
        </div>
        <div className="field">
          <label className="q" htmlFor="years">How long have you been the owner or operator?</label>
          <input id="years" className="inp" value={s('years')} onChange={(e) => set('years', e.target.value)} placeholder="e.g. 12 years" />
        </div>
        <div className="grid g2">
          <div className="field">
            <label className="q" htmlFor="duckpin_lanes">How many duckpin lanes?<span className="req">*</span></label>
            <input id="duckpin_lanes" className="inp" type="number" min="0" data-bad={bad.duckpin_lanes ? '1' : '0'}
              value={s('duckpin_lanes')} onChange={(e) => set('duckpin_lanes', e.target.value)} />
          </div>
          <div className="field">
            <label className="q" htmlFor="tenpin_lanes">How many ten-pin lanes?</label>
            <input id="tenpin_lanes" className="inp" type="number" min="0"
              value={s('tenpin_lanes')} onChange={(e) => set('tenpin_lanes', e.target.value)} />
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <p className="eyebrow" style={{ marginBottom: 14 }}>Your Sherman machines</p>
        <div className="field" id="satisfaction">
          <label className="q">
            On a scale of 1 to 10, how satisfied are you with your Sherman duckpin pinsetters?<span className="req">*</span>
          </label>
          <div className="scale">
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
              <button key={n} type="button" data-on={v.satisfaction === n ? '1' : '0'} onClick={() => set('satisfaction', n)}>
                {n}
              </button>
            ))}
          </div>
          {bad.satisfaction && <div className="fielderr">Please pick a number.</div>}
        </div>
        {SHERMAN_Qs.map((q) => <Text key={q.id} {...q} />)}
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <p className="eyebrow" style={{ marginBottom: 14 }}>Running the business</p>
        {BUSINESS_Qs.map((q) => <Text key={q.id} {...q} />)}
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <p className="eyebrow" style={{ marginBottom: 14 }}>Working with a startup</p>
        {STARTUP_Qs.map((q) => <Text key={q.id} {...q} />)}
        <div className="field" id="meet">
          <label className="q">
            Could we meet in person to discuss specifics?<span className="req">*</span>
            <br />
            <span className="opt">
              Our initial design is finished and a patent filing is close behind, followed by a prototype build to
              validate that pin cycling works as intended. Once that is proven we are looking for alleys to pilot
              the machine in live play.
            </span>
          </label>
          <div className="btnrow">
            {['Yes — get in touch', 'Maybe — send more detail first', 'Not right now'].map((opt) => (
              <button key={opt} type="button" className="btn"
                style={v.meet === opt ? { borderColor: 'var(--accent-line)', color: 'var(--orange)', background: 'var(--accent-soft)' } : undefined}
                onClick={() => set('meet', opt)}>
                {opt}
              </button>
            ))}
          </div>
          {bad.meet && <div className="fielderr">Please choose one.</div>}
        </div>
      </div>

      {err && <p className="err">{err}</p>}
      <button className="btn primary block" style={{ marginTop: 10 }} onClick={submit} disabled={busy}>
        {busy ? 'Sending…' : 'Send it down the lane'}
      </button>
      <p style={{ color: 'var(--ghost)', fontSize: 11.5, textAlign: 'center', marginTop: 12 }}>
        Fields marked <span style={{ color: 'var(--orange)' }}>*</span> are required. Everything else is optional —
        answer what you can.
      </p>
    </div>
  );
}
