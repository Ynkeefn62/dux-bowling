"use client";
import * as THREE from "three";
import React, { useRef, useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import type { AvatarState } from "./AvatarSVG";

/* ─────────────────────────────────────────────────────────────────────────────
   SKIN / PALETTE TABLES
───────────────────────────────────────────────────────────────────────────── */
const SKIN_TONES = [
  "#FDDBB4","#F5C89A","#E8A97E","#D08B5B",
  "#C07A4B","#A0522D","#7A3B1E","#4A2010",
];
const HAIR_COLORS = [
  "#1a1008","#3b2314","#6b3a2a","#8b5a2b",
  "#b5813f","#d4a843","#e8d5a0","#f5f0e8",
  "#c0392b","#8e44ad","#2980b9","#27ae60",
];
const EYE_COLORS = [
  "#4a3728","#6b4c2a","#5c7a3e","#2e6b8a",
  "#3a5f8a","#7a9bc4","#5a8a6a","#2c4a6e",
];
const LIP_COLORS = [
  "#c8796a","#b5604f","#e8998a","#d4827a",
  "#f0b0a8","#8b4049","#c45c6a","#7a2030",
];

const DEG = (d: number) => (d * Math.PI) / 180;

/* ─────────────────────────────────────────────────────────────────────────────
   MATERIAL HELPERS
───────────────────────────────────────────────────────────────────────────── */
function mat(color: string | number, opts: Partial<THREE.MeshStandardMaterialParameters> = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.65, metalness: 0.0, ...opts });
}
function phong(color: string | number, opts: Partial<THREE.MeshPhongMaterialParameters> = {}) {
  return new THREE.MeshPhongMaterial({ color, ...opts });
}

/* ─────────────────────────────────────────────────────────────────────────────
   HEAD GEOMETRY WITH MORPH TARGETS
   (shapes: 0=oval, 1=round, 2=square, 3=heart, 4=diamond)
───────────────────────────────────────────────────────────────────────────── */
function buildHeadGeo(): THREE.BufferGeometry {
  const base = new THREE.SphereGeometry(0.22, 32, 24);
  const pos  = base.attributes.position as THREE.BufferAttribute;
  const n    = pos.count;

  const makeShape = (fn: (x:number,y:number,z:number)=>[number,number,number]) => {
    const arr = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
      const [dx,dy,dz] = fn(x,y,z);
      arr[i*3]   = dx - x;
      arr[i*3+1] = dy - y;
      arr[i*3+2] = dz - z;
    }
    return new THREE.BufferAttribute(arr, 3);
  };

  // oval: taller, slightly narrower
  const oval = makeShape((x,y,z) => [x*0.88, y*1.18, z*0.92]);
  // round: uniform sphere scale
  const round = makeShape((x,y,z) => [x*1.08, y*0.96, z*1.05]);
  // square: flatten sides, wider jaw
  const square = makeShape((x,y,z) => {
    const jaw = y < -0.05 ? 1.18 : 1.0;
    return [x*jaw*1.05, y*0.90, z*0.95];
  });
  // heart: wide forehead, narrow chin
  const heart = makeShape((x,y,z) => {
    const t = (y + 0.22) / 0.44;
    const xw = y > 0.04 ? 1.15 : (0.78 + t*0.22);
    return [x*xw, y*1.05, z*0.92];
  });
  // diamond: narrow top+bottom, wide cheeks
  const diamond = makeShape((x,y,z) => {
    const mid = 1.0 - Math.abs(y)/0.22;
    return [x*(0.82 + mid*0.36), y*1.08, z*(0.90 + mid*0.12)];
  });

  base.morphAttributes.position = [oval, round, square, heart, diamond];
  base.morphTargetsRelative = true;
  return base;
}

/* ─────────────────────────────────────────────────────────────────────────────
   EYE  (sclera + iris canvas texture + pupil + lash band)
───────────────────────────────────────────────────────────────────────────── */
function buildEye(
  parent: THREE.Object3D,
  side: -1 | 1,
  eyeColorHex: string,
  eyeShape: string,
  eyelashes: boolean,
) {
  const g = new THREE.Group();
  g.position.set(side * 0.075, 0.045, 0.185);
  parent.add(g);

  // sclera
  const scl = new THREE.Mesh(
    new THREE.SphereGeometry(0.038, 20, 16),
    mat("#f8f4ef", { roughness: 0.3 }),
  );
  g.add(scl);

  // iris canvas texture
  const canvas = document.createElement("canvas");
  canvas.width = 128; canvas.height = 128;
  const ctx = canvas.getContext("2d")!;
  const grad = ctx.createRadialGradient(64,64,2,64,64,56);
  grad.addColorStop(0,   eyeColorHex);
  grad.addColorStop(0.5, eyeColorHex + "cc");
  grad.addColorStop(1,   "#00000088");
  ctx.fillStyle = grad;
  ctx.beginPath(); ctx.arc(64,64,56,0,Math.PI*2); ctx.fill();
  // iris detail lines
  ctx.strokeStyle = "#00000033";
  for (let a = 0; a < 24; a++) {
    const angle = (a / 24) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(64 + Math.cos(angle)*18, 64 + Math.sin(angle)*18);
    ctx.lineTo(64 + Math.cos(angle)*52, 64 + Math.sin(angle)*52);
    ctx.lineWidth = 1; ctx.stroke();
  }
  // pupil
  ctx.fillStyle = "#0a0608";
  ctx.beginPath(); ctx.arc(64,64,22,0,Math.PI*2); ctx.fill();
  // specular dot
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.beginPath(); ctx.arc(74,54,8,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(56,68,4,0,Math.PI*2); ctx.fill();

  const tex = new THREE.CanvasTexture(canvas);
  const iris = new THREE.Mesh(
    new THREE.CircleGeometry(0.028, 24),
    new THREE.MeshStandardMaterial({ map: tex, roughness: 0.2, metalness: 0.05 }),
  );
  iris.position.set(0, 0, 0.036);
  g.add(iris);

  // upper eyelid shape
  if (eyeShape === "almond" || eyeShape === "wide") {
    const liftY = eyeShape === "wide" ? 0.008 : 0;
    const lid = new THREE.Mesh(
      new THREE.SphereGeometry(0.040, 20, 8, 0, Math.PI*2, 0, Math.PI*0.42),
      mat("#0a0608", { side: THREE.FrontSide }),
    );
    lid.position.set(0, 0.012 + liftY, 0.01);
    lid.rotation.x = DEG(-18);
    g.add(lid);
  }

  // lash band
  if (eyelashes) {
    const lashBand = new THREE.Mesh(
      new THREE.TorusGeometry(0.040, 0.006, 6, 24, Math.PI * 0.85),
      mat("#0a0608"),
    );
    lashBand.position.set(0, 0.018, 0.01);
    lashBand.rotation.x = DEG(-15);
    g.add(lashBand);

    // individual lashes
    for (let i = 0; i < 9; i++) {
      const angle = DEG(-75 + i * 18);
      const lash = new THREE.Mesh(
        new THREE.CylinderGeometry(0.0018, 0.0005, 0.022, 4),
        mat("#0a0608"),
      );
      lash.position.set(
        Math.sin(angle) * 0.042,
        0.020 + Math.cos(angle) * 0.010,
        0.018,
      );
      lash.rotation.z = -angle * 0.5;
      lash.rotation.x = DEG(-30);
      g.add(lash);
    }
  }
}

/* ─────────────────────────────────────────────────────────────────────────────
   EYEBROW  (TubeGeometry along CatmullRomCurve3)
───────────────────────────────────────────────────────────────────────────── */
function buildBrow(
  parent: THREE.Object3D,
  side: -1 | 1,
  browStyle: string,
  hairColorHex: string,
) {
  const SHAPES: Record<string, [number,number,number][]> = {
    straight: [[-0.055,0,0],[-0.028,0.004,0],[0,0.004,0],[0.028,0.004,0],[0.055,0,0]],
    arched:   [[-0.055,-0.004,0],[-0.024,0.014,0],[0,0.018,0],[0.024,0.014,0],[0.055,-0.002,0]],
    thick:    [[-0.058,-0.002,0],[-0.026,0.010,0],[0,0.012,0],[0.026,0.010,0],[0.058,-0.002,0]],
    thin:     [[-0.050,0.002,0],[-0.022,0.009,0],[0,0.011,0],[0.022,0.009,0],[0.050,0.002,0]],
    bushy:    [[-0.060,-0.004,0],[-0.028,0.012,0],[0,0.016,0],[0.028,0.012,0],[0.060,-0.004,0]],
    angled:   [[-0.055,-0.006,0],[-0.020,0.016,0],[0,0.018,0],[0.025,0.010,0],[0.058,0.000,0]],
  };
  const pts = (SHAPES[browStyle] ?? SHAPES.arched).map(
    ([x,y,z]) => new THREE.Vector3(x * side, y, z)
  );
  const curve = new THREE.CatmullRomCurve3(pts);
  const thick = browStyle === "thick" || browStyle === "bushy" ? 0.009 : 0.006;
  const brow = new THREE.Mesh(
    new THREE.TubeGeometry(curve, 18, thick, 6, false),
    mat(hairColorHex, { roughness: 0.8 }),
  );
  brow.position.set(side * 0.042, 0.112, 0.178);
  parent.add(brow);
}

/* ─────────────────────────────────────────────────────────────────────────────
   NOSE  (bridge + tip sphere + nostrils)
───────────────────────────────────────────────────────────────────────────── */
function buildNose(parent: THREE.Object3D, noseStyle: string, skinHex: string) {
  const g = new THREE.Group();
  g.position.set(0, 0.002, 0.21);
  parent.add(g);

  const PROFILES: Record<string, {bridge:number; tip:number; nostrilX:number; height:number}> = {
    straight: { bridge:0.014, tip:0.026, nostrilX:0.020, height:0.062 },
    button:   { bridge:0.010, tip:0.030, nostrilX:0.018, height:0.044 },
    wide:     { bridge:0.016, tip:0.034, nostrilX:0.028, height:0.058 },
    narrow:   { bridge:0.010, tip:0.022, nostrilX:0.016, height:0.062 },
    roman:    { bridge:0.016, tip:0.025, nostrilX:0.020, height:0.068 },
  };
  const p = PROFILES[noseStyle] ?? PROFILES.straight;

  // bridge ridge
  const bridge = new THREE.Mesh(
    new THREE.CylinderGeometry(p.bridge*0.7, p.bridge, p.height, 10),
    mat(skinHex, { roughness: 0.6 }),
  );
  bridge.position.set(0, p.height/2, 0);
  g.add(bridge);

  // tip
  const tip = new THREE.Mesh(
    new THREE.SphereGeometry(p.tip, 16, 12),
    mat(skinHex, { roughness: 0.55 }),
  );
  tip.position.set(0, p.height + p.tip * 0.4, p.tip * 0.15);
  g.add(tip);

  // nostrils
  for (const sx of [-1, 1] as const) {
    const nostril = new THREE.Mesh(
      new THREE.SphereGeometry(0.010, 10, 8),
      mat(new THREE.Color(skinHex).multiplyScalar(0.72).getHexString().padStart(6,"0").replace(/^/,"#"), { roughness: 0.7 }),
    );
    nostril.position.set(sx * p.nostrilX, p.height - 0.006, p.tip * 0.05);
    g.add(nostril);
  }
}

/* ─────────────────────────────────────────────────────────────────────────────
   MOUTH  (upper + lower lip curves)
───────────────────────────────────────────────────────────────────────────── */
function buildMouth(parent: THREE.Object3D, mouthShape: string, lipColorHex: string) {
  const g = new THREE.Group();
  g.position.set(0, -0.072, 0.195);
  parent.add(g);

  const SHAPES: Record<string, {upper:[number,number,number][]; lower:[number,number,number][]}> = {
    neutral: {
      upper: [[-0.040,0.008,0],[-0.018,0.014,0],[0,0.010,0],[0.018,0.014,0],[0.040,0.008,0]],
      lower: [[-0.040,0.008,0],[-0.018,-0.006,0],[0,-0.012,0],[0.018,-0.006,0],[0.040,0.008,0]],
    },
    smile: {
      upper: [[-0.042,0.004,0],[-0.016,0.016,0],[0,0.014,0],[0.016,0.016,0],[0.042,0.004,0]],
      lower: [[-0.042,0.004,0],[-0.020,-0.010,0],[0,-0.018,0],[0.020,-0.010,0],[0.042,0.004,0]],
    },
    wide: {
      upper: [[-0.052,0.006,0],[-0.022,0.016,0],[0,0.012,0],[0.022,0.016,0],[0.052,0.006,0]],
      lower: [[-0.052,0.006,0],[-0.024,-0.008,0],[0,-0.015,0],[0.024,-0.008,0],[0.052,0.006,0]],
    },
    small: {
      upper: [[-0.030,0.006,0],[-0.012,0.012,0],[0,0.009,0],[0.012,0.012,0],[0.030,0.006,0]],
      lower: [[-0.030,0.006,0],[-0.014,-0.005,0],[0,-0.010,0],[0.014,-0.005,0],[0.030,0.006,0]],
    },
    pouty: {
      upper: [[-0.038,0.003,0],[-0.016,0.018,0],[0,0.016,0],[0.016,0.018,0],[0.038,0.003,0]],
      lower: [[-0.038,0.003,0],[-0.018,-0.014,0],[0,-0.022,0],[0.018,-0.014,0],[0.038,0.003,0]],
    },
  };
  const shape = SHAPES[mouthShape] ?? SHAPES.neutral;

  const lipMat = mat(lipColorHex, { roughness: 0.45, metalness: 0.05 });

  for (const key of ["upper","lower"] as const) {
    const pts = shape[key].map(([x,y,z]) => new THREE.Vector3(x,y,z));
    const curve = new THREE.CatmullRomCurve3(pts);
    const lip = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 20, 0.010, 8, false),
      lipMat,
    );
    g.add(lip);
  }

  // teeth glimmer
  const teethGeo = new THREE.BoxGeometry(0.056, 0.014, 0.008);
  const teeth = new THREE.Mesh(teethGeo, mat("#f5f0ea", { roughness: 0.25 }));
  teeth.position.set(0, -0.002, 0.002);
  g.add(teeth);
}

/* ─────────────────────────────────────────────────────────────────────────────
   EAR  (pinna + concha + helix rim + lobe)
───────────────────────────────────────────────────────────────────────────── */
function buildEar(
  parent: THREE.Object3D,
  side: -1 | 1,
  earSize: string,
  skinHex: string,
  earring: boolean,
) {
  const scale = earSize === "large" ? 1.28 : earSize === "small" ? 0.80 : 1.0;
  const g = new THREE.Group();
  g.position.set(side * 0.225, 0.028, 0.01);
  g.rotation.y = side * DEG(12);
  parent.add(g);

  // pinna (ellipsoid)
  const pinna = new THREE.Mesh(
    new THREE.SphereGeometry(1, 18, 14),
    mat(skinHex, { roughness: 0.6 }),
  );
  pinna.scale.set(0.028 * scale, 0.050 * scale, 0.018 * scale);
  g.add(pinna);

  // concha depression
  const concha = new THREE.Mesh(
    new THREE.SphereGeometry(0.018 * scale, 12, 10),
    mat(new THREE.Color(skinHex).multiplyScalar(0.82).getHexString().padStart(6,"0").replace(/^/,"#"), { roughness: 0.7 }),
  );
  concha.position.set(0, 0.002, 0.010 * scale);
  g.add(concha);

  // helix rim
  const helixPts = [
    new THREE.Vector3(-0.022*scale, -0.040*scale, 0),
    new THREE.Vector3(-0.028*scale,  0.000*scale, 0.006*scale),
    new THREE.Vector3(-0.018*scale,  0.038*scale, 0.002*scale),
    new THREE.Vector3( 0.008*scale,  0.048*scale, -0.002*scale),
    new THREE.Vector3( 0.022*scale,  0.024*scale, -0.004*scale),
    new THREE.Vector3( 0.020*scale, -0.010*scale, -0.002*scale),
  ];
  const helix = new THREE.Mesh(
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3(helixPts), 20, 0.007*scale, 6, false),
    mat(skinHex, { roughness: 0.55 }),
  );
  g.add(helix);

  // lobe
  const lobe = new THREE.Mesh(
    new THREE.SphereGeometry(0.014*scale, 10, 8),
    mat(skinHex, { roughness: 0.6 }),
  );
  lobe.position.set(0, -0.052 * scale, 0);
  g.add(lobe);

  // earring hoop
  if (earring) {
    const hoop = new THREE.Mesh(
      new THREE.TorusGeometry(0.016*scale, 0.003*scale, 8, 20, Math.PI * 1.5),
      mat("#c9a84c", { roughness: 0.25, metalness: 0.85 }),
    );
    hoop.position.set(0, -0.060*scale, 0.002);
    hoop.rotation.x = DEG(-10);
    g.add(hoop);
  }
}

/* ─────────────────────────────────────────────────────────────────────────────
   FRECKLES
───────────────────────────────────────────────────────────────────────────── */
function buildFreckles(parent: THREE.Object3D, skinHex: string) {
  const freckleColor = new THREE.Color(skinHex).multiplyScalar(0.65);
  const mat_ = new THREE.MeshStandardMaterial({ color: freckleColor, roughness: 0.8 });
  const SPOTS = [
    [0.055, 0.020, 0.195],[0.075, 0.035, 0.185],[0.040, 0.050, 0.200],
    [0.090, 0.010, 0.175],[0.025, 0.030, 0.205],[0.065, 0.060, 0.185],
    [-0.055, 0.020, 0.195],[-0.075, 0.035, 0.185],[-0.040, 0.050, 0.200],
    [-0.090, 0.010, 0.175],[-0.025, 0.030, 0.205],[-0.065, 0.060, 0.185],
    [0.030, -0.020, 0.205],[-0.030, -0.020, 0.205],[0.060, -0.010, 0.192],
    [-0.060, -0.010, 0.192],[0.020, 0.085, 0.198],[-0.020, 0.085, 0.198],
  ];
  for (const [x,y,z] of SPOTS) {
    const dot = new THREE.Mesh(
      new THREE.CircleGeometry(0.004 + Math.random()*0.003, 6),
      mat_,
    );
    dot.position.set(x, y, z);
    dot.lookAt(new THREE.Vector3(x,y,z).normalize().multiplyScalar(10));
    parent.add(dot);
  }
}

/* ─────────────────────────────────────────────────────────────────────────────
   AGING MARKS
───────────────────────────────────────────────────────────────────────────── */
function buildAgingMarks(parent: THREE.Object3D, skinHex: string) {
  const lineMat = mat(
    new THREE.Color(skinHex).multiplyScalar(0.72).getHexString().padStart(6,"0").replace(/^/,"#"),
    { roughness: 0.9 },
  );

  const forehead = [
    [[-0.048,0.135,0.192],[-0.024,0.138,0.198],[0.000,0.137,0.200],[0.024,0.138,0.198],[0.048,0.135,0.192]],
    [[-0.040,0.118,0.196],[-0.020,0.121,0.201],[0.000,0.120,0.203],[0.020,0.121,0.201],[0.040,0.118,0.196]],
    [[-0.032,0.100,0.198],[-0.016,0.103,0.203],[0.000,0.102,0.205],[0.016,0.103,0.203],[0.032,0.100,0.198]],
  ];
  for (const row of forehead) {
    const pts = row.map(([x,y,z]) => new THREE.Vector3(x,y,z));
    parent.add(new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 14, 0.0025, 4),
      lineMat,
    ));
  }

  // nasolabial folds
  for (const sx of [-1, 1] as const) {
    const fold = [
      new THREE.Vector3(sx*0.048, 0.012, 0.200),
      new THREE.Vector3(sx*0.054, -0.020, 0.196),
      new THREE.Vector3(sx*0.048, -0.055, 0.192),
    ];
    parent.add(new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(fold), 10, 0.003, 4),
      lineMat,
    ));
  }
}

/* ─────────────────────────────────────────────────────────────────────────────
   HAIR  (8 styles)
───────────────────────────────────────────────────────────────────────────── */
function buildHair(parent: THREE.Object3D, style: string, colorHex: string) {
  if (style === "bald") return;
  const hm = mat(colorHex, { roughness: 0.75 });

  if (style === "buzz") {
    const buzz = new THREE.Mesh(
      new THREE.SphereGeometry(0.226, 28, 20, 0, Math.PI*2, 0, Math.PI*0.55),
      hm,
    );
    buzz.position.set(0, 0.018, 0);
    parent.add(buzz);
    return;
  }

  if (style === "short") {
    const cap = new THREE.Mesh(
      new THREE.SphereGeometry(0.233, 28, 20, 0, Math.PI*2, 0, Math.PI*0.50),
      hm,
    );
    cap.position.set(0, 0.028, 0.008);
    parent.add(cap);
    const side = new THREE.Mesh(
      new THREE.SphereGeometry(0.228, 20, 16, 0, Math.PI*2, Math.PI*0.42, Math.PI*0.16),
      hm,
    );
    parent.add(side);
    return;
  }

  if (style === "pompadour") {
    const base_ = new THREE.Mesh(
      new THREE.SphereGeometry(0.232, 28, 20, 0, Math.PI*2, 0, Math.PI*0.50),
      hm,
    );
    base_.position.set(0, 0.020, 0);
    parent.add(base_);
    // quiff sweep forward
    const quiffPts = [
      new THREE.Vector3(0, 0.200, 0.060),
      new THREE.Vector3(0, 0.230, 0.120),
      new THREE.Vector3(0, 0.220, 0.180),
      new THREE.Vector3(0, 0.180, 0.210),
    ];
    for (let i = 0; i < 5; i++) {
      const off = (i-2)*0.024;
      const quiff = new THREE.Mesh(
        new THREE.TubeGeometry(
          new THREE.CatmullRomCurve3(quiffPts.map(p=>new THREE.Vector3(p.x+off,p.y,p.z))),
          12, 0.022 - Math.abs(i-2)*0.004, 5,
        ),
        hm,
      );
      parent.add(quiff);
    }
    return;
  }

  if (style === "bob") {
    // top cap (hemisphere only, doesn't cover face)
    const bob = new THREE.Mesh(
      new THREE.SphereGeometry(0.240, 32, 22, 0, Math.PI*2, 0, Math.PI*0.50),
      hm,
    );
    bob.position.set(0, 0.030, 0.008);
    parent.add(bob);
    // side & back skirt going down to chin (open at front)
    const skirt = new THREE.Mesh(
      new THREE.SphereGeometry(0.240, 32, 22, Math.PI*0.30, Math.PI*1.40, Math.PI*0.40, Math.PI*0.30),
      hm,
    );
    skirt.position.set(0, 0.030, 0.008);
    parent.add(skirt);
    // bottom rim
    const rim = new THREE.Mesh(
      new THREE.TorusGeometry(0.235, 0.012, 8, 32, Math.PI * 1.35),
      hm,
    );
    rim.rotation.x = DEG(90);
    rim.rotation.y = DEG(180);
    rim.position.set(0, -0.130, 0.008);
    parent.add(rim);
    return;
  }

  if (style === "long") {
    const cap = new THREE.Mesh(
      new THREE.SphereGeometry(0.233, 28, 20, 0, Math.PI*2, 0, Math.PI*0.52),
      hm,
    );
    cap.position.set(0, 0.022, 0.008);
    parent.add(cap);
    // flowing strands
    for (let i = 0; i < 7; i++) {
      const angle = DEG(-90 + i * 30);
      const sx = Math.cos(angle) * 0.18;
      const strandPts = [
        new THREE.Vector3(sx, -0.05, Math.sin(angle)*0.12 + 0.04),
        new THREE.Vector3(sx*1.1, -0.22, Math.sin(angle)*0.10),
        new THREE.Vector3(sx*0.9, -0.38, Math.sin(angle)*0.08),
        new THREE.Vector3(sx*1.05, -0.52, Math.sin(angle)*0.06),
      ];
      const strand = new THREE.Mesh(
        new THREE.TubeGeometry(new THREE.CatmullRomCurve3(strandPts), 12, 0.028, 5),
        hm,
      );
      parent.add(strand);
    }
    return;
  }

  if (style === "curly") {
    const cap = new THREE.Mesh(
      new THREE.SphereGeometry(0.248, 28, 20, 0, Math.PI*2, 0, Math.PI*0.56),
      hm,
    );
    cap.position.set(0, 0.028, 0.010);
    parent.add(cap);
    // curl clusters
    for (let i = 0; i < 18; i++) {
      const theta = (i/18) * Math.PI * 2;
      const phi   = 0.28 + (i % 3) * 0.18;
      const curl  = new THREE.Mesh(
        new THREE.TorusGeometry(0.018, 0.010, 5, 10, Math.PI * 1.4),
        hm,
      );
      curl.position.set(
        Math.sin(theta)*Math.sin(phi)*0.22,
        Math.cos(phi)*0.22 + 0.038,
        Math.cos(theta)*Math.sin(phi)*0.22,
      );
      curl.rotation.set(Math.random()*Math.PI, Math.random()*Math.PI, 0);
      parent.add(curl);
    }
    return;
  }

  if (style === "bun") {
    const cap = new THREE.Mesh(
      new THREE.SphereGeometry(0.232, 28, 20, 0, Math.PI*2, 0, Math.PI*0.50),
      hm,
    );
    cap.position.set(0, 0.020, 0);
    parent.add(cap);
    const bun = new THREE.Mesh(
      new THREE.SphereGeometry(0.060, 16, 12),
      hm,
    );
    bun.position.set(0, 0.230, -0.040);
    parent.add(bun);
    // bun wrap band
    const band = new THREE.Mesh(
      new THREE.TorusGeometry(0.062, 0.010, 6, 18),
      mat(
        new THREE.Color(colorHex).multiplyScalar(0.65).getHexString().padStart(6,"0").replace(/^/,"#"),
      ),
    );
    band.position.set(0, 0.230, -0.040);
    band.rotation.x = DEG(10);
    parent.add(band);
    return;
  }
}

/* ─────────────────────────────────────────────────────────────────────────────
   FACIAL HAIR
───────────────────────────────────────────────────────────────────────────── */
function buildFacialHair(parent: THREE.Object3D, style: string, colorHex: string) {
  if (!style || style === "none") return;
  const hm = mat(colorHex, { roughness: 0.82 });

  if (style === "stubble") {
    const DOTS: [number,number,number][] = [];
    for (let row = 0; row < 6; row++) {
      for (let col = 0; col < 10; col++) {
        DOTS.push([(col-4.5)*0.016, -0.062 - row*0.012, 0.192 - row*0.003]);
      }
    }
    for (const [x,y,z] of DOTS) {
      const dot = new THREE.Mesh(
        new THREE.SphereGeometry(0.003, 4, 3),
        hm,
      );
      dot.position.set(x, y, z);
      parent.add(dot);
    }
    return;
  }

  if (style === "mustache") {
    for (const sx of [-1, 1] as const) {
      const pts = [
        new THREE.Vector3(sx*0.002, -0.058, 0.198),
        new THREE.Vector3(sx*0.018, -0.060, 0.196),
        new THREE.Vector3(sx*0.032, -0.063, 0.192),
        new THREE.Vector3(sx*0.040, -0.070, 0.185),
      ];
      parent.add(new THREE.Mesh(
        new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 10, 0.009, 6),
        hm,
      ));
    }
    return;
  }

  if (style === "beard-short") {
    // jaw wrap
    const jaw = new THREE.Mesh(
      new THREE.SphereGeometry(0.225, 24, 18, 0, Math.PI*2, Math.PI*0.58, Math.PI*0.28),
      hm,
    );
    jaw.position.set(0, -0.018, 0);
    parent.add(jaw);
    // chin volume
    const chin = new THREE.Mesh(
      new THREE.SphereGeometry(0.060, 14, 10),
      hm,
    );
    chin.position.set(0, -0.115, 0.155);
    parent.add(chin);
    return;
  }

  if (style === "beard-full") {
    const jaw = new THREE.Mesh(
      new THREE.SphereGeometry(0.230, 24, 18, 0, Math.PI*2, Math.PI*0.52, Math.PI*0.36),
      hm,
    );
    jaw.position.set(0, -0.012, 0);
    parent.add(jaw);
    const chin = new THREE.Mesh(
      new THREE.SphereGeometry(0.078, 16, 12),
      hm,
    );
    chin.position.set(0, -0.128, 0.150);
    parent.add(chin);
    // mustache
    for (const sx of [-1, 1] as const) {
      const pts = [
        new THREE.Vector3(sx*0.002, -0.055, 0.200),
        new THREE.Vector3(sx*0.020, -0.057, 0.197),
        new THREE.Vector3(sx*0.036, -0.062, 0.191),
        new THREE.Vector3(sx*0.042, -0.072, 0.182),
      ];
      parent.add(new THREE.Mesh(
        new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 10, 0.010, 6),
        hm,
      ));
    }
    return;
  }
}

/* ─────────────────────────────────────────────────────────────────────────────
   EYEWEAR
───────────────────────────────────────────────────────────────────────────── */
function buildEyewear(parent: THREE.Object3D, style: string) {
  if (!style || style === "none") return;
  const isSun = style === "sunglasses";

  const frameMat = mat(isSun ? "#1a1008" : "#2a2a3a", { roughness: 0.4, metalness: 0.6 });
  const lensMat  = new THREE.MeshStandardMaterial({
    color: isSun ? "#0a0a0a" : "#d8eeff",
    transparent: true,
    opacity: isSun ? 0.82 : 0.35,
    roughness: 0.08,
    metalness: 0.1,
  });

  for (const sx of [-1, 1] as const) {
    // lens
    const lens = new THREE.Mesh(
      new THREE.TorusGeometry(0.032, 0.004, 8, 28),
      frameMat,
    );
    lens.position.set(sx * 0.075, 0.045, 0.218);
    parent.add(lens);

    // lens fill
    const fill = new THREE.Mesh(
      new THREE.CircleGeometry(0.028, 24),
      lensMat,
    );
    fill.position.set(sx * 0.075, 0.045, 0.219);
    parent.add(fill);

    // glare stripe
    if (isSun) {
      const glare = new THREE.Mesh(
        new THREE.BoxGeometry(0.032, 0.004, 0.001),
        mat("#ffffff", { roughness: 0.1, transparent: true, opacity: 0.3 }),
      );
      glare.position.set(sx * 0.075 - 0.008, 0.056, 0.220);
      glare.rotation.z = DEG(-20);
      parent.add(glare);
    }
  }

  // bridge
  const bridge = new THREE.Mesh(
    new THREE.CylinderGeometry(0.003, 0.003, 0.040, 6),
    frameMat,
  );
  bridge.rotation.z = DEG(90);
  bridge.position.set(0, 0.045, 0.218);
  parent.add(bridge);

  // temples
  for (const sx of [-1, 1] as const) {
    const templePts = [
      new THREE.Vector3(sx*0.107, 0.045, 0.218),
      new THREE.Vector3(sx*0.155, 0.040, 0.160),
      new THREE.Vector3(sx*0.200, 0.030, 0.080),
      new THREE.Vector3(sx*0.215, 0.010, 0.000),
    ];
    parent.add(new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(templePts), 10, 0.003, 5),
      frameMat,
    ));
  }
}

/* ─────────────────────────────────────────────────────────────────────────────
   HEADWEAR  (cap or headband)
───────────────────────────────────────────────────────────────────────────── */
function buildHeadwear(parent: THREE.Object3D, style: string, skinHex: string) {
  if (!style || style === "none") return;

  if (style === "cap") {
    const capMat  = mat("#1a2a4a", { roughness: 0.75 });
    const trimMat = mat("#f0c030", { roughness: 0.55, metalness: 0.2 });

    // cap body (sits ABOVE the brow line at Y=0.115)
    const cap = new THREE.Mesh(
      new THREE.SphereGeometry(0.236, 32, 22, 0, Math.PI*2, 0, Math.PI*0.50),
      capMat,
    );
    cap.position.set(0, 0.130, 0.000);
    parent.add(cap);

    // brim — flat curved plate extending forward from front of cap
    const brimShape = new THREE.Shape();
    brimShape.moveTo(-0.140, 0);
    brimShape.quadraticCurveTo(-0.140, 0.180, 0, 0.230);
    brimShape.quadraticCurveTo(0.140, 0.180, 0.140, 0);
    brimShape.lineTo(-0.140, 0);
    const brim = new THREE.Mesh(
      new THREE.ExtrudeGeometry(brimShape, { depth: 0.014, bevelEnabled: false }),
      capMat,
    );
    // shape is in XY (Y forward); rotate +90° around X so shape lies on XZ plane (Y→Z, Z depth→-Y)
    brim.rotation.x = DEG(90);
    brim.position.set(0, 0.128, 0.000);
    parent.add(brim);

    // brim underside (slight darker shadow tone)
    const brimUnder = new THREE.Mesh(
      new THREE.ExtrudeGeometry(brimShape, { depth: 0.002, bevelEnabled: false }),
      mat("#0a1428", { roughness: 0.85 }),
    );
    brimUnder.rotation.x = DEG(90);
    brimUnder.position.set(0, 0.114, 0.000);
    parent.add(brimUnder);

    // seams
    for (let i = 0; i < 6; i++) {
      const a = DEG(i * 60);
      const seam = new THREE.Mesh(
        new THREE.TubeGeometry(
          new THREE.CatmullRomCurve3([
            new THREE.Vector3(Math.sin(a)*0.010, 0.130, Math.cos(a)*0.010),
            new THREE.Vector3(Math.sin(a)*0.090, 0.180, Math.cos(a)*0.090),
            new THREE.Vector3(Math.sin(a)*0.140, 0.250, Math.cos(a)*0.140),
            new THREE.Vector3(Math.sin(a)*0.040, 0.320, Math.cos(a)*0.040),
          ]),
          10, 0.003, 4,
        ),
        mat("#2a3a5a", { roughness: 0.8 }),
      );
      parent.add(seam);
    }

    // front logo badge
    const logo = new THREE.Mesh(
      new THREE.BoxGeometry(0.052, 0.034, 0.003),
      trimMat,
    );
    logo.position.set(0, 0.205, 0.232);
    parent.add(logo);

    // button on top
    const btn = new THREE.Mesh(
      new THREE.SphereGeometry(0.012, 12, 8),
      capMat,
    );
    btn.position.set(0, 0.366, 0);
    parent.add(btn);
    return;
  }

  if (style === "headband") {
    const hbMat = mat("#c0392b", { roughness: 0.55 });
    const band = new THREE.Mesh(
      new THREE.TorusGeometry(0.232, 0.018, 10, 32, Math.PI*1.20),
      hbMat,
    );
    band.position.set(0, 0.140, 0.020);
    band.rotation.x = DEG(8);
    parent.add(band);
    // tied knot at the back
    const knot = new THREE.Mesh(
      new THREE.SphereGeometry(0.020, 12, 10),
      hbMat,
    );
    knot.position.set(0, 0.140, -0.230);
    parent.add(knot);
    return;
  }
}

/* ─────────────────────────────────────────────────────────────────────────────
   SHOE
───────────────────────────────────────────────────────────────────────────── */
function buildShoe(parent: THREE.Object3D, side: -1 | 1) {
  const g = new THREE.Group();
  g.position.set(0, 0, 0);
  parent.add(g);

  const soleM  = mat("#2a1f1a", { roughness: 0.9 });
  const upperM = mat("#f0ece6", { roughness: 0.6 });
  const accentM= mat("#c8392b", { roughness: 0.55 });

  // upper
  const upper = new THREE.Mesh(
    new THREE.BoxGeometry(0.088, 0.072, 0.180),
    upperM,
  );
  upper.position.set(0, 0.036, 0.025);
  upper.geometry = upper.geometry.clone();
  g.add(upper);

  // sole
  const sole = new THREE.Mesh(
    new THREE.BoxGeometry(0.092, 0.022, 0.188),
    soleM,
  );
  sole.position.set(0, -0.011, 0.025);
  g.add(sole);

  // toe cap
  const toe = new THREE.Mesh(
    new THREE.SphereGeometry(0.052, 16, 10, 0, Math.PI*2, 0, Math.PI*0.55),
    upperM,
  );
  toe.rotation.x = DEG(90);
  toe.position.set(0, 0.028, 0.110);
  g.add(toe);

  // heel cup
  const heel = new THREE.Mesh(
    new THREE.SphereGeometry(0.048, 12, 8, 0, Math.PI*2, Math.PI*0.45, Math.PI*0.55),
    upperM,
  );
  heel.rotation.x = DEG(90);
  heel.position.set(0, 0.028, -0.072);
  g.add(heel);

  // accent stripe
  const stripe = new THREE.Mesh(
    new THREE.BoxGeometry(0.094, 0.016, 0.130),
    accentM,
  );
  stripe.position.set(0, 0.060, 0.020);
  g.add(stripe);

  // laces
  for (let i = 0; i < 4; i++) {
    const lace = new THREE.Mesh(
      new THREE.CylinderGeometry(0.003, 0.003, 0.068, 5),
      mat("#e0dcd6"),
    );
    lace.rotation.z = DEG(90);
    lace.position.set(0, 0.074, 0.020 + i * 0.026 - 0.040);
    g.add(lace);
  }
}

/* ─────────────────────────────────────────────────────────────────────────────
   HAND  (palm + 5 fingers with individual phalanges)
───────────────────────────────────────────────────────────────────────────── */
function buildHand(parent: THREE.Object3D, side: -1 | 1, skinHex: string) {
  const g = new THREE.Group();
  parent.add(g);
  const sm = mat(skinHex, { roughness: 0.55 });

  // palm
  const palm = new THREE.Mesh(
    new THREE.BoxGeometry(0.072, 0.088, 0.026),
    sm,
  );
  palm.position.set(0, -0.044, 0);
  g.add(palm);

  // wrist rounding
  const wristRound = new THREE.Mesh(
    new THREE.CylinderGeometry(0.032, 0.034, 0.026, 12),
    sm,
  );
  wristRound.rotation.x = DEG(90);
  wristRound.position.set(0, 0, 0);
  g.add(wristRound);

  // knuckles row
  for (let i = 0; i < 4; i++) {
    const kx = (i - 1.5) * 0.018;
    const knuckle = new THREE.Mesh(new THREE.SphereGeometry(0.012, 8, 6), sm);
    knuckle.position.set(kx * side, -0.084, 0.010);
    g.add(knuckle);
  }

  // fingers
  const FINGER_CONFIGS = [
    { name:"index",  baseX: side*0.022, len:[0.040,0.030,0.022], spread: side*DEG( 8) },
    { name:"middle", baseX: side*0.007, len:[0.044,0.032,0.024], spread: side*DEG( 2) },
    { name:"ring",   baseX:-side*0.007, len:[0.040,0.030,0.022], spread: side*DEG(-3) },
    { name:"pinky",  baseX:-side*0.022, len:[0.028,0.022,0.016], spread: side*DEG(-10) },
  ];
  for (const fc of FINGER_CONFIGS) {
    let prev: THREE.Object3D = g;
    let prevY = -0.084;
    for (let ph = 0; ph < 3; ph++) {
      const seg = new THREE.Group();
      seg.position.set(ph === 0 ? fc.baseX : 0, prevY - fc.len[ph]/2, 0);
      if (ph === 0) seg.rotation.z = fc.spread;
      prev.add(seg);
      const mesh = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.008 - ph*0.0015, fc.len[ph] - 0.010, 4, 8),
        sm,
      );
      seg.add(mesh);
      prev = seg;
      prevY = -fc.len[ph]/2 - 0.005;
    }
  }

  // thumb
  const thumbBase = new THREE.Group();
  thumbBase.position.set(side * 0.038, -0.020, 0);
  thumbBase.rotation.z = side * DEG(42);
  g.add(thumbBase);
  const t1 = new THREE.Mesh(new THREE.CapsuleGeometry(0.011, 0.026, 4, 8), sm);
  thumbBase.add(t1);
  const thumbMid = new THREE.Group();
  thumbMid.position.set(0, -0.026, 0);
  thumbBase.add(thumbMid);
  const t2 = new THREE.Mesh(new THREE.CapsuleGeometry(0.009, 0.020, 4, 8), sm);
  thumbMid.add(t2);

  return g;
}

/* ─────────────────────────────────────────────────────────────────────────────
   BOWLING BALL
───────────────────────────────────────────────────────────────────────────── */
function buildBall(parent: THREE.Object3D) {
  const ball = new THREE.Mesh(
    new THREE.SphereGeometry(0.080, 32, 24),
    mat("#1a1a2e", { roughness: 0.15, metalness: 0.35 }),
  );
  ball.position.set(0, -0.080, 0.096);

  // swirl pattern (canvas texture)
  const c = document.createElement("canvas"); c.width=256; c.height=256;
  const ctx = c.getContext("2d")!;
  const grad = ctx.createRadialGradient(128,128,0,128,128,128);
  grad.addColorStop(0, "#2a2a4e");
  grad.addColorStop(0.5, "#1a1a3a");
  grad.addColorStop(1, "#0a0a1e");
  ctx.fillStyle = grad; ctx.fillRect(0,0,256,256);
  // swirl lines
  ctx.strokeStyle = "#3a3a6e"; ctx.lineWidth = 2;
  for (let i = 0; i < 8; i++) {
    ctx.beginPath();
    ctx.arc(128,128, 20 + i*12, 0, Math.PI*1.8);
    ctx.stroke();
  }
  (ball.material as THREE.MeshStandardMaterial).map = new THREE.CanvasTexture(c);

  // finger holes
  for (let i = 0; i < 3; i++) {
    const hole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.010, 0.010, 0.030, 10),
      mat("#0a0a1a", { roughness: 0.9 }),
    );
    hole.position.set((i-1)*0.022, 0.062, 0.040);
    ball.add(hole);
  }

  parent.add(ball);
}

/* ─────────────────────────────────────────────────────────────────────────────
   OUTFIT SHIRT DETAILS
───────────────────────────────────────────────────────────────────────────── */
function buildOutfitDetails(torsoGrp: THREE.Object3D, outfit: string, outfitColor: string) {
  if (outfit === "bowling-shirt") {
    const collarMat = mat("#f0ece6", { roughness: 0.55 });
    // placket
    const placket = new THREE.Mesh(
      new THREE.BoxGeometry(0.026, 0.260, 0.005),
      collarMat,
    );
    placket.position.set(0, 0.200, 0.148);
    torsoGrp.add(placket);
    // buttons
    for (let i = 0; i < 5; i++) {
      const btn = new THREE.Mesh(
        new THREE.CylinderGeometry(0.007, 0.007, 0.006, 10),
        mat("#d0ccc6", { roughness: 0.4, metalness: 0.3 }),
      );
      btn.rotation.x = DEG(90);
      btn.position.set(0, 0.300 - i * 0.060, 0.152);
      torsoGrp.add(btn);
    }
    // chest pocket
    const pocket = new THREE.Mesh(
      new THREE.BoxGeometry(0.058, 0.052, 0.005),
      mat(new THREE.Color(outfitColor).multiplyScalar(0.82).getHexString().padStart(6,"0").replace(/^/,"#"), { roughness: 0.6 }),
    );
    pocket.position.set(0.080, 0.260, 0.148);
    torsoGrp.add(pocket);
    return;
  }

  if (outfit === "letterman") {
    // sleeve color blocks
    for (const sx of [-1, 1] as const) {
      const sleeve = new THREE.Mesh(
        new THREE.CylinderGeometry(0.046, 0.042, 0.140, 16),
        mat("#f0ece6", { roughness: 0.55 }),
      );
      sleeve.position.set(sx * 0.218, 0.252, 0);
      torsoGrp.add(sleeve);
    }
    // badge
    const badge = new THREE.Mesh(
      new THREE.CircleGeometry(0.036, 12),
      mat("#f0c030", { roughness: 0.45, metalness: 0.3 }),
    );
    badge.position.set(-0.080, 0.280, 0.148);
    torsoGrp.add(badge);
    return;
  }

  if (outfit === "jersey") {
    // number on front
    const numCanvas = document.createElement("canvas");
    numCanvas.width=128; numCanvas.height=128;
    const nctx = numCanvas.getContext("2d")!;
    nctx.fillStyle = "#ffffff00"; nctx.fillRect(0,0,128,128);
    nctx.fillStyle = "#ffffff";
    nctx.font = "bold 80px Arial";
    nctx.textAlign = "center"; nctx.textBaseline = "middle";
    nctx.fillText("7", 64, 64);
    const numTex = new THREE.CanvasTexture(numCanvas);
    const num = new THREE.Mesh(
      new THREE.PlaneGeometry(0.080, 0.080),
      new THREE.MeshStandardMaterial({ map: numTex, transparent: true, roughness: 0.6 }),
    );
    num.position.set(0, 0.250, 0.150);
    torsoGrp.add(num);
    return;
  }

  if (outfit === "polo") {
    const collarMat = mat(
      new THREE.Color(outfitColor).multiplyScalar(0.72).getHexString().padStart(6,"0").replace(/^/,"#"),
      { roughness: 0.55 },
    );
    // collar points
    for (const sx of [-1, 1] as const) {
      const pt = new THREE.Mesh(
        new THREE.BoxGeometry(0.028, 0.048, 0.008),
        collarMat,
      );
      pt.position.set(sx * 0.020, 0.390, 0.115);
      pt.rotation.z = sx * DEG(22);
      torsoGrp.add(pt);
    }
    return;
  }

  if (outfit === "hoodie") {
    const hoodColor = new THREE.Color(outfitColor).multiplyScalar(0.88);
    const hood = new THREE.Mesh(
      new THREE.SphereGeometry(0.162, 20, 16, 0, Math.PI*2, 0, Math.PI*0.58),
      mat("#"+hoodColor.getHexString(), { roughness: 0.7 }),
    );
    hood.position.set(0, 0.310, -0.060);
    torsoGrp.add(hood);
    // front pocket
    const pocket = new THREE.Mesh(
      new THREE.BoxGeometry(0.140, 0.060, 0.006),
      mat("#"+hoodColor.getHexString(), { roughness: 0.65 }),
    );
    pocket.position.set(0, 0.090, 0.148);
    torsoGrp.add(pocket);
    return;
  }
}

/* ─────────────────────────────────────────────────────────────────────────────
   ANIMATION JOINTS INTERFACE
───────────────────────────────────────────────────────────────────────────── */
interface AnimJoints {
  hips:     THREE.Group;
  torso:    THREE.Group;
  head:     THREE.Group;
  lShoulder:THREE.Group;
  rShoulder:THREE.Group;
  lElbow:   THREE.Group;
  rElbow:   THREE.Group;
  lHip:     THREE.Group;
  rHip:     THREE.Group;
  lKnee:    THREE.Group;
  rKnee:    THREE.Group;
}

/* ─────────────────────────────────────────────────────────────────────────────
   BUILD FULL CHARACTER  (returns animation joints)
───────────────────────────────────────────────────────────────────────────── */
function buildCharacter(
  root: THREE.Group,
  state: AvatarState,
  headGeo: THREE.BufferGeometry,
): AnimJoints {
  const skin  = SKIN_TONES[state.skinToneIdx ?? 0] ?? SKIN_TONES[0];
  const hair  = HAIR_COLORS[state.hairColor  ?? 0] ?? HAIR_COLORS[0];
  const eye   = EYE_COLORS [state.eyeColor   ?? 3] ?? EYE_COLORS[3];
  const lip   = LIP_COLORS [state.lipColor   ?? 0] ?? LIP_COLORS[0];

  const outfitPalette: Record<string, string> = {
    "bowling-shirt": "#1e3a6e",
    letterman: "#8b1a1a",
    jersey: "#1e3a6e",
    polo: "#2e6b3e",
    hoodie: "#3a3a5a",
    casual: "#4a5568",
  };
  const outfitHex = outfitPalette[state.outfit ?? "bowling-shirt"] ?? "#1e3a6e";
  const outfitMat = mat(outfitHex, { roughness: 0.7 });

  const pantHex = "#2a2a3a";
  const pantMat = mat(pantHex, { roughness: 0.72 });
  const sockMat = mat("#f0ece6", { roughness: 0.6 });

  const skinMat = mat(skin, { roughness: 0.55 });

  /* ── hips group (pivot at hip center Y=0, world-space offset applied below) ── */
  const hipsGrp = new THREE.Group();
  hipsGrp.position.set(0, -0.12, 0);
  root.add(hipsGrp);

  /* ── PANTS / belt ── */
  // hip block
  const hipBlock = new THREE.Mesh(
    (() => {
      const pts = [
        [0.00, 0.00],[0.14, 0.00],[0.155, 0.04],[0.160, 0.10],
        [0.155, 0.14],[0.14, 0.16],[0.00, 0.16],
      ].map(([x,y]) => new THREE.Vector2(x,y));
      return new THREE.LatheGeometry(pts, 24);
    })(),
    pantMat,
  );
  hipBlock.position.set(0, -0.16, 0);
  hipsGrp.add(hipBlock);

  // belt
  const belt = new THREE.Mesh(
    new THREE.TorusGeometry(0.158, 0.014, 6, 28),
    mat("#4a3020", { roughness: 0.6, metalness: 0.1 }),
  );
  belt.position.set(0, 0.000, 0);
  hipsGrp.add(belt);

  // buckle
  const buckle = new THREE.Mesh(
    new THREE.BoxGeometry(0.044, 0.028, 0.006),
    mat("#c9a84c", { roughness: 0.3, metalness: 0.8 }),
  );
  buckle.position.set(0, 0.000, 0.162);
  hipsGrp.add(buckle);

  /* ── LEG setup ── */
  function buildLeg(side: -1 | 1): { hipJoint: THREE.Group; kneeGrp: THREE.Group; ankleGrp: THREE.Group } {
    const hipJoint = new THREE.Group();
    hipJoint.position.set(side * 0.088, -0.000, 0);
    hipsGrp.add(hipJoint);

    // upper thigh
    const thigh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.058, 0.050, 0.280, 14),
      pantMat,
    );
    thigh.position.set(0, -0.140, 0);
    hipJoint.add(thigh);

    // knee joint sphere
    const kneeSphere = new THREE.Mesh(new THREE.SphereGeometry(0.048, 14, 10), pantMat);
    kneeSphere.position.set(0, -0.280, 0);
    hipJoint.add(kneeSphere);

    const kneeGrp = new THREE.Group();
    kneeGrp.position.set(0, -0.280, 0);
    hipJoint.add(kneeGrp);

    // lower leg / shin
    const shin = new THREE.Mesh(
      new THREE.CylinderGeometry(0.046, 0.038, 0.280, 12),
      pantMat,
    );
    shin.position.set(0, -0.140, 0);
    kneeGrp.add(shin);

    const ankleGrp = new THREE.Group();
    ankleGrp.position.set(0, -0.280, 0);
    kneeGrp.add(ankleGrp);

    // sock
    const sock = new THREE.Mesh(
      new THREE.CylinderGeometry(0.036, 0.034, 0.070, 12),
      sockMat,
    );
    sock.position.set(0, -0.035, 0);
    ankleGrp.add(sock);

    buildShoe(ankleGrp, side);

    return { hipJoint, kneeGrp, ankleGrp };
  }

  const { hipJoint: lHipJoint, kneeGrp: lKneeGrp, ankleGrp: lAnkleGrp } = buildLeg(-1);
  const { hipJoint: rHipJoint, kneeGrp: rKneeGrp                       } = buildLeg( 1);
  // slight hip pose
  lHipJoint.rotation.z =  DEG( 2);
  rHipJoint.rotation.z =  DEG(-2);

  /* ── TORSO ── */
  const torsoGrp = new THREE.Group();
  torsoGrp.position.set(0, 0.00, 0);
  hipsGrp.add(torsoGrp);

  // shirt body via lathe
  const shirtPts = [
    [0.00, 0.00],[0.148, 0.00],[0.155, 0.04],[0.158, 0.10],
    [0.155, 0.16],[0.150, 0.22],[0.145, 0.28],[0.148, 0.34],
    [0.152, 0.38],[0.148, 0.42],[0.00, 0.42],
  ].map(([x,y]) => new THREE.Vector2(x,y));
  const shirtBody = new THREE.Mesh(
    new THREE.LatheGeometry(shirtPts, 24),
    outfitMat,
  );
  shirtBody.position.set(0, 0.00, 0);
  torsoGrp.add(shirtBody);

  // inner chest (skin visible at collar)
  const chest = new THREE.Mesh(
    new THREE.CylinderGeometry(0.120, 0.148, 0.420, 20),
    skinMat,
  );
  chest.position.set(0, 0.210, 0);
  torsoGrp.add(chest);

  buildOutfitDetails(torsoGrp, state.outfit ?? "bowling-shirt", outfitHex);

  /* ── SHOULDER CAPS (visual bridge) ── */
  for (const sx of [-1, 1] as const) {
    const cap = new THREE.Mesh(
      new THREE.SphereGeometry(0.058, 16, 12),
      outfitMat,
    );
    cap.position.set(sx * 0.200, 0.390, 0);
    torsoGrp.add(cap);
  }

  /* ── ARMS ── */
  function buildArm(side: -1 | 1): { shoulderGrp: THREE.Group; elbowGrp: THREE.Group; wristGrp: THREE.Group } {
    const shoulderGrp = new THREE.Group();
    shoulderGrp.position.set(side * 0.200, 0.390, 0);
    torsoGrp.add(shoulderGrp);

    const upper = new THREE.Mesh(
      new THREE.CylinderGeometry(0.040, 0.034, 0.240, 12),
      outfitMat,
    );
    upper.position.set(0, -0.120, 0);
    shoulderGrp.add(upper);

    const elbowSphere = new THREE.Mesh(new THREE.SphereGeometry(0.032, 12, 10), outfitMat);
    elbowSphere.position.set(0, -0.240, 0);
    shoulderGrp.add(elbowSphere);

    const elbowGrp = new THREE.Group();
    elbowGrp.position.set(0, -0.240, 0);
    shoulderGrp.add(elbowGrp);

    const forearm = new THREE.Mesh(
      new THREE.CylinderGeometry(0.030, 0.026, 0.220, 12),
      skinMat,
    );
    forearm.position.set(0, -0.110, 0);
    elbowGrp.add(forearm);

    const wristSphere = new THREE.Mesh(new THREE.SphereGeometry(0.026, 10, 8), skinMat);
    wristSphere.position.set(0, -0.220, 0);
    elbowGrp.add(wristSphere);

    const wristGrp = new THREE.Group();
    wristGrp.position.set(0, -0.220, 0);
    elbowGrp.add(wristGrp);

    buildHand(wristGrp, side, skin);

    return { shoulderGrp, elbowGrp, wristGrp };
  }

  const { shoulderGrp: lShoulderGrp, elbowGrp: lElbowGrp } = buildArm(-1);
  const { shoulderGrp: rShoulderGrp, elbowGrp: rElbowGrp } = buildArm( 1);

  // left arm natural hang
  lShoulderGrp.rotation.z =  DEG( 8);
  lElbowGrp.rotation.z    = DEG(-6);

  // right arm ball-holding pose
  rShoulderGrp.rotation.x = DEG(64);
  rShoulderGrp.rotation.z = DEG(-10);
  rElbowGrp.rotation.x    = DEG(-82);

  buildBall(rElbowGrp);

  /* ── COLLAR / TRAPEZIUS bridge between shoulders and neck ── */
  const collar = new THREE.Mesh(
    new THREE.SphereGeometry(0.165, 24, 16, 0, Math.PI*2, 0, Math.PI*0.55),
    outfitMat,
  );
  collar.position.set(0, 0.380, 0);
  collar.scale.set(1.0, 0.55, 1.0);
  torsoGrp.add(collar);

  // shirt collar opening (slight darker ring)
  const collarRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.062, 0.012, 10, 24),
    mat(new THREE.Color(outfitHex).multiplyScalar(0.78).getHexString().padStart(6,"0").replace(/^/,"#"), { roughness: 0.65 }),
  );
  collarRing.rotation.x = DEG(90);
  collarRing.position.set(0, 0.430, 0.012);
  torsoGrp.add(collarRing);

  /* ── NECK (extended, connects to head & shoulder bridge) ── */
  const neck = new THREE.Mesh(
    new THREE.CylinderGeometry(0.052, 0.072, 0.210, 20),
    skinMat,
  );
  neck.position.set(0, 0.525, 0);
  torsoGrp.add(neck);

  // adam's apple (males) / soft thyroid bump
  if (state.gender !== "female") {
    const adam = new THREE.Mesh(
      new THREE.SphereGeometry(0.014, 10, 8),
      skinMat,
    );
    adam.position.set(0, 0.490, 0.052);
    adam.scale.set(1.0, 0.7, 0.5);
    torsoGrp.add(adam);
  }

  // jaw underside / chin shadow connection
  const jawBase = new THREE.Mesh(
    new THREE.SphereGeometry(0.078, 16, 12, 0, Math.PI*2, Math.PI*0.45, Math.PI*0.55),
    mat(new THREE.Color(skin).multiplyScalar(0.88).getHexString().padStart(6,"0").replace(/^/,"#"), { roughness: 0.6 }),
  );
  jawBase.position.set(0, 0.620, 0);
  torsoGrp.add(jawBase);

  /* ── FACE-SHAPE adaptive scales (used for hair, beard, headwear) ── */
  const FACE_SCALE: Record<string, { sx: number; sy: number; dy: number }> = {
    oval:    { sx: 0.92, sy: 1.16, dy:  0.012 },
    round:   { sx: 1.08, sy: 0.98, dy: -0.008 },
    square:  { sx: 1.06, sy: 0.94, dy: -0.006 },
    heart:   { sx: 1.10, sy: 1.04, dy:  0.006 },
    diamond: { sx: 0.96, sy: 1.08, dy:  0.004 },
  };
  const fScale = FACE_SCALE[state.faceShape ?? "oval"] ?? FACE_SCALE.oval;

  /* ── HEAD group ── */
  const headGrp = new THREE.Group();
  headGrp.position.set(0, 0.830, 0);
  torsoGrp.add(headGrp);

  // head mesh with morph targets
  const headMesh = new THREE.Mesh(
    headGeo.clone(),
    mat(skin, { roughness: 0.50, metalness: 0.02 }),
  );
  headMesh.morphTargetInfluences = [0,0,0,0,0];
  const shapeIdx: Record<string,number> = { oval:0, round:1, square:2, heart:3, diamond:4 };
  const si = shapeIdx[state.faceShape ?? "oval"] ?? 0;
  headMesh.morphTargetInfluences[si] = 1.0;
  headGrp.add(headMesh);

  // back-of-head darker layer (subtle AO at hairline)
  const aoBack = new THREE.Mesh(
    new THREE.SphereGeometry(0.221, 28, 20, 0, Math.PI*2, 0, Math.PI*0.45),
    mat(new THREE.Color(skin).multiplyScalar(0.86).getHexString().padStart(6,"0").replace(/^/,"#"), { roughness: 0.85 }),
  );
  aoBack.position.set(0, 0.000, -0.003);
  headGrp.add(aoBack);

  // eyes
  buildEye(headGrp, -1, eye, state.eyeShape ?? "almond", state.eyelashes ?? true);
  buildEye(headGrp,  1, eye, state.eyeShape ?? "almond", state.eyelashes ?? true);

  // eyebrows
  buildBrow(headGrp, -1, state.browStyle ?? "arched", hair);
  buildBrow(headGrp,  1, state.browStyle ?? "arched", hair);

  // nose
  buildNose(headGrp, state.noseStyle ?? "straight", skin);

  // mouth
  buildMouth(headGrp, state.mouthShape ?? "neutral", lip);

  // ears
  buildEar(headGrp, -1, state.earSize ?? "medium", skin, state.earrings ?? false);
  buildEar(headGrp,  1, state.earSize ?? "medium", skin, state.earrings ?? false);

  // optional features
  if (state.freckles) buildFreckles(headGrp, skin);
  if (state.age === "mature") buildAgingMarks(headGrp, skin);

  /* hair — wrapped in face-adaptive group so it scales with face */
  const hairGrp = new THREE.Group();
  hairGrp.scale.set(fScale.sx, fScale.sy, fScale.sx);
  hairGrp.position.y = fScale.dy;
  headGrp.add(hairGrp);
  buildHair(hairGrp, state.hairStyle ?? "short", hair);

  /* facial hair — adapts to face shape (jaw width) */
  if (state.gender !== "female") {
    const beardGrp = new THREE.Group();
    beardGrp.scale.set(fScale.sx, fScale.sy * 0.95, fScale.sx);
    beardGrp.position.y = fScale.dy * 0.5;
    headGrp.add(beardGrp);
    buildFacialHair(beardGrp, state.facialHair ?? "none", hair);
  }

  // eyewear
  buildEyewear(headGrp, state.eyewear ?? "none");

  // headwear (also adapts to face shape)
  const hatGrp = new THREE.Group();
  hatGrp.scale.set(fScale.sx, fScale.sy, fScale.sx);
  hatGrp.position.y = fScale.dy;
  headGrp.add(hatGrp);
  buildHeadwear(hatGrp, state.headwear ?? "none", skin);

  return {
    hips:      hipsGrp,
    torso:     torsoGrp,
    head:      headGrp,
    lShoulder: lShoulderGrp,
    rShoulder: rShoulderGrp,
    lElbow:    lElbowGrp,
    rElbow:    rElbowGrp,
    lHip:      lHipJoint,
    rHip:      rHipJoint,
    lKnee:     lKneeGrp,
    rKnee:     rKneeGrp,
  };
}

/* ─────────────────────────────────────────────────────────────────────────────
   IDLE ANIMATION
───────────────────────────────────────────────────────────────────────────── */
function applyIdle(j: AnimJoints, t: number) {
  // hips: subtle sway + weight-shift bob
  j.hips.position.x  = Math.sin(t * 0.9) * 0.008;
  j.hips.position.y  = -0.12 + Math.sin(t * 1.8) * 0.003;
  j.hips.rotation.z  = Math.sin(t * 0.9) * DEG(1.4);

  // torso: breathing counter-sway
  j.torso.rotation.z = -Math.sin(t * 0.9) * DEG(0.7);
  j.torso.rotation.x = Math.sin(t * 0.45) * DEG(0.5);

  // head: gentle nod + follow hips
  j.head.rotation.y  = Math.sin(t * 0.55) * DEG(3.5);
  j.head.rotation.x  = Math.sin(t * 0.80) * DEG(1.5);

  // left arm: idle swing
  j.lShoulder.rotation.x = DEG( 8) + Math.sin(t * 0.9 + Math.PI) * DEG(4);
  j.lShoulder.rotation.z = DEG( 8) + Math.sin(t * 0.9) * DEG(1.5);
  j.lElbow.rotation.z    = DEG(-6) + Math.sin(t * 0.9) * DEG(2);

  // right arm: locked on ball, subtle breathe only
  j.rShoulder.rotation.x = DEG(64) + Math.sin(t * 0.45) * DEG(1.2);
  j.rShoulder.rotation.z = DEG(-10);
  j.rElbow.rotation.x    = DEG(-82) + Math.sin(t * 0.45) * DEG(0.8);

  // legs: weight-shift
  j.lHip.rotation.x = Math.sin(t * 0.45) * DEG(0.8);
  j.rHip.rotation.x = -Math.sin(t * 0.45) * DEG(0.8);
  j.lKnee.rotation.x = Math.sin(t * 0.45 + 0.4) * DEG(0.5);
  j.rKnee.rotation.x = -Math.sin(t * 0.45 + 0.4) * DEG(0.5);
}

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────────────────────────── */
export default function BowlerCharacter3D({ state }: { state: AvatarState }) {
  const mountRef  = useRef<THREE.Group>(null);
  const jointsRef = useRef<AnimJoints | null>(null);

  const headGeo = useMemo(() => buildHeadGeo(), []);

  useEffect(() => {
    if (!mountRef.current) return;
    // dispose previous scene
    mountRef.current.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const m = obj as THREE.Mesh;
        m.geometry?.dispose();
        if (Array.isArray(m.material)) m.material.forEach(x => x.dispose());
        else (m.material as THREE.Material)?.dispose();
      }
    });
    mountRef.current.clear();
    jointsRef.current = buildCharacter(mountRef.current, state, headGeo);
    // enable shadow casting on every mesh
    mountRef.current.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
      }
    });
  }, [state, headGeo]);

  useFrame(({ clock }) => {
    if (!jointsRef.current) return;
    applyIdle(jointsRef.current, clock.getElapsedTime());
  });

  return <group ref={mountRef} />;
}
