import React from 'react';
import { VehicleMedia } from './vehicle-media';
import { schemeById } from './schemes';

// ============================================================
// MiniCreative — a small, live ad preview driven by scheme + layout + language.
// Pure DOM (not Konva) — cheap to render many at once for the Variant Explorer
// and the Vehicle Hub. The real Designer remains the Konva canvas.
// ============================================================

const fmt$ = (n) => (n ? "$" + Number(n).toLocaleString() : null);

// Bilingual copy bank — every string has EN + ES so the language toggle reflows.
const COPY = {
  justIn:   { en: "JUST IN",        es: "RECIÉN LLEGÓ" },
  down:     { en: "DOWN",           es: "ENGANCHE" },
  weekly:   { en: "/wk",            es: "/sem" },
  drive:    { en: "Drive it today", es: "Maneja hoy mismo" },
  apply:    { en: "Apply in 2 min", es: "Aplica en 2 min" },
  call:     { en: "Call now",       es: "Llama ya" },
  lowDown:  { en: "Low down payment", es: "Bajo enganche" },
};
const t = (key, lang) => COPY[key]?.[lang] ?? COPY[key]?.en ?? "";

const LAYOUTS = ["bottom-bar", "split-left", "full-overlay", "top-strip"];

function MiniCreative({ vehicle, schemeId, layout = "bottom-bar", lang = "en", aspect = "1/1", label }) {
  const scheme = schemeById(schemeId);
  const c = scheme.colors;
  const v = vehicle || {};
  const title = [v.year, v.make, v.model].filter(Boolean).join(" ") || "Vehicle";
  // Compliance: never "$0". With a real amount show "$X DOWN"; otherwise just the
  // safe label ("Low down payment") with no redundant DOWN/ENGANCHE suffix.
  const downText = v.down ? `${fmt$(v.down)} ${t("down", lang)}` : t("lowDown", lang);
  const weekly = v.weekly ? `${fmt$(v.weekly)}${t("weekly", lang)}` : null;

  const headlineWeight = scheme.type.headlineWeight;
  const badgeRadius = scheme.badge.radius;

  const Chip = ({ children, fill = c.accent, ink = c.onAccent }) => (
    <span style={{
      background: fill, color: ink, fontWeight: 800, fontSize: "5cqw",
      padding: "1.5cqw 2.5cqw", borderRadius: badgeRadius + 2, letterSpacing: "0.02em",
      whiteSpace: "nowrap", lineHeight: 1,
    }}>{children}</span>
  );

  return (
    <div style={{
      aspectRatio: aspect, width: "100%", position: "relative", overflow: "hidden",
      borderRadius: 10, background: c.bg, containerType: "size",
      boxShadow: "var(--shadow-sm)", border: "1px solid var(--border)",
    }}>
      {/* photo region varies by layout */}
      <div style={{
        position: "absolute",
        inset: layout === "split-left" ? "0 0 0 42%"
             : layout === "full-overlay" ? "0"
             : layout === "top-strip" ? "8% 0 38% 0"
             : "0 0 34% 0",
        overflow: "hidden", background: "#cbd5e1",
      }}>
        <VehicleMedia v={v} />
        {(layout === "full-overlay") && (
          <div style={{ position: "absolute", inset: 0, background: `linear-gradient(180deg, transparent 30%, ${c.bg} 96%)` }} />
        )}
        {layout === "split-left" && (
          <div style={{ position: "absolute", inset: 0, background: `linear-gradient(90deg, ${c.bg} 2%, transparent 40%)` }} />
        )}
      </div>

      {/* JUST IN ribbon */}
      <div style={{ position: "absolute", top: "5%", left: 0 }}>
        <span style={{
          background: c.accent2, color: c.onAccent, fontWeight: 900, fontSize: "4cqw",
          padding: "1.5cqw 3cqw", letterSpacing: "0.08em",
          clipPath: scheme.badge.style === "ribbon" ? "polygon(0 0,100% 0,92% 50%,100% 100%,0 100%)" : "none",
          borderRadius: scheme.badge.style === "pill" ? 999 : badgeRadius,
        }}>{t("justIn", lang)}</span>
      </div>

      {/* text block region varies by layout */}
      <div style={{
        position: "absolute",
        left: 0, right: 0,
        top: layout === "split-left" ? "16%" : "auto",
        bottom: layout === "split-left" ? "auto" : 0,
        padding: layout === "split-left" ? "0 0 0 4%" : "10cqw 5% 5%",
        width: layout === "split-left" ? "40%" : "auto",
        display: "flex", flexDirection: "column", gap: "2cqw",
        background: layout === "bottom-bar"
          ? `linear-gradient(180deg, transparent 0%, ${c.bg} 24%)`
          : "transparent",
      }}>
        <div style={{ color: c.ink, fontWeight: headlineWeight, fontSize: "7cqw", lineHeight: 1, letterSpacing: "-0.02em", textShadow: layout === "full-overlay" ? "0 1px 6px rgba(0,0,0,0.4)" : "none" }}>
          {title}
        </div>
        <div style={{ color: c.sub, fontWeight: 600, fontSize: "4cqw", lineHeight: 1.1 }}>
          {v.trim || v.color || ""}
        </div>
        <div style={{ display: "flex", gap: "2cqw", flexWrap: "wrap", marginTop: "1cqw" }}>
          <Chip>{downText}</Chip>
          {weekly && <Chip fill={c.surface} ink={c.ink}>{weekly}</Chip>}
        </div>
        <div style={{
          marginTop: "1.5cqw", alignSelf: "flex-start",
          background: c.accent, color: c.onAccent, fontWeight: 800, fontSize: "4.5cqw",
          padding: "2cqw 4cqw", borderRadius: badgeRadius + 2,
        }}>
          {t("apply", lang)} →
        </div>
      </div>

      {label && (
        <div style={{
          position: "absolute", top: 6, right: 6, background: "rgba(0,0,0,0.55)", color: "#fff",
          fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 5, letterSpacing: "0.04em",
        }}>{label}</div>
      )}
    </div>
  );
}

export { MiniCreative, LAYOUTS, COPY, t as translateCopy };
