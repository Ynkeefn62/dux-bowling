'use client';
import { useState } from 'react';

type Values = Record<string, string | number | boolean>;

const TEXT_QUESTIONS: { id: string; q: string; hint?: string; long?: boolean }[] = [
  { id: 'experience', q: 'How has your experience been running the alley? What is the best part, and what is the worst?', long: true },
  { id: 'downtime', q: 'Is there much downtime in your alley? Does it vary between your duckpin and ten-pin lanes?', long: true },
  { id: 'leagues', q: 'Does your alley host leagues and tournaments? Is it a challenge to fill them?', long: true },
  {
    id: 'third_party',
    q: 'Is your Sherman pinsetter integrated with a third-party entertainment or scoring system?',
    hint: 'If so — how much per month, what comes with it, and can you request changes or upgrades?',
    long: true,
  },
  {
    id: 'maintenance',
    q: 'How do you service your Sherman pinsetters?',
    hint: 'Someone on staff or a contracted engineer? Roughly what do you pay per month? Are lanes ever down waiting on repairs?',
    long: true,
  },
  { id: 'like_dislike', q: 'What do you like about the Sherman pinsetter? What do you not like?', long: true },
  {
    id: 'one_feature',
    q: 'If you could add one feature to your current pinsetter, scoring system and maintenance setup, what would it be?',
    long: true,
  },
  {
    id: 'startup',
    q: 'Would you consider replacing or expanding your duckpin lanes?',
    hint: 'Would you try a product from a startup? What would you need to see to feel comfortable? Would you pilot a brand-new pinsetter if special benefits came with it?',
    long: true,
  },
  { id: 'anything_else', q: 'Anything else we should know, or any feedback for us?', long: true },
];

export default function AlleyForm() {
  const [v, setV] = useState<Values>({ satisfaction: 0, meet: '', show_interest: false });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [done, setDone] = useState(false);

  const set = (k: string, val: string | number | boolean) => setV((p) => ({ ...p, [k]: val }));
  const s = (k: string) => String(v[k] ?? '');

  async function submit() {
    setErr('');
    if (s('contact_name').trim().length < 2) return setErr('Please add your name.');
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s('email'))) return setErr('Please add a valid email so we can reply.');
    if (s('alley_name').trim().length < 2) return setErr('Please add the name of your alley.');
    setBusy(true);
    try {
      const res = await fetch('/api/alley-interest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(v),
      });
      const j = await res.json();
      if (!res.ok || !j.ok) throw new Error(j.error || 'Something went wrong.');
      setDone(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Something went wrong. You can also email andrew@duxbowling.com.');
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="card" style={{ borderColor: '#6b3a1e', textAlign: 'center', padding: '46px 20px' }}>
        <h2 className="stripe sec" style={{ color: 'var(--orange)' }}>Check your email.</h2>
        <p className="lede" style={{ margin: '12px auto 0' }}>
          We sent a copy of everything you just submitted to your inbox, with a button to confirm it is really
          you. One tap and it goes straight to Andrew &mdash; until then nothing is sent on.
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
            <label className="q" htmlFor="contact_name">What is your name?</label>
            <input id="contact_name" className="inp" value={s('contact_name')} onChange={(e) => set('contact_name', e.target.value)} />
          </div>
          <div className="field">
            <label className="q" htmlFor="role">Your role</label>
            <select id="role" className="inp" value={s('role')} onChange={(e) => set('role', e.target.value)}>
              <option value="">Select…</option>
              <option>Owner</option><option>General manager</option>
              <option>Mechanic / head tech</option><option>Other</option>
            </select>
          </div>
        </div>
        <div className="grid g2">
          <div className="field">
            <label className="q" htmlFor="email">Email</label>
            <input id="email" className="inp" type="email" value={s('email')} onChange={(e) => set('email', e.target.value)} />
          </div>
          <div className="field">
            <label className="q" htmlFor="phone">Phone <span className="opt">optional</span></label>
            <input id="phone" className="inp" value={s('phone')} onChange={(e) => set('phone', e.target.value)} />
          </div>
        </div>
        <div className="grid g2">
          <div className="field">
            <label className="q" htmlFor="alley_name">Alley name</label>
            <input id="alley_name" className="inp" value={s('alley_name')} onChange={(e) => set('alley_name', e.target.value)} />
          </div>
          <div className="field">
            <label className="q" htmlFor="location">City / state</label>
            <input id="location" className="inp" value={s('location')} onChange={(e) => set('location', e.target.value)} />
          </div>
        </div>
        <div className="field">
          <label className="q" htmlFor="years">How long have you been the owner or operator?</label>
          <input id="years" className="inp" value={s('years')} onChange={(e) => set('years', e.target.value)} placeholder="e.g. 12 years" />
        </div>
        <div className="grid g2">
          <div className="field">
            <label className="q" htmlFor="duckpin_lanes">How many duckpin lanes?</label>
            <input id="duckpin_lanes" className="inp" type="number" min="0" value={s('duckpin_lanes')} onChange={(e) => set('duckpin_lanes', e.target.value)} />
          </div>
          <div className="field">
            <label className="q" htmlFor="tenpin_lanes">How many ten-pin lanes?</label>
            <input id="tenpin_lanes" className="inp" type="number" min="0" value={s('tenpin_lanes')} onChange={(e) => set('tenpin_lanes', e.target.value)} />
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <p className="eyebrow" style={{ marginBottom: 14 }}>Your Sherman machines</p>
        <div className="field">
          <label className="q">On a scale of 1 to 10, how satisfied are you with your Sherman duckpin pinsetters?</label>
          <div className="scale">
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
              <button key={n} type="button" data-on={v.satisfaction === n ? '1' : '0'} onClick={() => set('satisfaction', n)}>
                {n}
              </button>
            ))}
          </div>
        </div>
        {TEXT_QUESTIONS.slice(3, 7).map((q) => (
          <div className="field" key={q.id}>
            <label className="q" htmlFor={q.id}>
              {q.q}
              {q.hint && <><br /><span className="opt">{q.hint}</span></>}
            </label>
            <textarea id={q.id} className="ta" value={s(q.id)} onChange={(e) => set(q.id, e.target.value)} />
          </div>
        ))}
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <p className="eyebrow" style={{ marginBottom: 14 }}>Running the business</p>
        {TEXT_QUESTIONS.slice(0, 3).map((q) => (
          <div className="field" key={q.id}>
            <label className="q" htmlFor={q.id}>
              {q.q}
              {q.hint && <><br /><span className="opt">{q.hint}</span></>}
            </label>
            <textarea id={q.id} className="ta" value={s(q.id)} onChange={(e) => set(q.id, e.target.value)} />
          </div>
        ))}
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <p className="eyebrow" style={{ marginBottom: 14 }}>Working with a startup</p>
        {TEXT_QUESTIONS.slice(7).map((q) => (
          <div className="field" key={q.id}>
            <label className="q" htmlFor={q.id}>
              {q.q}
              {q.hint && <><br /><span className="opt">{q.hint}</span></>}
            </label>
            <textarea id={q.id} className="ta" value={s(q.id)} onChange={(e) => set(q.id, e.target.value)} />
          </div>
        ))}
        <div className="field">
          <label className="q">
            Could we meet in person to discuss specifics?
            <br />
            <span className="opt">
              Our initial design is finished and a patent filing is close behind, followed by a prototype build to
              validate that pin cycling works as intended. Once that is proven we are looking for alleys to pilot
              the machine in live play.
            </span>
          </label>
          <div className="btnrow">
            {['Yes — get in touch', 'Maybe — send more detail first', 'Not right now'].map((opt) => (
              <button key={opt} type="button" className="btn" style={
                v.meet === opt ? { borderColor: '#6b3a1e', color: 'var(--orange)', background: '#1f1729' } : undefined
              } onClick={() => set('meet', opt)}>
                {opt}
              </button>
            ))}
          </div>
        </div>
      </div>

      {err && <p className="err">{err}</p>}
      <button className="btn primary block" style={{ marginTop: 10 }} onClick={submit} disabled={busy}>
        {busy ? 'Sending…' : 'Send it down the lane'}
      </button>
      <p style={{ color: 'var(--ghost)', fontSize: 11.5, textAlign: 'center', marginTop: 12 }}>
        Goes straight to andrew@duxbowling.com. We never share your answers with anyone.
      </p>
    </div>
  );
}
