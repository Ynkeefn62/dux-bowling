import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  // Supabase puts tokens in the URL hash for implicit flow; modern flow uses code in query.
  // Either way, redirect back home; the client will pick up the session.
  return NextResponse.redirect(new URL("/", url.origin));
}