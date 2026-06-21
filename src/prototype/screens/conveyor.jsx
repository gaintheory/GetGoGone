import React from 'react';
import { Icon } from '../icons';
import { GGG } from '../data';
import { VehicleMedia } from '../vehicle-media';

// ============================================================
// THE CONVEYOR — every vehicle's marketing journey as an assembly line.
// Cars advance through stages from "on the lot" to "pulling leads".
// One glance tells you what the whole lot's marketing looks like.
// ============================================================

const { fmt$ } = GGG;

const STAGES = [
  { id: "lot",       label: "On the lot",   icon: Icon.Car,         hint: "Just arrived — nothing yet" },
  { id: "dressed",   label: "Photos ready", icon: Icon.Camera,      hint: "Gallery shot & cleaned" },
  { id: "creative",  label: "Creative",     icon: Icon.Image,       hint: "Ad creative designed" },
  { id: "filmed",    label: "Filmed",       icon: Icon.Video,       hint: "Short-form video made" },
  { id: "published", label: "Published",    icon: Icon.Send,        hint: "Live on channels" },
  { id: "leads",     label: "Pulling leads", icon: Icon.Inbox,      hint: "Generating leads" },
];

// Stage is driven by real signals only. "Creative"/"Filmed" need GGG-side records
// that don't exist yet, so those buckets stay honestly empty until we build them —
// which itself tells the true story ("you have no videos yet").
function stageOf(v) {
  if ((v.leads || 0) > 0) return "leads";
  if (v.campaign === "Published") return "published";
  if (v.campaign === "Ready to Review") return "creative";
  if ((v.photos || 0) >= 4) return "dressed";
  return "lot";
}

// Compliance: never render "$0 Down". Fall back to a safe label.
const downLabel = (v) => (v.down ? fmt$(v.down) + " dn" : "Low down");

function Conveyor({ nav, toast, vehicles: provided }) {
  const vehicles = provided && provided.length ? provided : GGG.VEHICLES;
  const [filter, setFilter] = React.useState("all");

  const byStage = React.useMemo(() => {
    const map = Object.fromEntries(STAGES.map((s) => [s.id, []]));
    for (const v of vehicles) map[stageOf(v)].push(v);
    return map;
  }, [vehicles]);

  const stuck = vehicles.filter((v) => (v.daysIn || 0) > 30 && stageOf(v) !== "leads");

  return (
    <div className="page">
      <div className="page-h">
        <div>
          <h1>The Conveyor</h1>
          <div className="sub">{vehicles.length} vehicles · marketing pipeline at a glance</div>
        </div>
        <div className="page-actions">
          {stuck.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--warning-50)", color: "var(--warning)", border: "1px solid var(--warning-100)", borderRadius: "var(--radius)", padding: "6px 10px", fontSize: 12, fontWeight: 600 }}>
              <Icon.AlertTriangle size={13} /> {stuck.length} aging &amp; under-marketed
            </div>
          )}
        </div>
      </div>

      {/* belt */}
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${STAGES.length}, minmax(180px, 1fr))`, gap: 10, overflowX: "auto", paddingBottom: 8 }}>
        {STAGES.map((stage, si) => {
          const I = stage.icon;
          const cars = byStage[stage.id];
          const isLast = si === STAGES.length - 1;
          return (
            <div key={stage.id} style={{ display: "flex", flexDirection: "column", minWidth: 180 }}>
              {/* column header */}
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 8, position: "relative" }}>
                <div style={{ width: 26, height: 26, borderRadius: 7, display: "grid", placeItems: "center", background: isLast ? "var(--success-50)" : "var(--primary-50)", color: isLast ? "var(--success)" : "var(--primary)", flexShrink: 0 }}>
                  <I size={14} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, whiteSpace: "nowrap" }}>{stage.label}</div>
                  <div style={{ fontSize: 10, color: "var(--text-3)" }}>{cars.length} {cars.length === 1 ? "car" : "cars"}</div>
                </div>
                {!isLast && (
                  <Icon.ChevronRight size={16} style={{ position: "absolute", right: -13, top: 5, color: "var(--border-strong)", zIndex: 1 }} />
                )}
              </div>

              {/* column body */}
              <div style={{
                flex: 1, background: "var(--gray-50)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)",
                padding: 8, display: "flex", flexDirection: "column", gap: 8, minHeight: 360,
              }}>
                {cars.length === 0 && (
                  <div style={{ flex: 1, display: "grid", placeItems: "center", color: "var(--text-3)", fontSize: 11, textAlign: "center", padding: 16 }}>
                    {stage.hint}
                  </div>
                )}
                {cars.map((v, ci) => (
                  <ConveyorCard key={v.id} v={v} index={ci} stage={stage.id} onClick={() => nav?.("vehicleHub", v.id)} />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: 14, marginTop: 14, flexWrap: "wrap", fontSize: 11, color: "var(--text-2)" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 9, height: 9, borderRadius: 999, background: "var(--success)" }} /> Pulling leads</span>
        <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 9, height: 9, borderRadius: 999, background: "var(--primary)" }} /> In production</span>
        <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 9, height: 9, borderRadius: 999, background: "var(--warning)" }} /> Needs attention</span>
        <span style={{ marginLeft: "auto", fontStyle: "italic" }}>Click any car to open its Hub →</span>
      </div>
    </div>
  );
}

function ConveyorCard({ v, index, stage, onClick }) {
  const [shown, setShown] = React.useState(false);
  React.useEffect(() => {
    const t = setTimeout(() => setShown(true), index * 60 + 40);
    return () => clearTimeout(t);
  }, [index]);

  const aging = (v.daysIn || 0) > 30 && stage !== "leads";

  return (
    <button
      onClick={onClick}
      style={{
        textAlign: "left", border: "1px solid var(--border)", borderRadius: "var(--radius)", overflow: "hidden",
        background: "var(--surface)", cursor: "pointer", fontFamily: "inherit", padding: 0,
        boxShadow: "var(--shadow-sm)",
        opacity: shown ? 1 : 0, transform: shown ? "translateY(0)" : "translateY(10px)",
        transition: "opacity .3s ease, transform .3s ease",
      }}
    >
      <div style={{ position: "relative", aspectRatio: "16/10", background: "#cbd5e1" }}>
        <VehicleMedia v={v} />
        {aging && (
          <div style={{ position: "absolute", top: 5, left: 5, background: "var(--warning)", color: "#fff", fontSize: 9, fontWeight: 800, padding: "2px 6px", borderRadius: 5 }}>
            {v.daysIn}d
          </div>
        )}
        {stage === "leads" && (
          <div style={{ position: "absolute", top: 5, right: 5, background: "var(--success)", color: "#fff", fontSize: 9, fontWeight: 800, padding: "2px 6px", borderRadius: 5, display: "flex", alignItems: "center", gap: 3 }}>
            <Icon.Inbox size={9} /> {v.leads}
          </div>
        )}
      </div>
      <div style={{ padding: "7px 9px" }}>
        <div style={{ fontSize: 11.5, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{v.year} {v.make} {v.model}</div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 3 }}>
          <span className="mono" style={{ fontSize: 10, color: "var(--text-3)" }}>{v.stock}</span>
          <span style={{ fontSize: 10.5, fontWeight: 800, color: "var(--danger)" }}>{downLabel(v)}</span>
        </div>
      </div>
    </button>
  );
}

export { Conveyor, STAGES, stageOf };
