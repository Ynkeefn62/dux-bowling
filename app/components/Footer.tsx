import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="site">
      <div className="wrap in">
        <span>Dux Bowling LLC &middot; Middletown, Maryland</span>
        <a href="mailto:andrew@duxbowling.com">andrew@duxbowling.com</a>
        <Link href="/privacy">Privacy</Link>
        <Link href="/terms">Terms</Link>
        <span style={{ marginLeft: 'auto' }}>Built for duckpin</span>
      </div>
    </footer>
  );
}
