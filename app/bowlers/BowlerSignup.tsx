'use client';
import { useCallback, useEffect, useState } from 'react';

type BoardRow = { display_name: string; home_alley: string | null; created_at: string };

export default function BowlerSignup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [alley, setAlley] = useState('');
  const [ideas, setIdeas] = useState('');
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
    if (name.trim().length < 2) return setErr('Please add your name.');
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return setErr('Please add a valid email.');
    setBusy(true);
    try {
      const res = await fetch('/api/bowler-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, home_alley: alley, ideas, show_on_board: show }),
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
      <div className="card" style={{ borderColor: '#6b3a1e' }}>
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
                <label className="q" htmlFor="b_name">Your name</label>
                <input id="b_name" className="inp" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="field">
                <label className="q" htmlFor="b_email">Email</label>
                <input id="b_email" className="inp" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            </div>
            <div className="field">
              <label className="q" htmlFor="b_alley">
                Where do you bowl? <span className="opt">optional</span>
              </label>
              <input id="b_alley" className="inp" value={alley} onChange={(e) => setAlley(e.target.value)} placeholder="Your home alley" />
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
