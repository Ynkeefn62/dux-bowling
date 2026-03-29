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

// ── Skin tone spectrum (light → deep, 12 stops) ───────────────
const SKIN_TONES = [
  "#FDDBB4","#F8CDA0","#F0BC8A","#E8A87C",
  "#D4906A","#C07858","#A86040","#8C4A2C",
  "#7A3A20","#5C2810","#3E1808","#2A0E04",
];

// ── Hair colors ───────────────────────────────────────────────
const HAIR_COLORS = [
  { id:"blonde",   hex:"#D4B483", label:"Blonde" },
  { id:"brown",    hex:"#6B3A2A", label:"Brown"  },
  { id:"black",    hex:"#1A1008", label:"Black"  },
  { id:"red",      hex:"#8B2500", label:"Red"    },
  { id:"auburn",   hex:"#6B2A1C", label:"Auburn" },
  { id:"gray",     hex:"#8A8A8A", label:"Gray"   },
  { id:"white",    hex:"#E8E8E0", label:"White"  },
  { id:"platinum", hex:"#D4D4C8", label:"Platinum"},
];

// ── Eye colors ────────────────────────────────────────────────
const EYE_COLORS = [
  { id:"brown", hex:"#5C3D1E" },
  { id:"blue",  hex:"#3A7CC0" },
  { id:"green", hex:"#3A7040" },
  { id:"hazel", hex:"#7A6040" },
  { id:"gray",  hex:"#708090" },
  { id:"amber", hex:"#B87820" },
];

// ── Avatar state ──────────────────────────────────────────────
type AvatarState = {
  skinToneIdx:  number;    // 0-11
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
  faceShape:   "round",
  facialHair:  "none",
  outfit:      "bowling-shirt",
  accessories: [],
  bgColor:     "#e46a2e",
};

const HAIR_STYLES = [
  { id:"pompadour",  label:"Pompadour" },
  { id:"short",      label:"Short"     },
  { id:"buzz",       label:"Buzz Cut"  },
  { id:"bob",        label:"Bob"       },
  { id:"long",       label:"Long"      },
  { id:"curly",      label:"Curly"     },
  { id:"bun",        label:"Bun"       },
  { id:"bald",       label:"Bald"      },
];

const FACE_SHAPES = [
  { id:"round",  label:"Round"  },
  { id:"oval",   label:"Oval"   },
  { id:"square", label:"Square" },
  { id:"heart",  label:"Heart"  },
];

const FACIAL_HAIR = [
  { id:"none",        label:"None"          },
  { id:"stubble",     label:"Stubble"       },
  { id:"mustache",    label:"Mustache"      },
  { id:"beard-short", label:"Short Beard"   },
  { id:"beard-full",  label:"Full Beard"    },
];

const OUTFITS = [
  { id:"bowling-shirt", label:"Bowling Shirt" },
  { id:"letterman",     label:"Letterman"     },
  { id:"jersey",        label:"Jersey"        },
  { id:"polo",          label:"Polo"          },
  { id:"hoodie",        label:"Hoodie"        },
];

const ACCESSORIES_LIST = [
  { id:"glasses",    label:"Glasses"     },
  { id:"sunglasses", label:"Sunglasses"  },
  { id:"hat",        label:"Cap"         },
  { id:"headband",   label:"Headband"    },
  { id:"earrings",   label:"Earrings"    },
];

const BG_COLORS = [
  "#e46a2e","#2563eb","#16a34a","#dc2626",
  "#7c3aed","#db2777","#0891b2","#ca8a04",
  "#374151","#1c1c1c",
];

// ── SVG Avatar renderer ───────────────────────────────────────
// Draws a full character entirely in SVG — no external image files.
function AvatarSVG({ state, size = 320 }: { state: AvatarState; size?: number }) {
  const skin = SKIN_TONES[state.skinToneIdx];
  const hair = HAIR_COLORS.find(h => h.id === state.hairColor)?.hex ?? "#6B3A2A";
  const eye  = EYE_COLORS.find(e => e.id === state.eyeColor)?.hex ?? "#5C3D1E";

  // Derived shades
  const skinShadow  = darken(skin, 0.18);
  const skinLight   = lighten(skin, 0.12);
  const hairDark    = darken(hair, 0.22);

  // Face shape params
  const faceRx = state.faceShape === "square" ? 28 : state.faceShape === "heart" ? 70 : state.faceShape === "oval" ? 55 : 65;
  const faceRy = state.faceShape === "oval" ? 75 : 65;

  const showHair = state.hairStyle !== "bald";

  return (
    <svg viewBox="0 0 320 380" width={size} height={size * 380/320} xmlns="http://www.w3.org/2000/svg" style={{ display: "block", overflow: "visible" }}>
      {/* Background circle */}
      <circle cx="160" cy="190" r="155" fill={state.bgColor} opacity="0.18" />

      {/* ── BODY / OUTFIT ── */}
      <Outfit id={state.outfit} skin={skin} skinShadow={skinShadow} hair={hair} />

      {/* ── NECK ── */}
      <rect x="138" y="248" width="44" height="38" rx="8" fill={skin} />
      <rect x="145" y="248" width="8" height="35" rx="4" fill={skinShadow} opacity="0.3" />

      {/* ── HEAD ── */}
      {/* Back hair (behind head) */}
      {showHair && state.hairStyle !== "buzz" && state.hairStyle !== "short" && (
        <BackHair id={state.hairStyle} hair={hair} hairDark={hairDark} />
      )}

      {/* Head shape */}
      <ellipse cx="160" cy="175" rx={faceRx} ry={faceRy} fill={skin} />
      {/* Cheek highlights */}
      <ellipse cx="126" cy="188" rx="16" ry="10" fill={skinLight} opacity="0.35" />
      <ellipse cx="194" cy="188" rx="16" ry="10" fill={skinLight} opacity="0.35" />
      {/* Face shadow (chin area) */}
      <ellipse cx="160" cy="230" rx="38" ry="14" fill={skinShadow} opacity="0.18" />

      {/* ── EARS ── */}
      <Ear side="left"  skin={skin} skinShadow={skinShadow} />
      <Ear side="right" skin={skin} skinShadow={skinShadow} />

      {/* ── EYES ── */}
      <Eye side="left"  eyeColor={eye} />
      <Eye side="right" eyeColor={eye} />

      {/* ── EYEBROWS ── */}
      <Eyebrow side="left"  hair={hair} style={state.hairStyle} />
      <Eyebrow side="right" hair={hair} style={state.hairStyle} />

      {/* ── NOSE ── */}
      <Nose skin={skin} skinShadow={skinShadow} />

      {/* ── MOUTH ── */}
      <Mouth skin={skin} />

      {/* ── FRONT HAIR ── */}
      {showHair && <FrontHair id={state.hairStyle} hair={hair} hairDark={hairDark} />}

      {/* ── FACIAL HAIR ── */}
      {state.facialHair !== "none" && (
        <FacialHair id={state.facialHair} hair={hair} hairDark={hairDark} skin={skin} />
      )}

      {/* ── ACCESSORIES ── */}
      {state.accessories.includes("glasses")    && <Glasses />}
      {state.accessories.includes("sunglasses") && <Sunglasses />}
      {state.accessories.includes("hat")        && <Cap hair={hair} hairDark={hairDark} />}
      {state.accessories.includes("headband")   && <Headband />}
      {state.accessories.includes("earrings")   && <Earrings skin={skin} />}
    </svg>
  );
}

// ── SVG sub-components ─────────────────────────────────────────

function Ear({ side, skin, skinShadow }: { side: "left"|"right"; skin: string; skinShadow: string }) {
  const x = side === "left" ? 93 : 219;
  return (
    <g>
      <ellipse cx={x} cy="178" rx="11" ry="15" fill={skin} />
      <ellipse cx={side === "left" ? x+3 : x-3} cy="178" rx="5" ry="9" fill={skinShadow} opacity="0.25" />
    </g>
  );
}

function Eye({ side, eyeColor }: { side: "left"|"right"; eyeColor: string }) {
  const cx = side === "left" ? 138 : 182;
  return (
    <g>
      {/* White */}
      <ellipse cx={cx} cy="170" rx="13" ry="10" fill="white" />
      {/* Iris */}
      <circle cx={cx} cy="171" r="7" fill={eyeColor} />
      {/* Pupil */}
      <circle cx={cx} cy="171" r="3.5" fill="#0a0a0a" />
      {/* Highlight */}
      <circle cx={cx+3} cy="168" r="2" fill="white" opacity="0.9" />
      {/* Lashes top */}
      <path d={`M${cx-12},163 Q${cx},158 ${cx+12},163`} stroke="#1a1008" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      {/* Lower lid */}
      <path d={`M${cx-11},177 Q${cx},181 ${cx+11},177`} stroke={eyeColor} strokeWidth="1" fill="none" opacity="0.4" />
    </g>
  );
}

function Eyebrow({ side, hair, style }: { side: "left"|"right"; hair: string; style: string }) {
  const cx = side === "left" ? 138 : 182;
  const thick = style === "buzz" || style === "short" ? 4 : 3;
  return (
    <path
      d={`M${cx-14},155 Q${cx},${style === "buzz" ? 149 : 151} ${cx+14},155`}
      stroke={hair}
      strokeWidth={thick}
      fill="none"
      strokeLinecap="round"
    />
  );
}

function Nose({ skin, skinShadow }: { skin: string; skinShadow: string }) {
  return (
    <g>
      <path d="M155,185 Q152,205 148,210 Q158,215 172,210 Q168,205 165,185" fill={skinShadow} opacity="0.22" />
      <ellipse cx="153" cy="211" rx="5" ry="3.5" fill={skinShadow} opacity="0.35" />
      <ellipse cx="167" cy="211" rx="5" ry="3.5" fill={skinShadow} opacity="0.35" />
    </g>
  );
}

function Mouth({ skin }: { skin: string }) {
  const lipTop = darken(skin, 0.25);
  return (
    <g>
      {/* Upper lip */}
      <path d="M142,228 Q151,223 160,225 Q169,223 178,228 Q169,232 160,231 Q151,232 142,228Z" fill={lipTop} />
      {/* Lower lip */}
      <path d="M143,229 Q160,238 177,229 Q169,235 160,236 Q151,235 143,229Z" fill={darken(skin, 0.18)} />
      {/* Smile line */}
      <path d="M145,228 Q160,232 175,228" stroke={darken(skin, 0.32)} strokeWidth="1" fill="none" opacity="0.5" />
      {/* Teeth hint */}
      <path d="M148,229 Q160,234 172,229 Q165,233 160,233 Q155,233 148,229Z" fill="white" opacity="0.6" />
    </g>
  );
}

function BackHair({ id, hair, hairDark }: { id: string; hair: string; hairDark: string }) {
  if (id === "long") return (
    <g>
      <ellipse cx="160" cy="240" rx="62" ry="80" fill={hair} />
      <ellipse cx="100" cy="200" rx="20" ry="60" fill={hair} />
      <ellipse cx="220" cy="200" rx="20" ry="60" fill={hair} />
    </g>
  );
  if (id === "bob") return (
    <ellipse cx="160" cy="220" rx="68" ry="55" fill={hair} />
  );
  if (id === "curly") return (
    <ellipse cx="160" cy="210" rx="75" ry="65" fill={hair} />
  );
  if (id === "bun") return (
    <ellipse cx="160" cy="185" rx="30" ry="28" fill={hair} />
  );
  return null;
}

function FrontHair({ id, hair, hairDark }: { id: string; hair: string; hairDark: string }) {
  if (id === "bald") return null;

  if (id === "pompadour") return (
    <g>
      {/* Top volume */}
      <ellipse cx="160" cy="118" rx="55" ry="42" fill={hair} />
      {/* Front swoop */}
      <path d="M105,145 Q115,108 160,102 Q205,108 215,145 Q190,125 160,120 Q130,125 105,145Z" fill={hairDark} />
      {/* Pomp curl */}
      <path d="M130,112 Q160,95 185,112 Q170,100 160,98 Q150,100 130,112Z" fill={hair} opacity="0.7" />
      {/* Side part */}
      <path d="M125,138 Q130,120 140,112" stroke={hairDark} strokeWidth="2" fill="none" opacity="0.5" />
    </g>
  );

  if (id === "short") return (
    <g>
      <ellipse cx="160" cy="122" rx="58" ry="32" fill={hair} />
      <path d="M102,148 Q108,118 160,112 Q212,118 218,148 Q195,135 160,132 Q125,135 102,148Z" fill={hairDark} opacity="0.7" />
    </g>
  );

  if (id === "buzz") return (
    <g>
      <ellipse cx="160" cy="128" rx="60" ry="28" fill={hair} opacity="0.85" />
      <path d="M100,152 Q106,130 160,124 Q214,130 220,152 Q200,140 160,138 Q120,140 100,152Z" fill={hair} />
      {/* Texture dots */}
      {[120,140,160,180,200].map(x => (
        <circle key={x} cx={x} cy={133} r="1.5" fill={hairDark} opacity="0.4" />
      ))}
    </g>
  );

  if (id === "bob") return (
    <g>
      <ellipse cx="160" cy="115" rx="65" ry="35" fill={hair} />
      <path d="M95,155 Q98,120 160,110 Q222,120 225,155 Q200,138 160,135 Q120,138 95,155Z" fill={hairDark} opacity="0.5" />
    </g>
  );

  if (id === "long") return (
    <g>
      <ellipse cx="160" cy="115" rx="60" ry="36" fill={hair} />
      <path d="M100,148 Q106,115 160,108 Q214,115 220,148 Q195,132 160,128 Q125,132 100,148Z" fill={hairDark} opacity="0.45" />
    </g>
  );

  if (id === "curly") return (
    <g>
      {/* Curly clusters */}
      {[
        [130,118,22],[155,108,24],[180,116,22],
        [115,138,18],[165,128,18],[200,135,16],
      ].map(([cx,cy,r],i) => (
        <circle key={i} cx={cx} cy={cy} r={r} fill={i%2===0 ? hair : hairDark} opacity="0.9" />
      ))}
    </g>
  );

  if (id === "bun") return (
    <g>
      <ellipse cx="160" cy="115" rx="58" ry="25" fill={hair} />
      {/* Bun on top */}
      <circle cx="160" cy="98" r="22" fill={hair} />
      <circle cx="160" cy="98" r="16" fill={hairDark} opacity="0.3" />
      {/* Bun band */}
      <ellipse cx="160" cy="112" rx="22" ry="5" fill={hairDark} opacity="0.5" />
    </g>
  );

  return null;
}

function FacialHair({ id, hair, hairDark, skin }: { id: string; hair: string; hairDark: string; skin: string }) {
  if (id === "stubble") return (
    <g opacity="0.55">
      {[145,152,160,168,175].map(x =>
        [225,230,234].map(y => (
          <circle key={`${x}${y}`} cx={x+(Math.sin(x*y)*2)} cy={y} r="1.2" fill={hair} />
        ))
      )}
    </g>
  );

  if (id === "mustache") return (
    <path d="M144,222 Q152,216 160,218 Q168,216 176,222 Q168,226 160,224 Q152,226 144,222Z" fill={hair} />
  );

  if (id === "beard-short") return (
    <g>
      <path d="M144,222 Q152,216 160,218 Q168,216 176,222 Q168,226 160,224 Q152,226 144,222Z" fill={hair} />
      <path d="M130,225 Q135,245 160,252 Q185,245 190,225 Q178,238 160,241 Q142,238 130,225Z" fill={hair} opacity="0.85" />
    </g>
  );

  if (id === "beard-full") return (
    <g>
      <path d="M144,222 Q152,214 160,216 Q168,214 176,222 Q170,218 160,220 Q150,218 144,222Z" fill={hair} />
      <path d="M125,220 Q128,250 160,262 Q192,250 195,220 Q185,245 160,248 Q135,245 125,220Z" fill={hair} />
      <path d="M128,222 Q130,218 136,215" stroke={hairDark} strokeWidth="1.5" fill="none" opacity="0.5" />
      <path d="M192,222 Q190,218 184,215" stroke={hairDark} strokeWidth="1.5" fill="none" opacity="0.5" />
    </g>
  );

  return null;
}

function Outfit({ id, skin, skinShadow, hair }: { id: string; skin: string; skinShadow: string; hair: string }) {
  const shirtColor = id === "bowling-shirt" ? "#c8381a"
    : id === "letterman" ? "#1a3a8f"
    : id === "jersey" ? "#1a6a2a"
    : id === "polo" ? "#2a5090"
    : "#2a2a3a";

  const accentColor = id === "letterman" ? "#c8a020"
    : id === "bowling-shirt" ? "#f4e6a0"
    : "#ffffff";

  return (
    <g>
      {/* Shoulders / body */}
      <path d={`M80,290 Q80,265 100,258 L130,250 Q145,280 160,282 Q175,280 190,250 L220,258 Q240,265 240,290 L240,380 L80,380Z`} fill={shirtColor} />

      {/* Collar area */}
      <path d="M145,250 Q160,270 175,250 Q170,258 160,262 Q150,258 145,250Z" fill={lighten(shirtColor, 0.15)} />

      {/* Outfit-specific details */}
      {id === "bowling-shirt" && (
        <>
          <path d="M160,262 L160,340" stroke={accentColor} strokeWidth="1.5" opacity="0.4" />
          <circle cx="160" cy="280" r="3" fill={accentColor} opacity="0.6" />
          <circle cx="160" cy="298" r="3" fill={accentColor} opacity="0.6" />
          <circle cx="160" cy="316" r="3" fill={accentColor} opacity="0.6" />
          {/* Bowling pin graphic on chest */}
          <ellipse cx="130" cy="290" rx="8" ry="12" fill={accentColor} opacity="0.25" />
        </>
      )}

      {id === "letterman" && (
        <>
          {/* Stripe on sleeves */}
          <path d="M80,290 L80,310 Q88,310 88,290Z" fill={accentColor} opacity="0.7" />
          <path d="M240,290 L240,310 Q232,310 232,290Z" fill={accentColor} opacity="0.7" />
          {/* Letter D */}
          <text x="148" y="296" fontSize="22" fontWeight="900" fill={accentColor} opacity="0.8" fontFamily="serif">D</text>
        </>
      )}

      {id === "jersey" && (
        <>
          <path d="M80,270 L240,270" stroke={accentColor} strokeWidth="3" opacity="0.35" />
          <path d="M80,285 L240,285" stroke={accentColor} strokeWidth="3" opacity="0.25" />
          <text x="140" y="315" fontSize="28" fontWeight="900" fill={accentColor} opacity="0.5" fontFamily="sans-serif">42</text>
        </>
      )}

      {id === "hoodie" && (
        <>
          {/* Hood outline */}
          <path d="M120,250 Q105,240 108,258" stroke={lighten(shirtColor, 0.2)} strokeWidth="2" fill="none" opacity="0.6" />
          <path d="M200,250 Q215,240 212,258" stroke={lighten(shirtColor, 0.2)} strokeWidth="2" fill="none" opacity="0.6" />
          {/* Pocket */}
          <rect x="138" y="310" width="44" height="28" rx="6" fill={darken(shirtColor, 0.12)} opacity="0.55" />
          {/* Drawstrings */}
          <line x1="152" y1="258" x2="148" y2="280" stroke={accentColor} strokeWidth="1.5" opacity="0.4" />
          <line x1="168" y1="258" x2="172" y2="280" stroke={accentColor} strokeWidth="1.5" opacity="0.4" />
        </>
      )}

      {id === "polo" && (
        <>
          {/* Collar */}
          <path d="M140,250 L148,268 L160,262 L172,268 L180,250 L174,256 L160,260 L146,256Z" fill={lighten(shirtColor, 0.2)} />
          {/* Buttons */}
          <circle cx="160" cy="272" r="2.5" fill={accentColor} opacity="0.6" />
          <circle cx="160" cy="282" r="2.5" fill={accentColor} opacity="0.6" />
        </>
      )}

      {/* Arms */}
      <path d="M80,290 Q72,310 78,340 L100,338 Q96,312 100,290Z" fill={shirtColor} />
      <path d="M240,290 Q248,310 242,340 L220,338 Q224,312 220,290Z" fill={shirtColor} />
      {/* Hands */}
      <ellipse cx="86" cy="344" rx="14" ry="16" fill={skin} />
      <ellipse cx="234" cy="344" rx="14" ry="16" fill={skin} />
    </g>
  );
}

function Glasses() {
  return (
    <g>
      <rect x="118" y="162" width="36" height="22" rx="8" fill="none" stroke="#2a2a2a" strokeWidth="2.5" />
      <rect x="166" y="162" width="36" height="22" rx="8" fill="none" stroke="#2a2a2a" strokeWidth="2.5" />
      <line x1="154" y1="173" x2="166" y2="173" stroke="#2a2a2a" strokeWidth="2" />
      <line x1="104" y1="170" x2="118" y2="170" stroke="#2a2a2a" strokeWidth="2" />
      <line x1="202" y1="170" x2="216" y2="170" stroke="#2a2a2a" strokeWidth="2" />
      <rect x="119" y="163" width="34" height="20" rx="7" fill="rgba(160,200,255,0.18)" />
      <rect x="167" y="163" width="34" height="20" rx="7" fill="rgba(160,200,255,0.18)" />
    </g>
  );
}

function Sunglasses() {
  return (
    <g>
      <rect x="116" y="163" width="40" height="20" rx="8" fill="#111" stroke="#333" strokeWidth="1.5" />
      <rect x="164" y="163" width="40" height="20" rx="8" fill="#111" stroke="#333" strokeWidth="1.5" />
      <line x1="156" y1="173" x2="164" y2="173" stroke="#333" strokeWidth="2" />
      <line x1="102" y1="170" x2="116" y2="170" stroke="#333" strokeWidth="2" />
      <line x1="204" y1="170" x2="218" y2="170" stroke="#333" strokeWidth="2" />
      {/* Tint glare */}
      <path d="M120,166 L130,166 L126,172Z" fill="white" opacity="0.1" />
      <path d="M168,166 L178,166 L174,172Z" fill="white" opacity="0.1" />
    </g>
  );
}

function Cap({ hair, hairDark }: { hair: string; hairDark: string }) {
  return (
    <g>
      {/* Bill */}
      <ellipse cx="160" cy="117" rx="72" ry="18" fill={hairDark} />
      {/* Crown */}
      <path d="M95,117 Q98,75 160,68 Q222,75 225,117Z" fill={hair} />
      <path d="M95,117 Q98,75 160,68 Q222,75 225,117" stroke={hairDark} strokeWidth="2" fill="none" opacity="0.3" />
      {/* Button on top */}
      <circle cx="160" cy="70" r="5" fill={hairDark} />
      {/* Brim front */}
      <path d="M95,118 Q110,135 160,138 Q210,135 225,118" fill={darken(hair, 0.2)} />
      {/* Sweatband */}
      <path d="M95,117 Q160,122 225,117" stroke={darken(hair, 0.15)} strokeWidth="4" fill="none" opacity="0.5" />
    </g>
  );
}

function Headband() {
  return (
    <g>
      <path d="M98,150 Q160,140 222,150 Q222,158 160,148 Q98,158 98,150Z" fill="#e46a2e" />
      <path d="M100,152 Q160,142 220,152" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" fill="none" />
    </g>
  );
}

function Earrings({ skin }: { skin: string }) {
  return (
    <g>
      <circle cx="93" cy="187" r="5" fill="#D4AF37" />
      <circle cx="93" cy="187" r="3" fill="#F5D060" />
      <circle cx="227" cy="187" r="5" fill="#D4AF37" />
      <circle cx="227" cy="187" r="3" fill="#F5D060" />
    </g>
  );
}

// ── Color helpers ─────────────────────────────────────────────
function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  return [r,g,b];
}
function rgbToHex(r: number, g: number, b: number): string {
  return "#" + [r,g,b].map(v => Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,"0")).join("");
}
function darken(hex: string, amount: number): string {
  const [r,g,b] = hexToRgb(hex);
  return rgbToHex(r*(1-amount), g*(1-amount), b*(1-amount));
}
function lighten(hex: string, amount: number): string {
  const [r,g,b] = hexToRgb(hex);
  return rgbToHex(r+(255-r)*amount, g+(255-g)*amount, b+(255-b)*amount);
}

// ── Control components ────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "1.25rem" }}>
      <div style={{ fontSize: ".72rem", fontWeight: 900, color: MUTED, letterSpacing: ".08em", textTransform: "uppercase", marginBottom: ".6rem" }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function ChipGrid({ children }: { children: React.ReactNode }) {
  return <div style={{ display: "flex", flexWrap: "wrap", gap: ".4rem" }}>{children}</div>;
}

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      padding: ".4rem .85rem", borderRadius: 999,
      border: `1px solid ${active ? ORANGE : BORDER}`,
      background: active ? ORANGE_SOFT : "rgba(0,0,0,0.2)",
      color: active ? ORANGE : MUTED,
      fontWeight: 900, fontSize: ".78rem", cursor: "pointer",
      fontFamily: "Montserrat, system-ui",
      transition: "all 120ms",
    }}>
      {label}
    </button>
  );
}

function ColorDot({ hex, active, onClick, label }: { hex: string; active: boolean; onClick: () => void; label?: string }) {
  return (
    <button
      onClick={onClick}
      title={label}
      style={{
        width: 30, height: 30, borderRadius: "50%",
        background: hex,
        border: `3px solid ${active ? ORANGE : "transparent"}`,
        outline: active ? `2px solid ${ORANGE}` : "none",
        outlineOffset: 2,
        cursor: "pointer", padding: 0,
        boxShadow: "0 2px 6px rgba(0,0,0,0.4)",
        transition: "transform 120ms",
        transform: active ? "scale(1.15)" : "scale(1)",
      }}
    />
  );
}

// ── Skin tone slider ──────────────────────────────────────────
function SkinSlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const gradient = `linear-gradient(to right, ${SKIN_TONES.join(",")})`;
  return (
    <div>
      <div style={{ position: "relative", height: 32, display: "flex", alignItems: "center" }}>
        {/* Track */}
        <div style={{
          position: "absolute", left: 0, right: 0, height: 18,
          borderRadius: 999, background: gradient,
          boxShadow: "inset 0 2px 4px rgba(0,0,0,0.3)",
        }} />
        {/* Native range input overlaid */}
        <input
          type="range" min={0} max={SKIN_TONES.length - 1} step={1}
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          style={{
            position: "relative", width: "100%", height: 18,
            appearance: "none", background: "transparent", cursor: "pointer",
            zIndex: 1,
          }}
        />
      </div>
      {/* Preview swatch */}
      <div style={{ display: "flex", alignItems: "center", gap: ".6rem", marginTop: ".4rem" }}>
        <div style={{ width: 22, height: 22, borderRadius: "50%", background: SKIN_TONES[value], border: `2px solid ${BORDER}` }} />
        <span style={{ fontSize: ".72rem", color: MUTED }}>
          {value <= 2 ? "Fair" : value <= 4 ? "Light" : value <= 6 ? "Medium" : value <= 8 ? "Tan" : value <= 10 ? "Deep" : "Rich"}
        </span>
      </div>
    </div>
  );
}

// ── Toggle accessory ──────────────────────────────────────────
function toggleAccessory(state: AvatarState, id: string): string[] {
  return state.accessories.includes(id)
    ? state.accessories.filter(a => a !== id)
    : [...state.accessories, id];
}

// ── Mutually exclusive accessories ───────────────────────────
const GLASS_IDS = ["glasses", "sunglasses"];

function safeToggleAccessory(state: AvatarState, id: string): string[] {
  let next = toggleAccessory(state, id);
  // Glasses and sunglasses are mutually exclusive
  if (GLASS_IDS.includes(id) && state.accessories.includes(id) === false) {
    next = next.filter(a => !GLASS_IDS.includes(a) || a === id);
  }
  return next;
}

// ── Main page ─────────────────────────────────────────────────
export default function AvatarPage() {
  const [state, setState]   = useState<AvatarState>(DEFAULTS);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);

  // Load saved avatar from Supabase on mount
  useEffect(() => {
    (async () => {
      try {
        const me = await fetch("/api/auth/me", { cache: "no-store" }).then(r => r.json());
        if (!me?.user?.id) { setLoggedIn(false); return; }
        setLoggedIn(true);

        const res = await fetch("/api/profile/avatar", { cache: "no-store" });
        const data = await res.json();
        if (data.ok && data.avatar) {
          setState(prev => ({ ...prev, ...data.avatar }));
        }
      } catch { setLoggedIn(false); }
    })();
  }, []);

  async function saveAvatar() {
    setSaving(true);
    try {
      await fetch("/api/profile/avatar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatar: state }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {}
    finally { setSaving(false); }
  }

  function set<K extends keyof AvatarState>(key: K, val: AvatarState[K]) {
    setState(prev => ({ ...prev, [key]: val }));
  }

  return (
    <main style={{ minHeight: "100vh", background: BG, fontFamily: "Montserrat, system-ui", color: TEXT }}>
      <div aria-hidden="true" style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, background: "radial-gradient(800px 400px at 15% 8%, rgba(228,106,46,0.14), transparent 55%)" }} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 1000, margin: "0 auto", padding: "1.5rem 1rem 4rem" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
          <Link href="/profile" style={{ color: MUTED, fontSize: ".85rem", textDecoration: "none" }}>← Profile</Link>
          <div style={{ flex: 1 }}>
            <h1 style={{ margin: 0, fontWeight: 900, fontSize: "1.4rem" }}>Avatar Creator</h1>
            <div style={{ fontSize: ".78rem", color: MUTED, marginTop: ".15rem" }}>Build your duckpin identity</div>
          </div>
          <div style={{ display: "flex", gap: ".6rem", alignItems: "center" }}>
            {!loggedIn && (
              <span style={{ fontSize: ".78rem", color: MUTED }}>Log in to save your avatar</span>
            )}
            {saved && (
              <span style={{ fontSize: ".82rem", color: "#4ade80", fontWeight: 900 }}>✓ Saved!</span>
            )}
            <button
              onClick={saveAvatar}
              disabled={saving || !loggedIn}
              style={{
                padding: ".6rem 1.25rem", borderRadius: 10,
                border: 0, background: ORANGE, color: "#fff",
                fontWeight: 900, fontSize: ".85rem",
                cursor: saving || !loggedIn ? "default" : "pointer",
                opacity: saving || !loggedIn ? 0.55 : 1,
                fontFamily: "Montserrat, system-ui",
              }}
            >
              {saving ? "Saving…" : "Save Avatar"}
            </button>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr minmax(280px, 340px)", gap: "1.5rem", alignItems: "start" }}>

          {/* ── LEFT: Controls ── */}
          <div style={{ background: PANEL, border: `1px solid ${BORDER}`, borderRadius: 20, padding: "1.5rem", boxShadow: SHADOW }}>

            <Section title="Skin Tone">
              <SkinSlider value={state.skinToneIdx} onChange={v => set("skinToneIdx", v)} />
            </Section>

            <Section title="Face Shape">
              <ChipGrid>
                {FACE_SHAPES.map(f => (
                  <Chip key={f.id} label={f.label} active={state.faceShape === f.id} onClick={() => set("faceShape", f.id)} />
                ))}
              </ChipGrid>
            </Section>

            <Section title="Hair Style">
              <ChipGrid>
                {HAIR_STYLES.map(h => (
                  <Chip key={h.id} label={h.label} active={state.hairStyle === h.id} onClick={() => set("hairStyle", h.id)} />
                ))}
              </ChipGrid>
            </Section>

            <Section title="Hair Color">
              <div style={{ display: "flex", gap: ".5rem", flexWrap: "wrap" }}>
                {HAIR_COLORS.map(h => (
                  <ColorDot key={h.id} hex={h.hex} active={state.hairColor === h.id} onClick={() => set("hairColor", h.id)} label={h.label} />
                ))}
              </div>
            </Section>

            <Section title="Eye Color">
              <div style={{ display: "flex", gap: ".5rem", flexWrap: "wrap" }}>
                {EYE_COLORS.map(e => (
                  <ColorDot key={e.id} hex={e.hex} active={state.eyeColor === e.id} onClick={() => set("eyeColor", e.id)} />
                ))}
              </div>
            </Section>

            <Section title="Facial Hair">
              <ChipGrid>
                {FACIAL_HAIR.map(f => (
                  <Chip key={f.id} label={f.label} active={state.facialHair === f.id} onClick={() => set("facialHair", f.id)} />
                ))}
              </ChipGrid>
            </Section>

            <Section title="Outfit">
              <ChipGrid>
                {OUTFITS.map(o => (
                  <Chip key={o.id} label={o.label} active={state.outfit === o.id} onClick={() => set("outfit", o.id)} />
                ))}
              </ChipGrid>
            </Section>

            <Section title="Accessories">
              <ChipGrid>
                {ACCESSORIES_LIST.map(a => (
                  <Chip
                    key={a.id}
                    label={a.label}
                    active={state.accessories.includes(a.id)}
                    onClick={() => set("accessories", safeToggleAccessory(state, a.id))}
                  />
                ))}
              </ChipGrid>
            </Section>

            <Section title="Background Color">
              <div style={{ display: "flex", gap: ".5rem", flexWrap: "wrap" }}>
                {BG_COLORS.map(c => (
                  <ColorDot key={c} hex={c} active={state.bgColor === c} onClick={() => set("bgColor", c)} />
                ))}
              </div>
            </Section>

            <button
              onClick={() => setState(DEFAULTS)}
              style={{
                width: "100%", padding: ".6rem", borderRadius: 10, marginTop: ".25rem",
                border: `1px solid ${BORDER}`, background: "transparent",
                color: MUTED, fontWeight: 900, fontSize: ".78rem", cursor: "pointer",
                fontFamily: "Montserrat, system-ui",
              }}
            >
              Reset to Default
            </button>
          </div>

          {/* ── RIGHT: Preview ── */}
          <div style={{ position: "sticky", top: "1.5rem" }}>
            <div style={{
              background: PANEL, border: `1px solid ${BORDER}`,
              borderRadius: 20, padding: "1.5rem",
              boxShadow: SHADOW, textAlign: "center",
            }}>
              <div style={{ fontSize: ".72rem", fontWeight: 900, color: MUTED, letterSpacing: ".08em", textTransform: "uppercase", marginBottom: "1rem" }}>
                Preview
              </div>
              <div style={{
                background: `radial-gradient(circle, ${state.bgColor}22, transparent 70%)`,
                borderRadius: 16, padding: "1rem",
                display: "inline-block",
              }}>
                <AvatarSVG state={state} size={240} />
              </div>

              {/* Mini stats */}
              <div style={{ marginTop: "1rem", display: "grid", gap: ".3rem", textAlign: "left" }}>
                <div style={{ fontSize: ".72rem", color: MUTED }}><strong style={{ color: TEXT }}>Hair:</strong> {HAIR_STYLES.find(h => h.id === state.hairStyle)?.label} · {HAIR_COLORS.find(h => h.id === state.hairColor)?.label}</div>
                <div style={{ fontSize: ".72rem", color: MUTED }}><strong style={{ color: TEXT }}>Eyes:</strong> {EYE_COLORS.find(e => e.id === state.eyeColor)?.id}</div>
                <div style={{ fontSize: ".72rem", color: MUTED }}><strong style={{ color: TEXT }}>Outfit:</strong> {OUTFITS.find(o => o.id === state.outfit)?.label}</div>
                {state.accessories.length > 0 && (
                  <div style={{ fontSize: ".72rem", color: MUTED }}><strong style={{ color: TEXT }}>Accessories:</strong> {state.accessories.map(a => ACCESSORIES_LIST.find(x => x.id === a)?.label).join(", ")}</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Slider thumb styles */}
      <style>{`
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 26px; height: 26px;
          border-radius: 50%;
          background: white;
          border: 3px solid #e46a2e;
          box-shadow: 0 2px 8px rgba(0,0,0,0.5);
          cursor: pointer;
        }
        input[type=range]::-moz-range-thumb {
          width: 22px; height: 22px;
          border-radius: 50%;
          background: white;
          border: 3px solid #e46a2e;
          box-shadow: 0 2px 8px rgba(0,0,0,0.5);
          cursor: pointer;
        }
        input[type=range]:focus { outline: none; }
      `}</style>
    </main>
  );
}
