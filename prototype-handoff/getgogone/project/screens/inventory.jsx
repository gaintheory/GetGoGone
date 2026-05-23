function Inventory({ nav }) {
  const { VEHICLES, fmt$, fmtMi, statusPill } = window.GGG;
  const { Pill, Btn, VehicleThumb } = window.UI;
  const [filter, setFilter] = React.useState("all");
  const [q, setQ] = React.useState("");
  const [sel, setSel] = React.useState(new Set());

  const filters = [
    { id: "all", label: "All", count: VEHICLES.length },
    { id: "active", label: "Active", count: VEHICLES.filter(v => v.status === "Active").length },
    { id: "advertised", label: "Advertised", count: VEHICLES.filter(v => v.status === "Advertised").length },
    { id: "attention", label: "Needs attention", count: VEHICLES.filter(v => ["Needs Photos","Missing Payment"].includes(v.status)).length },
    { id: "aging", label: "Aging (30d+)", count: VEHICLES.filter(v => v.daysIn >= 30).length },
  ];

  const rows = VEHICLES.filter(v => {
    if (filter === "active" && v.status !== "Active") return false;
    if (filter === "advertised" && v.status !== "Advertised") return false;
    if (filter === "attention" && !["Needs Photos","Missing Payment"].includes(v.status)) return false;
    if (filter === "aging" && v.daysIn < 30) return false;
    if (q && !(`${v.year} ${v.make} ${v.model} ${v.stock}`.toLowerCase().includes(q.toLowerCase()))) return false;
    return true;
  });

  const toggle = (id) => {
    const n = new Set(sel);
    n.has(id) ? n.delete(id) : n.add(id);
    setSel(n);
  };

  return (
    <div className="page">
      <div className="page-h">
        <div>
          <h1>Inventory</h1>
          <div className="sub">{VEHICLES.length} vehicles · 6 advertised · 2 need attention</div>
        </div>
        <div className="page-actions">
          <Btn icon={Icon.Upload}>Import CSV</Btn>
          <Btn icon={Icon.Link}>Sync from website</Btn>
          <Btn icon={Icon.Plus} variant="dark">Add vehicle</Btn>
        </div>
      </div>

      {/* Filter bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <div className="row" style={{ gap: 4 }}>
          {filters.map(f => (
            <button key={f.id} className={`chip ${filter === f.id ? "active" : ""}`} onClick={() => setFilter(f.id)}>
              {f.label}
              <span className="muted" style={{ marginLeft: 4, color: filter === f.id ? "rgba(255,255,255,0.7)" : undefined }}>{f.count}</span>
            </button>
          ))}
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
          <div className="search" style={{ flex: "0 0 240px", position: "relative" }}>
            <Icon.Search size={13} className="ico"/>
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search by year, make, stock #..."/>
          </div>
          <Btn size="sm" icon={Icon.Filter}>More filters</Btn>
        </div>
      </div>

      {/* Bulk action bar */}
      {sel.size > 0 && (
        <div style={{ background: "#111827", color: "#fff", borderRadius: "var(--radius-lg)", padding: "8px 14px", display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <span style={{ fontWeight: 600, fontSize: 12.5 }}>{sel.size} selected</span>
          <button className="btn sm" style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "#fff" }}>
            <Icon.Sparkles size={12}/> Generate campaigns
          </button>
          <button className="btn sm" style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "#fff" }}>
            <Icon.Tag size={12}/> Update price
          </button>
          <button className="btn sm" style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "#fff" }}>
            <Icon.Download size={12}/> Export
          </button>
          <button onClick={() => setSel(new Set())} style={{ marginLeft: "auto", background: "none", border: "none", color: "rgba(255,255,255,0.7)", cursor: "pointer" }}>Clear</button>
        </div>
      )}

      <div className="card">
        <table className="tbl">
          <thead>
            <tr>
              <th style={{ width: 30 }}>
                <input type="checkbox" checked={sel.size === rows.length && rows.length > 0}
                  onChange={() => sel.size === rows.length ? setSel(new Set()) : setSel(new Set(rows.map(r => r.id)))}/>
              </th>
              <th style={{ width: 290 }}>Vehicle</th>
              <th>Stock #</th>
              <th>Price</th>
              <th>Down / Wk</th>
              <th>Mileage</th>
              <th>Status</th>
              <th>Campaign</th>
              <th>Days</th>
              <th>Leads</th>
              <th style={{ width: 36 }}></th>
            </tr>
          </thead>
          <tbody>
            {rows.map(v => (
              <tr key={v.id} className={sel.has(v.id) ? "selected" : ""}>
                <td onClick={(e) => { e.stopPropagation(); toggle(v.id); }}>
                  <input type="checkbox" checked={sel.has(v.id)} onChange={() => toggle(v.id)}/>
                </td>
                <td onClick={() => nav("vehicle", v.id)} style={{cursor:"pointer"}}>
                  <div className="row">
                    <VehicleThumb v={v}/>
                    <div>
                      <div style={{ fontWeight: 600 }}>{v.year} {v.make} {v.model}</div>
                      <div className="muted" style={{ fontSize: 11.5 }}>{v.trim} · {v.color}</div>
                    </div>
                  </div>
                </td>
                <td><span className="mono muted">{v.stock}</span></td>
                <td className="mono" style={{ fontWeight: 600 }}>{fmt$(v.price)}</td>
                <td>
                  <div className="mono" style={{ fontWeight: 600 }}>{fmt$(v.down)} down</div>
                  <div className="muted mono" style={{ fontSize: 11 }}>{fmt$(v.weekly)}/wk</div>
                </td>
                <td className="mono muted">{fmtMi(v.mileage)}</td>
                <td><Pill tone={statusPill(v.status)} dot>{v.status}</Pill></td>
                <td><Pill tone={statusPill(v.campaign)}>{v.campaign}</Pill></td>
                <td className="mono">{v.daysIn}d</td>
                <td>
                  <span className="mono" style={{ fontWeight: 600 }}>{v.leads}</span>
                </td>
                <td>
                  <button className="icon-btn" style={{ width: 26, height: 26 }} onClick={(e) => e.stopPropagation()}>
                    <Icon.More size={14}/>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10, fontSize: 11.5 }} className="muted">
        <span>Showing {rows.length} of {VEHICLES.length} vehicles</span>
        <div className="row">
          <Btn size="sm" variant="ghost" icon={Icon.ChevronLeft}/>
          <span>Page 1 of 1</span>
          <Btn size="sm" variant="ghost" icon={Icon.ChevronRight}/>
        </div>
      </div>
    </div>
  );
}

window.Inventory = Inventory;
