// Dux duckpin scoring engine - shared by lane display + live demo
// Frame: up to 3 balls. Strike = 10 on ball 1 (bonus: next 2 balls).
// Spare = 10 in 2 balls (bonus: next 1 ball). Ten in 3 balls scores flat.
(function (root) {
  function frames(rolls) {
    const out = []; let i = 0;
    while (i < rolls.length && out.length < 10) {
      const f = { balls: [], i };
      const tenth = out.length === 9;
      while (i < rolls.length && f.balls.length < 3) {
        f.balls.push(rolls[i]); i++;
        if (!tenth && f.balls.reduce((a, b) => a + b, 0) === 10) break;
      }
      out.push(f);
    }
    return out;
  }
  function scoreFrames(rolls) {
    const fs = frames(rolls);
    let total = 0;
    const rows = fs.map((f, fi) => {
      const b = f.balls, sum = b.reduce((a, x) => a + x, 0);
      let val = sum, mark = '';
      const after = rolls.slice(f.i + b.length);
      if (fi < 9) {
        if (b[0] === 10) { mark = 'X'; val = 10 + (after[0] || 0) + (after[1] || 0); }
        else if (b.length >= 2 && b[0] + b[1] === 10) { mark = '/'; val = 10 + (after[0] || 0); }
        else if (sum === 10) { mark = '10'; val = 10; }
      } else {
        if (b[0] === 10) mark = 'X';
        else if (b.length >= 2 && b[0] + b[1] === 10) mark = '/';
      }
      total += val;
      return { balls: b, mark, val, cum: total };
    });
    return { frames: rows, total };
  }
  function frameDone(balls, isTenth) {
    if (!isTenth) return balls.length === 3 || balls.reduce((a, b) => a + b, 0) === 10;
    return balls.length === 3;
  }
  function complete(rolls) {
    const fs = frames(rolls);
    return fs.length === 10 && frameDone(fs[9].balls, true);
  }
  const api = { frames, scoreFrames, frameDone, complete };
  if (typeof module !== 'undefined') module.exports = api;
  root.DuxEngine = api;
})(typeof self !== 'undefined' ? self : globalThis);
