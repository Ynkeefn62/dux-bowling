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
              I started duckpin bowling in the summer of 2023 at the Walkersville bowling center, on a Wednesday
              night league with my dad, my brother and my cousins. I have not stopped since — Mt. Airy through
              the fall, winter and spring, back to Walkersville for the summer league every year. My average sits
              at 117 and I am chasing the 120s.
            </p>
            <p className="lede" style={{ maxWidth: 'none' }}>
              What keeps me coming back is who else is there. Our leagues have bowlers from 18 to 93, men and
              women, from every kind of background, all playing the same game on the same lanes. It is indoors
              and year-round, it costs about twenty dollars a week, and it is a standing excuse to see my family
              every week. Not many things do all of that at once.
            </p>
            <p className="lede" style={{ maxWidth: 'none' }}>
              Bowling runs deeper in my family than my own league card. My grandfather (Pappy) worked on duckpin
              pinsetters and took real pride in keeping them running so bowlers could enjoy the game. My parents
              went on their first date at a bowling alley. I am, in a fairly literal sense, here because of
              duckpin.
            </p>
            <p className="lede" style={{ maxWidth: 'none' }}>
              And that is the problem. The Sherman pinsetters that every duckpin house depends on are more than
              fifty years old, nobody has built a new one since 1973, and the alleys that are left keep them
              running on parts scavenged from houses that have already closed. String machines exist, but any
              serious duckpin bowler will tell you the pin action is a different game. If nobody builds a new
              pinsetter, the sport runs out of machines — and then it runs out of alleys.
            </p>
            <p className="lede" style={{ maxWidth: 'none' }}>
              So we are building one. The goal is simple and personal: keep the game alive, and give it room to
              grow into places that have never had it. One day I want to bowl with my son the way I get to bowl
              with my dad today, and I would like there to be a lane for us when that day comes.
            </p>
            <p className="lede" style={{ maxWidth: 'none', color: 'var(--ink)' }}>
              — Andrew Boller, founder
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
