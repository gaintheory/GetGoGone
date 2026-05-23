function Templates({ nav, toast }) {
  const { TEMPLATES, CHANNELS } = window.GGG;
  const { Pill, Btn, ChannelBadge } = window.UI;
  const [filter, setFilter] = React.useState("all");
  const filters = [
    { id: "all", label: "All", count: TEMPLATES.length },
    { id: "SUV", label: "SUVs" },
    { id: "Truck", label: "Trucks" },
    { id: "Sedan", label: "Sedans" },
    { id: "First-Time", label: "First-time buyers" },
    { id: "Spanish-First", label: "Español" },
    { id: "Bargain Hunter", label: "Price drops" },
  ];

  const filtered = TEMPLATES.filter(t => {
    if (filter === "all") return true;
    return t.type === filter || t.buyer === filter;
  });

  return (
    <div className="page">
      <div className="page-h">
        <div>
          <h1>Template library</h1>
          <div className="sub">Reusable campaigns by vehicle type, buyer, platform, and season</div>
        </div>
        <div className="page-actions">
          <Btn icon={Icon.Upload}>Import template</Btn>
          <Btn icon={Icon.Plus} variant="dark">New template</Btn>
        </div>
      </div>

      <div style={{ display: "flex", gap: 4, marginBottom: 14, alignItems: "center" }}>
        {filters.map(f => (
          <button key={f.id} className={`chip ${filter === f.id ? "active" : ""}`} onClick={() => setFilter(f.id)}>
            {f.label} {f.count != null && <span style={{ marginLeft: 4, color: filter === f.id ? "rgba(255,255,255,0.7)" : "var(--text-2)" }}>{f.count}</span>}
          </button>
        ))}
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <select className="select" style={{ width: 130 }}>
            <option>All seasons</option>
            <option>Tax season</option>
            <option>Summer</option>
            <option>Year-end</option>
          </select>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
        {filtered.map(t => <TemplateCard key={t.id} t={t} toast={toast} nav={nav}/>)}
        <button className="card" style={{ minHeight: 180, display: "grid", placeItems: "center", border: "2px dashed var(--border-strong)", background: "transparent", cursor: "pointer", color: "var(--text-2)", fontFamily: "inherit" }}>
          <div style={{ textAlign: "center" }}>
            <Icon.Plus size={20}/>
            <div style={{ marginTop: 4, fontSize: 12.5, fontWeight: 500 }}>New blank template</div>
          </div>
        </button>
      </div>
    </div>
  );
}

function TemplateCard({ t, toast, nav }) {
  const { CHANNELS } = window.GGG;
  const { Pill, Btn, ChannelBadge } = window.UI;
  const swatchColor = {
    blue: "linear-gradient(135deg, #DBEAFE, #2563EB)",
    green: "linear-gradient(135deg, #DCFCE7, #16A34A)",
    amber: "linear-gradient(135deg, #FEF3C7, #F59E0B)",
    red: "linear-gradient(135deg, #FEE2E2, #DC2626)",
    cyan: "linear-gradient(135deg, #CFFAFE, #0891B2)",
    gray: "linear-gradient(135deg, #F1F5F9, #475569)",
  }[t.swatch];

  return (
    <div className="card" style={{ overflow: "hidden" }}>
      <div style={{ height: 96, background: swatchColor, position: "relative", padding: 14, color: "#fff" }}>
        <div style={{ position: "absolute", top: 10, right: 10 }}>
          <Pill tone="gray" style={{ background: "rgba(255,255,255,0.95)", color: "#111" }}>{t.uses} uses</Pill>
        </div>
        <div style={{ position: "absolute", bottom: 14, left: 14, right: 14 }}>
          <div style={{ fontSize: 11, opacity: 0.9, letterSpacing: "0.06em", fontWeight: 600 }}>TEMPLATE</div>
          <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: "-0.01em", lineHeight: 1.2, textShadow: "0 1px 2px rgba(0,0,0,0.2)" }}>{t.name}</div>
        </div>
      </div>
      <div style={{ padding: 12 }}>
        <div className="row" style={{ gap: 4, marginBottom: 8, flexWrap: "wrap" }}>
          <Pill>{t.type}</Pill>
          <Pill>{t.buyer}</Pill>
          <Pill>{t.season}</Pill>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div className="row" style={{ gap: 3 }}>
            {t.platforms.map(pid => {
              const ch = CHANNELS.find(c => c.id === pid);
              return <ChannelBadge key={pid} ch={ch} size={18}/>;
            })}
          </div>
          <div className="row" style={{ gap: 4 }}>
            <button className="icon-btn" style={{ width: 26, height: 26 }} title="Edit"><Icon.Edit size={13}/></button>
            <Btn size="sm" variant="dark" onClick={() => { toast("Template loaded"); nav("builder"); }}>Use</Btn>
          </div>
        </div>
      </div>
    </div>
  );
}

window.Templates = Templates;
