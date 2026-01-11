export const metadata = {
  title: "Terms of Service | Dux Bowling",
  description: "Terms of Service for Dux Bowling LLC",
};

export default function TermsPage() {
  return (
    <main className="page-container legal">
      <section className="page-card">
        <h1>Terms of Service</h1>
        <p className="updated">
          <em>Last updated: January 2026</em>
        </p>

        <p>By accessing or using the Dux Bowling website or services, you agree to these Terms of Service.</p>

        <h2>1. Use of the Service</h2>
        <p>
          Dux Bowling provides digital bowling-related services, including scoring tools, account-based
          features, and future integrations with bowling lane and pinsetting systems. You agree to use
          the service only for lawful purposes.
        </p>

        <h2>2. Accounts</h2>
        <ul>
          <li>You are responsible for maintaining your account credentials</li>
          <li>You are responsible for all activity under your account</li>
          <li>We may suspend or terminate accounts for misuse or violations of these terms</li>
        </ul>

        <h2>3. Bowling &amp; Scoring Data</h2>
        <p>
          Scoring data, pin states, lane identifiers, and gameplay records are provided for informational
          and entertainment purposes. While we strive for accuracy, Dux Bowling does not guarantee error-free
          scoring or system availability.
        </p>

        <h2>4. Future Hardware Integration</h2>
        <p>
          Some features may interact with bowling lane hardware or pinsetting equipment. Dux Bowling is not
          responsible for physical equipment malfunctions, installation issues, or third-party hardware failures.
        </p>

        <h2>5. Intellectual Property</h2>
        <p>
          All software, content, designs, and branding are the property of Dux Bowling LLC. You may not copy,
          modify, or distribute our materials without written permission.
        </p>

        <h2>6. Service Availability</h2>
        <p>
          The service is provided “as is” and “as available.” We may modify, suspend, or discontinue features at
          any time without notice.
        </p>

        <h2>7. Limitation of Liability</h2>
        <p>
          To the maximum extent permitted by law, Dux Bowling LLC shall not be liable for indirect, incidental, or
          consequential damages arising from your use of the service.
        </p>

        <h2>8. Termination</h2>
        <p>
          You may stop using the service at any time. We may terminate or suspend access if you violate these terms.
        </p>

        <h2>9. Governing Law</h2>
        <p>
          These Terms are governed by the laws of the State of Maryland, without regard to conflict of law principles.
        </p>

        <h2>10. Contact</h2>
        <p>
          Dux Bowling LLC<br />
          <a href="mailto:legal@duxbowling.com">legal@duxbowling.com</a>
        </p>
      </section>
    </main>
  );
}