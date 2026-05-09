"use client";
/**
 * BowlerCharacter3D — procedural rigged bowler avatar
 *
 * Architecture:
 *   • Head     — BufferGeometry sphere with 4 morph-target face shapes
 *                Face features (eyes/brows/nose/mouth) are separate child meshes
 *                so they can be repositioned without UV headaches.
 *   • Body     — SkinnedMesh with a 15-bone Humanoid skeleton whose bone names
 *                follow the Mixamo convention so any Mixamo .glb animation clip
 *                can be retargeted by name-matching.
 *   • Hair     — Non-skinned meshes parented to the Head bone.
 *   • Outfit   — Non-skinned meshes parented to Spine / Hips bones.
 *   • Shoes    — Parented to LeftFoot / RightFoot bones.
 *
 * Adding bowling animations:
 *   1. Download a Mixamo animation as "No skin / In place / .glb"
 *   2. Drop it in /public/animations/
 *   3. Call playClip("filename-without-ext") on the exported ref.
 */

import React, { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { AvatarState } from "./AvatarSVG";

// ─── Re-export for consumers ─────────────────────────────────────────────────
export type { AvatarState };

// ─── Color tables ─────────────────────────────────────────────────────────────
export const SKIN_TONES = [
  "#FDDBB4","#F8CDA0","#F0BC8A","#E8A87C",
  "#D4906A","#C07858","#A86040","#8C4A2C",
  "#7A3A20","#5C2810","#3E1808","#2A0E04",
];

const HAIR_HEX: Record<string,string> = {
  black:"#2A1810", brown:"#5C2E18", chestnut:"#7B3F1B",
  auburn:"#8A3B20", red:"#9F2A18", blonde:"#D4B36A",
  platinum:"#E0DCC8", silver:"#B8B8B8", white:"#EAEAE0",
  gray:"#7A7A7A", pink:"#E89AB8", blue:"#5887BF", purple:"#8A6FBF",
};
const EYE_HEX: Record<string,string> = {
  brown:"#5A3010", hazel:"#7A5828", amber:"#A87010",
  green:"#3A7444", blue:"#3878C8", sky:"#7AB4D8",
  gray:"#7A8898", violet:"#8060A0",
};
const LIP_HEX: Record<string,string> = {
  natural:"#C77860", pink:"#D8758C", red:"#C03040",
  berry:"#9B3A60", nude:"#B8806B", plum:"#7B4060",
  coral:"#E08868", deep:"#6A2030",
};
const OUTFIT_HEX: Record<string,string> = {
  "bowling-shirt":"#C03018", letterman:"#1A3A8C",
  jersey:"#186030", polo:"#284888", hoodie:"#28304A",
};
const PANTS_COLOR = "#1E2240";

// ─── Color helpers ────────────────────────────────────────────────────────────
function hx(c: string): [number,number,number] {
  const h = c.replace("#","");
  return [parseInt(h.slice(0,2),16)/255, parseInt(h.slice(2,4),16)/255, parseInt(h.slice(4,6),16)/255];
}
function threeColor(hex: string): THREE.Color { return new THREE.Color(...hx(hex)); }
function darken(hex: string, amt: number): THREE.Color {
  const [r,g,b] = hx(hex);
  return new THREE.Color(r*(1-amt), g*(1-amt), b*(1-amt));
}
function lighten(hex: string, amt: number): THREE.Color {
  const [r,g,b] = hx(hex);
  return new THREE.Color(Math.min(1,r+amt), Math.min(1,g+amt), Math.min(1,b+amt));
}

// ─── Material factory (MeshStandardMaterial) ─────────────────────────────────
function mat(color: THREE.Color | string, opts: Partial<THREE.MeshStandardMaterialParameters> = {}): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: typeof color === "string" ? threeColor(color) : color,
    roughness: 0.72,
    metalness: 0,
    ...opts,
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// HEAD GEOMETRY  — procedural sphere with 4 morph targets
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Displaces a raw sphere to look like a human head.
 * The front of the head faces +Z (toward the camera in the default scene).
 */
function displace(x: number, y: number, z: number): [number,number,number] {
  const r = Math.sqrt(x*x + y*y + z*z) || 1;
  const ny = y / r;  // normalized y (-1 bottom, +1 top)
  const nz = z / r;  // normalized z (-1 back, +1 front)

  // 1) Elongate cranium — top of head slightly taller
  const crownLift = Math.pow(Math.max(0, ny - 0.3), 1.4) * 0.10;

  // 2) Flatten face — project the front surface into a slightly flatter plane
  const facePush = Math.max(0, nz - 0.2) * Math.max(0, 1 - Math.abs(ny)*1.4) * 0.05;

  // 3) Jaw / chin taper — the lower half of the head tapers inward
  const jawTaper = Math.pow(Math.max(0, -ny - 0.05), 1.6) * 0.28;

  // 4) Slight occipital flattening — back of skull is a bit flat
  const occipital = Math.max(0, -nz - 0.5) * 0.04;

  return [
    x * (1 - jawTaper),
    y + crownLift,
    z + facePush - occipital * (z < 0 ? 1 : 0),
  ];
}

/**
 * Build morph-target position array for a given face-shape function.
 * shapeXZ: returns [scaledX, scaledZ] given [baseX, baseY, baseZ, ny]
 */
function buildMorphPositions(
  base: Float32Array,
  shapeXZ: (bx: number, by: number, bz: number, ny: number) => [number,number,number],
): Float32Array {
  const out = new Float32Array(base.length);
  for (let i = 0; i < base.length; i += 3) {
    const bx = base[i], by = base[i+1], bz = base[i+2];
    const r = Math.sqrt(bx*bx + by*by + bz*bz) || 1;
    const ny = by / r;
    const [mx, my, mz] = shapeXZ(bx, by, bz, ny);
    out[i] = mx; out[i+1] = my; out[i+2] = mz;
  }
  return out;
}

function createHeadGeometry(): THREE.BufferGeometry {
  const baseGeo = new THREE.SphereGeometry(0.44, 48, 32);
  const rawPos = baseGeo.attributes.position as THREE.BufferAttribute;

  // --- Build displaced base positions ----------------------------------
  const basePos = new Float32Array(rawPos.count * 3);
  for (let i = 0; i < rawPos.count; i++) {
    const [dx, dy, dz] = displace(rawPos.getX(i), rawPos.getY(i), rawPos.getZ(i));
    basePos[i*3] = dx; basePos[i*3+1] = dy; basePos[i*3+2] = dz;
  }
  baseGeo.attributes.position = new THREE.Float32BufferAttribute(basePos, 3);

  // --- Round face: wider at equator, slightly lower cranium -----------
  const roundPos = buildMorphPositions(basePos, (bx, by, bz, ny) => {
    const equator = 1 - Math.abs(ny) * 1.1;
    const lateral = 1 + Math.max(0, equator) * 0.13;
    return [bx * lateral, by * 0.93, bz * (1 + Math.max(0, equator) * 0.07)];
  });

  // --- Square jaw: widened jaw, flat chin shelf ----------------------
  const squarePos = buildMorphPositions(basePos, (bx, by, bz, ny) => {
    const jawRgn = Math.max(0, -ny - 0.05);
    const jawFlat = Math.pow(jawRgn, 0.7);
    return [bx * (1 + jawFlat * 0.26), by * (1 - jawFlat * 0.04), bz * (1 + jawFlat * 0.14)];
  });

  // --- Heart: wide forehead, narrow chin ----------------------------
  const heartPos = buildMorphPositions(basePos, (bx, by, bz, ny) => {
    const top  = Math.max(0, ny - 0.15);
    const chin = Math.max(0, -ny - 0.25);
    const widen  = 1 + top  * 0.18;
    const narrow = 1 - chin * 0.30;
    return [bx * (top > chin ? widen : narrow), by, bz * (top > chin ? 1 + top*0.06 : 1 - chin*0.14)];
  });

  // --- Diamond: prominent cheekbones, narrower top & chin -----------
  const diamondPos = buildMorphPositions(basePos, (bx, by, bz, ny) => {
    const cheek  = Math.max(0, 1 - Math.abs(ny) * 1.9);
    const shrink = Math.max(0, Math.abs(ny) - 0.5) * 0.30;
    return [bx * (1 + cheek * 0.22 - shrink), by, bz * (1 + cheek * 0.12 - shrink * 0.5)];
  });

  // --- Oval: even more tapered chin ---------------------------------
  const ovalPos = buildMorphPositions(basePos, (bx, by, bz, ny) => {
    const chin = Math.max(0, -ny - 0.1);
    return [bx * (1 - chin * 0.12), by * (1 + chin * 0.04), bz * (1 - chin * 0.08)];
  });

  baseGeo.morphAttributes.position = [
    new THREE.Float32BufferAttribute(ovalPos,    3), // 0: oval
    new THREE.Float32BufferAttribute(roundPos,   3), // 1: round
    new THREE.Float32BufferAttribute(squarePos,  3), // 2: square
    new THREE.Float32BufferAttribute(heartPos,   3), // 3: heart
    new THREE.Float32BufferAttribute(diamondPos, 3), // 4: diamond
  ];
  baseGeo.computeVertexNormals();
  return baseGeo;
}

/** Map face shape string → morph index */
const FACE_MORPH_IDX: Record<string, number> = {
  oval: 0, round: 1, square: 2, heart: 3, diamond: 4,
};

// ═══════════════════════════════════════════════════════════════════════════
// FACE FEATURE MESHES — eyes, brows, nose, mouth, ears
// These are positioned directly in 3D so they sit on the head surface.
// All positions are in head-local space (head centered at origin, face +Z).
// ═══════════════════════════════════════════════════════════════════════════

/** A single eye (white + iris + pupil + catchlight) as a layered group */
function buildEye(
  side: 1|-1,
  eyeColor: string,
  shape: string,
  eyelashes: boolean,
): THREE.Group {
  const group = new THREE.Group();

  // Shape parameters
  type EyeParams = { rx: number; ry: number };
  const params: Record<string, EyeParams> = {
    almond:     { rx: 0.046, ry: 0.028 },
    round:      { rx: 0.038, ry: 0.038 },
    narrow:     { rx: 0.052, ry: 0.020 },
    downturned: { rx: 0.044, ry: 0.026 },
  };
  const { rx, ry } = params[shape] ?? params.almond;

  // --- Sclera (white) ---
  const sclera = new THREE.Mesh(
    (() => {
      const g = new THREE.EllipseCurve(0, 0, rx, ry, 0, Math.PI*2).getPoints(48);
      const shape2d = new THREE.Shape(g);
      return new THREE.ShapeGeometry(shape2d);
    })(),
    new THREE.MeshStandardMaterial({ color: 0xFBF5EF, roughness: 0.15, metalness: 0.02, side: THREE.FrontSide }),
  );
  sclera.position.z = 0.001;
  group.add(sclera);

  // --- Iris ---
  const irisC = threeColor(eyeColor);
  const irisDk = darken(eyeColor, 0.38);
  const irisGeo = new THREE.CircleGeometry(Math.min(ry - 0.002, 0.022), 32);
  const irisMat = new THREE.MeshStandardMaterial({ color: irisC, roughness: 0.30, metalness: 0.04 });
  const iris = new THREE.Mesh(irisGeo, irisMat);
  iris.position.z = 0.002;

  // Iris gradient rings (limbal ring)
  const limbal = new THREE.Mesh(
    (() => {
      const outer = Math.min(ry - 0.002, 0.022);
      const inner = outer * 0.72;
      return new THREE.RingGeometry(inner, outer, 32);
    })(),
    new THREE.MeshStandardMaterial({ color: irisDk, roughness: 0.28, transparent: true, opacity: 0.72 }),
  );
  limbal.position.z = 0.0025;
  group.add(iris);
  group.add(limbal);

  // --- Pupil ---
  const pupilR = Math.min(ry - 0.002, 0.022) * 0.46;
  const pupil = new THREE.Mesh(
    new THREE.CircleGeometry(pupilR, 20),
    new THREE.MeshStandardMaterial({ color: 0x040202, roughness: 0.18 }),
  );
  pupil.position.z = 0.003;
  group.add(pupil);

  // --- Catchlights ---
  const cl1 = new THREE.Mesh(
    new THREE.CircleGeometry(0.006, 10),
    new THREE.MeshStandardMaterial({ color: 0xFFFFFF, emissive: new THREE.Color(0xFFFFFF), emissiveIntensity: 0.8, roughness: 0.04 }),
  );
  cl1.position.set(-0.006, 0.006, 0.0035);
  group.add(cl1);
  const cl2 = new THREE.Mesh(
    new THREE.CircleGeometry(0.003, 8),
    new THREE.MeshStandardMaterial({ color: 0xFFFFFF, emissive: new THREE.Color(0xFFFFFF), emissiveIntensity: 0.6, roughness: 0.05, transparent: true, opacity: 0.7 }),
  );
  cl2.position.set(0.010, -0.004, 0.0034);
  group.add(cl2);

  // --- Upper eyelid line ---
  const lidPts: THREE.Vector2[] = [];
  for (let t = 0; t <= 1; t += 1/24) {
    const angle = Math.PI + t * Math.PI;
    lidPts.push(new THREE.Vector2(Math.cos(angle) * rx, Math.sin(angle) * ry * 1.08));
  }
  const lidCurve = new THREE.SplineCurve(lidPts);
  const lidPoints = lidCurve.getPoints(48);
  const lidGeo = new THREE.BufferGeometry().setFromPoints(lidPoints);
  const lidLine = new THREE.Line(
    lidGeo,
    new THREE.LineBasicMaterial({ color: 0x140808, linewidth: 2 }),
  );
  lidLine.position.z = 0.004;
  group.add(lidLine);

  // --- Lash line mesh (thicker than a line) ---
  const lashGeo = (() => {
    const g = new THREE.Shape();
    g.moveTo(-rx, 0);
    g.quadraticCurveTo(0, -ry * 1.16, rx, 0);
    g.quadraticCurveTo(0, -ry * 0.3, -rx, 0);
    const lashShape = new THREE.ShapeGeometry(new THREE.Shape([
      ...Array.from({length: 24}, (_, i) => {
        const t = i / 23;
        const a = Math.PI + t * Math.PI;
        return new THREE.Vector2(Math.cos(a) * rx, Math.sin(a) * ry * 1.02);
      }),
      ...Array.from({length: 24}, (_, i) => {
        const t = 1 - i / 23;
        const a = Math.PI + t * Math.PI;
        return new THREE.Vector2(Math.cos(a) * rx, Math.sin(a) * ry * 1.12);
      }),
    ]));
    return lashShape;
  })();
  const lashLine = new THREE.Mesh(
    lashGeo,
    new THREE.MeshStandardMaterial({ color: 0x0C0606, roughness: 0.9 }),
  );
  lashLine.position.z = 0.0042;
  group.add(lashLine);

  // --- Optional eyelashes (individual splines) ---
  if (eyelashes) {
    const lashMat = new THREE.LineBasicMaterial({ color: 0x080404 });
    [-0.85, -0.6, -0.35, -0.1, 0.1, 0.35, 0.6, 0.85].forEach((t) => {
      const bx = Math.cos(Math.PI + (t + 1) / 2 * Math.PI) * rx;
      const by = Math.sin(Math.PI + (t + 1) / 2 * Math.PI) * ry * 1.08;
      const tipX = bx + Math.sign(t) * 0.006;
      const tipY = by - 0.014 - Math.abs(t) * 0.003;
      const pts = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(bx, by, 0.0043),
        new THREE.Vector3(tipX, tipY, 0.0046),
      ]);
      group.add(new THREE.Line(pts, lashMat));
    });
  }

  // Position the whole eye on the face
  const ey = 0.044;
  const ex = side * 0.138;
  const ez = Math.sqrt(Math.max(0, 0.44 * 0.44 - ex*ex - ey*ey)) - 0.002;
  group.position.set(ex, ey, ez);

  // Downturned variant: tilt outer corner down slightly
  if (shape === "downturned") group.rotation.z = side * -0.14;

  return group;
}

/** Eyebrow geometry (a filled bevelled capsule shape) */
function buildBrow(
  side: 1|-1,
  style: string,
  hairColor: string,
): THREE.Mesh {
  const color = threeColor(hairColor);
  const dark = darken(hairColor, 0.20);

  // Brow control points (x offsets, y offsets from center)
  type BrowPt = { x: number; y: number; thick: number };
  const browDefs: Record<string, BrowPt[]> = {
    default:  [{ x:-0.060, y: 0.006, thick:0.007 }, { x: 0,     y: 0.000, thick:0.008 }, { x: 0.060, y: 0.006, thick:0.006 }],
    thin:     [{ x:-0.060, y: 0.004, thick:0.004 }, { x: 0,     y: 0.000, thick:0.005 }, { x: 0.060, y: 0.004, thick:0.003 }],
    thick:    [{ x:-0.060, y: 0.006, thick:0.012 }, { x: 0,     y:-0.001, thick:0.013 }, { x: 0.060, y: 0.007, thick:0.010 }],
    arched:   [{ x:-0.060, y: 0.000, thick:0.007 }, { x: 0,     y:-0.014, thick:0.008 }, { x: 0.060, y: 0.000, thick:0.006 }],
    angled:   [{ x:-0.060, y: 0.010, thick:0.007 }, { x: 0,     y:-0.004, thick:0.008 }, { x: 0.060, y:-0.005, thick:0.006 }],
    straight: [{ x:-0.060, y: 0.000, thick:0.008 }, { x: 0,     y: 0.000, thick:0.008 }, { x: 0.060, y: 0.000, thick:0.007 }],
  };
  const pts = browDefs[style] ?? browDefs.default;

  // Build a tube along the brow path
  const curve = new THREE.CatmullRomCurve3(
    pts.map(p => new THREE.Vector3(side * p.x, p.y, 0)),
  );
  const avgThick = pts.reduce((a, p) => a + p.thick, 0) / pts.length;
  const geo = new THREE.TubeGeometry(curve, 24, avgThick, 8, false);
  const mesh = new THREE.Mesh(geo, mat(color, { roughness: 0.88 }));

  // Position on face above the eye
  const by = 0.118;
  const bx = side * 0.138;
  const bz = Math.sqrt(Math.max(0, 0.44 * 0.44 - bx*bx - by*by)) - 0.004;
  mesh.position.set(bx, by, bz);

  // Angle outward slightly
  mesh.rotation.y = side * -0.18;
  mesh.rotation.z = style === "angled" ? side * 0.10 : 0;

  return mesh;
}

/** Nose — a small layered bump */
function buildNose(style: string, skin: string): THREE.Group {
  const group = new THREE.Group();
  const skinDk = darken(skin, 0.16);

  const params: Record<string, { tipR: number; tipZ: number; nostrW: number; bridgeH: number }> = {
    default: { tipR: 0.040, tipZ: 0.036, nostrW: 0.036, bridgeH: 0.090 },
    small:   { tipR: 0.030, tipZ: 0.028, nostrW: 0.028, bridgeH: 0.072 },
    button:  { tipR: 0.038, tipZ: 0.042, nostrW: 0.030, bridgeH: 0.060 },
    wide:    { tipR: 0.048, tipZ: 0.036, nostrW: 0.048, bridgeH: 0.090 },
    long:    { tipR: 0.038, tipZ: 0.032, nostrW: 0.034, bridgeH: 0.120 },
  };
  const p = params[style] ?? params.default;

  // Bridge
  const bridge = new THREE.Mesh(
    new THREE.CylinderGeometry(0.014, 0.018, p.bridgeH, 12),
    mat(threeColor(skin), { roughness: 0.70 }),
  );
  bridge.position.set(0, p.bridgeH * 0.5, 0.002);
  group.add(bridge);

  // Tip
  const tip = new THREE.Mesh(
    new THREE.SphereGeometry(p.tipR, 18, 14),
    mat(skinDk, { roughness: 0.68 }),
  );
  tip.scale.set(1, 0.82, p.tipZ / p.tipR);
  group.add(tip);

  // Nostrils
  ([-1, 1] as const).forEach(s => {
    const nostril = new THREE.Mesh(
      new THREE.SphereGeometry(p.nostrW * 0.55, 12, 10),
      mat(darken(skin, 0.32), { roughness: 0.72 }),
    );
    nostril.scale.set(0.82, 0.72, 0.66);
    nostril.position.set(s * p.nostrW, -p.tipR * 0.42, 0.008);
    group.add(nostril);

    // Nostril opening (darker)
    const opening = new THREE.Mesh(
      new THREE.SphereGeometry(p.nostrW * 0.34, 8, 8),
      mat(darken(skin, 0.54), { roughness: 0.82 }),
    );
    opening.scale.set(0.6, 0.5, 0.5);
    opening.position.set(s * (p.nostrW * 0.72), -p.tipR * 0.48, 0.012);
    group.add(opening);
  });

  // Position the nose on the face
  group.position.set(0, -0.008, 0.420);
  return group;
}

/** Mouth / lips — upper + lower lip shapes */
function buildMouth(
  shape: string,
  lipColor: string,
  gender: string,
): THREE.Group {
  const group = new THREE.Group();
  const lipC   = threeColor(lipColor);
  const lipDk  = darken(lipColor, 0.18);
  const lipLt  = lighten(lipColor, 0.14);

  // Mouth width + lip thickness per shape
  const params: Record<string, { w: number; upperH: number; lowerH: number; smileCurve: number }> = {
    default:  { w: 0.082, upperH: 0.022, lowerH: 0.024, smileCurve: 0.006 },
    smile:    { w: 0.100, upperH: 0.022, lowerH: 0.024, smileCurve: 0.016 },
    neutral:  { w: 0.074, upperH: 0.018, lowerH: 0.020, smileCurve: 0.000 },
    small:    { w: 0.060, upperH: 0.020, lowerH: 0.022, smileCurve: 0.008 },
    full:     { w: 0.096, upperH: 0.030, lowerH: 0.034, smileCurve: 0.010 },
  };
  const pm = params[shape] ?? params.default;

  // Upper lip (two lobes = cupid's bow)
  [-1, 1].forEach(s => {
    const lobe = new THREE.Mesh(
      (() => {
        const g = new THREE.SphereGeometry(pm.upperH * 1.2, 14, 10);
        const p = g.attributes.position as THREE.BufferAttribute;
        for (let i = 0; i < p.count; i++) {
          p.setX(i, p.getX(i) * 1.6);
          p.setZ(i, p.getZ(i) * 0.55);
        }
        g.computeVertexNormals();
        return g;
      })(),
      mat(lipC, { roughness: 0.60 }),
    );
    lobe.position.set(s * pm.w * 0.38, pm.smileCurve * 0.5 + pm.upperH * 0.15, 0);
    group.add(lobe);
  });

  // Cupid's bow center dip
  const bow = new THREE.Mesh(
    new THREE.SphereGeometry(pm.upperH * 0.65, 10, 8),
    mat(lipDk, { roughness: 0.60 }),
  );
  bow.scale.set(0.8, 0.6, 0.5);
  bow.position.set(0, pm.smileCurve * 0.5 + pm.upperH * 0.25, 0);
  group.add(bow);

  // Lower lip
  const lower = new THREE.Mesh(
    (() => {
      const g = new THREE.SphereGeometry(pm.lowerH * 1.1, 18, 12);
      const p = g.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < p.count; i++) {
        p.setX(i, p.getX(i) * 2.3);
        p.setZ(i, p.getZ(i) * 0.65);
        p.setY(i, p.getY(i) - pm.smileCurve);
      }
      g.computeVertexNormals();
      return g;
    })(),
    mat(lipLt, { roughness: 0.58 }),
  );
  lower.position.set(0, -(pm.upperH + pm.lowerH) * 0.7, 0);
  group.add(lower);

  // Lower lip highlight (specular-ish)
  const highlight = new THREE.Mesh(
    new THREE.SphereGeometry(pm.lowerH * 0.45, 10, 8),
    mat(lighten(lipColor, 0.28), { roughness: 0.35, metalness: 0.02 }),
  );
  highlight.scale.set(2.0, 0.7, 0.5);
  highlight.position.set(0, -(pm.upperH + pm.lowerH) * 0.75, pm.lowerH * 0.6);
  group.add(highlight);

  // Corner shadows
  [-1, 1].forEach(s => {
    const corner = new THREE.Mesh(
      new THREE.SphereGeometry(0.008, 8, 6),
      mat(darken(lipColor, 0.32), { roughness: 0.72, transparent: true, opacity: 0.7 }),
    );
    corner.position.set(s * pm.w * 0.95, 0, -0.004);
    group.add(corner);
  });

  // Mouth line
  const linePts = [-pm.w * 0.9, -pm.w * 0.45, 0, pm.w * 0.45, pm.w * 0.9].map(x =>
    new THREE.Vector3(x, 0, 0.002),
  );
  const lineGeo = new THREE.BufferGeometry().setFromPoints(linePts);
  group.add(new THREE.Line(lineGeo, new THREE.LineBasicMaterial({ color: darken(lipColor, 0.30) })));

  group.position.set(0, -0.130, 0.406);
  return group;
}

/** Ear geometry (inner + outer) */
function buildEar(
  side: 1|-1,
  skin: string,
  size: string,
  earrings: boolean,
): THREE.Group {
  const group = new THREE.Group();
  const s = threeColor(skin);
  const sd = darken(skin, 0.18);
  const scale = size === "small" ? 0.78 : size === "large" ? 1.22 : 1.0;

  // Outer ear shell
  const outer = new THREE.Mesh(
    (() => {
      const g = new THREE.SphereGeometry(0.058, 16, 14);
      const p = g.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < p.count; i++) {
        const nx = p.getX(i) / 0.058;
        p.setX(i, p.getX(i) * 0.48);
        p.setY(i, p.getY(i) * 1.28);
        p.setZ(i, p.getZ(i) * 0.38 + (nx > 0 ? 0.005 : -0.005));
      }
      g.computeVertexNormals();
      return g;
    })(),
    mat(s, { roughness: 0.66 }),
  );
  group.add(outer);

  // Concha (inner bowl, darker)
  const concha = new THREE.Mesh(
    new THREE.SphereGeometry(0.036, 12, 10),
    mat(sd, { roughness: 0.70 }),
  );
  concha.scale.set(0.5, 0.76, 0.28);
  concha.position.set(0, 0, 0.008);
  group.add(concha);

  // Lobule (ear lobe)
  const lobe = new THREE.Mesh(
    new THREE.SphereGeometry(0.028, 10, 8),
    mat(s, { roughness: 0.66 }),
  );
  lobe.scale.set(0.7, 0.88, 0.52);
  lobe.position.set(0, -0.062, 0.002);
  group.add(lobe);

  // Earring
  if (earrings) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.014, 0.004, 8, 24),
      mat(threeColor("#E8B420"), { roughness: 0.14, metalness: 0.88, emissive: threeColor("#E8B420"), emissiveIntensity: 0.12 }),
    );
    ring.position.set(0, -0.082, 0.004);
    group.add(ring);
    const gem = new THREE.Mesh(
      new THREE.SphereGeometry(0.006, 8, 8),
      mat(threeColor("#60C0FF"), { roughness: 0.08, metalness: 0.22, emissive: threeColor("#60C0FF"), emissiveIntensity: 0.28 }),
    );
    gem.position.set(0, -0.098, 0.004);
    group.add(gem);
  }

  group.scale.setScalar(scale);

  // Position ear on the side of the head
  const ey = 0.020;
  const ex = side * 0.438;
  group.position.set(ex, ey, 0.030);
  group.rotation.y = side * (-Math.PI * 0.46);
  return group;
}

/** Freckle dots */
function buildFreckles(density: string, skin: string): THREE.Group {
  const group = new THREE.Group();
  if (density === "none") return group;

  const color = darken(skin, 0.42);
  const dotData: [number, number][] = density === "heavy" ? [
    [-0.10, 0.02], [-0.08, 0.03], [-0.06, 0.03], [-0.12, 0.00], [-0.09, 0.00],
    [-0.04, 0.04], [-0.02, 0.05], [ 0.00, 0.05], [ 0.02, 0.05], [ 0.04, 0.04],
    [ 0.10, 0.02], [ 0.08, 0.03], [ 0.06, 0.03], [ 0.12, 0.00], [ 0.09, 0.00],
    [-0.06, 0.00], [ 0.06, 0.00], [-0.04, 0.01], [ 0.04, 0.01],
  ] : [
    [-0.08, 0.02], [-0.06, 0.03], [-0.02, 0.04], [ 0.02, 0.04], [ 0.06, 0.03], [ 0.08, 0.02],
  ];

  const r = 0.44;
  dotData.forEach(([fx, fy], i) => {
    const fz = Math.sqrt(Math.max(0, r*r - fx*fx - (fy + 0.02)*(fy + 0.02))) - 0.002;
    const dot = new THREE.Mesh(
      new THREE.SphereGeometry(0.005 + (i % 3) * 0.0015, 6, 5),
      mat(color, { roughness: 0.88, transparent: true, opacity: 0.72 }),
    );
    dot.position.set(fx, fy + 0.01, fz);
    group.add(dot);
  });
  return group;
}

/** Aging marks (nasolabial folds, forehead lines) */
function buildAgingMarks(age: string, skin: string): THREE.Group {
  const group = new THREE.Group();
  if (age === "young") return group;
  const color = darken(skin, 0.22);
  const lineMat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: age === "mature" ? 0.55 : 0.30 });

  // Nasolabial folds (smile lines)
  ([-1, 1] as const).forEach(s => {
    const pts = [
      new THREE.Vector3(s * 0.065, -0.005, 0.420),
      new THREE.Vector3(s * 0.078, -0.060, 0.404),
      new THREE.Vector3(s * 0.072, -0.130, 0.395),
    ];
    group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), lineMat));
  });

  if (age === "mature") {
    // Forehead horizontal lines
    [0.180, 0.160, 0.142].forEach((y, i) => {
      const pts = [
        new THREE.Vector3(-0.14, y, 0.405),
        new THREE.Vector3( 0.14, y, 0.405),
      ];
      const m = lineMat.clone();
      m.opacity = 0.28 - i * 0.06;
      group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), m));
    });
    // Crow's feet
    ([-1, 1] as const).forEach(s => {
      [[0.06,0], [0.06, 0.02], [0.06, -0.02]].forEach(([dz, dy]) => {
        const x = s * 0.190;
        const pts = [new THREE.Vector3(x, 0.044 + dy, 0.378), new THREE.Vector3(x + s * dz, 0.044 + dy, 0.360)];
        const m = lineMat.clone(); m.opacity = 0.32;
        group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), m));
      });
    });
  }
  return group;
}

// ═══════════════════════════════════════════════════════════════════════════
// HAIR MESHES — per style, designed for head-local space
// ═══════════════════════════════════════════════════════════════════════════

function buildHair(style: string, color: string): THREE.Group {
  const group = new THREE.Group();
  if (style === "bald") return group;

  const c = threeColor(color);
  const cDk = darken(color, 0.22);
  const cLt = lighten(color, 0.10);
  const roughness = 0.88;

  const addMesh = (geo: THREE.BufferGeometry, col: THREE.Color, rough = roughness) => {
    group.add(new THREE.Mesh(geo, mat(col, { roughness: rough })));
  };

  switch (style) {
    case "buzz": {
      // Thin cap just above head surface
      const g = new THREE.SphereGeometry(0.455, 32, 24, 0, Math.PI * 2, 0, Math.PI * 0.55);
      addMesh(g, c);
      // Dot texture via small bumps
      for (let i = 0; i < 80; i++) {
        const phi = Math.random() * Math.PI * 0.5;
        const theta = Math.random() * Math.PI * 2;
        const bumpGeo = new THREE.SphereGeometry(0.003, 4, 4);
        const bump = new THREE.Mesh(bumpGeo, mat(cDk, { roughness: 0.9 }));
        bump.position.set(
          Math.sin(phi) * Math.cos(theta) * 0.458,
          Math.cos(phi) * 0.458 + 0.04,
          Math.sin(phi) * Math.sin(theta) * 0.458,
        );
        group.add(bump);
      }
      break;
    }

    case "short": {
      // Main cap
      addMesh(new THREE.SphereGeometry(0.460, 32, 24, 0, Math.PI*2, 0, Math.PI*0.52), c);
      // Side volumes
      ([-1, 1] as const).forEach(s => {
        const g = new THREE.SphereGeometry(0.14, 14, 12);
        const m = new THREE.Mesh(g, mat(c, { roughness }));
        m.scale.set(0.55, 0.72, 0.52);
        m.position.set(s * 0.38, 0.06, -0.04);
        group.add(m);
      });
      // Front fringe bumps
      [[0, 0.42, 0.26], [0.12, 0.40, 0.24], [-0.12, 0.40, 0.24]].forEach(([x,y,z], i) => {
        const g = new THREE.SphereGeometry(i === 0 ? 0.09 : 0.07, 10, 8);
        const m = new THREE.Mesh(g, mat(i === 0 ? cLt : c, { roughness }));
        m.position.set(x, y - 0.44, z - 0.02);
        group.add(m);
      });
      break;
    }

    case "pompadour": {
      // Base cap
      addMesh(new THREE.SphereGeometry(0.462, 32, 22, 0, Math.PI*2, 0, Math.PI*0.56), c);
      // Tall pompadour volume
      const pomp = new THREE.Mesh(
        new THREE.SphereGeometry(0.28, 22, 16),
        mat(c, { roughness }),
      );
      pomp.scale.set(0.92, 1.08, 0.78);
      pomp.position.set(0, 0.44 + 0.10, 0.08);
      group.add(pomp);
      // Highlight
      const hl = new THREE.Mesh(
        new THREE.SphereGeometry(0.18, 14, 12),
        mat(cLt, { roughness: 0.82 }),
      );
      hl.scale.set(0.70, 1.02, 0.54);
      hl.position.set(0, 0.44 + 0.22, 0.05);
      group.add(hl);
      // Swept strands
      ([-0.12, 0, 0.12] as number[]).forEach((x, i) => {
        const strand = new THREE.Mesh(
          new THREE.CylinderGeometry(0.034, 0.024, 0.18, 8),
          mat(i === 1 ? cLt : cDk, { roughness }),
        );
        strand.rotation.x = 0.14;
        strand.position.set(x, 0.44 + 0.14, 0.22);
        group.add(strand);
      });
      // Sideburns
      ([-1, 1] as const).forEach(s => {
        const sb = new THREE.Mesh(
          new THREE.CylinderGeometry(0.025, 0.018, 0.10, 8),
          mat(c, { roughness }),
        );
        sb.position.set(s * 0.44, -0.30, 0.05);
        group.add(sb);
      });
      break;
    }

    case "bob": {
      // Top cap
      addMesh(new THREE.SphereGeometry(0.456, 32, 22, 0, Math.PI*2, 0, Math.PI*0.58), c);
      // Full bob curtains (chin-length)
      ([-1, 1] as const).forEach(s => {
        const g = new THREE.CylinderGeometry(0.20, 0.22, 0.44, 14);
        const m = new THREE.Mesh(g, mat(c, { roughness }));
        m.scale.set(0.65, 1, 0.62);
        m.position.set(s * 0.36, -0.16, 0.00);
        group.add(m);

        const bottom = new THREE.Mesh(
          new THREE.SphereGeometry(0.21, 14, 10),
          mat(cDk, { roughness }),
        );
        bottom.scale.set(0.64, 0.56, 0.60);
        bottom.position.set(s * 0.36, -0.36, 0.02);
        group.add(bottom);
      });
      // Back curtain
      const back = new THREE.Mesh(
        new THREE.SphereGeometry(0.40, 20, 14),
        mat(c, { roughness }),
      );
      back.scale.set(1.06, 0.82, 0.50);
      back.position.set(0, -0.20, -0.32);
      group.add(back);
      // Bangs
      const bangs = new THREE.Mesh(
        new THREE.SphereGeometry(0.30, 20, 12, 0, Math.PI*2, 0, Math.PI*0.38),
        mat(cDk, { roughness }),
      );
      bangs.scale.set(1.05, 0.50, 0.60);
      bangs.position.set(0, 0.26, 0.38);
      group.add(bangs);
      break;
    }

    case "long": {
      // Top cap
      addMesh(new THREE.SphereGeometry(0.460, 32, 22, 0, Math.PI*2, 0, Math.PI*0.58), c);
      // Long side curtains flowing past shoulders
      ([-1, 1] as const).forEach(s => {
        const g = new THREE.CylinderGeometry(0.16, 0.14, 1.10, 12);
        const m = new THREE.Mesh(g, mat(c, { roughness }));
        m.scale.set(0.62, 1, 0.60);
        m.rotation.z = s * 0.07;
        m.position.set(s * 0.36, -0.58, -0.04);
        group.add(m);

        const lower = new THREE.Mesh(
          new THREE.CylinderGeometry(0.13, 0.10, 0.64, 10),
          mat(cDk, { roughness }),
        );
        lower.scale.set(0.58, 1, 0.56);
        lower.rotation.z = s * 0.08;
        lower.position.set(s * 0.35, -1.14, -0.06);
        group.add(lower);
      });
      // Back wave
      const back = new THREE.Mesh(
        new THREE.CylinderGeometry(0.24, 0.20, 0.68, 14),
        mat(c, { roughness }),
      );
      back.scale.set(1.02, 1, 0.50);
      back.position.set(0, -0.34, -0.30);
      group.add(back);
      const backLower = new THREE.Mesh(
        new THREE.CylinderGeometry(0.22, 0.16, 0.56, 12),
        mat(cDk, { roughness }),
      );
      backLower.scale.set(0.90, 1, 0.48);
      backLower.position.set(0, -0.86, -0.28);
      group.add(backLower);
      // Fringe
      const fringe = new THREE.Mesh(
        new THREE.SphereGeometry(0.32, 20, 12, 0, Math.PI*2, 0, Math.PI*0.38),
        mat(cDk, { roughness }),
      );
      fringe.scale.set(1.02, 0.50, 0.58);
      fringe.position.set(0, 0.26, 0.40);
      group.add(fringe);
      break;
    }

    case "curly": {
      // Halo of curl spheres
      const positions: [number,number,number,number,number][] = [
        // [x, y, z, r, colorMix] — colorMix 0=cDk, 0.5=c, 1=cLt
        [0, 0.52, 0.12, 0.12, 0.8],
        [0.20, 0.48, 0.08, 0.10, 0.5],
        [-0.20, 0.48, 0.08, 0.10, 0.5],
        [0.34, 0.34, 0.02, 0.10, 0.3],
        [-0.34, 0.34, 0.02, 0.10, 0.3],
        [0.42, 0.18, -0.04, 0.10, 0.3],
        [-0.42, 0.18, -0.04, 0.10, 0.3],
        [0.40, -0.04, -0.08, 0.09, 0.2],
        [-0.40, -0.04, -0.08, 0.09, 0.2],
        [0.30, 0.40, -0.20, 0.10, 0.3],
        [-0.30, 0.40, -0.20, 0.10, 0.3],
        [0, 0.30, -0.38, 0.11, 0.4],
        [0.16, 0.44, 0.06, 0.09, 0.6],
        [-0.16, 0.44, 0.06, 0.09, 0.6],
        [0.26, 0.50, -0.12, 0.09, 0.5],
        [-0.26, 0.50, -0.12, 0.09, 0.5],
      ];
      positions.forEach(([x, y, z, r, t]) => {
        const col = t > 0.7 ? cLt : t > 0.4 ? c : cDk;
        const m = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 10), mat(col, { roughness }));
        m.position.set(x, y - 0.44 + 0.44, z);
        group.add(m);
      });
      // Base cap to fill gaps
      addMesh(new THREE.SphereGeometry(0.448, 28, 20, 0, Math.PI*2, 0, Math.PI*0.60), c);
      // Fringe curls
      [[0.16, 0.32, 0.36], [-0.16, 0.32, 0.36], [0.05, 0.34, 0.38]].forEach(([x,y,z], i) => {
        const m = new THREE.Mesh(new THREE.SphereGeometry(0.058, 10, 8), mat(i === 2 ? cLt : c, { roughness }));
        m.position.set(x, y - 0.44, z);
        group.add(m);
      });
      break;
    }

    case "bun": {
      // Slick base
      addMesh(new THREE.SphereGeometry(0.458, 32, 22, 0, Math.PI*2, 0, Math.PI*0.57), c);
      // Bun ball
      const bun = new THREE.Mesh(
        new THREE.SphereGeometry(0.22, 20, 16),
        mat(c, { roughness }),
      );
      bun.scale.set(1.02, 0.86, 0.84);
      bun.position.set(0, 0.44 + 0.06, -0.36);
      group.add(bun);
      // Bun shadow
      const bunShadow = new THREE.Mesh(
        new THREE.SphereGeometry(0.18, 16, 12),
        mat(cDk, { roughness }),
      );
      bunShadow.scale.set(1.0, 0.68, 0.74);
      bunShadow.position.set(0, 0.44 + 0.02, -0.34);
      group.add(bunShadow);
      // Hair tie (torus)
      const tie = new THREE.Mesh(
        new THREE.TorusGeometry(0.16, 0.022, 8, 24),
        mat(cDk, { roughness: 0.72 }),
      );
      tie.rotation.x = Math.PI / 2;
      tie.position.set(0, 0.44 + 0.06, -0.22);
      group.add(tie);
      // Center part line
      const partLine = new THREE.Mesh(
        new THREE.CylinderGeometry(0.008, 0.008, 0.50, 6),
        mat(darken(color, 0.38), { roughness: 0.8 }),
      );
      partLine.position.set(0, 0.44 + 0.06, 0.22);
      partLine.rotation.x = Math.PI / 2;
      group.add(partLine);
      break;
    }

    default:
      // Fallback: short style
      addMesh(new THREE.SphereGeometry(0.458, 28, 20, 0, Math.PI*2, 0, Math.PI*0.54), c);
  }

  return group;
}

// ═══════════════════════════════════════════════════════════════════════════
// FACIAL HAIR MESHES
// ═══════════════════════════════════════════════════════════════════════════

function buildFacialHair(style: string, color: string): THREE.Group {
  const group = new THREE.Group();
  if (style === "none") return group;

  const c = threeColor(color);
  const cDk = darken(color, 0.22);

  switch (style) {
    case "stubble": {
      // Dense dot pattern on jaw/chin
      const positions: [number,number,number][] = [];
      for (let i = 0; i < 120; i++) {
        const angle = (i / 120) * Math.PI * 1.6 - Math.PI * 0.8;
        const height = -0.06 - (i % 8) * 0.014;
        const r = 0.42 + (i % 3) * 0.004;
        positions.push([
          Math.sin(angle) * r,
          height,
          Math.cos(angle) * r * 0.92,
        ]);
      }
      // Mustache dots
      for (let i = 0; i < 40; i++) {
        const x = -0.062 + i * 0.0031;
        positions.push([x, -0.008, 0.430 + (i % 4) * 0.002]);
      }
      positions.forEach(([x, y, z]) => {
        const dot = new THREE.Mesh(
          new THREE.SphereGeometry(0.0038 + Math.random() * 0.0018, 4, 4),
          mat(c, { roughness: 0.95, transparent: true, opacity: 0.55 }),
        );
        dot.position.set(x, y, z);
        group.add(dot);
      });
      break;
    }

    case "mustache": {
      ([-1, 1] as const).forEach(s => {
        const half = new THREE.Mesh(
          (() => {
            const g = new THREE.SphereGeometry(0.038, 12, 8);
            const p = g.attributes.position as THREE.BufferAttribute;
            for (let i = 0; i < p.count; i++) {
              p.setX(i, p.getX(i) * 2.0);
              p.setZ(i, p.getZ(i) * 0.62);
            }
            g.computeVertexNormals();
            return g;
          })(),
          mat(c, { roughness: 0.88 }),
        );
        half.position.set(s * 0.058, -0.016, 0.418);
        half.rotation.z = s * -0.22;
        group.add(half);
        // Curl tip
        const tip = new THREE.Mesh(
          new THREE.SphereGeometry(0.018, 8, 6),
          mat(cDk, { roughness: 0.90 }),
        );
        tip.position.set(s * 0.108, -0.030, 0.408);
        group.add(tip);
      });
      break;
    }

    case "beard-short": { // Goatee
      // Mustache
      ([-1, 1] as const).forEach(s => {
        const half = new THREE.Mesh(
          (() => {
            const g = new THREE.SphereGeometry(0.034, 10, 8);
            const p = g.attributes.position as THREE.BufferAttribute;
            for (let i = 0; i < p.count; i++) {
              p.setX(i, p.getX(i) * 1.8); p.setZ(i, p.getZ(i) * 0.60);
            }
            g.computeVertexNormals();
            return g;
          })(),
          mat(c, { roughness: 0.88 }),
        );
        half.position.set(s * 0.048, -0.016, 0.420);
        group.add(half);
      });
      // Chin patch
      const chin = new THREE.Mesh(
        (() => {
          const g = new THREE.SphereGeometry(0.050, 14, 10);
          const p = g.attributes.position as THREE.BufferAttribute;
          for (let i = 0; i < p.count; i++) {
            p.setX(i, p.getX(i) * 0.90);
            p.setY(i, p.getY(i) * 1.50);
            p.setZ(i, p.getZ(i) * 0.58);
          }
          g.computeVertexNormals();
          return g;
        })(),
        mat(c, { roughness: 0.88 }),
      );
      chin.position.set(0, -0.130, 0.408);
      group.add(chin);
      // Shadow
      const shadow = new THREE.Mesh(
        new THREE.SphereGeometry(0.032, 10, 8),
        mat(cDk, { roughness: 0.90 }),
      );
      shadow.scale.set(1.4, 0.60, 0.55);
      shadow.position.set(0, -0.120, 0.414);
      group.add(shadow);
      break;
    }

    case "beard-full": {
      // Jaw wrap
      const jawGeo = new THREE.SphereGeometry(0.46, 24, 18, 0, Math.PI * 2, Math.PI * 0.44, Math.PI * 0.38);
      const jaw = new THREE.Mesh(jawGeo, mat(c, { roughness: 0.88 }));
      group.add(jaw);
      // Chin bulk
      const chinBulk = new THREE.Mesh(
        (() => {
          const g = new THREE.SphereGeometry(0.12, 18, 14);
          const p = g.attributes.position as THREE.BufferAttribute;
          for (let i = 0; i < p.count; i++) {
            p.setX(i, p.getX(i) * 1.80);
            p.setY(i, p.getY(i) * 1.40);
            p.setZ(i, p.getZ(i) * 0.65);
          }
          g.computeVertexNormals();
          return g;
        })(),
        mat(c, { roughness: 0.88 }),
      );
      chinBulk.position.set(0, -0.145, 0.405);
      group.add(chinBulk);
      // Mustache
      const mst = new THREE.Mesh(
        (() => {
          const g = new THREE.SphereGeometry(0.06, 14, 10);
          const p = g.attributes.position as THREE.BufferAttribute;
          for (let i = 0; i < p.count; i++) {
            p.setX(i, p.getX(i) * 2.20); p.setZ(i, p.getZ(i) * 0.58);
          }
          g.computeVertexNormals();
          return g;
        })(),
        mat(c, { roughness: 0.88 }),
      );
      mst.position.set(0, -0.018, 0.418);
      group.add(mst);
      // Shadow stripe
      const stripe = new THREE.Mesh(
        new THREE.SphereGeometry(0.10, 16, 12),
        mat(cDk, { roughness: 0.90 }),
      );
      stripe.scale.set(2.0, 0.35, 0.58);
      stripe.position.set(0, -0.105, 0.412);
      group.add(stripe);
      // Texture hair strokes
      ([-0.10, 0, 0.10] as number[]).forEach(x => {
        const pts = [
          new THREE.Vector3(x, -0.05, 0.415),
          new THREE.Vector3(x + x * 0.3, -0.18, 0.395),
        ];
        group.add(new THREE.Line(
          new THREE.BufferGeometry().setFromPoints(pts),
          new THREE.LineBasicMaterial({ color: cDk, transparent: true, opacity: 0.45 }),
        ));
      });
      break;
    }

    default: break;
  }
  return group;
}

// ═══════════════════════════════════════════════════════════════════════════
// EYEWEAR MESHES
// ═══════════════════════════════════════════════════════════════════════════

function buildEyewear(kind: string): THREE.Group {
  const group = new THREE.Group();
  if (kind === "none" || !kind) return group;

  const isShades = kind === "sunglasses";
  const frameCol = threeColor(isShades ? "#0A0A12" : "#28201E");
  const lensCol  = isShades ? new THREE.Color(0.02, 0.02, 0.05) : new THREE.Color(0.70, 0.82, 0.98);

  // Lens frames (ellipse torus)
  ([-1, 1] as const).forEach(s => {
    const ex = s * 0.138;
    const ey = 0.044;
    const ez = Math.sqrt(Math.max(0, 0.44*0.44 - ex*ex - ey*ey)) + 0.048;

    const frame = new THREE.Mesh(
      new THREE.TorusGeometry(0.058, 0.0085, 10, 36),
      mat(frameCol, { roughness: 0.24, metalness: 0.68 }),
    );
    frame.scale.set(1.0, 0.74, 0.22);
    frame.position.set(ex, ey, ez);
    group.add(frame);

    const lens = new THREE.Mesh(
      new THREE.CircleGeometry(0.054, 32),
      new THREE.MeshStandardMaterial({
        color: lensCol,
        transparent: true,
        opacity: isShades ? 0.94 : 0.30,
        roughness: 0.04,
        metalness: 0.08,
        side: THREE.FrontSide,
      }),
    );
    lens.scale.set(1.0, 0.74, 1.0);
    lens.position.set(ex, ey, ez + 0.001);
    group.add(lens);

    // Lens glare
    const glare = new THREE.Mesh(
      new THREE.CircleGeometry(0.018, 12),
      new THREE.MeshStandardMaterial({ color: 0xFFFFFF, transparent: true, opacity: isShades ? 0.18 : 0.50, roughness: 0.02 }),
    );
    glare.scale.set(1.0, 0.74, 1.0);
    glare.position.set(ex - 0.014, ey + 0.010, ez + 0.003);
    group.add(glare);
  });

  // Bridge
  const bridge = new THREE.Mesh(
    new THREE.CylinderGeometry(0.006, 0.006, 0.060, 8),
    mat(frameCol, { roughness: 0.24, metalness: 0.68 }),
  );
  bridge.rotation.z = Math.PI / 2;
  bridge.position.set(0, 0.044, Math.sqrt(Math.max(0, 0.44*0.44 - 0.138*0.138 - 0.044*0.044)) + 0.048);
  group.add(bridge);

  // Nose pads
  ([-1, 1] as const).forEach(s => {
    const pad = new THREE.Mesh(
      new THREE.SphereGeometry(0.005, 6, 5),
      mat(frameCol, { roughness: 0.30, metalness: 0.50 }),
    );
    pad.position.set(s * 0.022, 0.026, 0.422);
    group.add(pad);
  });

  // Temples (arms going to ears)
  ([-1, 1] as const).forEach(s => {
    const temple = new THREE.Mesh(
      new THREE.CylinderGeometry(0.006, 0.005, 0.12, 8),
      mat(frameCol, { roughness: 0.24, metalness: 0.68 }),
    );
    temple.rotation.z = s * Math.PI / 2 * 0.8;
    temple.rotation.y = s * -0.28;
    temple.position.set(s * 0.22, 0.044, 0.345);
    group.add(temple);
  });

  return group;
}

// ═══════════════════════════════════════════════════════════════════════════
// HEADWEAR
// ═══════════════════════════════════════════════════════════════════════════

function buildHeadwear(kind: string, hairColor: string): THREE.Group {
  const group = new THREE.Group();
  if (kind === "none" || !kind) return group;

  if (kind === "hat") {
    const capC = threeColor("#C03018");
    const capDk = darken("#C03018", 0.22);
    const white = threeColor("#FFFFFF");

    // Crown
    const crown = new THREE.Mesh(
      (() => {
        const g = new THREE.SphereGeometry(0.44, 28, 20, 0, Math.PI*2, 0, Math.PI*0.56);
        const p = g.attributes.position as THREE.BufferAttribute;
        for (let i = 0; i < p.count; i++) {
          p.setY(i, p.getY(i) * 1.18); // squash vertically (cap shape)
        }
        g.computeVertexNormals();
        return g;
      })(),
      mat(capC, { roughness: 0.78 }),
    );
    crown.position.y = 0.06;
    group.add(crown);

    // Brim
    const brim = new THREE.Mesh(
      (() => {
        const shape = new THREE.Shape();
        shape.absarc(0, 0, 0.56, 0, Math.PI * 2, false);
        const hole = new THREE.Path();
        hole.absarc(0, 0, 0.40, 0, Math.PI * 2, true);
        shape.holes.push(hole);
        return new THREE.ShapeGeometry(shape, 48);
      })(),
      mat(capDk, { roughness: 0.82, side: THREE.DoubleSide }),
    );
    brim.rotation.x = -Math.PI / 2;
    brim.position.set(0, 0.02, 0.08);
    group.add(brim);

    // Brim underside
    const brimUnder = new THREE.Mesh(
      new THREE.CylinderGeometry(0.56, 0.58, 0.016, 32),
      mat(darken("#C03018", 0.32), { roughness: 0.88 }),
    );
    brimUnder.position.set(0, 0.02, 0.08);
    group.add(brimUnder);

    // Sweatband seam
    const sweat = new THREE.Mesh(
      new THREE.TorusGeometry(0.41, 0.012, 8, 32),
      mat(darken("#C03018", 0.38), { roughness: 0.62 }),
    );
    sweat.position.y = 0.02;
    sweat.rotation.x = -Math.PI / 2;
    group.add(sweat);

    // Panel seams (6 panels)
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const seam = new THREE.Mesh(
        new THREE.CylinderGeometry(0.004, 0.004, 0.34, 4),
        mat(capDk, { roughness: 0.80 }),
      );
      seam.position.set(Math.sin(angle) * 0.22, 0.22, Math.cos(angle) * 0.22);
      seam.rotation.z = -angle + Math.PI / 2;
      group.add(seam);
    }

    // Top button
    const btn = new THREE.Mesh(
      new THREE.CylinderGeometry(0.018, 0.018, 0.010, 10),
      mat(capDk, { roughness: 0.60 }),
    );
    btn.position.y = 0.46;
    group.add(btn);

    // "D" logo badge (canvas texture)
    const canvas = document.createElement ? (() => {
      try {
        const c = document.createElement("canvas");
        c.width = 64; c.height = 64;
        const ctx = c.getContext("2d");
        if (ctx) {
          ctx.fillStyle = "#FFFFFF";
          ctx.font = "bold 52px Impact, sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("D", 32, 34);
        }
        return c;
      } catch { return null; }
    })() : null;
    const logoTex = canvas ? new THREE.CanvasTexture(canvas) : null;
    const logo = new THREE.Mesh(
      new THREE.PlaneGeometry(0.12, 0.10),
      new THREE.MeshStandardMaterial({
        map: logoTex ?? undefined,
        color: logoTex ? 0xFFFFFF : 0xFFFFFF,
        transparent: true,
        opacity: logoTex ? 0.90 : 0,
        roughness: 0.40,
      }),
    );
    logo.position.set(0, 0.12, 0.445);
    group.add(logo);

    group.position.y = 0.36;
    return group;
  }

  if (kind === "headband") {
    const hbC = threeColor("#E46A2E");
    const hbDk = darken("#E46A2E", 0.18);

    // Torus arc headband
    const band = new THREE.Mesh(
      new THREE.TorusGeometry(0.455, 0.030, 12, 64, Math.PI * 1.72),
      mat(hbC, { roughness: 0.55 }),
    );
    band.rotation.x = Math.PI * 0.06;
    band.position.set(0, 0.02, 0);
    group.add(band);

    // Back fastener
    const fastener = new THREE.Mesh(
      new THREE.SphereGeometry(0.036, 10, 8),
      mat(hbDk, { roughness: 0.62 }),
    );
    fastener.position.set(0, 0.02, -0.46);
    group.add(fastener);

    // Highlight stripe
    const stripe = new THREE.Mesh(
      new THREE.TorusGeometry(0.460, 0.008, 6, 48, Math.PI * 1.66),
      mat(lighten("#E46A2E", 0.28), { roughness: 0.45 }),
    );
    stripe.rotation.x = Math.PI * 0.06;
    stripe.position.set(0, 0.035, 0);
    group.add(stripe);

    group.position.y = 0.21;
    return group;
  }

  return group;
}

// ═══════════════════════════════════════════════════════════════════════════
// BOWLING BALL
// ═══════════════════════════════════════════════════════════════════════════

function buildBowlingBall(): THREE.Group {
  const group = new THREE.Group();

  const ball = new THREE.Mesh(
    new THREE.SphereGeometry(0.155, 32, 28),
    mat(threeColor("#0D1F14"), { roughness: 0.10, metalness: 0.18, emissive: threeColor("#071409"), emissiveIntensity: 0.06 }),
  );
  ball.castShadow = true;
  group.add(ball);

  // Finger holes
  ([[0, 0.085, 0.126], [0.052, 0.040, 0.129], [-0.052, 0.040, 0.129]] as [number,number,number][]).forEach(([x,y,z]) => {
    const hole = new THREE.Mesh(
      new THREE.SphereGeometry(0.023, 10, 8),
      mat(threeColor("#030A06"), { roughness: 0.80 }),
    );
    hole.position.set(x, y, z);
    group.add(hole);
  });

  // Gloss glint
  const glint = new THREE.Mesh(
    new THREE.SphereGeometry(0.030, 10, 8),
    new THREE.MeshStandardMaterial({ color: 0xFFFFFF, transparent: true, opacity: 0.18, roughness: 0.04, emissive: new THREE.Color(1,1,1), emissiveIntensity: 0.14 }),
  );
  glint.position.set(-0.062, 0.100, 0.102);
  group.add(glint);

  return group;
}

// ═══════════════════════════════════════════════════════════════════════════
// HUMANOID SKELETON — Mixamo-compatible bone names
// ═══════════════════════════════════════════════════════════════════════════

interface BoneMap {
  Hips:          THREE.Bone;
  Spine:         THREE.Bone;
  Spine1:        THREE.Bone;
  Spine2:        THREE.Bone;
  Neck:          THREE.Bone;
  Head:          THREE.Bone;
  LeftShoulder:  THREE.Bone;
  LeftArm:       THREE.Bone;
  LeftForeArm:   THREE.Bone;
  LeftHand:      THREE.Bone;
  RightShoulder: THREE.Bone;
  RightArm:      THREE.Bone;
  RightForeArm:  THREE.Bone;
  RightHand:     THREE.Bone;
  LeftUpLeg:     THREE.Bone;
  LeftLeg:       THREE.Bone;
  LeftFoot:      THREE.Bone;
  RightUpLeg:    THREE.Bone;
  RightLeg:      THREE.Bone;
  RightFoot:     THREE.Bone;
}

function createSkeleton(): { bones: BoneMap; skeleton: THREE.Skeleton; root: THREE.Bone } {
  function bone(name: string, pos: [number,number,number]): THREE.Bone {
    const b = new THREE.Bone();
    b.name = name;
    b.position.set(...pos);
    return b;
  }

  const hips          = bone("Hips",          [0,       0,       0    ]);
  const spine         = bone("Spine",          [0,       0.110,   0    ]);
  const spine1        = bone("Spine1",         [0,       0.140,   0    ]);
  const spine2        = bone("Spine2",         [0,       0.140,   0    ]);
  const neck          = bone("Neck",           [0,       0.160,   0    ]);
  const head          = bone("Head",           [0,       0.120,   0    ]);

  const leftShoulder  = bone("LeftShoulder",   [0.080,   0.120,   0    ]);
  const leftArm       = bone("LeftArm",        [0.160,   0,       0    ]);
  const leftForeArm   = bone("LeftForeArm",    [0.280,   0,       0    ]);
  const leftHand      = bone("LeftHand",       [0.260,   0,       0    ]);

  const rightShoulder = bone("RightShoulder",  [-0.080,  0.120,   0    ]);
  const rightArm      = bone("RightArm",       [-0.160,  0,       0    ]);
  const rightForeArm  = bone("RightForeArm",   [-0.280,  0,       0    ]);
  const rightHand     = bone("RightHand",      [-0.260,  0,       0    ]);

  const leftUpLeg     = bone("LeftUpLeg",      [0.100,  -0.050,   0    ]);
  const leftLeg       = bone("LeftLeg",        [0,      -0.420,   0    ]);
  const leftFoot      = bone("LeftFoot",       [0,      -0.400,   0    ]);

  const rightUpLeg    = bone("RightUpLeg",     [-0.100, -0.050,   0    ]);
  const rightLeg      = bone("RightLeg",       [0,      -0.420,   0    ]);
  const rightFoot     = bone("RightFoot",      [0,      -0.400,   0    ]);

  // Build hierarchy
  hips.add(spine);
  spine.add(spine1);
  spine1.add(spine2);
  spine2.add(neck);
  neck.add(head);

  spine2.add(leftShoulder);
  leftShoulder.add(leftArm);
  leftArm.add(leftForeArm);
  leftForeArm.add(leftHand);

  spine2.add(rightShoulder);
  rightShoulder.add(rightArm);
  rightArm.add(rightForeArm);
  rightForeArm.add(rightHand);

  hips.add(leftUpLeg);
  leftUpLeg.add(leftLeg);
  leftLeg.add(leftFoot);

  hips.add(rightUpLeg);
  rightUpLeg.add(rightLeg);
  rightLeg.add(rightFoot);

  const allBones: THREE.Bone[] = [
    hips, spine, spine1, spine2, neck, head,
    leftShoulder, leftArm, leftForeArm, leftHand,
    rightShoulder, rightArm, rightForeArm, rightHand,
    leftUpLeg, leftLeg, leftFoot,
    rightUpLeg, rightLeg, rightFoot,
  ];

  const skeleton = new THREE.Skeleton(allBones);

  return {
    bones: {
      Hips: hips, Spine: spine, Spine1: spine1, Spine2: spine2, Neck: neck, Head: head,
      LeftShoulder:  leftShoulder,  LeftArm:  leftArm,  LeftForeArm:  leftForeArm,  LeftHand:  leftHand,
      RightShoulder: rightShoulder, RightArm: rightArm, RightForeArm: rightForeArm, RightHand: rightHand,
      LeftUpLeg: leftUpLeg, LeftLeg: leftLeg, LeftFoot: leftFoot,
      RightUpLeg: rightUpLeg, RightLeg: rightLeg, RightFoot: rightFoot,
    },
    skeleton,
    root: hips,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// SKINNED BODY — SkinnedMesh parts built from geometry primitives,
// each vertex weighted to the nearest bone.
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Assigns all vertices of a geometry to a single bone (rigid binding).
 * For a production avatar you'd do proper envelope weighting, but for
 * now this gives us a correct SkinnedMesh that plays Mixamo animations.
 */
function singleBoneSkinnedMesh(
  geo: THREE.BufferGeometry,
  material: THREE.Material,
  boneIndex: number,
  skeleton: THREE.Skeleton,
): THREE.SkinnedMesh {
  const count = geo.attributes.position.count;
  const skinIndex = new THREE.Uint16BufferAttribute(count * 4, 4);
  const skinWeight = new THREE.Float32BufferAttribute(count * 4, 4);
  for (let i = 0; i < count; i++) {
    skinIndex.setXYZW(i, boneIndex, 0, 0, 0);
    skinWeight.setXYZW(i, 1, 0, 0, 0);
  }
  geo.setAttribute("skinIndex", skinIndex);
  geo.setAttribute("skinWeight", skinWeight);
  const mesh = new THREE.SkinnedMesh(geo, material);
  mesh.add(skeleton.bones[0]);
  mesh.bind(skeleton);
  mesh.castShadow = true;
  return mesh;
}

// ═══════════════════════════════════════════════════════════════════════════
// OUTFIT PARTS — torso, arms, legs, shoes built as groups
// ═══════════════════════════════════════════════════════════════════════════

function buildBody(
  outfit: string,
  outfitColor: string,
  skin: string,
  pantsColor: string,
  bones: BoneMap,
  skeleton: THREE.Skeleton,
  gender: string,
): THREE.Group {
  const bodyGroup = new THREE.Group();

  const oc   = threeColor(outfitColor);
  const ocDk = darken(outfitColor, 0.22);
  const ocLt = lighten(outfitColor, 0.12);
  const sc   = threeColor(skin);
  const scDk = darken(skin, 0.18);
  const pc   = threeColor(pantsColor);
  const pcDk = darken(pantsColor, 0.22);
  const boneIdx = (b: THREE.Bone) => skeleton.bones.indexOf(b);

  // ── Neck ──────────────────────────────────────────────────────────────
  const neckPts = [
    new THREE.Vector2(0.062, 0),
    new THREE.Vector2(0.056, 0.090),
    new THREE.Vector2(0.048, 0.180),
  ];
  bodyGroup.add(singleBoneSkinnedMesh(
    new THREE.LatheGeometry(neckPts, 16),
    mat(sc, { roughness: 0.64 }),
    boneIdx(bones.Neck), skeleton,
  ));

  // ── Torso (lathe) ─────────────────────────────────────────────────────
  const torsoPoints = [
    new THREE.Vector2(0.200, -0.380),   // waist
    new THREE.Vector2(0.225, -0.240),
    new THREE.Vector2(0.250, -0.100),
    new THREE.Vector2(0.272, 0.040),
    new THREE.Vector2(0.300, 0.180),
    new THREE.Vector2(0.330, 0.300),
    new THREE.Vector2(0.344, 0.400),    // chest
    new THREE.Vector2(0.340, 0.490),
    new THREE.Vector2(0.310, 0.560),    // shoulder
    new THREE.Vector2(0.270, 0.610),
    new THREE.Vector2(0.210, 0.640),
  ];
  const torsoGeo = new THREE.LatheGeometry(torsoPoints, 28);
  const torso = singleBoneSkinnedMesh(torsoGeo, mat(oc, { roughness: 0.80 }), boneIdx(bones.Spine), skeleton);
  bodyGroup.add(torso);

  // Collar
  const collarPts = [
    new THREE.Vector2(0.090, 0.620),
    new THREE.Vector2(0.100, 0.660),
    new THREE.Vector2(0.104, 0.700),
  ];
  bodyGroup.add(singleBoneSkinnedMesh(
    new THREE.LatheGeometry(collarPts, 16),
    mat(ocDk, { roughness: 0.76 }),
    boneIdx(bones.Spine2), skeleton,
  ));

  // Outfit-specific details (non-skinned, attached to torso group for now)
  if (outfit === "bowling-shirt") {
    // Button strip
    const btnStrip = new THREE.Mesh(
      new THREE.CylinderGeometry(0.010, 0.010, 0.60, 6),
      mat(ocDk, { roughness: 0.70 }),
    );
    btnStrip.position.set(0, 0.20, 0.32);
    bodyGroup.add(btnStrip);
    // Buttons
    [0.48, 0.28, 0.08, -0.10].forEach(y => {
      const btn = new THREE.Mesh(
        new THREE.CylinderGeometry(0.012, 0.012, 0.010, 10),
        mat(darken(outfitColor, 0.42), { roughness: 0.50, metalness: 0.28 }),
      );
      btn.rotation.x = Math.PI / 2;
      btn.position.set(0, y, 0.336);
      bodyGroup.add(btn);
    });
    // Chest pocket
    const pocket = new THREE.Mesh(
      new THREE.BoxGeometry(0.080, 0.065, 0.004),
      mat(ocDk, { roughness: 0.78 }),
    );
    pocket.position.set(0.120, 0.380, 0.325);
    bodyGroup.add(pocket);
  }

  if (outfit === "letterman") {
    // White sleeves (will overlap arm meshes)
    ([-1, 1] as const).forEach(s => {
      const sleeve = new THREE.Mesh(
        new THREE.CylinderGeometry(0.095, 0.088, 0.40, 14),
        mat(threeColor("#F0EFE8"), { roughness: 0.82 }),
      );
      sleeve.position.set(s * 0.48, 0.30, 0);
      sleeve.rotation.z = s * 0.28;
      bodyGroup.add(sleeve);
    });
    // D letter badge
    const canvas = (typeof document !== "undefined") ? (() => {
      const c = document.createElement("canvas"); c.width = 64; c.height = 64;
      const ctx = c.getContext("2d");
      if (ctx) { ctx.fillStyle="#C8A020"; ctx.font="bold 56px Georgia,serif"; ctx.textAlign="center"; ctx.textBaseline="middle"; ctx.fillText("D",32,34); }
      return c;
    })() : null;
    const badge = new THREE.Mesh(
      new THREE.CircleGeometry(0.060, 24),
      new THREE.MeshStandardMaterial({ map: canvas ? new THREE.CanvasTexture(canvas) : null, color: 0xC8A020, roughness: 0.42 }),
    );
    badge.position.set(-0.085, 0.300, 0.330);
    bodyGroup.add(badge);
  }

  if (outfit === "jersey") {
    // Jersey number
    const canvas = (typeof document !== "undefined") ? (() => {
      const c = document.createElement("canvas"); c.width = 128; c.height = 80;
      const ctx = c.getContext("2d");
      if (ctx) { ctx.fillStyle=ocLt.getStyle(); ctx.font="bold 68px Impact,sans-serif"; ctx.textAlign="center"; ctx.textBaseline="middle"; ctx.fillText("42",64,42); }
      return c;
    })() : null;
    const num = new THREE.Mesh(
      new THREE.PlaneGeometry(0.18, 0.12),
      new THREE.MeshStandardMaterial({ map: canvas ? new THREE.CanvasTexture(canvas) : null, transparent: true, roughness: 0.50, side: THREE.FrontSide }),
    );
    num.position.set(0, 0.22, 0.335);
    bodyGroup.add(num);
  }

  if (outfit === "hoodie") {
    // Hood (spherical cap behind neck)
    const hood = new THREE.Mesh(
      new THREE.SphereGeometry(0.34, 22, 16, 0, Math.PI*2, 0, Math.PI*0.58),
      mat(ocDk, { roughness: 0.86 }),
    );
    hood.position.set(0, 0.42, -0.18);
    bodyGroup.add(hood);
    // Drawstrings
    ([-1, 1] as const).forEach(s => {
      const pts = [
        new THREE.Vector3(s * 0.040, 0.62, 0.32),
        new THREE.Vector3(s * 0.038, 0.30, 0.34),
        new THREE.Vector3(s * 0.042, 0.08, 0.32),
      ];
      bodyGroup.add(new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(pts),
        new THREE.LineBasicMaterial({ color: lighten(outfitColor, 0.30) }),
      ));
    });
  }

  // ── Female bust (gentle volume) ───────────────────────────────────────
  if (gender === "female") {
    ([-1, 1] as const).forEach(s => {
      const bust = new THREE.Mesh(
        (() => {
          const g = new THREE.SphereGeometry(0.12, 16, 14);
          const p = g.attributes.position as THREE.BufferAttribute;
          for (let i = 0; i < p.count; i++) {
            p.setX(i, p.getX(i) * 0.64);
            p.setZ(i, p.getZ(i) * 0.48);
            p.setY(i, p.getY(i) * 0.68);
          }
          g.computeVertexNormals();
          return g;
        })(),
        mat(oc, { roughness: 0.82 }),
      );
      bust.position.set(s * 0.100, 0.300, 0.308);
      bodyGroup.add(bust);
    });
  }

  // ── Shoulders ─────────────────────────────────────────────────────────
  ([-1, 1] as const).forEach(s => {
    const shoulder = new THREE.Mesh(
      new THREE.SphereGeometry(0.134, 16, 14),
      mat(oc, { roughness: 0.82 }),
    );
    shoulder.scale.set(0.82, 0.98, 0.88);
    shoulder.position.set(s * 0.372, 0.56, 0);
    bodyGroup.add(shoulder);
    const shHighlight = new THREE.Mesh(
      new THREE.SphereGeometry(0.100, 12, 10),
      mat(ocLt, { roughness: 0.84 }),
    );
    shHighlight.scale.set(0.72, 0.62, 0.70);
    shHighlight.position.set(s * 0.368, 0.610, 0.020);
    bodyGroup.add(shHighlight);
  });

  // ── Arms ──────────────────────────────────────────────────────────────
  (["left", "right"] as const).forEach(side => {
    const s = side === "right" ? 1 : -1;
    const armBone    = side === "right" ? bones.RightArm    : bones.LeftArm;
    const foreArmBone = side === "right" ? bones.RightForeArm : bones.LeftForeArm;
    const handBone   = side === "right" ? bones.RightHand   : bones.LeftHand;
    const bi = boneIdx(armBone);
    const fi = boneIdx(foreArmBone);
    const hi = boneIdx(handBone);

    // Upper arm sleeve
    bodyGroup.add(singleBoneSkinnedMesh(
      new THREE.CylinderGeometry(0.098, 0.090, 0.320, 14),
      mat(outfit === "letterman" ? threeColor("#F0EFE8") : oc, { roughness: 0.82 }),
      bi, skeleton,
    ));

    // Bicep / deltoid detail
    const bicep = new THREE.Mesh(new THREE.SphereGeometry(0.104, 12, 10), mat(outfit === "letterman" ? threeColor("#F0EFE8") : ocLt, { roughness: 0.84 }));
    bicep.scale.set(0.94, 0.70, 0.86);
    bicep.position.set(s * (bi + 0.14 - 0.14), 0.0, 0.024);
    bodyGroup.add(bicep);

    // Forearm (skin colored)
    bodyGroup.add(singleBoneSkinnedMesh(
      new THREE.CylinderGeometry(0.080, 0.068, 0.300, 12),
      mat(sc, { roughness: 0.65 }),
      fi, skeleton,
    ));

    // Wrist
    const wrist = singleBoneSkinnedMesh(
      new THREE.SphereGeometry(0.072, 12, 10),
      mat(sc, { roughness: 0.64 }),
      fi, skeleton,
    );
    bodyGroup.add(wrist);

    // Hand (simple palm)
    const palm = singleBoneSkinnedMesh(
      (() => {
        const g = new THREE.SphereGeometry(0.075, 14, 12);
        const p = g.attributes.position as THREE.BufferAttribute;
        for (let i = 0; i < p.count; i++) {
          p.setX(i, p.getX(i) * 1.08); p.setZ(i, p.getZ(i) * 0.52);
        }
        g.computeVertexNormals(); return g;
      })(),
      mat(sc, { roughness: 0.66 }),
      hi, skeleton,
    );
    bodyGroup.add(palm);

    // Fingers (4 + thumb, simplified)
    const fingerPositions: [number, number, number][] = [
      [-0.046, 0.062, 0.012], [-0.016, 0.072, 0.012],
      [ 0.016, 0.070, 0.012], [ 0.044, 0.058, 0.012],
    ];
    fingerPositions.forEach(([fx, fy, fz]) => {
      const seg1 = new THREE.Mesh(
        new THREE.CylinderGeometry(0.014, 0.012, 0.052, 8),
        mat(sc, { roughness: 0.66 }),
      );
      seg1.position.set(fx, fy, fz);
      seg1.rotation.x = -0.22;
      bodyGroup.add(seg1);
      const seg2 = new THREE.Mesh(
        new THREE.CylinderGeometry(0.012, 0.010, 0.040, 8),
        mat(scDk, { roughness: 0.67 }),
      );
      seg2.position.set(fx, fy + 0.048, fz - 0.008);
      seg2.rotation.x = -0.18;
      bodyGroup.add(seg2);
      // Fingernail
      const nail = new THREE.Mesh(
        new THREE.SphereGeometry(0.012, 8, 6),
        mat(lighten(skin, 0.14), { roughness: 0.34 }),
      );
      nail.scale.set(0.82, 0.48, 0.40);
      nail.position.set(fx, fy + 0.088, fz - 0.006);
      bodyGroup.add(nail);
    });
    // Thumb
    const thumb = new THREE.Mesh(
      new THREE.CylinderGeometry(0.018, 0.014, 0.064, 8),
      mat(sc, { roughness: 0.66 }),
    );
    thumb.position.set(s * 0.062, 0.014, 0.018);
    thumb.rotation.z = s * 0.70;
    bodyGroup.add(thumb);
  });

  // ── Hips (lathe) ──────────────────────────────────────────────────────
  const hipPoints = [
    new THREE.Vector2(0.188, -0.180),
    new THREE.Vector2(0.212, -0.080),
    new THREE.Vector2(0.230, 0.030),
    new THREE.Vector2(0.226, 0.140),
    new THREE.Vector2(0.210, 0.200),
  ];
  const hips2 = singleBoneSkinnedMesh(
    new THREE.LatheGeometry(hipPoints, 22),
    mat(pc, { roughness: 0.86 }),
    boneIdx(bones.Hips), skeleton,
  );
  bodyGroup.add(hips2);

  // Belt
  const belt = new THREE.Mesh(
    new THREE.CylinderGeometry(0.218, 0.220, 0.036, 24),
    mat(pcDk, { roughness: 0.60, metalness: 0.10 }),
  );
  belt.position.y = 0.22;
  bodyGroup.add(belt);
  // Belt buckle
  const buckle = new THREE.Mesh(
    new THREE.BoxGeometry(0.044, 0.030, 0.008),
    mat(threeColor("#C0A030"), { roughness: 0.18, metalness: 0.80 }),
  );
  buckle.position.set(0, 0.22, 0.222);
  bodyGroup.add(buckle);

  // ── Legs ──────────────────────────────────────────────────────────────
  (["left", "right"] as const).forEach(side => {
    const s = side === "right" ? 1 : -1;
    const upLegBone = side === "right" ? bones.RightUpLeg : bones.LeftUpLeg;
    const legBone   = side === "right" ? bones.RightLeg   : bones.LeftLeg;
    const footBone  = side === "right" ? bones.RightFoot  : bones.LeftFoot;
    const ui = boneIdx(upLegBone);
    const li = boneIdx(legBone);
    const fi = boneIdx(footBone);

    // Thigh
    bodyGroup.add(singleBoneSkinnedMesh(
      new THREE.CylinderGeometry(0.118, 0.106, 0.420, 14),
      mat(pc, { roughness: 0.86 }),
      ui, skeleton,
    ));
    // Knee cap
    const knee = new THREE.Mesh(new THREE.SphereGeometry(0.100, 14, 12), mat(pcDk, { roughness: 0.88 }));
    knee.scale.set(1, 0.72, 0.78);
    bodyGroup.add(knee);
    // Calf
    bodyGroup.add(singleBoneSkinnedMesh(
      new THREE.CylinderGeometry(0.096, 0.082, 0.380, 12),
      mat(pc, { roughness: 0.86 }),
      li, skeleton,
    ));
    // Sock
    const sock = new THREE.Mesh(
      new THREE.CylinderGeometry(0.078, 0.074, 0.060, 12),
      mat(threeColor("#E8E8E8"), { roughness: 0.90 }),
    );
    bodyGroup.add(sock);

    // Shoe
    const shoe = buildShoe(side);
    bodyGroup.add(shoe);
  });

  return bodyGroup;
}

function buildShoe(side: "left" | "right"): THREE.Group {
  const s = side === "right" ? 1 : -1;
  const group = new THREE.Group();
  const upper = threeColor("#1A1010");
  const midsole = threeColor("#E8E0D4");
  const outsole = threeColor("#0A0808");

  // Heel
  const heel = new THREE.Mesh(
    new THREE.SphereGeometry(0.094, 16, 12),
    mat(upper, { roughness: 0.44, metalness: 0.06 }),
  );
  heel.scale.set(1, 0.78, 0.88);
  heel.position.z = -0.060;
  group.add(heel);

  // Toe box
  const toe = new THREE.Mesh(
    new THREE.SphereGeometry(0.084, 16, 12),
    mat(upper, { roughness: 0.44 }),
  );
  toe.scale.set(1.04, 0.58, 1.22);
  toe.position.z = 0.118;
  group.add(toe);

  // Bridge
  const bridge = new THREE.Mesh(
    new THREE.SphereGeometry(0.080, 12, 10),
    mat(upper, { roughness: 0.46 }),
  );
  bridge.scale.set(1, 0.50, 1.44);
  bridge.position.z = 0.024;
  group.add(bridge);

  // Midsole
  const mid = new THREE.Mesh(
    new THREE.SphereGeometry(0.084, 14, 10),
    mat(midsole, { roughness: 0.88 }),
  );
  mid.scale.set(1.10, 0.24, 1.52);
  mid.position.set(0, -0.082, 0.024);
  group.add(mid);

  // Outsole
  const sole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.094, 0.094, 0.024, 20),
    mat(outsole, { roughness: 0.95 }),
  );
  sole.position.set(0, -0.128, 0.024);
  group.add(sole);

  // Laces (4 cross-lace bars)
  const laceCol = new THREE.LineBasicMaterial({ color: midsole });
  [0.028, 0.052, 0.078, 0.104].forEach(z => {
    const pts = [new THREE.Vector3(-0.046, 0.042, z), new THREE.Vector3(0.046, 0.042, z)];
    group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), laceCol));
  });

  // Tongue
  const tongue = new THREE.Mesh(
    new THREE.BoxGeometry(0.054, 0.005, 0.080),
    mat(darken("#1A1010", 0.14), { roughness: 0.54 }),
  );
  tongue.position.set(0, 0.052, 0.082);
  group.add(tongue);

  return group;
}

// ═══════════════════════════════════════════════════════════════════════════
// IDLE ANIMATION — runs when no Mixamo clip is active
// Subtle breathing + sway
// ═══════════════════════════════════════════════════════════════════════════

function applyIdleAnimation(bones: BoneMap, t: number, holdingBall: boolean): void {
  const breathe = Math.sin(t * 1.2) * 0.006;
  const sway = Math.sin(t * 0.4) * 0.018;
  const bob  = Math.sin(t * 1.2) * 0.008;

  bones.Spine.rotation.x  = breathe * 0.8;
  bones.Spine1.rotation.x = breathe;
  bones.Spine.rotation.y  = sway * 0.5;
  bones.Hips.position.y   = bob;

  // Head bob (opposite phase)
  bones.Head.rotation.y  = -sway * 0.3;
  bones.Head.rotation.x  =  0.04;

  // Breathing arms drift
  if (!holdingBall) {
    bones.RightArm.rotation.x =  0.14;
    bones.RightArm.rotation.z = -0.26 + breathe * 0.4;
    bones.RightForeArm.rotation.x = -0.12;

    bones.LeftArm.rotation.x  =  0.14;
    bones.LeftArm.rotation.z  =  0.26 + breathe * 0.4;
    bones.LeftForeArm.rotation.x  = -0.12;
  } else {
    // Ball-holding pose: right arm raises, left cradles
    bones.RightArm.rotation.x  =  1.10 + breathe * 0.2;
    bones.RightArm.rotation.z  = -0.28;
    bones.RightForeArm.rotation.x = -1.40;

    bones.LeftArm.rotation.x   =  0.80 + breathe * 0.2;
    bones.LeftArm.rotation.z   =  0.30;
    bones.LeftForeArm.rotation.x  = -1.10;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN EXPORTED COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export interface BowlerCharacter3DRef {
  /** Load and play a Mixamo .glb animation clip by filename (no extension). */
  playClip: (name: string) => Promise<void>;
  stopClip: () => void;
}

export default function BowlerCharacter3D({
  state,
}: {
  state: AvatarState;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const bonesRef = useRef<BoneMap | null>(null);

  const freckles   = state.freckles   ?? "none";
  const browStyle  = state.browStyle  ?? "default";
  const eyeShape   = state.eyeShape   ?? "almond";
  const eyelashes  = state.eyelashes  ?? (state.gender === "female");
  const noseStyle  = state.noseStyle  ?? "default";
  const mouthShape = state.mouthShape ?? "default";
  const lipKey     = state.lipColor   ?? "natural";
  const earSize    = state.earSize    ?? "default";
  const age        = state.age        ?? "adult";

  const skin       = SKIN_TONES[state.skinToneIdx] ?? SKIN_TONES[3];
  const hairColorHex = HAIR_HEX[state.hairColor] ?? HAIR_HEX.brown;
  const eyeColorHex  = EYE_HEX[state.eyeColor]  ?? EYE_HEX.brown;
  const lipColorHex  = LIP_HEX[lipKey]          ?? LIP_HEX.natural;
  const outfitColorHex = OUTFIT_HEX[state.outfit] ?? OUTFIT_HEX["bowling-shirt"];
  const accList    = state.accessories ?? [];
  const eyewear    = state.eyewear && state.eyewear !== "none" ? state.eyewear : accList.includes("sunglasses") ? "sunglasses" : accList.includes("glasses") ? "glasses" : "none";
  const headwear   = state.headwear && state.headwear !== "none" ? state.headwear : accList.includes("hat") ? "hat" : accList.includes("headband") ? "headband" : "none";
  const earrings   = state.earrings ?? accList.includes("earrings");

  // --- Build skeleton once ----------------------------------------------------
  const { bones, skeleton, root } = useMemo(() => createSkeleton(), []);
  bonesRef.current = bones;

  // --- Build head geometry (with morph targets) --------------------------------
  const headGeo = useMemo(() => createHeadGeometry(), []);

  // --- Build all scene objects -------------------------------------------------
  const headGroup = useMemo(() => {
    const g = new THREE.Group();

    // Skin material for head
    const skinMat = mat(threeColor(skin), { roughness: 0.58, metalness: 0 });
    const headMesh = new THREE.Mesh(headGeo, skinMat);
    headMesh.morphTargetInfluences = [0, 0, 0, 0, 0];
    const morphIdx = FACE_MORPH_IDX[state.faceShape] ?? 0;
    headMesh.morphTargetInfluences[morphIdx] = 1;
    headMesh.castShadow = true;
    headMesh.name = "headMesh";
    g.add(headMesh);

    // Skin shading (darker underside)
    const shadeMesh = new THREE.Mesh(
      (() => {
        const sg = new THREE.SphereGeometry(0.442, 32, 22, 0, Math.PI*2, Math.PI * 0.5, Math.PI * 0.5);
        return sg;
      })(),
      mat(darken(skin, 0.14), { roughness: 0.62, transparent: true, opacity: 0.48 }),
    );
    shadeMesh.morphTargetInfluences = headMesh.morphTargetInfluences;
    g.add(shadeMesh);

    // Cheek blush
    ([-1, 1] as const).forEach(s => {
      const blush = new THREE.Mesh(
        new THREE.SphereGeometry(0.120, 12, 10),
        mat(lighten(skin, 0.04), { roughness: 0.72, transparent: true, opacity: state.gender === "female" ? 0.60 : 0.35 }),
      );
      blush.scale.set(0.96, 0.52, 0.38);
      blush.position.set(s * 0.28, -0.042, 0.348);
      g.add(blush);
    });

    // Eyes
    g.add(buildEye(1,  eyeColorHex, eyeShape, eyelashes));
    g.add(buildEye(-1, eyeColorHex, eyeShape, eyelashes));

    // Brows
    g.add(buildBrow(1,  browStyle, hairColorHex));
    g.add(buildBrow(-1, browStyle, hairColorHex));

    // Nose
    g.add(buildNose(noseStyle, skin));

    // Mouth
    g.add(buildMouth(mouthShape, lipColorHex, state.gender));

    // Ears (rendered at head level)
    g.add(buildEar(1,  skin, earSize, earrings));
    g.add(buildEar(-1, skin, earSize, earrings));

    // Freckles
    g.add(buildFreckles(freckles, skin));

    // Aging marks
    g.add(buildAgingMarks(age, skin));

    // Hair
    g.add(buildHair(state.hairStyle, hairColorHex));

    // Facial hair (male only)
    if (state.gender === "male") {
      g.add(buildFacialHair(state.facialHair, hairColorHex));
    }

    // Eyewear
    g.add(buildEyewear(eyewear));

    // Headwear
    g.add(buildHeadwear(headwear, hairColorHex));

    return g;
  }, [
    skin, hairColorHex, eyeColorHex, lipColorHex,
    eyeShape, eyelashes, browStyle, noseStyle, mouthShape,
    earSize, earrings, freckles, age, eyewear, headwear,
    state.hairStyle, state.facialHair, state.gender, state.faceShape,
    headGeo,
  ]);

  const bodyGroup = useMemo(() => buildBody(
    state.outfit, outfitColorHex, skin, PANTS_COLOR, bones, skeleton, state.gender,
  ), [state.outfit, outfitColorHex, skin, state.gender, bones, skeleton]);

  const ballGroup = useMemo(() => buildBowlingBall(), []);

  // --- Position head on neck bone ---------------------------------------------
  useEffect(() => {
    if (!groupRef.current) return;
    groupRef.current.clear();
    groupRef.current.add(root); // skeleton root

    // Head group: position at head bone in world space
    // Character root is at Y=0; head bone is at y ≈ hips(0) + spine(0.11) + spine1(0.14) + spine2(0.14) + neck(0.16) + head(0.12) = 0.67 offset from spine base
    // We position the full character so hips are at Y=-1.0 (feet touch y=-1.82)
    headGroup.position.set(0, 1.86, 0);
    groupRef.current.add(headGroup);

    // Body group: contains torso/arms/legs built to body-local coords, root at hips
    bodyGroup.position.set(0, 1.06, 0);
    groupRef.current.add(bodyGroup);

    // Ball in right hand
    ballGroup.position.set(-0.38, 0.70, 0.22);
    groupRef.current.add(ballGroup);
  }, [headGroup, bodyGroup, ballGroup, root]);

  // --- Set face shape morph ---------------------------------------------------
  useEffect(() => {
    const mesh = headGroup.getObjectByName("headMesh") as THREE.Mesh | undefined;
    if (!mesh?.morphTargetInfluences) return;
    mesh.morphTargetInfluences.fill(0);
    const idx = FACE_MORPH_IDX[state.faceShape] ?? 0;
    mesh.morphTargetInfluences[idx] = 1;
  }, [state.faceShape, headGroup]);

  // --- Idle animation loop ----------------------------------------------------
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (!groupRef.current) return;

    // Gentle floating bob
    groupRef.current.position.y = Math.sin(t * 1.2) * 0.030;
    groupRef.current.rotation.y = Math.sin(t * 0.36) * 0.048;

    // Animate skeleton bones for idle
    if (mixerRef.current) {
      mixerRef.current.update(1 / 60);
    } else if (bonesRef.current) {
      applyIdleAnimation(bonesRef.current, t, true);
    }
  });

  return (
    <group ref={groupRef} position={[0, -1.06, 0]}>
      <primitive object={root}/>
    </group>
  );
}
