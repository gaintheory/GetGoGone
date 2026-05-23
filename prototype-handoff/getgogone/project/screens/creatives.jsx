function Creatives({ nav, toast }) {
  const { VEHICLES, CHANNELS, fmt$ } = window.GGG;
  const { Pill, Btn, ChannelBadge } = window.UI;
  const [format, setFormat] = React.useState("all");
  const [vehicle, setVehicle] = React.useState("all");

  // Synthesize creative assets
  const assets = [];
  VEHICLES.forEach(v => {
    if (v.campaign === "Draft") return;
    [
      { f: "square", l: "Feed 1:1", ch: "fb" },
      { f: "story", l: "Story 9:16", ch: "ig" },
      { f: "banner", l: "Banner 728×90", ch: "gads" },
      { f: "cl", l: "Craigslist", ch: "cl" },
      { f: "flyer", l: "Flyer", ch: "print" },
    ].forEach(fmt => {
      if (v.campaign === "Ready to Review" && Math.random() < 0.4) return;
      assets.push({ v, format: fmt.f, label: fmt.l, channel: fmt.ch });
    });
  });

  const filtered = assets.filter(a => {
    if (format !== "all" && a.format !== format) return false;
    if (vehicle !== "all" && a.v.id !== vehicle) return false;
    return true;
  });

  return (
    <div className="page">
      <div className="page-h">
        <div>
          <h1>Creatives</h1>
          <div className="sub">{assets.length} assets across {VEHICLES.filter(v => v.campaign !== "Draft").length} vehicles</div>
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
            { id: "square", label: "Feed 1:1" },
            { id: "story", label: "Story 9:16" },
            { id: "banner", label: "Banner" },
            { id: "cl", label: "Craigslist" },
            { id: "flyer", label: "Flyer" },
          ].map(f => (
            <button key={f.id} className={`chip ${format === f.id ? "active" : ""}`} onClick={() => setFormat(f.id)}>{f.label}</button>
          ))}
        </div>
        <select className="select" value={vehicle} onChange={e => setVehicle(e.target.value)} style={{ marginLeft: "auto", maxWidth: 240 }}>
          <option value="all">All vehicles</option>
          {VEHICLES.map(v => <option key={v.id} value={v.id}>{v.year} {v.make} {v.model}</option>)}
        </select>
        <Btn size="sm" icon={Icon.Filter}>Filters</Btn>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
        {filtered.map((a, i) => (
          <CreativeCard key={i} asset={a} toast={toast}/>
        ))}
      </div>
    </div>
  );
}

function CreativeCard({ asset, toast }) {
  const { vehicleSvg, fmt$, statusPill } = window.GGG;
  const { Pill, Btn } = window.UI;
  const { v, format, label } = asset;
  const aspect = format === "story" ? "9/16" : format === "banner" ? "16/5.5" : format === "flyer" ? "8.5/11" : "1/1";

  return (
    <div className="card" style={{ overflow: "hidden" }}>
      <div style={{ aspectRatio: aspect, background: "var(--gray-100)", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0 }} dangerouslySetInnerHTML={{ __html: vehicleSvg(v.body, v.palette) }}/>
        {/* subtle overlay marketing */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: 8, background: "linear-gradient(transparent, rgba(0,0,0,0.7))", color: "#fff" }}>
          <div style={{ fontSize: 9, opacity: 0.85, letterSpacing: "0.06em", fontWeight: 600 }}>{fmt$(v.down)} DOWN</div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "-0.01em", lineHeight: 1.1 }}>{v.year} {v.make} {v.model}</div>
        </div>
        <div style={{ position: "absolute", top: 8, left: 8 }}>
          <Pill tone="gray" style={{ background: "rgba(255,255,255,0.95)" }}>{label}</Pill>
        </div>
      </div>
      <div style={{ padding: "8px 10px 10px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontWeight: 600, fontSize: 12.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{v.year} {v.make} {v.model}</div>
          <Pill tone={statusPill(v.campaign)}>{v.campaign}</Pill>
        </div>
        <div className="muted mono" style={{ fontSize: 11, marginTop: 2 }}>{v.stock} · v2</div>
        <div className="row" style={{ marginTop: 8, gap: 4 }}>
          <button className="icon-btn" style={{ width: 26, height: 26 }} onClick={() => toast("Downloaded")} title="Download"><Icon.Download size={13}/></button>
          <button className="icon-btn" style={{ width: 26, height: 26 }} onClick={() => toast("Copied text")} title="Copy text"><Icon.Copy size={13}/></button>
          <button className="icon-btn" style={{ width: 26, height: 26 }} title="Regenerate"><Icon.Refresh size={13}/></button>
          <button className="icon-btn" style={{ width: 26, height: 26 }} title="Save as template"><Icon.Folder size={13}/></button>
          <button className="btn sm" style={{ marginLeft: "auto" }} onClick={() => toast("Marked as published")}>
            <Icon.CheckCircle size={12}/> Publish
          </button>
        </div>
      </div>
    </div>
  );
}

window.Creatives = Creatives;
