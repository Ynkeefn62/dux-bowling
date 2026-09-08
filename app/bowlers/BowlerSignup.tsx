'use client';
import { useCallback, useEffect, useState } from 'react';

type BoardRow = { display_name: string; home_alley: string | null; created_at: string };

export default function BowlerSignup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [alley, setAlley] = useState('');
  const [ideas, setIdeas] = useState('');
  const [frequency, setFrequency] = useState('');
  const [leagues, setLeagues] = useState('');
  const [tournaments, setTournaments] = useState('');
  const [bad, setBad] = useState<Record<string, boolean>>({});
  const [show, setShow] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [done, setDone] = useState(false);
  const [board, setBoard] = useState<BoardRow[]>([]);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/bowler-board', { cache: 'no-store' });
      const j = await res.json();
      setBoard(Array.isArray(j.board) ? j.board : []);
    } catch {
      setBoard([]);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function submit() {
    setErr('');
    const nextBad: Record<string, boolean> = {};
    const missing: string[] = [];
    if (name.trim().length < 2) { nextBad.b_name = true; missing.push('your name'); }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { nextBad.b_email = true; missing.push('a valid email'); }
    if (!frequency) { nextBad.b_freq = true; missing.push('how often you bowl'); }
    if (!leagues) { nextBad.b_leagues = true; missing.push('whether you bowl in leagues'); }
    if (!tournaments) { nextBad.b_tourn = true; missing.push('whether you bowl in tournaments'); }
    setBad(nextBad);
    if (missing.length) {
      document.getElementById(Object.keys(nextBad)[0])?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return setErr(`Please add ${missing.slice(0, 3).join(', ')}${missing.length > 3 ? ' and more' : ''}.`);
    }
    setBusy(true);
    try {
      const res = await fetch('/api/bowler-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name, email, home_alley: alley, ideas, frequency, leagues, tournaments, show_on_board: show,
        }),
      });
      const j = await res.json();
      if (!res.ok || !j.ok) throw new Error(j.error || 'Something went wrong.');
      setDone(true);
      load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="card" style={{ borderColor: 'var(--accent-line)' }}>
        {done ? (
          <div style={{ textAlign: 'center', padding: '18px 0' }}>
            <h3 className="stripe sub">Check your email.</h3>
            <p className="lede" style={{ margin: '8px auto 0' }}>
              We sent you a confirmation link. Tap it and your name goes on the board &mdash; we will let you know
              the moment there is a Dux lane you can bowl on.
            </p>
          </div>
        ) : (
          <>
            <p className="eyebrow" style={{ marginBottom: 14 }}>Add your name</p>
            <div className="grid g2">
              <div className="field">
                <label className="q" htmlFor="b_name">Your name<span className="req">*</span></label>
                <input id="b_name" className="inp" data-bad={bad.b_name ? '1' : '0'} value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="field">
                <label className="q" htmlFor="b_email">Email<span className="req">*</span></label>
                <input id="b_email" className="inp" data-bad={bad.b_email ? '1' : '0'} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            </div>
            <div className="field">
              <label className="q" htmlFor="b_alley">
                Where do you bowl? <span className="opt">optional</span>
              </label>
              <input id="b_alley" className="inp" value={alley} onChange={(e) => setAlley(e.target.value)} placeholder="Your home alley" />
            </div>
            <div className="grid g3">
              <div className="field">
                <label className="q" htmlFor="b_freq">How often do you bowl?<span className="req">*</span></label>
                <select id="b_freq" className="inp" data-bad={bad.b_freq ? '1' : '0'} value={frequency}
                  onChange={(e) => { setFrequency(e.target.value); setBad((b) => ({ ...b, b_freq: false })); }}>
                  <option value="">Select…</option>
                  <option>Weekly or more</option>
                  <option>A few times a month</option>
                  <option>A few times a year</option>
                  <option>I have never bowled duckpin</option>
                </select>
              </div>
              <div className="field">
                <label className="q" htmlFor="b_leagues">Do you bowl in leagues?<span className="req">*</span></label>
                <select id="b_leagues" className="inp" data-bad={bad.b_leagues ? '1' : '0'} value={leagues}
                  onChange={(e) => { setLeagues(e.target.value); setBad((b) => ({ ...b, b_leagues: false })); }}>
                  <option value="">Select…</option>
                  <option>Yes, currently</option>
                  <option>I used to</option>
                  <option>No, but I would like to</option>
                  <option>No</option>
                </select>
              </div>
              <div className="field">
                <label className="q" htmlFor="b_tourn">Do you bowl in tournaments?<span className="req">*</span></label>
                <select id="b_tourn" className="inp" data-bad={bad.b_tourn ? '1' : '0'} value={tournaments}
                  onChange={(e) => { setTournaments(e.target.value); setBad((b) => ({ ...b, b_tourn: false })); }}>
                  <option value="">Select…</option>
                  <option>Yes, regularly</option>
                  <option>Occasionally</option>
                  <option>No, but I would like to</option>
                  <option>No</option>
                </select>
              </div>
            </div>
            <div className="field">
              <label className="q" htmlFor="b_ideas">
                What would you want on a Dux lane? <span className="opt">optional</span>
                <br />
                <span className="opt">
                  Any idea at all &mdash; a game you would play, a stat you wish you had, something your house
                  has never been able to do.
                </span>
              </label>
              <textarea id="b_ideas" className="ta" value={ideas} onChange={(e) => setIdeas(e.target.value)} />
            </div>
            <label className="checkline">
              <input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} />
              <span>
                Show me on the board below. Only your first name and last initial appear publicly — never your
                email.
              </span>
            </label>
            {err && <p className="err">{err}</p>}
            <button className="btn primary block" style={{ marginTop: 16 }} onClick={submit} disabled={busy}>
              {busy ? 'Adding…' : 'Count me in'}
            </button>
          </>
        )}
      </div>

      <div style={{ marginTop: 34 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
          <h2 className="stripe sec" style={{ fontSize: 'clamp(22px,4vw,30px)' }}>Bowlers waiting</h2>
          {loaded && <span className="chip on">{board.length} signed up</span>}
        </div>
        <hr className="rule" />
        {!loaded && <p className="lede">Loading the board…</p>}
        {loaded && board.length === 0 && (
          <p className="lede">
            Nobody on the board yet — be the first name on it.
          </p>
        )}
        {board.length > 0 && (
          <div className="board">
            {board.map((b, i) => (
              <div className="who" key={`${b.display_name}-${i}`}>
                <b>{b.display_name}</b>
                <span>{b.home_alley || 'Duckpin bowler'}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
