"use client";
import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// ─── Color maps ───────────────────────────────────────────────────────────────
export const SKIN_TONES = [
  "#FDDBB4","#F8CDA0","#F0BC8A","#E8A87C",
  "#D4906A","#C07858","#A86040","#8C4A2C",
  "#7A3A20","#5C2810","#3E1808","#2A0E04",
];
const HAIR_HEX: Record<string,string> = {
  blonde:"#C8A456", chestnut:"#7B3F1B", brown:"#5C2E18",
  auburn:"#5A2018", red:"#8A2010",   black:"#150A04",
  gray:"#808080",   silver:"#B0B0B0", white:"#D8D8D0",
  platinum:"#C8C8BC", pink:"#D890A8", blue:"#4878B0", purple:"#8060A8",
};
const EYE_HEX: Record<string,string> = {
  brown:"#4A2C10", hazel:"#6A5030", amber:"#906810",
  green:"#285830", blue:"#2860A8",  sky:"#6898C0",
  gray:"#607080",  violet:"#705090",
};
const OUTFIT_HEX: Record<string,string> = {
  "bowling-shirt":"#C03018", letterman:"#1A3A8C",
  jersey:"#186030",          polo:"#284888",
  hoodie:"#282838",
};
const PANTS_COLOR = "#1e2240";

// ─── AvatarState ──────────────────────────────────────────────────────────────
export interface AvatarState {
  skinToneIdx:  number;
  hairStyle:    string;
  hairColor:    string;
  eyeColor:     string;
  faceShape:    string;
  facialHair:   string;
  outfit:       string;
  accessories:  string[];
  bgColor:      string;
  gender:       "male" | "female";
  freckles?:    "none" | "light" | "heavy";
  browStyle?:   "default" | "thin" | "thick" | "arched" | "angled" | "straight";
  eyeShape?:    "round" | "almond" | "narrow" | "downturned";
  eyelashes?:   boolean;
  noseStyle?:   "default" | "small" | "wide" | "long" | "button";
  mouthShape?:  "default" | "smile" | "neutral" | "small" | "full";
  lipColor?:    string;
  earSize?:     "default" | "small" | "large";
  age?:         "young" | "adult" | "mature";
}

// ─── Color helpers ────────────────────────────────────────────────────────────
function darken(hex: string, amt: number): string {
  const c = new THREE.Color(hex);
  return "#" + c.multiplyScalar(1 - amt).getHexString();
}
function lighten(hex: string, amt: number): string {
  const c = new THREE.Color(hex);
  c.r = Math.min(1, c.r + amt);
  c.g = Math.min(1, c.g + amt);
  c.b = Math.min(1, c.b + amt);
  return "#" + c.getHexString();
}

// ─── Material shorthand ───────────────────────────────────────────────────────
function Mat({
  color, roughness = 0.75, metalness = 0,
  emissive, emissiveIntensity = 0, transparent, opacity,
}: {
  color: string; roughness?: number; metalness?: number;
  emissive?: string; emissiveIntensity?: number;
  transparent?: boolean; opacity?: number;
}) {
  return (
    <meshStandardMaterial
      color={color} roughness={roughness} metalness={metalness}
      emissive={emissive ?? "#000000"} emissiveIntensity={emissiveIntensity}
      transparent={transparent} opacity={opacity ?? 1}
    />
  );
}

// ─── BOWLING BALL ─────────────────────────────────────────────────────────────
function BowlingBall() {
  return (
    <group>
      <mesh castShadow>
        <sphereGeometry args={[0.155, 32, 28]} />
        <meshStandardMaterial color="#0d1f14" roughness={0.12} metalness={0.18}
          emissive="#071409" emissiveIntensity={0.06} />
      </mesh>
      {/* finger holes */}
      {([[0,0.085,0.125],[0.052,0.04,0.128],[-0.052,0.04,0.128]] as [number,number,number][]).map(([x,y,z],i) => (
        <mesh key={i} position={[x,y,z]}>
          <sphereGeometry args={[0.023,10,8]} />
          <meshStandardMaterial color="#030a06" roughness={0.8} />
        </mesh>
      ))}
      {/* surface gloss glint */}
      <mesh position={[-0.065,0.10,0.095]}>
        <sphereGeometry args={[0.032,10,8]} />
        <meshStandardMaterial color="white" transparent opacity={0.20}
          roughness={0.04} emissive="white" emissiveIntensity={0.18} />
      </mesh>
      {/* secondary smaller glint */}
      <mesh position={[-0.02,0.125,0.085]}>
        <sphereGeometry args={[0.014,8,6]} />
        <meshStandardMaterial color="white" transparent opacity={0.12}
          roughness={0.05} emissive="white" emissiveIntensity={0.10} />
      </mesh>
    </group>
  );
}

// ─── HAND ─────────────────────────────────────────────────────────────────────
function Fingernail({ skin }: { skin: string }) {
  return (
    <mesh rotation={[0.35, 0, 0]} scale={[0.78, 0.48, 0.38]}>
      <sphereGeometry args={[0.019, 8, 6]} />
      <Mat color={lighten(skin, 0.14)} roughness={0.35} metalness={0.04} />
    </mesh>
  );
}

function Finger({ skin, index }: { skin: string; index: number }) {
  const skinDk  = darken(skin, 0.12);
  // finger proportions vary by index (0=index, 1=middle, 2=ring, 3=pinky)
  const lengths  = [0.068, 0.076, 0.072, 0.054];
  const radii    = [0.022, 0.024, 0.022, 0.019];
  const midLen   = [0.050, 0.058, 0.054, 0.040];
  const distalLen= [0.040, 0.046, 0.042, 0.032];
  const len = lengths[index];  const rad = radii[index];
  return (
    <group rotation={[-0.15, 0, 0]}>
      {/* proximal phalanx */}
      <mesh>
        <capsuleGeometry args={[rad, len, 4, 8]} />
        <Mat color={skin} roughness={0.66} />
      </mesh>
      {/* knuckle crease */}
      <mesh position={[0, len * 0.55, 0]} scale={[1.1, 0.30, 1.0]}>
        <sphereGeometry args={[rad * 1.1, 10, 8]} />
        <Mat color={skinDk} roughness={0.68} />
      </mesh>
      {/* middle phalanx */}
      <group position={[0, len * 0.72, 0]}>
        <mesh>
          <capsuleGeometry args={[rad * 0.92, midLen[index], 4, 8]} />
          <Mat color={skin} roughness={0.66} />
        </mesh>
        {/* distal phalanx */}
        <group position={[0, midLen[index] * 0.72, 0]}>
          <mesh>
            <capsuleGeometry args={[rad * 0.84, distalLen[index], 4, 8]} />
            <Mat color={skin} roughness={0.66} />
          </mesh>
          {/* fingertip pad */}
          <mesh position={[0, distalLen[index] * 0.5, 0.012]} scale={[1, 0.82, 0.88]}>
            <sphereGeometry args={[rad * 0.96, 10, 8]} />
            <Mat color={darken(skin, 0.06)} roughness={0.70} />
          </mesh>
          {/* fingernail */}
          <group position={[0, distalLen[index] * 0.35, 0.016]}>
            <Fingernail skin={skin} />
          </group>
        </group>
      </group>
    </group>
  );
}

function Hand({ skin, mirror = false }: { skin: string; mirror?: boolean }) {
  const skinDk  = darken(skin, 0.14);
  const skinDk2 = darken(skin, 0.26);
  const s = mirror ? -1 : 1;

  // x-offset, z-offset, z-tilt for each of 4 fingers
  const fingerLayout: [number,number,number][] = [
    [-0.055, 0.020, 0.075],
    [-0.020, 0.025, 0.020],
    [ 0.018, 0.025,-0.020],
    [ 0.052, 0.020,-0.075],
  ];

  return (
    <group scale={[s, 1, 1]}>
      {/* ── Palm ── */}
      <mesh castShadow scale={[1.08, 0.82, 0.50]}>
        <sphereGeometry args={[0.114, 20, 16]} />
        <Mat color={skin} roughness={0.66} />
      </mesh>
      {/* palm heel pad */}
      <mesh position={[0, -0.05, 0.02]} scale={[0.82, 0.55, 0.48]}>
        <sphereGeometry args={[0.11, 14, 10]} />
        <Mat color={skinDk} roughness={0.70} />
      </mesh>
      {/* thenar eminence (thumb mound) */}
      <mesh position={[-s * 0.055, 0.01, 0.02]} scale={[0.62, 0.68, 0.52]}>
        <sphereGeometry args={[0.10, 12, 8]} />
        <Mat color={lighten(skin, 0.04)} roughness={0.68} />
      </mesh>
      {/* metacarpal ridge — back of hand */}
      <mesh position={[0, 0.08, 0.022]} scale={[1.04, 0.28, 0.42]}>
        <sphereGeometry args={[0.105, 14, 8]} />
        <Mat color={skinDk} roughness={0.70} />
      </mesh>
      {/* knuckle bumps */}
      {([-0.055,-0.018,0.018,0.052] as number[]).map((fx,i) => (
        <mesh key={i} position={[fx, 0.092, 0.016]} scale={[0.55, 0.40, 0.52]}>
          <sphereGeometry args={[0.028, 10, 8]} />
          <Mat color={skinDk2} roughness={0.70} />
        </mesh>
      ))}
      {/* ── Fingers ── */}
      {fingerLayout.map(([fx, fz, tz], i) => (
        <group key={i} position={[fx, 0.104, fz]} rotation={[0, 0, tz]}>
          <Finger skin={skin} index={i} />
        </group>
      ))}
      {/* ── Thumb ── */}
      <group position={[s * -0.098, 0.026, 0.030]} rotation={[0.08, 0, s * -0.72]}>
        <mesh>
          <capsuleGeometry args={[0.028, 0.052, 4, 8]} />
          <Mat color={skin} roughness={0.66} />
        </mesh>
        {/* thumb IP joint */}
        <mesh position={[0, 0.038, 0]} scale={[1.08, 0.40, 1.0]}>
          <sphereGeometry args={[0.028, 10, 8]} />
          <Mat color={skinDk} roughness={0.68} />
        </mesh>
        {/* thumb distal */}
        <group position={[0, 0.058, 0]}>
          <mesh>
            <capsuleGeometry args={[0.025, 0.040, 4, 8]} />
            <Mat color={skin} roughness={0.66} />
          </mesh>
          <mesh position={[0, 0.028, 0.014]} scale={[0.88, 0.55, 0.80]}>
            <sphereGeometry args={[0.026, 10, 8]} />
            <Mat color={skinDk} roughness={0.68} />
          </mesh>
          <group position={[0, 0.018, 0.018]}>
            <Fingernail skin={skin} />
          </group>
        </group>
      </group>
    </group>
  );
}

// ─── SHOE ─────────────────────────────────────────────────────────────────────
function Shoe({ mirror = false }: { mirror?: boolean }) {
  const s = mirror ? -1 : 1;
  const shoeMain   = "#1a1010";
  const shoeDk     = "#0d0808";
  const shoeMid    = "#e8e0d4";
  const laceColor  = "#f0ece6";

  return (
    <group scale={[s, 1, 1]}>
      {/* ── Upper — heel block ── */}
      <mesh position={[0, 0.044, -0.068]} scale={[0.96, 0.80, 0.88]} castShadow>
        <sphereGeometry args={[0.135, 20, 14]} />
        <Mat color={shoeMain} roughness={0.44} metalness={0.08} />
      </mesh>
      {/* ── Upper — toe box (elongated) ── */}
      <mesh position={[0, 0.012, 0.138]} scale={[1.04, 0.56, 1.28]} castShadow>
        <sphereGeometry args={[0.118, 20, 14]} />
        <Mat color={shoeMain} roughness={0.44} metalness={0.08} />
      </mesh>
      {/* bridge connecting heel to toe */}
      <mesh position={[0, -0.010, 0.036]} scale={[0.98, 0.48, 1.55]}>
        <sphereGeometry args={[0.112, 16, 10]} />
        <Mat color={shoeMain} roughness={0.46} />
      </mesh>
      {/* ── Lace panel ── */}
      <mesh position={[0, 0.068, 0.096]} scale={[0.66, 0.36, 1.08]}>
        <sphereGeometry args={[0.105, 14, 10]} />
        <Mat color={darken(shoeMain, 0.14)} roughness={0.55} />
      </mesh>
      {/* ── Lace rows (horizontal bands) ── */}
      {([0.016, 0.044, 0.072, 0.100] as number[]).map((zOff, i) => (
        <mesh key={i} position={[0, 0.080, zOff]} rotation={[0, 0, Math.PI / 2]}>
          <capsuleGeometry args={[0.007, 0.066, 4, 6]} />
          <Mat color={laceColor} roughness={0.82} />
        </mesh>
      ))}
      {/* ── Lace cross pattern ── */}
      {([0.028, 0.058, 0.086] as number[]).map((zOff, i) => (
        <group key={i}>
          <mesh position={[0.020, 0.088, zOff]} rotation={[0.12, 0, 0.42]}>
            <capsuleGeometry args={[0.005, 0.038, 3, 5]} />
            <Mat color={laceColor} roughness={0.84} />
          </mesh>
          <mesh position={[-0.020, 0.088, zOff]} rotation={[0.12, 0, -0.42]}>
            <capsuleGeometry args={[0.005, 0.038, 3, 5]} />
            <Mat color={laceColor} roughness={0.84} />
          </mesh>
        </group>
      ))}
      {/* ── Midsole — white rubber strip ── */}
      <mesh position={[0, -0.100, 0.032]} scale={[1.10, 0.24, 1.62]}>
        <sphereGeometry args={[0.116, 18, 10]} />
        <Mat color={shoeMid} roughness={0.88} />
      </mesh>
      {/* ── Outsole ── */}
      <mesh position={[0, -0.157, 0.032]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.135, 0.138, 0.032, 22]} />
        <Mat color={shoeDk} roughness={0.96} />
      </mesh>
      {/* outsole tread grooves */}
      {([-0.06, -0.02, 0.02, 0.06] as number[]).map((z, i) => (
        <mesh key={i} position={[0, -0.158, z + 0.032]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.136, 0.136, 0.006, 18]} />
          <Mat color={lighten(shoeDk, 0.08)} roughness={0.98} />
        </mesh>
      ))}
      {/* ── Heel counter (back support) ── */}
      <mesh position={[0, 0.010, -0.124]} scale={[0.78, 0.68, 0.40]}>
        <sphereGeometry args={[0.118, 14, 10]} />
        <Mat color={darken(shoeMain, 0.12)} roughness={0.46} />
      </mesh>
    </group>
  );
}

// ─── HAIR STYLES ──────────────────────────────────────────────────────────────
function HairMesh({ style, color }: { style: string; color: string }) {
  const dark  = darken(color, 0.32);
  const light = lighten(color, 0.09);
  const mat  = <Mat color={color} roughness={0.88} />;
  const matD = <Mat color={dark}  roughness={0.88} />;
  const matL = <Mat color={light} roughness={0.85} />;

  if (style === "bald") return null;

  // ── Buzz cut ───────────────────────────────────────────────────────────────
  if (style === "buzz") return (
    <group>
      {/* full scalp cap */}
      <mesh position={[0, 0.022, 0]} scale={[1.030, 1.028, 1.030]}>
        <sphereGeometry args={[0.430, 32, 20, 0, Math.PI*2, 0, Math.PI*0.58]} />
        {mat}
      </mesh>
      {/* temple buzz down to ear level */}
      {([-1,1] as number[]).map((side,i) => (
        <group key={i}>
          <mesh position={[side*0.380, -0.05, 0.03]} scale={[0.52, 0.82, 0.46]}>
            <sphereGeometry args={[0.132, 12, 10]} />
            {mat}
          </mesh>
          <mesh position={[side*0.368, -0.12, 0.0]} scale={[0.46, 0.68, 0.40]}>
            <sphereGeometry args={[0.128, 12, 8]} />
            {matD}
          </mesh>
        </group>
      ))}
      {/* hairline definition at forehead */}
      <mesh position={[0, 0.268, 0.318]} rotation={[0.22, 0, 0]} scale={[1.02, 0.18, 0.56]}>
        <sphereGeometry args={[0.22, 16, 8, 0, Math.PI*2, 0, Math.PI*0.42]} />
        {matD}
      </mesh>
    </group>
  );

  // ── Short ──────────────────────────────────────────────────────────────────
  if (style === "short") return (
    <group>
      {/* main cap — covers top and well down the sides */}
      <mesh position={[0, 0.030, 0]}>
        <sphereGeometry args={[0.452, 32, 22, 0, Math.PI*2, 0, Math.PI*0.58]} />
        {mat}
      </mesh>
      {/* side pieces — ABOVE ear level, not onto cheeks */}
      {([-1,1] as number[]).map((side,i) => (
        <group key={i}>
          <mesh position={[side*0.360, 0.085, -0.010]} scale={[0.52, 0.78, 0.52]}>
            <sphereGeometry args={[0.132, 14, 10]} />
            {mat}
          </mesh>
          {/* taper at temple */}
          <mesh position={[side*0.352, -0.010, 0.080]} scale={[0.46, 0.58, 0.48]}>
            <sphereGeometry args={[0.118, 12, 8]} />
            {matD}
          </mesh>
        </group>
      ))}
      {/* nape coverage at back */}
      <mesh position={[0, -0.060, -0.295]} scale={[1.02, 0.52, 0.56]}>
        <sphereGeometry args={[0.360, 20, 12, 0, Math.PI*2, Math.PI*0.42, Math.PI*0.24]} />
        {matD}
      </mesh>
      {/* front fringe — small tufts above forehead, clearly above brow */}
      {([[0,0.405,0.218,0.082],[ 0.112,0.388,0.205,0.070],[-0.112,0.388,0.205,0.070]] as [number,number,number,number][]).map(([x,y,z,r],i) => (
        <mesh key={i} position={[x, y, z]}>
          <sphereGeometry args={[r, 10, 8]} />
          {i === 0 ? matL : mat}
        </mesh>
      ))}
    </group>
  );

  // ── Pompadour ──────────────────────────────────────────────────────────────
  if (style === "pompadour") return (
    <group>
      {/* full base cap */}
      <mesh position={[0, 0.025, 0]}>
        <sphereGeometry args={[0.458, 32, 22, 0, Math.PI*2, 0, Math.PI*0.58]} />
        {mat}
      </mesh>
      {/* pompadour volume — high on top, only slightly forward, no face intrusion */}
      <mesh position={[0, 0.478, 0.055]} rotation={[0.14, 0, 0]} scale={[0.90, 0.96, 0.78]}>
        <sphereGeometry args={[0.255, 22, 16]} />
        {mat}
      </mesh>
      {/* tall crown highlight */}
      <mesh position={[0, 0.595, 0.042]} rotation={[0.16, 0, 0]} scale={[0.66, 1.08, 0.56]}>
        <sphereGeometry args={[0.188, 18, 14]} />
        {matL}
      </mesh>
      {/* swept-back ridge strands */}
      {([-0.108, 0, 0.108] as number[]).map((x, i) => (
        <mesh key={i} position={[x, 0.435, 0.165]} rotation={[0.08, 0, x * 0.38]}>
          <capsuleGeometry args={[0.032, 0.155, 4, 8]} />
          {i === 1 ? matL : matD}
        </mesh>
      ))}
      {/* side taper */}
      {([-1,1] as number[]).map((side,i) => (
        <mesh key={i} position={[side*0.352, 0.065, 0.010]} scale={[0.50, 0.72, 0.50]}>
          <sphereGeometry args={[0.132, 12, 8]} />
          {mat}
        </mesh>
      ))}
    </group>
  );

  // ── Bob ────────────────────────────────────────────────────────────────────
  if (style === "bob") return (
    <group>
      {/* main cap */}
      <mesh position={[0, 0.038, -0.018]}>
        <sphereGeometry args={[0.455, 32, 22, 0, Math.PI*2, 0, Math.PI*0.60]} />
        {mat}
      </mesh>
      {/* side panels — hang down to jaw */}
      {([-1,1] as number[]).map((side,i) => (
        <group key={i}>
          <mesh position={[side*0.355, -0.145, 0.015]} scale={[0.60, 1.25, 0.66]}>
            <capsuleGeometry args={[0.178, 0.290, 8, 12]} />
            {mat}
          </mesh>
          <mesh position={[side*0.300, -0.365, 0.048]} scale={[0.66, 0.56, 0.72]}>
            <sphereGeometry args={[0.198, 16, 12]} />
            {matD}
          </mesh>
          {/* ends — straight cut bottom edge */}
          <mesh position={[side*0.280, -0.428, 0.055]} scale={[0.82, 0.18, 0.80]}>
            <sphereGeometry args={[0.178, 14, 8]} />
            {matD}
          </mesh>
        </group>
      ))}
      {/* back coverage */}
      <mesh position={[0, -0.170, -0.275]} scale={[1.08, 0.86, 0.56]}>
        <sphereGeometry args={[0.360, 20, 14]} />
        {mat}
      </mesh>
      {/* bangs — straight across forehead, clearly above brow */}
      <mesh position={[0, 0.272, 0.350]} rotation={[0.22, 0, 0]} scale={[1.05, 0.50, 0.62]}>
        <sphereGeometry args={[0.278, 22, 12, 0, Math.PI*2, 0, Math.PI*0.36]} />
        {matD}
      </mesh>
    </group>
  );

  // ── Long ───────────────────────────────────────────────────────────────────
  if (style === "long") return (
    <group>
      {/* top cap */}
      <mesh position={[0, 0.038, -0.018]}>
        <sphereGeometry args={[0.455, 32, 22, 0, Math.PI*2, 0, Math.PI*0.58]} />
        {mat}
      </mesh>
      {/* long side strands */}
      {([-1,1] as number[]).map((side,i) => (
        <group key={i}>
          <mesh position={[side*0.345, -0.325, -0.038]} rotation={[0.05,side*-0.08,0]} scale={[0.64,1,0.64]}>
            <capsuleGeometry args={[0.142, 0.720, 6, 12]} />
            {mat}
          </mesh>
          <mesh position={[side*0.300, -0.925, -0.068]} rotation={[0.06,side*-0.10,0]} scale={[0.56,1,0.60]}>
            <capsuleGeometry args={[0.120, 0.480, 6, 10]} />
            {matD}
          </mesh>
        </group>
      ))}
      {/* center back volume */}
      <mesh position={[0, -0.225, -0.225]} scale={[1.06, 1, 0.66]}>
        <capsuleGeometry args={[0.225, 0.480, 8, 14]} />
        {mat}
      </mesh>
      <mesh position={[0, -0.795, -0.205]} scale={[0.86, 1, 0.60]}>
        <capsuleGeometry args={[0.182, 0.480, 6, 12]} />
        {matD}
      </mesh>
      {/* natural wave at bottom */}
      {([-0.12,0,0.12] as number[]).map((x,i) => (
        <mesh key={i} position={[x, -1.12, -0.180]} scale={[0.70,0.68,0.62]}>
          <sphereGeometry args={[0.145, 12, 10]} />
          {i === 1 ? matL : matD}
        </mesh>
      ))}
    </group>
  );

  // ── Curly ──────────────────────────────────────────────────────────────────
  if (style === "curly") return (
    <group>
      {/* base cap */}
      <mesh position={[0, 0.050, 0]} scale={[1.04, 1.04, 1.04]}>
        <sphereGeometry args={[0.432, 28, 20, 0, Math.PI*2, 0, Math.PI*0.62]} />
        {mat}
      </mesh>
      {/* curl cluster balls — distributed around head */}
      {([
        [0,    0.465, 0.200, 0.142], [ 0.222,0.402,0.158,0.118],[-0.222,0.402,0.158,0.118],
        [0.385,0.218, 0.058, 0.108], [-0.385,0.218,0.058,0.108],
        [0.282,0.285,-0.225, 0.120], [-0.282,0.285,-0.225,0.120],
        [0,    0.205,-0.345, 0.132], [ 0.165,0.382,0.105,0.098], [-0.165,0.382,0.105,0.098],
        [0.325,0.082,-0.182, 0.096], [-0.325,0.082,-0.182,0.096],
        [0.152,0.455,0.148, 0.088],  [-0.152,0.455,0.148,0.088],
        [0.385,-0.042,-0.065,0.092], [-0.385,-0.042,-0.065,0.092],
      ] as [number,number,number,number][]).map(([x,y,z,r],i) => (
        <mesh key={i} position={[x,y,z]}>
          <sphereGeometry args={[r, 12, 10]} />
          {i%3===0 ? matL : i%3===1 ? mat : matD}
        </mesh>
      ))}
    </group>
  );

  // ── Top bun ────────────────────────────────────────────────────────────────
  if (style === "bun") return (
    <group>
      {/* base cap */}
      <mesh position={[0, 0.028, -0.018]}>
        <sphereGeometry args={[0.448, 32, 22, 0, Math.PI*2, 0, Math.PI*0.58]} />
        {mat}
      </mesh>
      {/* swept-back hair volume */}
      <mesh position={[0, 0.148, -0.268]} scale={[0.80, 0.66, 0.66]}>
        <sphereGeometry args={[0.302, 18, 14]} />
        {matD}
      </mesh>
      {/* bun sphere */}
      <mesh position={[0, 0.292, -0.378]} scale={[0.98, 0.86, 0.86]}>
        <sphereGeometry args={[0.202, 20, 16]} />
        {mat}
      </mesh>
      {/* hair tie / scrunchie */}
      <mesh position={[0, 0.292, -0.378]} rotation={[Math.PI/2, 0, 0]}>
        <torusGeometry args={[0.142, 0.038, 8, 24]} />
        {matD}
      </mesh>
      {/* hair tie knot */}
      <mesh position={[0, 0.330, -0.378]} scale={[0.68, 0.68, 0.68]}>
        <sphereGeometry args={[0.046, 8, 8]} />
        {matD}
      </mesh>
    </group>
  );

  // fallback — generic cap
  return (
    <mesh position={[0, 0.028, 0]}>
      <sphereGeometry args={[0.448, 32, 22, 0, Math.PI*2, 0, Math.PI*0.58]} />
      {mat}
    </mesh>
  );
}

// ─── FACIAL HAIR ──────────────────────────────────────────────────────────────
function FacialHairMesh({ style, color }: { style: string; color: string }) {
  const dark = darken(color, 0.28);
  if (style === "none" || !style) return null;

  if (style === "stubble") return (
    <group>
      {/* upper jaw / cheek stubble */}
      <mesh position={[0,-0.168,0.348]} scale={[1.04,0.80,0.86]}>
        <sphereGeometry args={[0.318,18,12,0,Math.PI*2,Math.PI*0.52,Math.PI*0.28]} />
        <meshStandardMaterial color={color} roughness={0.98} transparent opacity={0.36}/>
      </mesh>
      {/* chin stubble */}
      <mesh position={[0,-0.308,0.335]} scale={[0.66,0.46,0.76]}>
        <sphereGeometry args={[0.200,14,10]}/>
        <meshStandardMaterial color={color} roughness={0.98} transparent opacity={0.30}/>
      </mesh>
      {/* upper lip shadow */}
      <mesh position={[0,-0.065,0.388]} scale={[0.72,0.35,0.58]}>
        <sphereGeometry args={[0.120,12,8]}/>
        <meshStandardMaterial color={dark} roughness={0.98} transparent opacity={0.28}/>
      </mesh>
    </group>
  );

  if (style === "mustache") return (
    <group position={[0,-0.068,0.382]}>
      {([-1,1] as number[]).map((s,i) => (
        <group key={i} position={[s*0.092,0,0]} rotation={[0,0,s*-0.24]}>
          <mesh>
            <capsuleGeometry args={[0.042,0.110,6,10]}/>
            <Mat color={color} roughness={0.88}/>
          </mesh>
          <mesh position={[s*0.058,-0.040,0]} scale={[0.62,0.52,0.72]}>
            <sphereGeometry args={[0.038,10,8]}/>
            <Mat color={dark} roughness={0.90}/>
          </mesh>
        </group>
      ))}
      {/* center dip */}
      <mesh position={[0,0.010,0.002]} scale={[0.38,0.42,0.58]}>
        <sphereGeometry args={[0.032,8,6]}/>
        <Mat color={dark} roughness={0.90}/>
      </mesh>
    </group>
  );

  if (style === "beard-short") return (
    <group>
      {([-1,1] as number[]).map((s,i) => (
        <mesh key={i} position={[s*0.195,-0.088,0.332]} scale={[0.66,0.85,0.60]}>
          <sphereGeometry args={[0.182,14,12]}/>
          <meshStandardMaterial color={color} roughness={0.94} transparent opacity={0.70}/>
        </mesh>
      ))}
      <mesh position={[0,-0.258,0.345]} scale={[0.80,0.70,0.66]}>
        <sphereGeometry args={[0.225,16,14]}/>
        <Mat color={color} roughness={0.94}/>
      </mesh>
      <mesh position={[0,-0.058,0.388]} scale={[0.85,0.45,0.66]}>
        <sphereGeometry args={[0.200,14,10,0,Math.PI*2,Math.PI*0.52,Math.PI*0.22]}/>
        <Mat color={dark} roughness={0.94}/>
      </mesh>
    </group>
  );

  if (style === "beard-full") return (
    <group>
      {([-1,1] as number[]).map((s,i) => (
        <mesh key={i} position={[s*0.205,-0.068,0.318]} scale={[0.70,1.06,0.60]}>
          <sphereGeometry args={[0.202,16,14]}/>
          <Mat color={color} roughness={0.88}/>
        </mesh>
      ))}
      <mesh position={[0,-0.248,0.335]} scale={[0.98,0.86,0.70]}>
        <sphereGeometry args={[0.262,18,16]}/>
        <Mat color={color} roughness={0.88}/>
      </mesh>
      <mesh position={[0,-0.135,0.368]} scale={[1.10,0.56,0.66]}>
        <sphereGeometry args={[0.225,16,12,0,Math.PI*2,Math.PI*0.52,Math.PI*0.22]}/>
        <Mat color={dark} roughness={0.88}/>
      </mesh>
      <mesh position={[0,-0.048,0.388]} scale={[0.85,0.46,0.65]}>
        <sphereGeometry args={[0.202,14,10,0,Math.PI*2,Math.PI*0.52,Math.PI*0.22]}/>
        <Mat color={dark} roughness={0.90}/>
      </mesh>
    </group>
  );

  return null;
}

// ─── ACCESSORIES ──────────────────────────────────────────────────────────────
function GlassesMesh({ tinted = false }: { tinted?: boolean }) {
  const frameColor = tinted ? "#111" : "#2A2420";
  const lensColor  = tinted ? "#080808" : "#aec6f0";
  return (
    <group position={[0,0.060,0.402]}>
      {([-0.152,0.152] as number[]).map((x,i) => (
        <group key={i} position={[x,0,0]}>
          <mesh>
            <torusGeometry args={[0.098,0.015,10,32]}/>
            <Mat color={frameColor} roughness={0.22} metalness={0.68}/>
          </mesh>
          <mesh position={[0,0,-0.008]}>
            <circleGeometry args={[0.084,28]}/>
            <meshStandardMaterial color={lensColor} transparent
              opacity={tinted?0.94:0.30} roughness={0.04} metalness={0.10}/>
          </mesh>
          <mesh position={[-0.028,0.028,-0.005]}>
            <circleGeometry args={[0.020,12]}/>
            <meshStandardMaterial color="white" transparent opacity={0.14} roughness={0.01}/>
          </mesh>
        </group>
      ))}
      <mesh rotation={[0,0,Math.PI/2]}>
        <capsuleGeometry args={[0.009,0.088,4,8]}/>
        <Mat color={frameColor} roughness={0.22} metalness={0.68}/>
      </mesh>
      {([-1,1] as number[]).map((s,i) => (
        <mesh key={i} position={[s*0.243,0,-0.040]} rotation={[0,s*0.14,0]}>
          <capsuleGeometry args={[0.008,0.076,4,8]}/>
          <Mat color={frameColor} roughness={0.22} metalness={0.68}/>
        </mesh>
      ))}
    </group>
  );
}

function HatMesh({ color }: { color: string }) {
  const dk   = darken(color, 0.32);
  const band = darken(color, 0.52);
  return (
    <group position={[0,0.355,0.020]}>
      <mesh position={[0,0.262,0]}>
        <cylinderGeometry args={[0.342,0.402,0.545,28]}/>
        <Mat color={color} roughness={0.84}/>
      </mesh>
      <mesh position={[0,0.545,0]}>
        <cylinderGeometry args={[0.332,0.342,0.042,28]}/>
        <Mat color={dk} roughness={0.84}/>
      </mesh>
      <mesh position={[0,0,0]}>
        <cylinderGeometry args={[0.605,0.622,0.056,32]}/>
        <Mat color={dk} roughness={0.84}/>
      </mesh>
      <mesh position={[0,0.042,0]}>
        <cylinderGeometry args={[0.406,0.412,0.070,28]}/>
        <Mat color={band} roughness={0.68}/>
      </mesh>
      <mesh position={[0,0.072,0.412]}>
        <sphereGeometry args={[0.024,10,8]}/>
        <Mat color="#E8B420" roughness={0.18} metalness={0.82}/>
      </mesh>
    </group>
  );
}

function HeadbandMesh() {
  return (
    <group>
      <mesh position={[0,0.192,0]} rotation={[Math.PI*0.06,0,0]}>
        <torusGeometry args={[0.445,0.054,12,52,Math.PI*1.72]}/>
        <Mat color="#e46a2e" roughness={0.62} emissive="#e46a2e" emissiveIntensity={0.14}/>
      </mesh>
      <mesh position={[0,0.192,-0.425]}>
        <sphereGeometry args={[0.059,10,8]}/>
        <Mat color={darken("#e46a2e",0.22)} roughness={0.68}/>
      </mesh>
    </group>
  );
}

function EarringsMesh() {
  return (
    <>
      {([-1,1] as number[]).map((s,i) => (
        <group key={i} position={[s*0.444,-0.100,0.022]}>
          <mesh>
            <torusGeometry args={[0.056,0.018,8,22]}/>
            <Mat color="#E8B420" roughness={0.18} metalness={0.86}
              emissive="#E8B420" emissiveIntensity={0.10}/>
          </mesh>
          <mesh position={[0,-0.058,0]}>
            <sphereGeometry args={[0.022,8,8]}/>
            <Mat color="#60c0ff" roughness={0.10} metalness={0.30}
              emissive="#60c0ff" emissiveIntensity={0.22}/>
          </mesh>
        </group>
      ))}
    </>
  );
}

// ─── EAR ─────────────────────────────────────────────────────────────────────
function EarMesh({ skin, side, scale: sc = 1.0 }: { skin: string; side: 1|-1; scale?: number }) {
  const skinDk  = darken(skin, 0.14);
  const skinDk2 = darken(skin, 0.26);
  return (
    <group scale={[sc, sc, sc]}>
      {/* helix — outer rim */}
      <mesh scale={[0.58, 1.0, 0.42]}>
        <sphereGeometry args={[0.148, 16, 14]}/>
        <Mat color={skin} roughness={0.64}/>
      </mesh>
      {/* anti-helix ridge */}
      <mesh position={[side*0.025, 0.010, 0.018]} scale={[0.34, 0.68, 0.34]}>
        <sphereGeometry args={[0.108, 12, 10]}/>
        <Mat color={skinDk} roughness={0.68}/>
      </mesh>
      {/* concha (bowl) */}
      <mesh position={[side*0.030, 0.005, 0.022]} scale={[0.28, 0.52, 0.30]}>
        <sphereGeometry args={[0.090, 12, 10]}/>
        <Mat color={skinDk2} roughness={0.72}/>
      </mesh>
      {/* tragus */}
      <mesh position={[side*0.036, 0.010, 0.025]} scale={[0.28, 0.35, 0.32]}>
        <sphereGeometry args={[0.060, 10, 8]}/>
        <Mat color={skinDk} roughness={0.68}/>
      </mesh>
      {/* lobule (ear lobe) */}
      <mesh position={[0, -0.105, 0.008]} scale={[0.68, 0.60, 0.50]}>
        <sphereGeometry args={[0.072, 12, 10]}/>
        <Mat color={skinDk2} roughness={0.70}/>
      </mesh>
    </group>
  );
}

// ─── HEAD / FACE ──────────────────────────────────────────────────────────────
function Head({ state }: { state: AvatarState }) {
  const skin    = SKIN_TONES[state.skinToneIdx] ?? SKIN_TONES[3];
  const skinDk  = darken(skin, 0.14);
  const skinDk2 = darken(skin, 0.26);
  const skinLt  = lighten(skin, 0.06);
  const hair    = HAIR_HEX[state.hairColor] ?? "#5C2E18";
  const eyeC    = EYE_HEX[state.eyeColor]   ?? "#4A2C10";
  const eyeDk   = darken(eyeC, 0.32);

  const browStyle  = state.browStyle  ?? "default";
  const eyeShape   = state.eyeShape   ?? "almond";
  const noseStyle  = state.noseStyle  ?? "default";
  const mouthShape = state.mouthShape ?? "default";
  const earSize    = state.earSize    ?? "default";
  const freckles   = state.freckles   ?? "none";
  const eyelashes  = state.eyelashes ?? (state.gender === "female");
  const lipColor   = state.lipColor   ?? darken(skin, 0.22);

  // ── Brow params ─────────────────────────────────────────────────────────────
  const browScale: [number,number,number] =
    browStyle==="thin"     ? [1.42,0.28,0.54] :
    browStyle==="thick"    ? [1.55,0.64,0.86] :
    browStyle==="arched"   ? [1.40,0.52,0.74] :
    browStyle==="angled"   ? [1.45,0.44,0.70] :
    browStyle==="straight" ? [1.52,0.40,0.68] :
                             [1.48,0.50,0.72];
  const browTilt = browStyle==="angled" ? 0.16 : browStyle==="arched" ? -0.10 : -0.04;

  // ── Eye params ───────────────────────────────────────────────────────────────
  const eyeScaleX = eyeShape==="round" ? 1.04 : eyeShape==="narrow" ? 1.32 : eyeShape==="downturned" ? 1.20 : 1.18;
  const eyeScaleY = eyeShape==="round" ? 1.10 : eyeShape==="narrow" ? 0.64 : eyeShape==="downturned" ? 0.84 : 1.00;
  const eyeRotZ   = eyeShape==="downturned" ? -0.10 : 0;

  // ── Nose params ──────────────────────────────────────────────────────────────
  const noseScale: [number,number,number] =
    noseStyle==="small"  ? [0.74,0.78,0.78] :
    noseStyle==="wide"   ? [1.28,0.85,0.92] :
    noseStyle==="long"   ? [0.85,1.20,0.92] :
    noseStyle==="button" ? [0.86,0.62,1.05] :
                           [1.00,1.00,1.00];

  // ── Mouth params ─────────────────────────────────────────────────────────────
  const mouthScale: [number,number,number] =
    mouthShape==="smile"   ? [1.18,1.00,1.00] :
    mouthShape==="neutral" ? [0.92,0.78,0.94] :
    mouthShape==="small"   ? [0.78,0.84,0.95] :
    mouthShape==="full"    ? [1.10,1.20,1.05] :
                             [1.00,1.00,1.00];

  const earScale = earSize==="small" ? 0.78 : earSize==="large" ? 1.25 : 1.0;

  const faceScales: Record<string,[number,number,number]> = {
    oval:   [0.95,1.09,0.97], round: [1.07,0.96,1.00],
    square: [1.09,0.95,1.00], heart: [1.00,1.04,0.96], diamond:[0.97,1.06,0.97],
  };
  const [sx,sy,sz] = faceScales[state.faceShape] ?? [1,1,1];

  return (
    <group>
      {/* ── SKULL ── */}
      <mesh castShadow scale={[sx,sy,sz]}>
        <sphereGeometry args={[0.42, 56, 40]}/>
        <meshStandardMaterial color={skin} roughness={0.58} metalness={0}/>
      </mesh>

      {/* ── CRANIUM VOLUME — slight forehead prominence ── */}
      <mesh position={[0,0.225,0.158]} scale={[0.90,0.66,0.62]}>
        <sphereGeometry args={[0.385,28,18]}/>
        <meshStandardMaterial color={skin} roughness={0.60}/>
      </mesh>

      {/* ── TEMPORAL REGION — side flats ── */}
      {([-1,1] as number[]).map((s,i) => (
        <mesh key={i} position={[s*0.305,0.095,0.115]} scale={[0.42,0.80,0.72]}>
          <sphereGeometry args={[0.255,16,12]}/>
          <meshStandardMaterial color={skinDk} roughness={0.62} transparent opacity={0.55}/>
        </mesh>
      ))}

      {/* ── CHEEKBONES — subtle, not chipmunk ── */}
      {([-1,1] as number[]).map((s,i) => (
        <mesh key={i} position={[s*0.260,-0.038,0.298]} scale={[0.35,0.38,0.30]}>
          <sphereGeometry args={[0.225,16,12]}/>
          <meshStandardMaterial color={skin} roughness={0.62}/>
        </mesh>
      ))}

      {/* ── JAW ── */}
      <mesh position={[0,-0.258,0.158]} scale={[sx*0.80,0.68,0.70]}>
        <sphereGeometry args={[0.302,24,18]}/>
        <meshStandardMaterial color={skin} roughness={0.63}/>
      </mesh>
      {/* mandible sides */}
      {([-1,1] as number[]).map((s,i) => (
        <mesh key={i} position={[s*0.212,-0.228,0.125]} scale={[0.52,0.65,0.60]}>
          <sphereGeometry args={[0.220,16,12]}/>
          <meshStandardMaterial color={skinDk} roughness={0.64} transparent opacity={0.70}/>
        </mesh>
      ))}
      {/* chin */}
      <mesh position={[0,-0.348,0.218]} scale={[0.50,0.50,0.62]}>
        <sphereGeometry args={[0.162,16,12]}/>
        <meshStandardMaterial color={skinDk} roughness={0.66}/>
      </mesh>

      {/* ── EARS ── */}
      {([-1,1] as number[]).map((s,i) => (
        <group key={i} position={[s*sx*0.408, 0.008, 0.002]}>
          <EarMesh skin={skin} side={s as 1|-1} scale={earScale}/>
        </group>
      ))}

      {/* ── BROW RIDGE ── */}
      {([-1,1] as number[]).map((s,i) => (
        <group key={i} position={[s*0.142,0.175,0.340]}
          scale={[1.28,0.46,0.66]} rotation={[0,s*0.10,s*0.06]}>
          <mesh>
            <sphereGeometry args={[0.122,16,10]}/>
            <meshStandardMaterial color={skinDk} roughness={0.62}/>
          </mesh>
        </group>
      ))}
      {/* center brow bridge */}
      <mesh position={[0,0.185,0.352]} scale={[0.68,0.38,0.56]}>
        <sphereGeometry args={[0.108,14,8]}/>
        <meshStandardMaterial color={skinDk} roughness={0.63}/>
      </mesh>

      {/* ── EYES ── */}
      {([-1,1] as number[]).map((s,i) => (
        <group key={i} position={[s*0.148,0.100,0.350]} rotation={[0,0,s*eyeRotZ]}>
          {/* socket shadow */}
          <mesh scale={[1.20*eyeScaleX/1.18, 1.00*eyeScaleY, 0.46]} position={[0,-0.010,-0.014]}>
            <sphereGeometry args={[0.102,18,12]}/>
            <meshStandardMaterial color={skinDk2} roughness={0.72} transparent opacity={0.42}/>
          </mesh>
          {/* eyeball */}
          <mesh scale={[eyeScaleX,eyeScaleY,0.60]}>
            <sphereGeometry args={[0.092,28,20]}/>
            <meshStandardMaterial color="#F8F2EC" roughness={0.14} metalness={0.02}/>
          </mesh>
          {/* iris base */}
          <mesh position={[0,0,0.052]}>
            <circleGeometry args={[0.058,32]}/>
            <meshStandardMaterial color={eyeC} roughness={0.30} metalness={0.04}/>
          </mesh>
          {/* iris ring */}
          <mesh position={[0,0,0.053]}>
            <ringGeometry args={[0.042,0.058,28]}/>
            <meshStandardMaterial color={eyeDk} roughness={0.36} transparent opacity={0.55}/>
          </mesh>
          {/* pupil */}
          <mesh position={[0,0,0.060]}>
            <circleGeometry args={[0.034,22]}/>
            <meshStandardMaterial color="#050101" roughness={0.16}/>
          </mesh>
          {/* main specular */}
          <mesh position={[0.016,0.016,0.064]}>
            <circleGeometry args={[0.013,10]}/>
            <meshStandardMaterial color="white" roughness={0.04}
              emissive="white" emissiveIntensity={0.38}/>
          </mesh>
          {/* small secondary specular */}
          <mesh position={[-0.010,-0.008,0.063]}>
            <circleGeometry args={[0.007,8]}/>
            <meshStandardMaterial color="white" transparent opacity={0.45} roughness={0.05}/>
          </mesh>
          {/* upper eyelid */}
          <mesh position={[0,0.054,0.038]} rotation={[-0.36,0,0]} scale={[1.20,0.42,0.56]}>
            <sphereGeometry args={[0.092,16,8,0,Math.PI*2,0,Math.PI*0.50]}/>
            <meshStandardMaterial color={skinDk} roughness={0.56} transparent opacity={0.86}/>
          </mesh>
          {/* lash line */}
          <mesh position={[0,0.065,0.037]} rotation={[-0.40,0,0]} scale={[1.26,0.26,0.46]}>
            <sphereGeometry args={[0.092,14,6,0,Math.PI*2,0,Math.PI*0.38]}/>
            <meshStandardMaterial color="#100404" roughness={0.92}/>
          </mesh>
          {/* lower eyelid */}
          <mesh position={[0,-0.050,0.038]} rotation={[0.32,0,0]} scale={[1.16,0.30,0.50]}>
            <sphereGeometry args={[0.092,12,8,0,Math.PI*2,Math.PI*0.55,Math.PI*0.18]}/>
            <meshStandardMaterial color={skin} roughness={0.58} transparent opacity={0.80}/>
          </mesh>
        </group>
      ))}

      {/* ── EYEBROWS ── */}
      {([-1,1] as number[]).map((s,i) => (
        <group key={i} position={[s*0.148,0.216,0.346]}
          rotation={[0,s*0.05,s*(browTilt-0.12)]}>
          <mesh scale={browScale}>
            <capsuleGeometry args={[0.016,0.100,4,10]}/>
            <meshStandardMaterial color={hair} roughness={0.86}/>
          </mesh>
          {browStyle!=="straight" && browStyle!=="thin" && (
            <mesh position={[s*0.035,browStyle==="arched"?0.012:0.006,0.004]}
              scale={[0.76*browScale[1]/0.50, 0.50*browScale[1]/0.50, 0.66]}>
              <sphereGeometry args={[0.024,10,8]}/>
              <meshStandardMaterial color={hair} roughness={0.86}/>
            </mesh>
          )}
        </group>
      ))}

      {/* ── NOSE ── */}
      <group position={[0,0.010,0.380]} scale={noseScale}>
        {/* bridge */}
        <mesh position={[0,0.102,0]} scale={[0.50,1,0.66]}>
          <capsuleGeometry args={[0.028,0.112,4,10]}/>
          <meshStandardMaterial color={skin} roughness={0.62}/>
        </mesh>
        {/* bridge sides */}
        {([-1,1] as number[]).map((s,i) => (
          <mesh key={i} position={[s*0.018,0.078,0.005]} scale={[0.45,0.72,0.58]}>
            <sphereGeometry args={[0.038,10,8]}/>
            <meshStandardMaterial color={skinDk} roughness={0.64} transparent opacity={0.55}/>
          </mesh>
        ))}
        {/* tip */}
        <mesh position={[0,-0.010,0.042]} scale={[0.90,0.76,0.80]}>
          <sphereGeometry args={[0.066,18,14]}/>
          <meshStandardMaterial color={skinDk} roughness={0.64}/>
        </mesh>
        {/* nostrils */}
        {([-1,1] as number[]).map((s,i) => (
          <group key={i} position={[s*0.048,-0.025,0.024]}>
            <mesh scale={[0.80,0.70,0.68]}>
              <sphereGeometry args={[0.038,14,10]}/>
              <meshStandardMaterial color={skinDk} roughness={0.65}/>
            </mesh>
            {/* nostril opening */}
            <mesh position={[s*0.007,-0.012,0.012]} scale={[0.50,0.46,0.46]}>
              <sphereGeometry args={[0.022,10,8]}/>
              <meshStandardMaterial color={darken(skin,0.50)} roughness={0.82}/>
            </mesh>
          </group>
        ))}
        {/* philtrum shadow */}
        <mesh position={[0,-0.050,0.018]} scale={[0.36,0.56,0.46]}>
          <sphereGeometry args={[0.030,10,8]}/>
          <meshStandardMaterial color={skinDk2} roughness={0.72} transparent opacity={0.45}/>
        </mesh>
      </group>

      {/* ── LIPS / MOUTH ── */}
      <group position={[0,-0.150,0.365]} scale={mouthScale}>
        {/* upper lip — cupid's bow halves */}
        {([-1,1] as number[]).map((s,i) => (
          <mesh key={i} position={[s*0.053,0.016,0]} rotation={[0,0,s*0.20]} scale={[1,0.86,0.70]}>
            <sphereGeometry args={[0.052,14,10]}/>
            <meshStandardMaterial color={lipColor} roughness={0.58}/>
          </mesh>
        ))}
        {/* cupid's bow peak dip */}
        <mesh position={[0,0.024,0.007]} scale={[0.56,0.56,0.74]}>
          <sphereGeometry args={[0.038,12,8]}/>
          <meshStandardMaterial color={darken(lipColor,0.12)} roughness={0.60}/>
        </mesh>
        {/* philtrum columns */}
        {([-1,1] as number[]).map((s,i) => (
          <mesh key={i} position={[s*0.015,0.032,-0.002]} scale={[0.22,0.50,0.30]}>
            <sphereGeometry args={[0.038,8,6]}/>
            <meshStandardMaterial color={skinDk2} roughness={0.70} transparent opacity={0.35}/>
          </mesh>
        ))}
        {/* lower lip */}
        <mesh position={[0,-0.030,0.014]} scale={[1.30,0.80,0.78]}>
          <sphereGeometry args={[0.064,20,12]}/>
          <meshStandardMaterial color={lighten(lipColor,0.06)} roughness={0.56}/>
        </mesh>
        {/* lower lip center highlight */}
        <mesh position={[0,-0.026,0.040]} scale={[0.60,0.40,0.54]}>
          <sphereGeometry args={[0.040,10,8]}/>
          <meshStandardMaterial color={skinLt} roughness={0.50}/>
        </mesh>
        {/* mouth crease line */}
        <mesh position={[0,0.000,0.018]} scale={[1.36,0.18,0.46]}>
          <sphereGeometry args={[0.054,14,8]}/>
          <meshStandardMaterial color={darken(skin,0.42)} roughness={0.76}/>
        </mesh>
        {/* corner dimples */}
        {([-1,1] as number[]).map((s,i) => (
          <mesh key={i} position={[s*0.096,0,0]} scale={[0.40,0.40,0.54]}>
            <sphereGeometry args={[0.030,8,8]}/>
            <meshStandardMaterial color={skinDk2} roughness={0.72} transparent opacity={0.52}/>
          </mesh>
        ))}
      </group>

      {/* ── HAIR ── */}
      <HairMesh style={state.hairStyle} color={hair}/>
      {/* ── FACIAL HAIR ── */}
      <FacialHairMesh style={state.facialHair} color={hair}/>

      {/* ── FRECKLES ── */}
      {freckles !== "none" && (() => {
        const dots: [number,number,number][] = freckles === "heavy" ? [
          [-0.182,0.040,0.358],[-0.142,0.062,0.380],[-0.102,0.082,0.392],
          [-0.202,0.002,0.358],[-0.162,0.022,0.378],[-0.122,0.042,0.390],
          [-0.042,0.102,0.400],[ 0.000,0.122,0.402],[ 0.042,0.102,0.400],
          [ 0.182,0.040,0.358],[ 0.142,0.062,0.380],[ 0.102,0.082,0.392],
          [ 0.202,0.002,0.358],[ 0.162,0.022,0.378],[ 0.122,0.042,0.390],
        ] : [
          [-0.162,0.042,0.370],[-0.122,0.062,0.390],
          [-0.042,0.102,0.400],[ 0.042,0.102,0.400],
          [ 0.162,0.042,0.370],[ 0.122,0.062,0.390],
        ];
        return dots.map(([x,y,z],i) => (
          <mesh key={`fk-${i}`} position={[x,y,z]} scale={[0.6,0.6,0.6]}>
            <sphereGeometry args={[0.009,6,5]}/>
            <meshStandardMaterial color={darken(skin,0.44)} roughness={0.92}/>
          </mesh>
        ));
      })()}

      {/* ── EYELASHES ── */}
      {eyelashes && ([-1,1] as number[]).map((s,i) => (
        <group key={`lash-${i}`} position={[s*0.148,0.182,0.390]}
          rotation={[-0.40,0,s*eyeRotZ]}>
          <mesh scale={[1.28*eyeScaleX/1.18, 0.18, 0.44]}>
            <sphereGeometry args={[0.096,14,8,0,Math.PI*2,0,Math.PI*0.40]}/>
            <meshStandardMaterial color="#0A0504" roughness={0.94}/>
          </mesh>
          {[-0.062,-0.026,0.010,0.046].map((dx,j) => (
            <mesh key={j} position={[dx,0,0.005]} rotation={[0,0,dx*1.8]}>
              <capsuleGeometry args={[0.0026,0.023,3,5]}/>
              <meshStandardMaterial color="#0A0504" roughness={0.96}/>
            </mesh>
          ))}
        </group>
      ))}

      {/* ── ACCESSORIES ── */}
      {state.accessories.includes("glasses")    && <GlassesMesh/>}
      {state.accessories.includes("sunglasses") && <GlassesMesh tinted/>}
      {state.accessories.includes("hat")        && <HatMesh color={hair}/>}
      {state.accessories.includes("headband")   && <HeadbandMesh/>}
      {state.accessories.includes("earrings")   && <EarringsMesh/>}
    </group>
  );
}

// ─── NECK ─────────────────────────────────────────────────────────────────────
function Neck({ skin }: { skin: string }) {
  const skinDk = darken(skin, 0.12);
  const pts = useMemo(() => [
    new THREE.Vector2(0.128, 0),
    new THREE.Vector2(0.120, 0.06),
    new THREE.Vector2(0.112, 0.14),
    new THREE.Vector2(0.108, 0.22),
  ], []);
  return (
    <group>
      <mesh castShadow>
        <latheGeometry args={[pts, 18]}/>
        <Mat color={skin} roughness={0.62}/>
      </mesh>
      {/* throat — Adam's apple area (subtle) */}
      <mesh position={[0, 0.08, 0.095]} scale={[0.42, 0.52, 0.36]}>
        <sphereGeometry args={[0.095, 12, 8]}/>
        <Mat color={skinDk} roughness={0.66} transparent opacity={0.60}/>
      </mesh>
      {/* trapezius hints at base of neck */}
      {([-1,1] as number[]).map((s,i) => (
        <mesh key={i} position={[s*0.105, 0.005, -0.055]} scale={[0.55, 0.48, 0.52]}>
          <sphereGeometry args={[0.112, 12, 8]}/>
          <Mat color={skinDk} roughness={0.64} transparent opacity={0.45}/>
        </mesh>
      ))}
    </group>
  );
}

// ─── TORSO ─────────────────────────────────────────────────────────────────────
function Torso({ outfit, outfitDk, gender = "male" }: {
  outfit: string; outfitDk: string; gender?: "male"|"female";
}) {
  // Wider shoulder lathe — human proportions: shoulders ~1.5× head width
  const torsoPoints = useMemo(() => [
    new THREE.Vector2(0.260, -0.560),  // narrow waist
    new THREE.Vector2(0.285, -0.420),
    new THREE.Vector2(0.312, -0.220),
    new THREE.Vector2(0.342,  0.000),
    new THREE.Vector2(0.382,  0.200),  // mid-chest
    new THREE.Vector2(0.428,  0.380),  // chest
    new THREE.Vector2(0.510,  0.520),  // shoulder width begins
    new THREE.Vector2(0.560,  0.620),  // shoulder peak
    new THREE.Vector2(0.520,  0.700),  // armhole top
    new THREE.Vector2(0.390,  0.760),  // collar base
    new THREE.Vector2(0.295,  0.800),  // collar
  ], []);

  const hi   = lighten(outfit, 0.07);
  const hiLt = lighten(outfit, 0.13);

  return (
    <group>
      {/* ── Main shirt body ── */}
      <mesh castShadow>
        <latheGeometry args={[torsoPoints, 30]}/>
        <Mat color={outfit} roughness={0.80}/>
      </mesh>

      {/* ── Female bust (subtle, embedded) ── */}
      {gender === "female" && ([-1,1] as number[]).map((s,i) => (
        <group key={i} position={[s*0.108, 0.218, 0.305]}>
          <mesh scale={[0.62, 0.72, 0.52]}>
            <sphereGeometry args={[0.202, 20, 16]}/>
            <Mat color={outfit} roughness={0.82}/>
          </mesh>
          <mesh position={[s*-0.012, 0.018, 0.040]} scale={[0.40, 0.42, 0.32]}>
            <sphereGeometry args={[0.172, 14, 10]}/>
            <Mat color={hi} roughness={0.78}/>
          </mesh>
        </group>
      ))}

      {/* ── Shirt pocket (left chest) ── */}
      <mesh position={[0.145, 0.285, 0.408]} scale={[0.62, 0.58, 0.18]}>
        <boxGeometry args={[0.12, 0.10, 0.02]}/>
        <Mat color={outfitDk} roughness={0.76}/>
      </mesh>
      <mesh position={[0.145, 0.338, 0.416]} rotation={[0,0,0]} scale={[0.62,0.12,0.18]}>
        <boxGeometry args={[0.12,0.014,0.02]}/>
        <Mat color={darken(outfit,0.18)} roughness={0.72}/>
      </mesh>

      {/* ── Collar (open V-neck style) ── */}
      <mesh position={[0, 0.725, 0.228]} rotation={[0.30, 0, 0]} scale={[1.00, 0.66, 0.76]}>
        <torusGeometry args={[0.172, 0.042, 8, 26, Math.PI*1.52]}/>
        <Mat color={outfitDk} roughness={0.74}/>
      </mesh>
      {/* collar inner shadow */}
      <mesh position={[0, 0.710, 0.210]} rotation={[0.32, 0, 0]} scale={[0.84, 0.62, 0.70]}>
        <torusGeometry args={[0.148, 0.030, 6, 22, Math.PI*1.40]}/>
        <Mat color={darken(outfit,0.28)} roughness={0.78}/>
      </mesh>

      {/* ── Button placket ── */}
      <mesh position={[0, 0.110, 0.414]}>
        <capsuleGeometry args={[0.022, 0.660, 4, 8]}/>
        <Mat color={outfitDk} roughness={0.70}/>
      </mesh>
      {/* buttons */}
      {([0.380, 0.220, 0.058, -0.105, -0.268] as number[]).map((y,i) => (
        <mesh key={i} position={[0, y, 0.432]}>
          <sphereGeometry args={[0.018, 8, 6]}/>
          <Mat color={darken(outfit,0.45)} roughness={0.48} metalness={0.35}/>
        </mesh>
      ))}

      {/* ── Sleeve highlights ── */}
      {([-1,1] as number[]).map((s,i) => (
        <group key={i}>
          {/* shoulder seam */}
          <mesh position={[s*0.498, 0.595, 0.028]} rotation={[0.10, s*0.22, s*0.32]}
            scale={[0.30, 0.52, 0.38]}>
            <sphereGeometry args={[0.148, 12, 8]}/>
            <Mat color={hiLt} roughness={0.78}/>
          </mesh>
        </group>
      ))}

      {/* ── Shirt hem band ── */}
      <mesh position={[0, -0.560, 0]} scale={[1.03, 1, 1.03]}>
        <cylinderGeometry args={[0.275, 0.275, 0.040, 24]}/>
        <Mat color={outfitDk} roughness={0.82}/>
      </mesh>

      {/* ── Side seam shadows ── */}
      {([-1,1] as number[]).map((s,i) => (
        <mesh key={i} position={[s*0.310, 0.050, 0.050]}
          rotation={[0.04, 0, 0]} scale={[0.18, 1.10, 0.58]}>
          <sphereGeometry args={[0.280, 12, 16]}/>
          <Mat color={darken(outfit,0.08)} roughness={0.82} transparent opacity={0.40}/>
        </mesh>
      ))}
    </group>
  );
}

// ─── ARM ──────────────────────────────────────────────────────────────────────
function Arm({ side, outfit, skin, holdingBall }: {
  side: "left"|"right"; outfit: string; skin: string; holdingBall?: boolean;
}) {
  const s   = side === "left" ? -1 : 1;
  const dk  = darken(outfit, 0.20);
  const lt  = lighten(outfit, 0.08);
  const skDk = darken(skin, 0.12);

  // Natural hang with slight outward splay and forward tilt
  // Right arm (holdingBall): forearm bends inward and up to cradle ball at hip
  const upperRotX = 0.14;
  const upperRotZ = s * -0.26;
  // Forearm: when holdingBall, bends up to bring ball to hip/waist level
  // -0.82 rad (~47°) brings the forearm from pointing down to angled forward
  const forearmRotX = holdingBall ? -0.82 : -0.12;

  return (
    // Arm root is at shoulder height — higher and wider than before
    <group position={[s * 0.58, 0.60, 0.028]}>
      {/* ── DELTOID CAP — smoothly bridges torso to arm ── */}
      <mesh position={[0, 0.068, 0.038]} scale={[0.88, 0.72, 0.82]}>
        <sphereGeometry args={[0.195, 20, 14]}/>
        <Mat color={outfit} roughness={0.80}/>
      </mesh>
      {/* deltoid peak highlight */}
      <mesh position={[s*-0.042, 0.108, 0.050]} scale={[0.56, 0.46, 0.62]}>
        <sphereGeometry args={[0.168, 14, 10]}/>
        <Mat color={lt} roughness={0.76}/>
      </mesh>
      {/* deltoid rear definition */}
      <mesh position={[s*0.030, 0.030, -0.045]} scale={[0.50, 0.55, 0.45]}>
        <sphereGeometry args={[0.155, 12, 10]}/>
        <Mat color={dk} roughness={0.82} transparent opacity={0.65}/>
      </mesh>

      {/* ── UPPER ARM ── */}
      <group rotation={[upperRotX, 0, upperRotZ]}>
        {/* sleeve tube */}
        <mesh position={[0, -0.210, 0]} castShadow>
          <capsuleGeometry args={[0.150, 0.400, 8, 14]}/>
          <Mat color={outfit} roughness={0.80}/>
        </mesh>
        {/* bicep swell — front face */}
        <mesh position={[0, -0.148, 0.052]} scale={[0.82, 0.60, 0.68]}>
          <sphereGeometry args={[0.162, 16, 12]}/>
          <Mat color={lt} roughness={0.80}/>
        </mesh>
        {/* tricep — back of arm */}
        <mesh position={[0, -0.165, -0.048]} scale={[0.70, 0.58, 0.52]}>
          <sphereGeometry args={[0.148, 14, 10]}/>
          <Mat color={dk} roughness={0.84} transparent opacity={0.70}/>
        </mesh>
        {/* sleeve end band */}
        <mesh position={[0, -0.402, 0]} scale={[1.05, 1, 1.05]}>
          <cylinderGeometry args={[0.152, 0.152, 0.044, 16]}/>
          <Mat color={dk} roughness={0.75}/>
        </mesh>

        {/* ── ELBOW JOINT ── */}
        <mesh position={[0, -0.436, 0]}>
          <sphereGeometry args={[0.130, 18, 14]}/>
          <Mat color={skin} roughness={0.64}/>
        </mesh>
        {/* olecranon bump */}
        <mesh position={[0, -0.452, -0.062]} scale={[0.60, 0.52, 0.52]}>
          <sphereGeometry args={[0.095, 12, 10]}/>
          <Mat color={skDk} roughness={0.68}/>
        </mesh>
        {/* lateral epicondyle */}
        <mesh position={[s*-0.062, -0.438, -0.022]} scale={[0.46, 0.38, 0.42]}>
          <sphereGeometry args={[0.080, 10, 8]}/>
          <Mat color={skDk} roughness={0.68}/>
        </mesh>

        {/* ── FOREARM ── */}
        <group position={[0, -0.436, 0]} rotation={[forearmRotX, s*0.06, 0]}>
          {/* forearm tube — tapers toward wrist */}
          <mesh position={[0, -0.185, 0]} castShadow>
            <capsuleGeometry args={[0.110, 0.322, 8, 12]}/>
            <Mat color={skin} roughness={0.62}/>
          </mesh>
          {/* forearm extensor group (back of forearm) */}
          <mesh position={[0, -0.148, -0.068]} scale={[0.54, 0.72, 0.38]}>
            <sphereGeometry args={[0.100, 12, 8]}/>
            <Mat color={skDk} roughness={0.68}/>
          </mesh>
          {/* forearm flexor belly (front, thumb side) */}
          <mesh position={[s*0.028, -0.105, 0.042]} scale={[0.48, 0.60, 0.48]}>
            <sphereGeometry args={[0.115, 12, 8]}/>
            <Mat color={lighten(skin,0.04)} roughness={0.62}/>
          </mesh>
          {/* brachioradialis (outer ridge) */}
          <mesh position={[s*-0.060, -0.088, 0.022]} scale={[0.36, 0.52, 0.38]}>
            <sphereGeometry args={[0.098, 10, 8]}/>
            <Mat color={skDk} roughness={0.66} transparent opacity={0.55}/>
          </mesh>

          {/* ── WRIST ── */}
          <mesh position={[0, -0.372, 0]} scale={[0.92, 0.52, 0.84]}>
            <sphereGeometry args={[0.108, 16, 12]}/>
            <Mat color={skin} roughness={0.63}/>
          </mesh>
          {/* radial styloid */}
          <mesh position={[s*0.062, -0.374, 0.012]} scale={[0.45, 0.34, 0.40]}>
            <sphereGeometry args={[0.070, 10, 8]}/>
            <Mat color={skDk} roughness={0.67}/>
          </mesh>
          {/* ulnar styloid */}
          <mesh position={[s*-0.060, -0.376, -0.015]} scale={[0.42, 0.32, 0.38]}>
            <sphereGeometry args={[0.065, 10, 8]}/>
            <Mat color={skDk} roughness={0.68}/>
          </mesh>

          {/* ── HAND ── */}
          <group position={[0, -0.510, 0]}>
            <Hand skin={skin} mirror={side === "left"}/>
            {holdingBall && (
              <group position={[0, -0.148, 0.076]}>
                <BowlingBall/>
              </group>
            )}
          </group>
        </group>
      </group>
    </group>
  );
}

// ─── HIPS ─────────────────────────────────────────────────────────────────────
function Hips({ pantsColor }: { pantsColor: string }) {
  const hipPoints = useMemo(() => [
    new THREE.Vector2(0.245, -0.290),
    new THREE.Vector2(0.280, -0.155),
    new THREE.Vector2(0.318,  0.000),
    new THREE.Vector2(0.342,  0.165),
    new THREE.Vector2(0.330,  0.275),
    new THREE.Vector2(0.295,  0.330),
  ], []);
  const dk = darken(pantsColor, 0.22);

  return (
    <group>
      <mesh castShadow>
        <latheGeometry args={[hipPoints, 26]}/>
        <Mat color={pantsColor} roughness={0.86}/>
      </mesh>
      {/* hip curve highlights */}
      {([-1,1] as number[]).map((s,i) => (
        <mesh key={i} position={[s*0.295, 0.085, 0.060]} scale={[0.52, 0.72, 0.56]}>
          <sphereGeometry args={[0.265, 14, 10]}/>
          <Mat color={lighten(pantsColor,0.06)} roughness={0.88} transparent opacity={0.45}/>
        </mesh>
      ))}
      {/* belt */}
      <mesh position={[0, 0.295, 0]}>
        <cylinderGeometry args={[0.310, 0.318, 0.055, 26]}/>
        <Mat color={darken(pantsColor,0.40)} roughness={0.60} metalness={0.14}/>
      </mesh>
      {/* belt buckle */}
      <mesh position={[0, 0.296, 0.322]}>
        <boxGeometry args={[0.064,0.042,0.014]}/>
        <Mat color="#C0A030" roughness={0.16} metalness={0.84}/>
      </mesh>
      {/* waistband shadow */}
      <mesh position={[0, 0.260, 0]} scale={[1.01, 0.18, 1.01]}>
        <cylinderGeometry args={[0.296, 0.296, 0.060, 24]}/>
        <Mat color={dk} roughness={0.85}/>
      </mesh>
    </group>
  );
}

// ─── LEG ─────────────────────────────────────────────────────────────────────
function Leg({ side, pantsColor }: { side: "left"|"right"; pantsColor: string }) {
  const legPoints = useMemo(() => [
    new THREE.Vector2(0.125, -0.590),
    new THREE.Vector2(0.135, -0.450),
    new THREE.Vector2(0.142, -0.275),
    new THREE.Vector2(0.150,  0.000),
    new THREE.Vector2(0.162,  0.125),
    new THREE.Vector2(0.170,  0.282),
    new THREE.Vector2(0.178,  0.445),
    new THREE.Vector2(0.180,  0.575),
  ], []);

  const s = side === "left" ? -1 : 1;
  const dk  = darken(pantsColor, 0.14);
  const dk2 = darken(pantsColor, 0.08);

  return (
    <group position={[s * 0.168, -0.268, 0]}>
      <mesh castShadow>
        <latheGeometry args={[legPoints, 20]}/>
        <Mat color={pantsColor} roughness={0.86}/>
      </mesh>

      {/* ── Quadricep swell — front of thigh ── */}
      <mesh position={[0, 0.312, 0.088]} scale={[0.88, 0.78, 0.52]}>
        <sphereGeometry args={[0.165, 16, 12]}/>
        <Mat color={lighten(pantsColor,0.04)} roughness={0.88} transparent opacity={0.55}/>
      </mesh>
      {/* inner thigh shadow */}
      <mesh position={[s*-0.062, 0.288, 0.025]} scale={[0.45, 0.88, 0.60]}>
        <sphereGeometry args={[0.158, 12, 10]}/>
        <Mat color={dk} roughness={0.88} transparent opacity={0.40}/>
      </mesh>

      {/* ── Kneecap ── */}
      <mesh position={[0, 0.022, 0.112]} scale={[0.96, 0.70, 0.74]}>
        <sphereGeometry args={[0.118, 18, 12]}/>
        <Mat color={dk} roughness={0.88}/>
      </mesh>
      {/* medial condyle */}
      <mesh position={[s*-0.058, 0.008, 0.095]} scale={[0.42, 0.45, 0.45]}>
        <sphereGeometry args={[0.095, 10, 8]}/>
        <Mat color={darken(pantsColor,0.18)} roughness={0.88}/>
      </mesh>

      {/* ── Calf muscle ── */}
      <mesh position={[0, -0.235, -0.055]} scale={[0.78, 0.78, 0.62]}>
        <sphereGeometry args={[0.162, 16, 12]}/>
        <Mat color={lighten(pantsColor,0.03)} roughness={0.88} transparent opacity={0.50}/>
      </mesh>
      {/* shin front */}
      <mesh position={[0, -0.195, 0.098]} scale={[0.45, 0.82, 0.36]}>
        <sphereGeometry args={[0.138, 12, 10]}/>
        <Mat color={dk2} roughness={0.88} transparent opacity={0.38}/>
      </mesh>

      {/* ── Pants crease ── */}
      <mesh position={[0, 0.305, 0.115]} scale={[0.28, 0.58, 0.36]}>
        <sphereGeometry args={[0.102, 12, 8]}/>
        <Mat color={dk} roughness={0.90}/>
      </mesh>

      {/* ── Ankle / sock ── */}
      <mesh position={[0, -0.590, 0]} scale={[1, 0.46, 1]}>
        <sphereGeometry args={[0.118, 16, 12]}/>
        <Mat color="#EAEAE4" roughness={0.92}/>
      </mesh>
      {/* sock band */}
      <mesh position={[0, -0.572, 0]}>
        <cylinderGeometry args={[0.120, 0.120, 0.028, 18]}/>
        <Mat color="#D8D8D2" roughness={0.90}/>
      </mesh>

      {/* ── Shoe ── */}
      <group position={[0, -0.690, 0.042]} rotation={[-0.04, 0, 0]}>
        <Shoe mirror={side === "left"}/>
      </group>
    </group>
  );
}

// ─── MAIN CHARACTER ───────────────────────────────────────────────────────────
export default function BowlerCharacter({ state }: { state: AvatarState }) {
  const groupRef = useRef<THREE.Group>(null);

  const skin     = SKIN_TONES[state.skinToneIdx] ?? SKIN_TONES[3];
  const outfit   = OUTFIT_HEX[state.outfit] ?? "#C03018";
  const outfitDk = darken(outfit, 0.24);

  // Gentle idle animation — bob and very subtle rotate, never showing the back
  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();
    groupRef.current.position.y = Math.sin(t * 1.15) * 0.032;
    // Keep rotation within ±12° so user always sees the front
    groupRef.current.rotation.y = Math.sin(t * 0.40) * 0.055;
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]}>

      {/* HEAD */}
      <group position={[0, 1.82, 0]}>
        <Head state={state}/>
      </group>

      {/* NECK */}
      <group position={[0, 1.588, 0]}>
        <Neck skin={skin}/>
      </group>

      {/* TORSO */}
      <group position={[0, 1.00, 0]}>
        <Torso outfit={outfit} outfitDk={outfitDk} gender={state.gender ?? "male"}/>
      </group>

      {/* ARMS — right holds ball, left hangs naturally */}
      <group position={[0, 1.00, 0]}>
        <Arm side="right" outfit={outfit} skin={skin} holdingBall/>
        <Arm side="left"  outfit={outfit} skin={skin}/>
      </group>

      {/* HIPS */}
      <group position={[0, 0.42, 0]}>
        <Hips pantsColor={PANTS_COLOR}/>
      </group>

      {/* LEGS */}
      <group position={[0, 0.42, 0]}>
        <Leg side="left"  pantsColor={PANTS_COLOR}/>
        <Leg side="right" pantsColor={PANTS_COLOR}/>
      </group>

    </group>
  );
}
