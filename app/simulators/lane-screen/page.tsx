"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";

const QrScannerModal = dynamic(() => import("@/app/components/QrScannerModal"), { ssr: false });
import { createClient, RealtimeChannel } from "@supabase/supabase-js";

// ── Design tokens ─────────────────────────────────────────────
const ORANGE = "#e46a2e";
const BG     = "#080810";
const PANEL  = "rgba(255,255,255,0.055)";
const BORDER = "rgba(255,255,255,0.10)";
const TEXT   = "#f2f2f2";
const MUTED  = "rgba(242,242,242,0.55)";
const GREEN  = "#4ade80";
const GOLD   = "#facc15";
const CYAN   = "#22d3ee";

// ── Pin layout ────────────────────────────────────────────────
const PIN_ROWS = [[7,8,9],[4,5,6],[1,2,3],[10]] as const;
const ALL_PINS = [1,2,3,4,5,6,7,8,9,10];

// ── Game mode types ───────────────────────────────────────────
type GameMode =
  | "traditional"
  | "no-tap"
  | "strike-derby"
  | "spare"
  | "dux-hunt"
  | "monopoly"
  | "catan"
  | "practice";

type NoTapThreshold = 7 | 8 | 9;

type GameConfig = {
  mode: GameMode;
  noTapThreshold?: NoTapThreshold;
  practiceTargetPins?: number[];
};

type AppScreen = "mode-select" | "game";

// ── Scoring types ─────────────────────────────────────────────
type Mark = "strike" | "spare" | "open" | null;

type Frame = {
  r1: number | null;
  r2: number | null;
  r3: number | null;
  mark: Mark;
  frameScore: number | null;
  runningTotal: number | null;
};

type StrikeDerbyRoll = {
  pinsKnocked: number;
  isStrike: boolean;
};

type StrikeDerbyState = {
  rolls: StrikeDerbyRoll[];
  totalPoints: number;
  rollsRemaining: number;
  done: boolean;
};

type PracticeAttempt = {
  targetPins: number[];
  fallenPins: number[];
  success: boolean;
};

type PracticeState = {
  attempts: PracticeAttempt[];
  successCount: number;
  missCount: number;
};

type PlayerGameState =
  | { mode: "traditional" | "no-tap"; frames: Frame[] }
  | { mode: "strike-derby"; derby: StrikeDerbyState }
  | { mode: "practice"; practice: PracticeState }
  | { mode: "spare" | "dux-hunt" | "monopoly" | "catan" };

type Player = {
  id: string;
  name: string;
  userId: string | null;
  gameId: string | null;
  gameState: PlayerGameState;
  currentFrame: number;
  ballInFrame: number;
  pinsStanding: number[];
  done: boolean;
  dbError: string | null;
};

type RollEvent = {
  fallenPins: number[];
  standingPins: number[];
  speedMph?: number;
};

// ── Scoring engines (pure functions) ─────────────────────────

function emptyFrame(): Frame {
  return { r1:null, r2:null, r3:null, mark:null, frameScore:null, runningTotal:null };
}

function emptyPlayer(id: string, name: string, userId: string|null, config: GameConfig): Player {
  let gameState: PlayerGameState;
  if (config.mode === "traditional" || config.mode === "no-tap") {
    gameState = { mode: config.mode, frames: Array.from({length:10}, emptyFrame) };
  } else if (config.mode === "strike-derby") {
    gameState = { mode:"strike-derby", derby:{ rolls:[], totalPoints:0, rollsRemaining:10, done:false } };
  } else if (config.mode === "practice") {
    gameState = { mode:"practice", practice:{ attempts:[], successCount:0, missCount:0 } };
  } else {
    gameState = { mode: config.mode } as PlayerGameState;
  }
  return {
    id, name, userId, gameId:null, gameState,
    currentFrame:0, ballInFrame:1, pinsStanding:[...ALL_PINS],
    done:false, dbError:null,
  };
}

function computeScores(frames: Frame[]): Frame[] {
  const rolls: (number|null)[] = [];
  for (let i = 0; i < 10; i++) {
    const f = frames[i];
    if (i < 9) {
      rolls.push(f.r1);
      if (f.r1 !== 10) {
        rolls.push(f.r2);
        if (f.r1 !== null && f.r2 !== null && f.r1 + f.r2 < 10) rolls.push(f.r3);
      }
    } else {
      rolls.push(f.r1, f.r2, f.r3);
    }
  }
  const result = frames.map(f => ({...f}));
  let rollIdx = 0, running = 0;
  for (let i = 0; i < 10; i++) {
    const f = result[i];
    if (i < 9) {
      if (f.r1 === 10) {
        const b1 = rolls[rollIdx+1]??null, b2 = rolls[rollIdx+2]??null;
        if (b1!==null&&b2!==null) { f.frameScore=10+b1+b2; running+=f.frameScore; f.runningTotal=running; }
        rollIdx+=1;
      } else if (f.r1!==null&&f.r2!==null&&f.r1+f.r2===10) {
        const b1 = rolls[rollIdx+2]??null;
        if (b1!==null) { f.frameScore=10+b1; running+=f.frameScore; f.runningTotal=running; }
        rollIdx+=2;
      } else if (f.r1!==null&&f.r2!==null&&f.r3!==null) {
        if (f.r1+f.r2+f.r3===10) {
          const b1=rolls[rollIdx+3]??null;
          if (b1!==null){f.frameScore=10+b1;running+=f.frameScore;f.runningTotal=running;}
          rollIdx+=3;
        } else {
          f.frameScore=f.r1+f.r2+f.r3; running+=f.frameScore; f.runningTotal=running; rollIdx+=3;
        }
      } else break;
    } else {
      if (f.r1!==null&&f.r2!==null&&f.r3!==null) {
        f.frameScore=f.r1+f.r2+f.r3; running+=f.frameScore; f.runningTotal=running;
      }
    }
  }
  return result;
}

function applyTraditionalRoll(
  player: Player, fallenCount: number, threshold: number
): { player: Player; frameDone: boolean; completedFrameIndex: number } {
  if (player.gameState.mode !== "traditional" && player.gameState.mode !== "no-tap") {
    return { player, frameDone: false, completedFrameIndex: 0 };
  }
  const p: Player = {
    ...player,
    pinsStanding: [...player.pinsStanding],
    gameState: {
      ...player.gameState,
      frames: player.gameState.frames.map(f => ({...f})),
    } as PlayerGameState,
  };
  const gs = p.gameState as { mode: "traditional"|"no-tap"; frames: Frame[] };
  const fi = p.currentFrame, ball = p.ballInFrame;
  const f  = gs.frames[fi];
  const is10th = fi === 9;

  if (ball===1) f.r1=fallenCount;
  else if (ball===2) f.r2=fallenCount;
  else f.r3=fallenCount;

  const r1=f.r1??0, r2=f.r2??0;
  let frameDone=false;

  if (!is10th) {
    const isStrike = ball===1 && r1>=threshold;
    const isSpare  = ball===2 && r1+r2>=threshold;
    const isTBSpare= ball===3 && (f.r3??0)>=0 && r1+r2+(f.r3??0)===10;
    if (isStrike) { f.mark="strike"; frameDone=true; }
    else if (isSpare) { f.mark="spare"; frameDone=true; }
    else if (ball===3) { f.mark=isTBSpare?"spare":"open"; frameDone=true; }
    else { p.pinsStanding=p.pinsStanding.filter(pin=>!ALL_PINS.slice(0,fallenCount).includes(pin)); }
  } else {
    if (ball===1) {
      if (r1>=threshold) p.pinsStanding=[...ALL_PINS];
    } else if (ball===2) {
      const r2v=f.r2??0;
      if (r1>=threshold && r2v>=threshold) p.pinsStanding=[...ALL_PINS];
      else if (r1>=threshold) p.pinsStanding=p.pinsStanding.filter((_,i)=>i>=r2v);
      else if (r1+r2v>=threshold) p.pinsStanding=[...ALL_PINS];
    } else { frameDone=true; }
  }

  if (frameDone) {
    gs.frames=computeScores(gs.frames);
    if (fi<9) { p.currentFrame=fi+1; p.ballInFrame=1; p.pinsStanding=[...ALL_PINS]; }
    else { p.done=true; }
  } else {
    p.ballInFrame=ball+1;
  }
  return { player:p, frameDone, completedFrameIndex:fi };
}

function applyStrikeDerbyRoll(
  state: StrikeDerbyState, fallenPins: number[]
): StrikeDerbyState {
  const isStrike = fallenPins.length === 10;
  const roll: StrikeDerbyRoll = { pinsKnocked: fallenPins.length, isStrike };
  const newRolls = [...state.rolls, roll];
  const newPoints = state.totalPoints + (isStrike ? 1 : 0);
  const newRemaining = state.rollsRemaining - 1 + (isStrike ? 1 : 0);
  return {
    rolls: newRolls,
    totalPoints: newPoints,
    rollsRemaining: newRemaining,
    done: newRemaining <= 0,
  };
}

function applyPracticeRoll(
  state: PracticeState, fallenPins: number[], targetPins: number[]
): PracticeState {
  const success = targetPins.every(p => fallenPins.includes(p));
  return {
    attempts: [...state.attempts, { targetPins:[...targetPins], fallenPins:[...fallenPins], success }],
    successCount: state.successCount + (success?1:0),
    missCount: state.missCount + (success?0:1),
  };
}

// Returns which pins the pinsetter should stand up for the NEXT roll
function computePinsToSet(player: Player, config: GameConfig): number[] {
  if (config.mode === "strike-derby" || config.mode === "practice") {
    if (config.mode === "practice") return config.practiceTargetPins ?? [...ALL_PINS];
    return [...ALL_PINS];
  }
  if (config.mode === "traditional" || config.mode === "no-tap") {
    if (player.done || player.ballInFrame === 1) return [...ALL_PINS];
    return [...player.pinsStanding];
  }
  return [...ALL_PINS];
}

function ballDisplay(val: number|null, isFirst: boolean, r1: number|null, threshold = 10): string {
  if (val===null) return "";
  if (val>=threshold && isFirst) return "X";
  if (!isFirst && r1!==null && r1+val>=threshold) return "/";
  if (val===0) return "-";
  return String(val);
}

// ── Supabase helpers ──────────────────────────────────────────
function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url||!key) return null;
  return createClient(url,key);
}

function makeSessionId() {
  return `lane-${Math.random().toString(36).slice(2,8)}-${Date.now().toString(36)}`;
}

async function sendSetConfig(channel: RealtimeChannel|null, pinsToSet: number[]) {
  if (!channel) return;
  await channel.send({ type:"broadcast", event:"lane:set-config", payload:{ pinsToSet } });
}

async function writeFrameToDb(
  player: Player, frameNumber: number, laneNumber: number|null, locationName: string,
  frames: Frame[],
): Promise<{ gameId:string }|{ error:string }> {
  const frame = frames[frameNumber-1];
  const laneKey = (process.env.NEXT_PUBLIC_LANE_DEVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "");
  try {
    const res = await fetch("/api/game/lane-sync", {
      method:"POST",
      headers:{ "Content-Type":"application/json", Authorization:`Bearer ${laneKey}` },
      body: JSON.stringify({
        user_id: player.userId??null, game_id: player.gameId??null,
        frame_number: frameNumber, lane_number: laneNumber,
        location_name: locationName||null, event_type_name:"Scrimmage",
        game_number:1, r1:frame.r1, r2:frame.r2, r3:frame.r3,
      }),
    });
    const data = await res.json().catch(()=>null);
    if (!res.ok||!data?.ok) return { error: data?.error??`HTTP ${res.status}` };
    return { gameId: data.game_id as string };
  } catch(err:any) {
    return { error: err?.message??"Network error" };
  }
}

// ── Avatar ────────────────────────────────────────────────────
function Avatar({ name, size=40, active=false, done=false }: {
  name: string; size?: number; active?: boolean; done?: boolean;
}) {
  const initials = name.split(" ").map(w=>w[0]?.toUpperCase()||"").join("").slice(0,2) || "?";
  return (
    <div style={{
      width:size, height:size, borderRadius:"50%", flexShrink:0,
      background: done ? "rgba(250,204,21,0.25)" : active ? ORANGE : "rgba(255,255,255,0.14)",
      border: `2px solid ${done ? GOLD : active ? "rgba(255,200,150,0.6)" : "rgba(255,255,255,0.15)"}`,
      display:"grid", placeItems:"center",
      fontWeight:900, fontSize:size*0.36, color: done ? GOLD : "#fff",
      boxShadow: active ? `0 0 12px ${ORANGE}88` : "none",
      transition:"all 200ms",
    }}>
      {initials}
    </div>
  );
}

// ── PinDiagram ────────────────────────────────────────────────
function PinDiagram({ standing, highlight, size=56 }: {
  standing: number[]; highlight?: number[]; size?: number;
}) {
  const standSet = new Set(standing);
  const hiSet    = new Set(highlight??[]);
  return (
    <div style={{ display:"inline-block" }}>
      {PIN_ROWS.map((row, ri) => (
        <div key={ri} style={{ display:"flex", justifyContent:"center", gap:size*0.22, marginBottom:size*0.1 }}>
          {row.map(pin => {
            const up = standSet.has(pin);
            const hi = hiSet.has(pin);
            return (
              <div key={pin} style={{
                width:size*0.46, height:size*0.46, borderRadius:"50%", flexShrink:0,
                background: up ? (hi ? CYAN : ORANGE) : "rgba(255,255,255,0.08)",
                border:`2px solid ${up ? (hi?"rgba(34,211,238,0.7)":"rgba(255,200,150,0.45)") : "rgba(255,255,255,0.06)"}`,
                display:"grid", placeItems:"center",
                fontSize:size*0.16, fontWeight:900,
                color: up ? "#fff" : "rgba(255,255,255,0.18)",
                boxShadow: up&&hi ? `0 0 8px ${CYAN}88` : up ? `0 0 6px ${ORANGE}55` : "none",
                transition:"background 250ms, border 250ms",
              }}>
                {pin}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ── BallCell ──────────────────────────────────────────────────
function BallCell({ val, isStrike=false, isSpare=false }: {
  val:string; isStrike?:boolean; isSpare?:boolean;
}) {
  if (!val) return null;
  return (
    <span style={{
      fontWeight:900, fontSize:".72rem",
      color: isStrike ? ORANGE : isSpare ? GOLD : TEXT,
      minWidth:12, textAlign:"center",
    }}>
      {val}
    </span>
  );
}

// ── ScoreRow ──────────────────────────────────────────────────
function ScoreRow({ player, isActive, config }: {
  player: Player; isActive: boolean; config: GameConfig;
}) {
  const thr = config.noTapThreshold ?? 10;
  const gs  = player.gameState;

  return (
    <div style={{ marginBottom:"1rem" }}>
      {/* Player header */}
      <div style={{ display:"flex", alignItems:"center", gap:".5rem", marginBottom:".35rem" }}>
        <Avatar name={player.name} size={28} active={isActive} done={player.done} />
        <span style={{ fontWeight:900, fontSize:".92rem", color: isActive?ORANGE:TEXT }}>
          {player.name}
        </span>
        {player.userId && <span style={{ fontSize:".65rem", color:GREEN }}>● linked</span>}
        {player.dbError && <span style={{ fontSize:".65rem", color:"#f87171" }} title={player.dbError}>⚠ sync</span>}
        {config.mode==="no-tap" && (
          <span style={{ marginLeft:"auto", fontSize:".62rem", color:CYAN, fontWeight:700 }}>
            {thr}-PIN NO-TAP
          </span>
        )}
        {player.done && gs.mode==="strike-derby" && (
          <span style={{ marginLeft:"auto", fontWeight:900, color:GOLD, fontSize:"1rem" }}>
            🎳 {gs.derby.totalPoints} pts
          </span>
        )}
        {player.done && (gs.mode==="traditional"||gs.mode==="no-tap") && (
          <span style={{ marginLeft:"auto", fontWeight:900, color:GOLD, fontSize:"1rem" }}>
            {(gs.frames[9].runningTotal??0)}
          </span>
        )}
      </div>

      {/* Traditional / No-Tap: 10-frame grid */}
      {(gs.mode==="traditional"||gs.mode==="no-tap") && (
        <div style={{ display:"flex", gap:3 }}>
          {gs.frames.map((f,fi) => {
            const cur = fi===player.currentFrame && !player.done;
            const is10 = fi===9;
            const b1 = ballDisplay(f.r1, true, null, thr);
            const b2 = ballDisplay(f.r2, false, f.r1, thr);
            const b3 = is10
              ? (f.r3===10?"X": f.r3!==null&&f.r2!==null&&f.r3+f.r2===10?"/": f.r3!==null?String(f.r3):"")
              : "";
            return (
              <div key={fi} style={{
                flex: is10?1.4:1, minWidth:0,
                border:`1px solid ${cur?ORANGE:BORDER}`,
                borderRadius:8,
                background: cur?"rgba(228,106,46,0.12)":PANEL,
                overflow:"hidden",
              }}>
                <div style={{ display:"flex", justifyContent:"flex-end", gap:2, padding:"3px 5px 2px", borderBottom:`1px solid ${BORDER}`, minHeight:20 }}>
                  {is10 ? (
                    <>
                      <BallCell val={b1} isStrike={f.r1===10||(thr<10&&(f.r1??0)>=thr)} />
                      <BallCell val={b2} isSpare={b2==="/"} isStrike={b2==="X"||((f.r2??0)>=thr&&f.r1===10)} />
                      <BallCell val={b3} isSpare={b3==="/"} isStrike={b3==="X"} />
                    </>
                  ) : (f.r1??0)>=thr&&f.r1!==null ? (
                    <BallCell val={thr<10?"X*":"X"} isStrike />
                  ) : (
                    <>
                      <BallCell val={b1} />
                      <BallCell val={b2} isSpare={b2==="/"} />
                    </>
                  )}
                </div>
                <div style={{ textAlign:"center", fontWeight:900, fontSize:".85rem", padding:"4px 2px", color:f.runningTotal!==null?TEXT:MUTED, minHeight:24 }}>
                  {f.runningTotal??(cur?"·":"")}
                </div>
                <div style={{ textAlign:"center", fontSize:".6rem", color:MUTED, paddingBottom:3 }}>{fi+1}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Strike Derby row */}
      {gs.mode==="strike-derby" && (
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <div style={{ display:"flex", gap:3, flexWrap:"wrap", flex:1 }}>
            {gs.derby.rolls.map((r,i) => (
              <div key={i} style={{
                width:24, height:24, borderRadius:4, display:"grid", placeItems:"center",
                background: r.isStrike ? ORANGE : "rgba(255,255,255,0.08)",
                fontSize:".62rem", fontWeight:900,
                color: r.isStrike ? "#fff" : MUTED,
                border:`1px solid ${r.isStrike?"rgba(255,200,150,0.4)":BORDER}`,
              }}>
                {r.isStrike ? "X" : r.pinsKnocked}
              </div>
            ))}
            {!player.done && Array.from({length: Math.min(gs.derby.rollsRemaining,5)}).map((_,i) => (
              <div key={`future-${i}`} style={{
                width:24, height:24, borderRadius:4,
                background:"rgba(255,255,255,0.04)",
                border:`1px dashed ${BORDER}`,
              }} />
            ))}
          </div>
          <span style={{ fontSize:".78rem", color:MUTED, whiteSpace:"nowrap" }}>
            {gs.derby.rollsRemaining} left
          </span>
        </div>
      )}

      {/* Practice row */}
      {gs.mode==="practice" && (
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <span style={{ fontSize:".82rem", color:TEXT }}>
            Rolls: <b>{gs.practice.attempts.length}</b>
          </span>
          <span style={{ fontSize:".82rem", color:GREEN }}>
            Hits: <b>{gs.practice.successCount}</b>
          </span>
          <span style={{ fontSize:".82rem", color:MUTED }}>
            Rate: <b style={{color:TEXT}}>
              {gs.practice.attempts.length
                ? Math.round(gs.practice.successCount/gs.practice.attempts.length*100)+"%"
                : "—"}
            </b>
          </span>
        </div>
      )}
    </div>
  );
}

// ── Game Mode Selection ───────────────────────────────────────
const GAME_MODE_INFO: { mode:GameMode; label:string; tagline:string; icon:string; players:string; live:boolean }[] = [
  { mode:"traditional",  label:"Traditional Duckpin",  tagline:"Classic 10 frames · 3 balls · max 300",         icon:"🎳", players:"1–6",  live:true  },
  { mode:"no-tap",       label:"No-Tap Duckpin",        tagline:"7, 8 or 9-pin threshold — great for beginners", icon:"🎯", players:"1–6",  live:true  },
  { mode:"strike-derby", label:"Strike Derby",          tagline:"10 rolls, every strike earns a bonus roll",      icon:"⚡", players:"1–6",  live:true  },
  { mode:"practice",     label:"Practice Mode",         tagline:"Solo drilling · any config · success tracking",  icon:"🎓", players:"1",    live:true  },
  { mode:"spare",        label:"S.P.A.R.E.",            tagline:"H.O.R.S.E. on lanes — set challenges, dare opponents", icon:"🧠", players:"2–6", live:false },
  { mode:"dux-hunt",     label:"Dux Hunt",              tagline:"Arcade Duck Hunt on your real lane",             icon:"🦆", players:"1–4",  live:false },
  { mode:"monopoly",     label:"Monopoly Bowling",      tagline:"Bowl the dice · full Monopoly on screen",        icon:"🏦", players:"2–6",  live:false },
  { mode:"catan",        label:"Catan Bowling",         tagline:"Bowl the dice · full Catan on screen",           icon:"⛵", players:"3–4",  live:false },
];

function GameModeSelectScreen({ sessionId, onSelect }: {
  sessionId: string;
  onSelect: (config: GameConfig) => void;
}) {
  const [selected, setSelected]   = useState<GameMode|null>(null);
  const [threshold, setThreshold] = useState<NoTapThreshold>(8);
  const [practiceTarget, setPracticeTarget] = useState<number[]>([...ALL_PINS]);

  function togglePracticePin(pin: number) {
    setPracticeTarget(prev =>
      prev.includes(pin) ? prev.filter(p=>p!==pin) : [...prev,pin]
    );
  }

  function confirm() {
    if (!selected) return;
    const info = GAME_MODE_INFO.find(m=>m.mode===selected);
    if (!info?.live) return;
    const cfg: GameConfig = { mode: selected };
    if (selected==="no-tap") cfg.noTapThreshold=threshold;
    if (selected==="practice") cfg.practiceTargetPins=practiceTarget.length?practiceTarget:[...ALL_PINS];
    onSelect(cfg);
  }

  const selInfo = GAME_MODE_INFO.find(m=>m.mode===selected);

  return (
    <div style={{
      minHeight:"100vh", background:BG, color:TEXT,
      fontFamily:"Montserrat, system-ui",
      display:"flex", flexDirection:"column", alignItems:"center",
      padding:"2rem 1.25rem",
    }}>
      {/* Header */}
      <div style={{ textAlign:"center", marginBottom:"2rem" }}>
        <div style={{ fontSize:".72rem", letterSpacing:".18em", color:ORANGE, fontWeight:700, marginBottom:".4rem" }}>
          LANE SCREEN SIMULATOR · {sessionId.split("-")[1]?.toUpperCase()}
        </div>
        <h1 style={{ margin:0, fontSize:"clamp(1.6rem,4vw,2.4rem)", fontWeight:900, letterSpacing:"-.02em" }}>
          Select Game Mode
        </h1>
        <p style={{ margin:".4rem 0 0", color:MUTED, fontSize:".88rem" }}>
          Choose how you want to bowl today
        </p>
      </div>

      {/* Grid */}
      <div style={{
        display:"grid",
        gridTemplateColumns:"repeat(auto-fill, minmax(220px, 1fr))",
        gap:"1rem", width:"100%", maxWidth:1100,
      }}>
        {GAME_MODE_INFO.map(info => {
          const isSel = selected===info.mode;
          return (
            <button
              key={info.mode}
              onClick={() => info.live && setSelected(isSel?null:info.mode)}
              style={{
                position:"relative", textAlign:"left",
                padding:"1.1rem 1rem", borderRadius:14,
                border:`2px solid ${isSel?ORANGE:info.live?"rgba(255,255,255,0.1)":"rgba(255,255,255,0.05)"}`,
                background: isSel?"rgba(228,106,46,0.1)":info.live?PANEL:"rgba(255,255,255,0.025)",
                color:TEXT, cursor:info.live?"pointer":"not-allowed",
                fontFamily:"Montserrat, system-ui",
                boxShadow: isSel?`0 0 16px ${ORANGE}44`:"none",
                transition:"all 150ms",
                opacity: info.live ? 1 : 0.55,
              }}
            >
              {!info.live && (
                <span style={{
                  position:"absolute", top:10, right:10,
                  fontSize:".58rem", fontWeight:900, letterSpacing:".08em",
                  background:"rgba(228,106,46,0.8)", color:"#fff",
                  padding:"2px 6px", borderRadius:4,
                }}>
                  COMING SOON
                </span>
              )}
              <div style={{ fontSize:"1.8rem", marginBottom:".4rem" }}>{info.icon}</div>
              <div style={{ fontWeight:900, fontSize:".92rem", marginBottom:".2rem" }}>{info.label}</div>
              <div style={{ fontSize:".72rem", color:MUTED, lineHeight:1.4 }}>{info.tagline}</div>
              <div style={{ marginTop:".5rem", fontSize:".65rem", color:info.live?CYAN:MUTED }}>
                👤 {info.players} player{info.players==="1"?"":"s"}
              </div>
            </button>
          );
        })}
      </div>

      {/* Mode-specific options */}
      {selected==="no-tap" && (
        <div style={{ marginTop:"1.5rem", padding:"1rem 1.5rem", background:PANEL, borderRadius:12, border:`1px solid ${BORDER}`, width:"100%", maxWidth:460 }}>
          <div style={{ fontWeight:700, marginBottom:".75rem", color:ORANGE }}>No-Tap Threshold</div>
          <div style={{ display:"flex", gap:"1rem" }}>
            {([7,8,9] as NoTapThreshold[]).map(n => (
              <button key={n} onClick={()=>setThreshold(n)} style={{
                flex:1, padding:".7rem", borderRadius:10, border:`2px solid ${threshold===n?ORANGE:BORDER}`,
                background: threshold===n?"rgba(228,106,46,0.15)":"transparent",
                color: threshold===n?ORANGE:TEXT, fontWeight:900, fontSize:"1.1rem",
                cursor:"pointer", fontFamily:"Montserrat, system-ui",
              }}>
                {n}-Pin
              </button>
            ))}
          </div>
          <p style={{ margin:".6rem 0 0", fontSize:".72rem", color:MUTED }}>
            Ball 1 must knock ≥ {threshold} pins for a No-Tap strike
          </p>
        </div>
      )}

      {selected==="practice" && (
        <div style={{ marginTop:"1.5rem", padding:"1rem 1.5rem", background:PANEL, borderRadius:12, border:`1px solid ${BORDER}`, width:"100%", maxWidth:460 }}>
          <div style={{ fontWeight:700, marginBottom:".5rem", color:ORANGE }}>Practice Target Configuration</div>
          <p style={{ margin:"0 0 .75rem", fontSize:".72rem", color:MUTED }}>
            Click pins to toggle which ones should be standing for each attempt
          </p>
          <div style={{ display:"flex", justifyContent:"center", marginBottom:".75rem" }}>
            <PinDiagram standing={ALL_PINS} highlight={practiceTarget} size={52} />
          </div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:6, justifyContent:"center" }}>
            {ALL_PINS.map(pin => (
              <button key={pin} onClick={()=>togglePracticePin(pin)} style={{
                width:36, height:36, borderRadius:"50%", border:`2px solid ${practiceTarget.includes(pin)?CYAN:BORDER}`,
                background: practiceTarget.includes(pin)?"rgba(34,211,238,0.18)":"transparent",
                color: practiceTarget.includes(pin)?CYAN:MUTED,
                fontWeight:900, fontSize:".78rem", cursor:"pointer",
              }}>
                {pin}
              </button>
            ))}
          </div>
          <div style={{ display:"flex", gap:8, marginTop:".75rem" }}>
            <button onClick={()=>setPracticeTarget([...ALL_PINS])} style={{ flex:1, padding:".45rem", borderRadius:8, border:`1px solid ${BORDER}`, background:"transparent", color:MUTED, fontSize:".72rem", cursor:"pointer" }}>
              Full rack
            </button>
            <button onClick={()=>setPracticeTarget([])} style={{ flex:1, padding:".45rem", borderRadius:8, border:`1px solid ${BORDER}`, background:"transparent", color:MUTED, fontSize:".72rem", cursor:"pointer" }}>
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Confirm */}
      <div style={{ marginTop:"1.5rem", width:"100%", maxWidth:460 }}>
        <button
          onClick={confirm}
          disabled={!selected||!selInfo?.live}
          style={{
            width:"100%", padding:"1rem", borderRadius:12, border:0,
            background: selected&&selInfo?.live ? ORANGE : "rgba(255,255,255,0.08)",
            color: selected&&selInfo?.live ? "#fff" : MUTED,
            fontWeight:900, fontSize:"1rem", cursor: selected&&selInfo?.live ? "pointer":"not-allowed",
            fontFamily:"Montserrat, system-ui",
            transition:"all 150ms",
          }}
        >
          {selected && selInfo?.live ? `Start ${selInfo.label}` : "Select a game mode"}
        </button>
      </div>
    </div>
  );
}

// ── Add Player Modal ──────────────────────────────────────────
function AddPlayerModal({ onAdd, onClose }: {
  onAdd: (name:string, userId:string|null) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  function submit() {
    const t = name.trim();
    if (!t) return;
    onAdd(t, null);
    onClose();
  }
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", display:"grid", placeItems:"center", zIndex:100 }} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{
        background:"#14141e", border:`1px solid ${BORDER}`, borderRadius:16,
        padding:"1.5rem", width:"min(380px,92vw)", fontFamily:"Montserrat, system-ui",
      }}>
        <h3 style={{ margin:"0 0 1rem", color:ORANGE }}>Add Bowler</h3>
        <label style={{ display:"block", fontSize:".82rem", color:MUTED, marginBottom:".3rem" }}>Display name</label>
        <input
          autoFocus value={name}
          onChange={e=>setName(e.target.value)}
          onKeyDown={e=>{ if(e.key==="Enter") submit(); }}
          placeholder="e.g. Andrew B."
          style={{ width:"100%", boxSizing:"border-box", padding:".75rem", borderRadius:10, border:`1px solid ${BORDER}`, background:"#0e0e18", color:TEXT, fontFamily:"Montserrat, system-ui", fontSize:"1rem" }}
        />
        <p style={{ fontSize:".72rem", color:MUTED, margin:".6rem 0 0", lineHeight:1.5 }}>
          To link a Dux Bowling account, the bowler scans the QR on this screen after being added.
        </p>
        <div style={{ display:"flex", gap:".75rem", marginTop:"1rem" }}>
          <button onClick={submit} disabled={!name.trim()} style={{ flex:1, padding:".8rem", borderRadius:10, border:0, background:ORANGE, color:"#fff", fontWeight:900, cursor:name.trim()?"pointer":"default", opacity:name.trim()?1:0.5 }}>
            Add Bowler
          </button>
          <button onClick={onClose} style={{ padding:".8rem 1rem", borderRadius:10, border:`1px solid ${BORDER}`, background:"transparent", color:TEXT, cursor:"pointer" }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Practice Config Panel ─────────────────────────────────────
function PracticeConfigPanel({ config, onUpdate }: {
  config: GameConfig;
  onUpdate: (cfg: GameConfig) => void;
}) {
  const target = config.practiceTargetPins ?? [...ALL_PINS];
  function toggle(pin: number) {
    const next = target.includes(pin) ? target.filter(p=>p!==pin) : [...target,pin];
    onUpdate({ ...config, practiceTargetPins: next.length ? next : [...ALL_PINS] });
  }
  const PRESETS: { label:string; pins:number[] }[] = [
    { label:"Full Rack",  pins:[...ALL_PINS] },
    { label:"7-10 Split", pins:[7,10] },
    { label:"7-Pin",      pins:[7] },
    { label:"10-Pin",     pins:[10] },
    { label:"4-7-10",     pins:[4,7,10] },
    { label:"2-4-5",      pins:[2,4,5] },
    { label:"3-5-6",      pins:[3,5,6] },
    { label:"4-6 Split",  pins:[4,6] },
  ];
  return (
    <div style={{ background:PANEL, border:`1px solid ${BORDER}`, borderRadius:12, padding:"1rem" }}>
      <div style={{ fontWeight:700, fontSize:".82rem", color:CYAN, marginBottom:".6rem" }}>Practice Target</div>
      <div style={{ display:"flex", justifyContent:"center", marginBottom:".6rem" }}>
        <PinDiagram standing={ALL_PINS} highlight={target} size={44} />
      </div>
      <div style={{ display:"flex", flexWrap:"wrap", gap:4, justifyContent:"center", marginBottom:".6rem" }}>
        {ALL_PINS.map(pin => (
          <button key={pin} onClick={()=>toggle(pin)} style={{
            width:30, height:30, borderRadius:"50%", border:`2px solid ${target.includes(pin)?CYAN:BORDER}`,
            background: target.includes(pin)?"rgba(34,211,238,0.2)":"transparent",
            color: target.includes(pin)?CYAN:MUTED,
            fontWeight:900, fontSize:".72rem", cursor:"pointer",
          }}>{pin}</button>
        ))}
      </div>
      <div style={{ fontSize:".65rem", color:MUTED, marginBottom:".4rem", fontWeight:600 }}>PRESETS</div>
      <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
        {PRESETS.map(pr => (
          <button key={pr.label} onClick={()=>onUpdate({...config, practiceTargetPins:pr.pins})} style={{
            padding:"3px 8px", borderRadius:6, border:`1px solid ${BORDER}`,
            background: JSON.stringify([...target].sort())==JSON.stringify([...pr.pins].sort())
              ? "rgba(34,211,238,0.2)" : "transparent",
            color:MUTED, fontSize:".62rem", cursor:"pointer",
          }}>
            {pr.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Active Player HUD ─────────────────────────────────────────
function ActivePlayerHUD({ player, config, lastRoll }: {
  player: Player|null; config: GameConfig; lastRoll: {count:number; speed?:number}|null;
}) {
  if (!player) return null;
  const gs = player.gameState;
  const target = config.practiceTargetPins ?? [...ALL_PINS];

  return (
    <div style={{
      background:PANEL, border:`1px solid ${BORDER}`, borderRadius:14,
      padding:"1rem", display:"flex", flexDirection:"column", gap:".75rem",
    }}>
      {/* Who's up */}
      <div style={{ display:"flex", alignItems:"center", gap:".75rem" }}>
        <Avatar name={player.name} size={52} active />
        <div>
          <div style={{ fontSize:".68rem", color:MUTED, letterSpacing:".1em", fontWeight:700 }}>NOW BOWLING</div>
          <div style={{ fontWeight:900, fontSize:"1.1rem", color:ORANGE }}>{player.name}</div>
          {(gs.mode==="traditional"||gs.mode==="no-tap") && (
            <div style={{ fontSize:".72rem", color:MUTED, marginTop:2 }}>
              Frame {player.currentFrame+1} · Ball {player.ballInFrame}
              {config.mode==="no-tap" && ` · ${config.noTapThreshold}-Pin No-Tap`}
            </div>
          )}
          {gs.mode==="strike-derby" && (
            <div style={{ fontSize:".72rem", color:MUTED, marginTop:2 }}>
              {gs.derby.totalPoints} pts · {gs.derby.rollsRemaining} rolls left
            </div>
          )}
          {gs.mode==="practice" && (
            <div style={{ fontSize:".72rem", color:MUTED, marginTop:2 }}>
              {gs.practice.successCount}/{gs.practice.attempts.length} hits
              {gs.practice.attempts.length > 0
                ? ` · ${Math.round(gs.practice.successCount/gs.practice.attempts.length*100)}%`
                : ""}
            </div>
          )}
        </div>
        {/* Balls remaining indicator */}
        {(gs.mode==="traditional"||gs.mode==="no-tap") && !player.done && (
          <div style={{ marginLeft:"auto", display:"flex", gap:4 }}>
            {[1,2,3].map(b => (
              <div key={b} style={{
                width:10, height:10, borderRadius:"50%",
                background: b<=3-player.ballInFrame+1 ? ORANGE : "rgba(255,255,255,0.12)",
              }} />
            ))}
          </div>
        )}
      </div>

      {/* Last roll result */}
      {lastRoll!==null && (
        <div style={{
          display:"flex", alignItems:"center", gap:".75rem",
          padding:".5rem .75rem", background:"rgba(255,255,255,0.04)", borderRadius:8,
          border:`1px solid ${BORDER}`,
        }}>
          <div style={{ fontWeight:900, fontSize:"1.3rem", color: lastRoll.count===10?ORANGE:TEXT }}>
            {lastRoll.count === 10 ? (config.mode==="strike-derby"?"⚡ STRIKE!":"🎳 STRIKE!") : `${lastRoll.count} pin${lastRoll.count!==1?"s":""}`}
          </div>
          {lastRoll.speed && (
            <div style={{ marginLeft:"auto", fontSize:".72rem", color:MUTED }}>
              {lastRoll.speed} mph
            </div>
          )}
        </div>
      )}

      {/* Pin diagrams */}
      {config.mode==="practice" ? (
        <div style={{ display:"flex", gap:"1.5rem", justifyContent:"center", flexWrap:"wrap" }}>
          <div style={{ textAlign:"center" }}>
            <div style={{ fontSize:".62rem", color:CYAN, fontWeight:700, marginBottom:".3rem" }}>TARGET</div>
            <PinDiagram standing={target} size={52} />
          </div>
          <div style={{ textAlign:"center" }}>
            <div style={{ fontSize:".62rem", color:MUTED, fontWeight:700, marginBottom:".3rem" }}>STANDING</div>
            <PinDiagram standing={player.pinsStanding} size={52} />
          </div>
        </div>
      ) : (
        <div style={{ display:"flex", justifyContent:"center" }}>
          <PinDiagram standing={player.pinsStanding} size={68} />
        </div>
      )}
    </div>
  );
}

// ── Strike Derby Leaderboard HUD ──────────────────────────────
function StrikeDerbyHUD({ players, activeIdx }: { players: Player[]; activeIdx: number }) {
  return (
    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(160px,1fr))", gap:"1rem" }}>
      {players.map((p, i) => {
        const gs = p.gameState as { mode:"strike-derby"; derby: StrikeDerbyState };
        const isActive = i===activeIdx && !p.done;
        const streak = (() => {
          let s=0;
          for(let j=gs.derby.rolls.length-1;j>=0;j--){
            if(gs.derby.rolls[j].isStrike) s++; else break;
          }
          return s;
        })();
        return (
          <div key={p.id} style={{
            background: isActive?"rgba(228,106,46,0.1)":PANEL,
            border:`2px solid ${isActive?ORANGE:p.done?GOLD:BORDER}`,
            borderRadius:14, padding:"1rem", textAlign:"center",
            boxShadow: isActive?`0 0 18px ${ORANGE}44`:"none",
            transition:"all 200ms",
          }}>
            <Avatar name={p.name} size={48} active={isActive} done={p.done} />
            <div style={{ fontWeight:900, fontSize:".9rem", margin:".5rem 0 .2rem", color:isActive?ORANGE:TEXT }}>
              {p.name}
            </div>
            <div style={{ fontSize:"2rem", fontWeight:900, color:p.done?GOLD:ORANGE, lineHeight:1 }}>
              {gs.derby.totalPoints}
            </div>
            <div style={{ fontSize:".62rem", color:MUTED, marginTop:2 }}>strikes</div>
            {!p.done && (
              <div style={{ fontSize:".7rem", color:MUTED, marginTop:".4rem" }}>
                {gs.derby.rollsRemaining} rolls left
              </div>
            )}
            {streak >= 3 && !p.done && (
              <div style={{ marginTop:".4rem", fontSize:".7rem", color:ORANGE, fontWeight:700 }}>
                🔥 {streak}× streak
              </div>
            )}
            {p.done && <div style={{ marginTop:".3rem", fontSize:".68rem", color:GOLD, fontWeight:700 }}>DONE</div>}
          </div>
        );
      })}
    </div>
  );
}

// ── Game Complete Panel ───────────────────────────────────────
function GameCompletePanel({ players, config }: { players: Player[]; config: GameConfig }) {
  const sorted = [...players].sort((a,b) => {
    if (config.mode==="strike-derby") {
      const da = (a.gameState as any).derby as StrikeDerbyState;
      const db2= (b.gameState as any).derby as StrikeDerbyState;
      return db2.totalPoints - da.totalPoints;
    }
    if (config.mode==="practice") {
      const pa=(a.gameState as any).practice as PracticeState;
      const pb=(b.gameState as any).practice as PracticeState;
      const ra=pa.attempts.length?pa.successCount/pa.attempts.length:0;
      const rb=pb.attempts.length?pb.successCount/pb.attempts.length:0;
      return rb-ra;
    }
    const fa=(a.gameState as any).frames as Frame[];
    const fb=(b.gameState as any).frames as Frame[];
    return (fb[9].runningTotal??0)-(fa[9].runningTotal??0);
  });

  return (
    <div style={{
      background:"rgba(250,204,21,0.06)", border:`1px solid ${GOLD}`,
      borderRadius:14, padding:"1.25rem", textAlign:"center",
    }}>
      <div style={{ fontSize:"1.8rem", marginBottom:".3rem" }}>🏆</div>
      <div style={{ fontWeight:900, fontSize:"1.2rem", color:GOLD, marginBottom:"1rem" }}>Game Complete!</div>
      <div style={{ display:"flex", flexDirection:"column", gap:".5rem" }}>
        {sorted.map((p, rank) => {
          const medal = ["🥇","🥈","🥉"][rank] ?? "";
          let score = "";
          if (config.mode==="strike-derby") {
            score = `${(p.gameState as any).derby.totalPoints} strikes`;
          } else if (config.mode==="practice") {
            const pr=(p.gameState as any).practice as PracticeState;
            score = pr.attempts.length
              ? `${Math.round(pr.successCount/pr.attempts.length*100)}% (${pr.successCount}/${pr.attempts.length})`
              : "0 attempts";
          } else {
            score = String((p.gameState as any).frames[9].runningTotal ?? 0);
          }
          return (
            <div key={p.id} style={{
              display:"flex", alignItems:"center", gap:".75rem",
              padding:".5rem .75rem", background:"rgba(255,255,255,0.04)",
              borderRadius:8, border:`1px solid ${rank===0?GOLD:BORDER}`,
            }}>
              <span style={{ fontSize:"1.2rem" }}>{medal}</span>
              <Avatar name={p.name} size={32} done={rank===0} />
              <span style={{ fontWeight:900, flex:1, textAlign:"left", color:rank===0?GOLD:TEXT }}>{p.name}</span>
              <span style={{ fontWeight:900, color:rank===0?GOLD:MUTED }}>{score}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────
export default function LaneScreenSimulatorPage() {
  const [appScreen, setAppScreen]         = useState<AppScreen>("mode-select");
  const [gameConfig, setGameConfig]       = useState<GameConfig|null>(null);
  const [sessionId, setSessionId]         = useState("");
  const [players, setPlayers]             = useState<Player[]>([]);
  const [activeIdx, setActiveIdx]         = useState(0);
  const [lastRoll, setLastRoll]           = useState<{count:number;speed?:number}|null>(null);
  const [status, setStatus]               = useState("Waiting for pinsetter to connect…");
  const [connected, setConnected]         = useState(false);
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [laneNum, setLaneNum]             = useState("4");
  const [locationName, setLocationName]   = useState("Walkersville Bowling Center");
  const [dbSyncEnabled, setDbSyncEnabled] = useState(true);
  const [showReset, setShowReset]               = useState(false);
  const [showSettings, setShowSettings]         = useState(false);
  const [showPinsetterScanner, setShowPinsetterScanner] = useState(false);

  const channelRef    = useRef<RealtimeChannel|null>(null);
  const playersRef    = useRef(players);
  const activeIdxRef  = useRef(activeIdx);
  const laneNumRef    = useRef(laneNum);
  const locationRef   = useRef(locationName);
  const dbSyncRef     = useRef(dbSyncEnabled);
  const configRef     = useRef(gameConfig);

  useEffect(() => { playersRef.current   = players; },      [players]);
  useEffect(() => { activeIdxRef.current = activeIdx; },    [activeIdx]);
  useEffect(() => { laneNumRef.current   = laneNum; },      [laneNum]);
  useEffect(() => { locationRef.current  = locationName; }, [locationName]);
  useEffect(() => { dbSyncRef.current    = dbSyncEnabled; }, [dbSyncEnabled]);
  useEffect(() => { configRef.current    = gameConfig; },   [gameConfig]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setSessionId(params.get("session") || makeSessionId());
  }, []);

  // Realtime connection
  useEffect(() => {
    if (!sessionId) return;
    const supabase = getSupabaseClient();
    if (!supabase) {
      setStatus("⚠ Supabase env vars missing — real-time unavailable.");
      return;
    }
    const channel = supabase.channel(`pinsetter-${sessionId}`, {
      config: { broadcast: { self:false } },
    });

    channel
      .on("broadcast", { event:"lane:hello" }, () => {
        setConnected(true);
        setStatus("Pinsetter connected. Ready to bowl.");
      })
      .on("broadcast", { event:"pins:reset" }, () => {
        setStatus("Pins reset."); setLastRoll(null);
      })
      .on("broadcast", { event:"bowler:checkin" }, ({ payload }: any) => {
        const { userId, name, playerSlot } = payload;
        setPlayers(prev => {
          const updated = [...prev];
          const slot = playerSlot!==undefined&&playerSlot<updated.length ? playerSlot : activeIdxRef.current;
          if (updated[slot]) updated[slot]={ ...updated[slot], userId, name:name||updated[slot].name };
          return updated;
        });
        setStatus(`${name} linked their account to lane ${laneNumRef.current}.`);
      })
      .on("broadcast", { event:"pins:fallen" }, ({ payload }: { payload: RollEvent }) => {
        const current = playersRef.current;
        const idx     = activeIdxRef.current;
        const cfg     = configRef.current;
        if (!current.length || !cfg) {
          setStatus("⚠ Add bowlers before recording rolls.");
          return;
        }

        const fallenPins  = payload.fallenPins;
        const fallenCount = fallenPins.length;
        const speed       = payload.speedMph;
        setLastRoll({ count:fallenCount, speed });

        let newPlayers = [...current];
        let statusMsg  = "";
        let nextPins   = [...ALL_PINS];

        const player = current[idx];

        if (cfg.mode==="traditional"||cfg.mode==="no-tap") {
          const thr = cfg.noTapThreshold??10;
          const { player:updated, frameDone, completedFrameIndex } = applyTraditionalRoll(player, fallenCount, thr);
          newPlayers = current.map((p,i)=>i===idx?updated:p);

          // DB sync for traditional/no-tap
          if (frameDone && dbSyncRef.current && updated.gameState.mode==="no-tap"||
              frameDone && dbSyncRef.current && updated.gameState.mode==="traditional") {
            const frames = (updated.gameState as any).frames as Frame[];
            const ln = Number(laneNumRef.current)||null;
            writeFrameToDb(updated, completedFrameIndex+1, ln, locationRef.current, frames).then(result=>{
              if ("error" in result) {
                setPlayers(prev=>prev.map((p,i)=>i===idx?{...p,dbError:result.error}:p));
                setStatus(`⚠ DB sync failed: ${result.error}`);
              } else {
                const gid = result.gameId;
                setPlayers(prev=>prev.map((p,i)=>i===idx?{...p,gameId:gid,dbError:null}:p));
                playersRef.current=playersRef.current.map((p,i)=>i===idx?{...p,gameId:gid,dbError:null}:p);
              }
            });
          }

          nextPins = computePinsToSet(updated, cfg);
          if (frameDone) {
            const allDone = newPlayers.every(p=>p.done);
            if (!allDone) {
              let ni=(idx+1)%newPlayers.length;
              while(newPlayers[ni].done) ni=(ni+1)%newPlayers.length;
              setActiveIdx(ni); activeIdxRef.current=ni;
            }
            const isStrike=(updated.gameState as any).frames[completedFrameIndex].mark==="strike";
            statusMsg=updated.done
              ? `🎳 ${player.name} finished — score: ${(updated.gameState as any).frames[9].runningTotal??"?"}`
              : `${player.name}: ${isStrike?"STRIKE! 🎳":"frame done"} — ${newPlayers[activeIdxRef.current]?.name}'s turn`;
          } else {
            statusMsg=`${player.name}: knocked down ${fallenCount} pin${fallenCount!==1?"s":""}${fallenCount===10?" — STRIKE! 🎳":""}`;
          }

        } else if (cfg.mode==="strike-derby") {
          const gs = player.gameState as { mode:"strike-derby"; derby:StrikeDerbyState };
          const newDerby = applyStrikeDerbyRoll(gs.derby, fallenPins);
          const updated: Player = { ...player, gameState:{ mode:"strike-derby", derby:newDerby }, done:newDerby.done };
          newPlayers = current.map((p,i)=>i===idx?updated:p);
          nextPins = [...ALL_PINS]; // always reset for strike derby

          if (newDerby.done) {
            const allDone = newPlayers.every(p=>p.done);
            if (!allDone) {
              let ni=(idx+1)%newPlayers.length;
              while(newPlayers[ni].done) ni=(ni+1)%newPlayers.length;
              setActiveIdx(ni); activeIdxRef.current=ni;
            }
            statusMsg=`${player.name} finished — ${newDerby.totalPoints} strike${newDerby.totalPoints!==1?"s":""}`;
          } else {
            statusMsg=newDerby.rolls.at(-1)?.isStrike
              ? `${player.name}: ⚡ STRIKE! +1 bonus roll (${newDerby.rollsRemaining} left)`
              : `${player.name}: ${fallenCount} pins — ${newDerby.rollsRemaining} rolls remaining`;
          }

        } else if (cfg.mode==="practice") {
          const gs = player.gameState as { mode:"practice"; practice:PracticeState };
          const target = cfg.practiceTargetPins ?? [...ALL_PINS];
          const newPractice = applyPracticeRoll(gs.practice, fallenPins, target);
          const updated: Player = { ...player, gameState:{ mode:"practice", practice:newPractice } };
          newPlayers = current.map((p,i)=>i===idx?updated:p);
          nextPins = target;
          const last = newPractice.attempts.at(-1)!;
          statusMsg=last.success
            ? `✅ HIT! ${newPractice.successCount}/${newPractice.attempts.length} (${Math.round(newPractice.successCount/newPractice.attempts.length*100)}%)`
            : `❌ MISS — ${newPractice.successCount}/${newPractice.attempts.length}`;
        }

        setPlayers(newPlayers);
        playersRef.current=newPlayers;
        setStatus(statusMsg);
        sendSetConfig(channelRef.current, nextPins);
      })
      .subscribe(async()=>{
        await channel.send({ type:"broadcast", event:"lane:hello", payload:{ sessionId } });
      });

    channelRef.current=channel;
    return ()=>{ channelRef.current=null; supabase.removeChannel(channel); };
  }, [sessionId]);

  function addPlayer(name: string, userId: string|null) {
    if (!gameConfig) return;
    setPlayers(prev=>[...prev, emptyPlayer(`p-${Date.now()}`, name, userId, gameConfig)]);
  }

  function resetGame() {
    if (!gameConfig) return;
    setPlayers(prev=>prev.map(p=>emptyPlayer(p.id, p.name, p.userId, gameConfig)));
    setActiveIdx(0); setLastRoll(null);
    setStatus("New game started. Ready to bowl.");
    channelRef.current?.send({ type:"broadcast", event:"lane:reset-request", payload:{} });
    sendSetConfig(channelRef.current, ALL_PINS);
    setShowReset(false);
  }

  function handleGameSelect(cfg: GameConfig) {
    setGameConfig(cfg);
    setAppScreen("game");
    setPlayers([]);
    setActiveIdx(0);
    setLastRoll(null);
    setStatus("Game selected. Add bowlers to begin.");
    // Tell pinsetter to set up a full rack
    sendSetConfig(channelRef.current, ALL_PINS);
  }

  const activePlayer = players[activeIdx] ?? null;
  const allDone      = players.length > 0 && players.every(p=>p.done);
  const modeInfo     = GAME_MODE_INFO.find(m=>m.mode===gameConfig?.mode);

  // QR bowlers scan to join/track this lane session
  const joinQr = useMemo(() => {
    if (!sessionId || typeof window==="undefined") return "";
    const url = `${window.location.origin}/game?session=${encodeURIComponent(sessionId)}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;
  }, [sessionId]);

  const joinUrl = useMemo(() => {
    if (!sessionId || typeof window==="undefined") return "";
    return `${window.location.origin}/game?session=${encodeURIComponent(sessionId)}`;
  }, [sessionId]);

  const pinsetterQr = useMemo(() => {
    if (!sessionId || typeof window==="undefined") return "";
    const url = `${window.location.origin}/simulators/pinsetter?session=${encodeURIComponent(sessionId)}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(url)}`;
  }, [sessionId]);

  // ── Mode selection screen ──────────────────────────────────
  if (appScreen==="mode-select") {
    return <GameModeSelectScreen sessionId={sessionId} onSelect={handleGameSelect} />;
  }

  // ── Active game screen ─────────────────────────────────────
  function handlePinsetterScan(text: string) {
    setShowPinsetterScanner(false);
    // The pinsetter QR encodes a URL like /simulators/lane-screen?session=xxx
    // Navigate there so this device connects with that session
    try {
      const url = new URL(text);
      const scannedSession = url.searchParams.get("session");
      if (scannedSession) {
        window.location.href = `/simulators/lane-screen?session=${encodeURIComponent(scannedSession)}`;
      } else {
        window.location.href = text;
      }
    } catch {
      // Not a valid URL — try treating it as a raw session ID
      window.location.href = `/simulators/lane-screen?session=${encodeURIComponent(text)}`;
    }
  }

  return (
    <main style={{ minHeight:"100vh", background:BG, fontFamily:"Montserrat, system-ui", color:TEXT, padding:"1rem" }}>
      {showAddPlayer && <AddPlayerModal onAdd={addPlayer} onClose={()=>setShowAddPlayer(false)} />}
      {showPinsetterScanner && (
        <QrScannerModal
          title="Scan Pinsetter QR"
          hint="Point at the QR code shown on the pinsetter device"
          onScan={handlePinsetterScan}
          onClose={() => setShowPinsetterScanner(false)}
        />
      )}

      <div style={{ maxWidth:1200, margin:"0 auto" }}>

        {/* ── TOP BAR ── */}
        <div style={{
          display:"flex", alignItems:"center", gap:".75rem",
          marginBottom:"1rem", flexWrap:"wrap",
          padding:".6rem .9rem", background:PANEL,
          border:`1px solid ${BORDER}`, borderRadius:12,
        }}>
          <button onClick={()=>setAppScreen("mode-select")} style={{
            background:"transparent", border:`1px solid ${BORDER}`, borderRadius:8,
            color:MUTED, padding:".3rem .6rem", fontSize:".72rem", cursor:"pointer",
          }}>
            ← Modes
          </button>
          <div style={{ width:1, height:20, background:BORDER }} />
          <div style={{ fontWeight:900, fontSize:".88rem" }}>Lane {laneNum}</div>
          <div style={{ fontSize:".72rem", color:MUTED }}>{locationName}</div>
          {modeInfo && (
            <span style={{
              padding:"2px 8px", borderRadius:6, fontSize:".65rem", fontWeight:700,
              background:"rgba(228,106,46,0.18)", color:ORANGE, letterSpacing:".06em",
            }}>
              {modeInfo.icon} {modeInfo.label.toUpperCase()}
              {gameConfig?.mode==="no-tap" && ` · ${gameConfig.noTapThreshold}-PIN`}
            </span>
          )}
          <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:".6rem" }}>
            <span style={{ display:"inline-flex", alignItems:"center", gap:".35rem", fontSize:".72rem", color:connected?GREEN:MUTED }}>
              <span style={{ width:7, height:7, borderRadius:"50%", background:connected?"#4ade80":"rgba(255,255,255,0.22)", display:"inline-block" }} />
              {connected?"Pinsetter":"Waiting…"}
            </span>
            <button
              onClick={() => setShowPinsetterScanner(true)}
              style={{ padding:".4rem .7rem", borderRadius:8, border:`1px solid ${BORDER}`, background:"transparent", color:MUTED, fontSize:".78rem", cursor:"pointer" }}
              title="Scan the pinsetter device's QR code to connect"
            >
              📷 Scan Pinsetter
            </button>
            <button onClick={()=>setShowAddPlayer(true)} style={{ padding:".4rem .7rem", borderRadius:8, border:0, background:ORANGE, color:"#fff", fontWeight:900, fontSize:".78rem", cursor:"pointer" }}>
              + Bowler
            </button>
            {players.length>0 && (
              <button onClick={()=>setShowReset(true)} style={{ padding:".4rem .7rem", borderRadius:8, border:`1px solid ${BORDER}`, background:"transparent", color:MUTED, fontSize:".78rem", cursor:"pointer" }}>
                New Game
              </button>
            )}
            <button onClick={()=>setShowSettings(s=>!s)} style={{ padding:".4rem .7rem", borderRadius:8, border:`1px solid ${BORDER}`, background:"transparent", color:MUTED, fontSize:".78rem", cursor:"pointer" }}>
              ⚙
            </button>
          </div>
        </div>

        {/* ── JOIN GAME QR BANNER ── */}
        {joinQr && (
          <div style={{
            marginBottom:"1rem", padding:".65rem 1rem",
            background:"rgba(255,255,255,0.04)",
            border:`1px solid ${BORDER}`, borderRadius:12,
            display:"flex", alignItems:"center", gap:"1rem", flexWrap:"wrap",
          }}>
            <img
              src={joinQr}
              alt="Join game QR"
              width={80} height={80}
              style={{ borderRadius:6, background:"white", padding:4, flexShrink:0 }}
            />
            <div>
              <div style={{ fontWeight:900, fontSize:".82rem", color:TEXT, marginBottom:2 }}>
                📲 Bowlers — scan to join &amp; track your score
              </div>
              <div style={{ fontSize:".68rem", color:MUTED, wordBreak:"break-all" }}>
                {joinUrl}
              </div>
            </div>
          </div>
        )}

        {/* Settings drawer */}
        {showSettings && (
          <div style={{ marginBottom:"1rem", padding:"1rem", background:PANEL, border:`1px solid ${BORDER}`, borderRadius:12, display:"flex", gap:"1.5rem", flexWrap:"wrap", alignItems:"center" }}>
            <label style={{ fontSize:".78rem", color:MUTED }}>Lane #
              <input value={laneNum} onChange={e=>setLaneNum(e.target.value)} style={{ marginLeft:6, width:50, background:"#111", border:`1px solid ${BORDER}`, color:TEXT, borderRadius:6, padding:"3px 6px", fontFamily:"Montserrat, system-ui" }} />
            </label>
            <label style={{ fontSize:".78rem", color:MUTED }}>Location
              <input value={locationName} onChange={e=>setLocationName(e.target.value)} style={{ marginLeft:6, width:200, background:"#111", border:`1px solid ${BORDER}`, color:TEXT, borderRadius:6, padding:"3px 6px", fontFamily:"Montserrat, system-ui" }} />
            </label>
            <label style={{ fontSize:".78rem", color:MUTED, display:"flex", alignItems:"center", gap:6 }}>
              <input type="checkbox" checked={dbSyncEnabled} onChange={e=>setDbSyncEnabled(e.target.checked)} />
              DB Sync
            </label>
            <Link href="/simulators" style={{ fontSize:".75rem", color:MUTED }}>← All Simulators</Link>
          </div>
        )}

        {/* Reset confirm */}
        {showReset && (
          <div style={{ marginBottom:"1rem", background:"rgba(228,106,46,0.1)", border:`1px solid ${ORANGE}`, borderRadius:12, padding:"1rem", display:"flex", alignItems:"center", gap:"1rem", flexWrap:"wrap" }}>
            <span style={{ flex:1, fontWeight:700 }}>Reset and start a new game? Current scores will be lost.</span>
            <button onClick={resetGame} style={{ padding:".5rem .9rem", borderRadius:8, border:0, background:ORANGE, color:"#fff", fontWeight:900, cursor:"pointer" }}>Reset</button>
            <button onClick={()=>setShowReset(false)} style={{ padding:".5rem .9rem", borderRadius:8, border:`1px solid ${BORDER}`, background:"transparent", color:TEXT, cursor:"pointer" }}>Cancel</button>
          </div>
        )}

        {/* Empty state */}
        {players.length===0 && (
          <div style={{ textAlign:"center", padding:"3rem 1rem", color:MUTED }}>
            <div style={{ fontSize:"2.5rem", marginBottom:".5rem" }}>🎳</div>
            <div style={{ fontWeight:700, fontSize:"1rem", marginBottom:".3rem" }}>No bowlers yet</div>
            <div style={{ fontSize:".82rem" }}>Click <strong style={{color:ORANGE}}>+ Bowler</strong> to add players</div>
          </div>
        )}

        {/* Status bar */}
        {players.length>0 && (
          <div style={{
            marginBottom:"1rem", padding:".65rem 1rem",
            background:PANEL, border:`1px solid ${BORDER}`, borderRadius:10,
            fontSize:".84rem", color:status.startsWith("⚠")||status.startsWith("❌")?"#f87171":status.startsWith("✅")||status.startsWith("🎳")?GREEN:TEXT,
          }}>
            {status}
          </div>
        )}

        {players.length>0 && (
          <div style={{ display:"grid", gridTemplateColumns:"1fr 264px", gap:"1rem", alignItems:"start" }}>

            {/* ── LEFT: main game area ── */}
            <div style={{ display:"flex", flexDirection:"column", gap:"1rem" }}>

              {/* Game complete */}
              {allDone && <GameCompletePanel players={players} config={gameConfig!} />}

              {/* Strike Derby big tiles */}
              {gameConfig?.mode==="strike-derby" && !allDone && (
                <StrikeDerbyHUD players={players} activeIdx={activeIdx} />
              )}

              {/* Active player HUD (non-derby or after derby for practice) */}
              {!allDone && (gameConfig?.mode!=="strike-derby") && (
                <ActivePlayerHUD player={activePlayer} config={gameConfig!} lastRoll={lastRoll} />
              )}

              {/* Strike derby still shows active HUD below tiles */}
              {!allDone && gameConfig?.mode==="strike-derby" && activePlayer && (
                <div style={{ display:"flex", alignItems:"center", gap:"1rem", padding:".75rem 1rem", background:PANEL, border:`1px solid ${BORDER}`, borderRadius:12 }}>
                  <PinDiagram standing={activePlayer.pinsStanding} size={48} />
                  {lastRoll!==null && (
                    <div style={{ fontWeight:900, fontSize:"1.2rem", color:lastRoll.count===10?ORANGE:TEXT }}>
                      {lastRoll.count===10?"⚡ STRIKE!": `${lastRoll.count} pins`}
                    </div>
                  )}
                </div>
              )}

              {/* Practice config panel */}
              {gameConfig?.mode==="practice" && gameConfig && (
                <PracticeConfigPanel
                  config={gameConfig}
                  onUpdate={cfg=>{
                    setGameConfig(cfg);
                    sendSetConfig(channelRef.current, cfg.practiceTargetPins??[...ALL_PINS]);
                  }}
                />
              )}

              {/* Scoreboard — all players */}
              <div style={{ background:PANEL, border:`1px solid ${BORDER}`, borderRadius:14, padding:"1rem" }}>
                <div style={{ fontSize:".65rem", color:MUTED, letterSpacing:".12em", fontWeight:700, marginBottom:".75rem" }}>SCOREBOARD</div>
                {players.map((p,i)=>(
                  <ScoreRow key={p.id} player={p} isActive={i===activeIdx&&!p.done} config={gameConfig!} />
                ))}
              </div>
            </div>

            {/* ── RIGHT: connection panel ── */}
            <div style={{ display:"flex", flexDirection:"column", gap:".75rem" }}>
              <div style={{ background:PANEL, border:`1px solid ${BORDER}`, borderRadius:12, padding:"1rem", textAlign:"center" }}>
                <div style={{ fontSize:".65rem", color:MUTED, fontWeight:700, letterSpacing:".1em", marginBottom:".5rem" }}>PINSETTER</div>
                {pinsetterQr && <img src={pinsetterQr} alt="Pinsetter QR" width={160} height={160} style={{ borderRadius:6, background:"white", padding:6 }} />}
                <p style={{ fontSize:".68rem", color:MUTED, margin:".5rem 0 0", wordBreak:"break-all" }}>
                  {typeof window!=="undefined" ? `${window.location.origin}/simulators/pinsetter?session=${sessionId}` : ""}
                </p>
              </div>
              <div style={{ background:PANEL, border:`1px solid ${BORDER}`, borderRadius:12, padding:"1rem", textAlign:"center" }}>
                <div style={{ fontSize:".65rem", color:MUTED, fontWeight:700, letterSpacing:".1em", marginBottom:".5rem" }}>JOIN GAME</div>
                {joinQr && <img src={joinQr} alt="Join game QR" width={160} height={160} style={{ borderRadius:6, background:"white", padding:6 }} />}
                <p style={{ fontSize:".68rem", color:MUTED, margin:".5rem 0 0" }}>Scan to join &amp; track your score on your phone</p>
              </div>
              {/* No-tap threshold reminder */}
              {gameConfig?.mode==="no-tap" && (
                <div style={{ padding:".75rem", background:"rgba(34,211,238,0.08)", border:`1px solid rgba(34,211,238,0.25)`, borderRadius:10, textAlign:"center" }}>
                  <div style={{ fontSize:"1.4rem", fontWeight:900, color:CYAN }}>{gameConfig.noTapThreshold}-PIN</div>
                  <div style={{ fontSize:".65rem", color:MUTED, marginTop:2 }}>No-Tap Mode</div>
                  <div style={{ fontSize:".68rem", color:CYAN, marginTop:4 }}>≥{gameConfig.noTapThreshold} pins = strike</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
