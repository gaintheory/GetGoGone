import React from 'react';
import { Icon } from '../icons';
import { GGG } from '../data';
import { UI } from '../ui';
import { VehicleMedia } from '../vehicle-media';
import { VariantExplorer } from './variant-explorer';

// ============================================================
// VEHICLE HUB — the car as the central object.
// Everything it can become (photos, creatives, video, feeds, leads,
// performance) orbits the vehicle. One object, all its surfaces, no nav.
// ============================================================

const { fmt$ } = GGG;

// Derive a vehicle's "marketing state" from its data (prototype heuristic).
function deriveState(v) {
  const photos = v.photos || 0;
  const leads = v.leads || 0;
  const creatives = Math.max(0, Math.round((photos || 0) / 6)); // stand-in
  const hasVideo = photos >= 10;
  const feedsLive = v.campaign === "Published" ? 3 : v.campaign === "Ready to Review" ? 1 : 0;
  return {
    photos: { count: photos, ok: photos >= 6, label: "Photos", icon: Icon.Camera, hint: photos >= 6 ? "Gallery ready" : "Needs more photos" },
    creatives: { count: creatives, ok: creatives > 0, label: "Creatives", icon: Icon.Image, hint: creatives > 0 ? `${creatives} designed` : "None yet" },
    video: { count: hasVideo ? 1 : 0, ok: hasVideo, label: "Video", icon: Icon.Video, hint: hasVideo ? "1 short-form" : "No video yet" },
    feeds: { count: feedsLive, ok: feedsLive > 0, label: "Channels", icon: Icon.Send, hint: feedsLive > 0 ? `${feedsLive} live` : "Not published" },
    leads: { count: leads, ok: leads > 0, label: "Leads", icon: Icon.Inbox, hint: leads > 0 ? `${leads} captured` : "No leads yet" },
    perf: { count: leads * 47 + photos * 12, ok: leads > 0, label: "Reach", icon: Icon.Chart, hint: "Est. impressions" },
  };
}

const ORBIT = ["photos", "creatives", "video", "feeds", "leads", "perf"];

function VehicleHub({ nav, toast, vehicles: provided, vehicleId, clientId }) {
  const vehicles = provided && provided.length ? provided : GGG.VEHICLES;
  const [selId, setSelId] = React.useState(vehicleId || vehicles[0]?.id);
  const [creating, setCreating] = React.useState(false);

  const v = vehicles.find((x) => x.id === selId) || vehicles[0];
  const state = React.useMemo(() => deriveState(v || {}), [v]);

  if (!v) return <div className="page"><div className="card" style={{ padding: 24 }}>No vehicles loaded.</div></div>;

  // orbit geometry
  const STAGE_W = 760, STAGE_H = 540, R = 212;
  const cx = STAGE_W / 2, cy = STAGE_H / 2;
  const angles = [-90, -30, 30, 90, 150, 210];
  const nodes = ORBIT.map((key, i) => {
    const a = (angles[i] * Math.PI) / 180;
    return { key, ...state[key], x: cx + R * Math.cos(a), y: cy + R * Math.sin(a) };
  });

  const completeness = ORBIT.filter((k) => state[k].ok).length;

  return (
    <div className="page">
      <div className="page-h">
        <div>
          <h1>Vehicle Hub</h1>
          <div className="sub">Everything this vehicle can become — in one place</div>
        </div>
        <div className="page-actions" style={{ alignItems: "center" }}>
          <select className="select" value={selId} onChange={(e) => setSelId(e.target.value)} style={{ maxWidth: 260 }}>
            {vehicles.map((x) => <option key={x.id} value={x.id}>{x.year} {x.make} {x.model} · {x.stock}</option>)}
          </select>
          <UI.Btn icon={Icon.Sparkles} variant="primary" onClick={() => setCreating((c) => !c)}>
            {creating ? "Close studio" : "Create campaign"}
          </UI.Btn>
        </div>
      </div>

      {/* readiness ribbon */}
      <div style={{
        display: "flex", alignItems: "center", gap: 12, marginBottom: 16,
        background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "10px 14px",
      }}>
        <div style={{ fontSize: 12, fontWeight: 700 }}>Marketing readiness</div>
        <div style={{ flex: 1, height: 8, background: "var(--gray-100)", borderRadius: 999, overflow: "hidden" }}>
          <div style={{ width: `${(completeness / 6) * 100}%`, height: "100%", background: completeness >= 5 ? "var(--success)" : completeness >= 3 ? "var(--primary)" : "var(--warning)", transition: "width .4s ease" }} />
        </div>
        <div className="mono" style={{ fontSize: 12, color: "var(--text-2)" }}>{completeness}/6</div>
      </div>

      {creating && (
        <div style={{ marginBottom: 18, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: 14 }}>
          <VariantExplorer
            vehicle={v}
            onUseVariant={(variant) => { toast?.("Opening Designer with your pick…"); nav?.("designer", v.id); }}
            toast={toast}
          />
        </div>
      )}

      {/* ORBIT STAGE */}
      <div style={{ display: "grid", placeItems: "center", overflow: "hidden" }}>
        <div style={{ position: "relative", width: STAGE_W, height: STAGE_H, maxWidth: "100%" }}>
          {/* connecting lines */}
          <svg width={STAGE_W} height={STAGE_H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
            {nodes.map((n) => (
              <line key={n.key} x1={cx} y1={cy} x2={n.x} y2={n.y}
                stroke={n.ok ? "var(--primary)" : "var(--border-strong)"} strokeWidth={n.ok ? 2 : 1.5}
                strokeDasharray={n.ok ? "0" : "4 4"} opacity={n.ok ? 0.5 : 0.7} />
            ))}
            <circle cx={cx} cy={cy} r={R} fill="none" stroke="var(--border)" strokeWidth={1} strokeDasharray="2 6" opacity={0.6} />
          </svg>

          {/* orbit tiles */}
          {nodes.map((n) => {
            const I = n.icon;
            return (
              <button key={n.key}
                onClick={() => {
                  const route = n.key === "creatives" ? "creatives" : n.key === "video" ? "videoStudio" : n.key === "leads" ? "leads" : n.key === "feeds" ? "marketing" : n.key === "perf" ? "reports" : "designer";
                  nav?.(route, v.id);
                }}
                title={n.hint}
                style={{
                  position: "absolute", left: n.x, top: n.y, transform: "translate(-50%, -50%)",
                  width: 116, height: 116, borderRadius: "50%",
                  background: "var(--surface)", border: `2px solid ${n.ok ? "var(--primary)" : "var(--border)"}`,
                  boxShadow: "var(--shadow)", cursor: "pointer", fontFamily: "inherit",
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3,
                  transition: "transform .15s ease, box-shadow .15s ease",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "translate(-50%, -50%) scale(1.06)"; e.currentTarget.style.boxShadow = "var(--shadow-lg)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = "translate(-50%, -50%)"; e.currentTarget.style.boxShadow = "var(--shadow)"; }}
              >
                <div style={{ width: 30, height: 30, borderRadius: "50%", display: "grid", placeItems: "center", background: n.ok ? "var(--primary-50)" : "var(--gray-100)", color: n.ok ? "var(--primary)" : "var(--text-3)" }}>
                  <I size={15} />
                </div>
                <div style={{ fontSize: 17, fontWeight: 800, lineHeight: 1 }}>{n.count?.toLocaleString?.() ?? n.count}</div>
                <div style={{ fontSize: 10, fontWeight: 600, color: "var(--text-2)" }}>{n.label}</div>
                {n.ok
                  ? <Icon.CheckCircle size={11} style={{ color: "var(--success)", position: "absolute", top: 12, right: 16 }} />
                  : <Icon.Plus size={11} style={{ color: "var(--warning)", position: "absolute", top: 12, right: 16 }} />}
              </button>
            );
          })}

          {/* hero vehicle in the center */}
          <div style={{
            position: "absolute", left: cx, top: cy, transform: "translate(-50%, -50%)",
            width: 230, height: 230, borderRadius: "50%", overflow: "hidden",
            border: "4px solid var(--surface)", boxShadow: "var(--shadow-lg), 0 0 0 2px var(--primary)",
            background: "#cbd5e1",
          }}>
            <VehicleMedia v={v} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 45%, rgba(0,0,0,0.78) 100%)" }} />
            <div style={{ position: "absolute", left: 0, right: 0, bottom: 22, textAlign: "center", color: "#fff", padding: "0 16px" }}>
              <div style={{ fontSize: 16, fontWeight: 800, lineHeight: 1.05 }}>{v.year} {v.make}</div>
              <div style={{ fontSize: 14, fontWeight: 700, opacity: 0.95 }}>{v.model} {v.trim || ""}</div>
              <div style={{ marginTop: 5, display: "inline-flex", gap: 5 }}>
                <span style={{ background: "#DC2626", color: "#fff", fontSize: 10, fontWeight: 800, padding: "2px 7px", borderRadius: 999 }}>{v.down ? `${fmt$(v.down)} DOWN` : "LOW DOWN"}</span>
                {v.weekly ? <span style={{ background: "rgba(255,255,255,0.9)", color: "#0F172A", fontSize: 10, fontWeight: 800, padding: "2px 7px", borderRadius: 999 }}>{fmt$(v.weekly)}/wk</span> : null}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* quick context row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10, marginTop: 8 }}>
        <ContextCard label="Days on lot" value={`${v.daysIn ?? "—"}`} tone={v.daysIn > 30 ? "warn" : "ok"} />
        <ContextCard label="Stock #" value={v.stock} mono />
        <ContextCard label="Mileage" value={v.mileage ? `${v.mileage.toLocaleString()} mi` : "—"} mono />
        <ContextCard label="Status" value={v.campaign || v.status} />
      </div>
    </div>
  );
}

function ContextCard({ label, value, mono, tone }) {
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "10px 12px" }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-3)", letterSpacing: "0.06em" }}>{label.toUpperCase()}</div>
      <div className={mono ? "mono" : ""} style={{ fontSize: 14, fontWeight: 700, marginTop: 2, color: tone === "warn" ? "var(--warning)" : "var(--text)" }}>{value}</div>
    </div>
  );
}

export { VehicleHub };
