"use client";

import { useMemo, useState } from "react";

const CREAM = "#f5f0e6";
const ORANGE = "#e46a2e";
const TEXT_ORANGE = "#c75a1d";

type AvatarState = {
  name: string;
  preset: PresetKey;
  body: "slim" | "classic" | "broad";
  skinTone: "porcelain" | "sand" | "tan" | "brown" | "deep";
  hair: "pompadour" | "waves" | "bob" | "buzz" | "ponytail";
  hairColor: "black" | "brown" | "blonde" | "red";
  outfit: "bowling" | "diner" | "greaser" | "workwear" | "prom";
  accessory: "none" | "glasses" | "cap" | "bowtie" | "scarf";
  accent: "mint" | "sky" | "cherry" | "mustard" | "navy";
};

type PresetKey =
  | "atomic"
  | "diner"
  | "greaser"
  | "league"
  | "mechanic"
  | "prom";

const PRESETS: Record<PresetKey, { title: string; desc: string; apply: Partial<AvatarState> }> = {
  atomic: {
    title: "Atomic Age",
    desc: "Clean-cut, bright accents, classic 50s optimism.",
    apply: { outfit: "bowling", accessory: "none", hair: "waves", accent: "mint" }
  },
  diner: {
    title: "Diner Regular",
    desc: "Milkshake energy. Friendly, casual, timeless.",
    apply: { outfit: "diner", accessory: "glasses", hair: "bob", accent: "cherry" }
  },
  greaser: {
    title: "Greaser",
    desc: "Leather, swagger, and a little rebellion.",
    apply: { outfit: "greaser", accessory: "none", hair: "pompadour", accent: "navy" }
  },
  league: {
    title: "Bowling League",
    desc: "Team-ready with a classic bowling shirt look.",
    apply: { outfit: "bowling", accessory: "cap", hair: "buzz", accent: "sky" }
  },
  mechanic: {
    title: "Workshop Mechanic",
    desc: "Practical workwear with a retro edge.",
    apply: { outfit: "workwear", accessory: "scarf", hair: "buzz", accent: "mustard" }
  },
  prom: {
    title: "Prom Night",
    desc: "Polished, bright, and camera-ready.",
    apply: { outfit: "prom", accessory: "bowtie", hair: "ponytail", accent: "cherry" }
  }
};

const SKIN_TONES: Record<AvatarState["skinTone"], string> = {
  porcelain: "#f6dfd2",
  sand: "#f0caa8",
  tan: "#d9a477",
  brown: "#b67952",
  deep: "#7a4b34"
};

const HAIR_COLORS: Record<AvatarState["hairColor"], string> = {
  black: "#1f1b18",
  brown: "#4b2f22",
  blonde: "#d9c18a",
  red: "#a44a34"
};

const ACCENTS: Record<AvatarState["accent"], string> = {
  mint: "#66c7b5",
  sky: "#67aee9",
  cherry: "#e24a5a",
  mustard: "#d1a437",
  navy: "#2f3f69"
};

function clampName(s: string) {
  return s.replace(/\s+/g, " ").trim().slice(0, 24);
}

export default function AvatarPage() {
  const [state, setState] = useState<AvatarState>({
    name: "",
    preset: "atomic",
    body: "classic",
    skinTone: "sand",
    hair: "waves",
    hairColor: "brown",
    outfit: "bowling",
    accessory: "none",
    accent: "mint"
  });

  const accentColor = ACCENTS[state.accent];
  const skinColor = SKIN_TONES[state.skinTone];
  const hairColor = HAIR_COLORS[state.hairColor];

  const outfitLabel = useMemo(() => {
    switch (state.outfit) {
      case "bowling": return "Bowling Shirt";
      case "diner": return "Diner Fit";
      case "greaser": return "Leather Look";
      case "workwear": return "Workwear";
      case "prom": return "Prom Formal";
    }
  }, [state.outfit]);

  function applyPreset(key: PresetKey) {
    const preset = PRESETS[key];
    setState(prev => ({
      ...prev,
      preset: key,
      ...preset.apply
    }));
  }

  // Simple “save” placeholder (we’ll wire to Supabase later)
  function saveAvatar() {
    const name = clampName(state.name);
    if (!name) {
      alert("Please enter a name for your avatar.");
      return;
    }
    alert(`Avatar saved (stub): ${name}\n\nNext step: wire to Supabase tables.`);
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: CREAM,
        fontFamily: "Montserrat, system-ui",
        padding: "2rem 1rem 3rem",
        color: TEXT_ORANGE
      }}
    >
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
        <img src="/1@300x.png" alt="Dux Bowling" style={{ maxWidth: 160, width: "100%" }} />
      </div>

      <div style={{ maxWidth: 860, margin: "0 auto", display: "grid", gap: "1rem" }}>
        <h1 style={{ textAlign: "center", margin: 0, color: ORANGE }}>
          Create Your Retro Avatar
        </h1>
        <p style={{ textAlign: "center", marginTop: 0, color: TEXT_ORANGE }}>
          Choose an Atomic Age look and customize details. (More styles coming soon.)
        </p>

        {/* Main layout */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: "1rem"
          }}
        >
          {/* Preview Card */}
          <section
            style={{
              background: "#fff",
              borderRadius: 16,
              padding: "1rem",
              boxShadow: "0 12px 30px rgba(0,0,0,0.08)"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <div style={{ fontWeight: 900, color: ORANGE }}>Preview</div>
              <div style={{ fontSize: ".9rem", color: "#7a5a45" }}>{outfitLabel}</div>
            </div>

            <div style={{ marginTop: "1rem", display: "grid", placeItems: "center" }}>
              <AvatarPaperDoll
                body={state.body}
                skinColor={skinColor}
                hairStyle={state.hair}
                hairColor={hairColor}
                outfit={state.outfit}
                accessory={state.accessory}
                accentColor={accentColor}
              />
              <div style={{ marginTop: ".75rem", fontWeight: 800, color: ORANGE }}>
                {clampName(state.name) || "Unnamed Bowler"}
              </div>
            </div>
          </section>

          {/* Controls Card */}
          <section
            style={{
              background: "#fff",
              borderRadius: 16,
              padding: "1rem",
              boxShadow: "0 12px 30px rgba(0,0,0,0.08)"
            }}
          >
            <div style={{ fontWeight: 900, color: ORANGE, marginBottom: ".75rem" }}>
              Presets
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: ".6rem"
              }}
            >
              {(Object.keys(PRESETS) as PresetKey[]).map(key => {
                const p = PRESETS[key];
                const active = state.preset === key;
                return (
                  <button
                    key={key}
                    onClick={() => applyPreset(key)}
                    style={{
                      textAlign: "left",
                      padding: ".75rem",
                      borderRadius: 14,
                      border: active ? `2px solid ${ORANGE}` : "1px solid #ddd",
                      background: active ? "#fff7f1" : "#fff",
                      cursor: "pointer"
                    }}
                  >
                    <div style={{ fontWeight: 900, color: ORANGE }}>{p.title}</div>
                    <div style={{ fontSize: ".85rem", color: "#7a5a45" }}>{p.desc}</div>
                  </button>
                );
              })}
            </div>

            <hr style={{ border: "none", borderTop: "1px solid #eee", margin: "1rem 0" }} />

            <div style={{ display: "grid", gap: ".8rem" }}>
              <label style={{ display: "grid", gap: ".25rem", fontSize: ".9rem" }}>
                Avatar Name
                <input
                  value={state.name}
                  onChange={(e) => setState(s => ({ ...s, name: e.target.value }))}
                  placeholder="e.g., Andy"
                  style={{
                    padding: ".7rem",
                    borderRadius: 12,
                    border: "1px solid #ddd"
                  }}
                />
              </label>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: ".75rem" }}>
                <Select
                  label="Body"
                  value={state.body}
                  onChange={(v) => setState(s => ({ ...s, body: v as any }))}
                  options={[
                    ["slim", "Slim"],
                    ["classic", "Classic"],
                    ["broad", "Broad"]
                  ]}
                />
                <Select
                  label="Skin Tone"
                  value={state.skinTone}
                  onChange={(v) => setState(s => ({ ...s, skinTone: v as any }))}
                  options={[
                    ["porcelain", "Porcelain"],
                    ["sand", "Sand"],
                    ["tan", "Tan"],
                    ["brown", "Brown"],
                    ["deep", "Deep"]
                  ]}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: ".75rem" }}>
                <Select
                  label="Hair"
                  value={state.hair}
                  onChange={(v) => setState(s => ({ ...s, hair: v as any }))}
                  options={[
                    ["pompadour", "Pompadour"],
                    ["waves", "Waves"],
                    ["bob", "Bob"],
                    ["buzz", "Buzz"],
                    ["ponytail", "Ponytail"]
                  ]}
                />
                <Select
                  label="Hair Color"
                  value={state.hairColor}
                  onChange={(v) => setState(s => ({ ...s, hairColor: v as any }))}
                  options={[
                    ["black", "Black"],
                    ["brown", "Brown"],
                    ["blonde", "Blonde"],
                    ["red", "Red"]
                  ]}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: ".75rem" }}>
                <Select
                  label="Outfit"
                  value={state.outfit}
                  onChange={(v) => setState(s => ({ ...s, outfit: v as any }))}
                  options={[
                    ["bowling", "Bowling Shirt"],
                    ["diner", "Diner Fit"],
                    ["greaser", "Leather Look"],
                    ["workwear", "Workwear"],
                    ["prom", "Prom Formal"]
                  ]}
                />
                <Select
                  label="Accessory"
                  value={state.accessory}
                  onChange={(v) => setState(s => ({ ...s, accessory: v as any }))}
                  options={[
                    ["none", "None"],
                    ["glasses", "Glasses"],
                    ["cap", "Cap"],
                    ["bowtie", "Bowtie"],
                    ["scarf", "Scarf"]
                  ]}
                />
              </div>

              <Select
                label="Accent Color"
                value={state.accent}
                onChange={(v) => setState(s => ({ ...s, accent: v as any }))}
                options={[
                  ["mint", "Mint"],
                  ["sky", "Sky"],
                  ["cherry", "Cherry"],
                  ["mustard", "Mustard"],
                  ["navy", "Navy"]
                ]}
              />

              <button
                onClick={saveAvatar}
                style={{
                  width: "100%",
                  border: "none",
                  borderRadius: 14,
                  padding: "1rem",
                  fontWeight: 900,
                  background: ORANGE,
                  color: "#fff",
                  cursor: "pointer",
                  marginTop: ".25rem"
                }}
              >
                Save Avatar
              </button>

              <div style={{ fontSize: ".85rem", color: "#7a5a45", textAlign: "center" }}>
                Next: we’ll store this to Supabase and tie it to skins & achievements.
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

/* -----------------------------
   Small Components
------------------------------ */

function Select(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: [string, string][];
}) {
  return (
    <label style={{ display: "grid", gap: ".25rem", fontSize: ".9rem" }}>
      {props.label}
      <select
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        style={{
          padding: ".7rem",
          borderRadius: 12,
          border: "1px solid #ddd",
          background: "#fff"
        }}
      >
        {props.options.map(([v, label]) => (
          <option key={v} value={v}>{label}</option>
        ))}
      </select>
    </label>
  );
}

/* -----------------------------
   Avatar Renderer (CSS “paper doll”)
   - No images required (safe MVP)
   - Later we can swap to layered SVG/PNG skins
------------------------------ */

function AvatarPaperDoll(props: {
  body: "slim" | "classic" | "broad";
  skinColor: string;
  hairStyle: AvatarState["hair"];
  hairColor: string;
  outfit: AvatarState["outfit"];
  accessory: AvatarState["accessory"];
  accentColor: string;
}) {
  const { body, skinColor, hairStyle, hairColor, outfit, accessory, accentColor } = props;

  const bodyWidth = body === "slim" ? 120 : body === "broad" ? 150 : 135;
  const jacket = outfit === "greaser";
  const diner = outfit === "diner";
  const workwear = outfit === "workwear";
  const prom = outfit === "prom";
  const bowling = outfit === "bowling";

  const shirtColor = bowling ? "#ffffff" : diner ? "#fff7f1" : workwear ? "#f3efe6" : prom ? "#ffffff" : "#2a2a2a";
  const pantsColor = prom ? "#2f2f2f" : "#2f3f69";
  const jacketColor = jacket ? "#232323" : "#ffffff";

  // Hair silhouette
  const hairShape = (() => {
    switch (hairStyle) {
      case "pompadour": return { borderRadius: "22px 22px 28px 28px", height: 34, top: 20 };
      case "waves": return { borderRadius: "26px", height: 30, top: 22 };
      case "bob": return { borderRadius: "20px 20px 18px 18px", height: 36, top: 22 };
      case "buzz": return { borderRadius: "18px", height: 18, top: 28 };
      case "ponytail": return { borderRadius: "22px", height: 30, top: 22 };
    }
  })();

  return (
    <div
      style={{
        width: 240,
        height: 280,
        borderRadius: 18,
        background: "linear-gradient(180deg, #fff 0%, #fff7f1 100%)",
        border: "1px solid #eee",
        boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
        position: "relative",
        overflow: "hidden"
      }}
      aria-label="Avatar preview"
    >
      {/* Backdrop stripes (retro) */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `repeating-linear-gradient(
            135deg,
            rgba(228,106,46,0.08),
            rgba(228,106,46,0.08) 10px,
            rgba(102,199,181,0.06) 10px,
            rgba(102,199,181,0.06) 20px
          )`
        }}
      />

      {/* Head */}
      <div
        style={{
          position: "absolute",
          top: 52,
          left: "50%",
          transform: "translateX(-50%)",
          width: 90,
          height: 90,
          borderRadius: "50%",
          background: skinColor,
          boxShadow: "inset 0 -6px 0 rgba(0,0,0,0.07)"
        }}
      />

      {/* Hair */}
      <div
        style={{
          position: "absolute",
          top: hairShape.top,
          left: "50%",
          transform: "translateX(-50%)",
          width: 96,
          height: hairShape.height,
          borderRadius: hairShape.borderRadius,
          background: hairColor,
          boxShadow: "inset 0 -5px 0 rgba(255,255,255,0.08)"
        }}
      />

      {/* Ponytail */}
      {hairStyle === "ponytail" && (
        <div
          style={{
            position: "absolute",
            top: 48,
            left: "50%",
            transform: "translateX(38px)",
            width: 26,
            height: 56,
            borderRadius: 16,
            background: hairColor
          }}
        />
      )}

      {/* Glasses */}
      {accessory === "glasses" && (
        <div
          style={{
            position: "absolute",
            top: 92,
            left: "50%",
            transform: "translateX(-50%)",
            width: 92,
            height: 26,
            display: "flex",
            gap: 10,
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          <div style={{ width: 36, height: 22, borderRadius: 10, border: `3px solid ${accentColor}` }} />
          <div style={{ width: 10, height: 4, background: accentColor, borderRadius: 2 }} />
          <div style={{ width: 36, height: 22, borderRadius: 10, border: `3px solid ${accentColor}` }} />
        </div>
      )}

      {/* Body */}
      <div
        style={{
          position: "absolute",
          top: 138,
          left: "50%",
          transform: "translateX(-50%)",
          width: bodyWidth,
          height: 120,
          borderRadius: 18,
          background: shirtColor,
          border: "1px solid rgba(0,0,0,0.06)",
          boxShadow: "inset 0 -10px 0 rgba(0,0,0,0.05)"
        }}
      />

      {/* Jacket overlay for greaser */}
      {jacket && (
        <div
          style={{
            position: "absolute",
            top: 138,
            left: "50%",
            transform: "translateX(-50%)",
            width: bodyWidth,
            height: 120,
            borderRadius: 18,
            background: jacketColor,
            opacity: 0.95
          }}
        />
      )}

      {/* Bowling stripe + patch */}
      {bowling && (
        <>
          <div
            style={{
              position: "absolute",
              top: 150,
              left: "50%",
              transform: "translateX(-50%)",
              width: bodyWidth - 16,
              height: 12,
              borderRadius: 10,
              background: accentColor
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 168,
              left: "50%",
              transform: "translateX(-40px)",
              width: 42,
              height: 18,
              borderRadius: 10,
              background: "rgba(0,0,0,0.06)"
            }}
          />
        </>
      )}

      {/* Diner collar */}
      {diner && (
        <div
          style={{
            position: "absolute",
            top: 142,
            left: "50%",
            transform: "translateX(-50%)",
            width: bodyWidth - 30,
            height: 22,
            borderRadius: 10,
            background: accentColor,
            opacity: 0.25
          }}
        />
      )}

      {/* Workwear pocket */}
      {workwear && (
        <div
          style={{
            position: "absolute",
            top: 178,
            left: "50%",
            transform: "translateX(24px)",
            width: 34,
            height: 30,
            borderRadius: 8,
            border: `2px solid rgba(0,0,0,0.12)`
          }}
        />
      )}

      {/* Bowtie */}
      {accessory === "bowtie" && (
        <div
          style={{
            position: "absolute",
            top: 150,
            left: "50%",
            transform: "translateX(-50%)",
            width: 48,
            height: 24
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 6,
              width: 18,
              height: 12,
              borderRadius: 4,
              background: accentColor
            }}
          />
          <div
            style={{
              position: "absolute",
              right: 0,
              top: 6,
              width: 18,
              height: 12,
              borderRadius: 4,
              background: accentColor
            }}
          />
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 9,
              transform: "translateX(-50%)",
              width: 10,
              height: 10,
              borderRadius: 999,
              background: accentColor
            }}
          />
        </div>
      )}

      {/* Scarf */}
      {accessory === "scarf" && (
        <div
          style={{
            position: "absolute",
            top: 150,
            left: "50%",
            transform: "translateX(-50%)",
            width: bodyWidth - 36,
            height: 18,
            borderRadius: 10,
            background: accentColor,
            opacity: 0.8
          }}
        />
      )}

      {/* Cap */}
      {accessory === "cap" && (
        <div
          style={{
            position: "absolute",
            top: 42,
            left: "50%",
            transform: "translateX(-50%)",
            width: 108,
            height: 40,
            borderRadius: "24px 24px 18px 18px",
            background: accentColor,
            boxShadow: "inset 0 -6px 0 rgba(0,0,0,0.08)"
          }}
        />
      )}

      {/* Pants */}
      <div
        style={{
          position: "absolute",
          bottom: 22,
          left: "50%",
          transform: "translateX(-50%)",
          width: bodyWidth - 12,
          height: 52,
          borderRadius: 14,
          background: pantsColor,
          opacity: prom ? 0.95 : 0.85
        }}
      />

      {/* Retro badge */}
      <div
        style={{
          position: "absolute",
          right: 10,
          top: 10,
          padding: "6px 10px",
          borderRadius: 999,
          background: "rgba(255,255,255,0.75)",
          border: "1px solid rgba(0,0,0,0.06)",
          fontSize: ".75rem",
          fontWeight: 900,
          color: ORANGE
        }}
      >
        1950s
      </div>
    </div>
  );
}