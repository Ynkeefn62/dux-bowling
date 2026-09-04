import type { Metadata, Viewport } from 'next';
import './globals.css';
import Nav from './components/Nav';
import Footer from './components/Footer';

const SITE = process.env.SITE_URL || 'https://duxbowling.com';

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: {
    default: 'Dux Bowling — The Duckpin Pinsetter, Reinvented',
    template: '%s — Dux Bowling',
  },
  description:
    'A modern freestanding duckpin pinsetter that sets any pin configuration on command, and turns every lane into a connected game platform.',
  applicationName: 'Dux Bowling',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '16x16 32x32 48x48' },
      { url: '/icon-192.png', type: 'image/png', sizes: '192x192' },
      { url: '/icon-512.png', type: 'image/png', sizes: '512x512' },
    ],
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    type: 'website',
    siteName: 'Dux Bowling',
    title: 'Dux Bowling — The Duckpin Pinsetter, Reinvented',
    description: 'The first new freestanding duckpin pinsetter since 1973.',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Dux Bowling' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Dux Bowling — The Duckpin Pinsetter, Reinvented',
    description: 'The first new freestanding duckpin pinsetter since 1973.',
    images: ['/og-image.png'],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f7f6f2' },
    { media: '(prefers-color-scheme: dark)', color: '#141a30' },
  ],
};

const ORG_JSONLD = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Dux Bowling LLC',
  url: SITE,
  logo: `${SITE}/icon-512.png`,
  image: `${SITE}/og-image.png`,
  email: 'andrew@duxbowling.com',
  address: { '@type': 'PostalAddress', addressLocality: 'Middletown', addressRegion: 'MD', addressCountry: 'US' },
  description: 'Builder of the first new freestanding duckpin pinsetter since 1973.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ORG_JSONLD) }}
        />
        <Nav />
        {children}
        <Footer />
      </body>
    </html>
  );
}
