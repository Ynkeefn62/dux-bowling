import { NextRequest, NextResponse } from "next/server";
import { supabaseAdminServer } from "@/app/lib/supabase/server";
import { requireAdmin } from "../_guard";

function bad(msg: string, status = 400) {
  return NextResponse.json({ ok: false, error: msg }, { status });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth) return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const { user_id, action } = body ?? {};

  if (!user_id) return bad("user_id required");
  if (!["freeze","unfreeze","delete"].includes(action)) return bad("Invalid action");

  // Never allow an admin to action their own account
  if (user_id === auth.userId) return bad("Cannot action your own account");

  const admin = supabaseAdminServer();

  if (action === "delete") {
    // Soft delete: mark in profiles then disable Supabase auth user
    await admin.from("profiles").update({ user_type: "deleted" }).eq("id", user_id);
    const { error } = await admin.auth.admin.deleteUser(user_id);
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, action: "deleted" });
  }

  if (action === "freeze") {
    // Store freeze state as user_type = bowler_frozen
    // Also ban the user in Supabase Auth so they can't log in
    const { error: profErr } = await admin
      .from("profiles")
      .update({ user_type: "bowler_frozen" })
      .eq("id", user_id);
    if (profErr) return NextResponse.json({ ok: false, error: profErr.message }, { status: 500 });

    await admin.auth.admin.updateUserById(user_id, { ban_duration: "876600h" }); // ~100 years
    return NextResponse.json({ ok: true, action: "frozen" });
  }

  if (action === "unfreeze") {
    const { error: profErr } = await admin
      .from("profiles")
      .update({ user_type: "bowler" })
      .eq("id", user_id);
    if (profErr) return NextResponse.json({ ok: false, error: profErr.message }, { status: 500 });

    await admin.auth.admin.updateUserById(user_id, { ban_duration: "none" });
    return NextResponse.json({ ok: true, action: "unfrozen" });
  }

  return bad("Unknown action");
}