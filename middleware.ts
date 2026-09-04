import { NextRequest, NextResponse } from 'next/server';

// Soft gate for the private preview. Vercel env vars SITE_USER / SITE_PASS
// override these if you ever want to change the credentials without a deploy.
const USER = process.env.SITE_USER || 'dux';
const PASS = process.env.SITE_PASS || 'bowling';

const PRIVATE_HEADERS = {
  'WWW-Authenticate': 'Basic realm="Dux Bowling - private preview", charset="UTF-8"',
  'X-Robots-Tag': 'noindex, nofollow, noarchive',
  'Cache-Control': 'no-store',
};

export function middleware(req: NextRequest) {
  const header = req.headers.get('authorization');

  if (header) {
    const [scheme, encoded] = header.split(' ');
    if (scheme === 'Basic' && encoded) {
      let decoded = '';
      try {
        decoded = atob(encoded);
      } catch {
        decoded = '';
      }
      const split = decoded.indexOf(':');
      if (split > -1) {
        const user = decoded.slice(0, split);
        const pass = decoded.slice(split + 1);
        if (user === USER && pass === PASS) {
          const res = NextResponse.next();
          // Keep the preview out of search results even once you are signed in.
          res.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
          return res;
        }
      }
    }
  }

  return new NextResponse('Authentication required.', {
    status: 401,
    headers: PRIVATE_HEADERS,
  });
}

// Everything is gated, including images, GIFs and the mechanism videos in
// /public. Only Next's own build assets are skipped, which carry no content
// on their own and would otherwise slow every page load.
export const config = {
  matcher: ['/((?!_next/static|_next/image).*)'],
};
