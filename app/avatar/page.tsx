"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";

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

// ─── Video game UI helpers ─────────────────────────────────────
function Chip({label,active,onClick}:{label:string;active:boolean;onClick:()=>void}) {
  return (
    <button onClick={onClick} style={{
      padding:".38rem .8rem", borderRadius:6,
      border:`1.5px solid ${active?NEON:BORDER}`,
      background:active?"rgba(56,217,245,0.12)":"rgba(255,255,255,0.04)",
      color:active?NEON:MUTED, fontWeight:900, fontSize:".74rem",
      cursor:"pointer", fontFamily:"'Courier New',monospace",
      textTransform:"uppercase", letterSpacing:".06em",
      boxShadow:active?`0 0 10px rgba(56,217,245,0.3)`:undefined,
      transition:"all 120ms",
    }}>{label}</button>
  );
}

function ColorDot({hex,active,onClick,label}:{hex:string;active:boolean;onClick:()=>void;label?:string}) {
  return (
    <button onClick={onClick} title={label} style={{
      width:28,height:28,borderRadius:4,background:hex,
      border:`2.5px solid ${active?NEON:"transparent"}`,
      boxShadow:active?`0 0 10px ${hex},0 0 18px rgba(56,217,245,0.4)`:`0 2px 6px rgba(0,0,0,0.5)`,
      cursor:"pointer",padding:0,transition:"all 120ms",
      transform:active?"scale(1.18)":"scale(1)",
    }}/>
  );
}

function SkinSlider({value,onChange}:{value:number;onChange:(v:number)=>void}) {
  const gradient=`linear-gradient(to right,${SKIN_TONES.join(",")})`;
  return (
    <div>
      <div style={{position:"relative",height:28,display:"flex",alignItems:"center"}}>
        <div style={{position:"absolute",left:0,right:0,height:14,borderRadius:3,background:gradient,boxShadow:"inset 0 2px 4px rgba(0,0,0,0.5)",border:"1px solid rgba(255,255,255,0.1)"}}/>
        <input type="range" min={0} max={SKIN_TONES.length-1} step={1} value={value}
          onChange={e=>onChange(Number(e.target.value))}
          style={{position:"relative",width:"100%",height:14,appearance:"none",background:"transparent",cursor:"pointer",zIndex:1}}/>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:".5rem",marginTop:".35rem"}}>
        <div style={{width:18,height:18,borderRadius:3,background:SKIN_TONES[value],border:"1.5px solid rgba(255,255,255,0.2)"}}/>
        <span style={{fontSize:".68rem",color:MUTED,fontFamily:"'Courier New',monospace",textTransform:"uppercase",letterSpacing:".06em"}}>
          {value<=2?"FAIR":value<=4?"LIGHT":value<=6?"MEDIUM":value<=8?"TAN":value<=10?"DEEP":"RICH"}
        </span>
      </div>
    </div>
  );
}

function Section({title,children}:{title:string;children:React.ReactNode}) {
  return (
    <div style={{marginBottom:"1.1rem"}}>
      <div style={{fontSize:".62rem",fontWeight:900,color:NEON,letterSpacing:".12em",textTransform:"uppercase",marginBottom:".45rem",fontFamily:"'Courier New',monospace",borderLeft:`2px solid ${NEON}`,paddingLeft:".5rem"}}>
        {title}
      </div>
      {children}
    </div>
  );
}

function toggleAcc(state:AvatarState,id:string):string[] {
  const G=["glasses","sunglasses"];
  let n=state.accessories.includes(id)?state.accessories.filter(a=>a!==id):[...state.accessories,id];
  if(G.includes(id)&&!state.accessories.includes(id)) n=n.filter(a=>!G.includes(a)||a===id);
  return n;
}

// ─── MAIN PAGE ────────────────────────────────────────────────
export default function AvatarPage() {
  const [state,setState]     = useState<AvatarState>(DEFAULTS);
  const [saving,setSaving]   = useState(false);
  const [saved,setSaved]     = useState(false);
  const [loggedIn,setLoggedIn] = useState<boolean|null>(null);
  const [activeSection,setActiveSection] = useState("SKIN");

  useEffect(()=>{
    (async()=>{
      try {
        const me=await fetch("/api/auth/me",{cache:"no-store"}).then(r=>r.json());
        if(!me?.user?.id){setLoggedIn(false);return;}
        setLoggedIn(true);
        const res=await fetch("/api/profile/avatar",{cache:"no-store"});
        const data=await res.json();
        if(data.ok&&data.avatar) setState(prev=>({...prev,...data.avatar}));
      } catch{setLoggedIn(false);}
    })();
  },[]);

  async function saveAvatar(){
    setSaving(true);
    try{
      await fetch("/api/profile/avatar",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({avatar:state})});
      setSaved(true); setTimeout(()=>setSaved(false),2500);
    }catch{}finally{setSaving(false);}
  }

  function set<K extends keyof AvatarState>(key:K,val:AvatarState[K]){setState(prev=>({...prev,[key]:val}));}

  const SECTIONS = ["SKIN","FACE","HAIR","EYES","OUTFIT","EXTRAS"];

  return (
    <main style={{minHeight:"100vh",background:BG,fontFamily:"Montserrat,system-ui",color:TEXT,overflow:"hidden"}}>
      {/* Scanline overlay */}
      <div aria-hidden="true" style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0,backgroundImage:"repeating-linear-gradient(0deg,rgba(0,0,0,0.03) 0px,rgba(0,0,0,0.03) 1px,transparent 1px,transparent 3px)",backgroundSize:"100% 3px"}}/>
      {/* Corner glow */}
      <div aria-hidden="true" style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0,background:`radial-gradient(ellipse 60% 40% at 15% 10%, rgba(56,217,245,0.08), transparent 60%), radial-gradient(ellipse 50% 30% at 85% 15%, rgba(245,56,217,0.06), transparent 55%), radial-gradient(ellipse 40% 50% at 50% 100%, rgba(228,106,46,0.1), transparent 60%)`}}/>

      <div style={{position:"relative",zIndex:1,maxWidth:1100,margin:"0 auto",padding:"1rem 1rem 3rem"}}>

        {/* Header bar */}
        <div style={{display:"flex",alignItems:"center",gap:"1rem",marginBottom:"1.25rem",flexWrap:"wrap"}}>
          <Link href="/profile" style={{color:MUTED,fontSize:".78rem",textDecoration:"none",fontFamily:"'Courier New',monospace",letterSpacing:".06em"}}>
            ← PROFILE
          </Link>
          <div style={{flex:1}}>
            <div style={{fontWeight:900,fontSize:"1.1rem",letterSpacing:".04em",color:TEXT}}>
              AVATAR CREATOR
            </div>
            <div style={{fontSize:".68rem",color:NEON,fontFamily:"'Courier New',monospace",letterSpacing:".1em",marginTop:".1rem"}}>
              BUILD YOUR BOWLER IDENTITY
            </div>
          </div>
          <div style={{display:"flex",gap:".6rem",alignItems:"center"}}>
            {!loggedIn&&<span style={{fontSize:".72rem",color:MUTED,fontFamily:"'Courier New',monospace"}}>LOG IN TO SAVE</span>}
            {saved&&<span style={{color:"#4ade80",fontWeight:900,fontSize:".8rem",fontFamily:"'Courier New',monospace",letterSpacing:".06em"}}>✓ SAVED</span>}
            <button onClick={saveAvatar} disabled={saving||!loggedIn} style={{
              padding:".55rem 1.1rem",borderRadius:6,border:`1.5px solid ${ORANGE}`,
              background:saving||!loggedIn?"transparent":ORANGE,color:"#fff",fontWeight:900,fontSize:".78rem",
              cursor:saving||!loggedIn?"default":"pointer",opacity:saving||!loggedIn?0.45:1,
              fontFamily:"'Courier New',monospace",letterSpacing:".08em",textTransform:"uppercase",
              boxShadow:saving||!loggedIn?undefined:`0 0 16px rgba(228,106,46,0.5)`,
            }}>{saving?"SAVING…":"SAVE"}</button>
          </div>
        </div>

        {/* Main layout: scene + controls */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 320px",gap:"1.25rem",alignItems:"start"}}>

          {/* LEFT: scene + character */}
          <div>
            {/* Character stage */}
            <div style={{
              position:"relative",borderRadius:12,overflow:"hidden",
              border:`1px solid rgba(56,217,245,0.2)`,
              boxShadow:`0 0 40px rgba(56,217,245,0.08), inset 0 0 60px rgba(0,0,0,0.5)`,
            }}>
              {/* Alley scene */}
              <div style={{width:"100%"}}>
                <AlleyScene w={520} h={320}/>
              </div>

              {/* Character — overlaid on scene */}
              <div style={{
                position:"absolute",bottom:0,left:"50%",
                transform:"translateX(-50%)",
                filter:"drop-shadow(0 8px 24px rgba(0,0,0,0.7)) drop-shadow(0 0 30px rgba(56,217,245,0.15))",
              }}>
                <CharacterSVG state={state} w={200} h={380}/>
              </div>

              {/* Nameplate overlay */}
              <div style={{
                position:"absolute",bottom:8,left:"50%",transform:"translateX(-50%)",
                background:"rgba(10,10,18,0.85)",border:`1px solid ${NEON}`,
                borderRadius:6,padding:".3rem .9rem",
                boxShadow:`0 0 12px rgba(56,217,245,0.3)`,
                backdropFilter:"blur(4px)",whiteSpace:"nowrap",
              }}>
                <div style={{fontSize:".65rem",color:NEON,fontFamily:"'Courier New',monospace",letterSpacing:".12em",textAlign:"center"}}>
                  BOWLER · {OUTFITS.find(o=>o.id===state.outfit)?.label.toUpperCase()}
                </div>
              </div>

              {/* Corner decorations */}
              {[["0","0","right","bottom"],["0","auto","right","top"],["auto","0","left","bottom"],["auto","auto","left","top"]].map(([b,t,r,l],i)=>(
                <div key={i} aria-hidden="true" style={{
                  position:"absolute",bottom:b==="0"?8:undefined,top:t==="0"?8:undefined,
                  right:r==="right"?8:undefined,left:l==="left"?8:undefined,
                  width:16,height:16,
                  borderTop:t==="0"?`2px solid ${NEON}`:undefined,
                  borderBottom:b==="0"?`2px solid ${NEON}`:undefined,
                  borderRight:r==="right"?`2px solid ${NEON}`:undefined,
                  borderLeft:l==="left"?`2px solid ${NEON}`:undefined,
                  opacity:0.6,
                }}/>
              ))}
            </div>

            {/* Section nav pills */}
            <div style={{display:"flex",gap:".4rem",marginTop:".85rem",flexWrap:"wrap"}}>
              {SECTIONS.map(s=>(
                <button key={s} onClick={()=>setActiveSection(s)} style={{
                  padding:".4rem .85rem",borderRadius:6,
                  border:`1.5px solid ${activeSection===s?ORANGE:BORDER}`,
                  background:activeSection===s?"rgba(228,106,46,0.12)":"rgba(255,255,255,0.03)",
                  color:activeSection===s?ORANGE:MUTED,fontWeight:900,fontSize:".72rem",cursor:"pointer",
                  fontFamily:"'Courier New',monospace",letterSpacing:".08em",
                  boxShadow:activeSection===s?`0 0 10px rgba(228,106,46,0.3)`:undefined,
                  transition:"all 120ms",
                }}>{s}</button>
              ))}
              <button onClick={()=>setState(DEFAULTS)} style={{
                marginLeft:"auto",padding:".4rem .85rem",borderRadius:6,
                border:`1.5px solid ${BORDER}`,background:"rgba(255,255,255,0.03)",
                color:MUTED,fontWeight:900,fontSize:".72rem",cursor:"pointer",
                fontFamily:"'Courier New',monospace",letterSpacing:".08em",
              }}>RESET</button>
            </div>
          </div>

          {/* RIGHT: controls panel */}
          <div style={{
            background:PANEL,border:`1px solid ${BORDER}`,borderRadius:12,padding:"1.1rem",
            boxShadow:"0 8px 32px rgba(0,0,0,0.6)",maxHeight:"90vh",overflowY:"auto",
          }}>
            <div style={{fontSize:".62rem",color:NEON,fontFamily:"'Courier New',monospace",letterSpacing:".12em",marginBottom:"1rem",borderBottom:`1px solid rgba(56,217,245,0.15)`,paddingBottom:".6rem"}}>
              {activeSection} CUSTOMIZATION
            </div>

            {activeSection==="SKIN"&&(
              <>
                <Section title="Skin Tone"><SkinSlider value={state.skinToneIdx} onChange={v=>set("skinToneIdx",v)}/></Section>
                <Section title="Face Shape">
                  <div style={{display:"flex",flexWrap:"wrap",gap:".4rem"}}>
                    {FACE_SHAPES.map(f=><Chip key={f.id} label={f.label} active={state.faceShape===f.id} onClick={()=>set("faceShape",f.id)}/>)}
                  </div>
                </Section>
              </>
            )}
            {activeSection==="FACE"&&(
              <>
                <Section title="Facial Hair">
                  <div style={{display:"flex",flexWrap:"wrap",gap:".4rem"}}>
                    {FACIAL_HAIR_LIST.map(f=><Chip key={f.id} label={f.label} active={state.facialHair===f.id} onClick={()=>set("facialHair",f.id)}/>)}
                  </div>
                </Section>
                <Section title="Eye Color">
                  <div style={{display:"flex",gap:".45rem",flexWrap:"wrap"}}>
                    {EYE_COLORS.map(e=><ColorDot key={e.id} hex={e.hex} active={state.eyeColor===e.id} onClick={()=>set("eyeColor",e.id)}/>)}
                  </div>
                </Section>
              </>
            )}
            {activeSection==="HAIR"&&(
              <>
                <Section title="Style">
                  <div style={{display:"flex",flexWrap:"wrap",gap:".4rem"}}>
                    {HAIR_STYLES.map(h=><Chip key={h.id} label={h.label} active={state.hairStyle===h.id} onClick={()=>set("hairStyle",h.id)}/>)}
                  </div>
                </Section>
                <Section title="Color">
                  <div style={{display:"flex",gap:".45rem",flexWrap:"wrap"}}>
                    {HAIR_COLORS.map(h=><ColorDot key={h.id} hex={h.hex} active={state.hairColor===h.id} onClick={()=>set("hairColor",h.id)} label={h.label}/>)}
                  </div>
                </Section>
              </>
            )}
            {activeSection==="EYES"&&(
              <Section title="Eye Color">
                <div style={{display:"flex",gap:".45rem",flexWrap:"wrap"}}>
                  {EYE_COLORS.map(e=><ColorDot key={e.id} hex={e.hex} active={state.eyeColor===e.id} onClick={()=>set("eyeColor",e.id)}/>)}
                </div>
              </Section>
            )}
            {activeSection==="OUTFIT"&&(
              <Section title="Outfit">
                <div style={{display:"flex",flexWrap:"wrap",gap:".4rem"}}>
                  {OUTFITS.map(o=><Chip key={o.id} label={o.label} active={state.outfit===o.id} onClick={()=>set("outfit",o.id)}/>)}
                </div>
              </Section>
            )}
            {activeSection==="EXTRAS"&&(
              <>
                <Section title="Accessories">
                  <div style={{display:"flex",flexWrap:"wrap",gap:".4rem"}}>
                    {ACCESSORIES_LIST.map(a=><Chip key={a.id} label={a.label} active={state.accessories.includes(a.id)} onClick={()=>set("accessories",toggleAcc(state,a.id))}/>)}
                  </div>
                </Section>
                <Section title="BG Color">
                  <div style={{display:"flex",gap:".45rem",flexWrap:"wrap"}}>
                    {["#e46a2e","#2563eb","#16a34a","#dc2626","#7c3aed","#db2777","#0891b2","#ca8a04","#374151","#1c1c1c"].map(c=><ColorDot key={c} hex={c} active={state.bgColor===c} onClick={()=>set("bgColor",c)}/>)}
                  </div>
                </Section>
              </>
            )}

            {/* Current look summary */}
            <div style={{marginTop:"1.1rem",paddingTop:".8rem",borderTop:`1px solid ${BORDER}`}}>
              <div style={{fontSize:".58rem",color:NEON,fontFamily:"'Courier New',monospace",letterSpacing:".12em",marginBottom:".5rem"}}>CURRENT LOAD-OUT</div>
              {[
                ["HAIR",`${HAIR_STYLES.find(h=>h.id===state.hairStyle)?.label} · ${HAIR_COLORS.find(h=>h.id===state.hairColor)?.label}`],
                ["OUTFIT",OUTFITS.find(o=>o.id===state.outfit)?.label],
                ["FACE",`${FACE_SHAPES.find(f=>f.id===state.faceShape)?.label} · ${EYE_COLORS.find(e=>e.id===state.eyeColor)?.id}`],
                ...(state.accessories.length>0?[["EXTRAS",state.accessories.map(a=>ACCESSORIES_LIST.find(x=>x.id===a)?.label).join(", ")]]:[] as any),
              ].map(([k,v])=>(
                <div key={k} style={{display:"flex",gap:".5rem",fontSize:".68rem",marginBottom:".25rem"}}>
                  <span style={{color:MUTED,fontFamily:"'Courier New',monospace",minWidth:48}}>{k}</span>
                  <span style={{color:TEXT,fontWeight:700}}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:20px;height:20px;border-radius:3px;background:#38d9f5;border:none;box-shadow:0 0 8px rgba(56,217,245,0.7);cursor:pointer;}
        input[type=range]::-moz-range-thumb{width:18px;height:18px;border-radius:3px;background:#38d9f5;border:none;box-shadow:0 0 8px rgba(56,217,245,0.7);cursor:pointer;}
        input[type=range]:focus{outline:none;}
      `}</style>
    </main>
  );
}