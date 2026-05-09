"use client";
import * as THREE from "three";
import React, { useMemo } from "react";

/**
 * BowlingLane — full bowling alley scene under the avatar.
 *
 * Layout (Z negative goes into the distance):
 *  Z = +1.5  back of approach floor
 *  Z =  0.0  bowler's feet (avatar at this Z)
 *  Z = -0.4  foul line
 *  Z = -0.4 to -5.4  lane proper (with gutters)
 *  Z = -5.6  pin deck
 */

function makeWoodTexture(opts: { hue: number; light: boolean; planks: number }) {
  const { hue, light, planks } = opts;
  const c = document.createElement("canvas");
  c.width = 1024; c.height = 1024;
  const ctx = c.getContext("2d")!;

  // base color gradient
  const grad = ctx.createLinearGradient(0, 0, 0, 1024);
  if (light) {
    grad.addColorStop(0,   `hsl(${hue}, 38%, 56%)`);
    grad.addColorStop(0.5, `hsl(${hue}, 36%, 48%)`);
    grad.addColorStop(1,   `hsl(${hue}, 34%, 40%)`);
  } else {
    grad.addColorStop(0,   `hsl(${hue}, 32%, 38%)`);
    grad.addColorStop(0.5, `hsl(${hue}, 30%, 32%)`);
    grad.addColorStop(1,   `hsl(${hue}, 28%, 26%)`);
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1024, 1024);

  // planks running along Y axis (lane direction)
  const plankW = 1024 / planks;
  for (let i = 0; i < planks; i++) {
    const x = i * plankW;
    // plank seam (dark line)
    ctx.fillStyle = "rgba(20, 12, 6, 0.85)";
    ctx.fillRect(x, 0, 1.5, 1024);
    // edge highlight
    ctx.fillStyle = "rgba(255, 220, 170, 0.10)";
    ctx.fillRect(x + 1.5, 0, 1, 1024);
    // shading per plank (slight color variance)
    const shade = (Math.sin(i * 1.7) * 0.5 + 0.5) * 0.18;
    ctx.fillStyle = `rgba(0, 0, 0, ${shade.toFixed(3)})`;
    ctx.fillRect(x + 2, 0, plankW - 2, 1024);
  }

  // wood grain — bezier curves running along plank direction
  ctx.lineCap = "round";
  for (let i = 0; i < 250; i++) {
    const yStart = Math.random() * 1024;
    const xCol = Math.floor(Math.random() * planks);
    const xBase = xCol * plankW + plankW * 0.5;
    ctx.strokeStyle = `rgba(${30 + Math.random()*40}, ${20 + Math.random()*30}, ${10 + Math.random()*20}, ${0.10 + Math.random()*0.15})`;
    ctx.lineWidth = 0.5 + Math.random() * 1.2;
    ctx.beginPath();
    ctx.moveTo(xBase + (Math.random() - 0.5) * plankW * 0.6, yStart);
    ctx.bezierCurveTo(
      xBase + (Math.random() - 0.5) * plankW * 0.5,
      yStart + 100 + Math.random() * 200,
      xBase + (Math.random() - 0.5) * plankW * 0.5,
      yStart + 300 + Math.random() * 200,
      xBase + (Math.random() - 0.5) * plankW * 0.6,
      yStart + 500 + Math.random() * 300,
    );
    ctx.stroke();
  }

  // knots
  for (let i = 0; i < 6; i++) {
    const xKnot = Math.random() * 1024;
    const yKnot = Math.random() * 1024;
    const r = 6 + Math.random() * 8;
    const knotGrad = ctx.createRadialGradient(xKnot, yKnot, 0, xKnot, yKnot, r);
    knotGrad.addColorStop(0, "rgba(40, 22, 10, 0.9)");
    knotGrad.addColorStop(0.6, "rgba(40, 22, 10, 0.4)");
    knotGrad.addColorStop(1, "rgba(40, 22, 10, 0)");
    ctx.fillStyle = knotGrad;
    ctx.beginPath(); ctx.arc(xKnot, yKnot, r, 0, Math.PI * 2); ctx.fill();
  }

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  return tex;
}

function makeArrowTexture() {
  const c = document.createElement("canvas");
  c.width = 256; c.height = 1024;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "rgba(0,0,0,0)";
  ctx.fillRect(0, 0, 256, 1024);
  // 7 arrow markers at ~30% from foul line
  ctx.fillStyle = "#0a0a14";
  const arrowY = 280;
  const positions = [-90, -60, -30, 0, 30, 60, 90];
  for (const px of positions) {
    const x = 128 + px;
    ctx.beginPath();
    ctx.moveTo(x, arrowY);
    ctx.lineTo(x - 8, arrowY + 22);
    ctx.lineTo(x + 8, arrowY + 22);
    ctx.closePath();
    ctx.fill();
  }
  // dots near foul line
  for (const px of [-60, -30, 0, 30, 60]) {
    const x = 128 + px;
    ctx.beginPath();
    ctx.arc(x, 110, 4, 0, Math.PI * 2);
    ctx.fill();
  }
  return new THREE.CanvasTexture(c);
}

function Pin({ position }: { position: [number, number, number] }) {
  // bowling pin lathe profile
  const pts = useMemo(() => [
    new THREE.Vector2(0.000, 0.00),
    new THREE.Vector2(0.045, 0.005),
    new THREE.Vector2(0.052, 0.04),
    new THREE.Vector2(0.054, 0.10),
    new THREE.Vector2(0.048, 0.18),
    new THREE.Vector2(0.038, 0.24),
    new THREE.Vector2(0.030, 0.28),
    new THREE.Vector2(0.028, 0.32),
    new THREE.Vector2(0.034, 0.36),
    new THREE.Vector2(0.036, 0.39),
    new THREE.Vector2(0.030, 0.41),
    new THREE.Vector2(0.000, 0.42),
  ], []);
  const geo = useMemo(() => new THREE.LatheGeometry(pts, 24), [pts]);

  return (
    <group position={position}>
      <mesh geometry={geo} castShadow receiveShadow>
        <meshStandardMaterial color="#fafafa" roughness={0.35} metalness={0.05} />
      </mesh>
      {/* Red collar stripe near top */}
      <mesh position={[0, 0.34, 0]}>
        <cylinderGeometry args={[0.034, 0.030, 0.022, 16]} />
        <meshStandardMaterial color="#c8392b" roughness={0.35} metalness={0.05} />
      </mesh>
      <mesh position={[0, 0.305, 0]}>
        <cylinderGeometry args={[0.030, 0.029, 0.012, 16]} />
        <meshStandardMaterial color="#c8392b" roughness={0.35} />
      </mesh>
    </group>
  );
}

export default function BowlingLane() {
  const approachTex = useMemo(
    () => makeWoodTexture({ hue: 28, light: false, planks: 14 }),
    [],
  );
  const laneTex = useMemo(
    () => makeWoodTexture({ hue: 32, light: true, planks: 39 }),
    [],
  );
  const arrowTex = useMemo(() => makeArrowTexture(), []);

  // Lane is 1.05 wide (39 boards × ~0.027 each in real bowling)
  const LANE_W = 1.05;
  const LANE_LEN = 6.0;

  return (
    <group position={[0, -0.860, 0]}>
      {/* Distant back wall (pin deck masking wall) — soft gradient */}
      <mesh position={[0, 1.6, -6.4]} receiveShadow>
        <planeGeometry args={[10, 4]} />
        <meshStandardMaterial color="#1a1a28" roughness={0.9} />
      </mesh>

      {/* APPROACH FLOOR (where bowler stands) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0.7]} receiveShadow>
        <planeGeometry args={[3.2, 2.6]} />
        <meshStandardMaterial map={approachTex} roughness={0.6} metalness={0.05} />
      </mesh>

      {/* DOTS row on approach (a few feet behind foul line) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, -0.18]}>
        <planeGeometry args={[1.05, 0.12]} />
        <meshStandardMaterial
          map={arrowTex}
          transparent
          alphaTest={0.05}
          roughness={0.7}
          opacity={0.85}
        />
      </mesh>

      {/* FOUL LINE */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, -0.40]}>
        <planeGeometry args={[1.05, 0.022]} />
        <meshStandardMaterial color="#1a0a0a" roughness={0.6} metalness={0.1} />
      </mesh>

      {/* THE LANE itself (lighter, polished maple) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, -0.40 - LANE_LEN / 2]} receiveShadow>
        <planeGeometry args={[LANE_W, LANE_LEN]} />
        <meshStandardMaterial map={laneTex} roughness={0.18} metalness={0.18} />
      </mesh>

      {/* ARROWS sub-overlay on lane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.0015, -1.8]}>
        <planeGeometry args={[LANE_W * 0.85, 0.6]} />
        <meshStandardMaterial
          map={arrowTex}
          transparent
          alphaTest={0.05}
          roughness={0.4}
          opacity={0.75}
        />
      </mesh>

      {/* GUTTERS — recessed dark channels on either side */}
      {[-1, 1].map((sx) => (
        <group key={sx} position={[sx * (LANE_W / 2 + 0.08), -0.025, -0.40 - LANE_LEN / 2]}>
          {/* gutter floor */}
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.16, LANE_LEN]} />
            <meshStandardMaterial color="#0e0e18" roughness={0.4} metalness={0.3} />
          </mesh>
          {/* gutter inside lip */}
          <mesh position={[-sx * 0.080, 0.012, 0]} rotation={[0, 0, sx * Math.PI / 2]}>
            <planeGeometry args={[0.024, LANE_LEN]} />
            <meshStandardMaterial color="#1a1a28" roughness={0.5} />
          </mesh>
        </group>
      ))}

      {/* PIN DECK */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, -0.40 - LANE_LEN - 0.7]} receiveShadow>
        <planeGeometry args={[LANE_W * 1.2, 1.3]} />
        <meshStandardMaterial color="#e8d8b8" roughness={0.35} metalness={0.1} />
      </mesh>

      {/* PINS — standard 10-pin triangle */}
      <group position={[0, 0, -0.40 - LANE_LEN - 0.5]}>
        {[
          [0, 0],
          [-0.075, -0.130], [0.075, -0.130],
          [-0.150, -0.260], [0, -0.260], [0.150, -0.260],
          [-0.225, -0.390], [-0.075, -0.390], [0.075, -0.390], [0.225, -0.390],
        ].map(([x, z], i) => (
          <Pin key={i} position={[x, 0, z]} />
        ))}
      </group>
    </group>
  );
}
