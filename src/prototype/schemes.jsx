import React from 'react';

// ============================================================
// DESIGN SCHEMES — one-click visual identities for creatives
// ------------------------------------------------------------
// A scheme is a complete "vibe": palette, type feel, badge style,
// and density. Applying one re-skins an entire creative instantly.
// Used by the Vehicle Hub, the Variant Explorer, and (later) the Designer.
// ============================================================

/**
 * Each scheme carries:
 *  - colors: { bg, surface, ink, sub, accent, accent2, onAccent }
 *  - type:   { display, body, headlineWeight }
 *  - badge:  { style: "ribbon"|"pill"|"tag", radius }
 *  - density:"tight"|"roomy"
 *  - mood:   short emotional tag for the picker
 */
const SCHEMES = [
  {
    id: "urgency",
    name: "Bold Red Urgency",
    mood: "Loud · move it now",
    colors: { bg: "#7F1D1D", surface: "#991B1B", ink: "#FFFFFF", sub: "#FECACA", accent: "#FBBF24", accent2: "#DC2626", onAccent: "#7F1D1D" },
    type: { display: "Inter", body: "Inter", headlineWeight: 900 },
    badge: { style: "ribbon", radius: 2 },
    density: "tight",
  },
  {
    id: "trust",
    name: "Clean Trust",
    mood: "Calm · credible",
    colors: { bg: "#F8FAFC", surface: "#FFFFFF", ink: "#0F172A", sub: "#64748B", accent: "#2563EB", accent2: "#0891B2", onAccent: "#FFFFFF" },
    type: { display: "Inter", body: "Inter", headlineWeight: 800 },
    badge: { style: "pill", radius: 8 },
    density: "roomy",
  },
  {
    id: "warm-es",
    name: "Warm Español",
    mood: "Familiar · bilingüe",
    colors: { bg: "#78350F", surface: "#92400E", ink: "#FFFFFF", sub: "#FED7AA", accent: "#FBBF24", accent2: "#DC2626", onAccent: "#451A03" },
    type: { display: "Inter", body: "Inter", headlineWeight: 800 },
    badge: { style: "ribbon", radius: 3 },
    density: "roomy",
  },
  {
    id: "blackout",
    name: "Blacked-Out",
    mood: "Rugged · trucks",
    colors: { bg: "#0C0A09", surface: "#1C1917", ink: "#FFFFFF", sub: "#D6D3D1", accent: "#F59E0B", accent2: "#EA580C", onAccent: "#0C0A09" },
    type: { display: "Inter", body: "Inter", headlineWeight: 900 },
    badge: { style: "tag", radius: 2 },
    density: "tight",
  },
  {
    id: "fresh",
    name: "Fresh Mint",
    mood: "Friendly · family",
    colors: { bg: "#064E3B", surface: "#065F46", ink: "#FFFFFF", sub: "#A7F3D0", accent: "#FBBF24", accent2: "#10B981", onAccent: "#064E3B" },
    type: { display: "Inter", body: "Inter", headlineWeight: 800 },
    badge: { style: "pill", radius: 8 },
    density: "roomy",
  },
  {
    id: "luxe",
    name: "Luxe Mono",
    mood: "Premium · low-key",
    colors: { bg: "#111827", surface: "#1F2937", ink: "#F9FAFB", sub: "#9CA3AF", accent: "#D4AF37", accent2: "#FFFFFF", onAccent: "#111827" },
    type: { display: "Inter", body: "Inter", headlineWeight: 700 },
    badge: { style: "tag", radius: 1 },
    density: "roomy",
  },
];

const schemeById = (id) => SCHEMES.find((s) => s.id === id) || SCHEMES[0];

/**
 * Re-skin a set of creative layers to a scheme by role/type. Pure — returns a new
 * array. Maps semantic roles (headline, subhead, cta, disclosure, bg) to the
 * scheme palette so the same layout reads as a totally different design.
 */
function applyScheme(layers, scheme) {
  const c = scheme.colors;
  return (layers || []).map((l) => {
    const next = { ...l };
    switch (l.type) {
      case "bg":
        next.color = c.bg;
        break;
      case "shape":
        // panels/scrims follow surface; full-bleed accent bars follow accent
        next.color = (l.h <= 8 || l.w <= 18) ? c.accent : c.surface;
        break;
      case "text":
        if (l.role === "headline") { next.color = c.ink; next.weight = scheme.type.headlineWeight; }
        else if (l.role === "subhead") next.color = c.accent;
        else if (l.role === "disclosure") next.color = c.sub;
        else next.color = c.ink;
        if (l.pad) next.bg = c.accent2;
        break;
      case "cta":
        next.bg = c.accent; next.color = c.onAccent;
        break;
      case "ribbon":
        next.color = c.accent2; next.textColor = c.onAccent;
        break;
      case "stat-row":
        next.bg = c.surface; next.color = c.ink;
        break;
      default:
        break;
    }
    return next;
  });
}

// ---- swatch preview used in pickers / cards ----
function SchemeSwatch({ scheme, size = 44, selected, onClick, title }) {
  const c = scheme.colors;
  return (
    <button
      onClick={onClick}
      title={title || scheme.name}
      style={{
        width: size, height: size, flex: `0 0 ${size}px`,
        borderRadius: 10, cursor: onClick ? "pointer" : "default",
        border: selected ? "2px solid var(--primary)" : "2px solid transparent",
        boxShadow: selected ? "0 0 0 2px var(--surface), var(--shadow)" : "var(--shadow-sm)",
        padding: 0, overflow: "hidden", position: "relative",
        background: c.bg,
      }}
    >
      <span style={{ position: "absolute", inset: 0, background: c.bg }} />
      <span style={{ position: "absolute", left: "16%", right: "16%", top: "20%", height: "16%", background: c.ink, borderRadius: 2, opacity: 0.92 }} />
      <span style={{ position: "absolute", left: "16%", width: "34%", bottom: "20%", height: "22%", background: c.accent, borderRadius: scheme.badge.radius }} />
      <span style={{ position: "absolute", right: "16%", width: "20%", bottom: "22%", height: "18%", background: c.accent2, borderRadius: 999 }} />
    </button>
  );
}

// ---- horizontal scheme picker strip ----
function SchemePicker({ value, onChange, schemes = SCHEMES, showLabels = true }) {
  const active = schemeById(value);
  return (
    <div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {schemes.map((s) => (
          <SchemeSwatch key={s.id} scheme={s} selected={s.id === value} onClick={() => onChange?.(s.id)} />
        ))}
      </div>
      {showLabels && active && (
        <div style={{ marginTop: 8 }}>
          <div style={{ fontWeight: 700, fontSize: 12.5 }}>{active.name}</div>
          <div style={{ fontSize: 11, color: "var(--text-2)" }}>{active.mood}</div>
        </div>
      )}
    </div>
  );
}

export { SCHEMES, schemeById, applyScheme, SchemeSwatch, SchemePicker };
