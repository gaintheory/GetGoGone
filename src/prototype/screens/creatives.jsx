import React from 'react';
import { Icon } from '../icons';
import { GGG } from '../data';
import { UI } from '../ui';
import { VehicleMedia } from '../vehicle-media';

function Creatives({ nav, toast, vehicles: providedVehicles, clientId }) {
  const { VEHICLES, fmt$ } = GGG;
  const { Pill, Btn } = UI;
  const vehicles = providedVehicles && providedVehicles.length ? providedVehicles : VEHICLES;
  const [format, setFormat] = React.useState("all");
  const [vehicle, setVehicle] = React.useState("all");
  const [assets, setAssets] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const params = new URLSearchParams({ category: "saved_creative" });
    if (clientId && clientId !== "agency_overview") params.set("clientId", clientId);
    fetch(`/api/creative-templates?${params.toString()}`)
      .then(res => res.json())
      .then(data => {
        if (cancelled) return;
        if (!data.ok) {
          toast?.(data.error || "Could not load saved creatives");
          setAssets([]);
          return;
        }
        setAssets((data.templates || []).map(record => mapSavedAsset(record, vehicles)));
      })
      .catch(() => {
        if (!cancelled) setAssets([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [vehicles, clientId]);

  const filtered = assets.filter(a => {
    if (format !== "all" && a.format !== format) return false;
    if (vehicle !== "all" && a.v?.id !== vehicle) return false;
    return true;
  });

  return (
    <div className="page">
      <div className="page-h">
        <div>
          <h1>Creatives</h1>
          <div className="sub">{assets.length} saved designer assets</div>
        </div>
        <div className="page-actions">
          <Btn icon={Icon.Download}>Bulk download</Btn>
          <Btn icon={Icon.Megaphone} onClick={() => nav("builder")}>New campaign</Btn>
          <Btn icon={Icon.Sparkles} variant="primary" onClick={() => nav("designer")}>Open Designer</Btn>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 12, alignItems: "center" }}>
        <div className="row" style={{ gap: 4 }}>
          {[
            { id: "all", label: "All formats" },
            { id: "fb-sq", label: "Feed 1:1" },
            { id: "story", label: "Story 9:16" },
            { id: "web-banner", label: "Banner" },
            { id: "cl", label: "Craigslist" },
            { id: "flyer", label: "Flyer" },
          ].map(f => (
            <button key={f.id} className={`chip ${format === f.id ? "active" : ""}`} onClick={() => setFormat(f.id)}>{f.label}</button>
          ))}
        </div>
        <select className="select" value={vehicle} onChange={e => setVehicle(e.target.value)} style={{ marginLeft: "auto", maxWidth: 240 }}>
          <option value="all">All vehicles</option>
          {vehicles.map(v => <option key={v.id} value={v.id}>{v.year} {v.make} {v.model}</option>)}
        </select>
        <Btn size="sm" icon={Icon.Filter}>Filters</Btn>
      </div>

      {loading ? (
        <div className="card" style={{ padding: 20, color: "var(--text-2)" }}>Loading saved creatives...</div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ padding: 24, textAlign: "center" }}>
          <Icon.Folder size={24} style={{ color: "var(--text-3)" }}/>
          <div style={{ marginTop: 8, fontWeight: 700 }}>No saved creatives yet</div>
          <div className="muted" style={{ marginTop: 4 }}>Open Designer, choose a vehicle, edit the canvas, then use Save version.</div>
          <Btn icon={Icon.Sparkles} variant="primary" onClick={() => nav("designer")} style={{ marginTop: 12 }}>Open Designer</Btn>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
          {filtered.map((a) => (
            <CreativeCard key={a.id} asset={a} toast={toast} fmt$={fmt$}/>
          ))}
        </div>
      )}
    </div>
  );
}

function mapSavedAsset(record, vehicles) {
  const canvas = record.canvas_json || {};
  const savedVehicle = canvas.vehicle || {};
  const v = vehicles.find(item => item.id === savedVehicle.id || item.vin === savedVehicle.vin) || savedVehicle || vehicles[0];
  const size = canvas.size || { id: record.format, name: record.format };
  return {
    id: record.id,
    name: record.name,
    record,
    v,
    format: size.id || record.format,
    label: size.name || record.format,
    createdAt: record.created_at,
  };
}

function CreativeCard({ asset, toast, fmt$ }) {
  const { Pill, Btn } = UI;
  const { v, format, label, name } = asset;
  const aspect = format === "story" || format === "tt-cover" ? "9/16" : format === "web-banner" || format === "gad-728" ? "16/5.5" : format === "flyer" ? "8.5/11" : format === "cl" ? "4/3" : "1/1";

  return (
    <div className="card" style={{ overflow: "hidden" }}>
      <div style={{ aspectRatio: aspect, background: "var(--gray-100)", position: "relative", overflow: "hidden" }}>
        <VehicleMedia v={v} style={{ position: "absolute", inset: 0 }}/>
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: 8, background: "linear-gradient(transparent, rgba(0,0,0,0.7))", color: "#fff" }}>
          <div style={{ fontSize: 9, opacity: 0.85, letterSpacing: "0.06em", fontWeight: 600 }}>{v?.down ? `${fmt$(v.down)} DOWN` : "SAVED CREATIVE"}</div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "-0.01em", lineHeight: 1.1 }}>{v?.year} {v?.make} {v?.model}</div>
        </div>
        <div style={{ position: "absolute", top: 8, left: 8 }}>
          <Pill tone="gray" style={{ background: "rgba(255,255,255,0.95)" }}>{label}</Pill>
        </div>
      </div>
      <div style={{ padding: "8px 10px 10px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <div style={{ fontWeight: 600, fontSize: 12.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{name || `${v?.year} ${v?.make} ${v?.model}`}</div>
          <Pill tone="blue">Saved</Pill>
        </div>
        <div className="muted mono" style={{ fontSize: 11, marginTop: 2 }}>{v?.stock || v?.vin || "Designer"} - {label}</div>
        <div className="row" style={{ marginTop: 8, gap: 4 }}>
          <button className="icon-btn" style={{ width: 26, height: 26 }} onClick={() => toast("Export rendering comes next")} title="Download"><Icon.Download size={13}/></button>
          <button className="icon-btn" style={{ width: 26, height: 26 }} onClick={() => toast("Creative metadata copied")} title="Copy text"><Icon.Copy size={13}/></button>
          <button className="icon-btn" style={{ width: 26, height: 26 }} title="Regenerate"><Icon.Refresh size={13}/></button>
          <button className="icon-btn" style={{ width: 26, height: 26 }} title="Save as template"><Icon.Folder size={13}/></button>
          <button className="btn sm" style={{ marginLeft: "auto" }} onClick={() => toast("Marked as ready")}>
            <Icon.CheckCircle size={12}/> Ready
          </button>
        </div>
      </div>
    </div>
  );
}

export { Creatives };
