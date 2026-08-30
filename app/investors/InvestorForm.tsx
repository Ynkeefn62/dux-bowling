'use client';
import { useState } from 'react';

const TYPES = ['Angel', 'Venture fund', 'Strategic / industry', 'Economic development', 'Other'];
const MEET = ['Yes — let\u2019s set up a call', 'Send materials first', 'Just following along'];

export default function InvestorForm() {
  const [v, setV] = useState({ name: '', email: '', organization: '', investor_type: '', meet: '', ideas: '' });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [done, setDone] = useState(false);
  const set = (k: keyof typeof v, val: string) => setV((p) => ({ ...p, [k]: val }));

  async function submit() {
    setErr('');
    if (v.name.trim().length < 2) return setErr('Please add your name.');
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v.email)) return setErr('Please add a valid email.');
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
      <div className="card" style={{ borderColor: '#6b3a1e', textAlign: 'center', padding: '40px 20px' }}>
        <h3 className="stripe sub">Thank you.</h3>
        <p className="lede" style={{ margin: '10px auto 0' }}>
          Andrew will follow up personally. If you asked for a call, expect to hear from him this week.
        </p>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="grid g2">
        <div className="field">
          <label className="q" htmlFor="i_name">Your name</label>
          <input id="i_name" className="inp" value={v.name} onChange={(e) => set('name', e.target.value)} />
        </div>
        <div className="field">
          <label className="q" htmlFor="i_email">Email</label>
          <input id="i_email" className="inp" type="email" value={v.email} onChange={(e) => set('email', e.target.value)} />
        </div>
      </div>
      <div className="grid g2">
        <div className="field">
          <label className="q" htmlFor="i_org">Firm or organization <span className="opt">optional</span></label>
          <input id="i_org" className="inp" value={v.organization} onChange={(e) => set('organization', e.target.value)} />
        </div>
        <div className="field">
          <label className="q" htmlFor="i_type">What kind of investor are you?</label>
          <select id="i_type" className="inp" value={v.investor_type} onChange={(e) => set('investor_type', e.target.value)}>
            <option value="">Select…</option>
            {TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
      </div>
      <div className="field">
        <label className="q">Would you like to meet to discuss investment options?</label>
        <div className="btnrow">
          {MEET.map((m) => (
            <button key={m} type="button" className="btn"
              style={v.meet === m ? { borderColor: '#6b3a1e', color: 'var(--orange)', background: '#1f1729' } : undefined}
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
