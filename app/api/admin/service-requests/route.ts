import { NextRequest, NextResponse } from "next/server";
import { supabaseAdminServer } from "@/app/lib/supabase/server";
import { requireAdmin } from "../_guard";

export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth) return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  if (!body?.id) return NextResponse.json({ ok: false, error: "id required" }, { status: 400 });

  const updates: Record<string, any> = { status: body.status };
  if (body.status === "resolved") updates.resolved_at = new Date().toISOString();

  const admin = supabaseAdminServer();
  const { error } = await admin
    .from("dux_service_requests")
    .update(updates)
    .eq("id", body.id);

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}