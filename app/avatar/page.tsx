"use client";
import React, { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useDevice } from "@/app/hooks/useDevice";
import BowlerCharacter3D from "./BowlerCharacter3D";

// ─── DESIGN TOKENS — clean, Apple/Memoji-inspired ─────────────────────────
const C = {
  bg:        "#F2F2F7",
  bgGrad:    "linear-gradient(180deg,#FAFAFE 0%,#EFEFF4 100%)",
  surface:   "#FFFFFF",
  surfaceMuted:"#F7F7FA",
  divider:   "rgba(60,60,67,0.10)",
  text:      "#1C1C1E",
  textMute:  "rgba(60,60,67,0.62)",
  textLight: "rgba(60,60,67,0.36)",
  accent:    "#007AFF",
  accentSoft:"rgba(0,122,255,0.12)",
  accentRing:"rgba(0,122,255,0.36)",
  shadow:    "0 1px 3px rgba(0,0,0,0.06),0 4px 14px rgba(0,0,0,0.04)",
  shadowSm:  "0 1px 3px rgba(0,0,0,0.08)",
  shadowMd:  "0 4px 14px rgba(0,0,0,0.10)",
  shadowLg:  "0 8px 28px rgba(0,0,0,0.16)",
  duxOrange: "#e46a2e",
  red:       "#FF3B30",
};

// ─── PALETTES ─────────────────────────────────────────────────────────────
const SKIN_TONES = [
  "#FDDBB4","#F8CDA0","#F0BC8A","#E8A87C",
  "#D4906A","#C07858","#A86040","#8C4A2C",
  "#7A3A20","#5C2810","#3E1808","#2A0E04",
];
const HAIR_COLORS: { id:string; hex:string; label:string }[] = [
  {id:"black",   hex:"#150A04", label:"Black"},
  {id:"brown",   hex:"#5C2E18", label:"Brown"},
  {id:"chestnut",hex:"#7B3F1B", label:"Chestnut"},
  {id:"auburn",  hex:"#8A3B20", label:"Auburn"},
  {id:"red",     hex:"#9F2A18", label:"Red"},
  {id:"blonde",  hex:"#D4B36A", label:"Blonde"},
  {id:"platinum",hex:"#E0DCC8", label:"Platinum"},
  {id:"silver",  hex:"#B8B8B8", label:"Silver"},
  {id:"white",   hex:"#EAEAE0", label:"White"},
  {id:"pink",    hex:"#E89AB8", label:"Pink"},
  {id:"blue",    hex:"#5887BF", label:"Blue"},
  {id:"purple",  hex:"#8A6FBF", label:"Purple"},
];
const EYE_COLORS = [
  {id:"brown",label:"Brown",hex:"#4A2C10"},
  {id:"hazel",label:"Hazel",hex:"#7A5828"},
  {id:"amber",label:"Amber",hex:"#A87010"},
  {id:"green",label:"Green",hex:"#3A7444"},
  {id:"blue", label:"Blue", hex:"#3878C8"},
  {id:"sky",  label:"Sky",  hex:"#7AB4D8"},
  {id:"gray", label:"Gray", hex:"#7A8898"},
  {id:"violet",label:"Violet",hex:"#8060A0"},
];
const LIP_COLORS = [
  {id:"natural", label:"Natural", hex:"#C77860"},
  {id:"pink",    label:"Pink",    hex:"#D8758C"},
  {id:"red",     label:"Red",     hex:"#C03040"},
  {id:"berry",   label:"Berry",   hex:"#9B3A60"},
  {id:"nude",    label:"Nude",    hex:"#B8806B"},
  {id:"plum",    label:"Plum",    hex:"#7B4060"},
  {id:"coral",   label:"Coral",   hex:"#E08868"},
  {id:"deep",    label:"Deep",    hex:"#5A2030"},
];
const BG_COLORS = [
  "#FFB088","#F2A0BC","#FF9A9A","#C8A0F0",
  "#9DB8F0","#88D0F0","#88E0C8","#A4E098",
  "#FFD888","#F2BF80","#D4D4DC","#3C3C44",
];

// ─── STYLE OPTIONS ────────────────────────────────────────────────────────
const HAIR_STYLES = [
  {id:"bald",     label:"Bald"},
  {id:"buzz",     label:"Buzz Cut"},
  {id:"short",    label:"Short"},
  {id:"pompadour",label:"Pompadour"},
  {id:"bob",      label:"Bob"},
  {id:"long",     label:"Long"},
  {id:"curly",    label:"Curly"},
  {id:"bun",      label:"Top Bun"},
];
const BROW_STYLES = [
  {id:"default"   as const, label:"Natural"},
  {id:"thin"      as const, label:"Thin"},
  {id:"thick"     as const, label:"Thick"},
  {id:"arched"    as const, label:"Arched"},
  {id:"angled"    as const, label:"Angled"},
  {id:"straight"  as const, label:"Straight"},
];
const EYE_SHAPES = [
  {id:"almond"     as const, label:"Almond"},
  {id:"round"      as const, label:"Round"},
  {id:"narrow"     as const, label:"Narrow"},
  {id:"downturned" as const, label:"Downturned"},
];
const NOSE_STYLES = [
  {id:"default" as const, label:"Natural"},
  {id:"small"   as const, label:"Small"},
  {id:"button"  as const, label:"Button"},
  {id:"wide"    as const, label:"Wide"},
  {id:"long"    as const, label:"Long"},
];
const MOUTH_SHAPES = [
  {id:"default" as const, label:"Natural"},
  {id:"smile"   as const, label:"Smile"},
  {id:"neutral" as const, label:"Neutral"},
  {id:"small"   as const, label:"Small"},
  {id:"full"    as const, label:"Full"},
];
const EAR_SIZES = [
  {id:"small"   as const, label:"Small"},
  {id:"default" as const, label:"Medium"},
  {id:"large"   as const, label:"Large"},
];
const FACE_SHAPES = [
  {id:"oval",  label:"Oval"},
  {id:"round", label:"Round"},
  {id:"square",label:"Square"},
  {id:"heart", label:"Heart"},
];
const FRECKLES_OPTS = [
  {id:"none",  label:"None"},
  {id:"light", label:"Light"},
  {id:"heavy", label:"Heavy"},
];
const FACIAL_HAIRS = [
  {id:"none",       label:"Clean"},
  {id:"stubble",    label:"Stubble"},
  {id:"mustache",   label:"Mustache"},
  {id:"beard-short",label:"Goatee"},
  {id:"beard-full", label:"Full Beard"},
];
const EYEWEAR = [
  {id:"none",       label:"None"},
  {id:"glasses",    label:"Glasses"},
  {id:"sunglasses", label:"Shades"},
];
const HEADWEAR = [
  {id:"none",     label:"None"},
  {id:"hat",      label:"Cap"},
  {id:"headband", label:"Headband"},
];
const OUTFITS = [
  {id:"bowling-shirt", label:"Bowling"},
  {id:"polo",          label:"Polo"},
  {id:"letterman",     label:"Letterman"},
  {id:"jersey",        label:"Jersey"},
  {id:"hoodie",        label:"Hoodie"},
];

// ─── STATE TYPE ───────────────────────────────────────────────────────────
type AvatarState = {
  skinToneIdx:number;
  gender:"male"|"female";
  hairStyle:string;
  hairColor:string;
  eyeColor:string;
  faceShape:string;
  facialHair:string;
  outfit:string;
  accessories:string[];   // legacy: derived from eyewear/headwear/earrings
  bgColor:string;
  // Memoji-style
  freckles:"none"|"light"|"heavy";
  browStyle:"default"|"thin"|"thick"|"arched"|"angled"|"straight";
  eyeShape:"round"|"almond"|"narrow"|"downturned";
  eyelashes:boolean;
  noseStyle:"default"|"small"|"wide"|"long"|"button";
  mouthShape:"default"|"smile"|"neutral"|"small"|"full";
  lipColor:string;
  earSize:"default"|"small"|"large";
  age:"young"|"adult"|"mature";
  eyewear:string;
  headwear:string;
  earrings:boolean;
};

const DEFAULTS: AvatarState = {
  skinToneIdx:3, gender:"male", hairStyle:"short", hairColor:"brown",
  eyeColor:"brown", faceShape:"oval", facialHair:"none",
  outfit:"bowling-shirt", accessories:[], bgColor:"#FFB088",
  freckles:"none", browStyle:"default", eyeShape:"almond", eyelashes:false,
  noseStyle:"default", mouthShape:"default", lipColor:"natural",
  earSize:"default", age:"adult", eyewear:"none", headwear:"none", earrings:false,
};

// ─── COLOR MATH ───────────────────────────────────────────────────────────
function hx(hex:string):[number,number,number]{return[parseInt(hex.slice(1,3),16),parseInt(hex.slice(3,5),16),parseInt(hex.slice(5,7),16)];}
function rh(r:number,g:number,b:number){return"#"+[r,g,b].map(v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,"0")).join("");}
function dk(hex:string,a:number){const[r,g,b]=hx(hex);return rh(r*(1-a),g*(1-a),b*(1-a));}
function lt(hex:string,a:number){const[r,g,b]=hx(hex);return rh(r+(255-r)*a,g+(255-g)*a,b+(255-b)*a);}

// ─── DERIVE LEGACY accessories[] FROM NEW FIELDS ──────────────────────────
function syncAccessories(s:AvatarState):AvatarState {
  const acc:string[] = [];
  if (s.eyewear === "glasses")    acc.push("glasses");
  if (s.eyewear === "sunglasses") acc.push("sunglasses");
  if (s.headwear === "hat")       acc.push("hat");
  if (s.headwear === "headband")  acc.push("headband");
  if (s.earrings)                 acc.push("earrings");
  return { ...s, accessories: acc };
}

// ═══════════════════════════════════════════════════════════════════════════
// THUMBNAIL COMPONENTS — mini SVG previews per option
// Each thumbnail is rendered on a soft circular gradient background
// matching Memoji's option preview style.
// ═══════════════════════════════════════════════════════════════════════════

function ThumbBg({ children, bg = "#FFE4D0" }: { children:ReactNode; bg?:string }) {
  return (
    <div style={{
      width:"100%",height:"100%",position:"relative",
      borderRadius:"50%",overflow:"hidden",
      background:`radial-gradient(circle at 50% 35%, ${lt(bg,0.18)} 0%, ${bg} 70%, ${dk(bg,0.10)} 100%)`,
    }}>
      {children}
    </div>
  );
}

// Generic stylized head/face base used inside thumbnails
function FaceBase({ skin = "#E8A87C", showFeatures = true }:{skin?:string;showFeatures?:boolean}) {
  const skD = dk(skin,0.20); const skL = lt(skin,0.20);
  return (
    <svg viewBox="0 0 100 100" style={{width:"100%",height:"100%",position:"absolute",inset:0}}>
      {/* head */}
      <ellipse cx="50" cy="52" rx="32" ry="36" fill={skin}/>
      <ellipse cx="44" cy="44" rx="22" ry="20" fill={skL} opacity="0.45"/>
      {/* ears */}
      <ellipse cx="20" cy="54" rx="6" ry="9" fill={skin}/>
      <ellipse cx="80" cy="54" rx="6" ry="9" fill={skin}/>
      <ellipse cx="20" cy="54" rx="3" ry="5" fill={skD} opacity="0.35"/>
      <ellipse cx="80" cy="54" rx="3" ry="5" fill={skD} opacity="0.35"/>
      {/* neck */}
      <rect x="42" y="83" width="16" height="12" fill={skin}/>
      {/* shoulders peek */}
      <ellipse cx="50" cy="100" rx="40" ry="14" fill={skin}/>
      {showFeatures && <>
        {/* eyes */}
        <ellipse cx="40" cy="50" rx="4" ry="3" fill="#FFF"/>
        <ellipse cx="60" cy="50" rx="4" ry="3" fill="#FFF"/>
        <circle cx="40" cy="50" r="2" fill="#3a2410"/>
        <circle cx="60" cy="50" r="2" fill="#3a2410"/>
        {/* nose */}
        <path d="M48 56 Q47 62 50 64 Q53 62 52 56" fill="none" stroke={skD} strokeWidth="0.8" opacity="0.5"/>
        {/* mouth */}
        <path d="M44 70 Q50 72 56 70" fill="none" stroke="#9B5040" strokeWidth="1.4" strokeLinecap="round"/>
      </>}
    </svg>
  );
}

// SKIN tone thumbnail — just a solid color circle
function SkinThumb({ hex }:{hex:string}) {
  return <ThumbBg bg={hex}><FaceBase skin={hex}/></ThumbBg>;
}

// HAIR style thumbnail
function HairStyleThumb({ style, color = "#5C2E18" }:{style:string;color?:string}) {
  const dark = dk(color,0.30);
  return (
    <ThumbBg>
      <FaceBase showFeatures={false}/>
      <svg viewBox="0 0 100 100" style={{width:"100%",height:"100%",position:"absolute",inset:0}}>
        {style==="bald" && null}
        {style==="buzz" && (
          <path d="M20 35 Q20 22 50 18 Q80 22 80 35 Q80 38 78 40 Q50 32 22 40 Q20 38 20 35Z" fill={color} opacity="0.95"/>
        )}
        {style==="short" && (
          <>
            <path d="M18 40 Q18 18 50 14 Q82 18 82 40 Q82 42 80 44 Q80 30 50 28 Q20 30 20 44 Q18 42 18 40Z" fill={color}/>
            <ellipse cx="32" cy="32" rx="8" ry="4" fill={dark} opacity="0.6"/>
          </>
        )}
        {style==="pompadour" && (
          <>
            <path d="M20 38 Q20 24 50 22 Q80 24 80 38 Q80 42 76 44 Q76 32 50 30 Q24 32 24 44 Q20 42 20 38Z" fill={color}/>
            <path d="M30 24 Q40 6 55 8 Q70 10 72 22 Q60 18 50 18 Q38 18 30 24Z" fill={dark}/>
            <ellipse cx="48" cy="14" rx="14" ry="7" fill={lt(color,0.15)}/>
          </>
        )}
        {style==="bob" && (
          <>
            <path d="M16 38 Q16 22 50 16 Q84 22 84 38 L84 60 Q80 68 50 68 Q20 68 16 60Z" fill={color}/>
            <ellipse cx="36" cy="32" rx="6" ry="3" fill={lt(color,0.18)} opacity="0.6"/>
          </>
        )}
        {style==="long" && (
          <>
            <path d="M14 38 Q14 18 50 14 Q86 18 86 38 L86 92 Q82 96 76 96 L74 50 Q72 60 70 92 L66 96 L62 50 Q60 56 56 96 L46 96 Q44 60 40 50 Q38 60 36 96 L30 96 L28 50 Q24 60 22 96 Q16 96 14 92Z" fill={color}/>
          </>
        )}
        {style==="curly" && (
          <>
            <circle cx="30" cy="28" r="9" fill={color}/>
            <circle cx="44" cy="22" r="9" fill={dark}/>
            <circle cx="58" cy="20" r="9" fill={color}/>
            <circle cx="72" cy="26" r="9" fill={dark}/>
            <circle cx="80" cy="38" r="8" fill={color}/>
            <circle cx="20" cy="38" r="8" fill={color}/>
            <circle cx="22" cy="50" r="7" fill={dark}/>
            <circle cx="78" cy="50" r="7" fill={dark}/>
          </>
        )}
        {style==="bun" && (
          <>
            <path d="M20 40 Q20 22 50 18 Q80 22 80 40 Q80 42 78 44 Q78 32 50 30 Q22 32 22 44 Q20 42 20 40Z" fill={color}/>
            <circle cx="50" cy="14" r="11" fill={color}/>
            <circle cx="50" cy="14" r="7" fill={dark} opacity="0.4"/>
          </>
        )}
      </svg>
    </ThumbBg>
  );
}

// HAIR color swatch — circular gradient
function ColorThumb({ hex, ringColor }:{hex:string;ringColor?:string}) {
  return (
    <div style={{
      width:"100%",height:"100%",borderRadius:"50%",
      background:`radial-gradient(circle at 35% 30%, ${lt(hex,0.22)} 0%, ${hex} 60%, ${dk(hex,0.18)} 100%)`,
      boxShadow: ringColor ? `inset 0 0 0 2px ${ringColor}` : undefined,
    }}/>
  );
}

// BROW style thumbnail
function BrowStyleThumb({ style }:{style:string}) {
  return (
    <ThumbBg>
      <FaceBase showFeatures={false}/>
      <svg viewBox="0 0 100 100" style={{width:"100%",height:"100%",position:"absolute",inset:0}}>
        {/* eyes (reference) */}
        <ellipse cx="40" cy="55" rx="3.5" ry="2.5" fill="#FFF"/>
        <ellipse cx="60" cy="55" rx="3.5" ry="2.5" fill="#FFF"/>
        <circle cx="40" cy="55" r="1.6" fill="#3a2410"/>
        <circle cx="60" cy="55" r="1.6" fill="#3a2410"/>
        {/* brows — vary by style */}
        {style==="default"  && <><path d="M32 44 Q40 41 48 44" stroke="#4a2818" strokeWidth="2.4" fill="none" strokeLinecap="round"/><path d="M52 44 Q60 41 68 44" stroke="#4a2818" strokeWidth="2.4" fill="none" strokeLinecap="round"/></>}
        {style==="thin"     && <><path d="M32 45 L48 44" stroke="#4a2818" strokeWidth="1.4" fill="none" strokeLinecap="round"/><path d="M52 44 L68 45" stroke="#4a2818" strokeWidth="1.4" fill="none" strokeLinecap="round"/></>}
        {style==="thick"    && <><path d="M30 45 Q40 40 48 44" stroke="#3a1f10" strokeWidth="4.2" fill="none" strokeLinecap="round"/><path d="M52 44 Q60 40 70 45" stroke="#3a1f10" strokeWidth="4.2" fill="none" strokeLinecap="round"/></>}
        {style==="arched"   && <><path d="M32 46 Q39 38 48 45" stroke="#4a2818" strokeWidth="2.6" fill="none" strokeLinecap="round"/><path d="M52 45 Q61 38 68 46" stroke="#4a2818" strokeWidth="2.6" fill="none" strokeLinecap="round"/></>}
        {style==="angled"   && <><path d="M32 47 L42 41 L48 44" stroke="#4a2818" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round"/><path d="M52 44 L58 41 L68 47" stroke="#4a2818" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round"/></>}
        {style==="straight" && <><path d="M32 44 L48 44" stroke="#4a2818" strokeWidth="2.8" fill="none" strokeLinecap="round"/><path d="M52 44 L68 44" stroke="#4a2818" strokeWidth="2.8" fill="none" strokeLinecap="round"/></>}
      </svg>
    </ThumbBg>
  );
}

// EYE shape thumbnail
function EyeShapeThumb({ shape, color = "#4A2C10" }:{shape:string;color?:string}) {
  return (
    <ThumbBg>
      <FaceBase showFeatures={false}/>
      <svg viewBox="0 0 100 100" style={{width:"100%",height:"100%",position:"absolute",inset:0}}>
        {/* brows */}
        <path d="M30 42 Q40 38 48 42" stroke="#4a2818" strokeWidth="2" fill="none" strokeLinecap="round"/>
        <path d="M52 42 Q60 38 70 42" stroke="#4a2818" strokeWidth="2" fill="none" strokeLinecap="round"/>
        {/* eyes — vary scale & shape */}
        {shape==="almond" && <>
          <ellipse cx="40" cy="55" rx="6" ry="4" fill="#FFF" stroke="#2a1810" strokeWidth="0.5"/>
          <ellipse cx="60" cy="55" rx="6" ry="4" fill="#FFF" stroke="#2a1810" strokeWidth="0.5"/>
          <circle cx="40" cy="55" r="3" fill={color}/>
          <circle cx="60" cy="55" r="3" fill={color}/>
          <circle cx="41" cy="54" r="0.9" fill="#FFF"/>
          <circle cx="61" cy="54" r="0.9" fill="#FFF"/>
        </>}
        {shape==="round" && <>
          <circle cx="40" cy="55" r="5" fill="#FFF" stroke="#2a1810" strokeWidth="0.5"/>
          <circle cx="60" cy="55" r="5" fill="#FFF" stroke="#2a1810" strokeWidth="0.5"/>
          <circle cx="40" cy="55" r="3" fill={color}/>
          <circle cx="60" cy="55" r="3" fill={color}/>
          <circle cx="41" cy="54" r="0.9" fill="#FFF"/>
          <circle cx="61" cy="54" r="0.9" fill="#FFF"/>
        </>}
        {shape==="narrow" && <>
          <ellipse cx="40" cy="55" rx="7" ry="2.4" fill="#FFF" stroke="#2a1810" strokeWidth="0.5"/>
          <ellipse cx="60" cy="55" rx="7" ry="2.4" fill="#FFF" stroke="#2a1810" strokeWidth="0.5"/>
          <ellipse cx="40" cy="55" rx="2" ry="2.2" fill={color}/>
          <ellipse cx="60" cy="55" rx="2" ry="2.2" fill={color}/>
        </>}
        {shape==="downturned" && <>
          <ellipse cx="40" cy="55" rx="6" ry="3.5" fill="#FFF" stroke="#2a1810" strokeWidth="0.5" transform="rotate(-8 40 55)"/>
          <ellipse cx="60" cy="55" rx="6" ry="3.5" fill="#FFF" stroke="#2a1810" strokeWidth="0.5" transform="rotate(8 60 55)"/>
          <circle cx="40" cy="55" r="2.6" fill={color}/>
          <circle cx="60" cy="55" r="2.6" fill={color}/>
        </>}
      </svg>
    </ThumbBg>
  );
}

// NOSE style thumbnail
function NoseStyleThumb({ style }:{style:string}) {
  return (
    <ThumbBg>
      <FaceBase showFeatures={false}/>
      <svg viewBox="0 0 100 100" style={{width:"100%",height:"100%",position:"absolute",inset:0}}>
        <ellipse cx="40" cy="48" rx="3.5" ry="2.5" fill="#FFF"/>
        <ellipse cx="60" cy="48" rx="3.5" ry="2.5" fill="#FFF"/>
        {style==="default" && <path d="M48 52 Q46 64 50 66 Q54 64 52 52" fill="rgba(0,0,0,0.04)" stroke="#9b6d50" strokeWidth="1.4" strokeLinecap="round"/>}
        {style==="small"   && <path d="M49 56 Q48 62 50 64 Q52 62 51 56" fill="rgba(0,0,0,0.04)" stroke="#9b6d50" strokeWidth="1.2" strokeLinecap="round"/>}
        {style==="button"  && <ellipse cx="50" cy="60" rx="4" ry="3" fill="rgba(0,0,0,0.05)" stroke="#9b6d50" strokeWidth="1.2"/>}
        {style==="wide"    && <path d="M44 54 Q42 64 50 66 Q58 64 56 54 Q53 60 47 60Z" fill="rgba(0,0,0,0.05)" stroke="#9b6d50" strokeWidth="1.2" strokeLinecap="round"/>}
        {style==="long"    && <path d="M48 50 Q46 70 50 72 Q54 70 52 50" fill="rgba(0,0,0,0.04)" stroke="#9b6d50" strokeWidth="1.4" strokeLinecap="round"/>}
        {/* nostrils */}
        <ellipse cx={style==="wide"?46:48} cy={style==="long"?68:62} rx="1" ry="0.7" fill="#7a4030"/>
        <ellipse cx={style==="wide"?54:52} cy={style==="long"?68:62} rx="1" ry="0.7" fill="#7a4030"/>
        {/* mouth ref */}
        <path d="M44 76 Q50 78 56 76" stroke="#9B5040" strokeWidth="1.4" fill="none" strokeLinecap="round"/>
      </svg>
    </ThumbBg>
  );
}

// MOUTH shape thumbnail
function MouthShapeThumb({ shape, lipHex = "#C77860" }:{shape:string;lipHex?:string}) {
  return (
    <ThumbBg>
      <FaceBase showFeatures={false}/>
      <svg viewBox="0 0 100 100" style={{width:"100%",height:"100%",position:"absolute",inset:0}}>
        <ellipse cx="40" cy="48" rx="3.5" ry="2.5" fill="#FFF"/>
        <ellipse cx="60" cy="48" rx="3.5" ry="2.5" fill="#FFF"/>
        <path d="M49 58 Q48 64 50 65 Q52 64 51 58" fill="none" stroke="#9b6d50" strokeWidth="1.2"/>
        {shape==="default" && <path d="M40 74 Q50 78 60 74 Q56 72 50 73 Q44 72 40 74Z" fill={lipHex}/>}
        {shape==="smile"   && <><path d="M36 72 Q50 82 64 72 Q56 75 50 75 Q44 75 36 72Z" fill={lipHex}/><path d="M38 72 Q50 76 62 72" stroke={dk(lipHex,0.25)} strokeWidth="0.5" fill="none"/></>}
        {shape==="neutral" && <path d="M42 75 L58 75 Q56 73.5 50 74 Q44 73.5 42 75Z" fill={lipHex}/>}
        {shape==="small"   && <path d="M44 74 Q50 76 56 74 Q53 72.5 50 73 Q47 72.5 44 74Z" fill={lipHex}/>}
        {shape==="full"    && <><path d="M38 72 Q50 76 62 72 Q56 70 50 71 Q44 70 38 72Z" fill={lipHex}/><path d="M38 73 Q50 80 62 73 Q56 78 50 78 Q44 78 38 73Z" fill={dk(lipHex,0.08)}/></>}
      </svg>
    </ThumbBg>
  );
}

// EAR size thumbnail
function EarSizeThumb({ size }:{size:string}) {
  const scale = size==="small"?0.7:size==="large"?1.3:1.0;
  return (
    <ThumbBg>
      <svg viewBox="0 0 100 100" style={{width:"100%",height:"100%",position:"absolute",inset:0}}>
        <ellipse cx="50" cy="55" rx="28" ry="32" fill="#E8A87C"/>
        <ellipse cx={50-22} cy="56" rx={6*scale} ry={9*scale} fill="#E8A87C"/>
        <ellipse cx={50+22} cy="56" rx={6*scale} ry={9*scale} fill="#E8A87C"/>
        <ellipse cx={50-22} cy="56" rx={3*scale} ry={5*scale} fill="#A86040" opacity="0.4"/>
        <ellipse cx={50+22} cy="56" rx={3*scale} ry={5*scale} fill="#A86040" opacity="0.4"/>
        {/* tiny features for context */}
        <ellipse cx="42" cy="50" rx="2" ry="1.5" fill="#FFF"/>
        <ellipse cx="58" cy="50" rx="2" ry="1.5" fill="#FFF"/>
        <path d="M44 65 Q50 67 56 65" stroke="#9B5040" strokeWidth="1" fill="none"/>
      </svg>
    </ThumbBg>
  );
}

// FACE shape thumbnail
function FaceShapeThumb({ shape }:{shape:string}) {
  const path =
    shape==="round"  ? "M50,16 C76,16 84,38 84,54 C84,76 70,90 50,90 C30,90 16,76 16,54 C16,38 24,16 50,16Z" :
    shape==="square" ? "M22,30 L78,30 L82,68 Q82,86 50,90 Q18,86 18,68Z" :
    shape==="heart"  ? "M50,18 C70,18 86,30 86,46 C86,66 68,90 50,92 C32,90 14,66 14,46 C14,30 30,18 50,18Z" :
                       "M50,12 C72,12 82,32 82,52 C82,76 68,92 50,92 C32,92 18,76 18,52 C18,32 28,12 50,12Z"; // oval
  return (
    <ThumbBg>
      <svg viewBox="0 0 100 100" style={{width:"100%",height:"100%",position:"absolute",inset:0}}>
        <path d={path} fill="#E8A87C"/>
        <ellipse cx="40" cy="48" rx="3" ry="2" fill="#FFF"/>
        <ellipse cx="60" cy="48" rx="3" ry="2" fill="#FFF"/>
        <circle cx="40" cy="48" r="1.4" fill="#3a2410"/>
        <circle cx="60" cy="48" r="1.4" fill="#3a2410"/>
        <path d="M44 68 Q50 72 56 68" stroke="#9B5040" strokeWidth="1.4" fill="none" strokeLinecap="round"/>
      </svg>
    </ThumbBg>
  );
}

// FRECKLES thumbnail
function FrecklesThumb({ density }:{density:string}) {
  const dots = density==="heavy"?14:density==="light"?6:0;
  const positions = Array.from({length:dots}).map((_,i) => {
    const angle = (i/dots)*Math.PI*2;
    const r = 5 + Math.random()*8;
    return [50 + Math.cos(angle)*15 + (i%3-1)*4, 50 + Math.sin(angle)*8 + (i%2)*3];
  });
  return (
    <ThumbBg>
      <FaceBase showFeatures={false}/>
      <svg viewBox="0 0 100 100" style={{width:"100%",height:"100%",position:"absolute",inset:0}}>
        <ellipse cx="40" cy="48" rx="3" ry="2" fill="#FFF"/>
        <ellipse cx="60" cy="48" rx="3" ry="2" fill="#FFF"/>
        <circle cx="40" cy="48" r="1.4" fill="#3a2410"/>
        <circle cx="60" cy="48" r="1.4" fill="#3a2410"/>
        <path d="M44 68 Q50 72 56 68" stroke="#9B5040" strokeWidth="1.4" fill="none" strokeLinecap="round"/>
        {positions.map(([x,y],i) => (
          <circle key={i} cx={x} cy={y} r="0.9" fill="#7B3A20" opacity="0.7"/>
        ))}
      </svg>
    </ThumbBg>
  );
}

// FACIAL HAIR thumbnail
function FacialHairThumb({ style, color = "#3A1F10" }:{style:string;color?:string}) {
  return (
    <ThumbBg>
      <FaceBase showFeatures={false}/>
      <svg viewBox="0 0 100 100" style={{width:"100%",height:"100%",position:"absolute",inset:0}}>
        <ellipse cx="40" cy="48" rx="3" ry="2" fill="#FFF"/>
        <ellipse cx="60" cy="48" rx="3" ry="2" fill="#FFF"/>
        {style==="none" && <path d="M44 70 Q50 73 56 70" stroke="#9B5040" strokeWidth="1.4" fill="none" strokeLinecap="round"/>}
        {style==="stubble" && <>
          <path d="M44 70 Q50 72 56 70" stroke="#9B5040" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
          {Array.from({length:18}).map((_,i)=>{
            const x = 32+(i%6)*7; const y = 72+Math.floor(i/6)*4;
            return <circle key={i} cx={x} cy={y} r="0.6" fill={color} opacity="0.55"/>;
          })}
        </>}
        {style==="mustache" && <>
          <path d="M40 66 Q44 62 50 64 Q56 62 60 66 Q56 70 50 68 Q44 70 40 66Z" fill={color}/>
          <path d="M44 74 Q50 76 56 74" stroke="#9B5040" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
        </>}
        {style==="beard-short" && <>
          <path d="M40 66 Q44 64 50 65 Q56 64 60 66" fill={color}/>
          <path d="M38 72 Q42 80 50 82 Q58 80 62 72 Q56 74 50 74 Q44 74 38 72Z" fill={color}/>
        </>}
        {style==="beard-full" && <>
          <path d="M30 66 Q44 60 50 62 Q56 60 70 66 Q72 76 70 84 Q60 92 50 92 Q40 92 30 84 Q28 76 30 66Z" fill={color}/>
          <ellipse cx="50" cy="74" rx="6" ry="3" fill={dk(color,0.15)}/>
        </>}
      </svg>
    </ThumbBg>
  );
}

// EYEWEAR thumbnail
function EyewearThumb({ kind }:{kind:string}) {
  return (
    <ThumbBg>
      <FaceBase/>
      <svg viewBox="0 0 100 100" style={{width:"100%",height:"100%",position:"absolute",inset:0}}>
        {kind==="glasses" && <g>
          <rect x="28" y="44" width="20" height="14" rx="6" fill="rgba(180,210,255,0.18)" stroke="#2a2420" strokeWidth="2"/>
          <rect x="52" y="44" width="20" height="14" rx="6" fill="rgba(180,210,255,0.18)" stroke="#2a2420" strokeWidth="2"/>
          <line x1="48" y1="51" x2="52" y2="51" stroke="#2a2420" strokeWidth="2"/>
        </g>}
        {kind==="sunglasses" && <g>
          <rect x="28" y="44" width="20" height="14" rx="6" fill="#1a1a1a" stroke="#0a0a0a" strokeWidth="2"/>
          <rect x="52" y="44" width="20" height="14" rx="6" fill="#1a1a1a" stroke="#0a0a0a" strokeWidth="2"/>
          <line x1="48" y1="51" x2="52" y2="51" stroke="#0a0a0a" strokeWidth="2"/>
          <path d="M32 47 L40 47" stroke="white" strokeWidth="1" opacity="0.4"/>
          <path d="M56 47 L64 47" stroke="white" strokeWidth="1" opacity="0.4"/>
        </g>}
        {kind==="none" && null}
      </svg>
    </ThumbBg>
  );
}

// HEADWEAR thumbnail
function HeadwearThumb({ kind }:{kind:string}) {
  return (
    <ThumbBg>
      <FaceBase/>
      <svg viewBox="0 0 100 100" style={{width:"100%",height:"100%",position:"absolute",inset:0}}>
        {kind==="hat" && <g>
          <ellipse cx="50" cy="28" rx="32" ry="6" fill="#2A1F10"/>
          <path d="M28 28 Q26 14 50 10 Q74 14 72 28Z" fill="#3A2818"/>
          <ellipse cx="42" cy="20" rx="6" ry="3" fill="#5A3828" opacity="0.7"/>
        </g>}
        {kind==="headband" && <g>
          <rect x="20" y="30" width="60" height="6" rx="3" fill={C.duxOrange}/>
          <rect x="35" y="31" width="30" height="2" rx="1" fill="rgba(255,255,255,0.4)"/>
        </g>}
        {kind==="none" && null}
      </svg>
    </ThumbBg>
  );
}

// OUTFIT thumbnail
function OutfitThumb({ outfit }:{outfit:string}) {
  const colors:Record<string,string> = {
    "bowling-shirt":"#C03018","letterman":"#1A3A8C","jersey":"#186030","polo":"#284888","hoodie":"#282838",
  };
  const c = colors[outfit] ?? "#C03018";
  const cD = dk(c,0.20);
  return (
    <ThumbBg bg="#F4F2EE">
      <svg viewBox="0 0 100 100" style={{width:"100%",height:"100%",position:"absolute",inset:0}}>
        {/* shoulders + body */}
        <path d="M14 50 Q22 38 36 32 Q40 30 44 30 L56 30 Q60 30 64 32 Q78 38 86 50 L86 100 L14 100Z" fill={c}/>
        {/* darker shadow side */}
        <path d="M14 50 Q22 38 36 32 L36 100 L14 100Z" fill={cD} opacity="0.4"/>
        {/* collar v-neck */}
        {outfit==="polo" || outfit==="bowling-shirt" ? (
          <path d="M44 30 L50 42 L56 30 L52 28 L48 28Z" fill={lt(c,0.10)} opacity="0.7"/>
        ) : outfit==="hoodie" ? (
          <path d="M40 30 Q50 40 60 30 L60 26 L40 26Z" fill={cD}/>
        ) : (
          <path d="M44 30 L56 30 L54 36 L46 36Z" fill={cD}/>
        )}
        {/* button strip for bowling shirt */}
        {outfit==="bowling-shirt" && <>
          <line x1="50" y1="40" x2="50" y2="98" stroke={cD} strokeWidth="0.8"/>
          <circle cx="50" cy="56" r="1.2" fill={lt(c,0.30)}/>
          <circle cx="50" cy="68" r="1.2" fill={lt(c,0.30)}/>
          <circle cx="50" cy="80" r="1.2" fill={lt(c,0.30)}/>
        </>}
        {/* letterman badge */}
        {outfit==="letterman" && <text x="50" y="76" textAnchor="middle" fontSize="22" fontWeight="900" fill="#C8A020" fontFamily="Georgia,serif">D</text>}
        {/* jersey number */}
        {outfit==="jersey" && <text x="50" y="78" textAnchor="middle" fontSize="22" fontWeight="900" fill={lt(c,0.30)} fontFamily="Impact,sans-serif">42</text>}
        {/* hoodie strings */}
        {outfit==="hoodie" && <>
          <line x1="46" y1="38" x2="46" y2="58" stroke={lt(c,0.20)} strokeWidth="1"/>
          <line x1="54" y1="38" x2="54" y2="58" stroke={lt(c,0.20)} strokeWidth="1"/>
        </>}
        {/* polo button */}
        {outfit==="polo" && <>
          <line x1="50" y1="42" x2="50" y2="60" stroke={cD} strokeWidth="1"/>
          <circle cx="50" cy="48" r="1" fill={cD}/>
        </>}
      </svg>
    </ThumbBg>
  );
}

// BG color thumbnail
function BgColorThumb({ hex }:{hex:string}) {
  return (
    <div style={{
      width:"100%",height:"100%",borderRadius:"50%",
      background:`radial-gradient(circle at 35% 30%, ${lt(hex,0.18)} 0%, ${hex} 65%, ${dk(hex,0.10)} 100%)`,
    }}/>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// CATEGORY ICONS — monochrome line icons (Memoji-style)
// ═══════════════════════════════════════════════════════════════════════════

const Ico = ({size=22,c="currentColor",children}:{size?:number;c?:string;children:ReactNode}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{children}</svg>
);
const IconSkin    = (p:any)=> <Ico {...p}><circle cx="12" cy="12" r="9"/><path d="M5 16 Q12 14 19 16"/><path d="M9 10 L9.01 10"/><path d="M15 10 L15.01 10"/></Ico>;
const IconHair    = (p:any)=> <Ico {...p}><path d="M5 14 Q5 4 12 4 Q19 4 19 14"/><path d="M7 14 L7 18"/><path d="M17 14 L17 18"/><path d="M9 5 Q12 1 15 5"/></Ico>;
const IconBrows   = (p:any)=> <Ico {...p}><path d="M3 10 Q7 6 11 10"/><path d="M13 10 Q17 6 21 10"/><circle cx="7" cy="14" r="1.5"/><circle cx="17" cy="14" r="1.5"/></Ico>;
const IconEyes    = (p:any)=> <Ico {...p}><ellipse cx="7" cy="12" rx="3" ry="2"/><ellipse cx="17" cy="12" rx="3" ry="2"/><circle cx="7" cy="12" r="1" fill={p?.c||"currentColor"}/><circle cx="17" cy="12" r="1" fill={p?.c||"currentColor"}/></Ico>;
const IconNose    = (p:any)=> <Ico {...p}><path d="M11 5 Q9 12 8 16 Q9 19 12 19 Q15 19 16 16 Q15 12 13 5"/><circle cx="10" cy="17" r="0.8"/><circle cx="14" cy="17" r="0.8"/></Ico>;
const IconMouth   = (p:any)=> <Ico {...p}><path d="M5 12 Q12 16 19 12 Q15 9 12 10 Q9 9 5 12Z"/></Ico>;
const IconEars    = (p:any)=> <Ico {...p}><path d="M9 4 Q5 4 4 8 Q3 14 6 18 Q9 21 11 18"/><path d="M9 9 Q9 14 11 16"/></Ico>;
const IconFace    = (p:any)=> <Ico {...p}><path d="M12 3 C7 3 4 7 4 12 C4 17 7 21 12 21 C17 21 20 17 20 12 C20 7 17 3 12 3Z"/><path d="M9 10 L9.01 10"/><path d="M15 10 L15.01 10"/><path d="M9 16 Q12 18 15 16"/></Ico>;
const IconBeard   = (p:any)=> <Ico {...p}><path d="M7 10 Q12 9 17 10"/><path d="M5 14 Q5 20 12 22 Q19 20 19 14 Q15 13 12 13 Q9 13 5 14Z"/></Ico>;
const IconGlasses = (p:any)=> <Ico {...p}><circle cx="6" cy="13" r="3"/><circle cx="18" cy="13" r="3"/><line x1="9" y1="13" x2="15" y2="13"/></Ico>;
const IconHat     = (p:any)=> <Ico {...p}><path d="M5 10 Q5 4 12 4 Q19 4 19 10"/><line x1="3" y1="11" x2="21" y2="11"/></Ico>;
const IconShirt   = (p:any)=> <Ico {...p}><path d="M7 4 L4 7 L7 9 L9 6 M17 4 L20 7 L17 9 L15 6"/><path d="M9 6 L9 20 L15 20 L15 6"/></Ico>;
const IconBg      = (p:any)=> <Ico {...p}><circle cx="12" cy="12" r="9"/><path d="M3 12 Q6 4 12 4 Q15 9 12 12 Q9 15 3 12Z"/></Ico>;

// ═══════════════════════════════════════════════════════════════════════════
// CATEGORIES
// ═══════════════════════════════════════════════════════════════════════════

type CatId = "skin"|"hair"|"brows"|"eyes"|"face"|"nose"|"mouth"|"ears"|"facial-hair"|"eyewear"|"headwear"|"outfit"|"background";
const CATEGORIES: { id: CatId; label: string; Icon: (p:any)=>ReactNode }[] = [
  {id:"skin",       label:"Skin",        Icon:IconSkin},
  {id:"hair",       label:"Hair",        Icon:IconHair},
  {id:"brows",      label:"Brows",       Icon:IconBrows},
  {id:"eyes",       label:"Eyes",        Icon:IconEyes},
  {id:"face",       label:"Face",        Icon:IconFace},
  {id:"nose",       label:"Nose",        Icon:IconNose},
  {id:"mouth",      label:"Mouth",       Icon:IconMouth},
  {id:"ears",       label:"Ears",        Icon:IconEars},
  {id:"facial-hair",label:"Facial Hair", Icon:IconBeard},
  {id:"eyewear",    label:"Eyewear",     Icon:IconGlasses},
  {id:"headwear",   label:"Headwear",    Icon:IconHat},
  {id:"outfit",     label:"Clothing",    Icon:IconShirt},
  {id:"background", label:"Background",  Icon:IconBg},
];

// ═══════════════════════════════════════════════════════════════════════════
// REUSABLE UI COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

function CategoryPill({active, onClick, Icon, label, mobile}:{active:boolean;onClick:()=>void;Icon:(p:any)=>ReactNode;label:string;mobile:boolean}) {
  const size = mobile ? 44 : 48;
  return (
    <button onClick={onClick} aria-label={label} style={{
      display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:4,
      width:size+8,minWidth:size+8,padding:"6px 4px",
      borderRadius:14,border:"none",
      background:active?C.accentSoft:"transparent",
      color:active?C.accent:C.textMute,
      cursor:"pointer",transition:"all 200ms",
      WebkitTapHighlightColor:"transparent" as any,touchAction:"manipulation",
    }}>
      <div style={{
        width:size,height:size,borderRadius:"50%",
        display:"flex",alignItems:"center",justifyContent:"center",
        background:active?C.accent:"transparent",
        color:active?"#FFF":C.textMute,
        boxShadow:active?`0 4px 12px ${C.accentRing}`:"none",
        transition:"all 200ms",
      }}>
        <Icon size={mobile?22:24} c="currentColor"/>
      </div>
      <span style={{
        fontSize:".62rem",fontWeight:600,letterSpacing:".01em",
        color:active?C.accent:C.textLight,
        whiteSpace:"nowrap",
        opacity: mobile && !active ? 0 : 1,
        height: mobile && !active ? 0 : "auto",
        transition:"all 200ms",
      }}>{label}</span>
    </button>
  );
}

function ThumbCard({ active, onClick, label, children }:{active:boolean;onClick:()=>void;label?:string;children:ReactNode}) {
  return (
    <button onClick={onClick} style={{
      display:"flex",flexDirection:"column",alignItems:"center",gap:6,
      padding:6,borderRadius:18,border:"none",cursor:"pointer",background:"transparent",
      WebkitTapHighlightColor:"transparent" as any,touchAction:"manipulation",
      transition:"transform 180ms",
      transform:active?"scale(1.04)":"scale(1)",
    }}>
      <div style={{
        position:"relative",width:"100%",aspectRatio:"1/1",
        borderRadius:"50%",overflow:"hidden",
        boxShadow:active?`0 0 0 3px ${C.accent},0 4px 14px rgba(0,122,255,0.30)`:"0 1px 3px rgba(0,0,0,0.08)",
        transition:"box-shadow 180ms",
      }}>
        {children}
      </div>
      {label && <span style={{
        fontSize:".74rem",fontWeight:500,letterSpacing:"-.01em",
        color:active?C.accent:C.text,
        textAlign:"center",lineHeight:1.2,
      }}>{label}</span>}
    </button>
  );
}

function ColorSwatch({ hex, active, onClick, size=40 }:{hex:string;active:boolean;onClick:()=>void;size?:number}) {
  return (
    <button onClick={onClick} aria-label={hex} style={{
      width:size,height:size,minWidth:size,padding:0,
      borderRadius:"50%",border:"none",cursor:"pointer",
      background:`radial-gradient(circle at 35% 30%, ${lt(hex,0.22)} 0%, ${hex} 60%, ${dk(hex,0.18)} 100%)`,
      boxShadow:active?`0 0 0 3px #FFF,0 0 0 6px ${C.accent}`:"0 1px 3px rgba(0,0,0,0.10)",
      transition:"transform 150ms,box-shadow 150ms",
      transform:active?"scale(1.05)":"scale(1)",
      WebkitTapHighlightColor:"transparent" as any,touchAction:"manipulation",
      flexShrink:0,
    }}/>
  );
}

function SectionHeader({ children, action }:{children:ReactNode;action?:ReactNode}) {
  return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",margin:"0 0 14px"}}>
      <h3 style={{
        fontSize:".78rem",fontWeight:700,letterSpacing:".06em",textTransform:"uppercase",
        color:C.textMute,margin:0,
      }}>{children}</h3>
      {action}
    </div>
  );
}

// Toggle switch (iOS-style)
function Toggle({ on, onChange, label }:{on:boolean;onChange:(v:boolean)=>void;label?:string}) {
  return (
    <button onClick={()=>onChange(!on)} aria-label={label||""} style={{
      width:51,height:31,borderRadius:31,padding:0,border:"none",cursor:"pointer",position:"relative",
      background:on?"#34C759":"#E9E9EB",transition:"background 220ms",
      WebkitTapHighlightColor:"transparent" as any,
    }}>
      <div style={{
        width:27,height:27,borderRadius:"50%",background:"#FFF",
        position:"absolute",top:2,left:on?22:2,
        boxShadow:"0 3px 8px rgba(0,0,0,0.20),0 1px 1px rgba(0,0,0,0.06)",
        transition:"left 220ms",
      }}/>
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════

export default function AvatarPage() {
  const [state, setState] = useState<AvatarState>(DEFAULTS);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loggedIn, setLoggedIn] = useState<boolean|null>(null);
  const [category, setCategory] = useState<CatId>("skin");
  const { isMobile, isTablet } = useDevice();

  // Load saved avatar
  useEffect(()=>{
    (async()=>{
      try {
        const me = await fetch("/api/auth/me",{cache:"no-store"}).then(r=>r.json());
        if (!me?.user?.id) { setLoggedIn(false); return; }
        setLoggedIn(true);
        const res = await fetch("/api/profile/avatar",{cache:"no-store"});
        const data = await res.json();
        if (data.ok && data.avatar) {
          setState(prev => ({...prev, ...data.avatar}));
        }
      } catch { setLoggedIn(false); }
    })();
  },[]);

  function update<K extends keyof AvatarState>(key: K, val: AvatarState[K]) {
    setState(prev => syncAccessories({ ...prev, [key]: val }));
  }

  async function saveAvatar() {
    setSaving(true);
    try {
      const payload = syncAccessories(state);
      await fetch("/api/profile/avatar",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({avatar:payload}),
      });
      setSaved(true);
      setTimeout(()=>setSaved(false),2500);
    } catch {} finally { setSaving(false); }
  }

  // Auto-clamp facial hair when switching to female
  useEffect(()=>{
    if (state.gender==="female" && state.facialHair!=="none") {
      update("facialHair","none");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[state.gender]);

  const lipHex = LIP_COLORS.find(l=>l.id===state.lipColor)?.hex ?? "#C77860";
  const hairHex = HAIR_COLORS.find(h=>h.id===state.hairColor)?.hex ?? "#5C2E18";
  const eyeHex  = EYE_COLORS.find(e=>e.id===state.eyeColor)?.hex ?? "#4A2C10";

  // ─── Render content for the active category ──────────────────────────
  function renderCategory() {
    switch (category) {
      case "skin": return (
        <>
          {/* Gender toggle */}
          <SectionHeader>Identity</SectionHeader>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:24}}>
            {(["male","female"] as const).map(g => (
              <button key={g} onClick={()=>update("gender",g)} style={{
                padding:"14px 16px",borderRadius:14,border:`2px solid ${state.gender===g?C.accent:C.divider}`,
                background:state.gender===g?C.accentSoft:C.surface,
                color:state.gender===g?C.accent:C.text,
                fontSize:"1rem",fontWeight:600,cursor:"pointer",
                display:"flex",alignItems:"center",justifyContent:"center",gap:8,
                WebkitTapHighlightColor:"transparent" as any,touchAction:"manipulation",
                transition:"all 180ms",
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {g==="male"
                    ? <><circle cx="10" cy="14" r="5"/><line x1="19" y1="5" x2="14.14" y2="9.86"/><polyline points="15 5 19 5 19 9"/></>
                    : <><circle cx="12" cy="8" r="5"/><line x1="12" y1="13" x2="12" y2="21"/><line x1="9" y1="18" x2="15" y2="18"/></>}
                </svg>
                {g==="male"?"Male":"Female"}
              </button>
            ))}
          </div>

          {/* Skin Tone */}
          <SectionHeader>Skin Tone</SectionHeader>
          <div style={{
            display:"flex",flexWrap:"wrap",gap:10,marginBottom:24,justifyContent:"flex-start",
          }}>
            {SKIN_TONES.map((c,i)=>(
              <ColorSwatch key={i} hex={c} active={state.skinToneIdx===i} onClick={()=>update("skinToneIdx",i)} size={42}/>
            ))}
          </div>

          {/* Freckles */}
          <SectionHeader>Freckles</SectionHeader>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
            {FRECKLES_OPTS.map(f => (
              <ThumbCard key={f.id} active={state.freckles===f.id} label={f.label} onClick={()=>update("freckles",f.id as any)}>
                <FrecklesThumb density={f.id}/>
              </ThumbCard>
            ))}
          </div>
        </>
      );

      case "hair": return (
        <>
          <SectionHeader>Hairstyle</SectionHeader>
          <div style={{display:"grid",gridTemplateColumns:isMobile?"repeat(4,1fr)":"repeat(4,1fr)",gap:12,marginBottom:24}}>
            {HAIR_STYLES.map(h => (
              <ThumbCard key={h.id} active={state.hairStyle===h.id} label={h.label} onClick={()=>update("hairStyle",h.id)}>
                <HairStyleThumb style={h.id} color={hairHex}/>
              </ThumbCard>
            ))}
          </div>
          <SectionHeader>Color</SectionHeader>
          <div style={{display:"flex",flexWrap:"wrap",gap:10}}>
            {HAIR_COLORS.map(c => (
              <ColorSwatch key={c.id} hex={c.hex} active={state.hairColor===c.id} onClick={()=>update("hairColor",c.id)} size={42}/>
            ))}
          </div>
        </>
      );

      case "brows": return (
        <>
          <SectionHeader>Brow Style</SectionHeader>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
            {BROW_STYLES.map(b => (
              <ThumbCard key={b.id} active={state.browStyle===b.id} label={b.label} onClick={()=>update("browStyle",b.id)}>
                <BrowStyleThumb style={b.id}/>
              </ThumbCard>
            ))}
          </div>
        </>
      );

      case "eyes": return (
        <>
          <SectionHeader>Eye Shape</SectionHeader>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:24}}>
            {EYE_SHAPES.map(s => (
              <ThumbCard key={s.id} active={state.eyeShape===s.id} label={s.label} onClick={()=>update("eyeShape",s.id)}>
                <EyeShapeThumb shape={s.id} color={eyeHex}/>
              </ThumbCard>
            ))}
          </div>
          <SectionHeader>Color</SectionHeader>
          <div style={{display:"flex",flexWrap:"wrap",gap:10,marginBottom:24}}>
            {EYE_COLORS.map(c => (
              <ColorSwatch key={c.id} hex={c.hex} active={state.eyeColor===c.id} onClick={()=>update("eyeColor",c.id)} size={42}/>
            ))}
          </div>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 16px",background:C.surface,borderRadius:14,boxShadow:C.shadowSm}}>
            <div>
              <div style={{fontSize:"1rem",fontWeight:600,color:C.text}}>Eyelashes</div>
              <div style={{fontSize:".82rem",color:C.textMute,marginTop:2}}>Add long lashes to your eyes</div>
            </div>
            <Toggle on={state.eyelashes} onChange={v=>update("eyelashes",v)}/>
          </div>
        </>
      );

      case "face": return (
        <>
          <SectionHeader>Face Shape</SectionHeader>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
            {FACE_SHAPES.map(f => (
              <ThumbCard key={f.id} active={state.faceShape===f.id} label={f.label} onClick={()=>update("faceShape",f.id)}>
                <FaceShapeThumb shape={f.id}/>
              </ThumbCard>
            ))}
          </div>
        </>
      );

      case "nose": return (
        <>
          <SectionHeader>Nose Style</SectionHeader>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
            {NOSE_STYLES.map(n => (
              <ThumbCard key={n.id} active={state.noseStyle===n.id} label={n.label} onClick={()=>update("noseStyle",n.id)}>
                <NoseStyleThumb style={n.id}/>
              </ThumbCard>
            ))}
          </div>
        </>
      );

      case "mouth": return (
        <>
          <SectionHeader>Mouth Shape</SectionHeader>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:24}}>
            {MOUTH_SHAPES.map(m => (
              <ThumbCard key={m.id} active={state.mouthShape===m.id} label={m.label} onClick={()=>update("mouthShape",m.id)}>
                <MouthShapeThumb shape={m.id} lipHex={lipHex}/>
              </ThumbCard>
            ))}
          </div>
          <SectionHeader>Lip Color</SectionHeader>
          <div style={{display:"flex",flexWrap:"wrap",gap:10}}>
            {LIP_COLORS.map(c => (
              <ColorSwatch key={c.id} hex={c.hex} active={state.lipColor===c.id} onClick={()=>update("lipColor",c.id)} size={42}/>
            ))}
          </div>
        </>
      );

      case "ears": return (
        <>
          <SectionHeader>Ear Size</SectionHeader>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:24}}>
            {EAR_SIZES.map(e => (
              <ThumbCard key={e.id} active={state.earSize===e.id} label={e.label} onClick={()=>update("earSize",e.id)}>
                <EarSizeThumb size={e.id}/>
              </ThumbCard>
            ))}
          </div>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 16px",background:C.surface,borderRadius:14,boxShadow:C.shadowSm}}>
            <div>
              <div style={{fontSize:"1rem",fontWeight:600,color:C.text}}>Earrings</div>
              <div style={{fontSize:".82rem",color:C.textMute,marginTop:2}}>Wear gold hoops</div>
            </div>
            <Toggle on={state.earrings} onChange={v=>update("earrings",v)}/>
          </div>
        </>
      );

      case "facial-hair":
        if (state.gender === "female") {
          return (
            <div style={{textAlign:"center",padding:"40px 20px",color:C.textMute}}>
              <div style={{fontSize:"3rem",marginBottom:12,opacity:0.3}}>✨</div>
              <div style={{fontSize:"1rem",fontWeight:600,color:C.text,marginBottom:6}}>Not for this look</div>
              <div style={{fontSize:".88rem",lineHeight:1.5}}>Switch to Male in Skin to access facial hair styles.</div>
            </div>
          );
        }
        return (
          <>
            <SectionHeader>Facial Hair</SectionHeader>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
              {FACIAL_HAIRS.map(f => (
                <ThumbCard key={f.id} active={state.facialHair===f.id} label={f.label} onClick={()=>update("facialHair",f.id)}>
                  <FacialHairThumb style={f.id} color={dk(hairHex,0.10)}/>
                </ThumbCard>
              ))}
            </div>
          </>
        );

      case "eyewear": return (
        <>
          <SectionHeader>Eyewear</SectionHeader>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
            {EYEWEAR.map(e => (
              <ThumbCard key={e.id} active={state.eyewear===e.id} label={e.label} onClick={()=>update("eyewear",e.id)}>
                <EyewearThumb kind={e.id}/>
              </ThumbCard>
            ))}
          </div>
        </>
      );

      case "headwear": return (
        <>
          <SectionHeader>Headwear</SectionHeader>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
            {HEADWEAR.map(h => (
              <ThumbCard key={h.id} active={state.headwear===h.id} label={h.label} onClick={()=>update("headwear",h.id)}>
                <HeadwearThumb kind={h.id}/>
              </ThumbCard>
            ))}
          </div>
        </>
      );

      case "outfit": return (
        <>
          <SectionHeader>Clothing</SectionHeader>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
            {OUTFITS.map(o => (
              <ThumbCard key={o.id} active={state.outfit===o.id} label={o.label} onClick={()=>update("outfit",o.id)}>
                <OutfitThumb outfit={o.id}/>
              </ThumbCard>
            ))}
          </div>
        </>
      );

      case "background": return (
        <>
          <SectionHeader>Background</SectionHeader>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
            {BG_COLORS.map(c => (
              <ThumbCard key={c} active={state.bgColor===c} onClick={()=>update("bgColor",c)}>
                <BgColorThumb hex={c}/>
              </ThumbCard>
            ))}
          </div>
        </>
      );
    }
  }

  // ─── Layout dimensions ──────────────────────────────────────────────
  const avatarHeight = isMobile ? "46vh" : isTablet ? "50vh" : "62vh";

  return (
    <main style={{
      minHeight:"100vh",height:"100vh",
      background:C.bgGrad,
      display:"flex",flexDirection:"column",
      fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display',Inter,system-ui,sans-serif",
      color:C.text,overflow:"hidden",
    }}>

      {/* ── TOP BAR ── */}
      <div style={{
        flexShrink:0,display:"flex",alignItems:"center",justifyContent:"space-between",
        padding:isMobile?"12px 16px":"14px 24px",
        borderBottom:`1px solid ${C.divider}`,
        background:"rgba(255,255,255,0.85)",
        backdropFilter:"blur(20px)",
        WebkitBackdropFilter:"blur(20px)" as any,
        zIndex:10,
      }}>
        <Link href="/profile" style={{
          fontSize:"1rem",color:C.accent,textDecoration:"none",fontWeight:400,
          padding:"6px 4px",
        }}>
          Cancel
        </Link>
        <div style={{textAlign:"center"}}>
          <div style={{fontSize:isMobile?"1rem":"1.06rem",fontWeight:600,color:C.text,letterSpacing:"-.01em"}}>
            Your Bowler
          </div>
        </div>
        <button onClick={saveAvatar} disabled={saving||!loggedIn} style={{
          fontSize:"1rem",fontWeight:600,
          color:saving||!loggedIn?C.textLight:C.accent,
          background:"none",border:"none",
          cursor:saving||!loggedIn?"default":"pointer",
          padding:"6px 4px",
          display:"flex",alignItems:"center",gap:6,
        }}>
          {saving ? "Saving…" : saved ? <><span style={{color:"#34C759"}}>✓ Done</span></> : "Done"}
        </button>
      </div>

      {/* ── BODY ── */}
      <div style={{flex:1,display:"flex",flexDirection:isMobile||isTablet?"column":"row",overflow:"hidden",minHeight:0}}>

        {/* ── AVATAR PREVIEW ── */}
        <div style={{
          flex:isMobile||isTablet?"0 0 auto":"1 1 auto",
          height:isMobile||isTablet?avatarHeight:"auto",
          minWidth:0,minHeight:0,position:"relative",
          display:"flex",alignItems:"center",justifyContent:"center",
          background:C.bgGrad,
          padding:isMobile?"16px":"24px",
        }}>
          {/* Soft gradient circle backdrop matching bgColor */}
          <div aria-hidden="true" style={{
            position:"absolute",
            width:isMobile?"min(82vw,360px)":"min(56vh,460px)",
            height:isMobile?"min(82vw,360px)":"min(56vh,460px)",
            borderRadius:"50%",
            background:`radial-gradient(circle at 50% 35%, ${lt(state.bgColor,0.18)} 0%, ${state.bgColor} 65%, ${dk(state.bgColor,0.10)} 100%)`,
            boxShadow:"0 24px 60px rgba(0,0,0,0.18),inset 0 -10px 40px rgba(0,0,0,0.12)",
          }}/>
          {/* 3D avatar on top of backdrop */}
          <div style={{
            position:"relative",
            width:isMobile?"min(82vw,360px)":"min(56vh,460px)",
            height:isMobile?"min(82vw,360px)":"min(56vh,460px)",
            zIndex:1,
          }}>
            <Canvas
              style={{ width:"100%", height:"100%", background:"transparent" }}
              gl={{ alpha:true, antialias:true }}
              camera={{ position:[0, -0.18, 3.6], fov:50 }}
              shadows
            >
              <ambientLight intensity={0.55} />
              <directionalLight position={[2, 4, 3]} intensity={1.4} castShadow />
              <directionalLight position={[-2, 1, -2]} intensity={0.45} color="#b8d4ff" />
              <BowlerCharacter3D state={syncAccessories(state)} />
              <OrbitControls
                enablePan={false}
                enableZoom={false}
                minPolarAngle={Math.PI * 0.28}
                maxPolarAngle={Math.PI * 0.68}
                target={[0, -0.18, 0]}
              />
            </Canvas>
          </div>
        </div>

        {/* ── BOTTOM SHEET (mobile/tablet) or RIGHT PANEL (desktop) ── */}
        <div style={{
          flex:isMobile||isTablet?"1 1 auto":"0 0 460px",
          background:C.surface,
          borderTop:isMobile||isTablet?`1px solid ${C.divider}`:"none",
          borderLeft:isMobile||isTablet?"none":`1px solid ${C.divider}`,
          borderTopLeftRadius:isMobile||isTablet?22:0,
          borderTopRightRadius:isMobile||isTablet?22:0,
          boxShadow:isMobile||isTablet?"0 -8px 28px rgba(0,0,0,0.08)":"none",
          display:"flex",flexDirection:"column",
          minHeight:0,minWidth:0,overflow:"hidden",position:"relative",
        }}>
          {/* Drag indicator (mobile) */}
          {(isMobile||isTablet) && (
            <div aria-hidden="true" style={{
              width:36,height:5,borderRadius:3,background:"#D1D1D6",
              margin:"8px auto 4px",flexShrink:0,
            }}/>
          )}

          {/* Category strip */}
          <div style={{
            flexShrink:0,
            padding:isMobile?"6px 8px 8px":"10px 8px 10px",
            borderBottom:`1px solid ${C.divider}`,
            background:C.surface,
          }}>
            <div style={{
              display:"flex",overflowX:"auto",WebkitOverflowScrolling:"touch" as any,
              gap:2,scrollbarWidth:"none",
              padding:"2px 0",
            }} className="memoji-cat-strip">
              {CATEGORIES.map(c => (
                <CategoryPill
                  key={c.id}
                  active={category===c.id}
                  onClick={()=>setCategory(c.id)}
                  Icon={c.Icon}
                  label={c.label}
                  mobile={isMobile}
                />
              ))}
            </div>
          </div>

          {/* Options content */}
          <div style={{
            flex:1,overflowY:"auto",WebkitOverflowScrolling:"touch" as any,
            padding:isMobile?"18px 18px 32px":"22px 24px 32px",
            background:C.surfaceMuted,
          }}>
            {renderCategory()}
            {/* Reset button at bottom */}
            <div style={{marginTop:32,paddingTop:20,borderTop:`1px solid ${C.divider}`}}>
              <button onClick={()=>setState(DEFAULTS)} style={{
                width:"100%",padding:"14px",borderRadius:14,
                border:"none",background:C.surface,
                color:C.red,fontSize:"1rem",fontWeight:500,
                cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8,
                boxShadow:C.shadowSm,
                WebkitTapHighlightColor:"transparent" as any,touchAction:"manipulation",
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.32"/></svg>
                Reset to Default
              </button>
              {!loggedIn && (
                <div style={{
                  marginTop:14,padding:"12px 16px",
                  background:"rgba(255,149,0,0.10)",border:"1px solid rgba(255,149,0,0.25)",
                  borderRadius:12,
                  fontSize:".85rem",color:"#995500",textAlign:"center",
                }}>
                  Log in to save your bowler.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .memoji-cat-strip::-webkit-scrollbar { display: none; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-thumb { background: rgba(60,60,67,0.20); border-radius: 3px; }
        ::-webkit-scrollbar-track { background: transparent; }
        button { font-family: inherit; }
        button:focus-visible { outline: 2px solid ${C.accent}; outline-offset: 2px; }
      `}</style>
    </main>
  );
}
