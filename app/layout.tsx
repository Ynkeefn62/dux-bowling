import type { Metadata } from 'next';
import './globals.css';
import Nav from './components/Nav';
import Footer from './components/Footer';

export const metadata: Metadata = {
  title: 'Dux Bowling — The Duckpin Pinsetter, Reinvented',
  description:
    'A modern freestanding duckpin pinsetter that sets any pin configuration on command, and turns every lane into a connected game platform.',
  icons: { icon: '/icon.svg' },
  openGraph: {
    title: 'Dux Bowling — The Duckpin Pinsetter, Reinvented',
    description: 'The first new freestanding duckpin pinsetter since 1973.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Nav />
        {children}
        <Footer />
      </body>
    </html>
  );
}
