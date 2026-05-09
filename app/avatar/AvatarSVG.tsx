"use client";
import React from "react";

// ═══════════════════════════════════════════════════════════════════════════
// AvatarSVG — Memoji-style 2D vector avatar
//
// Renders a fully customizable, lifelike avatar at any size based on
// AvatarState. Uses pure SVG (no canvas, no WebGL) so it scales crisply,
// supports SSR, and looks great on every device.
//
// Coordinate system: 400×460 viewBox.
//   Head center ≈ (200, 200)
//   Eyes baseline ≈ y=200
//   Nose tip ≈ y=242
//   Mouth ≈ y=290
//   Chin ≈ y=360
// ═══════════════════════════════════════════════════════════════════════════

// ─── Avatar State Type ───────────────────────────────────────────────────────
export interface AvatarState {
  skinToneIdx: number;
  gender: "male" | "female";
  hairStyle: string;
  hairColor: string;
  eyeColor: string;
  faceShape: string;
  facialHair: string;
  outfit: string;
  accessories: string[];
  bgColor: string;
  // Memoji-style granular options (optional for backwards-compat)
  freckles?: "none" | "light" | "heavy";
  browStyle?: "default" | "thin" | "thick" | "arched" | "angled" | "straight";
  eyeShape?: "round" | "almond" | "narrow" | "downturned";
  eyelashes?: boolean;
  noseStyle?: "default" | "small" | "wide" | "long" | "button";
  mouthShape?: "default" | "smile" | "neutral" | "small" | "full";
  lipColor?: string;
  earSize?: "default" | "small" | "large";
  age?: "young" | "adult" | "mature";
  eyewear?: string;
  headwear?: string;
  earrings?: boolean;
}

// ─── Color Tables ────────────────────────────────────────────────────────────
export const SKIN_TONES = [
  "#FDDBB4", "#F8CDA0", "#F0BC8A", "#E8A87C",
  "#D4906A", "#C07858", "#A86040", "#8C4A2C",
  "#7A3A20", "#5C2810", "#3E1808", "#2A0E04",
];

const HAIR_HEX: Record<string, string> = {
  black:    "#2A1810",
  brown:    "#5C2E18",
  chestnut: "#7B3F1B",
  auburn:   "#8A3B20",
  red:      "#9F2A18",
  blonde:   "#D4B36A",
  platinum: "#E0DCC8",
  silver:   "#B8B8B8",
  white:    "#EAEAE0",
  gray:     "#7A7A7A",
  pink:     "#E89AB8",
  blue:     "#5887BF",
  purple:   "#8A6FBF",
};

const EYE_HEX: Record<string, string> = {
  brown:  "#5A3010",
  hazel:  "#7A5828",
  amber:  "#A87010",
  green:  "#3A7444",
  blue:   "#3878C8",
  sky:    "#7AB4D8",
  gray:   "#7A8898",
  violet: "#8060A0",
};

const LIP_HEX: Record<string, string> = {
  natural: "#C77860",
  pink:    "#D8758C",
  red:     "#C03040",
  berry:   "#9B3A60",
  nude:    "#B8806B",
  plum:    "#7B4060",
  coral:   "#E08868",
  deep:    "#6A2030",
};

const OUTFIT_HEX: Record<string, string> = {
  "bowling-shirt": "#C03018",
  letterman:       "#1A3A8C",
  jersey:          "#186030",
  polo:            "#284888",
  hoodie:          "#28304A",
};

// ─── Color helpers ──────────────────────────────────────────────────────────
function hx(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}
function rh(r: number, g: number, b: number): string {
  return "#" + [r, g, b]
    .map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0"))
    .join("");
}
function dk(hex: string, amt: number): string {
  const [r, g, b] = hx(hex);
  return rh(r * (1 - amt), g * (1 - amt), b * (1 - amt));
}
function lt(hex: string, amt: number): string {
  const [r, g, b] = hx(hex);
  return rh(r + (255 - r) * amt, g + (255 - g) * amt, b + (255 - b) * amt);
}
function mix(a: string, b: string, t: number): string {
  const [r1, g1, b1] = hx(a);
  const [r2, g2, b2] = hx(b);
  return rh(r1 * (1 - t) + r2 * t, g1 * (1 - t) + g2 * t, b1 * (1 - t) + b2 * t);
}

// ═══════════════════════════════════════════════════════════════════════════
// FACE SHAPE — defines the head silhouette path
// Returns an SVG path string for the face outline.
// ═══════════════════════════════════════════════════════════════════════════
function getFacePath(shape: string, age: string): string {
  // Reference: head centered at (200, 200), chin at y≈365
  // We design the face as a Bezier-curve shape, not a perfect ellipse,
  // so the cheekbones, jaw, and chin can vary per shape.
  switch (shape) {
    case "round":
      return [
        "M 200 70",                                // top of head
        "C 269 70, 320 120, 320 195",              // right top
        "C 320 250, 305 305, 270 340",             // right cheek to jaw
        "C 250 360, 225 370, 200 370",             // right jaw to chin
        "C 175 370, 150 360, 130 340",             // chin to left jaw
        "C 95 305, 80 250, 80 195",                // left cheek
        "C 80 120, 131 70, 200 70 Z",              // back to top
      ].join(" ");

    case "square":
      return [
        "M 200 68",
        "C 270 68, 318 110, 318 188",
        "C 318 240, 314 296, 304 332",             // straighter side
        "C 296 358, 270 372, 244 372",             // angular jaw corner
        "L 156 372",                                // flat jaw bottom
        "C 130 372, 104 358, 96 332",
        "C 86 296, 82 240, 82 188",
        "C 82 110, 130 68, 200 68 Z",
      ].join(" ");

    case "heart":
      // wider forehead, narrower pointed chin
      return [
        "M 200 68",
        "C 278 68, 326 116, 322 186",              // wide forehead
        "C 318 230, 304 274, 280 312",             // taper inward
        "C 256 348, 228 372, 200 374",             // pointed
        "C 172 372, 144 348, 120 312",
        "C 96 274, 82 230, 78 186",
        "C 74 116, 122 68, 200 68 Z",
      ].join(" ");

    case "diamond":
      // narrow forehead, wide cheekbones, narrow chin
      return [
        "M 200 70",
        "C 254 70, 296 100, 308 158",
        "C 322 200, 316 250, 296 302",             // pronounced cheekbones
        "C 270 348, 232 372, 200 372",
        "C 168 372, 130 348, 104 302",
        "C 84 250, 78 200, 92 158",
        "C 104 100, 146 70, 200 70 Z",
      ].join(" ");

    case "oval":
    default:
      // Classic balanced oval — slightly tapered chin
      return [
        "M 200 68",
        "C 270 68, 320 116, 318 192",
        "C 316 248, 296 304, 264 340",
        "C 246 358, 224 370, 200 370",
        "C 176 370, 154 358, 136 340",
        "C 104 304, 84 248, 82 192",
        "C 80 116, 130 68, 200 68 Z",
      ].join(" ");
  }
}

// Subtle aging crease overlays
function AgingMarks({ age, skinDk }: { age: string; skinDk: string }) {
  if (age === "young") return null;
  return (
    <g opacity={age === "mature" ? 0.6 : 0.35}>
      {/* nasolabial fold (smile lines) */}
      <path d="M 178 268 C 168 286, 160 312, 162 332" stroke={skinDk} strokeWidth="1.2" fill="none" strokeLinecap="round"/>
      <path d="M 222 268 C 232 286, 240 312, 238 332" stroke={skinDk} strokeWidth="1.2" fill="none" strokeLinecap="round"/>
      {age === "mature" && (
        <>
          {/* forehead lines */}
          <path d="M 156 144 Q 200 138 244 144" stroke={skinDk} strokeWidth="0.9" fill="none" opacity="0.5"/>
          <path d="M 160 158 Q 200 152 240 158" stroke={skinDk} strokeWidth="0.9" fill="none" opacity="0.4"/>
          {/* crow's feet */}
          <path d="M 124 200 L 130 198 M 124 206 L 130 204" stroke={skinDk} strokeWidth="0.8" opacity="0.5"/>
          <path d="M 276 200 L 270 198 M 276 206 L 270 204" stroke={skinDk} strokeWidth="0.8" opacity="0.5"/>
        </>
      )}
    </g>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// EARS
// ═══════════════════════════════════════════════════════════════════════════
function Ears({ skin, skinDk, earSize, earrings, faceShape }: {
  skin: string; skinDk: string; earSize: string; earrings: boolean; faceShape: string;
}) {
  const scale = earSize === "small" ? 0.78 : earSize === "large" ? 1.22 : 1.0;
  // Adjust ear x-position based on face shape
  const earOffsetX = faceShape === "round" ? 122 : faceShape === "square" ? 118 : faceShape === "heart" ? 116 : 120;
  return (
    <g>
      {/* Left ear */}
      <g transform={`translate(${200 - earOffsetX}, 220) scale(${scale})`}>
        <path d="M 0 -20 C -22 -20, -32 -2, -32 20 C -32 38, -22 50, -8 50 C 4 50, 8 38, 8 26 L 8 -8 C 8 -16, 4 -20, 0 -20 Z" fill={skin}/>
        <path d="M -16 -8 C -22 0, -22 18, -16 30 C -10 36, -4 32, -4 22 L -4 4 C -4 -2, -10 -10, -16 -8 Z" fill={skinDk} opacity="0.55"/>
        <path d="M -10 16 C -8 22, -4 26, 0 24 C -2 18, -6 14, -10 16 Z" fill={dk(skinDk, 0.18)} opacity="0.5"/>
        {earrings && (
          <g>
            <circle cx="-2" cy="44" r="4.5" fill="#E8B420" stroke={dk("#E8B420", 0.30)} strokeWidth="0.8"/>
            <circle cx="-2" cy="44" r="1.6" fill={lt("#E8B420", 0.40)} opacity="0.8"/>
          </g>
        )}
      </g>
      {/* Right ear (mirrored) */}
      <g transform={`translate(${200 + earOffsetX}, 220) scale(${-scale}, ${scale})`}>
        <path d="M 0 -20 C -22 -20, -32 -2, -32 20 C -32 38, -22 50, -8 50 C 4 50, 8 38, 8 26 L 8 -8 C 8 -16, 4 -20, 0 -20 Z" fill={skin}/>
        <path d="M -16 -8 C -22 0, -22 18, -16 30 C -10 36, -4 32, -4 22 L -4 4 C -4 -2, -10 -10, -16 -8 Z" fill={skinDk} opacity="0.55"/>
        <path d="M -10 16 C -8 22, -4 26, 0 24 C -2 18, -6 14, -10 16 Z" fill={dk(skinDk, 0.18)} opacity="0.5"/>
        {earrings && (
          <g>
            <circle cx="-2" cy="44" r="4.5" fill="#E8B420" stroke={dk("#E8B420", 0.30)} strokeWidth="0.8"/>
            <circle cx="-2" cy="44" r="1.6" fill={lt("#E8B420", 0.40)} opacity="0.8"/>
          </g>
        )}
      </g>
    </g>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// FRECKLES
// ═══════════════════════════════════════════════════════════════════════════
function Freckles({ density, color }: { density: string; color: string }) {
  if (density === "none") return null;
  // Cluster of small dots across the cheeks and nose bridge
  const heavyDots: [number, number, number][] = [
    // [x, y, r]
    [165, 232, 1.6], [173, 240, 1.4], [158, 244, 1.2], [180, 248, 1.5],
    [150, 250, 1.3], [168, 252, 1.4], [145, 256, 1.0], [173, 258, 1.2],
    [160, 262, 1.3], [152, 246, 1.2], [185, 256, 1.1],
    [235, 232, 1.6], [227, 240, 1.4], [242, 244, 1.2], [220, 248, 1.5],
    [250, 250, 1.3], [232, 252, 1.4], [255, 256, 1.0], [227, 258, 1.2],
    [240, 262, 1.3], [248, 246, 1.2], [215, 256, 1.1],
    [192, 234, 1.0], [208, 234, 1.0], [200, 244, 1.1],
  ];
  const lightDots: [number, number, number][] = [
    [168, 240, 1.3], [180, 248, 1.2], [160, 252, 1.0],
    [232, 240, 1.3], [220, 248, 1.2], [240, 252, 1.0],
    [192, 238, 0.9], [208, 238, 0.9],
  ];
  const dots = density === "heavy" ? heavyDots : lightDots;
  return (
    <g opacity="0.72">
      {dots.map(([x, y, r], i) => (
        <circle key={i} cx={x} cy={y} r={r} fill={color} />
      ))}
    </g>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// EYEBROWS
// ═══════════════════════════════════════════════════════════════════════════
function Brows({ style, color }: { style: string; color: string }) {
  // Each brow drawn as a thick filled path with a slight highlight
  const dark = dk(color, 0.20);
  function browPath(side: 1 | -1): string {
    const cx = side === 1 ? 162 : 238; // brow center x
    switch (style) {
      case "thin":
        return `M ${cx - 22 * side} 168 Q ${cx} 158 ${cx + 22 * side} 168 Q ${cx} 165 ${cx - 22 * side} 168 Z`;
      case "thick":
        return `M ${cx - 26 * side} 166 Q ${cx} 152 ${cx + 26 * side} 168 Q ${cx + 28 * side} 174 ${cx} 174 Q ${cx - 24 * side} 178 ${cx - 26 * side} 166 Z`;
      case "arched":
        return `M ${cx - 24 * side} 170 Q ${cx} 148 ${cx + 26 * side} 170 Q ${cx + 22 * side} 174 ${cx} 162 Q ${cx - 22 * side} 174 ${cx - 24 * side} 170 Z`;
      case "angled":
        return `M ${cx - 24 * side} 174 L ${cx} 156 L ${cx + 26 * side} 170 L ${cx + 22 * side} 174 L ${cx} 164 L ${cx - 22 * side} 176 Z`;
      case "straight":
        return `M ${cx - 26 * side} 166 L ${cx + 26 * side} 168 L ${cx + 26 * side} 174 L ${cx - 26 * side} 172 Z`;
      default: // natural
        return `M ${cx - 24 * side} 170 Q ${cx} 154 ${cx + 26 * side} 170 Q ${cx + 24 * side} 176 ${cx} 168 Q ${cx - 22 * side} 176 ${cx - 24 * side} 170 Z`;
    }
  }
  return (
    <g>
      <path d={browPath(1)} fill={color}/>
      <path d={browPath(-1)} fill={color}/>
      {/* tiny brow hair texture lines */}
      <g stroke={dark} strokeWidth="0.6" opacity="0.45" fill="none">
        <path d="M 142 170 L 148 166 M 152 168 L 156 162 M 162 166 L 166 160"/>
        <path d="M 258 170 L 252 166 M 248 168 L 244 162 M 238 166 L 234 160"/>
      </g>
    </g>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// EYES
// ═══════════════════════════════════════════════════════════════════════════
function Eyes({
  shape, color, eyelashes, gender,
}: { shape: string; color: string; eyelashes: boolean; gender: string }) {
  // Per-shape parameters
  // [rx, ry, tilt] — applied to each eyeball
  const params = {
    almond:     { rx: 19, ry: 12, tilt: 0 },
    round:      { rx: 16, ry: 16, tilt: 0 },
    narrow:     { rx: 21, ry: 8,  tilt: 0 },
    downturned: { rx: 19, ry: 11, tilt: 6 },
  } as const;
  const p = params[shape as keyof typeof params] ?? params.almond;
  const irisColor = color;
  const irisDk = dk(color, 0.40);
  const irisLt = lt(color, 0.30);

  const renderEye = (side: 1 | -1) => {
    const cx = 200 + 38 * side; // 162 or 238
    const cy = 200;
    const tilt = p.tilt * side;
    // Upper-lid path (closes eye on top)
    const upperLid = `M ${cx - p.rx} ${cy} Q ${cx} ${cy - p.ry - 2} ${cx + p.rx} ${cy}`;
    return (
      <g key={side} transform={`rotate(${tilt} ${cx} ${cy})`}>
        {/* socket shadow (subtle) */}
        <ellipse cx={cx} cy={cy + 2} rx={p.rx + 3} ry={p.ry + 3} fill="#000" opacity="0.06"/>
        {/* sclera (white of eye) */}
        <ellipse cx={cx} cy={cy} rx={p.rx} ry={p.ry} fill="#FAFAF6"/>
        {/* iris */}
        <circle cx={cx} cy={cy} r={Math.min(p.ry - 0.5, 9.5)} fill={irisColor}/>
        {/* iris radial gradient effect using overlaid layers */}
        <circle cx={cx} cy={cy} r={Math.min(p.ry - 0.5, 9.5)} fill={`url(#iris-${side})`} opacity="0.6"/>
        {/* iris detail rays */}
        <g stroke={irisDk} strokeWidth="0.6" opacity="0.55">
          {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => {
            const r = Math.min(p.ry - 0.5, 9.5);
            const rad = (a * Math.PI) / 180;
            return (
              <line
                key={a}
                x1={cx + Math.cos(rad) * 2}
                y1={cy + Math.sin(rad) * 2}
                x2={cx + Math.cos(rad) * (r - 1)}
                y2={cy + Math.sin(rad) * (r - 1)}
              />
            );
          })}
        </g>
        {/* limbal ring (dark outline of iris) */}
        <circle cx={cx} cy={cy} r={Math.min(p.ry - 0.5, 9.5)} fill="none" stroke={irisDk} strokeWidth="0.9" opacity="0.65"/>
        {/* pupil */}
        <circle cx={cx} cy={cy} r={Math.min(p.ry - 5, 4)} fill="#0A0606"/>
        {/* main catchlight */}
        <circle cx={cx - 2.5} cy={cy - 2.8} r="2.6" fill="#FFFFFF"/>
        <circle cx={cx - 2.5} cy={cy - 2.8} r="1.2" fill="#FFFFFF"/>
        {/* secondary catchlight (small) */}
        <circle cx={cx + 3} cy={cy + 1.5} r="0.9" fill="#FFFFFF" opacity="0.7"/>
        {/* upper eyelid line */}
        <path d={upperLid} stroke="#1B0808" strokeWidth="2.2" fill="none" strokeLinecap="round"/>
        {/* lower eyelid (subtle) */}
        <path
          d={`M ${cx - p.rx + 2} ${cy + 2} Q ${cx} ${cy + p.ry + 1} ${cx + p.rx - 2} ${cy + 2}`}
          stroke="#5A3018" strokeWidth="0.9" fill="none" opacity="0.55" strokeLinecap="round"
        />
        {/* tear duct (inner corner) */}
        <ellipse
          cx={cx - p.rx * side * -1 + (side === 1 ? 1 : -1) * 0}
          cy={cy + 1}
          rx="1.2" ry="1.0"
          fill="#D89090" opacity="0.5"
        />
        {/* eyelashes */}
        {eyelashes && (
          <g stroke="#0A0606" strokeWidth="1.1" strokeLinecap="round" fill="none">
            {[-0.7, -0.5, -0.3, -0.1, 0.1, 0.3, 0.5, 0.7].map((t, i) => {
              const x = cx + p.rx * t;
              const yTop = cy - p.ry - 1;
              const yEnd = yTop - 4 - Math.abs(t) * 1.5;
              const xEnd = x + (t < 0 ? -2 : 2) * (1 - Math.abs(t));
              return <line key={i} x1={x} y1={yTop} x2={xEnd} y2={yEnd}/>;
            })}
          </g>
        )}
        {/* female natural extra lashes */}
        {!eyelashes && gender === "female" && (
          <g stroke="#0A0606" strokeWidth="0.7" strokeLinecap="round" fill="none" opacity="0.7">
            {[-0.5, -0.2, 0.2, 0.5].map((t, i) => {
              const x = cx + p.rx * t;
              const yTop = cy - p.ry - 0.5;
              const yEnd = yTop - 2.2;
              return <line key={i} x1={x} y1={yTop} x2={x + (t < 0 ? -1 : 1)} y2={yEnd}/>;
            })}
          </g>
        )}
      </g>
    );
  };
  return (
    <g>
      <defs>
        {[1, -1].map((s) => (
          <radialGradient key={s} id={`iris-${s}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={irisLt}/>
            <stop offset="50%" stopColor={irisColor}/>
            <stop offset="100%" stopColor={irisDk}/>
          </radialGradient>
        ))}
      </defs>
      {renderEye(1)}
      {renderEye(-1)}
    </g>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// NOSE
// ═══════════════════════════════════════════════════════════════════════════
function Nose({ style, skin, skinDk }: { style: string; skin: string; skinDk: string }) {
  const shadowColor = skinDk;
  const highlightColor = lt(skin, 0.10);
  // Reference: nose tip at (200, 244)
  const noseStyles: Record<string, JSX.Element> = {
    default: (
      <g>
        <path d="M 196 200 Q 188 230 190 244 Q 196 252 200 252 Q 204 252 210 244 Q 212 230 204 200" fill={shadowColor} opacity="0.18"/>
        <path d="M 198 220 Q 192 240 198 250 Q 204 250 202 240 Q 200 224 198 220" fill={highlightColor} opacity="0.45"/>
        <ellipse cx="194" cy="248" rx="3" ry="2" fill={dk(shadowColor, 0.45)} opacity="0.6"/>
        <ellipse cx="206" cy="248" rx="3" ry="2" fill={dk(shadowColor, 0.45)} opacity="0.6"/>
        <ellipse cx="200" cy="246" rx="6" ry="5" fill={shadowColor} opacity="0.10"/>
      </g>
    ),
    small: (
      <g>
        <path d="M 198 215 Q 194 235 198 246 Q 204 246 202 236 Q 200 220 198 215" fill={shadowColor} opacity="0.18"/>
        <ellipse cx="196" cy="244" rx="2.2" ry="1.6" fill={dk(shadowColor, 0.45)} opacity="0.6"/>
        <ellipse cx="204" cy="244" rx="2.2" ry="1.6" fill={dk(shadowColor, 0.45)} opacity="0.6"/>
        <ellipse cx="200" cy="242" rx="4" ry="3.5" fill={shadowColor} opacity="0.10"/>
      </g>
    ),
    button: (
      <g>
        <ellipse cx="200" cy="244" rx="9" ry="7" fill={shadowColor} opacity="0.16"/>
        <ellipse cx="200" cy="242" rx="7" ry="6" fill={highlightColor} opacity="0.45"/>
        <ellipse cx="194" cy="246" rx="2.4" ry="1.8" fill={dk(shadowColor, 0.45)} opacity="0.6"/>
        <ellipse cx="206" cy="246" rx="2.4" ry="1.8" fill={dk(shadowColor, 0.45)} opacity="0.6"/>
      </g>
    ),
    wide: (
      <g>
        <path d="M 192 200 Q 180 232 184 248 Q 196 256 200 256 Q 204 256 216 248 Q 220 232 208 200" fill={shadowColor} opacity="0.18"/>
        <path d="M 196 220 Q 188 244 196 254 Q 204 254 204 244 Q 200 224 196 220" fill={highlightColor} opacity="0.45"/>
        <ellipse cx="190" cy="252" rx="4" ry="2.5" fill={dk(shadowColor, 0.45)} opacity="0.6"/>
        <ellipse cx="210" cy="252" rx="4" ry="2.5" fill={dk(shadowColor, 0.45)} opacity="0.6"/>
        <ellipse cx="200" cy="250" rx="8" ry="6" fill={shadowColor} opacity="0.10"/>
      </g>
    ),
    long: (
      <g>
        <path d="M 196 190 Q 188 232 188 254 Q 196 264 200 264 Q 204 264 212 254 Q 212 232 204 190" fill={shadowColor} opacity="0.18"/>
        <path d="M 198 210 Q 192 246 198 260 Q 204 260 202 246 Q 200 216 198 210" fill={highlightColor} opacity="0.45"/>
        <ellipse cx="194" cy="258" rx="3" ry="2" fill={dk(shadowColor, 0.45)} opacity="0.6"/>
        <ellipse cx="206" cy="258" rx="3" ry="2" fill={dk(shadowColor, 0.45)} opacity="0.6"/>
        <ellipse cx="200" cy="256" rx="6" ry="5" fill={shadowColor} opacity="0.10"/>
      </g>
    ),
  };
  return noseStyles[style] || noseStyles.default;
}

// ═══════════════════════════════════════════════════════════════════════════
// MOUTH / LIPS
// ═══════════════════════════════════════════════════════════════════════════
function Mouth({ shape, lipColor, gender }: { shape: string; lipColor: string; gender: string }) {
  const lipDk = dk(lipColor, 0.18);
  const lipLt = lt(lipColor, 0.18);
  // Reference: mouth center (200, 290)
  switch (shape) {
    case "smile":
      return (
        <g>
          {/* upper lip */}
          <path d="M 168 286 Q 184 280 200 282 Q 216 280 232 286 Q 220 296 200 296 Q 180 296 168 286 Z" fill={lipColor}/>
          {/* lower lip */}
          <path d="M 170 296 Q 200 314 230 296 Q 220 304 200 308 Q 180 304 170 296 Z" fill={lipLt}/>
          {/* highlight */}
          <ellipse cx="200" cy="300" rx="14" ry="2" fill="#FFFFFF" opacity="0.30"/>
          {/* mouth opening (teeth peek) */}
          <path d="M 178 290 Q 200 296 222 290 Q 200 292 178 290 Z" fill="#F8F2EC" opacity="0.85"/>
          {/* corners */}
          <ellipse cx="168" cy="290" rx="2" ry="1.6" fill={dk(lipColor, 0.30)} opacity="0.7"/>
          <ellipse cx="232" cy="290" rx="2" ry="1.6" fill={dk(lipColor, 0.30)} opacity="0.7"/>
        </g>
      );
    case "neutral":
      return (
        <g>
          <path d="M 174 288 Q 200 284 226 288 Q 224 294 200 294 Q 176 294 174 288 Z" fill={lipColor}/>
          <path d="M 174 294 Q 200 300 226 294 Q 222 298 200 300 Q 178 298 174 294 Z" fill={lipLt}/>
          <line x1="178" y1="291" x2="222" y2="291" stroke={lipDk} strokeWidth="0.8" opacity="0.7"/>
        </g>
      );
    case "small":
      return (
        <g>
          <path d="M 184 288 Q 200 282 216 288 Q 210 296 200 296 Q 190 296 184 288 Z" fill={lipColor}/>
          <path d="M 184 296 Q 200 304 216 296 Q 210 300 200 302 Q 190 300 184 296 Z" fill={lipLt}/>
          <ellipse cx="200" cy="299" rx="8" ry="1.4" fill="#FFFFFF" opacity="0.30"/>
        </g>
      );
    case "full":
      return (
        <g>
          {/* upper lip with cupid's bow */}
          <path d="M 162 286 Q 178 274 192 280 Q 200 272 208 280 Q 222 274 238 286 Q 222 296 200 296 Q 178 296 162 286 Z" fill={lipColor}/>
          {/* lower lip — fuller */}
          <path d="M 164 296 Q 200 320 236 296 Q 226 312 200 314 Q 174 312 164 296 Z" fill={lipLt}/>
          {/* lip line */}
          <path d="M 168 290 Q 200 294 232 290" stroke={lipDk} strokeWidth="0.9" fill="none" opacity="0.6"/>
          {/* highlight */}
          <ellipse cx="200" cy="306" rx="18" ry="3" fill="#FFFFFF" opacity="0.32"/>
          {/* corner shadow */}
          <ellipse cx="164" cy="290" rx="2" ry="1.4" fill={dk(lipColor, 0.32)} opacity="0.7"/>
          <ellipse cx="236" cy="290" rx="2" ry="1.4" fill={dk(lipColor, 0.32)} opacity="0.7"/>
        </g>
      );
    case "default":
    default:
      return (
        <g>
          {/* upper lip */}
          <path d="M 170 287 Q 184 280 200 283 Q 216 280 230 287 Q 220 295 200 295 Q 180 295 170 287 Z" fill={lipColor}/>
          {/* lower lip */}
          <path d="M 172 295 Q 200 312 228 295 Q 220 304 200 306 Q 180 304 172 295 Z" fill={lipLt}/>
          {/* lip line */}
          <path d="M 174 290 Q 200 293 226 290" stroke={lipDk} strokeWidth="0.8" fill="none" opacity="0.55"/>
          {/* lower lip highlight */}
          <ellipse cx="200" cy="301" rx="14" ry="2" fill="#FFFFFF" opacity="0.28"/>
          {/* cupid's bow notch */}
          <path d="M 196 282 Q 200 280 204 282 L 202 286 L 198 286 Z" fill={dk(lipColor, 0.18)} opacity="0.6"/>
        </g>
      );
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// FACIAL HAIR
// ═══════════════════════════════════════════════════════════════════════════
function FacialHair({ style, color }: { style: string; color: string }) {
  if (style === "none") return null;
  const dark = dk(color, 0.20);
  const light = lt(color, 0.10);
  switch (style) {
    case "stubble":
      return (
        <g opacity="0.55">
          {/* dot pattern across jaw and chin */}
          {Array.from({ length: 80 }).map((_, i) => {
            const angle = ((i / 80) * Math.PI) - Math.PI / 2;
            const xOff = Math.sin(angle) * 0.7;
            const x = 200 + xOff * (100 + (i % 5) * 2);
            const y = 280 + Math.cos(angle) * (Math.abs(xOff) * 30 + 35) + (i % 4) * 2;
            // Constrain to lower face area
            if (y < 250 || y > 360 || x < 130 || x > 270) return null;
            return <circle key={i} cx={x} cy={y} r={0.8 + (i % 3) * 0.2} fill={color}/>;
          })}
          {/* mustache stubble */}
          {Array.from({ length: 30 }).map((_, i) => {
            const x = 168 + i * 2.2;
            const y = 270 + (i % 3);
            if (x > 232) return null;
            return <circle key={`m-${i}`} cx={x} cy={y} r="0.9" fill={color}/>;
          })}
        </g>
      );
    case "mustache":
      return (
        <g>
          <path d="M 162 275 Q 175 268 186 272 Q 200 268 214 272 Q 225 268 238 275 Q 232 282 218 280 Q 200 280 200 282 Q 200 280 182 280 Q 168 282 162 275 Z" fill={color}/>
          <path d="M 178 276 Q 188 273 198 274 Q 202 273 212 274 Q 222 276 220 278 Q 200 278 200 278 Q 180 278 178 276 Z" fill={dark}/>
          {/* slight curl ends */}
          <path d="M 162 275 Q 158 278 156 282 Q 162 280 164 277" fill={color}/>
          <path d="M 238 275 Q 242 278 244 282 Q 238 280 236 277" fill={color}/>
        </g>
      );
    case "beard-short": // Goatee
      return (
        <g>
          {/* mustache */}
          <path d="M 172 276 Q 186 270 200 274 Q 214 270 228 276 Q 220 282 212 281 Q 200 280 200 282 Q 200 280 188 281 Q 180 282 172 276 Z" fill={color}/>
          {/* chin patch */}
          <path d="M 184 308 Q 192 304 200 306 Q 208 304 216 308 Q 218 326 210 340 Q 200 348 190 340 Q 182 326 184 308 Z" fill={color}/>
          <path d="M 192 314 Q 200 320 208 314 Q 200 318 192 314" fill={dark} opacity="0.6"/>
          {/* connecting strands (subtle) */}
          <path d="M 188 286 Q 188 300 186 308 M 212 286 Q 212 300 214 308" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.6"/>
        </g>
      );
    case "beard-full":
      return (
        <g>
          {/* full beard outline */}
          <path d="M 132 254 Q 124 262 122 280 Q 120 304 130 332 Q 144 358 170 368 Q 200 374 230 368 Q 256 358 270 332 Q 280 304 278 280 Q 276 262 268 254 Q 250 268 232 268 Q 216 270 200 270 Q 184 270 168 268 Q 150 268 132 254 Z" fill={color}/>
          {/* mustache merge */}
          <path d="M 158 272 Q 180 264 200 270 Q 220 264 242 272 Q 232 282 222 280 Q 210 278 200 280 Q 190 278 178 280 Q 168 282 158 272 Z" fill={color}/>
          {/* shading layer */}
          <path d="M 140 280 Q 150 312 170 340 Q 200 348 230 340 Q 250 312 260 280 Q 240 286 200 286 Q 160 286 140 280 Z" fill={dark} opacity="0.4"/>
          {/* highlight */}
          <path d="M 174 320 Q 200 326 226 320 Q 218 332 200 334 Q 182 332 174 320 Z" fill={light} opacity="0.3"/>
          {/* texture strokes */}
          <g stroke={dark} strokeWidth="0.8" fill="none" opacity="0.4">
            <path d="M 145 280 Q 150 320 165 350"/>
            <path d="M 160 285 Q 165 320 175 355"/>
            <path d="M 240 285 Q 235 320 225 355"/>
            <path d="M 255 280 Q 250 320 235 350"/>
          </g>
        </g>
      );
    default:
      return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// HAIR — back layer (renders behind head, shows around shoulders)
// ═══════════════════════════════════════════════════════════════════════════
function HairBack({ style, color }: { style: string; color: string }) {
  const dark = dk(color, 0.22);
  switch (style) {
    case "long":
      return (
        <g>
          {/* long hair flowing past shoulders */}
          <path d="M 70 180 Q 60 280, 80 380 Q 100 440, 130 460 L 270 460 Q 300 440, 320 380 Q 340 280, 330 180 L 330 220 L 70 220 Z" fill={color}/>
          {/* layered strands */}
          <path d="M 80 240 Q 70 320, 90 400 Q 110 440 130 450" stroke={dark} strokeWidth="1.5" fill="none" opacity="0.5"/>
          <path d="M 320 240 Q 330 320, 310 400 Q 290 440 270 450" stroke={dark} strokeWidth="1.5" fill="none" opacity="0.5"/>
          <path d="M 100 250 Q 92 340 110 420" stroke={dark} strokeWidth="1" fill="none" opacity="0.4"/>
          <path d="M 300 250 Q 308 340 290 420" stroke={dark} strokeWidth="1" fill="none" opacity="0.4"/>
        </g>
      );
    case "bob":
      return (
        <g>
          <path d="M 80 180 Q 76 240, 80 290 Q 90 320, 110 330 L 290 330 Q 310 320, 320 290 Q 324 240, 320 180 L 320 220 L 80 220 Z" fill={color}/>
          <path d="M 90 250 Q 92 290 110 320" stroke={dark} strokeWidth="1" fill="none" opacity="0.4"/>
          <path d="M 310 250 Q 308 290 290 320" stroke={dark} strokeWidth="1" fill="none" opacity="0.4"/>
        </g>
      );
    case "bun":
      return (
        <g>
          {/* high bun behind head */}
          <ellipse cx="200" cy="80" rx="42" ry="32" fill={color}/>
          <ellipse cx="194" cy="74" rx="20" ry="14" fill={dk(color, 0.15)} opacity="0.6"/>
          {/* hair tie */}
          <ellipse cx="200" cy="106" rx="36" ry="6" fill={dark}/>
        </g>
      );
    case "curly":
      return (
        <g>
          {/* fluffy halo behind head */}
          {[
            [110, 160, 22], [90, 200, 24], [80, 240, 22], [86, 280, 20],
            [290, 160, 22], [310, 200, 24], [320, 240, 22], [314, 280, 20],
          ].map(([x, y, r], i) => (
            <circle key={i} cx={x} cy={y} r={r} fill={color}/>
          ))}
          {[
            [115, 170, 14], [98, 210, 16], [285, 170, 14], [302, 210, 16],
          ].map(([x, y, r], i) => (
            <circle key={`d-${i}`} cx={x} cy={y} r={r} fill={dark} opacity="0.4"/>
          ))}
        </g>
      );
    default:
      return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// HAIR — front layer (renders on top of head, covers forehead/sides)
// ═══════════════════════════════════════════════════════════════════════════
function HairFront({ style, color }: { style: string; color: string }) {
  const dark = dk(color, 0.22);
  const light = lt(color, 0.12);
  switch (style) {
    case "bald":
      return null;

    case "buzz":
      return (
        <g>
          {/* close-cropped cap */}
          <path d="M 86 178 Q 84 116, 200 80 Q 316 116, 314 178 Q 314 184, 312 188 Q 280 156, 200 152 Q 120 156, 88 188 Q 86 184, 86 178 Z" fill={color}/>
          {/* texture dots */}
          <g fill={dark} opacity="0.6">
            {Array.from({ length: 60 }).map((_, i) => {
              const a = (i / 60) * Math.PI;
              const r = 100 + (i % 8);
              const x = 200 + Math.cos(a + Math.PI) * r;
              const y = 160 + Math.sin(a + Math.PI) * 80;
              if (y > 180 || y < 80) return null;
              return <circle key={i} cx={x} cy={y} r="1.2"/>;
            })}
          </g>
        </g>
      );

    case "short":
      return (
        <g>
          {/* main cap with parted side */}
          <path d="M 80 188 Q 78 110, 200 72 Q 322 110, 320 188 Q 320 198, 314 200 Q 300 158, 270 148 Q 240 152, 220 162 Q 230 152, 224 142 Q 210 138, 198 144 Q 180 150, 168 158 Q 156 152, 144 156 Q 124 162, 110 174 Q 92 178, 86 200 Q 80 198, 80 188 Z" fill={color}/>
          {/* swept fringe */}
          <path d="M 144 156 Q 162 172, 198 162 Q 220 156, 234 148" stroke={dark} strokeWidth="1.6" fill="none" opacity="0.5"/>
          {/* highlight */}
          <path d="M 160 110 Q 200 92, 240 110 Q 220 100, 200 100 Q 180 100, 160 110 Z" fill={light} opacity="0.45"/>
          {/* sideburn */}
          <path d="M 86 196 Q 82 210, 84 224 L 92 224 Q 96 210, 96 196 Z" fill={color}/>
          <path d="M 314 196 Q 318 210, 316 224 L 308 224 Q 304 210, 304 196 Z" fill={color}/>
        </g>
      );

    case "pompadour":
      return (
        <g>
          {/* sides (low taper) */}
          <path d="M 84 180 Q 82 154, 100 132 L 110 188 Q 100 196, 86 196 Q 82 188, 84 180 Z" fill={color}/>
          <path d="M 316 180 Q 318 154, 300 132 L 290 188 Q 300 196, 314 196 Q 318 188, 316 180 Z" fill={color}/>
          {/* base cap */}
          <path d="M 100 156 Q 110 130, 200 124 Q 290 130, 300 156 Q 280 144, 200 144 Q 120 144, 100 156 Z" fill={dark}/>
          {/* tall pompadour volume */}
          <path d="M 112 134 Q 130 60, 200 52 Q 270 60, 288 134 Q 270 80, 200 70 Q 130 80, 112 134 Z" fill={color}/>
          {/* top sweep highlight */}
          <path d="M 138 100 Q 200 60, 262 100 Q 200 80, 138 100 Z" fill={light} opacity="0.55"/>
          {/* swept lines */}
          <path d="M 130 110 Q 200 70 270 110" stroke={dark} strokeWidth="1.5" fill="none" opacity="0.5"/>
          <path d="M 140 124 Q 200 84 260 124" stroke={dark} strokeWidth="1.2" fill="none" opacity="0.5"/>
          <path d="M 150 138 Q 200 100 250 138" stroke={dark} strokeWidth="1" fill="none" opacity="0.4"/>
          {/* sideburn */}
          <path d="M 96 196 Q 92 218, 94 230 L 104 230 Q 108 218, 108 196 Z" fill={color}/>
          <path d="M 304 196 Q 308 218, 306 230 L 296 230 Q 292 218, 292 196 Z" fill={color}/>
        </g>
      );

    case "bob":
      return (
        <g>
          {/* top */}
          <path d="M 80 184 Q 76 100, 200 70 Q 324 100, 320 184 Q 320 200, 312 204 Q 290 152, 200 142 Q 110 152, 88 204 Q 80 200, 80 184 Z" fill={color}/>
          {/* bangs/fringe */}
          <path d="M 140 142 Q 200 156, 260 142 Q 230 178, 200 184 Q 170 178, 140 142 Z" fill={dark}/>
          {/* highlights */}
          <path d="M 130 110 Q 200 78, 270 110 Q 240 96, 200 92 Q 160 96, 130 110 Z" fill={light} opacity="0.5"/>
          {/* side swing */}
          <path d="M 70 200 Q 70 240, 84 280 Q 96 304, 110 318 L 110 200 Z" fill={color}/>
          <path d="M 330 200 Q 330 240, 316 280 Q 304 304, 290 318 L 290 200 Z" fill={color}/>
          {/* shading on sides */}
          <path d="M 84 220 Q 80 260, 92 300" stroke={dark} strokeWidth="1.5" fill="none" opacity="0.5"/>
          <path d="M 316 220 Q 320 260, 308 300" stroke={dark} strokeWidth="1.5" fill="none" opacity="0.5"/>
        </g>
      );

    case "long":
      return (
        <g>
          {/* top */}
          <path d="M 80 188 Q 76 96, 200 64 Q 324 96, 320 188 Q 320 198, 312 202 Q 286 144, 200 138 Q 114 144, 88 202 Q 80 198, 80 188 Z" fill={color}/>
          {/* fringe */}
          <path d="M 130 138 Q 165 156, 200 152 Q 235 156, 270 138 Q 248 178, 200 180 Q 152 178, 130 138 Z" fill={dark}/>
          {/* highlights */}
          <path d="M 124 110 Q 200 70, 276 110 Q 244 92, 200 88 Q 156 92, 124 110 Z" fill={light} opacity="0.5"/>
          {/* side strands flowing down (front portion) */}
          <path d="M 70 200 L 70 460 L 110 460 L 130 200 Z" fill={color}/>
          <path d="M 330 200 L 330 460 L 290 460 L 270 200 Z" fill={color}/>
          {/* strand shading lines */}
          <path d="M 80 240 Q 84 320, 92 420" stroke={dark} strokeWidth="1.4" fill="none" opacity="0.5"/>
          <path d="M 100 250 Q 104 330, 112 440" stroke={dark} strokeWidth="1.2" fill="none" opacity="0.4"/>
          <path d="M 320 240 Q 316 320, 308 420" stroke={dark} strokeWidth="1.4" fill="none" opacity="0.5"/>
          <path d="M 300 250 Q 296 330, 288 440" stroke={dark} strokeWidth="1.2" fill="none" opacity="0.4"/>
        </g>
      );

    case "curly":
      return (
        <g>
          {/* clusters of curls forming the hair */}
          {[
            // [x, y, r]
            [200, 70, 36], [160, 72, 30], [240, 72, 30],
            [124, 96, 28], [276, 96, 28],
            [108, 134, 26], [292, 134, 26],
            [98, 174, 22], [302, 174, 22],
            [180, 76, 26], [220, 76, 26],
            [148, 100, 24], [252, 100, 24],
            [130, 130, 22], [270, 130, 22],
          ].map(([x, y, r], i) => (
            <circle key={i} cx={x} cy={y} r={r} fill={color}/>
          ))}
          {/* darker shadow curls between */}
          {[
            [180, 100, 18], [220, 100, 18], [200, 90, 16],
            [140, 124, 16], [260, 124, 16],
          ].map(([x, y, r], i) => (
            <circle key={`d-${i}`} cx={x} cy={y} r={r} fill={dark} opacity="0.6"/>
          ))}
          {/* highlight on top */}
          {[[178, 80, 12], [222, 80, 12], [200, 70, 14]].map(([x, y, r], i) => (
            <circle key={`l-${i}`} cx={x} cy={y} r={r} fill={light} opacity="0.55"/>
          ))}
          {/* fringe curls (tighter) */}
          {[
            [156, 152, 12], [180, 156, 13], [200, 158, 12],
            [220, 156, 13], [244, 152, 12],
          ].map(([x, y, r], i) => (
            <circle key={`f-${i}`} cx={x} cy={y} r={r} fill={color}/>
          ))}
        </g>
      );

    case "bun":
      return (
        <g>
          {/* slick-back top with center part */}
          <path d="M 80 188 Q 78 116, 200 80 Q 322 116, 320 188 Q 320 198, 314 202 Q 296 158, 200 152 Q 104 158, 86 202 Q 80 198, 80 188 Z" fill={color}/>
          {/* center part highlight */}
          <path d="M 196 90 L 196 152 L 204 152 L 204 90 Z" fill={dk(color, 0.30)} opacity="0.55"/>
          {/* slick-back highlights */}
          <path d="M 110 140 Q 200 110, 290 140" stroke={light} strokeWidth="2.5" fill="none" opacity="0.45"/>
          <path d="M 100 160 Q 200 130, 300 160" stroke={dark} strokeWidth="1.4" fill="none" opacity="0.5"/>
          {/* sideburns thin */}
          <path d="M 86 196 Q 82 218, 84 230 L 90 230 Q 92 218, 92 196 Z" fill={color}/>
          <path d="M 314 196 Q 318 218, 316 230 L 310 230 Q 308 218, 308 196 Z" fill={color}/>
        </g>
      );

    default:
      // fallback short
      return (
        <g>
          <path d="M 80 188 Q 78 110, 200 72 Q 322 110, 320 188 Q 320 198, 312 200 Q 296 158, 200 148 Q 104 158, 88 200 Q 80 198, 80 188 Z" fill={color}/>
        </g>
      );
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// EYEWEAR
// ═══════════════════════════════════════════════════════════════════════════
function Eyewear({ kind }: { kind: string }) {
  if (kind === "none" || !kind) return null;
  const isShades = kind === "sunglasses";
  const frameColor = isShades ? "#0F0F12" : "#2A2024";
  const lensFill = isShades ? "#0A0A10" : "rgba(180,210,255,0.32)";
  const lensStroke = isShades ? "#0A0A10" : frameColor;
  return (
    <g>
      {/* left lens */}
      <g>
        <ellipse cx="162" cy="200" rx="30" ry="22" fill={lensFill} stroke={lensStroke} strokeWidth="3"/>
        {/* highlight */}
        <ellipse cx="152" cy="190" rx="10" ry="5" fill="#FFFFFF" opacity={isShades ? 0.18 : 0.5}/>
      </g>
      {/* right lens */}
      <g>
        <ellipse cx="238" cy="200" rx="30" ry="22" fill={lensFill} stroke={lensStroke} strokeWidth="3"/>
        <ellipse cx="248" cy="190" rx="10" ry="5" fill="#FFFFFF" opacity={isShades ? 0.18 : 0.5}/>
      </g>
      {/* bridge */}
      <line x1="192" y1="200" x2="208" y2="200" stroke={frameColor} strokeWidth="4" strokeLinecap="round"/>
      {/* temples */}
      <line x1="132" y1="200" x2="80" y2="195" stroke={frameColor} strokeWidth="3" strokeLinecap="round"/>
      <line x1="268" y1="200" x2="320" y2="195" stroke={frameColor} strokeWidth="3" strokeLinecap="round"/>
      {/* nose pads */}
      <circle cx="172" cy="216" r="1.6" fill={frameColor}/>
      <circle cx="228" cy="216" r="1.6" fill={frameColor}/>
    </g>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// HEADWEAR
// ═══════════════════════════════════════════════════════════════════════════
function Headwear({ kind, hairColor }: { kind: string; hairColor: string }) {
  if (kind === "none" || !kind) return null;
  if (kind === "hat") {
    // Bowling cap / baseball-cap style
    const capColor = "#C03018";
    const capDark = dk(capColor, 0.22);
    return (
      <g>
        {/* brim */}
        <path d="M 90 158 Q 200 138, 318 158 Q 320 168, 314 174 L 88 174 Q 80 168, 90 158 Z" fill={capDark}/>
        {/* crown */}
        <path d="M 96 156 Q 96 88, 200 70 Q 304 88, 304 156 Q 280 130, 200 124 Q 120 130, 96 156 Z" fill={capColor}/>
        {/* panel seam */}
        <path d="M 200 70 Q 200 110, 200 148" stroke={capDark} strokeWidth="0.8" fill="none" opacity="0.5"/>
        <path d="M 154 80 Q 158 124, 168 154" stroke={capDark} strokeWidth="0.7" fill="none" opacity="0.4"/>
        <path d="M 246 80 Q 242 124, 232 154" stroke={capDark} strokeWidth="0.7" fill="none" opacity="0.4"/>
        {/* button on top */}
        <circle cx="200" cy="78" r="3" fill={capDark}/>
        {/* logo D */}
        <text x="200" y="120" textAnchor="middle" fontSize="32" fontWeight="900" fill="#FFFFFF" fontFamily="Impact, sans-serif" opacity="0.95">D</text>
      </g>
    );
  }
  if (kind === "headband") {
    return (
      <g>
        <rect x="76" y="160" width="248" height="14" rx="3" fill="#E46A2E"/>
        <rect x="84" y="163" width="232" height="3" fill="#FFFFFF" opacity="0.45"/>
        <rect x="84" y="170" width="232" height="2" fill="#000000" opacity="0.15"/>
        {/* small "D" branding */}
        <text x="200" y="172" textAnchor="middle" fontSize="10" fontWeight="900" fill="#FFFFFF" fontFamily="Impact, sans-serif">DUX</text>
      </g>
    );
  }
  return null;
}

// ═══════════════════════════════════════════════════════════════════════════
// NECK / BODY / OUTFIT
// ═══════════════════════════════════════════════════════════════════════════
function NeckAndBody({
  skin, skinDk, outfit, outfitColor, gender,
}: {
  skin: string; skinDk: string; outfit: string; outfitColor: string; gender: string;
}) {
  const outfitDk = dk(outfitColor, 0.22);
  const outfitLt = lt(outfitColor, 0.12);
  return (
    <g>
      {/* Neck */}
      <path d="M 168 348 Q 168 386, 172 410 L 228 410 Q 232 386, 232 348 Q 200 358, 168 348 Z" fill={skin}/>
      {/* Neck shadow under jaw */}
      <path d="M 170 348 Q 200 360, 230 348 Q 200 364, 170 348 Z" fill={skinDk} opacity="0.5"/>
      {/* Subtle neck side shading */}
      <path d="M 168 360 Q 174 388, 180 410 L 174 410 Q 168 388, 166 360 Z" fill={skinDk} opacity="0.35"/>
      <path d="M 232 360 Q 226 388, 220 410 L 226 410 Q 232 388, 234 360 Z" fill={skinDk} opacity="0.35"/>

      {/* Shoulders / shirt */}
      {outfit === "hoodie" ? (
        <g>
          {/* hood */}
          <path d="M 100 410 Q 60 390, 60 460 L 340 460 Q 340 390, 300 410 Q 250 380, 200 380 Q 150 380, 100 410 Z" fill={outfitColor}/>
          {/* hood shadow */}
          <path d="M 130 405 Q 110 410, 92 430 L 92 460 L 308 460 L 308 430 Q 290 410, 270 405 Q 240 388, 200 388 Q 160 388, 130 405 Z" fill={outfitDk} opacity="0.4"/>
          {/* hood opening shape around neck */}
          <path d="M 168 410 Q 200 396, 232 410 Q 232 422, 200 422 Q 168 422, 168 410 Z" fill={outfitDk}/>
          {/* drawstrings */}
          <line x1="184" y1="416" x2="180" y2="450" stroke="#F8F2DC" strokeWidth="2" strokeLinecap="round"/>
          <line x1="216" y1="416" x2="220" y2="450" stroke="#F8F2DC" strokeWidth="2" strokeLinecap="round"/>
          <circle cx="180" cy="452" r="3" fill="#F8F2DC"/>
          <circle cx="220" cy="452" r="3" fill="#F8F2DC"/>
        </g>
      ) : outfit === "letterman" ? (
        <g>
          {/* letterman jacket body */}
          <path d="M 86 460 L 86 432 Q 100 410, 130 408 Q 168 396, 200 396 Q 232 396, 270 408 Q 300 410, 314 432 L 314 460 Z" fill={outfitColor}/>
          {/* white sleeves */}
          <path d="M 86 460 L 86 432 Q 92 412, 108 408 L 108 460 Z" fill="#F0EFE8"/>
          <path d="M 314 460 L 314 432 Q 308 412, 292 408 L 292 460 Z" fill="#F0EFE8"/>
          {/* collar (V) */}
          <path d="M 168 410 Q 200 420, 232 410 L 224 432 Q 200 444, 176 432 Z" fill="#F0EFE8"/>
          {/* center button strip */}
          <line x1="200" y1="426" x2="200" y2="460" stroke={outfitDk} strokeWidth="1"/>
          <circle cx="200" cy="436" r="2" fill={outfitLt}/>
          <circle cx="200" cy="448" r="2" fill={outfitLt}/>
          {/* "D" letter patch */}
          <text x="156" y="448" textAnchor="middle" fontSize="32" fontWeight="900" fill="#C8A020" fontFamily="Georgia, serif">D</text>
        </g>
      ) : outfit === "polo" ? (
        <g>
          {/* polo body */}
          <path d="M 86 460 L 86 434 Q 100 412, 132 410 Q 168 396, 200 396 Q 232 396, 268 410 Q 300 412, 314 434 L 314 460 Z" fill={outfitColor}/>
          {/* polo collar */}
          <path d="M 168 410 Q 184 404, 200 412 Q 216 404, 232 410 L 224 426 Q 200 432, 176 426 Z" fill={outfitColor} stroke={outfitDk} strokeWidth="1"/>
          <path d="M 192 412 L 192 444" stroke={outfitDk} strokeWidth="0.8"/>
          <circle cx="192" cy="422" r="1.5" fill={outfitLt}/>
          <circle cx="192" cy="434" r="1.5" fill={outfitLt}/>
          {/* small chest logo */}
          <path d="M 232 432 L 240 432 L 240 440 L 236 444 L 232 440 Z" fill={outfitLt} opacity="0.7"/>
        </g>
      ) : outfit === "jersey" ? (
        <g>
          <path d="M 86 460 L 86 432 Q 100 410, 132 408 Q 168 396, 200 396 Q 232 396, 268 408 Q 300 410, 314 432 L 314 460 Z" fill={outfitColor}/>
          {/* V-neck */}
          <path d="M 168 410 L 200 432 L 232 410 L 224 408 L 200 422 L 176 408 Z" fill={outfitDk}/>
          {/* number */}
          <text x="200" y="450" textAnchor="middle" fontSize="34" fontWeight="900" fill={outfitLt} fontFamily="Impact, sans-serif">42</text>
          {/* shoulder seams */}
          <path d="M 130 410 Q 132 420, 132 432" stroke={outfitDk} strokeWidth="0.8" fill="none"/>
          <path d="M 270 410 Q 268 420, 268 432" stroke={outfitDk} strokeWidth="0.8" fill="none"/>
        </g>
      ) : (
        // bowling-shirt (default)
        <g>
          <path d="M 86 460 L 86 434 Q 100 412, 132 410 Q 168 396, 200 396 Q 232 396, 268 410 Q 300 412, 314 434 L 314 460 Z" fill={outfitColor}/>
          {/* button placket */}
          <line x1="200" y1="412" x2="200" y2="460" stroke={outfitDk} strokeWidth="1"/>
          {/* buttons */}
          <circle cx="200" cy="424" r="2" fill={outfitDk}/>
          <circle cx="200" cy="438" r="2" fill={outfitDk}/>
          <circle cx="200" cy="452" r="2" fill={outfitDk}/>
          {/* collar (camp shirt style) */}
          <path d="M 168 412 L 200 422 L 232 412 L 226 426 L 200 432 L 174 426 Z" fill={outfitLt} opacity="0.55"/>
          {/* chest pocket */}
          <rect x="232" y="428" width="22" height="20" fill="none" stroke={outfitDk} strokeWidth="0.8" rx="1"/>
          {/* embroidered "D" */}
          <text x="156" y="446" textAnchor="middle" fontSize="14" fontWeight="900" fill={outfitLt} fontFamily="Georgia, serif">D</text>
        </g>
      )}

      {/* Add subtle gender-derived shoulder shape (female slimmer) */}
      {gender === "female" && (
        <path d="M 100 460 L 100 440 Q 110 422, 130 420 L 270 420 Q 290 422, 300 440 L 300 460 Z" fill={outfitColor} opacity="0.0"/>
      )}
    </g>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SKIN SHADING — applies subtle facial shading on top of head shape
// ═══════════════════════════════════════════════════════════════════════════
function SkinShading({ skin, skinDk, gender }: { skin: string; skinDk: string; gender: string }) {
  const blush = mix(skin, "#D85060", 0.30);
  return (
    <g>
      {/* cheekbone highlight */}
      <ellipse cx="148" cy="232" rx="22" ry="16" fill={skin} opacity="0" />
      {/* cheek blush */}
      <ellipse cx="148" cy="240" rx="22" ry="14" fill={blush} opacity={gender === "female" ? 0.28 : 0.14}/>
      <ellipse cx="252" cy="240" rx="22" ry="14" fill={blush} opacity={gender === "female" ? 0.28 : 0.14}/>
      {/* chin highlight */}
      <ellipse cx="200" cy="332" rx="16" ry="10" fill={lt(skin, 0.10)} opacity="0.35"/>
      {/* forehead highlight */}
      <ellipse cx="200" cy="148" rx="50" ry="20" fill={lt(skin, 0.08)} opacity="0.35"/>
      {/* nose bridge highlight */}
      <ellipse cx="200" cy="220" rx="3" ry="22" fill={lt(skin, 0.10)} opacity="0.40"/>
      {/* under-eye shadow */}
      <ellipse cx="162" cy="216" rx="20" ry="3" fill={skinDk} opacity="0.22"/>
      <ellipse cx="238" cy="216" rx="20" ry="3" fill={skinDk} opacity="0.22"/>
      {/* jaw shadow */}
      <path d="M 100 280 Q 110 320, 138 348 L 138 360 Q 102 326, 88 290 Z" fill={skinDk} opacity="0.18"/>
      <path d="M 300 280 Q 290 320, 262 348 L 262 360 Q 298 326, 312 290 Z" fill={skinDk} opacity="0.18"/>
    </g>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPOSITE — assembles all layers in correct z-order
// ═══════════════════════════════════════════════════════════════════════════

export interface AvatarSVGProps {
  state: AvatarState;
  /** Show the colored circular background. Default true. */
  showBackground?: boolean;
  /** Override size. Default fills 100% of parent. */
  size?: number | string;
  /** Animate floating motion (matches old Three.js scene). Default false. */
  animated?: boolean;
}

export default function AvatarSVG({
  state,
  showBackground = true,
  size = "100%",
  animated = false,
}: AvatarSVGProps) {
  // Apply sensible defaults for optional fields
  const freckles   = state.freckles   ?? "none";
  const browStyle  = state.browStyle  ?? "default";
  const eyeShape   = state.eyeShape   ?? "almond";
  const eyelashes  = state.eyelashes  ?? (state.gender === "female");
  const noseStyle  = state.noseStyle  ?? "default";
  const mouthShape = state.mouthShape ?? "default";
  const lipKey     = state.lipColor   ?? "natural";
  const earSize    = state.earSize    ?? "default";
  const age        = state.age        ?? "adult";

  const skin = SKIN_TONES[state.skinToneIdx] ?? SKIN_TONES[3];
  const skinDk = dk(skin, 0.18);
  const skinDk2 = dk(skin, 0.32);
  const hair = HAIR_HEX[state.hairColor] ?? HAIR_HEX.brown;
  const eyeColor = EYE_HEX[state.eyeColor] ?? EYE_HEX.brown;
  const lipColor = LIP_HEX[lipKey] ?? LIP_HEX.natural;
  const outfitColor = OUTFIT_HEX[state.outfit] ?? OUTFIT_HEX["bowling-shirt"];
  const facePath = getFacePath(state.faceShape, age);
  const accessoriesList = state.accessories || [];
  const wantsEyewear = state.eyewear && state.eyewear !== "none"
    ? state.eyewear
    : accessoriesList.includes("sunglasses") ? "sunglasses"
    : accessoriesList.includes("glasses") ? "glasses"
    : "none";
  const wantsHeadwear = state.headwear && state.headwear !== "none"
    ? state.headwear
    : accessoriesList.includes("hat") ? "hat"
    : accessoriesList.includes("headband") ? "headband"
    : "none";
  const wantsEarrings = state.earrings ?? accessoriesList.includes("earrings");

  // The whole composition fits in viewBox 0 0 400 460.
  // Background gradient circle is drawn first if requested.

  return (
    <div
      style={{
        width: typeof size === "number" ? `${size}px` : size,
        height: typeof size === "number" ? `${size}px` : size,
        display: "flex", alignItems: "center", justifyContent: "center",
        position: "relative",
      }}
    >
      <svg
        viewBox="0 0 400 460"
        style={{
          width: "100%",
          height: "100%",
          maxWidth: "100%",
          maxHeight: "100%",
          overflow: "visible",
          animation: animated ? "avatar-float 4s ease-in-out infinite" : undefined,
        }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Background circle gradient */}
          <radialGradient id="bg-grad" cx="50%" cy="35%" r="70%">
            <stop offset="0%" stopColor={lt(state.bgColor, 0.18)}/>
            <stop offset="65%" stopColor={state.bgColor}/>
            <stop offset="100%" stopColor={dk(state.bgColor, 0.10)}/>
          </radialGradient>

          {/* Skin gradient (subtle) */}
          <radialGradient id="skin-grad" cx="50%" cy="38%" r="62%">
            <stop offset="0%" stopColor={lt(skin, 0.08)}/>
            <stop offset="70%" stopColor={skin}/>
            <stop offset="100%" stopColor={dk(skin, 0.10)}/>
          </radialGradient>

          {/* Soft drop shadow filter (for floating elements like hat) */}
          <filter id="soft-shadow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2" />
            <feOffset dx="0" dy="2" />
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.18" />
            </feComponentTransfer>
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>

          {/* Background mask — clips to a circle so background only fills inside */}
          <clipPath id="bg-clip">
            <circle cx="200" cy="230" r="220"/>
          </clipPath>
        </defs>

        {/* ── BACKGROUND CIRCLE ── */}
        {showBackground && (
          <g>
            <circle cx="200" cy="230" r="220" fill="url(#bg-grad)"/>
          </g>
        )}

        {/* ── HAIR BACK LAYER ── (behind everything else) */}
        <HairBack style={state.hairStyle} color={hair}/>

        {/* ── BODY / SHIRT ── */}
        <NeckAndBody
          skin={skin}
          skinDk={skinDk}
          outfit={state.outfit}
          outfitColor={outfitColor}
          gender={state.gender}
        />

        {/* ── EARS ── (behind face) */}
        <Ears skin={skin} skinDk={skinDk} earSize={earSize} earrings={wantsEarrings} faceShape={state.faceShape}/>

        {/* ── HEAD SHAPE ── */}
        <path d={facePath} fill="url(#skin-grad)"/>
        {/* face overlay solid (gradient sometimes too subtle) */}
        <path d={facePath} fill={skin} opacity="0.55"/>

        {/* ── SKIN SHADING ── */}
        <SkinShading skin={skin} skinDk={skinDk} gender={state.gender}/>

        {/* ── AGING ── */}
        <AgingMarks age={age} skinDk={skinDk2}/>

        {/* ── FRECKLES ── */}
        <Freckles density={freckles} color={dk(skin, 0.42)}/>

        {/* ── BROWS ── */}
        <Brows style={browStyle} color={hair}/>

        {/* ── EYES ── */}
        <Eyes shape={eyeShape} color={eyeColor} eyelashes={eyelashes} gender={state.gender}/>

        {/* ── NOSE ── */}
        <Nose style={noseStyle} skin={skin} skinDk={skinDk2}/>

        {/* ── MOUTH ── */}
        <Mouth shape={mouthShape} lipColor={lipColor} gender={state.gender}/>

        {/* ── FACIAL HAIR ── (only male) */}
        {state.gender === "male" && (
          <FacialHair style={state.facialHair} color={hair}/>
        )}

        {/* ── HAIR FRONT LAYER ── (covers forehead, on top of face) */}
        <HairFront style={state.hairStyle} color={hair}/>

        {/* ── EYEWEAR ── (above hair if covering) */}
        <Eyewear kind={wantsEyewear}/>

        {/* ── HEADWEAR ── (top-most face element) */}
        <Headwear kind={wantsHeadwear} hairColor={hair}/>
      </svg>

      <style>{`
        @keyframes avatar-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  );
}
