import { NextRequest, NextResponse } from "next/server";
import { supabaseAdminServer, supabaseAnonServer } from "@/app/lib/supabase/server";
import { getAccessToken } from "@/app/api/auth/_cookies";

function bad(msg: string, status = 400) {
  return NextResponse.json({ ok: false, error: msg }, { status });
}

async function getAlleyId(admin: ReturnType<typeof supabaseAdminServer>, userId: string): Promise<string | null> {
  const { data } = await admin.from("dux_alleys").select("id").eq("owner_user_id", userId).maybeSingle();
  if (data) return data.id;
  // Fallback for demo
  const { data: fallback } = await admin.from("dux_alleys").select("id").limit(1).single();
  return fallback?.id ?? null;
}

export async function POST(req: NextRequest) {
  const access = getAccessToken();
  if (!access) return bad("Not authenticated", 401);
  const anon = supabaseAnonServer();
  const { data: userData } = await anon.auth.getUser(access);
  if (!userData?.user?.id) return bad("Invalid session", 401);

  const admin = supabaseAdminServer();
  const userId = userData.user.id;
  const alleyId = await getAlleyId(admin, userId);
  if (!alleyId) return bad("No alley found for this account", 404);

  const body = await req.json().catch(() => null);
  if (!body?.description?.trim()) return bad("Description is required");
  if (!body?.request_type) return bad("Request type is required");

  const { data, error } = await admin
    .from("dux_service_requests")
    .insert({
      alley_id: alleyId,
      submitted_by: userId,
      lane_id: body.lane_id ?? null,
      request_type: body.request_type,
      severity: body.severity ?? "medium",
      machine_down: body.machine_down ?? false,
      description: body.description.trim(),
      status: "open",
    })
    .select("*, dux_lanes(lane_number)")
    .single();

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  return NextResponse.json({
    ok: true,
    request: { ...data, lane_number: (data as any).dux_lanes?.lane_number ?? null, dux_lanes: undefined },
  });
}

export async function PATCH(req: NextRequest) {
  const access = getAccessToken();
  if (!access) return bad("Not authenticated", 401);
  const anon = supabaseAnonServer();
  const { data: userData } = await anon.auth.getUser(access);
  if (!userData?.user?.id) return bad("Invalid session", 401);

  const admin = supabaseAdminServer();
  const body = await req.json().catch(() => null);
  if (!body?.id) return bad("Request ID required");

  const updates: Record<string, any> = {};
  if (body.lane_id     !== undefined) updates.lane_id      = body.lane_id;
  if (body.request_type !== undefined) updates.request_type = body.request_type;
  if (body.severity    !== undefined) updates.severity     = body.severity;
  if (body.machine_down !== undefined) updates.machine_down = body.machine_down;
  if (body.description !== undefined) updates.description  = body.description.trim();
  if (body.status      !== undefined) {
    updates.status = body.status;
    if (body.status === "resolved") updates.resolved_at = new Date().toISOString();
  }

  const { data, error } = await admin
    .from("dux_service_requests")
    .update(updates)
    .eq("id", body.id)
    .select("*, dux_lanes(lane_number)")
    .single();

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  return NextResponse.json({
    ok: true,
    request: { ...data, lane_number: (data as any).dux_lanes?.lane_number ?? null, dux_lanes: undefined },
  });
}