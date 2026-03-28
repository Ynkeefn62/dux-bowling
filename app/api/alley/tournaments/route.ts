import { NextRequest, NextResponse } from "next/server";
import { supabaseAdminServer, supabaseAnonServer } from "@/app/lib/supabase/server";
import { getAccessToken } from "@/app/api/auth/_cookies";

function bad(msg: string, status = 400) {
  return NextResponse.json({ ok: false, error: msg }, { status });
}

async function getAlleyId(admin: ReturnType<typeof supabaseAdminServer>, userId: string): Promise<string | null> {
  const { data } = await admin.from("dux_alleys").select("id").eq("owner_user_id", userId).maybeSingle();
  if (data) return data.id;
  const { data: fallback } = await admin.from("dux_alleys").select("id").limit(1).single();
  return fallback?.id ?? null;
}

export async function POST(req: NextRequest) {
  const access = getAccessToken();
  if (!access) return bad("Not authenticated", 401);
  const anon = supabaseAnonServer();
  const { data: userData } = await anon.auth.getUser(access);
  if (!userData?.user?.id) return bad("Invalid session", 401);

  const admin   = supabaseAdminServer();
  const alleyId = await getAlleyId(admin, userData.user.id);
  if (!alleyId) return bad("No alley found", 404);

  const body = await req.json().catch(() => null);
  if (!body?.name?.trim()) return bad("Tournament name is required");

  const { data, error } = await admin
    .from("dux_tournaments")
    .insert({
      alley_id:            alleyId,
      name:                body.name.trim(),
      format:              body.format ?? "single_day",
      event_date:          body.event_date ?? null,
      registration_close:  body.registration_close ?? null,
      capacity:            body.capacity ?? null,
      entry_fee_cents:     body.entry_fee_cents ?? null,
      prize_description:   body.prize_description ?? null,
      ndbc_sanctioned:     body.ndbc_sanctioned ?? false,
      status:              body.status ?? "draft",
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, tournament: data });
}

export async function PATCH(req: NextRequest) {
  const access = getAccessToken();
  if (!access) return bad("Not authenticated", 401);
  const anon = supabaseAnonServer();
  const { data: userData } = await anon.auth.getUser(access);
  if (!userData?.user?.id) return bad("Invalid session", 401);

  const admin = supabaseAdminServer();
  const body  = await req.json().catch(() => null);
  if (!body?.id) return bad("Tournament ID required");

  const fields = ["name","format","event_date","registration_close","capacity","entry_fee_cents","prize_description","ndbc_sanctioned","status","notes"];
  const updates: Record<string, any> = {};
  for (const f of fields) if (body[f] !== undefined) updates[f] = body[f];
  if (updates.name) updates.name = updates.name.trim();

  const { data, error } = await admin
    .from("dux_tournaments")
    .update(updates)
    .eq("id", body.id)
    .select("*")
    .single();

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, tournament: data });
}