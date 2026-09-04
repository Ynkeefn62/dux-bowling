'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
  { href: '/learn', label: 'Learn more' },
  { href: '/alleys', label: 'For alleys' },
  { href: '/bowlers', label: 'For bowlers' },
  { href: '/investors', label: 'For investors' },
];

export default function Nav() {
  const path = usePathname();
  return (
    <nav className="nav">
      <div className="wrap nav-in">
        <Link href="/" className="brand" aria-label="Dux Bowling home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/duck.png" alt="Dux Bowling" />
          <span>DUX BOWLING</span>
        </Link>
        <span className="spacer" />
        {LINKS.map((l) => (
          <Link key={l.href} href={l.href} className="link" data-on={path === l.href ? '1' : '0'}>
            {l.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
