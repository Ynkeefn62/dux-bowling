import { NextResponse } from "next/server";
import { clearAuthCookies } from "../_cookies";

export async function POST() {
  clearAuthCookies();
  return NextResponse.json({ ok: true });
}