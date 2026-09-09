export default function About() {
  return (
    <section className="tight">
      <div className="wrap">
        <p className="eyebrow">About us</p>
        <h2 className="stripe sec">Why we are building this</h2>
        <hr className="rule" />
        <div className="about">
          <div className="portrait">
            {/* Swap this block for <img src="/andrew.jpg" alt="Andrew Boller" /> once the photo is added. */}
            Photo coming soon
          </div>
          <div>
            <p className="lede" style={{ maxWidth: 'none' }}>
              I joined my first duckpin bowling league in the Summer of 2023 at the Walkersville Bowling Center, on
              a Wednesday night league with my dad, brother, cousins, and father-in-law. I then signed up for a
              Fall League at Mt. Airy Lanes that Fall and have not stopped since. My average sits at 117 and I am
              chasing the 120s.
            </p>
            <p className="lede" style={{ maxWidth: 'none' }}>
              What keeps me coming back is the challenge. Nobody has ever bowled a 300, but I would like to see
              someone accomplish that one day. My personal best is a 181, which I then followed it up with an 88.
              The game teaches patience and perseverance, two traits that are not necessarily promoted in most
              recreational activities today.
            </p>
            <p className="lede" style={{ maxWidth: 'none' }}>
              Our leagues have bowlers ranging in ages from the teens to the nineties, men and women, from every
              kind of background, all playing the same game on the same lanes. It is indoors and year-round, costs
              roughly the price of a single meal at any fast casual restaurant, and is an opportunity to see
              friends and family every week. No other sport can compare to the reach duckpin bowling has to offer.
            </p>
            <p className="lede" style={{ maxWidth: 'none' }}>
              Duckpin bowling sits at a crossroads today. The Sherman pinsetters that every duckpin house depends
              on are more than fifty years old, nobody has built a new one since 1973, and the alleys that are left
              keep them running on parts scavenged from houses that have already closed. String machines exist, but
              any serious duckpin bowler will tell you the pin action is a different game. If nobody builds a new
              pinsetter, the sport runs out of machines &mdash; and then it runs out of alleys.
            </p>
            <p className="lede" style={{ maxWidth: 'none' }}>
              So we are building one. The goal is simple and personal: keep the game alive, and give it room to
              grow into places that have never had it. One day I want to bowl with my son the way I get to bowl
              with my dad today, and I would like there to be a lane for us when that day comes.
            </p>
            <p className="lede" style={{ maxWidth: 'none', color: 'var(--ink)' }}>
              &mdash; Andrew Boller, founder
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
