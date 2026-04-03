"use client";
import { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import BowlerCharacter, { type AvatarState } from "@/app/avatar/BowlerCharacter";

// ─── Glowing platform ────────────────────────────────────────────────────────
function Platform({ mood }: { mood: string }) {
  const ringRef = useRef<THREE.Mesh>(null);
  const ringColor = mood === "celebrate" ? "#ffd700" : mood === "thinking" ? "#38d9f5" : "#e46a2e";

  useFrame(({ clock }) => {
    if (!ringRef.current) return;
    const mat = ringRef.current.material as THREE.MeshStandardMaterial;
    mat.emissiveIntensity = 0.5 + Math.sin(clock.getElapsedTime() * 1.8) * 0.25;
  });

  return (
    <group position={[0, -1.82, 0]}>
      {/* Base disc */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[2.0, 64]} />
        <meshStandardMaterial color="#111320" roughness={0.55} metalness={0.22} />
      </mesh>
      {/* Inner glow ring */}
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, 0]}>
        <ringGeometry args={[1.55, 1.82, 72]} />
        <meshStandardMaterial
          color={ringColor}
          emissive={ringColor}
          emissiveIntensity={0.5}
          transparent
          opacity={0.75}
        />
      </mesh>
      {/* Subtle dots around ring */}
      {Array.from({ length: 12 }, (_, i) => {
        const angle = (i / 12) * Math.PI * 2;
        const r = 1.68;
        return (
          <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[Math.cos(angle) * r, 0.006, Math.sin(angle) * r]}>
            <circleGeometry args={[0.038, 8]} />
            <meshStandardMaterial color={ringColor} emissive={ringColor} emissiveIntensity={1.2} />
          </mesh>
        );
      })}
    </group>
  );
}

// ─── Confetti particle (celebrate mode) ──────────────────────────────────────
function CelebrationParticles() {
  const groupRef = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();
    groupRef.current.children.forEach((child, i) => {
      const mesh = child as THREE.Mesh;
      mesh.position.y = (Math.sin(t * 1.4 + i * 0.8) * 0.4) + 0.8;
      mesh.rotation.z = t * (0.8 + i * 0.15);
      mesh.rotation.x = t * (0.5 + i * 0.1);
    });
  });

  const colors = ["#ffd700", "#e46a2e", "#38d9f5", "#ff6b9d", "#a78bfa"];
  return (
    <group ref={groupRef}>
      {Array.from({ length: 14 }, (_, i) => {
        const angle = (i / 14) * Math.PI * 2;
        const r = 0.8 + (i % 3) * 0.3;
        return (
          <mesh key={i} position={[Math.cos(angle) * r, 0, Math.sin(angle) * r * 0.6]}>
            <boxGeometry args={[0.06, 0.06, 0.006]} />
            <meshStandardMaterial color={colors[i % colors.length]} emissive={colors[i % colors.length]} emissiveIntensity={0.6} />
          </mesh>
        );
      })}
    </group>
  );
}

// ─── Spinner fallback ────────────────────────────────────────────────────────
function Spinner() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => { if (ref.current) ref.current.rotation.y = clock.getElapsedTime() * 2; });
  return (
    <mesh ref={ref}>
      <torusGeometry args={[0.5, 0.06, 8, 32]} />
      <meshStandardMaterial color="#38d9f5" emissive="#38d9f5" emissiveIntensity={0.8} />
    </mesh>
  );
}

// ─── Main scene ──────────────────────────────────────────────────────────────
export default function DashboardAvatarScene({
  state,
  mood = "idle",
}: {
  state: AvatarState;
  mood?: "celebrate" | "idle" | "thinking";
}) {
  const celebrateLight = mood === "celebrate";
  const thinkingLight = mood === "thinking";

  return (
    <Canvas
      shadows
      camera={{ position: [0.3, 0.7, 4.0], fov: 50 }}
      gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05 }}
      style={{ background: "transparent", width: "100%", height: "100%" }}
    >
      {/* Base ambient */}
      <ambientLight intensity={0.15} color="#1a2040" />

      {/* Key light */}
      <directionalLight
        position={[3, 7, 4]}
        intensity={1.6}
        color="#fff8f0"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-far={20}
        shadow-camera-left={-3}
        shadow-camera-right={3}
        shadow-camera-top={5}
        shadow-camera-bottom={-2}
      />

      {/* Cyan rim */}
      <directionalLight position={[-3, 4, -3]} intensity={0.5} color="#38d9f5" />

      {/* Orange fill */}
      <pointLight position={[2.5, 2, 3]} intensity={0.45} color="#e46a2e" />

      {/* Mood accent light */}
      {celebrateLight && <pointLight position={[0, 3.5, 0]} intensity={2.0} color="#ffd700" distance={6} />}
      {thinkingLight && <pointLight position={[0, 2, 1]} intensity={0.8} color="#38d9f5" distance={5} />}

      {/* Scene */}
      <Platform mood={mood} />
      {celebrateLight && <CelebrationParticles />}

      <Suspense fallback={<Spinner />}>
        <BowlerCharacter state={state} />
      </Suspense>
    </Canvas>
  );
}
