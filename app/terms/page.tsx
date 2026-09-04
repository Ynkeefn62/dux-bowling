import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms and conditions',
  description: 'The terms for using the Dux Bowling website.',
};

const UPDATED = 'September 3, 2026';

export default function TermsPage() {
  return (
    <main>
      <section>
        <div className="wrap legal" style={{ maxWidth: 780 }}>
          <p className="eyebrow">Legal</p>
          <h1 className="stripe sec">Terms and conditions</h1>
          <hr className="rule" />
          <p className="lede">Last updated {UPDATED}. These cover this website. They are not a purchase agreement.</p>

          <h2 className="stripe">Who these are with</h2>
          <p>
            This site is operated by Dux Bowling LLC, 7113 Feldspar Ct, Middletown, MD 21769. By using it you
            agree to what follows. If you do not agree, please do not use the site.
          </p>

          <h2 className="stripe">What this site is</h2>
          <p>
            An informational website about a duckpin pinsetter and software platform that are still in
            development. Nothing here is an offer to sell, a price quote, a delivery commitment, or a guarantee
            that any described feature will ship as shown. Timelines are our current expectations and will move.
          </p>

          <h2 className="stripe">Not an investment offer</h2>
          <p>
            The investor section exists to share market context and let you start a conversation. It is not an
            offer to sell or a solicitation to buy any security, and the figures shown are drawn from public
            industry sources for context only. They are not projections or forecasts of our results. Any actual
            investment would happen through separate documents, with its own disclosures.
          </p>

          <h2 className="stripe">Submitting information</h2>
          <p>
            When you fill in a form, please give accurate information and only submit your own details or your
            organization&apos;s. Do not submit anything confidential that you are not free to share. By sending
            us ideas or feedback, you allow us to use them to improve the product without any obligation to you —
            we say that plainly rather than burying it, because several of our best ideas have come from bowlers
            and operators, and we would rather be honest about how we treat them.
          </p>

          <h2 className="stripe">The public board</h2>
          <p>
            If you opt in to the bowler board, you agree that your first name, last initial and home alley may be
            displayed publicly. We may remove any entry at our discretion, including anything impersonating
            someone else.
          </p>

          <h2 className="stripe">Our content</h2>
          <p>
            The Dux Bowling name, the duck, the machine designs, drawings, animations and the contents of this
            site belong to Dux Bowling LLC. Patent applications covering the machine are pending. You may view
            and share the site, but not reproduce its content commercially or use our branding without written
            permission. Other company and product names shown for comparison belong to their owners; those
            references are for identification and do not imply endorsement or any affiliation.
          </p>

          <h2 className="stripe">Links out</h2>
          <p>
            We link to third-party sites, including competitors, for reference. We do not control them and are
            not responsible for their content or their privacy practices.
          </p>

          <h2 className="stripe">The site as it is</h2>
          <p>
            We provide this site as it is, without warranties of any kind. We do not promise it will always be
            available or error-free. To the extent the law allows, Dux Bowling LLC is not liable for indirect or
            consequential losses arising from your use of the site.
          </p>

          <h2 className="stripe">Governing law</h2>
          <p>These terms are governed by the laws of the State of Maryland.</p>

          <h2 className="stripe">Contact</h2>
          <p>
            Anything at all: <a href="mailto:andrew@duxbowling.com">andrew@duxbowling.com</a>.
          </p>
        </div>
      </section>
    </main>
  );
}
