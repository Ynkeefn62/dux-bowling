import { NextRequest, NextResponse } from “next/server”;
import { supabaseAdminServer } from “@/app/lib/supabase/server”;

// ── lane-sync route ────────────────────────────────────────────
// Called by the lane screen simulator (and eventually real hardware).
// Uses the service role — no user auth cookie needed on the lane device.
// Instead, the caller passes the bowler’s user_id which was obtained
// when the bowler logged in on their phone and the lane registered them.
//
// For guest bowlers (no account), user_id is null and we still create
// a game row but without a user_id — stats won’t be saved to any profile.

type Body = {
user_id?: string | null;          // bowler’s Supabase auth UUID, or null for guests
game_id?: string | null;          // omit on first call — returned and reused after
frame_number: number;             // 1..10
lane_number?: number | null;
location_name?: string | null;    // e.g. “Walkersville Bowling Center”
event_type_name?: “Scrimmage” | “League” | “Tournament”;
game_number?: number;
r1?: number | null;
r2?: number | null;
r3?: number | null;
};

function bad(msg: string, status = 400) {
return NextResponse.json({ ok: false, error: msg }, { status });
}

export async function POST(req: NextRequest) {
// Require the service role key as a bearer token so this endpoint
// can’t be called by random browsers — only trusted server/device code.
const auth = req.headers.get(“authorization”) ?? “”;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? “”;
if (!serviceKey || auth !== `Bearer ${serviceKey}`) {
return bad(“Unauthorized”, 401);
}

let body: Body;
try {
body = (await req.json()) as Body;
} catch {
return bad(“Invalid JSON”);
}

const {
user_id        = null,
game_id: incomingGameId = null,
frame_number,
lane_number    = null,
location_name  = null,
event_type_name = “Scrimmage”,
game_number    = 1,
r1 = null,
r2 = null,
r3 = null,
} = body;

if (!frame_number || frame_number < 1 || frame_number > 10) {
return bad(“frame_number must be 1..10”);
}

const admin = supabaseAdminServer();

// ── Ensure bowler profile exists (if logged-in bowler) ────────
if (user_id) {
const { data: existing } = await admin
.from(“dux_bowler_profiles”)
.select(“id”)
.eq(“user_id”, user_id)
.maybeSingle();

```
if (!existing) {
  const { data: profile } = await admin
    .from("profiles")
    .select("first_name, last_name, username")
    .eq("id", user_id)
    .maybeSingle();

  const displayName =
    (profile as any)?.username ??
    [(profile as any)?.first_name, (profile as any)?.last_name]
      .filter(Boolean).join(" ") ??
    null;

  await admin
    .from("dux_bowler_profiles")
    .insert({ user_id, display_name: displayName });
}
```

}

// ── Resolve lookup IDs ────────────────────────────────────────
const [alleyRes, eventRes, gameTypeRes] = await Promise.all([
location_name
? admin.from(“dux_alleys”).select(“id”).eq(“name”, location_name).maybeSingle()
: Promise.resolve({ data: null }),
admin.from(“dux_event_types”).select(“id”).eq(“name”, event_type_name).maybeSingle(),
admin.from(“dux_game_types”).select(“id”).eq(“name”, “Traditional Duckpin”).maybeSingle(),
]);

// ── Ensure game row ───────────────────────────────────────────
let effectiveGameId = (incomingGameId ?? “”).trim();

if (!effectiveGameId) {
const { data: newGame, error: gameErr } = await admin
.from(“dux_games”)
.insert({
user_id:       user_id ?? null,
alley_id:      (alleyRes as any).data?.id ?? null,
event_type_id: eventRes.data?.id ?? null,
game_type_id:  gameTypeRes.data?.id ?? null,
game_number,
lane_number:   lane_number ?? null,
played_at:     new Date().toISOString(),
status:        “in_progress”,
})
.select(“id”)
.single();

```
if (gameErr || !newGame) {
  return NextResponse.json(
    { ok: false, error: `Failed to create game: ${gameErr?.message}` },
    { status: 500 }
  );
}
effectiveGameId = (newGame as any).id as string;
```

}

// ── Compute strike / spare flags ─────────────────────────────
const isStrike = r1 === 10;
const isSpare  = !isStrike && r1 !== null && r2 !== null && r1 + r2 === 10;

// ── Upsert frame ─────────────────────────────────────────────
const { error: frameErr } = await admin
.from(“dux_frames”)
.upsert(
{
game_id:      effectiveGameId,
frame_number,
lane_number:  lane_number ?? null,
r1: r1 ?? null,
r2: r2 ?? null,
r3: r3 ?? null,
is_strike:    isStrike,
is_spare:     isSpare,
},
{ onConflict: “game_id,frame_number” }
);

if (frameErr) {
return NextResponse.json(
{ ok: false, error: `Frame upsert failed: ${frameErr.message}` },
{ status: 500 }
);
}

// ── If frame 10 is complete, mark game done ───────────────────
if (frame_number === 10 && r1 !== null && r2 !== null && r3 !== null) {
await admin
.from(“dux_games”)
.update({ status: “completed” })
.eq(“id”, effectiveGameId);
}

return NextResponse.json({ ok: true, game_id: effectiveGameId });
}