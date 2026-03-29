import { NextRequest, NextResponse } from "next/server";
import { supabaseAdminServer } from "@/app/lib/supabase/server";
 
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email || !email.includes("@")) {
      return NextResponse.json({ ok: false, error: "Invalid email" }, { status: 400 });
    }
 
    const admin = supabaseAdminServer();
    await admin
      .from("dux_shop_waitlist")
      .upsert({ email: email.toLowerCase().trim() }, { onConflict: "email" });
 
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message }, { status: 500 });
  }
}
