function App() {
  const [route, setRoute] = React.useState({ screen: "testdrive", id: null });
  const [toast, setToast] = React.useState(null);
  const [importDrawer, setImportDrawer] = React.useState(false);

  const nav = (screen, id = null) => setRoute({ screen, id });
  const showToast = (msg) => {
    setToast(msg);
    clearTimeout(window._t);
    window._t = setTimeout(() => setToast(null), 2400);
  };

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: Icon.Home },
    { id: "inventory", label: "Inventory", icon: Icon.Car, count: 47 },
    { id: "campaigns", label: "Campaigns", icon: Icon.Megaphone, count: 18 },
    { id: "templates", label: "Templates", icon: Icon.Layers },
    { id: "designer", label: "Designer", icon: Icon.Sparkles },
    { id: "creatives", label: "Creatives", icon: Icon.Image },
    { id: "leads", label: "Leads", icon: Icon.Inbox, count: 8, badge: true },
    { id: "testdrive", label: "Test Drive", icon: Icon.Mic },
    { id: "marketing", label: "Marketing", icon: Icon.Send },
    { id: "reports", label: "Reports", icon: Icon.Chart },
    { id: "settings", label: "Settings", icon: Icon.Settings },
  ];

  // Campaigns screen redirects to builder for the demo
  const screenMap = {
    dashboard: () => <Dashboard nav={nav}/>,
    inventory: () => <Inventory nav={nav}/>,
    vehicle: () => <VehicleDetail vehicleId={route.id} nav={nav}/>,
    builder: () => <CampaignBuilder vehicleId={route.id} nav={nav} toast={showToast}/>,
    campaigns: () => <CampaignsList nav={nav}/>,
    templates: () => <Templates nav={nav} toast={showToast}/>,
    creatives: () => <Creatives nav={nav} toast={showToast}/>,
    designer: () => <CreativeBuilder vehicleId={route.id} nav={nav} toast={showToast}/>,
    leads: () => <Leads nav={nav} toast={showToast}/>,
    testdrive: () => <TestDrive nav={nav} toast={showToast}/>,
    marketing: () => <Marketing nav={nav} toast={showToast}/>,
    reports: () => <Reports nav={nav}/>,
    settings: () => <Settings toast={showToast}/>,
  };

  const isFullBleed = ["builder", "leads", "designer", "testdrive"].includes(route.screen);

  const activeNav = route.screen === "vehicle" ? "inventory" :
                    route.screen === "builder" ? "campaigns" :
                    route.screen;
  // expand nav to 8 items now


  return (
    <div className="app">
      {/* Sidebar */}
      <aside className="sidebar" data-screen-label="Sidebar">
        <div className="brand">
          <div className="brand-mark">
            G<span className="dot"/>G
          </div>
          <div>
            <div className="brand-name">Get.Go.Gone.</div>
            <div className="brand-sub">Wabash Auto</div>
          </div>
        </div>
        <nav className="nav">
          <div className="nav-section">Workspace</div>
          {navItems.slice(0, 9).map(n => {
            const I = n.icon;
            return (
              <button key={n.id} className={`nav-item ${activeNav === n.id ? "active" : ""}`} onClick={() => nav(n.id)}>
                <I size={15} className="ico"/>
                <span>{n.label}</span>
                {n.count != null && <span className="count">{n.count}</span>}
              </button>
            );
          })}
          <div className="nav-section">System</div>
          <button className={`nav-item ${activeNav === "settings" ? "active" : ""}`} onClick={() => nav("settings")}>
            <Icon.Settings size={15} className="ico"/>
            <span>Settings</span>
          </button>
        </nav>
        <div className="sidebar-foot">
          <div className="avatar">RL</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="user-name">Ray Lawson</div>
            <div className="user-role">Lot owner</div>
          </div>
          <button className="icon-btn" style={{ width: 26, height: 26 }}><Icon.ChevronDown size={13}/></button>
        </div>
      </aside>

      {/* Topbar */}
      <header className="topbar" data-screen-label="Topbar">
        <div className="search">
          <Icon.Search size={13}/>
          <input placeholder="Search vehicles, leads, campaigns..."/>
          <span className="kbd">⌘K</span>
        </div>
        <div className="topbar-actions">
          <button className="btn" onClick={() => setImportDrawer(true)}>
            <Icon.Upload size={13}/> Import
          </button>
          <button className="btn primary" onClick={() => nav("builder")}>
            <Icon.Sparkles size={13}/> Generate Campaign
          </button>
          <div style={{ width: 1, height: 22, background: "var(--border)", margin: "0 4px" }}/>
          <button className="icon-btn" title="Notifications"><Icon.Bell size={16}/><span className="badge"/></button>
          <button className="icon-btn" title="Help"><Icon.FileText size={16}/></button>
        </div>
      </header>

      {/* Main */}
      <main className="main" data-screen-label={route.screen} style={isFullBleed ? { padding: 0 } : undefined}>
        {(screenMap[route.screen] || screenMap.dashboard)()}
      </main>

      {/* Toast */}
      {toast && <div className="toast"><Icon.CheckCircle size={14}/> {toast}</div>}

      {/* Import drawer */}
      {importDrawer && <ImportDrawer onClose={() => setImportDrawer(false)} onDone={() => { setImportDrawer(false); showToast("Imported 3 vehicles"); }}/>}
    </div>
  );
}

function CampaignsList({ nav }) {
  const { VEHICLES, CHANNELS, statusPill, fmt$ } = window.GGG;
  const { Pill, Btn, VehicleThumb, ChannelBadge } = window.UI;
  const campaigns = VEHICLES.flatMap(v => [
    { id: v.id + "-1", v, name: `${v.year} ${v.make} ${v.model} — Fresh Arrival`, status: v.campaign, leads: v.leads, channels: ["fb","ig","cl"], spend: 42, created: "May 7" },
  ]);
  const [filter, setFilter] = React.useState("all");
  const filters = ["all","Published","Ready to Review","Draft","Paused","Needs Refresh"];
  const filtered = filter === "all" ? campaigns : campaigns.filter(c => c.status === filter);

  return (
    <div className="page">
      <div className="page-h">
        <div>
          <h1>Campaigns</h1>
          <div className="sub">{campaigns.length} total across all vehicles</div>
        </div>
        <div className="page-actions">
          <Btn icon={Icon.Sparkles} variant="primary" onClick={() => nav("builder")}>New campaign</Btn>
        </div>
      </div>

      <div style={{ display: "flex", gap: 4, marginBottom: 12 }}>
        {filters.map(f => (
          <button key={f} className={`chip ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>
            {f === "all" ? "All" : f}
            <span style={{ marginLeft: 4, color: filter === f ? "rgba(255,255,255,0.7)" : "var(--text-2)" }}>
              {f === "all" ? campaigns.length : campaigns.filter(c => c.status === f).length}
            </span>
          </button>
        ))}
      </div>

      <div className="card">
        <table className="tbl">
          <thead>
            <tr>
              <th>Campaign</th>
              <th>Status</th>
              <th>Channels</th>
              <th>Leads</th>
              <th>Spend</th>
              <th>Created</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => (
              <tr key={c.id} onClick={() => nav("builder", c.v.id)} style={{ cursor: "pointer" }}>
                <td>
                  <div className="row">
                    <VehicleThumb v={c.v}/>
                    <div>
                      <div style={{ fontWeight: 600 }}>{c.name}</div>
                      <div className="muted mono" style={{ fontSize: 11 }}>{c.v.stock}</div>
                    </div>
                  </div>
                </td>
                <td><Pill tone={statusPill(c.status)} dot>{c.status}</Pill></td>
                <td>
                  <div className="row" style={{ gap: 3 }}>
                    {c.channels.map(id => {
                      const ch = CHANNELS.find(x => x.id === id);
                      return <ChannelBadge key={id} ch={ch} size={20}/>;
                    })}
                  </div>
                </td>
                <td className="mono" style={{ fontWeight: 600 }}>{c.leads}</td>
                <td className="mono">${c.spend}</td>
                <td className="muted">{c.created}</td>
                <td><button className="icon-btn" style={{ width: 26, height: 26 }} onClick={(e) => e.stopPropagation()}><Icon.More size={14}/></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ImportDrawer({ onClose, onDone }) {
  const { Btn } = window.UI;
  const [mode, setMode] = React.useState("csv");
  return (
    <>
      <div className="drawer-bg" onClick={onClose}/>
      <div className="drawer">
        <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0, fontSize: 14 }}>Import inventory</h3>
          <button className="icon-btn" onClick={onClose}><Icon.X size={15}/></button>
        </div>
        <div style={{ padding: 16, flex: 1, overflow: "auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 16 }}>
            {[
              { id: "csv", label: "CSV file" },
              { id: "feed", label: "Website feed" },
              { id: "manual", label: "Add one" },
            ].map(m => (
              <button key={m.id} className={`chip ${mode === m.id ? "active" : ""}`} onClick={() => setMode(m.id)} style={{ justifyContent: "center", padding: "8px" }}>
                {m.label}
              </button>
            ))}
          </div>

          {mode === "csv" && (
            <>
              <div style={{ border: "2px dashed var(--border-strong)", borderRadius: "var(--radius)", padding: 30, textAlign: "center", color: "var(--text-2)", marginBottom: 14 }}>
                <Icon.Upload size={22} className="ico"/>
                <div style={{ marginTop: 8, fontWeight: 500, fontSize: 13 }}>Drop CSV file here</div>
                <div style={{ fontSize: 11, marginTop: 4 }}>or <span style={{ color: "var(--primary)" }}>browse files</span></div>
              </div>
              <div style={{ background: "var(--gray-50)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: 12, fontSize: 12, color: "var(--text-2)" }}>
                <div style={{ fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>CSV format</div>
                <div className="mono" style={{ fontSize: 11 }}>stock_number, year, make, model, trim, mileage, price, down, weekly, vin, color</div>
                <button className="btn ghost sm" style={{ marginTop: 6, padding: 0, color: "var(--primary)" }}>Download template</button>
              </div>
            </>
          )}

          {mode === "feed" && (
            <div className="col" style={{ gap: 10 }}>
              <div className="field">
                <label>Feed URL</label>
                <input className="input mono" placeholder="https://yoursite.com/inventory.xml"/>
              </div>
              <div className="field">
                <label>Format</label>
                <select className="select"><option>vAuto XML</option><option>DealerCenter CSV</option><option>AutoManager</option><option>Custom XML</option></select>
              </div>
              <label className="checkbox"><input type="checkbox" defaultChecked/> Auto-sync every 4 hours</label>
            </div>
          )}

          {mode === "manual" && (
            <div className="col" style={{ gap: 10 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                <div className="field"><label>Year</label><input className="input mono" placeholder="2018"/></div>
                <div className="field"><label>Make</label><input className="input" placeholder="Honda"/></div>
                <div className="field"><label>Model</label><input className="input" placeholder="Accord"/></div>
              </div>
              <div className="field"><label>Trim</label><input className="input" placeholder="EX-L"/></div>
              <div className="field"><label>VIN</label><input className="input mono" placeholder="17 chars"/></div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                <div className="field"><label>Price</label><input className="input mono" placeholder="$11,995"/></div>
                <div className="field"><label>Down</label><input className="input mono" placeholder="$1,500"/></div>
                <div className="field"><label>Weekly</label><input className="input mono" placeholder="$89"/></div>
              </div>
            </div>
          )}
        </div>
        <div style={{ padding: 12, borderTop: "1px solid var(--border)", display: "flex", justifyContent: "flex-end", gap: 6 }}>
          <Btn onClick={onClose}>Cancel</Btn>
          <Btn variant="primary" onClick={onDone}>Import</Btn>
        </div>
      </div>
    </>
  );
}

window.App = App;
