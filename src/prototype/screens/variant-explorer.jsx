import React from 'react';
import { Icon } from '../icons';
import { SCHEMES, SchemeSwatch } from '../schemes';
import { MiniCreative, LAYOUTS } from '../creative-preview';

// ============================================================
// VARIANT EXPLORER — intent-first creation.
// Describe what you want → six live treatments → pick a direction → refine.
// Reusable: lives on its own and inside the Vehicle Hub.
// ============================================================

// Heuristic "understanding" of the prompt → biases scheme/layout/language.
// Honest prototype stand-in for the real AI call we wire to /api/ai later.
function deriveVariants(prompt, langMode) {
  const p = (prompt || "").toLowerCase();
  const pick = [];

  const wants = (...words) => words.some((w) => p.includes(w));
  const schemeOrder = [];
  if (wants("spanish", "español", "espanol", "bilingual", "latino")) schemeOrder.push("warm-es");
  if (wants("urgent", "now", "today", "sale", "price drop", "fast")) schemeOrder.push("urgency");
  if (wants("truck", "work", "haul", "tow", "4x4", "rugged")) schemeOrder.push("blackout");
  if (wants("family", "suv", "safe", "kids", "room")) schemeOrder.push("fresh");
  if (wants("luxury", "premium", "clean", "low-key", "lux")) schemeOrder.push("luxe");
  if (wants("trust", "credit", "approve", "finance")) schemeOrder.push("trust");
  // fill the rest with remaining schemes for variety
  for (const s of SCHEMES) if (!schemeOrder.includes(s.id)) schemeOrder.push(s.id);

  const langForIndex = (i) => {
    if (langMode === "en") return "en";
    if (langMode === "es") return "es";
    return i % 2 === 0 ? "en" : "es"; // "both" → alternate
  };

  for (let i = 0; i < 6; i++) {
    pick.push({
      key: `${schemeOrder[i % schemeOrder.length]}-${i}`,
      schemeId: schemeOrder[i % schemeOrder.length],
      layout: LAYOUTS[i % LAYOUTS.length],
      lang: langForIndex(i),
    });
  }
  return pick;
}

function VariantExplorer({ vehicle, compact = false, onUseVariant, toast }) {
  const [prompt, setPrompt] = React.useState("");
  const [langMode, setLangMode] = React.useState("both"); // en | es | both
  const [variants, setVariants] = React.useState(() => deriveVariants("", "both"));
  const [generating, setGenerating] = React.useState(false);
  const [revealed, setRevealed] = React.useState(6);
  const [selected, setSelected] = React.useState(null);

  const generate = () => {
    setGenerating(true);
    setSelected(null);
    setRevealed(0);
    const next = deriveVariants(prompt, langMode);
    setVariants(next);
    // staggered reveal for the "building" feel
    let n = 0;
    const tick = () => {
      n += 1;
      setRevealed(n);
      if (n < 6) setTimeout(tick, 140);
      else setGenerating(false);
    };
    setTimeout(tick, 200);
  };

  const suggestions = [
    "Push this to Spanish-speaking buyers, lead with low down",
    "Urgent price-drop sale, drive it home today",
    "Work-ready truck for tradespeople",
    "Family-safe, clean, room for everyone",
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Intent prompt bar */}
      <div style={{
        background: "linear-gradient(135deg, var(--primary), #0891B2)",
        borderRadius: "var(--radius-lg)", padding: compact ? 12 : 16, color: "#fff",
        boxShadow: "var(--shadow)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 8 }}>
          <Icon.Sparkles size={15} />
          <span style={{ fontWeight: 800, fontSize: 13 }}>Describe the campaign — watch it build</span>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "stretch" }}>
          <input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") generate(); }}
            placeholder="e.g. Push this Silverado to Spanish buyers on FB + TikTok, lead with low down"
            style={{
              flex: 1, border: "none", borderRadius: "var(--radius)", padding: "10px 12px",
              fontSize: 13, fontFamily: "inherit", color: "var(--text)", outline: "none",
            }}
          />
          {/* Language toggle */}
          <div style={{ display: "flex", background: "rgba(255,255,255,0.18)", borderRadius: "var(--radius)", padding: 3 }}>
            {[["en", "EN"], ["es", "ES"], ["both", "Both"]].map(([v, l]) => (
              <button key={v} onClick={() => setLangMode(v)} style={{
                border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 700, fontSize: 12,
                padding: "0 11px", borderRadius: 6,
                background: langMode === v ? "#fff" : "transparent",
                color: langMode === v ? "var(--primary)" : "#fff",
              }}>{l}</button>
            ))}
          </div>
          <button onClick={generate} disabled={generating} style={{
            border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 800, fontSize: 13,
            padding: "0 16px", borderRadius: "var(--radius)", background: "#fff", color: "var(--primary)",
            display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap",
          }}>
            {generating ? <Icon.Refresh size={14} className="ico animate-spin" /> : <Icon.Zap size={14} />}
            {generating ? "Building…" : "Generate"}
          </button>
        </div>
        {!compact && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
            {suggestions.map((s) => (
              <button key={s} onClick={() => setPrompt(s)} style={{
                border: "1px solid rgba(255,255,255,0.35)", background: "rgba(255,255,255,0.1)", color: "#fff",
                borderRadius: 999, padding: "4px 10px", fontSize: 11, cursor: "pointer", fontFamily: "inherit",
              }}>{s}</button>
            ))}
          </div>
        )}
      </div>

      {/* Variant grid */}
      <div style={{
        display: "grid", gridTemplateColumns: compact ? "repeat(3, 1fr)" : "repeat(auto-fill, minmax(190px, 1fr))",
        gap: 12,
      }}>
        {variants.map((variant, i) => {
          const show = i < revealed;
          const isSel = selected === variant.key;
          const scheme = SCHEMES.find((s) => s.id === variant.schemeId);
          return (
            <div
              key={variant.key}
              onClick={() => setSelected(variant.key)}
              style={{
                cursor: "pointer", borderRadius: 12, padding: 6,
                border: isSel ? "2px solid var(--primary)" : "2px solid transparent",
                background: isSel ? "var(--primary-50)" : "transparent",
                opacity: show ? 1 : 0, transform: show ? "translateY(0)" : "translateY(8px)",
                transition: "opacity 0.25s ease, transform 0.25s ease",
              }}
            >
              <MiniCreative
                vehicle={vehicle}
                schemeId={variant.schemeId}
                layout={variant.layout}
                lang={variant.lang}
                label={variant.lang === "es" ? "ES" : "EN"}
              />
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 6, padding: "0 2px" }}>
                <div style={{ fontSize: 11, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{scheme?.name}</div>
                {isSel && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onUseVariant?.(variant); toast?.(`Using "${scheme?.name}" — opening Designer`); }}
                    className="btn primary sm" style={{ height: 24, padding: "0 8px", fontSize: 11 }}
                  >
                    Use →
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Scheme strip — manual exploration */}
      {!compact && (
        <div style={{ borderTop: "1px solid var(--border)", paddingTop: 12 }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: "var(--text-3)", letterSpacing: "0.08em", marginBottom: 8 }}>
            OR START FROM A SCHEME
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {SCHEMES.map((s) => (
              <div key={s.id} style={{ textAlign: "center", width: 56 }}>
                <SchemeSwatch scheme={s} size={56} onClick={() => onUseVariant?.({ schemeId: s.id, layout: "bottom-bar", lang: langMode === "es" ? "es" : "en" })} />
                <div style={{ fontSize: 9.5, color: "var(--text-2)", marginTop: 3, lineHeight: 1.1 }}>{s.name}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export { VariantExplorer, deriveVariants };
