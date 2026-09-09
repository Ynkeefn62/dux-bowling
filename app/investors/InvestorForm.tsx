'use client';
import { useState } from 'react';

const TYPES = ['Angel', 'Venture fund', 'Strategic / industry', 'Economic development', 'Other'];
const MEET = ['Yes — let\u2019s set up a call', 'Send materials first', 'Just following along'];

export default function InvestorForm() {
  const [v, setV] = useState({ name: '', email: '', organization: '', investor_type: '', meet: '', ideas: '' });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [done, setDone] = useState(false);
  const [bad, setBad] = useState<Record<string, boolean>>({});
  const set = (k: keyof typeof v, val: string) => {
    setV((p) => ({ ...p, [k]: val }));
    setBad((b) => ({ ...b, [`i_${k === 'investor_type' ? 'type' : k}`]: false }));
  };

  async function submit() {
    setErr('');
    const nextBad: Record<string, boolean> = {};
    const missing: string[] = [];
    if (v.name.trim().length < 2) { nextBad.i_name = true; missing.push('your name'); }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v.email)) { nextBad.i_email = true; missing.push('a valid email'); }
    if (!v.investor_type) { nextBad.i_type = true; missing.push('what kind of investor you are'); }
    if (!v.meet) { nextBad.i_meet = true; missing.push('whether you would like to meet'); }
    setBad(nextBad);
    if (missing.length) {
      document.getElementById(Object.keys(nextBad)[0])?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return setErr(`Please add ${missing.join(', ')}.`);
    }
    setBusy(true);
    try {
      const res = await fetch('/api/investor-interest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(v),
      });
      const j = await res.json();
      if (!res.ok || !j.ok) throw new Error(j.error || 'Something went wrong.');
      setDone(true);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="card" style={{ borderColor: 'var(--accent-line)', textAlign: 'center', padding: '40px 20px' }}>
        <h3 className="stripe sub">Check your email.</h3>
        <p className="lede" style={{ margin: '10px auto 0' }}>
          We sent a copy of your message with a link to confirm it is really you. Once you tap it, Andrew gets
          it and will follow up personally.
        </p>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="grid g2">
        <div className="field">
          <label className="q" htmlFor="i_name">Your name<span className="req">*</span></label>
          <input id="i_name" className="inp" data-bad={bad.i_name ? '1' : '0'} value={v.name} onChange={(e) => set('name', e.target.value)} />
        </div>
        <div className="field">
          <label className="q" htmlFor="i_email">Email<span className="req">*</span></label>
          <input id="i_email" className="inp" data-bad={bad.i_email ? '1' : '0'} type="email" value={v.email} onChange={(e) => set('email', e.target.value)} />
        </div>
      </div>
      <div className="grid g2">
        <div className="field">
          <label className="q" htmlFor="i_org">Firm or organization <span className="opt">optional</span></label>
          <input id="i_org" className="inp" value={v.organization} onChange={(e) => set('organization', e.target.value)} />
        </div>
        <div className="field">
          <label className="q" htmlFor="i_type">What kind of investor are you?<span className="req">*</span></label>
          <select id="i_type" className="inp" data-bad={bad.i_type ? '1' : '0'} value={v.investor_type} onChange={(e) => set('investor_type', e.target.value)}>
            <option value="">Select…</option>
            {TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
      </div>
      <div className="field">
        <label className="q" id="i_meet">Would you like to meet to discuss investment options?<span className="req">*</span></label>
        <div className="btnrow">
          {MEET.map((m) => (
            <button key={m} type="button" className="btn"
              style={v.meet === m ? { borderColor: 'var(--accent-line)', color: 'var(--orange)', background: 'var(--accent-soft)' } : undefined}
              onClick={() => set('meet', m)}>
              {m}
            </button>
          ))}
        </div>
      </div>
      <div className="field">
        <label className="q" htmlFor="i_ideas">
          Questions, ideas or things you would want to see
          <br />
          <span className="opt">Anything at all — diligence questions, market thoughts, introductions</span>
        </label>
        <textarea id="i_ideas" className="ta" value={v.ideas} onChange={(e) => set('ideas', e.target.value)} />
      </div>
      {err && <p className="err">{err}</p>}
      <button className="btn primary block" style={{ marginTop: 8 }} onClick={submit} disabled={busy}>
        {busy ? 'Sending…' : 'Send to Andrew'}
      </button>
    </div>
  );
}
