"use client";
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// ─── Color maps ───────────────────────────────────────────────────────────────
const SKIN_TONES = [
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
const SHOE_COLOR  = "#1a1010";

// ─── AvatarState (mirrors page.tsx) ──────────────────────────────────────────
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

// ─── Helpers ──────────────────────────────────────────────────────────────────
function darken(hex: string, amt: number): string {
  const c = new THREE.Color(hex);
  return "#" + c.multiplyScalar(1 - amt).getHexString();
}

// ─── Shared material shortcuts ────────────────────────────────────────────────
function SM({ color, roughness = 0.75, metalness = 0, emissive, emissiveIntensity = 0.06 }: {
  color: string; roughness?: number; metalness?: number;
  emissive?: string; emissiveIntensity?: number;
}) {
  return (
    <meshStandardMaterial
      color={color}
      roughness={roughness}
      metalness={metalness}
      emissive={emissive ?? color}
      emissiveIntensity={emissive ? emissiveIntensity : 0}
    />
  );
}

// ─── HAIR ─────────────────────────────────────────────────────────────────────
function HairMesh({ style, color }: { style: string; color: string }) {
  const dark = darken(color, 0.3);
  const mat  = <SM color={color} roughness={0.92} />;
  const matD = <SM color={dark}  roughness={0.92} />;

  if (style === "bald") return null;

  if (style === "pompadour") return (
    <group>
      <mesh position={[0, 0.5, 0]}>
        <sphereGeometry args={[0.5, 32, 32, 0, Math.PI * 2, 0, Math.PI * 0.52]} />
        {mat}
      </mesh>
      <mesh position={[0, 0.62, 0.22]} rotation={[0.5, 0, 0]}>
        <capsuleGeometry args={[0.19, 0.28, 8, 16]} />
        {mat}
      </mesh>
      <mesh position={[0, 0.54, 0.28]} rotation={[0.6, 0, 0]}>
        <capsuleGeometry args={[0.11, 0.14, 8, 12]} />
        {matD}
      </mesh>
    </group>
  );

  if (style === "short") return (
    <mesh position={[0, 0.4, 0]}>
      <sphereGeometry args={[0.51, 32, 32, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
      {mat}
    </mesh>
  );

  if (style === "buzz") return (
    <mesh position={[0, 0.36, 0]}>
      <sphereGeometry args={[0.525, 32, 32, 0, Math.PI * 2, 0, Math.PI * 0.46]} />
      {mat}
    </mesh>
  );

  if (style === "bob") return (
    <group>
      <mesh position={[0, 0.28, 0]}>
        <sphereGeometry args={[0.56, 32, 32, 0, Math.PI * 2, 0, Math.PI * 0.65]} />
        {mat}
      </mesh>
      <mesh position={[0, -0.1, -0.15]}>
        <sphereGeometry args={[0.42, 24, 24, 0, Math.PI * 2, Math.PI * 0.38, Math.PI * 0.35]} />
        {mat}
      </mesh>
    </group>
  );

  if (style === "long") return (
    <group>
      <mesh position={[0, 0.38, 0]}>
        <sphereGeometry args={[0.53, 32, 32, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
        {mat}
      </mesh>
      {[-0.18, 0.18].map((x, i) => (
        <mesh key={i} position={[x, -0.6, -0.22]} rotation={[0.15, 0, x < 0 ? 0.1 : -0.1]}>
          <capsuleGeometry args={[0.14, 1.1, 6, 12]} />
          {mat}
        </mesh>
      ))}
      <mesh position={[0, -0.4, -0.26]} rotation={[0.1, 0, 0]}>
        <capsuleGeometry args={[0.18, 0.7, 8, 12]} />
        {matD}
      </mesh>
    </group>
  );

  if (style === "curly") return (
    <group>
      {[
        [0,0.6,0,0.22],[0.3,0.48,0.1,0.2],[-0.3,0.48,0.1,0.2],
        [0.42,0.28,0,0.18],[-0.42,0.28,0,0.18],
        [0.22,0.4,-0.3,0.18],[-0.22,0.4,-0.3,0.18],
        [0,0.28,-0.35,0.2],
      ].map(([x,y,z,r],i) => (
        <mesh key={i} position={[x,y,z]}>
          <sphereGeometry args={[r, 16, 16]} />
          {i % 2 === 0 ? mat : matD}
        </mesh>
      ))}
    </group>
  );

  if (style === "bun") return (
    <group>
      <mesh position={[0, 0.38, 0]}>
        <sphereGeometry args={[0.51, 32, 32, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
        {mat}
      </mesh>
      <mesh position={[0, 0.75, 0]}>
        <sphereGeometry args={[0.24, 20, 20]} />
        {mat}
      </mesh>
      <mesh position={[0, 0.75, 0]} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[0.18, 0.05, 8, 24]} />
        {matD}
      </mesh>
    </group>
  );

  return (
    <mesh position={[0, 0.4, 0]}>
      <sphereGeometry args={[0.51, 32, 32, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
      {mat}
    </mesh>
  );
}

// ─── FACIAL HAIR ──────────────────────────────────────────────────────────────
function FacialHairMesh({ style, color }: { style: string; color: string }) {
  const mat = <SM color={color} roughness={0.92} />;
  if (style === "none" || !style) return null;

  if (style === "stubble") return (
    <mesh position={[0, -0.28, 0.47]}>
      <sphereGeometry args={[0.28, 16, 16, 0, Math.PI * 2, Math.PI * 0.5, Math.PI * 0.3]} />
      <meshStandardMaterial color={color} roughness={0.95} transparent opacity={0.45} />
    </mesh>
  );

  if (style === "mustache") return (
    <group position={[0, -0.12, 0.49]}>
      {[-0.12, 0.12].map((x, i) => (
        <mesh key={i} position={[x, 0, 0]} rotation={[0, 0, i === 0 ? -0.25 : 0.25]}>
          <capsuleGeometry args={[0.055, 0.14, 6, 12]} />
          {mat}
        </mesh>
      ))}
    </group>
  );

  if (style === "beard-short") return (
    <group>
      <mesh position={[0, -0.12, 0.49]} rotation={[0, 0, 0]}>
        <sphereGeometry args={[0.3, 20, 20, 0, Math.PI * 2, Math.PI * 0.55, Math.PI * 0.22]} />
        {mat}
      </mesh>
      <mesh position={[0, -0.32, 0.44]} scale={[1, 0.7, 0.8]}>
        <sphereGeometry args={[0.26, 20, 20, 0, Math.PI * 2, Math.PI * 0.35, Math.PI * 0.3]} />
        {mat}
      </mesh>
    </group>
  );

  if (style === "beard-full") return (
    <group>
      <mesh position={[0, -0.12, 0.49]}>
        <sphereGeometry args={[0.3, 20, 20, 0, Math.PI * 2, Math.PI * 0.52, Math.PI * 0.24]} />
        {mat}
      </mesh>
      <mesh position={[0, -0.36, 0.4]} scale={[1.1, 1, 0.9]}>
        <sphereGeometry args={[0.32, 20, 20, 0, Math.PI * 2, Math.PI * 0.3, Math.PI * 0.45]} />
        {mat}
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
    <group position={[0, 0.08, 0.5]}>
      {[-0.175, 0.175].map((x, i) => (
        <group key={i} position={[x, 0, 0]}>
          <mesh>
            <torusGeometry args={[0.115, 0.018, 10, 28]} />
            <SM color={frameColor} roughness={0.3} metalness={0.6} />
          </mesh>
          <mesh position={[0, 0, -0.01]}>
            <circleGeometry args={[0.1, 24]} />
            <meshStandardMaterial color={lensColor} transparent opacity={tinted ? 0.92 : 0.28} roughness={0.05} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <capsuleGeometry args={[0.012, 0.12, 4, 8]} />
        <SM color={frameColor} roughness={0.3} metalness={0.6} />
      </mesh>
    </group>
  );
}

function HatMesh({ color }: { color: string }) {
  const dark = darken(color, 0.32);
  return (
    <group position={[0, 0.5, 0]}>
      <mesh position={[0, 0.22, 0]}>
        <cylinderGeometry args={[0.38, 0.44, 0.52, 24]} />
        <SM color={color} roughness={0.88} />
      </mesh>
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.62, 0.62, 0.06, 32]} />
        <SM color={dark} roughness={0.88} />
      </mesh>
      <mesh position={[0, 0.32, 0.2]} rotation={[0, 0, 0]}>
        <boxGeometry args={[0.35, 0.05, 0.02]} />
        <SM color="#e46a2e" roughness={0.7} />
      </mesh>
    </group>
  );
}

function HeadbandMesh() {
  return (
    <mesh position={[0, 0.22, 0]} rotation={[Math.PI * 0.08, 0, 0]}>
      <torusGeometry args={[0.51, 0.06, 10, 48, Math.PI * 1.6]} />
      <SM color="#e46a2e" roughness={0.7} emissive="#e46a2e" emissiveIntensity={0.18} />
    </mesh>
  );
}

function EarringsMesh() {
  return (
    <>
      {[-0.52, 0.52].map((x, i) => (
        <group key={i} position={[x, -0.15, 0.02]}>
          <mesh>
            <torusGeometry args={[0.065, 0.022, 8, 20]} />
            <SM color="#E8B420" roughness={0.3} metalness={0.8} />
          </mesh>
        </group>
      ))}
    </>
  );
}

// ─── HEAD ─────────────────────────────────────────────────────────────────────
function Head({ state }: { state: AvatarState }) {
  const skin    = SKIN_TONES[state.skinToneIdx] ?? SKIN_TONES[3];
  const skinDk  = darken(skin, 0.18);
  const hair    = HAIR_HEX[state.hairColor] ?? "#5C2E18";
  const eyeC    = EYE_HEX[state.eyeColor]   ?? "#4A2C10";

  const fwX = state.faceShape === "square" ? 1.06 : state.faceShape === "round" ? 1.1 : state.faceShape === "heart" ? 0.95 : 1.0;
  const fwY = state.faceShape === "oval"   ? 1.1  : state.faceShape === "square" ? 0.96 : 1.0;

  return (
    <group>
      {/* Head */}
      <mesh scale={[fwX, fwY, 1]}>
        <sphereGeometry args={[0.5, 40, 40]} />
        <SM color={skin} roughness={0.65} />
      </mesh>

      {/* Ears */}
      {[-0.5, 0.5].map((x, i) => (
        <group key={i} position={[x * fwX, -0.02, 0]}>
          <mesh scale={[0.7, 1, 0.5]}>
            <sphereGeometry args={[0.13, 16, 16]} />
            <SM color={skin} roughness={0.65} />
          </mesh>
          <mesh position={[x < 0 ? -0.04 : 0.04, -0.02, 0]} scale={[0.5, 0.7, 0.4]}>
            <sphereGeometry args={[0.09, 12, 12]} />
            <SM color={skinDk} roughness={0.7} />
          </mesh>
        </group>
      ))}

      {/* Eyes */}
      {[-0.165, 0.165].map((x, i) => (
        <group key={i} position={[x, 0.1, 0.46]}>
          <mesh scale={[1.15, 1, 0.6]}>
            <sphereGeometry args={[0.105, 24, 24]} />
            <meshStandardMaterial color="#F5EEE4" roughness={0.25} />
          </mesh>
          <mesh position={[0, 0, 0.055]}>
            <sphereGeometry args={[0.075, 20, 20]} />
            <SM color={eyeC} roughness={0.4} emissive={eyeC} emissiveIntensity={0.15} />
          </mesh>
          <mesh position={[0, 0, 0.09]}>
            <sphereGeometry args={[0.04, 16, 16]} />
            <meshStandardMaterial color="#050202" roughness={0.3} />
          </mesh>
          <mesh position={[0.022, 0.022, 0.11]}>
            <sphereGeometry args={[0.016, 8, 8]} />
            <meshStandardMaterial color="white" roughness={0.1} />
          </mesh>
        </group>
      ))}

      {/* Eyebrows */}
      {[-0.165, 0.165].map((x, i) => (
        <mesh key={i} position={[x, 0.255, 0.44]} rotation={[0, 0, x < 0 ? 0.22 : -0.22]}>
          <capsuleGeometry args={[0.018, 0.135, 4, 12]} />
          <SM color={hair} roughness={0.9} />
        </mesh>
      ))}

      {/* Nose */}
      <mesh position={[0, -0.04, 0.5]} scale={[0.85, 0.85, 0.75]}>
        <sphereGeometry args={[0.07, 16, 16]} />
        <SM color={skinDk} roughness={0.7} />
      </mesh>
      {[-0.055, 0.055].map((x, i) => (
        <mesh key={i} position={[x, -0.06, 0.49]} scale={[0.8, 0.8, 0.7]}>
          <sphereGeometry args={[0.045, 12, 12]} />
          <SM color={skinDk} roughness={0.7} />
        </mesh>
      ))}

      {/* Mouth */}
      <mesh position={[0, -0.195, 0.47]} rotation={[0.18, 0, 0]}>
        <torusGeometry args={[0.095, 0.022, 8, 24, Math.PI]} />
        <SM color={darken(skin, 0.28)} roughness={0.7} />
      </mesh>
      <mesh position={[0, -0.178, 0.48]} scale={[1, 0.55, 1]}>
        <sphereGeometry args={[0.075, 16, 8, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
        <SM color={darken(skin, 0.2)} roughness={0.65} />
      </mesh>

      {/* Hair */}
      <HairMesh style={state.hairStyle} color={hair} />

      {/* Facial hair */}
      <FacialHairMesh style={state.facialHair} color={hair} />

      {/* Accessories */}
      {state.accessories.includes("glasses")    && <GlassesMesh />}
      {state.accessories.includes("sunglasses") && <GlassesMesh tinted />}
      {state.accessories.includes("hat")        && <HatMesh color={hair} />}
      {state.accessories.includes("headband")   && <HeadbandMesh />}
      {state.accessories.includes("earrings")   && <EarringsMesh />}
    </group>
  );
}

// ─── BOWLING BALL ─────────────────────────────────────────────────────────────
function BowlingBall() {
  return (
    <group>
      <mesh>
        <sphereGeometry args={[0.16, 28, 28]} />
        <meshStandardMaterial color="#1a3020" roughness={0.25} metalness={0.05}
          emissive="#0d1810" emissiveIntensity={0.1} />
      </mesh>
      {[[0, 0.08, 0.14],[0.06, 0.04, 0.14],[-0.06, 0.04, 0.14]].map(([x,y,z],i) => (
        <mesh key={i} position={[x, y, z]}>
          <sphereGeometry args={[0.025, 8, 8]} />
          <meshStandardMaterial color="#060e09" roughness={0.6} />
        </mesh>
      ))}
    </group>
  );
}

// ─── FULL BODY ────────────────────────────────────────────────────────────────
export default function BowlerCharacter({ state }: { state: AvatarState }) {
  const groupRef = useRef<THREE.Group>(null);

  const skin   = SKIN_TONES[state.skinToneIdx] ?? SKIN_TONES[3];
  const outfit = OUTFIT_HEX[state.outfit] ?? "#C03018";
  const outfitDk = darken(outfit, 0.22);
  const pantsDk  = darken(PANTS_COLOR, 0.2);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();
    groupRef.current.position.y = Math.sin(t * 1.4) * 0.045;
    groupRef.current.rotation.y = Math.sin(t * 0.4) * 0.06;
  });

  return (
    <group ref={groupRef}>

      {/* ── HEAD ── */}
      <group position={[0, 1.72, 0]}>
        <Head state={state} />
      </group>

      {/* ── NECK ── */}
      <mesh position={[0, 1.22, 0]}>
        <capsuleGeometry args={[0.11, 0.22, 8, 12]} />
        <SM color={skin} roughness={0.65} />
      </mesh>

      {/* ── TORSO ── */}
      <group>
        {/* Chest */}
        <mesh position={[0, 0.82, 0]}>
          <cylinderGeometry args={[0.42, 0.39, 0.62, 20]} />
          <SM color={outfit} roughness={0.82} />
        </mesh>
        {/* Waist */}
        <mesh position={[0, 0.34, 0]}>
          <cylinderGeometry args={[0.39, 0.36, 0.42, 20]} />
          <SM color={outfitDk} roughness={0.82} />
        </mesh>
        {/* Shoulder caps */}
        {[-0.44, 0.44].map((x, i) => (
          <mesh key={i} position={[x, 1.05, 0]}>
            <sphereGeometry args={[0.22, 20, 20]} />
            <SM color={outfit} roughness={0.82} />
          </mesh>
        ))}
        {/* Collar */}
        <mesh position={[0, 1.12, 0.28]} rotation={[0.3, 0, 0]}>
          <torusGeometry args={[0.14, 0.04, 8, 20, Math.PI * 1.5]} />
          <SM color={outfitDk} roughness={0.8} />
        </mesh>
        {/* Outfit detail — center buttons/stripe */}
        <mesh position={[0, 0.72, 0.39]}>
          <capsuleGeometry args={[0.025, 0.5, 4, 8]} />
          <SM color={darken(outfit, 0.35)} roughness={0.75} />
        </mesh>
      </group>

      {/* ── RIGHT ARM (holds ball) ── */}
      <group position={[0.48, 0.92, 0]}>
        {/* Upper arm */}
        <mesh position={[0.18, -0.22, 0]} rotation={[0, 0, -0.7]}>
          <capsuleGeometry args={[0.14, 0.44, 8, 12]} />
          <SM color={outfit} roughness={0.82} />
        </mesh>
        {/* Elbow */}
        <mesh position={[0.38, -0.48, 0]}>
          <sphereGeometry args={[0.14, 16, 16]} />
          <SM color={outfit} roughness={0.82} />
        </mesh>
        {/* Lower arm + hand (angled forward, holding ball) */}
        <mesh position={[0.44, -0.78, 0.22]} rotation={[0.6, 0, -0.25]}>
          <capsuleGeometry args={[0.12, 0.38, 8, 12]} />
          <SM color={skin} roughness={0.65} />
        </mesh>
        {/* Hand */}
        <mesh position={[0.5, -1.02, 0.45]}>
          <sphereGeometry args={[0.13, 16, 16]} />
          <SM color={skin} roughness={0.65} />
        </mesh>
        {/* Bowling ball */}
        <group position={[0.58, -1.14, 0.56]}>
          <BowlingBall />
        </group>
      </group>

      {/* ── LEFT ARM (relaxed at side) ── */}
      <group position={[-0.48, 0.92, 0]}>
        <mesh position={[-0.16, -0.24, 0]} rotation={[0, 0, 0.65]}>
          <capsuleGeometry args={[0.14, 0.44, 8, 12]} />
          <SM color={outfit} roughness={0.82} />
        </mesh>
        <mesh position={[-0.34, -0.5, 0]}>
          <sphereGeometry args={[0.14, 16, 16]} />
          <SM color={outfit} roughness={0.82} />
        </mesh>
        <mesh position={[-0.38, -0.8, 0.08]} rotation={[0.15, 0, 0.2]}>
          <capsuleGeometry args={[0.12, 0.4, 8, 12]} />
          <SM color={skin} roughness={0.65} />
        </mesh>
        <mesh position={[-0.42, -1.05, 0.12]}>
          <sphereGeometry args={[0.13, 16, 16]} />
          <SM color={skin} roughness={0.65} />
        </mesh>
      </group>

      {/* ── HIPS ── */}
      <mesh position={[0, 0.05, 0]}>
        <cylinderGeometry args={[0.38, 0.35, 0.22, 20]} />
        <SM color={PANTS_COLOR} roughness={0.85} />
      </mesh>

      {/* ── LEGS ── */}
      {[-0.18, 0.18].map((x, i) => (
        <group key={i} position={[x, 0, 0]}>
          {/* Upper leg */}
          <mesh position={[0, -0.44, 0]}>
            <capsuleGeometry args={[0.16, 0.58, 8, 16]} />
            <SM color={PANTS_COLOR} roughness={0.85} />
          </mesh>
          {/* Knee */}
          <mesh position={[0, -0.82, 0]}>
            <sphereGeometry args={[0.17, 16, 16]} />
            <SM color={pantsDk} roughness={0.85} />
          </mesh>
          {/* Lower leg */}
          <mesh position={[0, -1.16, 0]}>
            <capsuleGeometry args={[0.14, 0.54, 8, 16]} />
            <SM color={PANTS_COLOR} roughness={0.85} />
          </mesh>
          {/* Ankle */}
          <mesh position={[0, -1.52, 0]}>
            <sphereGeometry args={[0.13, 12, 12]} />
            <SM color={SHOE_COLOR} roughness={0.7} />
          </mesh>
          {/* Shoe */}
          <mesh position={[0, -1.68, 0.1]} rotation={[-0.15, 0, 0]} scale={[1, 0.7, 1.4]}>
            <sphereGeometry args={[0.16, 16, 16]} />
            <SM color={SHOE_COLOR} roughness={0.7} metalness={0.05} />
          </mesh>
          {/* Sole */}
          <mesh position={[0, -1.76, 0.06]} rotation={[-Math.PI / 2, 0, 0]} scale={[1, 1.5, 1]}>
            <circleGeometry args={[0.16, 16]} />
            <SM color={darken(SHOE_COLOR, 0.3)} roughness={0.9} />
          </mesh>
        </group>
      ))}

    </group>
  );
}
