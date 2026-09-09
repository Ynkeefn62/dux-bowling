const PEAK = [
  { num: '~450', lab: 'duckpin centers along the East Coast at the sport\u2019s peak in the early 1960s', src: 'Duckpin bowling, historical record' },
  { num: '300,000', lab: 'sanctioned duckpin participants in 1967, the high-water mark', src: 'National Duckpin Bowling Congress history' },
  { num: '100', lab: 'sanctioned duckpin alleys in Maryland alone in the mid-1960s', src: 'Maryland duckpin history' },
  { num: '40,000', lab: 'sanctioned duckpin bowlers in 1973, against roughly 9,000 in recent counts', src: 'Inside NoVA' },
];

const TODAY = [
  { num: '67M', lab: 'Americans bowl at least once a year \u2014 the country\u2019s number one participation sport', src: 'Bowling Proprietors\u2019 Association of America / USBC' },
  { num: '~3,400', lab: 'USBC-certified bowling centers operating in the United States today', src: 'United States Bowling Congress' },
  { num: '77,245', lab: 'certified lanes across those houses, every one of them a candidate for conversion', src: 'BowlersMart Lane Finder, 2026' },
  { num: '1.07M', lab: 'Americans still bowl in sanctioned leagues across 29,000+ certified leagues', src: 'USBC, 2024-25 season' },
];

export default function MarketStats() {
  return (
    <section className="tight">
      <div className="wrap">
        <p className="eyebrow">Market context</p>
        <h2 className="stripe sec">How big this could be</h2>
        <hr className="rule" />
        <p className="lede">
          Duckpin is not a small sport by nature. It is a big sport that lost its machine. These are the numbers
          that frame the opportunity — where duckpin stood when it had working equipment, and how large the
          bowling market it sits inside remains today.
        </p>

        <h3 className="stripe sub" style={{ marginTop: 30 }}>What duckpin was, with working machines</h3>
        <div className="stats" style={{ marginTop: 14 }}>
          {PEAK.map((s) => (
            <div className="stat" key={s.num + s.lab}>
              <div className="num">{s.num}</div>
              <span className="lab">{s.lab}</span>
              <span className="src">{s.src}</span>
            </div>
          ))}
        </div>

        <h3 className="stripe sub" style={{ marginTop: 34 }}>The market it sits inside today</h3>
        <div className="stats" style={{ marginTop: 14 }}>
          {TODAY.map((s) => (
            <div className="stat" key={s.num + s.lab}>
              <div className="num">{s.num}</div>
              <span className="lab">{s.lab}</span>
              <span className="src">{s.src}</span>
            </div>
          ))}
        </div>

        <div className="card" style={{ marginTop: 24, borderColor: 'var(--accent-line)' }}>
          <h3 className="stripe sub">Reading these together</h3>
          <p className="lede" style={{ maxWidth: 'none' }}>
            Duckpin declined for a mechanical reason, not a demand reason. Ten-pin got the automatic pinsetter in
            the 1950s and roughly doubled its centers in under a decade; duckpin got one machine, from one
            company, that stopped being built in 1973. The roughly 35 duckpin houses left are the beachhead — the
            customers who need a machine today and have nowhere else to buy one.
          </p>
          <p className="lede" style={{ maxWidth: 'none', marginTop: 12 }}>
            The larger opportunity is the ~3,400 certified centers and 77,000+ lanes already operating in the
            United States. Duckpin runs on identical lane dimensions to ten-pin, so a house can convert lanes
            without construction, and 67 million Americans already bowl at least once a year. We are not trying
            to create demand for bowling. We are trying to give existing houses a second product to sell on the
            floor space they already have.
          </p>
          <p style={{ color: 'var(--ghost)', fontSize: 11.5, lineHeight: 1.7, marginTop: 14 }}>
            Figures above are drawn from public industry sources and are provided for market context only. They
            are not projections, forecasts, or any representation of Dux Bowling&apos;s expected revenue.
          </p>
        </div>
      </div>
    </section>
  );
}
