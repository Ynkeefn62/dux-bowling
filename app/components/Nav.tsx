'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import DuxMark from './DuxMark';

const LINKS = [
  { href: '/learn', label: 'Learn more' },
  { href: '/alleys', label: 'For alleys' },
  { href: '/bowlers', label: 'For bowlers' },
];

export default function Nav() {
  const path = usePathname();
  return (
    <nav className="nav">
      <div className="wrap nav-in">
        <Link href="/" aria-label="Dux Bowling home"><DuxMark /></Link>
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
