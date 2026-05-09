"use client";
import React, { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import type { AvatarState } from "@/app/avatar/AvatarSVG";
import BowlerCharacter3D from "@/app/avatar/BowlerCharacter3D";

/**
 * AvatarFaceThumb — a circular thumbnail of the bowler's face.
 *
 * Renders the full BowlerCharacter3D scene but frames the camera
 * tightly on the head (world Y ≈ 0.71, radius 0.22) so only the
 * face is visible in the circular clip.
 *
 * Use inside a "use client" component via dynamic() to avoid SSR.
 */
export default function AvatarFaceThumb({
  state,
  size = 44,
  border,
}: {
  state: AvatarState;
  size?: number;
  /** Optional CSS border string, e.g. "2.5px solid #e46a2e" */
  border?: string;
}) {
  // Head world-Y = hipsGrp(-0.12) + torsoGrp(0) + headGrp(0.83) = 0.71
  const HEAD_Y = 0.71;

  return (
    <div
      style={{
        width:  size,
        height: size,
        borderRadius: "50%",
        overflow: "hidden",
        flexShrink: 0,
        border: border ?? "none",
        background: "transparent",
      }}
    >
      <Canvas
        style={{ width: "100%", height: "100%", display: "block" }}
        gl={{ alpha: true, antialias: true }}
        camera={{ position: [0, HEAD_Y, 0.80], fov: 36 }}
        onCreated={({ camera }) => camera.lookAt(0, HEAD_Y, 0)}
      >
        {/* simple lighting — no shadows for thumbnail */}
        <ambientLight intensity={0.65} />
        <directionalLight position={[1.5, 2.5, 2]} intensity={1.3} />
        <directionalLight position={[-1, 0.5, -1]} intensity={0.25} color="#b8d4ff" />

        <Suspense fallback={null}>
          <BowlerCharacter3D state={state} />
        </Suspense>
      </Canvas>
    </div>
  );
}
