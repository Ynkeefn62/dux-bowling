"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

// ── Design tokens ─────────────────────────────────────────────
const ORANGE      = "#e46a2e";
const ORANGE_SOFT = "rgba(228,106,46,0.12)";
const BG          = "#121212";
const PANEL       = "rgba(26,26,26,0.90)";
const BORDER      = "rgba(255,255,255,0.09)";
const TEXT        = "#f2f2f2";
const MUTED       = "rgba(242,242,242,0.60)";
const SHADOW      = "0 18px 45px rgba(0,0,0,0.55)";

// ── Skin tone spectrum (12 stops) ─────────────────────────────
const SKIN_TONES = [
  "#FDDBB4","#F8CDA0","#F0BC8A","#E8A87C",
  "#D4906A","#C07858","#A86040","#8C4A2C",
  "#7A3A20","#5C2810","#3E1808","#2A0E04",
];

// ── Hair colors ───────────────────────────────────────────────
const HAIR_COLORS = [
  { id:"blonde",   hex:"#C8A456", label:"Blonde"   },
  { id:"brown",    hex:"#5C2E18", label:"Brown"    },
  { id:"black",    hex:"#150A04", label:"Black"    },
  { id:"red",      hex:"#7A2010", label:"Red"      },
  { id:"auburn",   hex:"#5A2018", label:"Auburn"   },
  { id:"gray",     hex:"#787878", label:"Gray"     },
  { id:"white",    hex:"#D8D8D0", label:"White"    },
  { id:"platinum", hex:"#C8C8BC", label:"Platinum" },
];

// ── Eye colors ────────────────────────────────────────────────
const EYE_COLORS = [
  { id:"brown", hex:"#4A2C10" },
  { id:"blue",  hex:"#2860A8" },
  { id:"green", hex:"#285830" },
  { id:"hazel", hex:"#6A5030" },
  { id:"gray",  hex:"#607080" },
  { id:"amber", hex:"#906810" },
];

// ── Types ─────────────────────────────────────────────────────
type AvatarState = {
  skinToneIdx:  number;
  hairStyle:    string;
  hairColor:    string;
  eyeColor:     string;
  faceShape:    string;
  facialHair:   string;
  outfit:       string;
  accessories:  string[];
  bgColor:      string;
};

const DEFAULTS: AvatarState = {
  skinToneIdx: 3,
  hairStyle:   "pompadour",
  hairColor:   "brown",
  eyeColor:    "brown",
  faceShape:   "oval",
  facialHair:  "none",
  outfit:      "bowling-shirt",
  accessories: [],
  bgColor:     "#e46a2e",
};

const HAIR_STYLES      = [{id:"pompadour",label:"Pompadour"},{id:"short",label:"Short"},{id:"buzz",label:"Buzz Cut"},{id:"bob",label:"Bob"},{id:"long",label:"Long"},{id:"curly",label:"Curly"},{id:"bun",label:"Bun"},{id:"bald",label:"Bald"}];
const FACE_SHAPES      = [{id:"oval",label:"Oval"},{id:"round",label:"Round"},{id:"square",label:"Square"},{id:"heart",label:"Heart"}];
const FACIAL_HAIR_LIST = [{id:"none",label:"None"},{id:"stubble",label:"Stubble"},{id:"mustache",label:"Mustache"},{id:"beard-short",label:"Short Beard"},{id:"beard-full",label:"Full Beard"}];
const OUTFITS          = [{id:"bowling-shirt",label:"Bowling Shirt"},{id:"letterman",label:"Letterman"},{id:"jersey",label:"Jersey"},{id:"polo",label:"Polo"},{id:"hoodie",label:"Hoodie"}];
const ACCESSORIES_LIST = [{id:"glasses",label:"Glasses"},{id:"sunglasses",label:"Sunglasses"},{id:"hat",label:"Cap"},{id:"headband",label:"Headband"},{id:"earrings",label:"Earrings"}];
const BG_COLORS        = ["#e46a2e","#2563eb","#16a34a","#dc2626","#7c3aed","#db2777","#0891b2","#ca8a04","#374151","#1c1c1c"];

// ── Color helpers ─────────────────────────────────────────────
function hexToRgb(hex: string): [number,number,number] {
  return [parseInt(hex.slice(1,3),16),parseInt(hex.slice(3,5),16),parseInt(hex.slice(5,7),16)];
}
function rgbToHex(r:number,g:number,b:number):string {
  return "#"+[r,g,b].map(v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,"0")).join("");
}
function darken(hex:string,a:number):string { const[r,g,b]=hexToRgb(hex); return rgbToHex(r*(1-a),g*(1-a),b*(1-a)); }
function lighten(hex:string,a:number):string { const[r,g,b]=hexToRgb(hex); return rgbToHex(r+(255-r)*a,g+(255-g)*a,b+(255-b)*a); }
function alpha(hex:string,a:number):string { const[r,g,b]=hexToRgb(hex); return `rgba(${r},${g},${b},${a})`; }

// ── SVG Avatar ────────────────────────────────────────────────
function AvatarSVG({ state, size=300 }: { state: AvatarState; size?: number }) {
  const skin      = SKIN_TONES[state.skinToneIdx];
  const skinD     = darken(skin, 0.22);
  const skinDD    = darken(skin, 0.38);
  const skinL     = lighten(skin, 0.18);
  const skinLL    = lighten(skin, 0.36);
  const hair      = HAIR_COLORS.find(h=>h.id===state.hairColor)?.hex ?? "#5C2E18";
  const hairD     = darken(hair, 0.28);
  const hairL     = lighten(hair, 0.18);
  const eye       = EYE_COLORS.find(e=>e.id===state.eyeColor)?.hex ?? "#4A2C10";

  // Face shape
  const fw = state.faceShape==="square" ? 62 : state.faceShape==="heart" ? 58 : state.faceShape==="round" ? 66 : 60;
  const fh = state.faceShape==="oval" ? 80 : state.faceShape==="square" ? 68 : 72;
  const jaw = state.faceShape==="square" ? 8 : state.faceShape==="heart" ? 22 : state.faceShape==="round" ? 14 : 16;

  const id = (s:string) => `av-${s}-${state.skinToneIdx}-${state.hairColor}-${state.eyeColor}`;

  return (
    <svg viewBox="0 0 320 400" width={size} height={size*400/320} xmlns="http://www.w3.org/2000/svg" style={{display:"block",overflow:"visible"}}>
      <defs>
        {/* Face sphere gradient - key light from top-left */}
        <radialGradient id={id("face")} cx="38%" cy="28%" r="68%" fx="38%" fy="28%">
          <stop offset="0%"   stopColor={skinLL} />
          <stop offset="35%"  stopColor={skin}   />
          <stop offset="75%"  stopColor={skinD}  />
          <stop offset="100%" stopColor={skinDD} />
        </radialGradient>

        {/* Forehead highlight */}
        <radialGradient id={id("fhead")} cx="50%" cy="20%" r="50%">
          <stop offset="0%"  stopColor={skinLL} stopOpacity="0.7" />
          <stop offset="100%" stopColor={skinLL} stopOpacity="0"  />
        </radialGradient>

        {/* Cheek flush */}
        <radialGradient id={id("cheek")} cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor={darken(skin,0.05)} stopOpacity="0.55" />
          <stop offset="100%" stopColor={skin} stopOpacity="0" />
        </radialGradient>

        {/* Neck gradient */}
        <linearGradient id={id("neck")} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor={skinD}  />
          <stop offset="25%"  stopColor={skin}   />
          <stop offset="60%"  stopColor={skinL}  />
          <stop offset="100%" stopColor={skinD}  />
        </linearGradient>

        {/* Hair gradient - volume shading */}
        <radialGradient id={id("hair")} cx="40%" cy="25%" r="70%">
          <stop offset="0%"   stopColor={hairL}  />
          <stop offset="45%"  stopColor={hair}   />
          <stop offset="100%" stopColor={hairD}  />
        </radialGradient>

        {/* Hair shine streak */}
        <linearGradient id={id("hairshine")} x1="20%" y1="0%" x2="50%" y2="60%">
          <stop offset="0%"   stopColor={hairL} stopOpacity="0.7" />
          <stop offset="40%"  stopColor={hairL} stopOpacity="0.2" />
          <stop offset="100%" stopColor={hairL} stopOpacity="0"   />
        </linearGradient>

        {/* Eye iris gradient */}
        <radialGradient id={id("iris")} cx="35%" cy="30%" r="65%">
          <stop offset="0%"   stopColor={lighten(eye,0.35)} />
          <stop offset="50%"  stopColor={eye}               />
          <stop offset="100%" stopColor={darken(eye,0.4)}   />
        </radialGradient>

        {/* Shirt gradient */}
        <linearGradient id={id("shirt")} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor={lighten(shirtCol(state.outfit),0.12)} />
          <stop offset="100%" stopColor={darken(shirtCol(state.outfit),0.18)}  />
        </linearGradient>

        {/* Drop shadow filter */}
        <filter id={id("shadow")} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor="rgba(0,0,0,0.45)" />
        </filter>

        {/* Soft glow for highlights */}
        <filter id={id("glow")} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>

        {/* Skin subsurface scatter on lips */}
        <filter id={id("sss")} x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation="1.5" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* ── BACKGROUND ── */}
      <circle cx="160" cy="200" r="158" fill={state.bgColor} opacity="0.15" />
      <circle cx="160" cy="200" r="158" fill="none" stroke={state.bgColor} strokeWidth="1.5" opacity="0.25" />

      {/* ── BODY ── */}
      <Body outfit={state.outfit} skin={skin} skinD={skinD} gradId={id("shirt")} skinGradId={id("neck")} />

      {/* ── NECK ── */}
      <Neck skin={skin} skinD={skinD} skinL={skinL} gradId={id("neck")} />

      {/* ── BACK HAIR (behind head) ── */}
      {state.hairStyle !== "bald" && state.hairStyle !== "buzz" && state.hairStyle !== "short" && (
        <BackHair style={state.hairStyle} hair={hair} hairD={hairD} gradId={id("hair")} />
      )}

      {/* ── HEAD ── */}
      <Head fw={fw} fh={fh} jaw={jaw} skin={skin} faceGrad={id("face")} fheadGrad={id("fhead")} cheekGrad={id("cheek")} skinD={skinD} skinDD={skinDD} skinL={skinL} />

      {/* ── EARS ── */}
      <Ear side="left"  skin={skin} skinD={skinD} skinL={skinL} />
      <Ear side="right" skin={skin} skinD={skinD} skinL={skinL} />

      {/* ── EYEBROWS ── */}
      <Eyebrow side="left"  hair={hair} hairD={hairD} faceShape={state.faceShape} />
      <Eyebrow side="right" hair={hair} hairD={hairD} faceShape={state.faceShape} />

      {/* ── EYES ── */}
      <Eye side="left"  eyeColor={eye} irisGrad={id("iris")} glowFilter={id("glow")} skin={skin} skinD={skinD} />
      <Eye side="right" eyeColor={eye} irisGrad={id("iris")} glowFilter={id("glow")} skin={skin} skinD={skinD} />

      {/* ── NOSE ── */}
      <Nose skin={skin} skinD={skinD} skinL={skinL} />

      {/* ── MOUTH ── */}
      <Mouth skin={skin} skinD={skinD} skinL={skinL} sssFilter={id("sss")} />

      {/* ── FRONT HAIR ── */}
      {state.hairStyle !== "bald" && (
        <FrontHair style={state.hairStyle} hair={hair} hairD={hairD} hairL={hairL} gradId={id("hair")} shineId={id("hairshine")} />
      )}

      {/* ── FACIAL HAIR ── */}
      {state.facialHair !== "none" && (
        <FacialHair style={state.facialHair} hair={hair} hairD={hairD} skin={skin} />
      )}

      {/* ── ACCESSORIES ── */}
      {state.accessories.includes("glasses")    && <Glasses />}
      {state.accessories.includes("sunglasses") && <Sunglasses />}
      {state.accessories.includes("hat")        && <Hat hair={hair} hairD={hairD} />}
      {state.accessories.includes("headband")   && <Headband />}
      {state.accessories.includes("earrings")   && <Earrings />}
    </svg>
  );
}

function shirtCol(outfit: string): string {
  if (outfit==="bowling-shirt") return "#B83418";
  if (outfit==="letterman")     return "#18388A";
  if (outfit==="jersey")        return "#186030";
  if (outfit==="polo")          return "#284888";
  return "#282838";
}

// ── HEAD ─────────────────────────────────────────────────────
function Head({fw,fh,jaw,skin,faceGrad,fheadGrad,cheekGrad,skinD,skinDD,skinL}: {
  fw:number;fh:number;jaw:number;skin:string;faceGrad:string;fheadGrad:string;cheekGrad:string;
  skinD:string;skinDD:string;skinL:string;
}) {
  const cx=160, cy=175;
  // Jaw path: face narrows toward chin with jaw variation
  const jawW = fw - jaw;
  return (
    <g>
      {/* Main face shape — organic path instead of plain ellipse */}
      <path
        d={`M${cx-fw},${cy-10}
            C${cx-fw},${cy-fh} ${cx-fw+8},${cy-fh-8} ${cx},${cy-fh}
            C${cx+fw-8},${cy-fh-8} ${cx+fw},${cy-fh} ${cx+fw},${cy-10}
            C${cx+fw},${cy+30} ${cx+jawW+4},${cy+fh-10} ${cx+4},${cy+fh+4}
            C${cx-4},${cy+fh+8} ${cx-jawW-4},${cy+fh-10} ${cx-fw},${cy+30}
            Z`}
        fill={`url(#${faceGrad})`}
      />

      {/* Forehead highlight — makes face look lit from above */}
      <ellipse cx={cx-8} cy={cy-fh+22} rx={fw*0.52} ry={fh*0.32}
        fill={`url(#${fheadGrad})`} />

      {/* Cheek rosy glow — left */}
      <ellipse cx={cx-fw+20} cy={cy+16} rx="22" ry="14"
        fill={`url(#${cheekGrad})`} />
      {/* Cheek rosy glow — right */}
      <ellipse cx={cx+fw-20} cy={cy+16} rx="22" ry="14"
        fill={`url(#${cheekGrad})`} />

      {/* Temple shadow */}
      <path
        d={`M${cx-fw+2},${cy-15} C${cx-fw-4},${cy} ${cx-fw},${cy+20} ${cx-fw+8},${cy+35}`}
        stroke={skinDD} strokeWidth="6" fill="none" opacity="0.18" strokeLinecap="round" />
      <path
        d={`M${cx+fw-2},${cy-15} C${cx+fw+4},${cy} ${cx+fw},${cy+20} ${cx+fw-8},${cy+35}`}
        stroke={skinDD} strokeWidth="6" fill="none" opacity="0.18" strokeLinecap="round" />

      {/* Chin light (subsurface) */}
      <ellipse cx={cx} cy={cy+fh-4} rx="18" ry="7"
        fill={skinL} opacity="0.25" />
    </g>
  );
}

// ── NECK ─────────────────────────────────────────────────────
function Neck({skin,skinD,skinL,gradId}: {skin:string;skinD:string;skinL:string;gradId:string}) {
  return (
    <g>
      {/* Neck body */}
      <path d="M140,250 C138,262 136,272 138,288 L182,288 C184,272 182,262 180,250 Z"
        fill={`url(#${gradId})`} />
      {/* Sternocleidomastoid muscle shadows */}
      <path d="M148,252 C146,265 145,278 146,288"
        stroke={skinD} strokeWidth="3" fill="none" opacity="0.22" strokeLinecap="round" />
      <path d="M172,252 C174,265 175,278 174,288"
        stroke={skinD} strokeWidth="3" fill="none" opacity="0.22" strokeLinecap="round" />
      {/* Throat center highlight */}
      <path d="M160,255 C160,268 160,280 160,288"
        stroke={skinL} strokeWidth="4" fill="none" opacity="0.2" strokeLinecap="round" />
      {/* Adam's apple hint */}
      <ellipse cx="160" cy="266" rx="5" ry="3.5"
        fill="none" stroke={skinD} strokeWidth="1.2" opacity="0.22" />
    </g>
  );
}

// ── EAR ──────────────────────────────────────────────────────
function Ear({side,skin,skinD,skinL}: {side:"left"|"right";skin:string;skinD:string;skinL:string}) {
  const x = side==="left" ? 94 : 226;
  const flip = side==="left" ? 1 : -1;
  const cx = side==="left" ? 160 : 160;
  return (
    <g>
      {/* Outer ear */}
      <ellipse cx={x} cy={176} rx={11} ry={16}
        fill={skin} stroke={skinD} strokeWidth="0.8" opacity={1} />
      {/* Ear canal shadow */}
      <ellipse cx={x+flip*2} cy={176} rx={5} ry={9}
        fill={skinD} opacity="0.3" />
      {/* Helix highlight */}
      <path
        d={side==="left"
          ? `M${x-6},162 C${x-9},168 ${x-10},182 ${x-6},190`
          : `M${x+6},162 C${x+9},168 ${x+10},182 ${x+6},190`}
        stroke={skinL} strokeWidth="2.5" fill="none" opacity="0.45" strokeLinecap="round" />
      {/* Earlobe */}
      <ellipse cx={x} cy={190} rx={7} ry={5}
        fill={skin} />
    </g>
  );
}

// ── EYEBROW ───────────────────────────────────────────────────
function Eyebrow({side,hair,hairD,faceShape}: {side:"left"|"right";hair:string;hairD:string;faceShape:string}) {
  const cx = side==="left" ? 138 : 182;
  const arch = faceShape==="round" ? 4 : faceShape==="heart" ? 6 : 3;
  const flip = side==="left" ? -1 : 1;
  // Tapered brow: thick medial end, thin lateral end
  return (
    <g>
      {/* Main brow shape — filled path, not just a stroke */}
      <path
        d={`M${cx-14},${156+arch} C${cx-8},${150-arch} ${cx+2},${149-arch} ${cx+14},${154+arch}
            C${cx+10},${156+arch} ${cx+2},${152-arch} ${cx-8},${156+arch} Z`}
        fill={hair} opacity="0.92"
      />
      {/* Inner brow highlight */}
      <path
        d={`M${cx-12},${155+arch} C${cx-6},${151-arch} ${cx},${150-arch} ${cx+8},${153+arch}`}
        stroke={lighten(hair,0.3)} strokeWidth="1" fill="none" opacity="0.35" strokeLinecap="round"
      />
    </g>
  );
}

function lighten(hex:string,a:number):string { const[r,g,b]=hexToRgb(hex); return rgbToHex(r+(255-r)*a,g+(255-g)*a,b+(255-b)*a); }

// ── EYE ──────────────────────────────────────────────────────
function Eye({side,eyeColor,irisGrad,glowFilter,skin,skinD}: {
  side:"left"|"right"; eyeColor:string; irisGrad:string; glowFilter:string; skin:string; skinD:string;
}) {
  const cx = side==="left" ? 138 : 182;
  const cy = 172;
  return (
    <g>
      {/* Upper lid shadow (creates depth in eye socket) */}
      <ellipse cx={cx} cy={cy-2} rx="16" ry="11"
        fill={darken(skin,0.28)} opacity="0.35" />

      {/* Sclera (white of eye) — slightly cream, not pure white */}
      <path d={`M${cx-13},${cy} C${cx-13},${cy-9} ${cx+13},${cy-9} ${cx+13},${cy}
                C${cx+13},${cy+7} ${cx-13},${cy+7} ${cx-13},${cy} Z`}
        fill="#F5EFE4" />

      {/* Iris */}
      <clipPath id={`clip-eye-${side}`}>
        <path d={`M${cx-13},${cy} C${cx-13},${cy-9} ${cx+13},${cy-9} ${cx+13},${cy}
                  C${cx+13},${cy+7} ${cx-13},${cy+7} ${cx-13},${cy} Z`} />
      </clipPath>
      <circle cx={cx} cy={cy+1} r="9"
        fill={`url(#${irisGrad})`}
        clipPath={`url(#clip-eye-${side})`} />

      {/* Iris texture rings */}
      <circle cx={cx} cy={cy+1} r="9"
        fill="none" stroke={darken(eyeColor,0.3)} strokeWidth="1.5"
        strokeDasharray="2 2.5" opacity="0.35"
        clipPath={`url(#clip-eye-${side})`} />

      {/* Limbal ring */}
      <circle cx={cx} cy={cy+1} r="9"
        fill="none" stroke={darken(eyeColor,0.6)} strokeWidth="1.2"
        opacity="0.6"
        clipPath={`url(#clip-eye-${side})`} />

      {/* Pupil */}
      <circle cx={cx} cy={cy+1} r="4.5"
        fill="#0C0805"
        clipPath={`url(#clip-eye-${side})`} />

      {/* Corneal highlight — large diffuse */}
      <ellipse cx={cx+3} cy={cy-3} rx="4" ry="3"
        fill="white" opacity="0.18"
        clipPath={`url(#clip-eye-${side})`} />
      {/* Specular point */}
      <circle cx={cx+4} cy={cy-4} r="1.8"
        fill="white" opacity="0.92"
        clipPath={`url(#clip-eye-${side})`} />
      {/* Secondary catch light */}
      <circle cx={cx-3} cy={cy+3} r="1.1"
        fill="white" opacity="0.35"
        clipPath={`url(#clip-eye-${side})`} />

      {/* Upper eyelid crease */}
      <path d={`M${cx-13},${cy} C${cx-6},${cy-13} ${cx+6},${cy-13} ${cx+13},${cy}`}
        stroke={darken(skin,0.35)} strokeWidth="1.5" fill="none" opacity="0.6"
        strokeLinecap="round" />

      {/* Lash line upper — thick, tapered */}
      <path d={`M${cx-13},${cy-1} C${cx-6},${cy-12} ${cx+5},${cy-12} ${cx+13},${cy-2}`}
        stroke="#0C0805" strokeWidth="2.2" fill="none" opacity="0.9"
        strokeLinecap="round" />

      {/* Individual upper lashes */}
      {[-10,-6,-1,4,9].map((dx,i)=>{
        const lx = cx+dx;
        const ly = cy-10;
        const angle = (dx/13)*0.5;
        const ex = lx + Math.sin(angle)*4;
        const ey = ly - Math.cos(angle)*5 - (i===2?2:0);
        return <line key={i} x1={lx} y1={ly} x2={ex} y2={ey}
          stroke="#0C0805" strokeWidth={i===2?"1.8":"1.4"} opacity="0.75" strokeLinecap="round" />;
      })}

      {/* Lower lash line */}
      <path d={`M${cx-11},${cy+6} C${cx},${cy+10} ${cx+11},${cy+6}`}
        stroke={darken(skin,0.45)} strokeWidth="1" fill="none" opacity="0.4"
        strokeLinecap="round" />

      {/* Tear duct */}
      <circle cx={side==="left" ? cx-12 : cx+12} cy={cy+1} r="2"
        fill={lighten(skin,0.15)} opacity="0.6" />
    </g>
  );
}

// ── NOSE ─────────────────────────────────────────────────────
function Nose({skin,skinD,skinL}: {skin:string;skinD:string;skinL:string}) {
  return (
    <g>
      {/* Bridge highlight */}
      <path d="M157,152 C156,165 154,180 152,195"
        stroke={skinL} strokeWidth="2.5" fill="none" opacity="0.4" strokeLinecap="round" />

      {/* Bridge shadow left */}
      <path d="M153,155 C150,170 148,185 147,198"
        stroke={skinD} strokeWidth="2" fill="none" opacity="0.22" strokeLinecap="round" />

      {/* Nose tip — organic shape */}
      <path d="M147,198 C144,200 143,207 148,210 C152,213 168,213 172,210 C177,207 176,200 173,198 C169,203 151,203 147,198 Z"
        fill={skinD} opacity="0.28" />

      {/* Tip highlight */}
      <ellipse cx="160" cy="204" rx="7" ry="4.5"
        fill={skinL} opacity="0.32" />

      {/* Left nostril */}
      <path d="M148,208 C145,210 144,214 148,215 C152,216 154,212 153,209 Z"
        fill={skinD} opacity="0.45" />
      {/* Right nostril */}
      <path d="M172,208 C175,210 176,214 172,215 C168,216 166,212 167,209 Z"
        fill={skinD} opacity="0.45" />

      {/* Nostril highlight */}
      <circle cx="149" cy="210" r="1.5" fill={skinL} opacity="0.3" />
      <circle cx="171" cy="210" r="1.5" fill={skinL} opacity="0.3" />

      {/* Alar crease */}
      <path d="M148,200 C147,205 148,210 149,213"
        stroke={skinD} strokeWidth="1.2" fill="none" opacity="0.3" strokeLinecap="round" />
      <path d="M172,200 C173,205 172,210 171,213"
        stroke={skinD} strokeWidth="1.2" fill="none" opacity="0.3" strokeLinecap="round" />
    </g>
  );
}

// ── MOUTH ─────────────────────────────────────────────────────
function Mouth({skin,skinD,skinL,sssFilter}: {skin:string;skinD:string;skinL:string;sssFilter:string}) {
  // Lip colors derived from skin
  const lipBase  = darken(skin,0.28);
  const lipLight = lighten(lipBase,0.22);
  const lipDark  = darken(lipBase,0.25);
  return (
    <g filter={`url(#${sssFilter})`}>
      {/* Mouth corner shadows */}
      <circle cx="142" cy="229" r="3" fill={skinD} opacity="0.3" />
      <circle cx="178" cy="229" r="3" fill={skinD} opacity="0.3" />

      {/* Philtrum groove */}
      <path d="M155,218 C156,222 156,225 157,228"
        stroke={skinD} strokeWidth="1.5" fill="none" opacity="0.28" strokeLinecap="round" />
      <path d="M165,218 C164,222 164,225 163,228"
        stroke={skinD} strokeWidth="1.5" fill="none" opacity="0.28" strokeLinecap="round" />

      {/* Upper lip — Cupid's bow shape */}
      <path d="M142,229 C148,224 153,221 160,224 C167,221 172,224 178,229 C172,232 165,231 160,231 C155,231 148,232 142,229 Z"
        fill={lipBase} />
      {/* Upper lip highlight along cupid's bow */}
      <path d="M150,225 C154,222 160,224 166,222 C169,223 172,225"
        stroke={lipLight} strokeWidth="1.2" fill="none" opacity="0.5" strokeLinecap="round" />

      {/* Lower lip — fuller, rounder */}
      <path d="M142,230 C148,238 155,241 160,240 C165,241 172,238 178,230 C172,232 165,233 160,233 C155,233 148,232 142,230 Z"
        fill={lighten(lipBase,0.08)} />
      {/* Lower lip volume highlight */}
      <ellipse cx="160" cy="236" rx="12" ry="4"
        fill={lipLight} opacity="0.38" />
      {/* Lower lip center shine */}
      <ellipse cx="160" cy="234" rx="6" ry="2.5"
        fill={lipLight} opacity="0.55" />

      {/* Lip line / philtrum base */}
      <path d="M142,229 C151,229 155,228 160,229 C165,228 169,229 178,229"
        stroke={lipDark} strokeWidth="1" fill="none" opacity="0.6" />

      {/* Mouth corner creases */}
      <path d="M142,229 C140,231 140,234 143,235"
        stroke={skinD} strokeWidth="1" fill="none" opacity="0.35" strokeLinecap="round" />
      <path d="M178,229 C180,231 180,234 177,235"
        stroke={skinD} strokeWidth="1" fill="none" opacity="0.35" strokeLinecap="round" />
    </g>
  );
}

// ── BACK HAIR ────────────────────────────────────────────────
function BackHair({style,hair,hairD,gradId}: {style:string;hair:string;hairD:string;gradId:string}) {
  if (style==="long") return (
    <g>
      <path d="M98,130 C88,180 88,260 98,320 L128,340 C118,280 114,200 118,150 Z"
        fill={`url(#${gradId})`} opacity="0.9" />
      <path d="M222,130 C232,180 232,260 222,320 L192,340 C202,280 206,200 202,150 Z"
        fill={`url(#${gradId})`} opacity="0.9" />
      <ellipse cx="160" cy="300" rx="65" ry="60" fill={hairD} opacity="0.7" />
    </g>
  );
  if (style==="bob") return (
    <g>
      <path d="M96,160 C92,190 94,230 102,258 C120,262 140,264 160,264 C180,264 200,262 218,258 C226,230 228,190 224,160 Z"
        fill={`url(#${gradId})`} opacity="0.95" />
    </g>
  );
  if (style==="curly") return (
    <g>
      {[
        [100,200,28],[85,240,22],[98,280,24],[225,200,28],[240,240,22],[222,280,24],
        [130,300,26],[160,310,28],[190,300,26],
      ].map(([cx,cy,r],i)=>(
        <circle key={i} cx={cx} cy={cy} r={r} fill={i%2===0?hair:hairD} opacity="0.85" />
      ))}
    </g>
  );
  if (style==="bun") return (
    <circle cx="160" cy="108" r="26" fill={`url(#${gradId})`} />
  );
  return null;
}

// ── FRONT HAIR ────────────────────────────────────────────────
function FrontHair({style,hair,hairD,hairL,gradId,shineId}: {
  style:string;hair:string;hairD:string;hairL:string;gradId:string;shineId:string;
}) {
  if (style==="bald") return null;

  if (style==="pompadour") return (
    <g>
      {/* Volume mass */}
      <path d="M100,145 C102,115 115,95 160,88 C205,95 218,115 220,145 C205,125 185,118 160,116 C135,118 115,125 100,145 Z"
        fill={`url(#${gradId})`} />
      {/* Pompadour sweep */}
      <path d="M108,138 C118,108 138,96 160,94 C182,96 202,108 212,138 C196,118 180,110 160,108 C140,110 124,118 108,138 Z"
        fill={hairD} opacity="0.55" />
      {/* Shine streak */}
      <path d="M125,120 C138,102 152,96 165,98"
        stroke={`url(#${shineId})`} strokeWidth="8" fill="none" opacity="0.6"
        strokeLinecap="round" />
      {/* Strand lines */}
      {[130,142,155,168,180].map((x,i)=>(
        <path key={i} d={`M${x},138 C${x-2},120 ${x+2},105 ${x+4},96`}
          stroke={hairD} strokeWidth="1.2" fill="none" opacity="0.25" strokeLinecap="round" />
      ))}
      {/* Hairline */}
      <path d="M100,145 C110,148 135,150 160,150 C185,150 210,148 220,145"
        stroke={hairD} strokeWidth="2" fill="none" opacity="0.4" />
    </g>
  );

  if (style==="short") return (
    <g>
      <path d="M100,150 C104,118 120,100 160,96 C200,100 216,118 220,150 C204,132 185,124 160,122 C135,124 116,132 100,150 Z"
        fill={`url(#${gradId})`} />
      <path d="M118,138 C128,118 142,110 160,108 C178,110 192,118 202,138"
        fill={hairD} opacity="0.4" />
      {/* Hairline definition */}
      <path d="M100,150 C118,155 140,158 160,158 C180,158 202,155 220,150"
        stroke={hairD} strokeWidth="2" fill="none" opacity="0.5" />
      {/* Side part */}
      <path d="M148,150 C146,138 146,124 148,108"
        stroke={hairL} strokeWidth="2" fill="none" opacity="0.35" strokeLinecap="round" />
      {/* Strands */}
      {[115,130,150,170,185,200].map((x,i)=>(
        <path key={i} d={`M${x},150 C${x},136 ${x+2},118 ${x+3},106`}
          stroke={hairD} strokeWidth="1" fill="none" opacity="0.2" strokeLinecap="round" />
      ))}
    </g>
  );

  if (style==="buzz") return (
    <g>
      {/* Dense stipple texture */}
      <path d="M100,152 C104,122 122,104 160,100 C198,104 216,122 220,152 C202,138 185,132 160,130 C135,132 118,138 100,152 Z"
        fill={hair} opacity="0.8" />
      {[112,124,136,148,160,172,184,196,208].map((x,i)=>
        [126,134,142,150].map((y,j)=>(
          <circle key={`${i}-${j}`} cx={x+(i%2)*3} cy={y+(j%2)*2}
            r="1.4" fill={hairD} opacity="0.45" />
        ))
      )}
      <path d="M100,152 C118,158 140,162 160,162 C180,162 202,158 220,152"
        stroke={hairD} strokeWidth="2.5" fill="none" opacity="0.5" />
    </g>
  );

  if (style==="bob") return (
    <g>
      <path d="M96,160 C100,128 118,106 160,102 C202,106 220,128 224,160 C208,140 188,132 160,130 C132,132 112,140 96,160 Z"
        fill={`url(#${gradId})`} />
      {/* Blunt cut line */}
      <path d="M96,160 C108,165 134,168 160,168 C186,168 212,165 224,160"
        stroke={hairD} strokeWidth="3" fill="none" opacity="0.55" />
      {/* Shine */}
      <path d="M120,128 C138,112 152,106 168,110"
        stroke={`url(#${shineId})`} strokeWidth="10" fill="none" opacity="0.5"
        strokeLinecap="round" />
    </g>
  );

  if (style==="long") return (
    <g>
      <path d="M100,148 C104,115 120,96 160,92 C200,96 216,115 220,148 C204,128 186,120 160,118 C134,120 116,128 100,148 Z"
        fill={`url(#${gradId})`} />
      {/* Center part */}
      <path d="M160,92 L160,148"
        stroke={hairD} strokeWidth="1.5" fill="none" opacity="0.4" />
      {/* Shine */}
      <path d="M118,122 C135,105 152,96 168,100"
        stroke={`url(#${shineId})`} strokeWidth="10" fill="none" opacity="0.45"
        strokeLinecap="round" />
    </g>
  );

  if (style==="curly") return (
    <g>
      {[
        [115,125,20],[138,110,22],[162,108,22],[185,118,20],
        [108,145,18],[130,138,18],[155,133,18],[180,136,18],[202,142,18],
      ].map(([cx,cy,r],i)=>(
        <circle key={i} cx={cx} cy={cy} r={r}
          fill={i%3===0?hair:i%3===1?hairD:lighten(hair,0.08)}
          opacity={0.88+i*0.01} />
      ))}
      {/* Curl highlights */}
      {[[118,118],[140,105],[165,103],[186,112]].map(([cx,cy],i)=>(
        <circle key={i} cx={cx} cy={cy} r="6"
          fill={hairL} opacity="0.22" />
      ))}
    </g>
  );

  if (style==="bun") return (
    <g>
      {/* Base hair pulled back */}
      <path d="M102,148 C106,120 122,105 160,102 C198,105 214,120 218,148 C200,132 182,125 160,123 C138,125 120,132 102,148 Z"
        fill={`url(#${gradId})`} />
      {/* Bun */}
      <circle cx="160" cy="108" r="24" fill={`url(#${gradId})`} />
      {/* Bun depth */}
      <circle cx="160" cy="108" r="18" fill={hairD} opacity="0.3" />
      {/* Bun shine */}
      <ellipse cx="152" cy="100" rx="8" ry="5"
        fill={hairL} opacity="0.35" transform="rotate(-25,152,100)" />
      {/* Hair tie */}
      <ellipse cx="160" cy="124" rx="20" ry="5"
        fill={hairD} opacity="0.7" />
      {/* Pulled-back strands */}
      {[130,145,175,190].map((x,i)=>(
        <path key={i} d={`M${x},148 C${x+3},130 ${x+5},115 ${x+8},110`}
          stroke={hairD} strokeWidth="1.5" fill="none" opacity="0.3" strokeLinecap="round" />
      ))}
    </g>
  );

  return null;
}

function lighten2(hex:string,a:number):string { const[r,g,b]=hexToRgb(hex); return rgbToHex(r+(255-r)*a,g+(255-g)*a,b+(255-b)*a); }

// ── FACIAL HAIR ───────────────────────────────────────────────
function FacialHair({style,hair,hairD,skin}: {style:string;hair:string;hairD:string;skin:string}) {
  if (style==="stubble") return (
    <g opacity="0.6">
      {/* Stubble dots — more realistic scatter pattern */}
      {[
        [140,228],[145,232],[150,234],[155,232],[160,233],[165,232],[170,234],[175,232],[180,228],
        [138,224],[143,227],[148,229],[153,228],[162,228],[167,229],[172,227],[177,224],
        [142,236],[148,238],[154,237],[166,237],[172,238],[178,236],
        [145,240],[152,241],[158,240],[162,240],[168,241],[175,240],
      ].map(([cx,cy],i)=>(
        <circle key={i} cx={cx+(Math.random()*2-1)} cy={cy+(Math.random()*1.5-0.75)}
          r={0.9+Math.random()*0.8} fill={hair} opacity={0.5+Math.random()*0.4} />
      ))}
    </g>
  );

  if (style==="mustache") return (
    <g>
      {/* Mustache with volume */}
      <path d="M144,222 C148,216 154,213 160,215 C166,213 172,216 176,222 C172,225 166,224 160,224 C154,224 148,225 144,222 Z"
        fill={hair} />
      <path d="M146,218 C152,214 157,213 160,215"
        stroke={lighten2(hair,0.25)} strokeWidth="1.5" fill="none" opacity="0.45" strokeLinecap="round" />
      <path d="M174,218 C168,214 163,213 160,215"
        stroke={lighten2(hair,0.25)} strokeWidth="1.5" fill="none" opacity="0.45" strokeLinecap="round" />
    </g>
  );

  if (style==="beard-short") return (
    <g>
      {/* Mustache */}
      <path d="M144,222 C148,216 154,213 160,215 C166,213 172,216 176,222 C172,225 165,224 160,224 C155,224 148,225 144,222 Z"
        fill={hair} />
      {/* Beard body */}
      <path d="M132,226 C130,238 132,250 140,257 C148,262 172,262 180,257 C188,250 190,238 188,226 C180,236 168,240 160,240 C152,240 140,236 132,226 Z"
        fill={hair} opacity="0.88" />
      {/* Beard highlight */}
      <path d="M152,228 C155,238 158,243 160,244"
        stroke={lighten2(hair,0.25)} strokeWidth="2.5" fill="none" opacity="0.3" strokeLinecap="round" />
      {/* Beard outline strands */}
      {[138,148,160,172,182].map((x,i)=>(
        <path key={i} d={`M${x},${240+i} C${x},${250+i} ${x+2},${258} ${x+2},${260}`}
          stroke={hairD} strokeWidth="1.2" fill="none" opacity="0.2" strokeLinecap="round" />
      ))}
    </g>
  );

  if (style==="beard-full") return (
    <g>
      {/* Mustache */}
      <path d="M142,221 C147,214 154,211 160,213 C166,211 173,214 178,221 C172,225 165,223 160,223 C155,223 148,225 142,221 Z"
        fill={hair} />
      {/* Full beard */}
      <path d="M125,222 C122,242 124,262 136,272 C146,278 174,278 184,272 C196,262 198,242 195,222 C185,242 172,248 160,248 C148,248 135,242 125,222 Z"
        fill={hair} opacity="0.9" />
      {/* Beard volume / shading */}
      <path d="M126,224 C124,244 130,262 140,270"
        stroke={hairD} strokeWidth="4" fill="none" opacity="0.3" strokeLinecap="round" />
      <path d="M194,224 C196,244 190,262 180,270"
        stroke={hairD} strokeWidth="4" fill="none" opacity="0.3" strokeLinecap="round" />
      {/* Center highlight */}
      <path d="M157,228 C158,242 159,252 160,256"
        stroke={lighten2(hair,0.28)} strokeWidth="3" fill="none" opacity="0.32" strokeLinecap="round" />
      {/* Strand texture */}
      {[130,140,152,168,180,190].map((x,i)=>(
        <path key={i} d={`M${x},${235+i*2} C${x+1},${250+i} ${x+1},${264} ${x+2},${270}`}
          stroke={hairD} strokeWidth="1.3" fill="none" opacity="0.18" strokeLinecap="round" />
      ))}
    </g>
  );

  return null;
}

// ── BODY ─────────────────────────────────────────────────────
function Body({outfit,skin,skinD,gradId,skinGradId}: {outfit:string;skin:string;skinD:string;gradId:string;skinGradId:string}) {
  const shirt   = shirtCol(outfit);
  const shirtL  = lighten2(shirt,0.18);
  const shirtD  = darken(shirt,0.22);
  const accent  = outfit==="letterman"?"#C8A020":outfit==="bowling-shirt"?"#F0E0A0":"#ffffff";

  return (
    <g>
      {/* Shoulder mass */}
      <path d="M60,295 C60,268 78,252 105,248 L135,252 C128,268 124,282 124,295 Z"
        fill={gradId ? `url(#${gradId})` : shirt} />
      <path d="M260,295 C260,268 242,252 215,248 L185,252 C192,268 196,282 196,295 Z"
        fill={gradId ? `url(#${gradId})` : shirt} />

      {/* Main torso */}
      <path d="M124,295 C122,278 124,265 132,254 L160,258 L188,254 C196,265 198,278 196,295 L196,400 L124,400 Z"
        fill={`url(#${gradId})`} />

      {/* Chest muscle definition */}
      <path d="M130,268 C132,278 136,285 142,288 C148,290 158,290 164,288 C170,285 174,278 176,268"
        fill="none" stroke={shirtD} strokeWidth="2" opacity="0.22" />

      {/* Collar */}
      <Collar outfit={outfit} shirt={shirt} shirtL={shirtL} shirtD={shirtD} accent={accent} />

      {/* Outfit-specific details */}
      {outfit==="bowling-shirt" && (
        <>
          {/* Placket */}
          <path d="M160,260 L160,390" stroke={accent} strokeWidth="2" opacity="0.3" />
          {/* Buttons */}
          {[278,296,314,332].map(y=>(
            <ellipse key={y} cx="160" cy={y} rx="3.5" ry="2.5"
              fill={accent} opacity="0.7" />
          ))}
          {/* Chest pocket */}
          <path d="M128,280 L128,296 L144,296 L144,280 Z"
            fill="none" stroke={accent} strokeWidth="1.2" opacity="0.35"
            strokeLinejoin="round" />
          {/* Retro side panel */}
          <path d="M124,265 L120,400" stroke={accent} strokeWidth="3" opacity="0.18" />
          <path d="M196,265 L200,400" stroke={accent} strokeWidth="3" opacity="0.18" />
        </>
      )}

      {outfit==="letterman" && (
        <>
          {/* Sleeve stripes */}
          <path d="M60,280 L68,280 L68,298 L60,298 Z" fill={accent} opacity="0.8" />
          <path d="M260,280 L252,280 L252,298 L260,298 Z" fill={accent} opacity="0.8" />
          {/* Letter D */}
          <text x="148" y="296" fontSize="24" fontWeight="900" fill={accent}
            opacity="0.85" fontFamily="Georgia, serif">D</text>
        </>
      )}

      {outfit==="jersey" && (
        <>
          <path d="M124,268 L196,268" stroke={accent} strokeWidth="3.5" opacity="0.3" />
          <path d="M124,280 L196,280" stroke={accent} strokeWidth="2" opacity="0.2" />
          <text x="140" y="318" fontSize="30" fontWeight="900" fill={accent}
            opacity="0.45" fontFamily="Impact, sans-serif">42</text>
        </>
      )}

      {outfit==="hoodie" && (
        <>
          {/* Hood on shoulders */}
          <path d="M120,252 C110,242 106,258" stroke={shirtL} strokeWidth="2.5" fill="none" opacity="0.55" />
          <path d="M200,252 C210,242 214,258" stroke={shirtL} strokeWidth="2.5" fill="none" opacity="0.55" />
          {/* Front pocket */}
          <path d="M136,315 L136,340 C136,342 138,344 140,344 L180,344 C182,344 184,342 184,340 L184,315 Z"
            fill={shirtD} opacity="0.5" />
          {/* Drawstrings */}
          <path d="M153,260 C150,272 148,285 149,298"
            stroke={shirtD} strokeWidth="1.8" fill="none" opacity="0.5" strokeLinecap="round" />
          <path d="M167,260 C170,272 172,285 171,298"
            stroke={shirtD} strokeWidth="1.8" fill="none" opacity="0.5" strokeLinecap="round" />
        </>
      )}

      {outfit==="polo" && (
        <>
          {/* Placket */}
          <path d="M158,264 L158,290" stroke={shirtD} strokeWidth="2" opacity="0.35" />
          {/* Buttons */}
          {[270,280,290].map(y=>(
            <circle key={y} cx="158" cy={y} r="2.5" fill={shirtD} opacity="0.6" />
          ))}
        </>
      )}

      {/* Arms */}
      <path d="M60,295 C55,318 58,348 66,372 L90,368 C84,346 82,316 88,295 Z"
        fill={`url(#${gradId})`} />
      <path d="M260,295 C265,318 262,348 254,372 L230,368 C236,346 238,316 232,295 Z"
        fill={`url(#${gradId})`} />

      {/* Cuffs */}
      <path d="M66,370 C66,365 90,365 90,370 L90,380 C90,382 66,382 66,380 Z"
        fill={shirtD} opacity="0.7" />
      <path d="M254,370 C254,365 230,365 230,370 L230,380 C230,382 254,382 254,380 Z"
        fill={shirtD} opacity="0.7" />

      {/* Hands */}
      <Hand side="left"  skin={skin} skinD={skinD} />
      <Hand side="right" skin={skin} skinD={skinD} />

      {/* Shirt bottom shadow */}
      <path d="M124,390 L196,390 L196,400 L124,400 Z"
        fill={shirtD} opacity="0.25" />
    </g>
  );
}

function Collar({outfit,shirt,shirtL,shirtD,accent}: {outfit:string;shirt:string;shirtL:string;shirtD:string;accent:string}) {
  if (outfit==="polo") return (
    <g>
      <path d="M138,252 L145,270 L160,264 L175,270 L182,252 L174,258 L160,262 L146,258 Z"
        fill={shirtL} />
      <path d="M138,252 L145,270 L160,264 L175,270 L182,252"
        stroke={shirtD} strokeWidth="1" fill="none" opacity="0.4" />
    </g>
  );
  if (outfit==="hoodie") return (
    <g>
      {/* Ribbed neckline */}
      <path d="M140,252 C145,260 155,265 160,266 C165,265 175,260 180,252"
        fill={shirtD} opacity="0.5" />
      <path d="M141,255 C148,263 156,267 160,268 C164,267 172,263 179,255"
        stroke={lighten2(shirt,0.08)} strokeWidth="1.5" fill="none" opacity="0.3" />
    </g>
  );
  // Default spread collar for bowling-shirt, letterman, jersey
  return (
    <g>
      {/* Left lapel */}
      <path d="M140,252 C136,256 134,264 136,272 L148,268 L160,264 Z"
        fill={shirtL} opacity="0.85" />
      {/* Right lapel */}
      <path d="M180,252 C184,256 186,264 184,272 L172,268 L160,264 Z"
        fill={shirtL} opacity="0.85" />
      {/* Collar fold lines */}
      <path d="M140,252 L148,268"
        stroke={shirtD} strokeWidth="1" fill="none" opacity="0.4" />
      <path d="M180,252 L172,268"
        stroke={shirtD} strokeWidth="1" fill="none" opacity="0.4" />
    </g>
  );
}

// ── HAND ─────────────────────────────────────────────────────
function Hand({side,skin,skinD}: {side:"left"|"right";skin:string;skinD:string}) {
  const cx = side==="left" ? 74 : 246;
  const flip = side==="left" ? 1 : -1;
  return (
    <g>
      {/* Palm */}
      <ellipse cx={cx} cy={378} rx={13} ry={16} fill={skin} />
      {/* Knuckle definition */}
      <path
        d={`M${cx-10},${370} C${cx-8},${366} ${cx-2},${364} ${cx+2*flip},${364} C${cx+8*flip},${364} ${cx+10*flip},${366} ${cx+12*flip},${370}`}
        stroke={skinD} strokeWidth="1.2" fill="none" opacity="0.3" />
      {/* Fingers hint */}
      {[-5,-1,3,7].map((dx,i)=>(
        <line key={i} x1={cx+dx} y1={366} x2={cx+dx} y2={360}
          stroke={skin} strokeWidth="4" strokeLinecap="round" opacity="0.85" />
      ))}
      {/* Thumb */}
      <ellipse cx={cx-12*flip} cy={374} rx={5} ry={8}
        fill={skin} transform={`rotate(${20*flip},${cx-12*flip},374)`} />
      {/* Palm crease */}
      <path d={`M${cx-8},${374} C${cx},${370} ${cx+8*flip},${374}`}
        stroke={skinD} strokeWidth="1" fill="none" opacity="0.25" strokeLinecap="round" />
    </g>
  );
}

// ── ACCESSORIES ────────────────────────────────────────────────
function Glasses() {
  return (
    <g>
      {/* Frame */}
      <path d="M103,170 L118,170" stroke="#2A2420" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M202,170 L217,170" stroke="#2A2420" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="155" y1="170" x2="165" y2="170" stroke="#2A2420" strokeWidth="2" />
      {/* Left lens */}
      <rect x="117" y="162" width="38" height="24" rx="10"
        fill="rgba(180,210,255,0.14)" stroke="#2A2420" strokeWidth="2.2" />
      {/* Right lens */}
      <rect x="165" y="162" width="38" height="24" rx="10"
        fill="rgba(180,210,255,0.14)" stroke="#2A2420" strokeWidth="2.2" />
      {/* Lens glare */}
      <path d="M120,164 C124,162 130,163" stroke="white" strokeWidth="1.5"
        fill="none" opacity="0.5" strokeLinecap="round" />
      <path d="M168,164 C172,162 178,163" stroke="white" strokeWidth="1.5"
        fill="none" opacity="0.5" strokeLinecap="round" />
    </g>
  );
}

function Sunglasses() {
  return (
    <g>
      <path d="M103,170 L117,170" stroke="#111" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M203,170 L217,170" stroke="#111" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="155" y1="170" x2="165" y2="170" stroke="#111" strokeWidth="2.2" />
      {/* Left lens — gradient dark */}
      <rect x="117" y="162" width="38" height="24" rx="10"
        fill="#111" stroke="#333" strokeWidth="2" />
      {/* Right lens */}
      <rect x="165" y="162" width="38" height="24" rx="10"
        fill="#111" stroke="#333" strokeWidth="2" />
      {/* Tinted glare */}
      <path d="M120,164 C125,162 132,163" stroke="white" strokeWidth="2"
        fill="none" opacity="0.15" strokeLinecap="round" />
      <path d="M168,164 C173,162 180,163" stroke="white" strokeWidth="2"
        fill="none" opacity="0.15" strokeLinecap="round" />
    </g>
  );
}

function Hat({hair,hairD}: {hair:string;hairD:string}) {
  const brim = darken(hair,0.3);
  return (
    <g>
      {/* Crown */}
      <path d="M98,150 C100,112 118,92 160,88 C202,92 220,112 222,150 C204,134 185,126 160,124 C135,126 116,134 98,150 Z"
        fill={hair} />
      {/* Crown shading */}
      <path d="M102,148 C104,118 120,100 160,96 C200,100 216,118 218,148"
        fill={hairD} opacity="0.4" />
      {/* Brim */}
      <ellipse cx="160" cy="150" rx="72" ry="16" fill={brim} />
      {/* Brim highlight */}
      <path d="M96,146 C108,142 130,140 160,140 C190,140 212,142 224,146"
        stroke={lighten2(brim,0.2)} strokeWidth="2.5" fill="none" opacity="0.4"
        strokeLinecap="round" />
      {/* Crown seam */}
      <path d="M98,150 C118,156 140,158 160,158 C180,158 202,156 222,150"
        stroke={hairD} strokeWidth="2" fill="none" opacity="0.45" />
      {/* Button */}
      <circle cx="160" cy="92" r="5" fill={hairD} />
    </g>
  );
}

function Headband() {
  return (
    <g>
      <path d="M98,148 C118,140 140,138 160,138 C180,138 202,140 222,148 C220,156 202,148 160,148 C118,148 100,156 98,148 Z"
        fill="#e46a2e" />
      <path d="M100,148 C120,141 140,139 160,139 C180,139 200,141 220,148"
        stroke="rgba(255,255,255,0.35)" strokeWidth="1.8" fill="none" strokeLinecap="round" />
    </g>
  );
}

function Earrings() {
  return (
    <g>
      {/* Left */}
      <circle cx="93" cy="192" r="6" fill="#C8940C" />
      <circle cx="93" cy="192" r="4.5" fill="#E8B420" />
      <circle cx="91" cy="190" r="1.5" fill="white" opacity="0.5" />
      {/* Right */}
      <circle cx="227" cy="192" r="6" fill="#C8940C" />
      <circle cx="227" cy="192" r="4.5" fill="#E8B420" />
      <circle cx="225" cy="190" r="1.5" fill="white" opacity="0.5" />
    </g>
  );
}

// ── CONTROLS ──────────────────────────────────────────────────
function Section({title,children}: {title:string;children:React.ReactNode}) {
  return (
    <div style={{marginBottom:"1.25rem"}}>
      <div style={{fontSize:".72rem",fontWeight:900,color:MUTED,letterSpacing:".08em",textTransform:"uppercase",marginBottom:".6rem"}}>{title}</div>
      {children}
    </div>
  );
}
function ChipGrid({children}: {children:React.ReactNode}) {
  return <div style={{display:"flex",flexWrap:"wrap",gap:".4rem"}}>{children}</div>;
}
function Chip({label,active,onClick}: {label:string;active:boolean;onClick:()=>void}) {
  return (
    <button onClick={onClick} style={{
      padding:".4rem .85rem",borderRadius:999,
      border:`1px solid ${active?ORANGE:BORDER}`,
      background:active?ORANGE_SOFT:"rgba(0,0,0,0.2)",
      color:active?ORANGE:MUTED,
      fontWeight:900,fontSize:".78rem",cursor:"pointer",
      fontFamily:"Montserrat, system-ui",transition:"all 120ms",
    }}>{label}</button>
  );
}
function ColorDot({hex,active,onClick,label}: {hex:string;active:boolean;onClick:()=>void;label?:string}) {
  return (
    <button onClick={onClick} title={label} style={{
      width:30,height:30,borderRadius:"50%",background:hex,
      border:`3px solid ${active?ORANGE:"transparent"}`,
      outline:active?`2px solid ${ORANGE}`:"none",outlineOffset:2,
      cursor:"pointer",padding:0,
      boxShadow:"0 2px 6px rgba(0,0,0,0.4)",
      transition:"transform 120ms",transform:active?"scale(1.15)":"scale(1)",
    }} />
  );
}
function SkinSlider({value,onChange}: {value:number;onChange:(v:number)=>void}) {
  const gradient=`linear-gradient(to right, ${SKIN_TONES.join(",")})`;
  return (
    <div>
      <div style={{position:"relative",height:32,display:"flex",alignItems:"center"}}>
        <div style={{position:"absolute",left:0,right:0,height:18,borderRadius:999,background:gradient,boxShadow:"inset 0 2px 4px rgba(0,0,0,0.3)"}} />
        <input type="range" min={0} max={SKIN_TONES.length-1} step={1} value={value}
          onChange={e=>onChange(Number(e.target.value))}
          style={{position:"relative",width:"100%",height:18,appearance:"none",background:"transparent",cursor:"pointer",zIndex:1}} />
      </div>
      <div style={{display:"flex",alignItems:"center",gap:".6rem",marginTop:".4rem"}}>
        <div style={{width:22,height:22,borderRadius:"50%",background:SKIN_TONES[value],border:`2px solid ${BORDER}`}} />
        <span style={{fontSize:".72rem",color:MUTED}}>
          {value<=2?"Fair":value<=4?"Light":value<=6?"Medium":value<=8?"Tan":value<=10?"Deep":"Rich"}
        </span>
      </div>
    </div>
  );
}
function toggleAcc(state:AvatarState,id:string):string[] {
  const GLASS=["glasses","sunglasses"];
  let next=state.accessories.includes(id)?state.accessories.filter(a=>a!==id):[...state.accessories,id];
  if(GLASS.includes(id)&&!state.accessories.includes(id)) next=next.filter(a=>!GLASS.includes(a)||a===id);
  return next;
}

// ── MAIN PAGE ─────────────────────────────────────────────────
export default function AvatarPage() {
  const [state,setState] = useState<AvatarState>(DEFAULTS);
  const [saving,setSaving] = useState(false);
  const [saved,setSaved]   = useState(false);
  const [loggedIn,setLoggedIn] = useState<boolean|null>(null);

  useEffect(()=>{
    (async()=>{
      try {
        const me = await fetch("/api/auth/me",{cache:"no-store"}).then(r=>r.json());
        if(!me?.user?.id){setLoggedIn(false);return;}
        setLoggedIn(true);
        const res = await fetch("/api/profile/avatar",{cache:"no-store"});
        const data = await res.json();
        if(data.ok&&data.avatar) setState(prev=>({...prev,...data.avatar}));
      } catch { setLoggedIn(false); }
    })();
  },[]);

  async function saveAvatar() {
    setSaving(true);
    try {
      await fetch("/api/profile/avatar",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({avatar:state})});
      setSaved(true);
      setTimeout(()=>setSaved(false),2500);
    } catch {}
    finally { setSaving(false); }
  }

  function set<K extends keyof AvatarState>(key:K,val:AvatarState[K]) {
    setState(prev=>({...prev,[key]:val}));
  }

  return (
    <main style={{minHeight:"100vh",background:BG,fontFamily:"Montserrat, system-ui",color:TEXT}}>
      <div aria-hidden="true" style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0,background:"radial-gradient(800px 400px at 15% 8%, rgba(228,106,46,0.14), transparent 55%)"}} />
      <div style={{position:"relative",zIndex:1,maxWidth:1000,margin:"0 auto",padding:"1.5rem 1rem 4rem"}}>

        {/* Header */}
        <div style={{display:"flex",alignItems:"center",gap:"1rem",marginBottom:"1.5rem",flexWrap:"wrap"}}>
          <Link href="/profile" style={{color:MUTED,fontSize:".85rem",textDecoration:"none"}}>← Profile</Link>
          <div style={{flex:1}}>
            <h1 style={{margin:0,fontWeight:900,fontSize:"1.4rem"}}>Avatar Creator</h1>
            <div style={{fontSize:".78rem",color:MUTED,marginTop:".15rem"}}>Build your duckpin identity</div>
          </div>
          <div style={{display:"flex",gap:".6rem",alignItems:"center"}}>
            {!loggedIn&&<span style={{fontSize:".78rem",color:MUTED}}>Log in to save</span>}
            {saved&&<span style={{fontSize:".82rem",color:"#4ade80",fontWeight:900}}>✓ Saved!</span>}
            <button onClick={saveAvatar} disabled={saving||!loggedIn} style={{
              padding:".6rem 1.25rem",borderRadius:10,border:0,
              background:ORANGE,color:"#fff",fontWeight:900,fontSize:".85rem",
              cursor:saving||!loggedIn?"default":"pointer",
              opacity:saving||!loggedIn?0.55:1,fontFamily:"Montserrat, system-ui",
            }}>
              {saving?"Saving…":"Save Avatar"}
            </button>
          </div>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"1fr minmax(280px,320px)",gap:"1.5rem",alignItems:"start"}}>

          {/* Controls */}
          <div style={{background:PANEL,border:`1px solid ${BORDER}`,borderRadius:20,padding:"1.5rem",boxShadow:SHADOW}}>
            <Section title="Skin Tone">
              <SkinSlider value={state.skinToneIdx} onChange={v=>set("skinToneIdx",v)} />
            </Section>
            <Section title="Face Shape">
              <ChipGrid>{FACE_SHAPES.map(f=><Chip key={f.id} label={f.label} active={state.faceShape===f.id} onClick={()=>set("faceShape",f.id)} />)}</ChipGrid>
            </Section>
            <Section title="Hair Style">
              <ChipGrid>{HAIR_STYLES.map(h=><Chip key={h.id} label={h.label} active={state.hairStyle===h.id} onClick={()=>set("hairStyle",h.id)} />)}</ChipGrid>
            </Section>
            <Section title="Hair Color">
              <div style={{display:"flex",gap:".5rem",flexWrap:"wrap"}}>
                {HAIR_COLORS.map(h=><ColorDot key={h.id} hex={h.hex} active={state.hairColor===h.id} onClick={()=>set("hairColor",h.id)} label={h.label} />)}
              </div>
            </Section>
            <Section title="Eye Color">
              <div style={{display:"flex",gap:".5rem",flexWrap:"wrap"}}>
                {EYE_COLORS.map(e=><ColorDot key={e.id} hex={e.hex} active={state.eyeColor===e.id} onClick={()=>set("eyeColor",e.id)} />)}
              </div>
            </Section>
            <Section title="Facial Hair">
              <ChipGrid>{FACIAL_HAIR_LIST.map(f=><Chip key={f.id} label={f.label} active={state.facialHair===f.id} onClick={()=>set("facialHair",f.id)} />)}</ChipGrid>
            </Section>
            <Section title="Outfit">
              <ChipGrid>{OUTFITS.map(o=><Chip key={o.id} label={o.label} active={state.outfit===o.id} onClick={()=>set("outfit",o.id)} />)}</ChipGrid>
            </Section>
            <Section title="Accessories">
              <ChipGrid>{ACCESSORIES_LIST.map(a=><Chip key={a.id} label={a.label} active={state.accessories.includes(a.id)} onClick={()=>set("accessories",toggleAcc(state,a.id))} />)}</ChipGrid>
            </Section>
            <Section title="Background">
              <div style={{display:"flex",gap:".5rem",flexWrap:"wrap"}}>
                {BG_COLORS.map(c=><ColorDot key={c} hex={c} active={state.bgColor===c} onClick={()=>set("bgColor",c)} />)}
              </div>
            </Section>
            <button onClick={()=>setState(DEFAULTS)} style={{
              width:"100%",padding:".6rem",borderRadius:10,marginTop:".25rem",
              border:`1px solid ${BORDER}`,background:"transparent",
              color:MUTED,fontWeight:900,fontSize:".78rem",cursor:"pointer",
              fontFamily:"Montserrat, system-ui",
            }}>Reset to Default</button>
          </div>

          {/* Preview */}
          <div style={{position:"sticky",top:"1.5rem"}}>
            <div style={{background:PANEL,border:`1px solid ${BORDER}`,borderRadius:20,padding:"1.5rem",boxShadow:SHADOW,textAlign:"center"}}>
              <div style={{fontSize:".72rem",fontWeight:900,color:MUTED,letterSpacing:".08em",textTransform:"uppercase",marginBottom:"1rem"}}>Preview</div>
              <div style={{background:`radial-gradient(circle, ${state.bgColor}22, transparent 70%)`,borderRadius:16,padding:"1rem",display:"inline-block"}}>
                <AvatarSVG state={state} size={250} />
              </div>
              <div style={{marginTop:"1rem",display:"grid",gap:".3rem",textAlign:"left"}}>
                <div style={{fontSize:".72rem",color:MUTED}}><strong style={{color:TEXT}}>Hair:</strong> {HAIR_STYLES.find(h=>h.id===state.hairStyle)?.label} · {HAIR_COLORS.find(h=>h.id===state.hairColor)?.label}</div>
                <div style={{fontSize:".72rem",color:MUTED}}><strong style={{color:TEXT}}>Outfit:</strong> {OUTFITS.find(o=>o.id===state.outfit)?.label}</div>
                {state.accessories.length>0&&<div style={{fontSize:".72rem",color:MUTED}}><strong style={{color:TEXT}}>Accessories:</strong> {state.accessories.map(a=>ACCESSORIES_LIST.find(x=>x.id===a)?.label).join(", ")}</div>}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:26px;height:26px;border-radius:50%;background:white;border:3px solid #e46a2e;box-shadow:0 2px 8px rgba(0,0,0,0.5);cursor:pointer;}
        input[type=range]::-moz-range-thumb{width:22px;height:22px;border-radius:50%;background:white;border:3px solid #e46a2e;box-shadow:0 2px 8px rgba(0,0,0,0.5);cursor:pointer;}
        input[type=range]:focus{outline:none;}
      `}</style>
    </main>
  );
}