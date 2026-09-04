import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy policy',
  description: 'What Dux Bowling collects, why, and how to have it removed.',
};

const UPDATED = 'September 3, 2026';

export default function PrivacyPage() {
  return (
    <main>
      <section>
        <div className="wrap legal" style={{ maxWidth: 780 }}>
          <p className="eyebrow">Legal</p>
          <h1 className="stripe sec">Privacy policy</h1>
          <hr className="rule" />
          <p className="lede">Last updated {UPDATED}. This is the whole of it — we have tried to keep it in plain English.</p>

          <h2 className="stripe">Who we are</h2>
          <p>
            Dux Bowling LLC, 7113 Feldspar Ct, Middletown, MD 21769. Questions about anything below go to{' '}
            <a href="mailto:andrew@duxbowling.com">andrew@duxbowling.com</a>.
          </p>

          <h2 className="stripe">What we collect</h2>
          <p>Only what you type into one of our forms. We do not collect anything else.</p>
          <ul>
            <li><b>Bowling alley questionnaire:</b> your name, role, email, optional phone, your alley&apos;s name and location, and your answers about your machines and your business.</li>
            <li><b>Bowler signup:</b> your name, email, optionally your home alley, how often you bowl, whether you bowl in leagues or tournaments, and any ideas you share.</li>
            <li><b>Investor enquiry:</b> your name, email, optional organization, investor type, whether you want to meet, and your questions.</li>
          </ul>
          <p>
            We do not use web analytics, advertising tools, tracking pixels or third-party cookies. We do not
            build profiles on visitors, and we do not track you across other websites.
          </p>

          <h2 className="stripe">Why we collect it</h2>
          <p>
            To understand what bowling alleys and bowlers actually need so we can build the right machine and
            software, and to reply to you. That is the entire purpose. We will never sell your information or
            share it for anyone else&apos;s marketing.
          </p>

          <h2 className="stripe">Confirming your email</h2>
          <p>
            When you submit a form, we email you a copy of your answers with a confirmation link. Nothing is
            passed on to us for review until you click that link. This exists so that nobody can submit a form in
            your name. If you never click it, your entry stays unconfirmed and is not acted upon.
          </p>

          <h2 className="stripe">The public bowler board</h2>
          <p>
            If you sign up as a bowler and tick the box to appear on the board, we display your first name, last
            initial and, if you gave one, your home alley. Nothing else — never your email. Leave the box
            unticked and you will not appear at all. You can ask us to remove you at any time.
          </p>

          <h2 className="stripe">Who else touches your data</h2>
          <ul>
            <li><b>Supabase</b> hosts our database (United States region). Your submission is stored there.</li>
            <li><b>Resend</b> sends our email, so it processes your address and the contents of those messages.</li>
            <li><b>Vercel</b> hosts this website and keeps standard server logs, including IP addresses, for security and operations.</li>
          </ul>
          <p>Each is a service provider acting on our instructions. No one else receives your information.</p>

          <h2 className="stripe">How long we keep it</h2>
          <p>
            For as long as we are actively building this, since early responses stay useful as the design
            evolves. Unconfirmed submissions are removed periodically. Ask us to delete yours and we will do it.
          </p>

          <h2 className="stripe">Your choices</h2>
          <p>
            Email <a href="mailto:andrew@duxbowling.com">andrew@duxbowling.com</a> and we will send you a copy of
            what we hold, correct it, or delete it. No forms, no process — a person will read it and act on it.
            If you are in a place with specific data rights, such as the EU or UK or a US state privacy law, we
            will honour those requests regardless of where you live.
          </p>

          <h2 className="stripe">Children</h2>
          <p>
            This site is aimed at bowling alley operators, adult bowlers and investors. We do not knowingly
            collect information from anyone under 13. If a child has submitted something, write to us and we will
            remove it.
          </p>

          <h2 className="stripe">Changes</h2>
          <p>
            If this policy changes we will update the date at the top. Material changes affecting information you
            have already given us will be emailed to you directly.
          </p>
        </div>
      </section>
    </main>
  );
}
