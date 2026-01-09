import { NextRequest, NextResponse } from "next/server";

function unauthorized() {
  return new NextResponse("Authentication required", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Protected"',
    },
  });
}

export function middleware(req: NextRequest) {
  // Allow Next static assets without auth
  const { pathname } = req.nextUrl;
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/robots.txt") ||
    pathname.startsWith("/sitemap.xml")
  ) {
    return NextResponse.next();
  }

  const user = process.env.SITE_USER || "";
  const pass = process.env.SITE_PASS || "";

  // If not configured, lock it down anyway
  if (!user || !pass) return unauthorized();

  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Basic ")) return unauthorized();

  const b64 = auth.slice("Basic ".length);
  const decoded = Buffer.from(b64, "base64").toString("utf-8");
  const [u, p] = decoded.split(":");

  if (u !== user || p !== pass) return unauthorized();

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};