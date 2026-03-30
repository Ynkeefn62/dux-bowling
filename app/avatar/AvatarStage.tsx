"use client";
import { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, ContactShadows, Environment, Grid } from "@react-three/drei";
import * as THREE from "three";
import BowlerCharacter, { type AvatarState } from "./BowlerCharacter";

// ─── Lane floor ───────────────────────────────────────────────────────────────
function LaneFloor() {
  const plankColors = ["#c49a2e","#b8922a","#cc9f30","#c09828","#c89c2c","#ba9428"];

  return (
    <group position={[0, -1.82, 0]}>
      {/* Planks */}
      {plankColors.map((color, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[(i - 2.5) * 0.55, 0.001, 0]} receiveShadow>
          <planeGeometry args={[0.52, 9]} />
          <meshStandardMaterial color={color} roughness={0.88} metalness={0.04} />
        </mesh>
      ))}
      {/* Approach (darker) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 2.4]}>
        <planeGeometry args={[3.5, 4]} />
        <meshStandardMaterial color="#8a6a18" roughness={0.92} />
      </mesh>
      {/* Foul line */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.003, 0.58]}>
        <planeGeometry args={[3.2, 0.055]} />
        <meshStandardMaterial color="#efefef" />
      </mesh>
      {/* Arrow markers */}
      {[-0.88, -0.44, 0, 0.44, 0.88].map((x, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.003, -0.2]}>
          <planeGeometry args={[0.045, 0.12]} />
          <meshStandardMaterial color="rgba(255,200,80,0.9)" />
        </mesh>
      ))}
      {/* Gutters */}
      {[-1.75, 1.75].map((x, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[x, -0.008, 0]}>
          <planeGeometry args={[0.22, 9]} />
          <meshStandardMaterial color="#120f08" roughness={0.95} />
        </mesh>
      ))}
    </group>
  );
}

// ─── Background pin glow (far end of lane) ────────────────────────────────────
function PinGlow() {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (meshRef.current) {
      (meshRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity =
        0.4 + Math.sin(clock.getElapsedTime() * 1.8) * 0.12;
    }
  });
  return (
    <mesh ref={meshRef} position={[0, -1.0, -4.5]}>
      <sphereGeometry args={[0.55, 16, 16]} />
      <meshStandardMaterial color="#1a1a2e" emissive="#38d9f5" emissiveIntensity={0.4} transparent opacity={0.18} />
    </mesh>
  );
}

// ─── Neon strip lights on ceiling ─────────────────────────────────────────────
function NeonStrips() {
  const stripRef = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!stripRef.current) return;
    stripRef.current.children.forEach((c, i) => {
      const mat = (c as THREE.Mesh).material as THREE.MeshStandardMaterial;
      if (mat?.emissiveIntensity !== undefined) {
        mat.emissiveIntensity = 0.6 + Math.sin(clock.getElapsedTime() * 0.9 + i * 1.2) * 0.12;
      }
    });
  });
  return (
    <group ref={stripRef} position={[0, 3.5, 0]}>
      {[
        { x: -1.4, color: "#38d9f5" },
        { x:  1.4, color: "#e46a2e" },
      ].map(({ x, color }, i) => (
        <mesh key={i} position={[x, 0, 0]}>
          <capsuleGeometry args={[0.04, 7, 4, 8]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.7} roughness={0.2} />
        </mesh>
      ))}
    </group>
  );
}

// ─── Loading fallback ─────────────────────────────────────────────────────────
function LoadingBox() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.y = clock.getElapsedTime();
  });
  return (
    <mesh ref={ref}>
      <boxGeometry args={[0.6, 0.6, 0.6]} />
      <meshStandardMaterial color="#38d9f5" wireframe />
    </mesh>
  );
}

// ─── Main stage ───────────────────────────────────────────────────────────────
export default function AvatarStage({ state }: { state: AvatarState }) {
  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <Canvas
        shadows
        camera={{ position: [0, 0.6, 5.2], fov: 52 }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.1 }}
        style={{ background: "transparent" }}
      >
        {/* ── Lighting ── */}
        <ambientLight intensity={0.18} color="#1a2040" />

        {/* Key light — warm, from front-left-above */}
        <directionalLight
          position={[3, 7, 4]}
          intensity={1.6}
          color="#fff8f0"
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-far={30}
          shadow-camera-left={-4}
          shadow-camera-right={4}
          shadow-camera-top={6}
          shadow-camera-bottom={-2}
        />

        {/* Cyan rim light — back left */}
        <directionalLight position={[-3, 4, -3]} intensity={0.55} color="#38d9f5" />

        {/* Orange fill — front right */}
        <pointLight position={[2.5, 2, 3]} intensity={0.45} color="#e46a2e" />

        {/* Purple accent — below back */}
        <pointLight position={[0, -1, -3]} intensity={0.28} color="#a78bfa" />

        {/* Lane overhead lights */}
        {[-0.8, 0, 0.8].map((x, i) => (
          <pointLight key={i} position={[x, 3.2, 0]} intensity={0.35} color="#fff5d0" distance={6} />
        ))}

        {/* ── Scene ── */}
        <LaneFloor />
        <NeonStrips />
        <PinGlow />

        {/* ── Character ── */}
        <Suspense fallback={<LoadingBox />}>
          <BowlerCharacter state={state} />
        </Suspense>

        {/* ── Contact shadow ── */}
        <ContactShadows
          position={[0, -1.82, 0]}
          opacity={0.65}
          scale={3.5}
          blur={2.2}
          far={0.5}
          color="#000000"
        />

        {/* ── Camera controls — constrained so character stays in view ── */}
        <OrbitControls
          enablePan={false}
          enableZoom={true}
          minPolarAngle={Math.PI * 0.22}
          maxPolarAngle={Math.PI * 0.68}
          minDistance={2.8}
          maxDistance={8}
          target={[0, 0.2, 0]}
          autoRotate={false}
        />

        {/* ── Environment for reflections ── */}
        <Environment preset="city" />
      </Canvas>

      {/* Overlay hint */}
      <div style={{
        position: "absolute", bottom: 10, left: "50%", transform: "translateX(-50%)",
        fontSize: ".5rem", color: "rgba(240,240,255,0.28)",
        fontFamily: "'Courier New',monospace", letterSpacing: ".1em",
        pointerEvents: "none", whiteSpace: "nowrap",
      }}>
        DRAG TO ROTATE  ·  SCROLL TO ZOOM
      </div>
    </div>
  );
}
