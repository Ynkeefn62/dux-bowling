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
  blonde:"#C8A456", brown:"#5C2E18", black:"#150A04",
  red:"#8A2010",   auburn:"#5A2018", gray:"#808080",
  white:"#D8D8D0", platinum:"#C8C8BC",
};
const EYE_HEX: Record<string,string> = {
  brown:"#4A2C10", blue:"#2860A8", green:"#285830",
  hazel:"#6A5030", gray:"#607080", amber:"#906810",
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
  emissive, emissiveIntensity = 0,
  transparent, opacity,
}: {
  color: string; roughness?: number; metalness?: number;
  emissive?: string; emissiveIntensity?: number;
  transparent?: boolean; opacity?: number;
}) {
  return (
    <meshStandardMaterial
      color={color}
      roughness={roughness}
      metalness={metalness}
      emissive={emissive ?? "#000000"}
      emissiveIntensity={emissiveIntensity}
      transparent={transparent}
      opacity={opacity ?? 1}
    />
  );
}

// ─── BOWLING BALL ─────────────────────────────────────────────────────────────
function BowlingBall() {
  return (
    <group>
      <mesh castShadow>
        <sphereGeometry args={[0.155, 32, 28]} />
        <meshStandardMaterial color="#0d1f14" roughness={0.15} metalness={0.12}
          emissive="#071409" emissiveIntensity={0.08} />
      </mesh>
      {/* finger holes */}
      {([[0, 0.085, 0.12],[0.05, 0.04, 0.125],[-0.05, 0.04, 0.125]] as [number,number,number][]).map(([x,y,z],i) => (
        <mesh key={i} position={[x,y,z]}>
          <sphereGeometry args={[0.022, 10, 8]} />
          <meshStandardMaterial color="#030a06" roughness={0.7} />
        </mesh>
      ))}
      {/* specular glint */}
      <mesh position={[-0.06, 0.1, 0.1]}>
        <sphereGeometry args={[0.03, 10, 8]} />
        <meshStandardMaterial color="white" transparent opacity={0.18}
          roughness={0.05} emissive="white" emissiveIntensity={0.15} />
      </mesh>
    </group>
  );
}

// ─── HAND with finger stubs ───────────────────────────────────────────────────
function Hand({ skin, mirror = false }: { skin: string; mirror?: boolean }) {
  const skinDk = darken(skin, 0.14);
  const s = mirror ? -1 : 1;
  // finger [offsetX, offsetY, offsetZ, tiltZ]
  const fingers: [number,number,number,number][] = [
    [-0.052, 0.10, 0.02, 0.08],
    [-0.018, 0.115, 0.02, 0.02],
    [ 0.018, 0.112, 0.02,-0.02],
    [ 0.052, 0.095, 0.02,-0.08],
  ];
  return (
    <group scale={[s,1,1]}>
      {/* palm */}
      <mesh castShadow scale={[1.1, 0.85, 0.52]}>
        <sphereGeometry args={[0.108, 18, 14]} />
        <Mat color={skin} roughness={0.68} />
      </mesh>
      {/* knuckle ridge */}
      <mesh position={[0, 0.09, 0.02]} scale={[1.05, 0.28, 0.45]}>
        <sphereGeometry args={[0.1, 14, 8]} />
        <Mat color={skinDk} roughness={0.7} />
      </mesh>
      {/* 4 fingers */}
      {fingers.map(([fx,fy,fz,tz],i) => (
        <group key={i} position={[fx, fy, fz]} rotation={[-0.18, 0, tz]}>
          {/* proximal phalanx */}
          <mesh>
            <capsuleGeometry args={[0.02, 0.06, 4, 8]} />
            <Mat color={skin} roughness={0.68} />
          </mesh>
          {/* middle+distal phalanx */}
          <mesh position={[0, 0.072, 0]}>
            <capsuleGeometry args={[0.018, 0.045, 4, 8]} />
            <Mat color={skin} roughness={0.68} />
          </mesh>
          {/* fingernail */}
          <mesh position={[0, 0.108, 0.012]} rotation={[0.3, 0, 0]} scale={[0.8, 0.5, 0.4]}>
            <sphereGeometry args={[0.02, 8, 6]} />
            <Mat color={lighten(skin, 0.12)} roughness={0.4} />
          </mesh>
        </group>
      ))}
      {/* thumb */}
      <group position={[s * -0.1, 0.03, 0.03]} rotation={[0.1, 0, s * -0.75]}>
        <mesh>
          <capsuleGeometry args={[0.026, 0.048, 4, 8]} />
          <Mat color={skin} roughness={0.68} />
        </mesh>
        <mesh position={[0, 0.054, 0]}>
          <sphereGeometry args={[0.025, 8, 8]} />
          <Mat color={skinDk} roughness={0.7} />
        </mesh>
      </group>
    </group>
  );
}

// ─── SHOE ─────────────────────────────────────────────────────────────────────
function Shoe({ mirror = false }: { mirror?: boolean }) {
  const s = mirror ? -1 : 1;
  return (
    <group scale={[s, 1, 1]}>
      {/* upper – heel */}
      <mesh position={[0, 0.04, -0.07]} scale={[1, 0.78, 0.88]} castShadow>
        <sphereGeometry args={[0.13, 18, 14]} />
        <Mat color="#1a1010" roughness={0.45} metalness={0.06} />
      </mesh>
      {/* upper – toe box, elongated forward */}
      <mesh position={[0, 0.01, 0.13]} scale={[1.05, 0.58, 1.25]} castShadow>
        <sphereGeometry args={[0.115, 18, 12]} />
        <Mat color="#1a1010" roughness={0.45} metalness={0.06} />
      </mesh>
      {/* bridge connecting heel to toe */}
      <mesh position={[0, -0.01, 0.03]} scale={[1, 0.5, 1.5]}>
        <sphereGeometry args={[0.108, 14, 10]} />
        <Mat color="#1a1010" roughness={0.48} />
      </mesh>
      {/* midsole – white rubber strip */}
      <mesh position={[0, -0.1, 0.03]} scale={[1.12, 0.25, 1.6]}>
        <sphereGeometry args={[0.112, 16, 10]} />
        <Mat color="#e8e0d4" roughness={0.88} />
      </mesh>
      {/* outsole */}
      <mesh position={[0, -0.155, 0.03]} rotation={[Math.PI/2, 0, 0]}>
        <cylinderGeometry args={[0.13, 0.13, 0.03, 22]} />
        <Mat color="#0a0808" roughness={0.95} />
      </mesh>
      {/* lace area detail */}
      <mesh position={[0, 0.065, 0.09]} scale={[0.68, 0.38, 1.05]}>
        <sphereGeometry args={[0.1, 12, 8]} />
        <Mat color={darken("#1a1010", 0.12)} roughness={0.55} />
      </mesh>
      {/* lace line */}
      {([-0.028,-0.01,0.01,0.028] as number[]).map((z,i) => (
        <mesh key={i} position={[0, 0.078, z * 4 + 0.04]} rotation={[0, 0, Math.PI/2]}>
          <capsuleGeometry args={[0.007, 0.07, 4, 6]} />
          <Mat color="#e8e0d4" roughness={0.85} />
        </mesh>
      ))}
    </group>
  );
}

// ─── HAIR ─────────────────────────────────────────────────────────────────────
function HairMesh({ style, color }: { style: string; color: string }) {
  const dark  = darken(color, 0.32);
  const light = lighten(color, 0.08);
  const mat  = <Mat color={color} roughness={0.88} />;
  const matD = <Mat color={dark}  roughness={0.88} />;
  const matL = <Mat color={light} roughness={0.85} />;

  if (style === "bald") return null;

  if (style === "buzz") return (
    <group>
      <mesh position={[0,0.01,0]} scale={[1.01,1.01,1.01]}>
        <sphereGeometry args={[0.43, 32, 22, 0, Math.PI*2, 0, Math.PI*0.55]} />
        {mat}
      </mesh>
      {([-1,1] as number[]).map((s,i) => (
        <mesh key={i} position={[s*0.39,-0.1,0.06]} scale={[0.55,0.75,0.45]}>
          <sphereGeometry args={[0.14,12,10]} />
          {mat}
        </mesh>
      ))}
    </group>
  );

  if (style === "short") return (
    <group>
      <mesh position={[0,0.03,0]}>
        <sphereGeometry args={[0.445, 32, 22, 0, Math.PI*2, 0, Math.PI*0.55]} />
        {mat}
      </mesh>
      {([-1,1] as number[]).map((s,i) => (
        <mesh key={i} position={[s*0.38,-0.04,0.09]} scale={[0.6,0.85,0.55]}>
          <sphereGeometry args={[0.15,14,12]} />
          {mat}
        </mesh>
      ))}
      <mesh position={[0,-0.07,-0.28]} scale={[1.05,0.65,0.6]}>
        <sphereGeometry args={[0.37,20,14,0,Math.PI*2,Math.PI*0.4,Math.PI*0.28]} />
        {matD}
      </mesh>
      {([[0,0.38,0.2,0.09],[0.13,0.34,0.16,0.08],[-0.13,0.34,0.16,0.08]] as [number,number,number,number][]).map(([x,y,z,r],i) => (
        <mesh key={i} position={[x,y,z]}>
          <sphereGeometry args={[r,10,8]} />
          {i===0 ? matL : mat}
        </mesh>
      ))}
    </group>
  );

  if (style === "pompadour") return (
    <group>
      <mesh position={[0,0.01,-0.05]}>
        <sphereGeometry args={[0.445, 32, 22, 0, Math.PI*2, 0, Math.PI*0.62]} />
        {mat}
      </mesh>
      {/* pompadour volume */}
      <mesh position={[0,0.38,0.17]} rotation={[0.42,0,0]} scale={[1,1.22,0.82]}>
        <sphereGeometry args={[0.28,22,16]} />
        {mat}
      </mesh>
      <mesh position={[0,0.52,0.14]} rotation={[0.52,0,0]} scale={[0.78,1.45,0.58]}>
        <sphereGeometry args={[0.2,16,14]} />
        {matL}
      </mesh>
      {([-0.12,0,0.12] as number[]).map((x,i) => (
        <mesh key={i} position={[x,0.3,0.08]} rotation={[0.58,0,x*0.5]}>
          <capsuleGeometry args={[0.045,0.18,4,8]} />
          {i===1 ? matL : matD}
        </mesh>
      ))}
    </group>
  );

  if (style === "bob") return (
    <group>
      <mesh position={[0,0.04,-0.02]}>
        <sphereGeometry args={[0.45, 32, 22, 0, Math.PI*2, 0, Math.PI*0.58]} />
        {mat}
      </mesh>
      {([-1,1] as number[]).map((s,i) => (
        <group key={i}>
          <mesh position={[s*0.36,-0.14,0.02]} scale={[0.62,1.2,0.68]}>
            <capsuleGeometry args={[0.18,0.3,8,12]} />
            {mat}
          </mesh>
          <mesh position={[s*0.3,-0.36,0.05]} scale={[0.68,0.58,0.75]}>
            <sphereGeometry args={[0.2,14,12]} />
            {matD}
          </mesh>
        </group>
      ))}
      <mesh position={[0,-0.17,-0.27]} scale={[1.1,0.88,0.58]}>
        <sphereGeometry args={[0.36,20,14]} />
        {mat}
      </mesh>
      {/* bangs */}
      <mesh position={[0,0.26,0.34]} rotation={[0.28,0,0]} scale={[1.08,0.52,0.65]}>
        <sphereGeometry args={[0.28,20,12,0,Math.PI*2,0,Math.PI*0.38]} />
        {matD}
      </mesh>
    </group>
  );

  if (style === "long") return (
    <group>
      <mesh position={[0,0.04,-0.02]}>
        <sphereGeometry args={[0.45, 32, 22, 0, Math.PI*2, 0, Math.PI*0.58]} />
        {mat}
      </mesh>
      {([-1,1] as number[]).map((s,i) => (
        <group key={i}>
          <mesh position={[s*0.35,-0.32,-0.04]} rotation={[0.05,s*-0.08,0]} scale={[0.68,1,0.68]}>
            <capsuleGeometry args={[0.14,0.72,6,12]} />
            {mat}
          </mesh>
          <mesh position={[s*0.3,-0.9,-0.07]} rotation={[0.07,s*-0.1,0]} scale={[0.58,1,0.62]}>
            <capsuleGeometry args={[0.12,0.48,6,10]} />
            {matD}
          </mesh>
        </group>
      ))}
      <mesh position={[0,-0.22,-0.22]} scale={[1.08,1,0.68]}>
        <capsuleGeometry args={[0.22,0.48,8,14]} />
        {mat}
      </mesh>
      <mesh position={[0,-0.78,-0.2]} scale={[0.88,1,0.62]}>
        <capsuleGeometry args={[0.18,0.48,6,12]} />
        {matD}
      </mesh>
    </group>
  );

  if (style === "curly") return (
    <group>
      <mesh position={[0,0.05,0]} scale={[1.04,1.04,1.04]}>
        <sphereGeometry args={[0.43, 28, 20, 0, Math.PI*2, 0, Math.PI*0.62]} />
        {mat}
      </mesh>
      {(([
        [0,0.46,0.2,0.14],[0.22,0.4,0.16,0.12],[-0.22,0.4,0.16,0.12],
        [0.38,0.22,0.06,0.11],[-0.38,0.22,0.06,0.11],
        [0.28,0.28,-0.22,0.12],[-0.28,0.28,-0.22,0.12],
        [0,0.2,-0.34,0.13],[0.16,0.38,0.1,0.1],[-0.16,0.38,0.1,0.1],
        [0.32,0.08,-0.18,0.1],[-0.32,0.08,-0.18,0.1],
      ]) as [number,number,number,number][]).map(([x,y,z,r],i) => (
        <mesh key={i} position={[x,y,z]}>
          <sphereGeometry args={[r,12,10]} />
          {i%3===0 ? matL : i%3===1 ? mat : matD}
        </mesh>
      ))}
    </group>
  );

  if (style === "bun") return (
    <group>
      <mesh position={[0,0.03,-0.02]}>
        <sphereGeometry args={[0.445, 32, 22, 0, Math.PI*2, 0, Math.PI*0.57]} />
        {mat}
      </mesh>
      <mesh position={[0,0.14,-0.28]} scale={[0.82,0.68,0.68]}>
        <sphereGeometry args={[0.3,18,14]} />
        {matD}
      </mesh>
      <mesh position={[0,0.28,-0.37]} scale={[1,0.88,0.88]}>
        <sphereGeometry args={[0.2,18,16]} />
        {mat}
      </mesh>
      <mesh position={[0,0.28,-0.37]} rotation={[Math.PI/2,0,0]}>
        <torusGeometry args={[0.14,0.04,8,22]} />
        {matD}
      </mesh>
    </group>
  );

  // fallback
  return (
    <mesh position={[0,0.03,0]}>
      <sphereGeometry args={[0.445, 32, 22, 0, Math.PI*2, 0, Math.PI*0.55]} />
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
      <mesh position={[0,-0.17,0.35]} scale={[1.05,0.82,0.88]}>
        <sphereGeometry args={[0.32,18,12,0,Math.PI*2,Math.PI*0.52,Math.PI*0.27]} />
        <meshStandardMaterial color={color} roughness={0.98} transparent opacity={0.38} />
      </mesh>
      <mesh position={[0,-0.31,0.34]} scale={[0.68,0.48,0.78]}>
        <sphereGeometry args={[0.2,14,10]} />
        <meshStandardMaterial color={color} roughness={0.98} transparent opacity={0.32} />
      </mesh>
    </group>
  );

  if (style === "mustache") return (
    <group position={[0,-0.07,0.38]}>
      {([-1,1] as number[]).map((s,i) => (
        <group key={i} position={[s*0.09,0,0]} rotation={[0,0,s*-0.26]}>
          <mesh>
            <capsuleGeometry args={[0.04,0.11,6,10]} />
            <Mat color={color} roughness={0.9} />
          </mesh>
          <mesh position={[s*0.055,-0.038,0]} scale={[0.65,0.55,0.75]}>
            <sphereGeometry args={[0.038,10,8]} />
            <Mat color={dark} roughness={0.9} />
          </mesh>
        </group>
      ))}
    </group>
  );

  if (style === "beard-short") return (
    <group>
      {([-1,1] as number[]).map((s,i) => (
        <mesh key={i} position={[s*0.2,-0.09,0.33]} scale={[0.68,0.88,0.62]}>
          <sphereGeometry args={[0.18,14,12]} />
          <meshStandardMaterial color={color} roughness={0.94} transparent opacity={0.72} />
        </mesh>
      ))}
      <mesh position={[0,-0.26,0.35]} scale={[0.82,0.72,0.68]}>
        <sphereGeometry args={[0.22,16,14]} />
        <Mat color={color} roughness={0.94} />
      </mesh>
      <mesh position={[0,-0.06,0.39]} scale={[0.88,0.48,0.68]}>
        <sphereGeometry args={[0.2,14,10,0,Math.PI*2,Math.PI*0.52,Math.PI*0.22]} />
        <Mat color={dark} roughness={0.94} />
      </mesh>
    </group>
  );

  if (style === "beard-full") return (
    <group>
      {([-1,1] as number[]).map((s,i) => (
        <mesh key={i} position={[s*0.21,-0.07,0.32]} scale={[0.72,1.08,0.62]}>
          <sphereGeometry args={[0.2,16,14]} />
          <Mat color={color} roughness={0.9} />
        </mesh>
      ))}
      <mesh position={[0,-0.25,0.34]} scale={[1,0.88,0.72]}>
        <sphereGeometry args={[0.26,18,16]} />
        <Mat color={color} roughness={0.9} />
      </mesh>
      <mesh position={[0,-0.14,0.37]} scale={[1.12,0.58,0.68]}>
        <sphereGeometry args={[0.22,16,12,0,Math.PI*2,Math.PI*0.52,Math.PI*0.22]} />
        <Mat color={dark} roughness={0.9} />
      </mesh>
      <mesh position={[0,-0.05,0.39]} scale={[0.88,0.48,0.68]}>
        <sphereGeometry args={[0.2,14,10,0,Math.PI*2,Math.PI*0.52,Math.PI*0.22]} />
        <Mat color={dark} roughness={0.92} />
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
    <group position={[0,0.06,0.4]}>
      {([-0.152, 0.152] as number[]).map((x,i) => (
        <group key={i} position={[x,0,0]}>
          <mesh>
            <torusGeometry args={[0.098,0.015,10,32]} />
            <Mat color={frameColor} roughness={0.22} metalness={0.68} />
          </mesh>
          <mesh position={[0,0,-0.008]}>
            <circleGeometry args={[0.084,28]} />
            <meshStandardMaterial color={lensColor} transparent
              opacity={tinted ? 0.94 : 0.3} roughness={0.04} metalness={0.1} />
          </mesh>
          <mesh position={[-0.028,0.028,-0.005]}>
            <circleGeometry args={[0.02,12]} />
            <meshStandardMaterial color="white" transparent opacity={0.14} roughness={0.01} />
          </mesh>
        </group>
      ))}
      {/* bridge */}
      <mesh rotation={[0,0,Math.PI/2]}>
        <capsuleGeometry args={[0.009,0.087,4,8]} />
        <Mat color={frameColor} roughness={0.22} metalness={0.68} />
      </mesh>
      {/* temples */}
      {([-1,1] as number[]).map((s,i) => (
        <mesh key={i} position={[s*0.243,0,-0.04]} rotation={[0,s*0.14,0]}>
          <capsuleGeometry args={[0.008,0.076,4,8]} />
          <Mat color={frameColor} roughness={0.22} metalness={0.68} />
        </mesh>
      ))}
    </group>
  );
}

function HatMesh({ color }: { color: string }) {
  const dark = darken(color, 0.32);
  const band = darken(color, 0.52);
  return (
    <group position={[0,0.35,0.02]}>
      <mesh position={[0,0.26,0]}>
        <cylinderGeometry args={[0.34,0.4,0.54,28]} />
        <Mat color={color} roughness={0.84} />
      </mesh>
      <mesh position={[0,0.54,0]}>
        <cylinderGeometry args={[0.33,0.34,0.04,28]} />
        <Mat color={dark} roughness={0.84} />
      </mesh>
      <mesh position={[0,0,0]}>
        <cylinderGeometry args={[0.6,0.62,0.055,32]} />
        <Mat color={dark} roughness={0.84} />
      </mesh>
      <mesh position={[0,0.04,0]}>
        <cylinderGeometry args={[0.404,0.41,0.068,28]} />
        <Mat color={band} roughness={0.68} />
      </mesh>
      <mesh position={[0,0.07,0.41]}>
        <sphereGeometry args={[0.024,10,8]} />
        <Mat color="#E8B420" roughness={0.18} metalness={0.82} />
      </mesh>
    </group>
  );
}

function HeadbandMesh() {
  return (
    <group>
      <mesh position={[0,0.19,0]} rotation={[Math.PI*0.06,0,0]}>
        <torusGeometry args={[0.44,0.052,12,52,Math.PI*1.72]} />
        <Mat color="#e46a2e" roughness={0.62} emissive="#e46a2e" emissiveIntensity={0.14} />
      </mesh>
      <mesh position={[0,0.19,-0.42]}>
        <sphereGeometry args={[0.058,10,8]} />
        <Mat color={darken("#e46a2e",0.22)} roughness={0.68} />
      </mesh>
    </group>
  );
}

function EarringsMesh() {
  return (
    <>
      {([-1,1] as number[]).map((s,i) => (
        <group key={i} position={[s*0.44,-0.1,0.02]}>
          <mesh>
            <torusGeometry args={[0.054,0.018,8,22]} />
            <Mat color="#E8B420" roughness={0.18} metalness={0.86}
              emissive="#E8B420" emissiveIntensity={0.1} />
          </mesh>
          <mesh position={[0,-0.056,0]}>
            <sphereGeometry args={[0.021,8,8]} />
            <Mat color="#60c0ff" roughness={0.1} metalness={0.3}
              emissive="#60c0ff" emissiveIntensity={0.22} />
          </mesh>
        </group>
      ))}
    </>
  );
}

// ─── HEAD / FACE ──────────────────────────────────────────────────────────────
function Head({ state }: { state: AvatarState }) {
  const skin   = SKIN_TONES[state.skinToneIdx] ?? SKIN_TONES[3];
  const skinDk = darken(skin, 0.14);
  const skinDk2= darken(skin, 0.24);
  const skinLt = lighten(skin, 0.06);
  const hair   = HAIR_HEX[state.hairColor] ?? "#5C2E18";
  const eyeC   = EYE_HEX[state.eyeColor]   ?? "#4A2C10";
  const eyeDk  = darken(eyeC, 0.3);

  const faceScales: Record<string,[number,number,number]> = {
    oval:   [0.95,1.09,0.97],
    round:  [1.07,0.96,1.0],
    square: [1.09,0.95,1.0],
    heart:  [1.0, 1.04,0.96],
    diamond:[0.97,1.06,0.97],
  };
  const [sx,sy,sz] = faceScales[state.faceShape] ?? [1,1,1];

  return (
    <group>
      {/* ── SKULL ── */}
      <mesh castShadow scale={[sx,sy,sz]}>
        <sphereGeometry args={[0.42, 52, 36]} />
        <meshStandardMaterial color={skin} roughness={0.6} metalness={0} />
      </mesh>

      {/* ── FOREHEAD VOLUME ── */}
      <mesh position={[0,0.21,0.21]} scale={[0.88,0.68,0.62]}>
        <sphereGeometry args={[0.38,28,18]} />
        <meshStandardMaterial color={skin} roughness={0.62} />
      </mesh>

      {/* ── CHEEKBONE VOLUMES ── */}
      {([-1,1] as number[]).map((s,i) => (
        <mesh key={i} position={[s*0.29,-0.02,0.24]} scale={[0.68,0.72,0.62]}>
          <sphereGeometry args={[0.28,20,14]} />
          <meshStandardMaterial color={skin} roughness={0.63} />
        </mesh>
      ))}

      {/* ── JAW ── */}
      <mesh position={[0,-0.26,0.16]} scale={[sx*0.8,0.7,0.72]}>
        <sphereGeometry args={[0.3,24,18]} />
        <meshStandardMaterial color={skin} roughness={0.64} />
      </mesh>
      {/* chin point */}
      <mesh position={[0,-0.35,0.22]} scale={[0.52,0.52,0.66]}>
        <sphereGeometry args={[0.16,16,12]} />
        <meshStandardMaterial color={skinDk} roughness={0.66} />
      </mesh>

      {/* ── EARS ── */}
      {([-1,1] as number[]).map((s,i) => (
        <group key={i} position={[s*sx*0.41,0.01,0]}>
          <mesh scale={[0.6,1,0.44]}>
            <sphereGeometry args={[0.14,16,14]} />
            <meshStandardMaterial color={skin} roughness={0.64} />
          </mesh>
          <mesh position={[s*0.03,0,0.02]} scale={[0.4,0.62,0.36]}>
            <sphereGeometry args={[0.1,12,10]} />
            <meshStandardMaterial color={skinDk} roughness={0.7} />
          </mesh>
          <mesh position={[0,-0.1,0]} scale={[0.68,0.62,0.48]}>
            <sphereGeometry args={[0.07,10,8]} />
            <meshStandardMaterial color={skinDk2} roughness={0.67} />
          </mesh>
        </group>
      ))}

      {/* ── BROW RIDGE ── */}
      {([-1,1] as number[]).map((s,i) => (
        <mesh key={i} position={[s*0.142,0.174,0.34]}
          scale={[1.28,0.48,0.68]} rotation={[0,s*0.1,s*0.07]}>
          <sphereGeometry args={[0.12,16,10]} />
          <meshStandardMaterial color={skinDk} roughness={0.63} />
        </mesh>
      ))}

      {/* ── EYES ── */}
      {([-1,1] as number[]).map((s,i) => (
        <group key={i} position={[s*0.146,0.1,0.35]}>
          {/* socket shadow */}
          <mesh scale={[1.22,1.02,0.48]} position={[0,-0.01,-0.012]}>
            <sphereGeometry args={[0.1,16,12]} />
            <meshStandardMaterial color={skinDk2} roughness={0.7} transparent opacity={0.45} />
          </mesh>
          {/* eyeball */}
          <mesh scale={[1.18,1,0.62]}>
            <sphereGeometry args={[0.09,24,18]} />
            <meshStandardMaterial color="#F8F2EC" roughness={0.16} metalness={0.02} />
          </mesh>
          {/* iris */}
          <mesh position={[0,0,0.05]}>
            <circleGeometry args={[0.056,30]} />
            <meshStandardMaterial color={eyeC} roughness={0.32} metalness={0.04} />
          </mesh>
          {/* iris limbal ring */}
          <mesh position={[0,0,0.051]}>
            <ringGeometry args={[0.04,0.056,26]} />
            <meshStandardMaterial color={eyeDk} roughness={0.38} transparent opacity={0.58} />
          </mesh>
          {/* pupil */}
          <mesh position={[0,0,0.058]}>
            <circleGeometry args={[0.032,20]} />
            <meshStandardMaterial color="#060202" roughness={0.18} />
          </mesh>
          {/* main specular */}
          <mesh position={[0.016,0.016,0.062]}>
            <circleGeometry args={[0.013,10]} />
            <meshStandardMaterial color="white" roughness={0.04}
              emissive="white" emissiveIntensity={0.35} />
          </mesh>
          {/* secondary specular */}
          <mesh position={[-0.012,-0.009,0.061]}>
            <circleGeometry args={[0.006,8]} />
            <meshStandardMaterial color="white" transparent opacity={0.48} roughness={0.05} />
          </mesh>
          {/* upper eyelid */}
          <mesh position={[0,0.052,0.038]} rotation={[-0.38,0,0]} scale={[1.22,0.44,0.58]}>
            <sphereGeometry args={[0.09,14,8,0,Math.PI*2,0,Math.PI*0.5]} />
            <meshStandardMaterial color={skinDk} roughness={0.58} transparent opacity={0.88} />
          </mesh>
          {/* lash line */}
          <mesh position={[0,0.063,0.036]} rotation={[-0.42,0,0]} scale={[1.28,0.28,0.48]}>
            <sphereGeometry args={[0.09,12,6,0,Math.PI*2,0,Math.PI*0.38]} />
            <meshStandardMaterial color="#120606" roughness={0.9} />
          </mesh>
          {/* lower eyelid */}
          <mesh position={[0,-0.048,0.036]} rotation={[0.33,0,0]} scale={[1.18,0.32,0.52]}>
            <sphereGeometry args={[0.09,12,8,0,Math.PI*2,Math.PI*0.55,Math.PI*0.18]} />
            <meshStandardMaterial color={skin} roughness={0.6} transparent opacity={0.82} />
          </mesh>
        </group>
      ))}

      {/* ── EYEBROWS ── */}
      {([-1,1] as number[]).map((s,i) => (
        <group key={i} position={[s*0.146,0.212,0.345]} rotation={[0,s*0.05,s*-0.16]}>
          <mesh scale={[1.48,0.48,0.72]}>
            <capsuleGeometry args={[0.015,0.098,4,10]} />
            <meshStandardMaterial color={hair} roughness={0.86} />
          </mesh>
          {/* arch peak */}
          <mesh position={[s*0.035,0.006,0.004]} scale={[0.78,0.52,0.68]}>
            <sphereGeometry args={[0.024,10,8]} />
            <meshStandardMaterial color={hair} roughness={0.86} />
          </mesh>
        </group>
      ))}

      {/* ── NOSE ── */}
      <group position={[0,0.01,0.38]}>
        {/* bridge */}
        <mesh position={[0,0.1,0]} scale={[0.52,1,0.68]}>
          <capsuleGeometry args={[0.028,0.11,4,10]} />
          <meshStandardMaterial color={skin} roughness={0.64} />
        </mesh>
        {/* tip */}
        <mesh position={[0,-0.012,0.04]} scale={[0.92,0.78,0.82]}>
          <sphereGeometry args={[0.064,16,14]} />
          <meshStandardMaterial color={skinDk} roughness={0.65} />
        </mesh>
        {/* nostrils */}
        {([-1,1] as number[]).map((s,i) => (
          <group key={i} position={[s*0.046,-0.026,0.025]}>
            <mesh scale={[0.82,0.72,0.7]}>
              <sphereGeometry args={[0.037,12,10]} />
              <meshStandardMaterial color={skinDk} roughness={0.66} />
            </mesh>
            <mesh position={[s*0.007,-0.011,0.011]} scale={[0.52,0.48,0.48]}>
              <sphereGeometry args={[0.021,10,8]} />
              <meshStandardMaterial color={darken(skin,0.48)} roughness={0.8} />
            </mesh>
          </group>
        ))}
        {/* philtrum shadow */}
        <mesh position={[0,-0.052,0.018]} scale={[0.38,0.58,0.48]}>
          <sphereGeometry args={[0.028,10,8]} />
          <meshStandardMaterial color={skinDk2} roughness={0.7} transparent opacity={0.48} />
        </mesh>
      </group>

      {/* ── MOUTH / LIPS ── */}
      <group position={[0,-0.152,0.365]}>
        {/* upper lip halves (cupid's bow) */}
        {([-1,1] as number[]).map((s,i) => (
          <mesh key={i} position={[s*0.052,0.016,0]} rotation={[0,0,s*0.2]} scale={[1,0.88,0.72]}>
            <sphereGeometry args={[0.05,14,10]} />
            <meshStandardMaterial color={darken(skin,0.2)} roughness={0.6} />
          </mesh>
        ))}
        {/* cupid's bow center dip */}
        <mesh position={[0,0.023,0.007]} scale={[0.58,0.58,0.76]}>
          <sphereGeometry args={[0.036,12,8]} />
          <meshStandardMaterial color={darken(skin,0.26)} roughness={0.62} />
        </mesh>
        {/* lower lip */}
        <mesh position={[0,-0.03,0.012]} scale={[1.32,0.82,0.8]}>
          <sphereGeometry args={[0.062,18,12]} />
          <meshStandardMaterial color={darken(skin,0.15)} roughness={0.58} />
        </mesh>
        {/* lower lip highlight */}
        <mesh position={[0,-0.026,0.038]} scale={[0.62,0.42,0.56]}>
          <sphereGeometry args={[0.038,10,8]} />
          <meshStandardMaterial color={skinLt} roughness={0.52} />
        </mesh>
        {/* mouth line crease */}
        <mesh position={[0,-0.001,0.017]} scale={[1.38,0.2,0.48]}>
          <sphereGeometry args={[0.052,14,8]} />
          <meshStandardMaterial color={darken(skin,0.4)} roughness={0.74} />
        </mesh>
        {/* corner dimples */}
        {([-1,1] as number[]).map((s,i) => (
          <mesh key={i} position={[s*0.094,0,0]} scale={[0.42,0.42,0.56]}>
            <sphereGeometry args={[0.028,8,8]} />
            <meshStandardMaterial color={skinDk2} roughness={0.7} transparent opacity={0.55} />
          </mesh>
        ))}
      </group>

      {/* ── HAIR ── */}
      <HairMesh style={state.hairStyle} color={hair} />
      {/* ── FACIAL HAIR ── */}
      <FacialHairMesh style={state.facialHair} color={hair} />
      {/* ── ACCESSORIES ── */}
      {state.accessories.includes("glasses")    && <GlassesMesh />}
      {state.accessories.includes("sunglasses") && <GlassesMesh tinted />}
      {state.accessories.includes("hat")        && <HatMesh color={hair} />}
      {state.accessories.includes("headband")   && <HeadbandMesh />}
      {state.accessories.includes("earrings")   && <EarringsMesh />}
    </group>
  );
}

// ─── TORSO ────────────────────────────────────────────────────────────────────
function Torso({ outfit, outfitDk }: { outfit: string; outfitDk: string }) {
  const torsoPoints = useMemo(() => [
    new THREE.Vector2(0.30, -0.54),  // waist
    new THREE.Vector2(0.325,  -0.38),
    new THREE.Vector2(0.35,  -0.18),
    new THREE.Vector2(0.375,  0.02),
    new THREE.Vector2(0.41,   0.22),
    new THREE.Vector2(0.435,  0.40),
    new THREE.Vector2(0.425,  0.55),
    new THREE.Vector2(0.375,  0.66),
    new THREE.Vector2(0.29,   0.74),
  ], []);

  const hi = lighten(outfit, 0.06);

  return (
    <group>
      {/* lathe body */}
      <mesh castShadow>
        <latheGeometry args={[torsoPoints, 28]} />
        <Mat color={outfit} roughness={0.8} />
      </mesh>

      {/* pec highlights */}
      {([-1,1] as number[]).map((s,i) => (
        <mesh key={i} position={[s*0.15,0.28,0.34]} scale={[0.82,0.7,0.52]}>
          <sphereGeometry args={[0.2,16,12]} />
          <Mat color={hi} roughness={0.82} />
        </mesh>
      ))}

      {/* shoulder caps */}
      {([-1,1] as number[]).map((s,i) => (
        <group key={i} position={[s*0.438,0.5,0]}>
          <mesh scale={[0.8,1,0.92]}>
            <sphereGeometry args={[0.215,20,16]} />
            <Mat color={outfit} roughness={0.8} />
          </mesh>
          <mesh position={[0,0.11,0]} scale={[0.72,0.52,0.8]}>
            <sphereGeometry args={[0.175,16,12]} />
            <Mat color={hi} roughness={0.82} />
          </mesh>
        </group>
      ))}

      {/* collar */}
      <mesh position={[0,0.7,0.22]} rotation={[0.28,0,0]} scale={[1,0.68,0.78]}>
        <torusGeometry args={[0.168,0.04,8,24,Math.PI*1.55]} />
        <Mat color={outfitDk} roughness={0.76} />
      </mesh>

      {/* button placket */}
      <mesh position={[0,0.1,0.41]}>
        <capsuleGeometry args={[0.02,0.64,4,8]} />
        <Mat color={outfitDk} roughness={0.7} />
      </mesh>
      {/* buttons */}
      {([0.36, 0.16, -0.04, -0.24] as number[]).map((y,i) => (
        <mesh key={i} position={[0,y,0.428]}>
          <sphereGeometry args={[0.017,8,6]} />
          <Mat color={darken(outfit,0.42)} roughness={0.52} metalness={0.32} />
        </mesh>
      ))}

      {/* shirt hem */}
      <mesh position={[0,-0.54,0]} scale={[1.02,1,1.02]}>
        <cylinderGeometry args={[0.315,0.315,0.038,24]} />
        <Mat color={outfitDk} roughness={0.82} />
      </mesh>
    </group>
  );
}

// ─── ARM ──────────────────────────────────────────────────────────────────────
function Arm({ side, outfit, skin, holdingBall }: {
  side: "left"|"right"; outfit: string; skin: string; holdingBall?: boolean;
}) {
  const s = side === "left" ? -1 : 1;
  const dk = darken(outfit, 0.18);

  return (
    <group position={[s*0.438, 0.5, 0]}>
      <group rotation={[holdingBall ? 0.5 : 0.07, 0, s*-0.36]}>
        {/* upper arm */}
        <mesh position={[0,-0.22,0]} scale={[0.86,1,0.86]} castShadow>
          <capsuleGeometry args={[0.12,0.36,8,14]} />
          <Mat color={outfit} roughness={0.8} />
        </mesh>
        {/* bicep swell */}
        <mesh position={[0,-0.14,0.05]} scale={[0.72,0.58,0.62]}>
          <sphereGeometry args={[0.13,14,10]} />
          <Mat color={lighten(outfit,0.05)} roughness={0.82} />
        </mesh>
        {/* elbow */}
        <mesh position={[0,-0.42,0]}>
          <sphereGeometry args={[0.115,16,14]} />
          <Mat color={dk} roughness={0.8} />
        </mesh>

        {/* forearm */}
        <group position={[0,-0.42,0]}
          rotation={[holdingBall ? -0.85 : -0.18, 0, 0]}>
          <mesh position={[0,-0.2,0]} scale={[0.8,1,0.8]} castShadow>
            <capsuleGeometry args={[0.098,0.32,8,12]} />
            <Mat color={skin} roughness={0.64} />
          </mesh>
          {/* wrist */}
          <mesh position={[0,-0.4,0]} scale={[0.85,0.52,0.85]}>
            <sphereGeometry args={[0.098,14,12]} />
            <Mat color={skin} roughness={0.64} />
          </mesh>
          {/* hand */}
          <group position={[0,-0.5,0]}>
            <Hand skin={skin} mirror={side==="left"} />
            {holdingBall && (
              <group position={[0,-0.2,0.11]}>
                <BowlingBall />
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
    new THREE.Vector2(0.28, -0.28),
    new THREE.Vector2(0.32, -0.12),
    new THREE.Vector2(0.355, 0.04),
    new THREE.Vector2(0.345, 0.18),
    new THREE.Vector2(0.31,  0.28),
  ], []);

  return (
    <group>
      <mesh castShadow>
        <latheGeometry args={[hipPoints, 24]} />
        <Mat color={pantsColor} roughness={0.86} />
      </mesh>
      {/* belt */}
      <mesh position={[0,0.26,0]}>
        <cylinderGeometry args={[0.325,0.33,0.05,24]} />
        <Mat color={darken(pantsColor,0.38)} roughness={0.62} metalness={0.12} />
      </mesh>
      {/* belt buckle */}
      <mesh position={[0,0.265,0.332]}>
        <boxGeometry args={[0.06,0.04,0.012]} />
        <Mat color="#C0A030" roughness={0.18} metalness={0.82} />
      </mesh>
    </group>
  );
}

// ─── LEG ──────────────────────────────────────────────────────────────────────
function Leg({ side, pantsColor }: { side: "left"|"right"; pantsColor: string }) {
  const legPoints = useMemo(() => [
    new THREE.Vector2(0.128, -0.56),
    new THREE.Vector2(0.138, -0.42),
    new THREE.Vector2(0.145, -0.24),
    new THREE.Vector2(0.152,  0.0),
    new THREE.Vector2(0.162,  0.12),
    new THREE.Vector2(0.168,  0.28),
    new THREE.Vector2(0.175,  0.44),
    new THREE.Vector2(0.175,  0.56),
  ], []);

  const s = side === "left" ? -1 : 1;

  return (
    <group position={[s*0.165,-0.26,0]}>
      <mesh castShadow>
        <latheGeometry args={[legPoints, 20]} />
        <Mat color={pantsColor} roughness={0.86} />
      </mesh>
      {/* kneecap */}
      <mesh position={[0,0.02,0.11]} scale={[1,0.72,0.76]}>
        <sphereGeometry args={[0.115,16,12]} />
        <Mat color={darken(pantsColor,0.14)} roughness={0.88} />
      </mesh>
      {/* pants crease */}
      <mesh position={[0,0.3,0.12]} scale={[0.32,0.58,0.38]}>
        <sphereGeometry args={[0.1,12,8]} />
        <Mat color={darken(pantsColor,0.08)} roughness={0.88} />
      </mesh>
      {/* sock / ankle */}
      <mesh position={[0,-0.56,0]} scale={[1,0.48,1]}>
        <sphereGeometry args={[0.115,14,12]} />
        <Mat color="#e8e8e8" roughness={0.9} />
      </mesh>
      {/* shoe */}
      <group position={[0,-0.68,0.04]} rotation={[-0.04,0,0]}>
        <Shoe mirror={side==="left"} />
      </group>
    </group>
  );
}

// ─── NECK ─────────────────────────────────────────────────────────────────────
function Neck({ skin }: { skin: string }) {
  const pts = useMemo(() => [
    new THREE.Vector2(0.118, 0),
    new THREE.Vector2(0.112, 0.1),
    new THREE.Vector2(0.104, 0.22),
  ], []);
  return (
    <mesh castShadow>
      <latheGeometry args={[pts, 16]} />
      <Mat color={skin} roughness={0.64} />
    </mesh>
  );
}

// ─── MAIN CHARACTER ───────────────────────────────────────────────────────────
export default function BowlerCharacter({ state }: { state: AvatarState }) {
  const groupRef = useRef<THREE.Group>(null);

  const skin    = SKIN_TONES[state.skinToneIdx] ?? SKIN_TONES[3];
  const outfit  = OUTFIT_HEX[state.outfit] ?? "#C03018";
  const outfitDk= darken(outfit, 0.22);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();
    groupRef.current.position.y = Math.sin(t * 1.2) * 0.038;
    groupRef.current.rotation.y = Math.sin(t * 0.35) * 0.055;
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]}>

      {/* HEAD */}
      <group position={[0, 1.82, 0]}>
        <Head state={state} />
      </group>

      {/* NECK */}
      <group position={[0, 1.58, 0]}>
        <Neck skin={skin} />
      </group>

      {/* TORSO */}
      <group position={[0, 1.0, 0]}>
        <Torso outfit={outfit} outfitDk={outfitDk} />
      </group>

      {/* ARMS */}
      <group position={[0, 1.0, 0]}>
        <Arm side="right" outfit={outfit} skin={skin} holdingBall />
        <Arm side="left"  outfit={outfit} skin={skin} />
      </group>

      {/* HIPS */}
      <group position={[0, 0.42, 0]}>
        <Hips pantsColor={PANTS_COLOR} />
      </group>

      {/* LEGS */}
      <group position={[0, 0.42, 0]}>
        <Leg side="left"  pantsColor={PANTS_COLOR} />
        <Leg side="right" pantsColor={PANTS_COLOR} />
      </group>

    </group>
  );
}
