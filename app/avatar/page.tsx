"use client";
import React, { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";

const AvatarStage = dynamic(() => import("./AvatarStage"), {
  ssr: false,
  loading: () => (
    <div style={{
      width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",
      background:"rgba(4,4,12,0.8)",flexDirection:"column",gap:"1rem",
    }}>
      <div style={{
        width:48,height:48,border:"3px solid rgba(56,217,245,0.15)",
        borderTop:"3px solid #38d9f5",borderRadius:"50%",
        animation:"spin 1s linear infinite",
      }}/>
      <span style={{fontSize:".62rem",color:"rgba(240,240,255,0.4)",fontFamily:"'Courier New',monospace",letterSpacing:".12em"}}>
        LOADING 3D ENGINE
      </span>
    </div>
  ),
});

// ─── Tokens ──────────────────────────────────────────────────
const ORANGE = "#e46a2e";
const BG     = "#0a0a12";
const PANEL  = "rgba(14,14,28,0.92)";
const BORDER = "rgba(255,255,255,0.08)";
const TEXT   = "#f0f0ff";
const MUTED  = "rgba(240,240,255,0.50)";
const NEON   = "#38d9f5";
const NEON2  = "#f538d9";

// ─── Data ─────────────────────────────────────────────────────
const SKIN_TONES = [
  "#FDDBB4","#F8CDA0","#F0BC8A","#E8A87C",
  "#D4906A","#C07858","#A86040","#8C4A2C",
  "#7A3A20","#5C2810","#3E1808","#2A0E04",
];
const HAIR_COLORS = [
  {id:"blonde",hex:"#C8A456",label:"Blonde"},
  {id:"brown", hex:"#5C2E18",label:"Brown"},
  {id:"black", hex:"#150A04",label:"Black"},
  {id:"red",   hex:"#8A2010",label:"Red"},
  {id:"auburn",hex:"#5A2018",label:"Auburn"},
  {id:"gray",  hex:"#787878",label:"Gray"},
  {id:"white", hex:"#D8D8D0",label:"White"},
  {id:"platinum",hex:"#C8C8BC",label:"Platinum"},
];
const EYE_COLORS = [
  {id:"brown",hex:"#4A2C10"},{id:"blue",hex:"#2860A8"},
  {id:"green",hex:"#285830"},{id:"hazel",hex:"#6A5030"},
  {id:"gray", hex:"#607080"},{id:"amber",hex:"#906810"},
];
const HAIR_STYLES      = [{id:"pompadour",label:"Pompadour"},{id:"short",label:"Short"},{id:"buzz",label:"Buzz"},{id:"bob",label:"Bob"},{id:"long",label:"Long"},{id:"curly",label:"Curly"},{id:"bun",label:"Bun"},{id:"bald",label:"Bald"}];
const FACE_SHAPES      = [{id:"oval",label:"Oval"},{id:"round",label:"Round"},{id:"square",label:"Square"},{id:"heart",label:"Heart"}];
const FACIAL_HAIR_LIST = [{id:"none",label:"None"},{id:"stubble",label:"Stubble"},{id:"mustache",label:"Mustache"},{id:"beard-short",label:"Short Beard"},{id:"beard-full",label:"Full Beard"}];
const OUTFITS          = [{id:"bowling-shirt",label:"Bowling Shirt"},{id:"letterman",label:"Letterman"},{id:"jersey",label:"Jersey"},{id:"polo",label:"Polo"},{id:"hoodie",label:"Hoodie"}];
const ACCESSORIES_LIST = [{id:"glasses",label:"Glasses"},{id:"sunglasses",label:"Shades"},{id:"hat",label:"Cap"},{id:"headband",label:"Headband"},{id:"earrings",label:"Earrings"}];

type AvatarState = {
  skinToneIdx:number; hairStyle:string; hairColor:string;
  eyeColor:string; faceShape:string; facialHair:string;
  outfit:string; accessories:string[]; bgColor:string;
};
const DEFAULTS:AvatarState = {
  skinToneIdx:3, hairStyle:"pompadour", hairColor:"brown",
  eyeColor:"brown", faceShape:"oval", facialHair:"none",
  outfit:"bowling-shirt", accessories:[], bgColor:"#e46a2e",
};

// ─── Color math ───────────────────────────────────────────────
function hx(hex:string):[number,number,number]{return[parseInt(hex.slice(1,3),16),parseInt(hex.slice(3,5),16),parseInt(hex.slice(5,7),16)];}
function rh(r:number,g:number,b:number){return"#"+[r,g,b].map(v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,"0")).join("");}
function dk(hex:string,a:number){const[r,g,b]=hx(hex);return rh(r*(1-a),g*(1-a),b*(1-a));}
function lt(hex:string,a:number){const[r,g,b]=hx(hex);return rh(r+(255-r)*a,g+(255-g)*a,b+(255-b)*a);}
function shirtColor(o:string){return o==="bowling-shirt"?"#C03018":o==="letterman"?"#1A3A8C":o==="jersey"?"#186030":o==="polo"?"#284888":"#282838";}

// ─────────────────────────────────────────────────────────────
//  BOWLING ALLEY BACKGROUND SCENE
// ─────────────────────────────────────────────────────────────
function AlleyScene({w=520,h=340}:{w?:number;h?:number}) {
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} xmlns="http://www.w3.org/2000/svg" style={{display:"block"}}>
      <defs>
        <linearGradient id="ceil" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#0a0818"/>
          <stop offset="100%" stopColor="#16122a"/>
        </linearGradient>
        <linearGradient id="floor" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#2a2010"/>
          <stop offset="60%" stopColor="#1a1408"/>
          <stop offset="100%" stopColor="#0e0c06"/>
        </linearGradient>
        <linearGradient id="lane1" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#d4a84a"/>
          <stop offset="40%" stopColor="#b8922e"/>
          <stop offset="100%" stopColor="#8a6818"/>
        </linearGradient>
        <linearGradient id="lane2" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#c89830"/>
          <stop offset="40%" stopColor="#a87c20"/>
          <stop offset="100%" stopColor="#7a5810"/>
        </linearGradient>
        <radialGradient id="lanelight" cx="50%" cy="0%" r="80%">
          <stop offset="0%" stopColor="rgba(255,220,140,0.18)"/>
          <stop offset="100%" stopColor="rgba(255,220,140,0)"/>
        </radialGradient>
        <radialGradient id="spot1" cx="30%" cy="5%" r="40%">
          <stop offset="0%" stopColor="rgba(56,217,245,0.12)"/>
          <stop offset="100%" stopColor="rgba(56,217,245,0)"/>
        </radialGradient>
        <radialGradient id="spot2" cx="70%" cy="5%" r="40%">
          <stop offset="0%" stopColor="rgba(245,56,217,0.10)"/>
          <stop offset="100%" stopColor="rgba(245,56,217,0)"/>
        </radialGradient>
        <filter id="blur2"><feGaussianBlur stdDeviation="2"/></filter>
        <filter id="blur4"><feGaussianBlur stdDeviation="4"/></filter>
        <filter id="glow6">
          <feGaussianBlur stdDeviation="6" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* Ceiling */}
      <rect x="0" y="0" width={w} height={h*0.38} fill="url(#ceil)"/>
      {/* Ceiling neon strips */}
      {[0.2,0.5,0.8].map((x,i)=>(
        <g key={i}>
          <rect x={w*x-1} y="8" width="2" height={h*0.34} fill={i===1?NEON:NEON2} opacity="0.6" filter="url(#blur2)"/>
          <rect x={w*x-4} y="8" width="8" height={h*0.34} fill={i===1?NEON:NEON2} opacity="0.08" filter="url(#blur4)"/>
        </g>
      ))}

      {/* Floor */}
      <rect x="0" y={h*0.38} width={w} height={h*0.62} fill="url(#floor)"/>

      {/* Lanes — perspective projection */}
      {[
        {lx:30,rx:180,vanX:140},
        {lx:170,rx:350,vanX:260},
        {lx:340,rx:490,vanX:380},
      ].map(({lx,rx,vanX},i)=>{
        const vy = h*0.38;
        const ty = h*0.88;
        const vanY = h*0.38;
        // Lane as trapezoid
        const vanXn = vanX;
        const spread = 18;
        return (
          <g key={i}>
            {/* Lane surface */}
            <path
              d={`M${vanXn-spread},${vanY} L${vanXn+spread},${vanY} L${rx},${ty} L${lx},${ty} Z`}
              fill={`url(#lane${i%2===0?"1":"2"})`}
              opacity="0.92"
            />
            {/* Lane shine */}
            <path
              d={`M${vanXn-spread},${vanY} L${vanXn+spread},${vanY} L${rx},${ty} L${lx},${ty} Z`}
              fill="url(#lanelight)" opacity="0.7"
            />
            {/* Lane boards — wood grain lines */}
            {[0.15,0.3,0.45,0.6,0.75,0.9].map((t,j)=>{
              const y = vanY + (ty-vanY)*t;
              const halfW = spread + (((rx-lx)/2)-spread)*t;
              return <line key={j} x1={vanXn-halfW} y1={y} x2={vanXn+halfW} y2={y}
                stroke="rgba(0,0,0,0.12)" strokeWidth={0.5+t} />;
            })}
            {/* Foul line */}
            <line
              x1={vanXn-spread*0.9} y1={vanY + (ty-vanY)*0.08}
              x2={vanXn+spread*0.9} y2={vanY + (ty-vanY)*0.08}
              stroke="rgba(255,255,255,0.5)" strokeWidth="1.5"
            />
            {/* Arrow markers */}
            {[-1,0,1].map((d,k)=>{
              const ay = vanY + (ty-vanY)*0.22;
              const ax = vanXn + d*(spread*0.35);
              return <polygon key={k}
                points={`${ax},${ay-3} ${ax-2},${ay+3} ${ax+2},${ay+3}`}
                fill="rgba(255,200,100,0.5)"
              />;
            })}
            {/* Pins silhouette far end */}
            {[-2,-1,0,1,2].map((d,k)=>{
              const px = vanXn + d*3.5;
              const py = vanY + 4;
              return <ellipse key={k} cx={px} cy={py} rx="1.5" ry="2.5"
                fill="white" opacity="0.5" />;
            })}
          </g>
        );
      })}

      {/* Gutters */}
      <rect x="28" y={h*0.38} width="6" height={h*0.5} fill="#111008" opacity="0.7" rx="1"/>
      <rect x={w-34} y={h*0.38} width="6" height={h*0.5} fill="#111008" opacity="0.7" rx="1"/>

      {/* Overhead lane lights */}
      {[140,260,380].map((x,i)=>(
        <g key={i}>
          <ellipse cx={x} cy={h*0.37} rx="22" ry="5" fill="rgba(255,240,180,0.15)" filter="url(#blur4)"/>
          <rect x={x-10} y="0" width="20" height={h*0.37} fill="rgba(255,240,180,0.04)"/>
          {/* Light fixture */}
          <rect x={x-12} y="12" width="24" height="8" rx="2" fill="#1a1828" stroke="rgba(255,255,255,0.15)" strokeWidth="0.8"/>
          <rect x={x-10} y="14" width="20" height="4" rx="1" fill="rgba(255,240,180,0.7)"/>
        </g>
      ))}

      {/* Colored spot lights */}
      <rect x="0" y="0" width={w} height={h} fill="url(#spot1)" opacity="0.8"/>
      <rect x="0" y="0" width={w} height={h} fill="url(#spot2)" opacity="0.8"/>

      {/* Scoreboard screen top-center */}
      <rect x={w/2-55} y="4" width="110" height="30" rx="4"
        fill="#0a0818" stroke="rgba(56,217,245,0.4)" strokeWidth="1.2"/>
      <text x={w/2} y="17" textAnchor="middle" fill={NEON}
        fontSize="7" fontWeight="900" fontFamily="monospace" letterSpacing="2">DUX BOWLING</text>
      <text x={w/2} y="28" textAnchor="middle" fill="rgba(255,255,255,0.5)"
        fontSize="6" fontFamily="monospace">LANE 4 · WALKERSVILLE</text>

      {/* Ball return machine (right side) */}
      <rect x={w-28} y={h*0.52} width="24" height="50" rx="4" fill="#1a1420" stroke="rgba(255,255,255,0.1)" strokeWidth="0.8"/>
      <circle cx={w-16} cy={h*0.60} r="9" fill="#222" stroke={NEON} strokeWidth="1" opacity="0.7"/>
      <circle cx={w-16} cy={h*0.60} r="6" fill="#111" opacity="0.8"/>

      {/* Floor reflection */}
      <rect x="0" y={h*0.75} width={w} height={h*0.25}
        fill="url(#floor)" opacity="0.5"/>
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────
//  FULL BODY CARTOON CHARACTER — 3/4 VIEW
// ─────────────────────────────────────────────────────────────
function CharacterSVG({state,w=220,h=420}:{state:AvatarState;w?:number;h?:number}) {
  const skin  = SKIN_TONES[state.skinToneIdx];
  const skD   = dk(skin,0.22); const skDD = dk(skin,0.40); const skL = lt(skin,0.22); const skLL = lt(skin,0.42);
  const hair  = HAIR_COLORS.find(h=>h.id===state.hairColor)?.hex??"#5C2E18";
  const hrD   = dk(hair,0.30); const hrL = lt(hair,0.22);
  const eye   = EYE_COLORS.find(e=>e.id===state.eyeColor)?.hex??"#4A2C10";
  const shirt = shirtColor(state.outfit);
  const shD   = dk(shirt,0.25); const shL = lt(shirt,0.22);
  const pant  = "#2a2848"; const pntD = dk(pant,0.3); const pntL = lt(pant,0.2);
  const shoe  = "#1a1010"; const shoL  = lt(shoe,0.3);

  // Cartoon proportions — big head, chunky body, visible legs
  // Head center: (110, 110), radius ~55
  // Torso: y 195–310
  // Legs: y 310–390
  // Feet: y 385–405

  const uid = (s:string) => `ch-${s}-${state.skinToneIdx}-${state.hairColor}`;

  return (
    <svg viewBox="0 0 220 420" width={w} height={h} xmlns="http://www.w3.org/2000/svg" style={{display:"block",overflow:"visible"}}>
      <defs>
        {/* Face lighting */}
        <radialGradient id={uid("face")} cx="38%" cy="28%" r="70%" fx="38%" fy="28%">
          <stop offset="0%"   stopColor={skLL}/>
          <stop offset="30%"  stopColor={skin}/>
          <stop offset="72%"  stopColor={skD}/>
          <stop offset="100%" stopColor={skDD}/>
        </radialGradient>
        {/* Hair */}
        <radialGradient id={uid("hair")} cx="38%" cy="22%" r="72%">
          <stop offset="0%"   stopColor={hrL}/>
          <stop offset="50%"  stopColor={hair}/>
          <stop offset="100%" stopColor={hrD}/>
        </radialGradient>
        {/* Shirt */}
        <linearGradient id={uid("shirt")} x1="5%" y1="0%" x2="95%" y2="100%">
          <stop offset="0%"   stopColor={shL}/>
          <stop offset="55%"  stopColor={shirt}/>
          <stop offset="100%" stopColor={shD}/>
        </linearGradient>
        {/* Pants */}
        <linearGradient id={uid("pants")} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor={pntL}/>
          <stop offset="100%" stopColor={pntD}/>
        </linearGradient>
        {/* Skin neck/arms */}
        <linearGradient id={uid("skin-v")} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor={skD}/>
          <stop offset="30%"  stopColor={skin}/>
          <stop offset="70%"  stopColor={skL}/>
          <stop offset="100%" stopColor={skD}/>
        </linearGradient>
        {/* Iris */}
        <radialGradient id={uid("iris")} cx="32%" cy="28%" r="68%">
          <stop offset="0%"   stopColor={lt(eye,0.4)}/>
          <stop offset="55%"  stopColor={eye}/>
          <stop offset="100%" stopColor={dk(eye,0.45)}/>
        </radialGradient>
        {/* Ground shadow */}
        <radialGradient id={uid("shadow")} cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="rgba(0,0,0,0.45)"/>
          <stop offset="100%" stopColor="rgba(0,0,0,0)"/>
        </radialGradient>
        {/* Rim light (from behind) */}
        <filter id={uid("rim")}>
          <feGaussianBlur stdDeviation="2.5" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        {/* Ambient occlusion */}
        <filter id={uid("ao")}>
          <feGaussianBlur stdDeviation="3" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        {/* SSS lips */}
        <filter id={uid("sss")}>
          <feGaussianBlur stdDeviation="1.2" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* Ground shadow */}
      <ellipse cx="110" cy="410" rx="62" ry="10" fill={`url(#${uid("shadow")})`}/>

      {/* ── SHOES ── */}
      <Shoes shoe={shoe} shoL={shoL} pant={pant}/>

      {/* ── LEGS ── */}
      <Legs pant={pant} pntD={pntD} pntL={pntL} gradId={uid("pants")}/>

      {/* ── BODY / SHIRT ── */}
      <Body3D outfit={state.outfit} shirt={shirt} shD={shD} shL={shL} gradId={uid("shirt")} skin={skin} skD={skD}/>

      {/* ── LEFT ARM (back) ── */}
      <Arm side="left" shirt={shirt} shD={shD} shL={shL} skin={skin} skD={skD} skL={skL}/>

      {/* ── NECK ── */}
      <path d="M98,192 C96,204 96,214 98,222 L122,222 C124,214 124,204 122,192 Z" fill={`url(#${uid("skin-v")})`}/>
      <path d="M104,194 C102,208 102,218 103,222" stroke={skD} strokeWidth="2" fill="none" opacity="0.25" strokeLinecap="round"/>

      {/* ── HEAD ── */}
      <Head3D
        faceShape={state.faceShape} hairStyle={state.hairStyle}
        skin={skin} skD={skD} skDD={skDD} skL={skL} skLL={skLL}
        hair={hair} hrD={hrD} hrL={hrL}
        eye={eye} facGrad={uid("face")} hairGrad={uid("hair")} irisGrad={uid("iris")} sssF={uid("sss")}
        facialHair={state.facialHair}
        accessories={state.accessories}
      />

      {/* ── RIGHT ARM (front) ── */}
      <Arm side="right" shirt={shirt} shD={shD} shL={shL} skin={skin} skD={skD} skL={skL}/>
    </svg>
  );
}

// ── SHOES ────────────────────────────────────────────────────
function Shoes({shoe,shoL,pant}:{shoe:string;shoL:string;pant:string}) {
  return (
    <g>
      {/* Left shoe */}
      <path d="M76,390 C68,390 62,396 62,400 C62,406 72,408 84,407 C94,406 98,402 96,398 L88,390 Z"
        fill={shoe}/>
      <path d="M68,394 C66,396 66,400 70,402" stroke={shoL} strokeWidth="1.5" fill="none" opacity="0.5" strokeLinecap="round"/>
      <path d="M62,400 C70,398 84,400 96,398" stroke={shoL} strokeWidth="1" fill="none" opacity="0.3"/>
      {/* Right shoe (3/4 view — slightly offset) */}
      <path d="M118,392 C110,392 106,396 108,402 C110,407 122,408 134,406 C144,404 148,398 146,395 L136,390 Z"
        fill={dk(shoe,0.1)}/>
      <path d="M112,395 C110,398 111,402 116,404" stroke={shoL} strokeWidth="1.5" fill="none" opacity="0.4" strokeLinecap="round"/>
      <path d="M108,401 C118,399 134,401 146,395" stroke={shoL} strokeWidth="1" fill="none" opacity="0.25"/>
    </g>
  );
}

// ── LEGS ─────────────────────────────────────────────────────
function Legs({pant,pntD,pntL,gradId}:{pant:string;pntD:string;pntL:string;gradId:string}) {
  return (
    <g>
      {/* Left leg */}
      <path d="M82,312 C80,334 78,358 78,388 L96,390 C96,360 96,336 96,312 Z"
        fill={`url(#${gradId})`}/>
      {/* Left leg crease */}
      <path d="M88,318 C87,340 86,362 86,386" stroke={pntD} strokeWidth="2" fill="none" opacity="0.35" strokeLinecap="round"/>
      <path d="M84,330 C82,340 82,348 84,358" stroke={pntL} strokeWidth="1.5" fill="none" opacity="0.2" strokeLinecap="round"/>

      {/* Right leg (front, slightly wider) */}
      <path d="M112,312 C114,334 118,360 120,390 L136,388 C134,360 132,336 128,312 Z"
        fill={pant}/>
      {/* Right leg crease */}
      <path d="M124,318 C123,342 122,364 122,386" stroke={pntD} strokeWidth="2" fill="none" opacity="0.4" strokeLinecap="round"/>
      <path d="M116,326 C115,340 115,354 117,366" stroke={pntL} strokeWidth="1.5" fill="none" opacity="0.25" strokeLinecap="round"/>

      {/* Belt */}
      <path d="M80,310 C86,308 100,306 110,306 C120,306 134,308 140,310 L140,318 C134,316 120,314 110,314 C100,314 86,316 80,318 Z"
        fill={dk(pant,0.4)} opacity="0.9"/>
      {/* Belt buckle */}
      <rect x="106" y="308" width="8" height="8" rx="1.5" fill="rgba(200,180,120,0.8)"/>
      <rect x="108" y="310" width="4" height="4" rx="1" fill="rgba(180,160,100,0.6)"/>
    </g>
  );
}

// ── BODY (SHIRT) ──────────────────────────────────────────────
function Body3D({outfit,shirt,shD,shL,gradId,skin,skD}:{outfit:string;shirt:string;shD:string;shL:string;gradId:string;skin:string;skD:string}) {
  const accent = outfit==="letterman"?"#C8A020":outfit==="bowling-shirt"?"#F0E096":"#fff";
  return (
    <g>
      {/* Main torso */}
      <path d="M72,222 C66,234 62,252 62,272 L62,310 L158,310 L158,272 C158,252 154,234 148,222 C140,218 128,216 110,216 C92,216 80,218 72,222 Z"
        fill={`url(#${gradId})`}/>

      {/* Chest muscle definition */}
      <path d="M76,240 C82,252 92,258 108,258 C124,258 136,252 140,240"
        fill="none" stroke={shD} strokeWidth="2.5" opacity="0.22" strokeLinecap="round"/>

      {/* Shoulder width — 3D curve */}
      <path d="M62,228 C58,230 56,238 58,248 L66,248" fill={shD} opacity="0.3"/>
      <path d="M158,228 C162,230 164,238 162,248 L154,248" fill={shD} opacity="0.2"/>

      {/* Torso shadow left */}
      <path d="M62,240 L66,310" stroke={shD} strokeWidth="10" fill="none" opacity="0.25" strokeLinecap="round"/>

      {/* Outfit details */}
      {outfit==="bowling-shirt" && (
        <>
          <path d="M110,224 L110,308" stroke={accent} strokeWidth="2" opacity="0.35"/>
          {[242,260,278,296].map(y=>(
            <ellipse key={y} cx="110" cy={y} rx="3.5" ry="2.5" fill={accent} opacity="0.7"/>
          ))}
          {/* Chest pocket */}
          <path d="M76,246 L76,264 L94,264 L94,246 Z" fill="none" stroke={accent} strokeWidth="1.5" opacity="0.4" strokeLinejoin="round"/>
          <path d="M76,250 L94,250" stroke={accent} strokeWidth="1" opacity="0.3"/>
          {/* Retro side stripe */}
          <path d="M66,232 L64,310" stroke={accent} strokeWidth="4" opacity="0.15"/>
          <path d="M154,232 L156,310" stroke={accent} strokeWidth="4" opacity="0.12"/>
          {/* Bowling pin on chest */}
          <ellipse cx="130" cy="255" rx="7" ry="10" fill={accent} opacity="0.18"/>
          <ellipse cx="130" cy="252" rx="4" ry="3" fill={accent} opacity="0.15"/>
        </>
      )}
      {outfit==="letterman" && (
        <>
          <path d="M62,248 L68,248 L68,270 L62,270 Z" fill={accent} opacity="0.75"/>
          <path d="M158,248 L152,248 L152,270 L158,270 Z" fill={accent} opacity="0.75"/>
          <text x="92" y="280" fontSize="28" fontWeight="900" fill={accent} opacity="0.8" fontFamily="Georgia,serif">D</text>
        </>
      )}
      {outfit==="jersey" && (
        <>
          <path d="M68,252 L152,252" stroke={accent} strokeWidth="4" opacity="0.3"/>
          <path d="M68,264 L152,264" stroke={accent} strokeWidth="2.5" opacity="0.2"/>
          <text x="88" y="296" fontSize="34" fontWeight="900" fill={accent} opacity="0.42" fontFamily="Impact,sans-serif">42</text>
        </>
      )}
      {outfit==="hoodie" && (
        <>
          <path d="M80,222 C72,214 68,228" stroke={shL} strokeWidth="3" fill="none" opacity="0.5"/>
          <path d="M140,222 C148,214 152,228" stroke={shL} strokeWidth="3" fill="none" opacity="0.5"/>
          <path d="M90,286 L90,308 C90,310 94,312 110,312 C126,312 130,310 130,308 L130,286 Z" fill={shD} opacity="0.45"/>
          <path d="M103,226 C101,240 100,256 101,270" stroke={shD} strokeWidth="2" fill="none" opacity="0.4" strokeLinecap="round"/>
          <path d="M117,226 C119,240 120,256 119,270" stroke={shD} strokeWidth="2" fill="none" opacity="0.4" strokeLinecap="round"/>
        </>
      )}
      {outfit==="polo" && (
        <>
          <path d="M102,224 L102,252" stroke={shD} strokeWidth="2.5" opacity="0.4"/>
          {[232,244,256].map(y=><circle key={y} cx="101" cy={y} r="2.5" fill={shD} opacity="0.6"/>)}
        </>
      )}

      {/* Collar */}
      <Collar3D outfit={outfit} shirt={shirt} shD={shD} shL={shL}/>
    </g>
  );
}

function Collar3D({outfit,shirt,shD,shL}:{outfit:string;shirt:string;shD:string;shL:string}) {
  if (outfit==="hoodie") return (
    <g>
      <path d="M88,224 C94,232 104,238 110,238 C116,238 126,232 132,224" fill={shD} opacity="0.5"/>
      <path d="M90,226 C98,234 108,238 110,239 C112,238 122,234 130,226" stroke={lt(shirt,0.1)} strokeWidth="1.5" fill="none" opacity="0.3"/>
    </g>
  );
  if (outfit==="polo") return (
    <g>
      <path d="M90,222 L96,238 L110,232 L124,238 L130,222 L124,228 L110,232 L96,228 Z" fill={shL} opacity="0.85"/>
      <path d="M90,222 L96,238 L110,232 L124,238 L130,222" stroke={shD} strokeWidth="1" fill="none" opacity="0.4"/>
    </g>
  );
  return (
    <g>
      <path d="M90,224 C86,228 84,238 86,246 L98,240 L110,236 Z" fill={shL} opacity="0.8"/>
      <path d="M130,224 C134,228 136,238 134,246 L122,240 L110,236 Z" fill={shL} opacity="0.75"/>
      <path d="M90,224 L98,240" stroke={shD} strokeWidth="1" fill="none" opacity="0.35"/>
      <path d="M130,224 L122,240" stroke={shD} strokeWidth="1" fill="none" opacity="0.35"/>
    </g>
  );
}

// ── ARM ───────────────────────────────────────────────────────
function Arm({side,shirt,shD,shL,skin,skD,skL}:{side:"left"|"right";shirt:string;shD:string;shL:string;skin:string;skD:string;skL:string}) {
  const left = side==="left";
  // Left arm goes behind body, right arm in front
  const ax  = left ? 58  : 162;
  const ay  = 232;
  const elx = left ? 48  : 172;
  const ely = 282;
  const hx2  = left ? 50  : 168;
  const hy  = 318;
  return (
    <g opacity={left?0.88:1}>
      {/* Upper arm */}
      <path
        d={left
          ? `M${ax},${ay} C${ax-4},${ay+18} ${elx-2},${ely-14} ${elx},${ely} L${ax+14},${ely} C${ax+16},${ely-14} ${ax+12},${ay+18} ${ax+10},${ay} Z`
          : `M${ax},${ay} C${ax+4},${ay+18} ${elx+2},${ely-14} ${elx},${ely} L${ax-14},${ely} C${ax-16},${ely-14} ${ax-12},${ay+18} ${ax-10},${ay} Z`}
        fill={shirt}
      />
      {/* Upper arm shadow */}
      <path
        d={left ? `M${ax+2},${ay+10} C${ax},${ay+28} ${elx},${ely-8} ${elx+2},${ely}` : `M${ax-2},${ay+10} C${ax},${ay+28} ${elx},${ely-8} ${elx-2},${ely}`}
        stroke={shD} strokeWidth="5" fill="none" opacity="0.28" strokeLinecap="round"
      />
      {/* Forearm */}
      <path
        d={left
          ? `M${elx},${ely} C${elx-2},${ely+16} ${hx2-2},${hy-14} ${hx2},${hy} L${hx2+12},${hy} C${hx2+14},${hy-14} ${elx+14},${ely+16} ${elx+14},${ely} Z`
          : `M${elx},${ely} C${elx+2},${ely+16} ${hx2+2},${hy-14} ${hx2},${hy} L${hx2-12},${hy} C${hx2-14},${hy-14} ${elx-14},${ely+16} ${elx-14},${ely} Z`}
        fill={shirt}
      />
      {/* Cuff */}
      <path
        d={left
          ? `M${hx2-2},${hy-4} C${hx2-1},${hy+4} ${hx2+12},${hy+4} ${hx2+13},${hy-4} Z`
          : `M${hx2-12},${hy-4} C${hx2-12},${hy+4} ${hx2+2},${hy+4} ${hx2+2},${hy-4} Z`}
        fill={shD} opacity="0.7"
      />
      {/* Hand */}
      <Hand3D side={side} skin={skin} skD={skD} skL={skL} hx={hx2} hy={hy}/>
    </g>
  );
}

function Hand3D({side,skin,skD,skL,hx:HX,hy:HY}:{side:"left"|"right";skin:string;skD:string;skL:string;hx:number;hy:number}) {
  const flip = side==="left" ? 1 : -1;
  const cx = HX+6;
  return (
    <g>
      <ellipse cx={cx} cy={HY+10} rx="11" ry="13" fill={skin}/>
      <path d={`M${cx-9},${HY+4} C${cx-8},${HY-2} ${cx},${HY-4} ${cx+8*flip},${HY-2} C${cx+9*flip},${HY+4}`}
        stroke={skD} strokeWidth="1.2" fill="none" opacity="0.35"/>
      {[-5,0,5,9].map((dx,i)=>(
        <line key={i} x1={cx+dx} y1={HY+4} x2={cx+dx} y2={HY-3}
          stroke={skin} strokeWidth="4.5" strokeLinecap="round" opacity="0.9"/>
      ))}
      <ellipse cx={cx-12*flip} cy={HY+8} rx="4" ry="7" fill={skin}
        transform={`rotate(${22*flip},${cx-12*flip},${HY+8})`}/>
      <path d={`M${cx-8},${HY+10} C${cx},${HY+6} ${cx+8},${HY+10}`}
        stroke={skD} strokeWidth="1" fill="none" opacity="0.3" strokeLinecap="round"/>
      <ellipse cx={cx} cy={HY+10} rx="8" ry="5" fill={skL} opacity="0.15"/>
    </g>
  );
}

// ── HEAD (3/4 view, cartoon proportions) ─────────────────────
function Head3D({faceShape,hairStyle,skin,skD,skDD,skL,skLL,hair,hrD,hrL,eye,facGrad,hairGrad,irisGrad,sssF,facialHair,accessories}:{
  faceShape:string;hairStyle:string;skin:string;skD:string;skDD:string;skL:string;skLL:string;
  hair:string;hrD:string;hrL:string;eye:string;facGrad:string;hairGrad:string;irisGrad:string;sssF:string;
  facialHair:string;accessories:string[];
}) {
  // Cartoon head — large cranium (~r55), smaller jaw
  const cx=110, cy=112;
  const fw = faceShape==="square"?56:faceShape==="heart"?52:faceShape==="round"?60:54;
  const fh = faceShape==="oval"?72:faceShape==="square"?62:66;
  const jawW = faceShape==="square"?50:faceShape==="heart"?36:faceShape==="round"?52:46;

  return (
    <g>
      {/* Back hair (behind head) */}
      {hairStyle!=="bald"&&hairStyle!=="buzz"&&hairStyle!=="short"&&(
        <BackHair3D style={hairStyle} hair={hair} hrD={hrD} hrL={hrL} gradId={hairGrad} cx={cx} cy={cy} fw={fw} fh={fh}/>
      )}

      {/* Head shape — organic bezier */}
      <path
        d={`M${cx-fw},${cy-8}
            C${cx-fw},${cy-fh-4} ${cx-fw+10},${cy-fh-12} ${cx},${cy-fh-4}
            C${cx+fw-10},${cy-fh-12} ${cx+fw},${cy-fh-4} ${cx+fw},${cy-8}
            C${cx+fw},${cy+26} ${cx+jawW/2+4},${cy+fh-4} ${cx+4},${cy+fh+6}
            C${cx-4},${cy+fh+10} ${cx-jawW/2-4},${cy+fh-4} ${cx-fw},${cy+26}
            Z`}
        fill={`url(#${facGrad})`}
      />

      {/* Forehead highlight */}
      <ellipse cx={cx-6} cy={cy-fh+18} rx={fw*0.55} ry={fh*0.30}
        fill={skLL} opacity="0.45"/>

      {/* Cheek glow */}
      <ellipse cx={cx-fw+22} cy={cy+14} rx="20" ry="12" fill={skL} opacity="0.30"/>
      <ellipse cx={cx+fw-22} cy={cy+14} rx="20" ry="12" fill={skL} opacity="0.28"/>

      {/* Temple shadow */}
      <path d={`M${cx-fw+3},${cy-12} C${cx-fw-2},${cy+4} ${cx-fw+2},${cy+22} ${cx-fw+10},${cy+34}`}
        stroke={skDD} strokeWidth="7" fill="none" opacity="0.16" strokeLinecap="round"/>
      <path d={`M${cx+fw-3},${cy-12} C${cx+fw+2},${cy+4} ${cx+fw-2},${cy+22} ${cx+fw-10},${cy+34}`}
        stroke={skDD} strokeWidth="7" fill="none" opacity="0.14" strokeLinecap="round"/>

      {/* Chin highlight */}
      <ellipse cx={cx} cy={cy+fh} rx="16" ry="6" fill={skL} opacity="0.22"/>

      {/* ── EARS ── */}
      <Ear3D side="left"  skin={skin} skD={skD} skL={skL} cy={cy}/>
      <Ear3D side="right" skin={skin} skD={skD} skL={skL} cy={cy}/>

      {/* ── EYEBROWS ── */}
      <Eyebrow3D side="left"  hair={hair} hrD={hrD} hrL={hrL} faceShape={faceShape} cx={cx} cy={cy}/>
      <Eyebrow3D side="right" hair={hair} hrD={hrD} hrL={hrL} faceShape={faceShape} cx={cx} cy={cy}/>

      {/* ── EYES ── */}
      <Eye3D side="left"  eye={eye} irisGrad={irisGrad} skin={skin} skD={skD} skL={skL} cx={cx} cy={cy}/>
      <Eye3D side="right" eye={eye} irisGrad={irisGrad} skin={skin} skD={skD} skL={skL} cx={cx} cy={cy}/>

      {/* ── NOSE ── */}
      <Nose3D skin={skin} skD={skD} skL={skL} cx={cx} cy={cy}/>

      {/* ── MOUTH ── */}
      <Mouth3D skin={skin} skD={skD} skL={skL} sssF={sssF} cx={cx} cy={cy}/>

      {/* ── FRONT HAIR ── */}
      {hairStyle!=="bald"&&(
        <FrontHair3D style={hairStyle} hair={hair} hrD={hrD} hrL={hrL} gradId={hairGrad} cx={cx} cy={cy} fw={fw} fh={fh}/>
      )}

      {/* ── FACIAL HAIR ── */}
      {facialHair!=="none"&&<FacialHair3D style={facialHair} hair={hair} hrD={hrD} cx={cx} cy={cy}/>}

      {/* ── ACCESSORIES ── */}
      {accessories.includes("glasses")    && <Glasses3D cx={cx} cy={cy}/>}
      {accessories.includes("sunglasses") && <Sunglasses3D cx={cx} cy={cy}/>}
      {accessories.includes("hat")        && <Hat3D hair={hair} hrD={hrD} hrL={hrL} cx={cx} cy={cy} fw={fw}/>}
      {accessories.includes("headband")   && <Headband3D cx={cx} cy={cy} fw={fw}/>}
      {accessories.includes("earrings")   && <Earrings3D cy={cy}/>}
    </g>
  );
}

function Ear3D({side,skin,skD,skL,cy}:{side:"left"|"right";skin:string;skD:string;skL:string;cy:number}) {
  const x = side==="left" ? 55 : 165;
  const flip = side==="left" ? 1 : -1;
  return (
    <g>
      <ellipse cx={x} cy={cy+6} rx="10" ry="14" fill={skin} stroke={skD} strokeWidth="0.8"/>
      <ellipse cx={x+flip*2} cy={cy+6} rx="5" ry="8" fill={skD} opacity="0.25"/>
      <path d={side==="left" ? `M${x-6},${cy-6} C${x-9},${cy+4} ${x-9},${cy+16} ${x-5},${cy+22}` : `M${x+6},${cy-6} C${x+9},${cy+4} ${x+9},${cy+16} ${x+5},${cy+22}`}
        stroke={skL} strokeWidth="2.5" fill="none" opacity="0.4" strokeLinecap="round"/>
      <ellipse cx={x} cy={cy+19} rx="6" ry="4" fill={skin}/>
    </g>
  );
}

function Eyebrow3D({side,hair,hrD,hrL,faceShape,cx,cy}:{side:"left"|"right";hair:string;hrD:string;hrL:string;faceShape:string;cx:number;cy:number}) {
  const bx = side==="left" ? cx-22 : cx+22;
  const arch = faceShape==="round"?5:faceShape==="heart"?7:4;
  return (
    <g>
      <path d={`M${bx-13},${cy-36+arch} C${bx-7},${cy-42-arch} ${bx+3},${cy-43-arch} ${bx+13},${cy-38+arch} C${bx+9},${cy-36+arch} ${bx+3},${cy-40-arch} ${bx-7},${cy-36+arch} Z`}
        fill={hair} opacity="0.92"/>
      <path d={`M${bx-11},${cy-37+arch} C${bx-4},${cy-41-arch} ${bx+2},${cy-41-arch} ${bx+9},${cy-38+arch}`}
        stroke={lt(hair,0.3)} strokeWidth="1" fill="none" opacity="0.4" strokeLinecap="round"/>
    </g>
  );
}

function Eye3D({side,eye,irisGrad,skin,skD,skL,cx,cy}:{side:"left"|"right";eye:string;irisGrad:string;skin:string;skD:string;skL:string;cx:number;cy:number}) {
  const ex = side==="left" ? cx-22 : cx+22;
  const ey2 = cy-18;
  return (
    <g>
      {/* Socket shadow */}
      <ellipse cx={ex} cy={ey2} rx="15" ry="11" fill={dk(skin,0.25)} opacity="0.32"/>
      {/* Sclera */}
      <path d={`M${ex-12},${ey2} C${ex-12},${ey2-8} ${ex+12},${ey2-8} ${ex+12},${ey2} C${ex+12},${ey2+7} ${ex-12},${ey2+7} ${ex-12},${ey2} Z`}
        fill="#F5EEE4"/>
      {/* Iris clip */}
      <clipPath id={`eye3d-${side}`}>
        <path d={`M${ex-12},${ey2} C${ex-12},${ey2-8} ${ex+12},${ey2-8} ${ex+12},${ey2} C${ex+12},${ey2+7} ${ex-12},${ey2+7} ${ex-12},${ey2} Z`}/>
      </clipPath>
      <circle cx={ex} cy={ey2+1} r="8" fill={`url(#${irisGrad})`} clipPath={`url(#eye3d-${side})`}/>
      {/* Iris texture */}
      <circle cx={ex} cy={ey2+1} r="8" fill="none" stroke={dk(eye,0.3)} strokeWidth="1.5" strokeDasharray="1.8 2.2" opacity="0.3" clipPath={`url(#eye3d-${side})`}/>
      {/* Limbal ring */}
      <circle cx={ex} cy={ey2+1} r="8" fill="none" stroke={dk(eye,0.6)} strokeWidth="1.2" opacity="0.55" clipPath={`url(#eye3d-${side})`}/>
      {/* Pupil */}
      <circle cx={ex} cy={ey2+1} r="4.2" fill="#0A0605" clipPath={`url(#eye3d-${side})`}/>
      {/* Specular */}
      <ellipse cx={ex+3} cy={ey2-3} rx="3.5" ry="2.5" fill="white" opacity="0.18" clipPath={`url(#eye3d-${side})`}/>
      <circle cx={ex+3.5} cy={ey2-3.5} r="1.8" fill="white" opacity="0.9" clipPath={`url(#eye3d-${side})`}/>
      <circle cx={ex-3} cy={ey2+3} r="1" fill="white" opacity="0.3" clipPath={`url(#eye3d-${side})`}/>
      {/* Upper lid */}
      <path d={`M${ex-12},${ey2} C${ex-5},${ey2-12} ${ex+5},${ey2-12} ${ex+12},${ey2}`}
        stroke={dk(skin,0.4)} strokeWidth="1.5" fill="none" opacity="0.6" strokeLinecap="round"/>
      {/* Lash line */}
      <path d={`M${ex-12},${ey2-1} C${ex-5},${ey2-11} ${ex+4},${ey2-11} ${ex+12},${ey2-2}`}
        stroke="#0A0605" strokeWidth="2.2" fill="none" opacity="0.9" strokeLinecap="round"/>
      {/* Individual lashes */}
      {[-9,-4,1,6,10].map((dx,i)=>{
        const lx=ex+dx; const ly=ey2-9; const ang=(dx/12)*0.4;
        return <line key={i} x1={lx} y1={ly} x2={lx+Math.sin(ang)*4} y2={ly-Math.cos(ang)*5-(i===2?1:0)}
          stroke="#0A0605" strokeWidth={i===2?"1.8":"1.4"} opacity="0.7" strokeLinecap="round"/>;
      })}
      {/* Lower lash */}
      <path d={`M${ex-10},${ey2+6} C${ex},${ey2+9} ${ex+10},${ey2+6}`}
        stroke={dk(skin,0.4)} strokeWidth="1" fill="none" opacity="0.35" strokeLinecap="round"/>
      {/* Tear duct */}
      <circle cx={side==="left"?ex-11:ex+11} cy={ey2+1} r="1.8" fill={lt(skin,0.15)} opacity="0.55"/>
    </g>
  );
}

function Nose3D({skin,skD,skL,cx,cy}:{skin:string;skD:string;skL:string;cx:number;cy:number}) {
  return (
    <g>
      <path d={`M${cx-2},${cy-2} C${cx-4},${cy+12} ${cx-6},${cy+22} ${cx-10},${cy+26}`}
        stroke={skL} strokeWidth="2" fill="none" opacity="0.4" strokeLinecap="round"/>
      <path d={`M${cx-4},${cy-1} C${cx-7},${cy+14} ${cx-10},${cy+22} ${cx-13},${cy+26}`}
        stroke={skD} strokeWidth="2" fill="none" opacity="0.2" strokeLinecap="round"/>
      <path d={`M${cx-14},${cy+24} C${cx-17},${cy+27} ${cx-17},${cy+32} ${cx-13},${cy+34} C${cx-8},${cy+36} ${cx+8},${cy+36} ${cx+13},${cy+34} C${cx+17},${cy+32} ${cx+17},${cy+27} ${cx+14},${cy+24} C${cx+8},${cy+28} ${cx-8},${cy+28} ${cx-14},${cy+24} Z`}
        fill={skD} opacity="0.22"/>
      <ellipse cx={cx} cy={cy+28} rx="6" ry="4" fill={skL} opacity="0.28"/>
      <path d={`M${cx-14},${cy+28} C${cx-17},${cy+30} ${cx-17},${cy+34} ${cx-14},${cy+35} C${cx-11},${cy+36} ${cx-9},${cy+33} ${cx-10},${cy+30} Z`}
        fill={skD} opacity="0.4"/>
      <path d={`M${cx+14},${cy+28} C${cx+17},${cy+30} ${cx+17},${cy+34} ${cx+14},${cy+35} C${cx+11},${cy+36} ${cx+9},${cy+33} ${cx+10},${cy+30} Z`}
        fill={skD} opacity="0.4"/>
      <circle cx={cx-14} cy={cy+31} r="1.3" fill={skL} opacity="0.28"/>
      <circle cx={cx+14} cy={cy+31} r="1.3" fill={skL} opacity="0.28"/>
    </g>
  );
}

function Mouth3D({skin,skD,skL,sssF,cx,cy}:{skin:string;skD:string;skL:string;sssF:string;cx:number;cy:number}) {
  const lip = dk(skin,0.26); const lipL = lt(lip,0.22);
  return (
    <g filter={`url(#${sssF})`}>
      {/* Philtrum */}
      <path d={`M${cx-5},${cy+44} C${cx-4},${cy+48} ${cx-4},${cy+50} ${cx-3},${cy+53}`}
        stroke={skD} strokeWidth="1.5" fill="none" opacity="0.25" strokeLinecap="round"/>
      <path d={`M${cx+5},${cy+44} C${cx+4},${cy+48} ${cx+4},${cy+50} ${cx+3},${cy+53}`}
        stroke={skD} strokeWidth="1.5" fill="none" opacity="0.25" strokeLinecap="round"/>
      {/* Corners */}
      <circle cx={cx-16} cy={cy+54} r="2.5" fill={skD} opacity="0.25"/>
      <circle cx={cx+16} cy={cy+54} r="2.5" fill={skD} opacity="0.25"/>
      {/* Upper lip */}
      <path d={`M${cx-16},${cy+54} C${cx-10},${cy+48} ${cx-4},${cy+46} ${cx},${cy+49} C${cx+4},${cy+46} ${cx+10},${cy+48} ${cx+16},${cy+54} C${cx+10},${cy+56} ${cx+4},${cy+56} ${cx},${cy+56} C${cx-4},${cy+56} ${cx-10},${cy+56} ${cx-16},${cy+54} Z`}
        fill={lip}/>
      {/* Cupid's bow highlight */}
      <path d={`M${cx-12},${cy+50} C${cx-6},${cy+47} ${cx},${cy+49} C${cx+6},${cy+47} ${cx+12},${cy+50}`}
        stroke={lipL} strokeWidth="1.2" fill="none" opacity="0.5" strokeLinecap="round"/>
      {/* Lower lip */}
      <path d={`M${cx-16},${cy+55} C${cx-10},${cy+62} ${cx-4},${cy+64} ${cx},${cy+64} C${cx+4},${cy+64} ${cx+10},${cy+62} ${cx+16},${cy+55} C${cx+10},${cy+57} ${cx+4},${cy+58} ${cx},${cy+58} C${cx-4},${cy+58} ${cx-10},${cy+57} ${cx-16},${cy+55} Z`}
        fill={lt(lip,0.08)}/>
      {/* Lower lip highlight */}
      <ellipse cx={cx} cy={cy+60} rx="10" ry="3.5" fill={lipL} opacity="0.4"/>
      <ellipse cx={cx} cy={cy+58} rx="5" ry="2.5" fill={lipL} opacity="0.55"/>
      {/* Lip line */}
      <path d={`M${cx-15},${cy+54} C${cx-6},${cy+54} ${cx+6},${cy+54} ${cx+15},${cy+54}`}
        stroke={dk(lip,0.3)} strokeWidth="0.8" fill="none" opacity="0.55"/>
    </g>
  );
}

function BackHair3D({style,hair,hrD,hrL,gradId,cx,cy,fw,fh}:{style:string;hair:string;hrD:string;hrL:string;gradId:string;cx:number;cy:number;fw:number;fh:number}) {
  if (style==="long") return <g>
    <path d={`M${cx-fw+2},${cy} C${cx-fw-4},${cy+30} ${cx-fw},${cy+80} ${cx-fw+8},${cy+110} L${cx-fw+20},${cy+115} C${cx-fw+14},${cy+82} ${cx-fw+8},${cy+34} ${cx-fw+10},${cy+2} Z`} fill={`url(#${gradId})`}/>
    <path d={`M${cx+fw-2},${cy} C${cx+fw+4},${cy+30} ${cx+fw},${cy+80} ${cx+fw-8},${cy+110} L${cx+fw-20},${cy+115} C${cx+fw-14},${cy+82} ${cx+fw-8},${cy+34} ${cx+fw-10},${cy+2} Z`} fill={`url(#${gradId})`}/>
    <ellipse cx={cx} cy={cy+fh+50} rx={fw-8} ry="42" fill={hrD} opacity="0.6"/>
  </g>;
  if (style==="bob") return <path d={`M${cx-fw},${cy} C${cx-fw-4},${cy+18} ${cx-fw-2},${cy+48} ${cx-fw+8},${cy+70} C${cx-fw+24},${cy+74} ${cx+fw-24},${cy+74} ${cx+fw-8},${cy+70} C${cx+fw+2},${cy+48} ${cx+fw+4},${cy+18} ${cx+fw},${cy} Z`} fill={`url(#${gradId})`} opacity="0.95"/>;
  if (style==="curly") return <g>{[[cx-fw+4,cy+20,22],[cx-fw+2,cy+48,20],[cx+fw-4,cy+20,22],[cx+fw-2,cy+48,20],[cx,cy+fh+22,24]].map(([bx,by,r],i)=><circle key={i} cx={bx} cy={by} r={r} fill={i%2===0?hair:hrD} opacity="0.88"/>)}</g>;
  if (style==="bun") return <circle cx={cx} cy={cy-fh-14} r="22" fill={`url(#${gradId})`}/>;
  return null;
}

function FrontHair3D({style,hair,hrD,hrL,gradId,cx,cy,fw,fh}:{style:string;hair:string;hrD:string;hrL:string;gradId:string;cx:number;cy:number;fw:number;fh:number}) {
  if (style==="bald") return null;
  const hy = cy-fh;
  if (style==="pompadour") return <g>
    <path d={`M${cx-fw},${cy-6} C${cx-fw},${hy-6} ${cx-fw+10},${hy-16} ${cx},${hy-8} C${cx+fw-10},${hy-16} ${cx+fw},${hy-6} ${cx+fw},${cy-6} C${cx+fw-4},${cy-18} ${cx+fw-16},${cy-26} ${cx},${cy-22} C${cx-fw+16},${cy-26} ${cx-fw+4},${cy-18} ${cx-fw},${cy-6} Z`} fill={`url(#${gradId})`}/>
    <path d={`M${cx-fw+4},${cy-8} C${cx-fw+8},${hy-2} ${cx-fw+18},${hy-10} ${cx},${hy-4} C${cx+fw-18},${hy-10} ${cx+fw-8},${hy-2} ${cx+fw-4},${cy-8}`} fill={hrD} opacity="0.45"/>
    <path d={`M${cx-fw*0.5},${cy-22} C${cx-fw*0.3},${hy-10} ${cx-fw*0.1},${hy-14} ${cx+fw*0.15},${hy-6}`} stroke={hrL} strokeWidth="10" fill="none" opacity="0.4" strokeLinecap="round"/>
    {[cx-fw*0.6,cx-fw*0.3,cx,cx+fw*0.3,cx+fw*0.5].map((x,i)=><path key={i} d={`M${x},${cy-14} C${x-2},${cy-28} ${x+2},${hy-6} ${x+3},${hy-2}`} stroke={hrD} strokeWidth="1.2" fill="none" opacity="0.2" strokeLinecap="round"/>)}
  </g>;
  if (style==="short") return <g>
    <path d={`M${cx-fw},${cy-4} C${cx-fw},${hy-4} ${cx-fw+8},${hy-12} ${cx},${hy-6} C${cx+fw-8},${hy-12} ${cx+fw},${hy-4} ${cx+fw},${cy-4} C${cx+fw-6},${cy-18} ${cx+8},${cy-20} ${cx-8},${cy-20} C${cx-fw+6},${cy-18} ${cx-fw},${cy-4} Z`} fill={`url(#${gradId})`}/>
    <path d={`M${cx-8},${cy-18} C${cx-4},${cy-24} ${cx+4},${cy-22} ${cx+8},${cy-18}`} stroke={hrL} strokeWidth="6" fill="none" opacity="0.3" strokeLinecap="round"/>
    <path d={`M${cx-fw},${cy-4} C${cx-fw+8},${cy-2} ${cx-fw/2},${cy} ${cx},${cy} C${cx+fw/2},${cy} ${cx+fw-8},${cy-2} ${cx+fw},${cy-4}`} stroke={hrD} strokeWidth="2" fill="none" opacity="0.45"/>
  </g>;
  if (style==="buzz") return <g>
    <path d={`M${cx-fw},${cy-4} C${cx-fw},${hy-2} ${cx-fw+8},${hy-10} ${cx},${hy-4} C${cx+fw-8},${hy-10} ${cx+fw},${hy-2} ${cx+fw},${cy-4} Z`} fill={hair} opacity="0.82"/>
    {[cx-fw*0.7,cx-fw*0.4,cx-fw*0.1,cx+fw*0.2,cx+fw*0.5,cx+fw*0.7].flatMap((x,i)=>[cy-10,cy-18,cy-26].map((y,j)=><circle key={`${i}-${j}`} cx={x+(i%2)*2} cy={y} r="1.3" fill={hrD} opacity="0.4"/>))}
    <path d={`M${cx-fw},${cy-4} C${cx-fw/2},${cy} ${cx},${cy} C${cx+fw/2},${cy} ${cx+fw},${cy-4}`} stroke={hrD} strokeWidth="2.5" fill="none" opacity="0.5"/>
  </g>;
  if (style==="bob") return <g>
    <path d={`M${cx-fw},${cy-2} C${cx-fw+2},${hy-4} ${cx-fw+10},${hy-12} ${cx},${hy-6} C${cx+fw-10},${hy-12} ${cx+fw-2},${hy-4} ${cx+fw},${cy-2} Z`} fill={`url(#${gradId})`}/>
    <path d={`M${cx-fw},${cy-2} C${cx-fw/2},${cy+2} ${cx},${cy+2} C${cx+fw/2},${cy+2} ${cx+fw},${cy-2}`} stroke={hrD} strokeWidth="3" fill="none" opacity="0.55"/>
    <path d={`M${cx-fw*0.5},${hy+6} C${cx-fw*0.2},${hy-4} ${cx+fw*0.1},${hy-8} ${cx+fw*0.4},${hy}`} stroke={hrL} strokeWidth="9" fill="none" opacity="0.35" strokeLinecap="round"/>
  </g>;
  if (style==="long") return <g>
    <path d={`M${cx-fw},${cy-2} C${cx-fw+2},${hy-4} ${cx-fw+10},${hy-12} ${cx},${hy-6} C${cx+fw-10},${hy-12} ${cx+fw-2},${hy-4} ${cx+fw},${cy-2} Z`} fill={`url(#${gradId})`}/>
    <path d={`M${cx},${hy-6} L${cx},${cy-2}`} stroke={hrD} strokeWidth="2" fill="none" opacity="0.4"/>
    <path d={`M${cx-fw*0.4},${hy} C${cx-fw*0.1},${hy-8} ${cx+fw*0.1},${hy-6} ${cx+fw*0.4},${hy}`} stroke={hrL} strokeWidth="9" fill="none" opacity="0.4" strokeLinecap="round"/>
  </g>;
  if (style==="curly") return <g>{[[cx-fw*0.7,cy-18,18],[cx-fw*0.3,cy-26,20],[cx,cy-28,20],[cx+fw*0.3,cy-24,18],[cx+fw*0.6,cy-18,16],[cx-fw*0.5,cy-8,16],[cx+fw*0.5,cy-8,16]].map(([bx,by,r],i)=><circle key={i} cx={bx} cy={by} r={r} fill={i%3===0?hair:i%3===1?hrD:lt(hair,0.1)} opacity="0.92"/>)}</g>;
  if (style==="bun") return <g>
    <path d={`M${cx-fw},${cy-4} C${cx-fw+2},${hy-2} ${cx-fw+10},${hy-10} ${cx},${hy-4} C${cx+fw-10},${hy-10} ${cx+fw-2},${hy-2} ${cx+fw},${cy-4} Z`} fill={`url(#${gradId})`}/>
    <circle cx={cx} cy={cy-fh-14} r="22" fill={`url(#${gradId})`}/>
    <circle cx={cx} cy={cy-fh-14} r="16" fill={hrD} opacity="0.3"/>
    <ellipse cx={cx-8} cy={cy-fh-20} rx="7" ry="5" fill={hrL} opacity="0.3" transform={`rotate(-20,${cx-8},${cy-fh-20})`}/>
    <ellipse cx={cx} cy={cy-fh-2} rx="20" ry="5" fill={hrD} opacity="0.65"/>
  </g>;
  return null;
}

function FacialHair3D({style,hair,hrD,cx,cy}:{style:string;hair:string;hrD:string;cx:number;cy:number}) {
  const my = cy+52;
  if (style==="stubble") return <g opacity="0.55">{[cx-14,cx-8,cx-2,cx+4,cx+10,cx+15].flatMap((x,i)=>[my+2,my+6,my+10].map((y,j)=><circle key={`${i}-${j}`} cx={x+(i%2)} cy={y+(j%2)} r={0.9+Math.random()*0.7} fill={hair} opacity={0.5+Math.random()*0.35}/>))}</g>;
  if (style==="mustache") return <g><path d={`M${cx-15},${my-2} C${cx-9},${my-7} ${cx-4},${my-9} ${cx},${my-7} C${cx+4},${my-9} ${cx+9},${my-7} ${cx+15},${my-2} C${cx+9},${my+2} ${cx+4},${my+1} ${cx},${my+1} C${cx-4},${my+1} ${cx-9},${my+2} ${cx-15},${my-2} Z`} fill={hair}/><path d={`M${cx-13},${my-4} C${cx-7},${my-7} ${cx},${my-7}`} stroke={lt(hair,0.3)} strokeWidth="1.5" fill="none" opacity="0.45" strokeLinecap="round"/></g>;
  if (style==="beard-short") return <g>
    <path d={`M${cx-15},${my-2} C${cx-9},${my-7} ${cx-4},${my-9} ${cx},${my-7} C${cx+4},${my-9} ${cx+9},${my-7} ${cx+15},${my-2} C${cx+9},${my+2} ${cx+4},${my+1} ${cx},${my+1} C${cx-4},${my+1} ${cx-9},${my+2} ${cx-15},${my-2} Z`} fill={hair}/>
    <path d={`M${cx-18},${my+2} C${cx-18},${my+16} ${cx-14},${my+26} ${cx-6},${my+30} C${cx+6},${my+30} ${cx+14},${my+26} ${cx+18},${my+16} C${cx+18},${my+6} ${cx+12},${my+4} ${cx},${my+4} C${cx-12},${my+4} ${cx-18},${my+6} ${cx-18},${my+2} Z`} fill={hair} opacity="0.88"/>
    <path d={`M${cx-4},${my+2} C${cx-3},${my+14} ${cx-2},${my+22} ${cx-1},${my+28}`} stroke={lt(hair,0.25)} strokeWidth="2.5" fill="none" opacity="0.3" strokeLinecap="round"/>
  </g>;
  if (style==="beard-full") return <g>
    <path d={`M${cx-15},${my-4} C${cx-9},${my-9} ${cx-4},${my-11} ${cx},${my-9} C${cx+4},${my-11} ${cx+9},${my-9} ${cx+15},${my-4} C${cx+9},${my+1} ${cx+4},${my} ${cx},${my} C${cx-4},${my} ${cx-9},${my+1} ${cx-15},${my-4} Z`} fill={hair}/>
    <path d={`M${cx-22},${my+2} C${cx-24},${my+22} ${cx-20},${my+44} ${cx-10},${my+52} C${cx+10},${my+52} ${cx+20},${my+44} ${cx+22},${my+22} C${cx+22},${my+6} ${cx+14},${my+4} ${cx},${my+4} C${cx-14},${my+4} ${cx-22},${my+6} ${cx-22},${my+2} Z`} fill={hair} opacity="0.9"/>
    <path d={`M${cx-22},${my+4} C${cx-22},${my+22} ${cx-18},${my+40} ${cx-10},${my+50}`} stroke={hrD} strokeWidth="5" fill="none" opacity="0.28" strokeLinecap="round"/>
    <path d={`M${cx-2},${my+4} C${cx-1},${my+20} ${cx},${my+36} ${cx+1},${my+48}`} stroke={lt(hair,0.28)} strokeWidth="3.5" fill="none" opacity="0.3" strokeLinecap="round"/>
  </g>;
  return null;
}

function Glasses3D({cx,cy}:{cx:number;cy:number}) {
  const ey = cy-18;
  return <g>
    <path d={`M${cx-28},${ey+2} L${cx-22},${ey+2}`} stroke="#2A2420" strokeWidth="2.5" strokeLinecap="round"/>
    <path d={`M${cx+22},${ey+2} L${cx+28},${ey+2}`} stroke="#2A2420" strokeWidth="2.5" strokeLinecap="round"/>
    <line x1={cx-10} y1={ey+2} x2={cx+10} y2={ey+2} stroke="#2A2420" strokeWidth="2"/>
    <rect x={cx-22} y={ey-7} width="32" height="18" rx="8" fill="rgba(180,210,255,0.12)" stroke="#2A2420" strokeWidth="2"/>
    <rect x={cx+10} y={ey-7} width="32" height="18" rx="8" fill="rgba(180,210,255,0.12)" stroke="#2A2420" strokeWidth="2"/>
    <path d={`M${cx-20},${ey-5} C${cx-16},${ey-7} ${cx-10},${ey-6}`} stroke="white" strokeWidth="1.5" fill="none" opacity="0.45" strokeLinecap="round"/>
    <path d={`M${cx+12},${ey-5} C${cx+16},${ey-7} ${cx+22},${ey-6}`} stroke="white" strokeWidth="1.5" fill="none" opacity="0.45" strokeLinecap="round"/>
  </g>;
}

function Sunglasses3D({cx,cy}:{cx:number;cy:number}) {
  const ey = cy-18;
  return <g>
    <path d={`M${cx-28},${ey+2} L${cx-22},${ey+2}`} stroke="#111" strokeWidth="2.5" strokeLinecap="round"/>
    <path d={`M${cx+22},${ey+2} L${cx+28},${ey+2}`} stroke="#111" strokeWidth="2.5" strokeLinecap="round"/>
    <line x1={cx-10} y1={ey+2} x2={cx+10} y2={ey+2} stroke="#1a1a1a" strokeWidth="2.2"/>
    <rect x={cx-22} y={ey-7} width="32" height="18" rx="8" fill="#111" stroke="#2a2a2a" strokeWidth="1.8"/>
    <rect x={cx+10} y={ey-7} width="32" height="18" rx="8" fill="#111" stroke="#2a2a2a" strokeWidth="1.8"/>
    <path d={`M${cx-20},${ey-5} L${cx-12},${ey-5} L${cx-15},${ey+1} Z`} fill="white" opacity="0.09"/>
    <path d={`M${cx+12},${ey-5} L${cx+20},${ey-5} L${cx+17},${ey+1} Z`} fill="white" opacity="0.09"/>
  </g>;
}

function Hat3D({hair,hrD,hrL,cx,cy,fw}:{hair:string;hrD:string;hrL:string;cx:number;cy:number;fw:number}) {
  const fh2 = 72; const hy = cy-fh2;
  const brim = dk(hair,0.32);
  return <g>
    <path d={`M${cx-fw},${cy-6} C${cx-fw+2},${hy-6} ${cx-fw+12},${hy-16} ${cx},${hy-10} C${cx+fw-12},${hy-16} ${cx+fw-2},${hy-6} ${cx+fw},${cy-6} C${cx+fw-8},${cy-20} ${cx+8},${cy-22} ${cx-8},${cy-22} C${cx-fw+8},${cy-20} ${cx-fw},${cy-6} Z`} fill={hair}/>
    <path d={`M${cx-fw+4},${cy-8} C${cx-fw+6},${hy-2} ${cx-fw+14},${hy-10} ${cx},${hy-6} C${cx+fw-14},${hy-10} ${cx+fw-6},${hy-2} ${cx+fw-4},${cy-8}`} fill={hrD} opacity="0.4"/>
    <path d={`M${cx-fw*0.5},${cy-20} C${cx-fw*0.2},${hy-8} ${cx+fw*0.15},${hy-10}`} stroke={hrL} strokeWidth="8" fill="none" opacity="0.38" strokeLinecap="round"/>
    <ellipse cx={cx} cy={cy-6} rx={fw+6} ry="12" fill={brim}/>
    <path d={`M${cx-fw-4},${cy-9} C${cx-fw/2},${cy-4} ${cx},${cy-4} C${cx+fw/2},${cy-4} ${cx+fw+4},${cy-9}`} stroke={lt(brim,0.18)} strokeWidth="2" fill="none" opacity="0.4" strokeLinecap="round"/>
    <path d={`M${cx-fw},${cy-6} C${cx-fw+6},${cy-1} ${cx},${cy-1} C${cx+fw},${cy-1} ${cx+fw},${cy-6}`} stroke={hrD} strokeWidth="2" fill="none" opacity="0.4"/>
    <circle cx={cx} cy={hy-8} r="4.5" fill={hrD}/>
  </g>;
}

function Headband3D({cx,cy,fw}:{cx:number;cy:number;fw:number}) {
  const hy = cy-68;
  return <g>
    <path d={`M${cx-fw+2},${hy+14} C${cx-fw/2},${hy+8} ${cx},${hy+6} C${cx+fw/2},${hy+8} ${cx+fw-2},${hy+14} C${cx+fw-4},${hy+20} ${cx+fw/2},${hy+16} ${cx},${hy+16} C${cx-fw/2},${hy+16} ${cx-fw+4},${hy+20} ${cx-fw+2},${hy+14} Z`} fill={ORANGE}/>
    <path d={`M${cx-fw+4},${hy+13} C${cx-fw/2+2},${hy+8} ${cx},${hy+7} C${cx+fw/2-2},${hy+8} ${cx+fw-4},${hy+13}`} stroke="rgba(255,255,255,0.35)" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
  </g>;
}

function Earrings3D({cy}:{cy:number}) {
  return <g>
    <circle cx={54} cy={cy+22} r="5.5" fill="#C8940C"/>
    <circle cx={54} cy={cy+22} r="4"   fill="#E8B420"/>
    <circle cx={52} cy={cy+20} r="1.4" fill="white" opacity="0.5"/>
    <circle cx={166} cy={cy+22} r="5.5" fill="#C8940C"/>
    <circle cx={166} cy={cy+22} r="4"   fill="#E8B420"/>
    <circle cx={164} cy={cy+20} r="1.4" fill="white" opacity="0.5"/>
  </g>;
}

// ─── TIER SYSTEM ─────────────────────────────────────────────────
const TIERS = {
  common:    {label:"COMMON",    color:"#9ca3af", glow:"rgba(156,163,175,0.25)"},
  rare:      {label:"RARE",      color:"#60a5fa", glow:"rgba(96,165,250,0.35)" },
  epic:      {label:"EPIC",      color:"#a78bfa", glow:"rgba(167,139,250,0.4)" },
  legendary: {label:"LEGENDARY", color:"#fbbf24", glow:"rgba(251,191,36,0.5)"  },
} as const;
type Tier = keyof typeof TIERS;

// ─── TIERED ITEM DATA ─────────────────────────────────────────────
const HAIR_STYLES_TIERED = [
  {id:"pompadour",label:"Pompadour",tier:"common"    as Tier,locked:false},
  {id:"short",    label:"Short Cut",tier:"common"    as Tier,locked:false},
  {id:"buzz",     label:"Buzz Cut", tier:"common"    as Tier,locked:false},
  {id:"bob",      label:"Bob",      tier:"rare"      as Tier,locked:false},
  {id:"long",     label:"Long",     tier:"rare"      as Tier,locked:false},
  {id:"curly",    label:"Curly",    tier:"rare"      as Tier,locked:false},
  {id:"bun",      label:"Top Bun",  tier:"epic"      as Tier,locked:false},
  {id:"bald",     label:"Shaved",   tier:"common"    as Tier,locked:false},
  {id:"mohawk",   label:"Mohawk",   tier:"epic"      as Tier,locked:true },
  {id:"dreads",   label:"Dreads",   tier:"legendary" as Tier,locked:true },
];
const OUTFITS_TIERED = [
  {id:"bowling-shirt",label:"Bowling Shirt",tier:"common"    as Tier,locked:false},
  {id:"polo",         label:"Polo",         tier:"common"    as Tier,locked:false},
  {id:"letterman",    label:"Letterman",    tier:"rare"      as Tier,locked:false},
  {id:"jersey",       label:"Jersey",       tier:"rare"      as Tier,locked:false},
  {id:"hoodie",       label:"Hoodie",       tier:"rare"      as Tier,locked:false},
  {id:"champion",     label:"Champion",     tier:"epic"      as Tier,locked:true },
  {id:"golden-pin",   label:"Golden Pin",   tier:"legendary" as Tier,locked:true },
];
const ACCESSORIES_TIERED = [
  {id:"glasses",   label:"Glasses",  tier:"common"    as Tier,locked:false},
  {id:"sunglasses",label:"Shades",   tier:"rare"      as Tier,locked:false},
  {id:"hat",       label:"Cap",      tier:"common"    as Tier,locked:false},
  {id:"headband",  label:"Headband", tier:"rare"      as Tier,locked:false},
  {id:"earrings",  label:"Earrings", tier:"epic"      as Tier,locked:false},
  {id:"chain",     label:"Chain",    tier:"epic"      as Tier,locked:true },
  {id:"crown",     label:"Crown",    tier:"legendary" as Tier,locked:true },
];
const FACE_SHAPES_TIERED = [
  {id:"oval",  label:"Oval",  tier:"common" as Tier,locked:false},
  {id:"round", label:"Round", tier:"common" as Tier,locked:false},
  {id:"square",label:"Square",tier:"rare"   as Tier,locked:false},
  {id:"heart", label:"Heart", tier:"rare"   as Tier,locked:false},
];
const FACIAL_HAIR_TIERED = [
  {id:"none",       label:"Clean",      tier:"common" as Tier,locked:false},
  {id:"stubble",    label:"Stubble",    tier:"common" as Tier,locked:false},
  {id:"mustache",   label:"Mustache",   tier:"rare"   as Tier,locked:false},
  {id:"beard-short",label:"Short Beard",tier:"rare"   as Tier,locked:false},
  {id:"beard-full", label:"Full Beard", tier:"epic"   as Tier,locked:false},
];
const HAIR_COLORS_TIERED = HAIR_COLORS.map((h,i)=>({...h,tier:(i>=6?"epic":"common") as Tier,locked:false}));
const EYE_COLORS_TIERED  = [
  {id:"brown",label:"Brown",hex:"#4A2C10",tier:"common" as Tier,locked:false},
  {id:"blue", label:"Blue", hex:"#2860A8",tier:"common" as Tier,locked:false},
  {id:"green",label:"Green",hex:"#285830",tier:"common" as Tier,locked:false},
  {id:"hazel",label:"Hazel",hex:"#6A5030",tier:"rare"   as Tier,locked:false},
  {id:"gray", label:"Gray", hex:"#607080",tier:"rare"   as Tier,locked:false},
  {id:"amber",label:"Amber",hex:"#906810",tier:"epic"   as Tier,locked:false},
];

// ─── CATEGORY TYPE ────────────────────────────────────────────────
type Category = "BODY"|"HAIR"|"FACE"|"OUTFIT"|"EXTRAS";
interface CatConfig {id:Category;label:string;icon:ReactNode}

// ─── HELPERS ──────────────────────────────────────────────────────
function hexToRgb(hex:string):string {
  const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);
  return `${r},${g},${b}`;
}

// ─── CATEGORY ICONS ───────────────────────────────────────────────
function IconBody({s=22,c="currentColor"}:{s?:number;c?:string}) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="5" r="3"/><path d="M6 21v-2a6 6 0 0 1 12 0v2"/><line x1="12" y1="8" x2="12" y2="14"/></svg>;
}
function IconHair({s=22,c="currentColor"}:{s?:number;c?:string}) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round"><path d="M5 9c0-4 3-7 7-7s7 3 7 7c0 2-1 4-2 5"/><path d="M8 22V15c0-2 2-3 4-3s4 1 4 3v7"/><path d="M9 22v-3"/><path d="M15 22v-3"/></svg>;
}
function IconFace({s=22,c="currentColor"}:{s?:number;c?:string}) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="9"/><circle cx="9" cy="10" r="1.5" fill={c} stroke="none"/><circle cx="15" cy="10" r="1.5" fill={c} stroke="none"/><path d="M8 15c1 2 7 2 8 0"/></svg>;
}
function IconOutfit({s=22,c="currentColor"}:{s?:number;c?:string}) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 7l-3-4-5 3-5-3-3 4 4 2v10h8V9l4-2z"/></svg>;
}
function IconExtras({s=22,c="currentColor"}:{s?:number;c?:string}) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
}

// ─── TIER BADGE ───────────────────────────────────────────────────
function TierBadge({tier}:{tier:Tier}) {
  const t = TIERS[tier];
  return (
    <div style={{
      position:"absolute",top:5,left:5,zIndex:2,
      fontSize:".44rem",fontWeight:900,letterSpacing:".08em",
      fontFamily:"'Courier New',monospace",color:t.color,
      background:"rgba(0,0,0,0.8)",border:`1px solid ${t.color}`,
      borderRadius:3,padding:"1px 4px",textTransform:"uppercase",
      boxShadow:`0 0 6px ${t.glow}`,lineHeight:1.4,
    }}>
      {tier==="legendary"?"★ LEGENDARY":tier==="epic"?"◆ EPIC":tier==="rare"?"◈ RARE":"COMMON"}
    </div>
  );
}

// ─── LOCK OVERLAY ─────────────────────────────────────────────────
function LockIcon() {
  return (
    <div style={{
      position:"absolute",inset:0,display:"flex",flexDirection:"column",
      alignItems:"center",justifyContent:"center",
      background:"rgba(0,0,0,0.75)",backdropFilter:"blur(3px)",
      borderRadius:8,gap:3,zIndex:3,
    }}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2"/>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg>
      <span style={{fontSize:".48rem",color:"rgba(255,255,255,0.45)",fontFamily:"'Courier New',monospace",letterSpacing:".08em"}}>LOCKED</span>
    </div>
  );
}

// ─── OPTION CARD ──────────────────────────────────────────────────
function OptionCard({label,tier,locked,active,onClick}:{label:string;tier:Tier;locked:boolean;active:boolean;onClick:()=>void}) {
  const t = TIERS[tier];
  return (
    <button onClick={locked?undefined:onClick} disabled={locked} style={{
      position:"relative",height:76,width:"100%",
      borderRadius:8,overflow:"hidden",cursor:locked?"default":"pointer",
      border:`2px solid ${active?t.color:locked?"rgba(255,255,255,0.05)":"rgba(255,255,255,0.1)"}`,
      background:active?`rgba(${hexToRgb(t.color)},0.15)`:"rgba(255,255,255,0.03)",
      transition:"all 150ms",padding:0,
      boxShadow:active?`0 0 18px ${t.glow},inset 0 0 20px rgba(0,0,0,0.3)`:undefined,
      transform:active?"scale(1.03)":"scale(1)",
    }}>
      <div style={{
        position:"absolute",inset:0,display:"flex",alignItems:"flex-end",
        justifyContent:"center",padding:"0 4px 10px",
      }}>
        <span style={{
          fontSize:".6rem",fontWeight:900,textAlign:"center",lineHeight:1.2,
          color:active?t.color:locked?"rgba(255,255,255,0.22)":"rgba(255,255,255,0.75)",
          fontFamily:"'Courier New',monospace",letterSpacing:".04em",textTransform:"uppercase",
        }}>{label}</span>
      </div>
      <TierBadge tier={tier}/>
      {active&&<div style={{position:"absolute",top:5,right:5,width:7,height:7,borderRadius:"50%",background:t.color,boxShadow:`0 0 8px ${t.color}`,zIndex:2}}/>}
      {locked&&<LockIcon/>}
    </button>
  );
}

// ─── COLOR CARD ───────────────────────────────────────────────────
function ColorCard({hex,label,tier,active,locked,onClick}:{hex:string;label:string;tier:Tier;active:boolean;locked:boolean;onClick:()=>void}) {
  return (
    <button onClick={locked?undefined:onClick} disabled={locked} style={{
      position:"relative",height:58,width:"100%",
      borderRadius:8,overflow:"hidden",cursor:locked?"default":"pointer",
      border:`2px solid ${active?NEON:locked?"rgba(255,255,255,0.05)":"rgba(255,255,255,0.1)"}`,
      background:hex,transition:"all 150ms",padding:0,
      boxShadow:active?`0 0 16px rgba(56,217,245,0.55)`:undefined,
      transform:active?"scale(1.08)":"scale(1)",
      filter:locked?"brightness(0.35) saturate(0.2)":undefined,
    }}>
      <TierBadge tier={tier}/>
      {locked&&<LockIcon/>}
      {active&&(
        <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",zIndex:2}}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
      )}
      <div style={{position:"absolute",bottom:0,left:0,right:0,background:"rgba(0,0,0,0.65)",padding:"2px 0",textAlign:"center",zIndex:1}}>
        <span style={{fontSize:".47rem",color:"rgba(255,255,255,0.9)",fontFamily:"'Courier New',monospace",letterSpacing:".05em",textTransform:"uppercase"}}>{label}</span>
      </div>
    </button>
  );
}

// ─── SKIN PICKER ──────────────────────────────────────────────────
function SkinPicker({value,onChange}:{value:number;onChange:(v:number)=>void}) {
  return (
    <div>
      <div style={{position:"relative",height:32,display:"flex",alignItems:"center",marginBottom:".6rem"}}>
        <div style={{
          position:"absolute",left:0,right:0,height:18,borderRadius:9,
          background:`linear-gradient(to right,${SKIN_TONES.join(",")})`,
          boxShadow:"inset 0 2px 6px rgba(0,0,0,0.6)",border:"1px solid rgba(255,255,255,0.15)",
        }}/>
        <input type="range" min={0} max={SKIN_TONES.length-1} step={1} value={value}
          onChange={e=>onChange(Number(e.target.value))}
          style={{position:"relative",width:"100%",height:18,appearance:"none",background:"transparent",cursor:"pointer",zIndex:1}}/>
      </div>
      <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
        {SKIN_TONES.map((c,i)=>(
          <button key={i} onClick={()=>onChange(i)} style={{
            width:26,height:26,borderRadius:4,background:c,padding:0,cursor:"pointer",
            border:`2.5px solid ${value===i?NEON:"transparent"}`,
            boxShadow:value===i?`0 0 10px rgba(56,217,245,0.65)`:undefined,
            transition:"all 120ms",transform:value===i?"scale(1.2)":"scale(1)",
          }}/>
        ))}
      </div>
    </div>
  );
}

// ─── CATEGORY TAB ─────────────────────────────────────────────────
function CategoryTab({cat,active,onClick}:{cat:CatConfig;active:boolean;onClick:()=>unknown}) {
  return (
    <button onClick={onClick} style={{
      display:"flex",flexDirection:"column",alignItems:"center",gap:".3rem",
      padding:".6rem .5rem",width:"100%",borderRadius:8,cursor:"pointer",
      border:`1.5px solid ${active?ORANGE:"rgba(255,255,255,0.07)"}`,
      background:active?"rgba(228,106,46,0.13)":"rgba(255,255,255,0.02)",
      color:active?ORANGE:"rgba(240,240,255,0.4)",
      transition:"all 150ms",
      boxShadow:active?`0 0 18px rgba(228,106,46,0.28),inset 0 0 20px rgba(228,106,46,0.05)`:undefined,
    }}>
      {cat.icon}
      <span style={{fontSize:".54rem",fontWeight:900,fontFamily:"'Courier New',monospace",letterSpacing:".08em",textTransform:"uppercase"}}>{cat.label}</span>
    </button>
  );
}

// ─── CORNER BRACKETS ──────────────────────────────────────────────
function CornerBracket({pos,color=NEON,size=20}:{pos:"tl"|"tr"|"bl"|"br";color?:string;size?:number}) {
  const style:CSSProperties = {position:"absolute",width:size,height:size,opacity:0.65};
  if(pos==="tl"){style.top=10;style.left=10;style.borderTop=`2px solid ${color}`;style.borderLeft=`2px solid ${color}`;}
  if(pos==="tr"){style.top=10;style.right=10;style.borderTop=`2px solid ${color}`;style.borderRight=`2px solid ${color}`;}
  if(pos==="bl"){style.bottom=10;style.left=10;style.borderBottom=`2px solid ${color}`;style.borderLeft=`2px solid ${color}`;}
  if(pos==="br"){style.bottom=10;style.right=10;style.borderBottom=`2px solid ${color}`;style.borderRight=`2px solid ${color}`;}
  return <div aria-hidden="true" style={style}/>;
}

// ─── SECTION LABEL ────────────────────────────────────────────────
function SectionLabel({children}:{children:ReactNode}) {
  return <div style={{fontSize:".58rem",color:NEON,fontFamily:"'Courier New',monospace",letterSpacing:".12em",marginBottom:".55rem",display:"flex",alignItems:"center",gap:".4rem"}}>
    <div style={{width:3,height:10,background:NEON,borderRadius:2,boxShadow:`0 0 6px ${NEON}`}}/>
    {children}
  </div>;
}

function toggleAcc(state:AvatarState,id:string):string[] {
  const G=["glasses","sunglasses"];
  let n=state.accessories.includes(id)?state.accessories.filter(a=>a!==id):[...state.accessories,id];
  if(G.includes(id)&&!state.accessories.includes(id)) n=n.filter(a=>!G.includes(a)||a===id);
  return n;
}


// ─── MAIN PAGE ────────────────────────────────────────────────────
export default function AvatarPage() {
  const [state,setState]         = useState<AvatarState>(DEFAULTS);
  const [saving,setSaving]       = useState(false);
  const [saved,setSaved]         = useState(false);
  const [loggedIn,setLoggedIn]   = useState<boolean|null>(null);
  const [category,setCategory]   = useState<Category>("BODY");
  const [playerName,setPlayerName] = useState("BOWLER");
  const [editingName,setEditingName] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(()=>{
    (async()=>{
      try{
        const me=await fetch("/api/auth/me",{cache:"no-store"}).then(r=>r.json());
        if(!me?.user?.id){setLoggedIn(false);return;}
        setLoggedIn(true);
        if(me.user.email) setPlayerName(me.user.email.split("@")[0].toUpperCase().slice(0,14));
        const res=await fetch("/api/profile/avatar",{cache:"no-store"});
        const data=await res.json();
        if(data.ok&&data.avatar) setState(prev=>({...prev,...data.avatar}));
      }catch{setLoggedIn(false);}
    })();
  },[]);

  useEffect(()=>{if(editingName&&nameRef.current)nameRef.current.focus();},[editingName]);

  async function saveAvatar(){
    setSaving(true);
    try{
      await fetch("/api/profile/avatar",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({avatar:state})});
      setSaved(true);setTimeout(()=>setSaved(false),2500);
    }catch{}finally{setSaving(false);}
  }

  function set<K extends keyof AvatarState>(key:K,val:AvatarState[K]){setState(prev=>({...prev,[key]:val}));}

  const CATS:CatConfig[] = [
    {id:"BODY",   label:"Body",   icon:<IconBody   s={20} c="currentColor"/>},
    {id:"HAIR",   label:"Hair",   icon:<IconHair   s={20} c="currentColor"/>},
    {id:"FACE",   label:"Face",   icon:<IconFace   s={20} c="currentColor"/>},
    {id:"OUTFIT", label:"Outfit", icon:<IconOutfit s={20} c="currentColor"/>},
    {id:"EXTRAS", label:"Extras", icon:<IconExtras s={20} c="currentColor"/>},
  ];

  const BG_COLORS = ["#e46a2e","#2563eb","#16a34a","#dc2626","#7c3aed","#db2777","#0891b2","#ca8a04","#374151","#1c1c1c"];

  return (
    <main style={{height:"100vh",display:"flex",flexDirection:"column",background:BG,fontFamily:"Montserrat,system-ui",color:TEXT,overflow:"hidden"}}>

      {/* ── AMBIENT FX ── */}
      <div aria-hidden="true" style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0,backgroundImage:"linear-gradient(rgba(255,255,255,0.012) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.012) 1px,transparent 1px)",backgroundSize:"44px 44px"}}/>
      <div aria-hidden="true" style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0,background:"radial-gradient(ellipse 80% 50% at 50% 0%,rgba(56,217,245,0.055),transparent 65%),radial-gradient(ellipse 45% 35% at 10% 60%,rgba(228,106,46,0.06),transparent 60%),radial-gradient(ellipse 45% 50% at 90% 80%,rgba(167,139,250,0.04),transparent 55%)"}}/>
      <div aria-hidden="true" style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0,backgroundImage:"repeating-linear-gradient(0deg,rgba(0,0,0,0.022) 0px,rgba(0,0,0,0.022) 1px,transparent 1px,transparent 4px)"}}/>

      <div style={{position:"relative",zIndex:1,display:"flex",flexDirection:"column",height:"100%"}}>

        {/* ══ TOP BAR ══ */}
        <div style={{display:"flex",alignItems:"center",gap:"1rem",padding:".65rem 1.5rem",borderBottom:"1px solid rgba(56,217,245,0.1)",background:"rgba(8,8,18,0.88)",backdropFilter:"blur(16px)",flexShrink:0}}>

          <Link href="/profile" style={{display:"flex",alignItems:"center",gap:".35rem",color:"rgba(240,240,255,0.38)",textDecoration:"none",fontSize:".7rem",fontFamily:"'Courier New',monospace",letterSpacing:".06em",transition:"color 150ms"}}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            BACK
          </Link>
          <div style={{width:1,height:22,background:"rgba(255,255,255,0.09)"}}/>
          <div style={{display:"flex",alignItems:"center",gap:".45rem"}}>
            <span style={{fontSize:".68rem",color:NEON,fontFamily:"'Courier New',monospace",letterSpacing:".18em",fontWeight:900}}>DUX</span>
            <span style={{fontSize:".68rem",color:"rgba(255,255,255,0.28)",fontFamily:"'Courier New',monospace",letterSpacing:".1em"}}>BOWLING</span>
          </div>
          <div style={{flex:1,textAlign:"center"}}>
            <div style={{fontSize:".72rem",fontWeight:900,letterSpacing:".2em",color:"rgba(240,240,255,0.88)",fontFamily:"'Courier New',monospace"}}>BOWLER IDENTITY</div>
            <div style={{fontSize:".52rem",color:ORANGE,fontFamily:"'Courier New',monospace",letterSpacing:".14em",marginTop:1}}>CUSTOMIZE YOUR CHARACTER</div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:".65rem"}}>
            {!loggedIn&&<span style={{fontSize:".62rem",color:"rgba(240,240,255,0.28)",fontFamily:"'Courier New',monospace"}}>LOG IN TO SAVE</span>}
            {saved&&<span style={{fontSize:".7rem",fontWeight:900,color:"#4ade80",fontFamily:"'Courier New',monospace",letterSpacing:".06em",animation:"savedFlash .4s ease"}}>✓ SAVED</span>}
            <button onClick={saveAvatar} disabled={saving||!loggedIn} style={{display:"flex",alignItems:"center",gap:".45rem",padding:".5rem 1.3rem",borderRadius:6,cursor:saving||!loggedIn?"default":"pointer",background:saving||!loggedIn?"transparent":ORANGE,border:`1.5px solid ${saving||!loggedIn?"rgba(228,106,46,0.28)":ORANGE}`,color:"white",fontWeight:900,fontSize:".72rem",fontFamily:"'Courier New',monospace",letterSpacing:".1em",textTransform:"uppercase",opacity:saving||!loggedIn?0.45:1,boxShadow:saving||!loggedIn?undefined:"0 0 22px rgba(228,106,46,0.55),0 3px 10px rgba(228,106,46,0.3)",transition:"all 150ms"}}>
              {saving
                ?<><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{animation:"spin 1s linear infinite"}}><path d="M21 12a9 9 0 1 1-18 0"/></svg>SAVING</>
                :<><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>SAVE LOADOUT</>
              }
            </button>
          </div>
        </div>

        {/* ══ 3-COLUMN BODY ══ */}
        <div style={{flex:1,display:"grid",gridTemplateColumns:"190px 1fr 310px",overflow:"hidden",minHeight:0}}>

          {/* ── LEFT NAV ── */}
          <div style={{borderRight:"1px solid rgba(56,217,245,0.09)",background:"rgba(6,6,14,0.65)",display:"flex",flexDirection:"column",padding:".85rem .7rem",gap:".45rem",overflowY:"auto"}}>

            {/* Player card */}
            <div style={{background:"rgba(12,12,24,0.85)",border:"1px solid rgba(56,217,245,0.14)",borderRadius:10,padding:".8rem .7rem",marginBottom:".35rem",textAlign:"center",position:"relative",overflow:"hidden"}}>
              <div aria-hidden="true" style={{position:"absolute",inset:0,background:"radial-gradient(ellipse 90% 55% at 50% 0%,rgba(228,106,46,0.11),transparent 70%)"}}/>
              <div style={{position:"relative",zIndex:1}}>
                {/* Mini avatar preview */}
                <div style={{width:56,height:56,borderRadius:"50%",margin:"0 auto .55rem",border:`2px solid ${ORANGE}`,overflow:"hidden",position:"relative",boxShadow:`0 0 18px rgba(228,106,46,0.38)`,background:"rgba(0,0,0,0.5)"}}>
                  <div style={{position:"absolute",top:-28,left:"50%",transform:"translateX(-50%)"}}>
                    <CharacterSVG state={state} w={112} h={210}/>
                  </div>
                </div>
                {editingName
                  ?<input ref={nameRef} value={playerName} onChange={e=>setPlayerName(e.target.value.toUpperCase().slice(0,14))} onBlur={()=>setEditingName(false)} onKeyDown={e=>{if(e.key==="Enter")setEditingName(false);}} style={{background:"rgba(56,217,245,0.1)",border:`1px solid ${NEON}`,borderRadius:4,color:NEON,fontSize:".68rem",fontWeight:900,fontFamily:"'Courier New',monospace",letterSpacing:".08em",textAlign:"center",width:"100%",padding:".2rem .3rem",outline:"none"}}/>
                  :<button onClick={()=>setEditingName(true)} style={{background:"none",border:"none",cursor:"pointer",padding:0,width:"100%"}}>
                    <div style={{fontSize:".72rem",fontWeight:900,color:TEXT,fontFamily:"'Courier New',monospace",letterSpacing:".06em",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{playerName}</div>
                    <div style={{fontSize:".5rem",color:"rgba(240,240,255,0.3)",fontFamily:"'Courier New',monospace",letterSpacing:".08em",marginTop:2}}>TAP TO RENAME ✎</div>
                  </button>
                }
                <div style={{display:"inline-flex",alignItems:"center",gap:4,marginTop:".5rem",background:"rgba(228,106,46,0.13)",border:"1px solid rgba(228,106,46,0.32)",borderRadius:20,padding:"3px 10px"}}>
                  <div style={{width:5,height:5,borderRadius:"50%",background:ORANGE,boxShadow:`0 0 6px ${ORANGE}`}}/>
                  <span style={{fontSize:".54rem",color:ORANGE,fontFamily:"'Courier New',monospace",fontWeight:900,letterSpacing:".1em"}}>ROOKIE</span>
                </div>
              </div>
            </div>

            <div style={{fontSize:".5rem",color:"rgba(240,240,255,0.22)",fontFamily:"'Courier New',monospace",letterSpacing:".14em",padding:"0 .2rem",marginBottom:".1rem"}}>CATEGORIES</div>

            {CATS.map(cat=><CategoryTab key={cat.id} cat={cat} active={category===cat.id} onClick={()=>setCategory(cat.id)}/>)}

            <div style={{height:1,background:"rgba(255,255,255,0.06)",margin:".2rem 0"}}/>

            <button onClick={()=>setState(DEFAULTS)} style={{display:"flex",alignItems:"center",justifyContent:"center",gap:".4rem",padding:".5rem",borderRadius:8,cursor:"pointer",width:"100%",border:"1px solid rgba(255,255,255,0.07)",background:"rgba(255,255,255,0.02)",color:"rgba(240,240,255,0.3)",fontSize:".58rem",fontFamily:"'Courier New',monospace",letterSpacing:".1em",transition:"all 150ms"}}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.32"/></svg>
              RESET
            </button>
          </div>

          {/* ── CENTER STAGE (3D) ── */}
          <div style={{display:"flex",flexDirection:"column",position:"relative",overflow:"hidden",background:"#050510"}}>
            {/* Ambient glow overlay */}
            <div aria-hidden="true" style={{position:"absolute",inset:0,pointerEvents:"none",zIndex:1,background:"radial-gradient(ellipse 60% 30% at 50% 0%,rgba(56,217,245,0.04),transparent 60%),radial-gradient(ellipse 50% 25% at 50% 100%,rgba(228,106,46,0.05),transparent 55%)"}}/>

            {/* 3D Canvas — fills the column */}
            <div style={{flex:1,position:"relative",minHeight:0}}>
              {/* Corner brackets */}
              <CornerBracket pos="tl"/>
              <CornerBracket pos="tr"/>
              <CornerBracket pos="bl"/>
              <CornerBracket pos="br"/>

              {/* HUD top-left */}
              <div style={{position:"absolute",top:14,left:16,fontSize:".52rem",color:"rgba(240,240,255,0.32)",fontFamily:"'Courier New',monospace",letterSpacing:".1em",zIndex:2,pointerEvents:"none"}}>
                LANE 4 · WALKERSVILLE
              </div>

              {/* HUD top-right */}
              <div style={{position:"absolute",top:12,right:14,zIndex:2,pointerEvents:"none",fontSize:".54rem",color:ORANGE,fontFamily:"'Courier New',monospace",letterSpacing:".1em",fontWeight:900,background:"rgba(228,106,46,0.14)",border:"1px solid rgba(228,106,46,0.28)",borderRadius:4,padding:"2px 8px"}}>
                LVL 1
              </div>

              {/* 3D stage */}
              <AvatarStage state={state} />

              {/* Nameplate */}
              <div style={{position:"absolute",bottom:32,left:"50%",transform:"translateX(-50%)",background:"rgba(5,5,15,0.88)",border:"1px solid rgba(56,217,245,0.32)",borderRadius:6,padding:".28rem 1rem",boxShadow:"0 0 18px rgba(56,217,245,0.18)",backdropFilter:"blur(8px)",whiteSpace:"nowrap",zIndex:2,pointerEvents:"none"}}>
                <div style={{display:"flex",alignItems:"center",gap:".45rem"}}>
                  <div style={{width:5,height:5,borderRadius:"50%",background:ORANGE,boxShadow:`0 0 7px ${ORANGE}`}}/>
                  <span style={{fontSize:".6rem",color:"rgba(240,240,255,0.92)",fontFamily:"'Courier New',monospace",letterSpacing:".1em",fontWeight:900}}>{playerName}</span>
                  <div style={{width:1,height:11,background:"rgba(255,255,255,0.18)"}}/>
                  <span style={{fontSize:".56rem",color:NEON,fontFamily:"'Courier New',monospace",letterSpacing:".08em"}}>{OUTFITS.find(o=>o.id===state.outfit)?.label.toUpperCase()??""}</span>
                </div>
              </div>
            </div>

            {/* Loadout summary bar */}
            <div style={{flexShrink:0,display:"flex",alignItems:"center",gap:".5rem",padding:".5rem 1rem",background:"rgba(8,8,18,0.9)",borderTop:"1px solid rgba(255,255,255,0.055)",flexWrap:"wrap",justifyContent:"center",zIndex:2}}>
              {[
                {k:"HAIR",v:HAIR_STYLES_TIERED.find(h=>h.id===state.hairStyle)?.label??state.hairStyle},
                {k:"OUTFIT",v:OUTFITS.find(o=>o.id===state.outfit)?.label??state.outfit},
                ...(state.accessories.length>0?[{k:"EXTRAS",v:`+${state.accessories.length}`}]:[]),
              ].map((item,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:".35rem"}}>
                  {i>0&&<div style={{width:1,height:10,background:"rgba(255,255,255,0.15)"}}/>}
                  <span style={{fontSize:".52rem",color:"rgba(240,240,255,0.35)",fontFamily:"'Courier New',monospace",letterSpacing:".08em"}}>{item.k}</span>
                  <span style={{fontSize:".56rem",color:"rgba(240,240,255,0.78)",fontFamily:"'Courier New',monospace",fontWeight:900,letterSpacing:".04em"}}>{item.v.toUpperCase()}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── RIGHT PANEL ── */}
          <div style={{borderLeft:"1px solid rgba(56,217,245,0.09)",background:"rgba(6,6,14,0.72)",display:"flex",flexDirection:"column",overflow:"hidden"}}>

            {/* Panel header */}
            <div style={{padding:".85rem 1.1rem .55rem",borderBottom:"1px solid rgba(255,255,255,0.055)",flexShrink:0,position:"sticky",top:0,background:"rgba(6,6,14,0.97)",backdropFilter:"blur(14px)",zIndex:2}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:".45rem"}}>
                <div style={{fontSize:".62rem",fontWeight:900,color:ORANGE,fontFamily:"'Courier New',monospace",letterSpacing:".15em"}}>{category} OPTIONS</div>
                <div style={{fontSize:".52rem",color:"rgba(240,240,255,0.28)",fontFamily:"'Courier New',monospace"}}>
                  {category==="BODY"?`${SKIN_TONES.length} TONES`:category==="HAIR"?`${HAIR_STYLES_TIERED.length} STYLES`:category==="FACE"?`${FACE_SHAPES_TIERED.length+FACIAL_HAIR_TIERED.length} OPTIONS`:category==="OUTFIT"?`${OUTFITS_TIERED.length} LOOKS`:`${ACCESSORIES_TIERED.length} ITEMS`}
                </div>
              </div>
              <div style={{display:"flex",gap:3}}>
                {(["common","rare","epic","legendary"] as Tier[]).map(t=>(
                  <div key={t} style={{display:"flex",alignItems:"center",gap:3,background:`rgba(${hexToRgb(TIERS[t].color)},0.07)`,border:`1px solid rgba(${hexToRgb(TIERS[t].color)},0.2)`,borderRadius:4,padding:"1px 5px"}}>
                    <div style={{width:4,height:4,borderRadius:"50%",background:TIERS[t].color}}/>
                    <span style={{fontSize:".42rem",color:TIERS[t].color,fontFamily:"'Courier New',monospace",letterSpacing:".06em",textTransform:"uppercase"}}>{t}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Scrollable content */}
            <div style={{flex:1,padding:".85rem 1.1rem",overflowY:"auto"}}>

              {category==="BODY"&&(<>
                <SectionLabel>SKIN TONE</SectionLabel>
                <SkinPicker value={state.skinToneIdx} onChange={v=>set("skinToneIdx",v)}/>
                <div style={{height:1,background:"rgba(255,255,255,0.055)",margin:"1rem 0"}}/>
                <SectionLabel>FACE SHAPE</SectionLabel>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:".45rem"}}>
                  {FACE_SHAPES_TIERED.map(f=><OptionCard key={f.id} label={f.label} tier={f.tier} locked={f.locked} active={state.faceShape===f.id} onClick={()=>set("faceShape",f.id)}/>)}
                </div>
              </>)}

              {category==="HAIR"&&(<>
                <SectionLabel>STYLE</SectionLabel>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:".45rem",marginBottom:"1rem"}}>
                  {HAIR_STYLES_TIERED.map(h=><OptionCard key={h.id} label={h.label} tier={h.tier} locked={h.locked} active={state.hairStyle===h.id} onClick={()=>set("hairStyle",h.id)}/>)}
                </div>
                <div style={{height:1,background:"rgba(255,255,255,0.055)",margin:"0 0 1rem"}}/>
                <SectionLabel>COLOR</SectionLabel>
                <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:".38rem"}}>
                  {HAIR_COLORS_TIERED.map(h=><ColorCard key={h.id} hex={h.hex} label={h.label} tier={h.tier} locked={h.locked} active={state.hairColor===h.id} onClick={()=>set("hairColor",h.id)}/>)}
                </div>
              </>)}

              {category==="FACE"&&(<>
                <SectionLabel>FACIAL HAIR</SectionLabel>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:".45rem",marginBottom:"1rem"}}>
                  {FACIAL_HAIR_TIERED.map(f=><OptionCard key={f.id} label={f.label} tier={f.tier} locked={f.locked} active={state.facialHair===f.id} onClick={()=>set("facialHair",f.id)}/>)}
                </div>
                <div style={{height:1,background:"rgba(255,255,255,0.055)",margin:"0 0 1rem"}}/>
                <SectionLabel>EYE COLOR</SectionLabel>
                <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:".38rem"}}>
                  {EYE_COLORS_TIERED.map(e=><ColorCard key={e.id} hex={e.hex} label={e.label} tier={e.tier} locked={e.locked} active={state.eyeColor===e.id} onClick={()=>set("eyeColor",e.id)}/>)}
                </div>
              </>)}

              {category==="OUTFIT"&&(<>
                <SectionLabel>OUTFIT</SectionLabel>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:".45rem",marginBottom:"1rem"}}>
                  {OUTFITS_TIERED.map(o=><OptionCard key={o.id} label={o.label} tier={o.tier} locked={o.locked} active={state.outfit===o.id} onClick={()=>{if(!o.locked)set("outfit",o.id);}}/>)}
                </div>
                <div style={{padding:".7rem .85rem",borderRadius:8,background:"rgba(228,106,46,0.07)",border:"1px solid rgba(228,106,46,0.18)"}}>
                  <div style={{fontSize:".56rem",color:ORANGE,fontFamily:"'Courier New',monospace",letterSpacing:".08em",fontWeight:900,marginBottom:3}}>UNLOCK EPIC & LEGENDARY SKINS</div>
                  <div style={{fontSize:".52rem",color:"rgba(240,240,255,0.42)",fontFamily:"'Courier New',monospace",lineHeight:1.55}}>Earn through achievements or visit the Shop to unlock exclusive looks.</div>
                </div>
              </>)}

              {category==="EXTRAS"&&(<>
                <SectionLabel>ACCESSORIES</SectionLabel>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:".45rem",marginBottom:"1rem"}}>
                  {ACCESSORIES_TIERED.map(a=><OptionCard key={a.id} label={a.label} tier={a.tier} locked={a.locked} active={state.accessories.includes(a.id)} onClick={()=>{if(!a.locked)set("accessories",toggleAcc(state,a.id));}}/>)}
                </div>
                <div style={{height:1,background:"rgba(255,255,255,0.055)",margin:"0 0 1rem"}}/>
                <SectionLabel>BACKGROUND COLOR</SectionLabel>
                <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:".35rem"}}>
                  {BG_COLORS.map(c=>(
                    <button key={c} onClick={()=>set("bgColor",c)} style={{paddingBottom:"100%",borderRadius:6,background:c,border:`2px solid ${state.bgColor===c?NEON:"transparent"}`,cursor:"pointer",position:"relative",boxShadow:state.bgColor===c?`0 0 12px rgba(56,217,245,0.5)`:undefined,transform:state.bgColor===c?"scale(1.12)":"scale(1)",transition:"all 120ms"}}/>
                  ))}
                </div>
              </>)}

            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes idleFloat{0%,100%{transform:translateX(-50%) translateY(0);}50%{transform:translateX(-50%) translateY(-11px);}}
        @keyframes spotPulse{0%,100%{opacity:.65;transform:translateX(-50%) scaleX(1);}50%{opacity:1;transform:translateX(-50%) scaleX(1.18);}}
        @keyframes spin{from{transform:rotate(0deg);}to{transform:rotate(360deg);}}
        @keyframes savedFlash{0%{transform:scale(1);}50%{transform:scale(1.12);}100%{transform:scale(1);}}
        input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:22px;height:22px;border-radius:4px;background:#38d9f5;border:none;box-shadow:0 0 10px rgba(56,217,245,0.8);cursor:pointer;}
        input[type=range]::-moz-range-thumb{width:20px;height:20px;border-radius:4px;background:#38d9f5;border:none;box-shadow:0 0 10px rgba(56,217,245,0.8);cursor:pointer;}
        input[type=range]:focus{outline:none;}
        ::-webkit-scrollbar{width:4px;height:4px;}
        ::-webkit-scrollbar-track{background:rgba(0,0,0,0.15);}
        ::-webkit-scrollbar-thumb{background:rgba(56,217,245,0.28);border-radius:2px;}
        ::-webkit-scrollbar-thumb:hover{background:rgba(56,217,245,0.48);}
      `}</style>
    </main>
  );
}
