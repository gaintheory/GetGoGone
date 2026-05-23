function VehicleDetail({ vehicleId, nav }) {
  const { VEHICLES, LEADS, fmt$, fmtMi, statusPill, vehicleSvg } = window.GGG;
  const { Pill, Btn, VehicleThumb } = window.UI;
  const v = VEHICLES.find(x => x.id === vehicleId) || VEHICLES[0];
  const [tab, setTab] = React.useState("overview");
  const [photoIdx, setPhotoIdx] = React.useState(0);
  const leads = LEADS.filter(l => l.vid === v.id);

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "campaigns", label: "Campaigns", count: 3 },
    { id: "leads", label: "Leads", count: leads.length },
    { id: "photos", label: "Photos", count: v.photos },
    { id: "history", label: "History" },
  ];

  return (
    <div className="page">
      {/* Breadcrumb + actions */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-2)", marginBottom: 10 }}>
        <button onClick={() => nav("inventory")} className="btn ghost sm" style={{ padding: "2px 6px" }}>
          <Icon.ChevronLeft size={12}/> Inventory
        </button>
        <span>/</span>
        <span className="muted">{v.stock}</span>
      </div>

      <div className="page-h">
        <div className="row" style={{ gap: 14 }}>
          <VehicleThumb v={v} size="lg"/>
          <div>
            <h1>{v.year} {v.make} {v.model} <span style={{ fontWeight: 400, color: "var(--text-2)" }}>{v.trim}</span></h1>
            <div className="row" style={{ gap: 8, marginTop: 4 }}>
              <Pill tone={statusPill(v.status)} dot>{v.status}</Pill>
              <Pill tone={statusPill(v.campaign)}>Campaign: {v.campaign}</Pill>
              <span className="muted" style={{ fontSize: 12 }}>· {v.color} · VIN {v.vin}</span>
            </div>
          </div>
        </div>
        <div className="page-actions">
          <Btn icon={Icon.Edit}>Edit</Btn>
          <Btn icon={Icon.Tag}>Update price</Btn>
          <Btn icon={Icon.CheckCircle}>Mark sold</Btn>
          <Btn icon={Icon.Sparkles} variant="primary" onClick={() => nav("builder", v.id)}>Generate campaign</Btn>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 16, alignItems: "start" }}>
        {/* Left column */}
        <div>
          {/* Photo gallery */}
          <div className="card" style={{ marginBottom: 14 }}>
            <div style={{ height: 280, background: "var(--gray-100)", borderRadius: "var(--radius-lg) var(--radius-lg) 0 0", overflow: "hidden", position: "relative" }}
              dangerouslySetInnerHTML={{ __html: vehicleSvg(v.body, v.palette).replace('viewBox="0 0 200 130"', 'viewBox="0 0 200 130" preserveAspectRatio="xMidYMid slice" width="100%" height="100%"') }}/>
            <div style={{ padding: "10px 12px", display: "flex", gap: 6, overflow: "auto" }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <button key={i} onClick={() => setPhotoIdx(i)}
                  style={{ flex: "0 0 76px", height: 54, borderRadius: "var(--radius-sm)", border: i === photoIdx ? "2px solid var(--primary)" : "1px solid var(--border)", overflow: "hidden", background: "var(--gray-100)", padding: 0, cursor: "pointer" }}
                  dangerouslySetInnerHTML={{ __html: vehicleSvg(v.body, v.palette) }}/>
              ))}
              <button className="btn sm" style={{ flex: "0 0 auto", marginLeft: "auto" }}><Icon.Camera size={12}/> Add photos</button>
            </div>
          </div>

          <div className="card">
            <div className="card-h" style={{ paddingBottom: 0, border: "none" }}>
              <Tabs tabs={tabs} value={tab} onChange={setTab}/>
            </div>
            <div className="card-b">
              {tab === "overview" && <OverviewTab v={v}/>}
              {tab === "campaigns" && <CampaignsTab v={v} nav={nav}/>}
              {tab === "leads" && <LeadsTab leads={leads}/>}
              {tab === "photos" && <PhotosTab v={v}/>}
              {tab === "history" && <HistoryTab/>}
            </div>
          </div>
        </div>

        {/* Right column — Pricing + similar */}
        <div className="col" style={{ gap: 14 }}>
          <div className="card">
            <div className="card-h"><h3>Pricing & payments</h3></div>
            <div className="card-b col" style={{ gap: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span className="muted" style={{ fontSize: 12 }}>List price</span>
                <span className="mono" style={{ fontSize: 22, fontWeight: 600 }}>{fmt$(v.price)}</span>
              </div>
              <div className="hr" style={{ margin: 0 }}/>
              <PayLine label="Down payment" value={fmt$(v.down)}/>
              <PayLine label="Weekly payment" value={fmt$(v.weekly)} highlight/>
              <PayLine label="Monthly equivalent" value={fmt$(v.monthly)}/>
              <PayLine label="Term" value="42 weeks"/>
              <PayLine label="APR" value="19.99%"/>
              <div style={{ background: "var(--warning-50)", padding: "8px 10px", borderRadius: "var(--radius)", fontSize: 11.5, color: "#92400E", marginTop: 4 }}>
                <strong>Disclosure required.</strong> Down payment + weekly OAC. APR may vary by credit. WAC.
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-h"><h3>Features</h3></div>
            <div className="card-b">
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {v.features.map(f => <Pill key={f}>{f}</Pill>)}
                <button className="chip" style={{ borderStyle: "dashed", borderWidth: 1, borderColor: "var(--border)" }}>
                  <Icon.Plus size={11}/> Add
                </button>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-h">
              <h3>Similar vehicles</h3>
              <Btn size="sm" variant="ghost">3</Btn>
            </div>
            <div className="card-b" style={{ padding: 0 }}>
              {VEHICLES.filter(x => x.id !== v.id && x.body === v.body).slice(0, 3).map((s, i, arr) => (
                <button key={s.id} onClick={() => nav("vehicle", s.id)}
                  style={{ width: "100%", display: "flex", gap: 10, padding: "10px 14px", borderBottom: i < arr.length - 1 ? "1px solid var(--border)" : "none", background: "transparent", border: "none", textAlign: "left", cursor: "pointer", fontFamily: "inherit" }}>
                  <VehicleThumb v={s}/>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 12.5 }}>{s.year} {s.make} {s.model}</div>
                    <div className="mono muted" style={{ fontSize: 11.5 }}>{fmt$(s.price)} · {fmt$(s.down)} down</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-h"><h3>Quick actions</h3></div>
            <div className="card-b col" style={{ gap: 6 }}>
              <button className="btn"><Icon.Globe size={13}/> Create landing page</button>
              <button className="btn"><Icon.Share size={13}/> Share with customer</button>
              <button className="btn"><Icon.FileText size={13}/> Print window sticker</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PayLine({ label, value, highlight }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: highlight ? "6px 8px" : 0, background: highlight ? "var(--primary-50)" : "transparent", borderRadius: "var(--radius)", margin: highlight ? "0 -2px" : 0 }}>
      <span className={highlight ? "" : "muted"} style={{ fontSize: 12, fontWeight: highlight ? 600 : 400, color: highlight ? "var(--primary-700)" : undefined }}>{label}</span>
      <span className="mono" style={{ fontWeight: 600, color: highlight ? "var(--primary-700)" : undefined }}>{value}</span>
    </div>
  );
}

function OverviewTab({ v }) {
  const { fmt$, fmtMi } = window.GGG;
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 0, marginBottom: 16, border: "1px solid var(--border)", borderRadius: "var(--radius)" }}>
        {[
          { l: "Mileage", v: fmtMi(v.mileage) },
          { l: "VIN", v: v.vin, small: true },
          { l: "Color", v: v.color },
          { l: "Stock #", v: v.stock },
          { l: "Days on lot", v: `${v.daysIn} days` },
          { l: "Photos", v: `${v.photos} uploaded` },
          { l: "Leads", v: `${v.leads} total` },
          { l: "Status", v: v.status },
        ].map((s, i) => (
          <div key={i} style={{ padding: "10px 12px", borderRight: (i % 4 !== 3) ? "1px solid var(--border)" : "none", borderTop: i >= 4 ? "1px solid var(--border)" : "none" }}>
            <div className="muted" style={{ fontSize: 11 }}>{s.l}</div>
            <div className="mono" style={{ fontWeight: 600, fontSize: s.small ? 11 : 13, marginTop: 2 }}>{s.v}</div>
          </div>
        ))}
      </div>

      <div className="col" style={{ gap: 4, marginBottom: 16 }}>
        <label className="muted" style={{ fontSize: 11.5, fontWeight: 500 }}>Internal notes</label>
        <div style={{ background: "var(--gray-50)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "10px 12px", fontSize: 12.5 }}>
          {v.notes}
        </div>
      </div>

      <div>
        <h4 style={{ margin: "0 0 8px", fontSize: 12.5 }}>Description (auto-generated)</h4>
        <div style={{ background: "var(--gray-50)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "10px 12px", fontSize: 12.5, lineHeight: 1.55 }}>
          Looking for a reliable ride that won't break the bank? Check out this {v.year} {v.make} {v.model} {v.trim}. With only {fmtMi(v.mileage)} on the odometer and features like {v.features.slice(0, 3).join(", ")}, this {v.color} {v.model} is ready to roll. <strong>Just {fmt$(v.down)} down — {fmt$(v.weekly)}/week.</strong> We finance — bad credit, no credit, no problem.<br/>
          <span className="muted" style={{ fontSize: 11.5 }}>Edited 2 days ago by Ray · </span>
          <button className="btn ghost sm" style={{ padding: "0 4px", color: "var(--primary)" }}>Regenerate</button>
        </div>
      </div>
    </div>
  );
}

function CampaignsTab({ v, nav }) {
  const { Pill, Btn } = window.UI;
  const campaigns = [
    { id: "c1", name: "Fresh Arrival — Week 1", status: "Published", channels: ["fb","ig","cl"], leads: 8, when: "May 7" },
    { id: "c2", name: "Low Down Payment", status: "Ready to Review", channels: ["fb","cars"], leads: 0, when: "May 16" },
    { id: "c3", name: "Tax Refund Special", status: "Paused", channels: ["fb","ig","gbp"], leads: 3, when: "Apr 2" },
  ];
  const { statusPill, CHANNELS } = window.GGG;
  return (
    <table className="tbl">
      <thead>
        <tr><th>Campaign</th><th>Status</th><th>Channels</th><th>Leads</th><th>Created</th><th></th></tr>
      </thead>
      <tbody>
        {campaigns.map(c => (
          <tr key={c.id}>
            <td style={{ fontWeight: 600 }}>{c.name}</td>
            <td><Pill tone={statusPill(c.status)} dot>{c.status}</Pill></td>
            <td>
              <div style={{ display: "flex", gap: 3 }}>
                {c.channels.map(id => {
                  const ch = CHANNELS.find(x => x.id === id);
                  return <window.UI.ChannelBadge key={id} ch={ch} size={20}/>;
                })}
              </div>
            </td>
            <td className="mono" style={{ fontWeight: 600 }}>{c.leads}</td>
            <td className="muted">{c.when}</td>
            <td><Btn size="sm" variant="ghost" onClick={() => nav("builder", v.id)}>Open</Btn></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function LeadsTab({ leads }) {
  const { Pill } = window.UI;
  const { statusPill } = window.GGG;
  if (leads.length === 0) return <div className="muted" style={{ padding: 20, textAlign: "center", fontSize: 12.5 }}>No leads yet on this vehicle.</div>;
  return (
    <table className="tbl">
      <thead><tr><th>Lead</th><th>Source</th><th>Status</th><th>Note</th><th>When</th></tr></thead>
      <tbody>
        {leads.map(l => (
          <tr key={l.id}>
            <td>
              <div style={{ fontWeight: 600 }}>{l.name}</div>
              <div className="muted mono" style={{ fontSize: 11 }}>{l.phone}</div>
            </td>
            <td><Pill>{l.source}</Pill></td>
            <td><Pill tone={statusPill(l.status)} dot>{l.status}</Pill></td>
            <td className="muted" style={{ fontSize: 12 }}>{l.note}</td>
            <td className="muted">{l.when}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function PhotosTab({ v }) {
  const { vehicleSvg } = window.GGG;
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} style={{ aspectRatio: "4/3", borderRadius: "var(--radius)", overflow: "hidden", background: "var(--gray-100)", border: "1px solid var(--border)" }}
          dangerouslySetInnerHTML={{ __html: vehicleSvg(v.body, v.palette) }}/>
      ))}
      <button style={{ aspectRatio: "4/3", borderRadius: "var(--radius)", background: "var(--gray-50)", border: "2px dashed var(--border-strong)", color: "var(--text-2)", display: "grid", placeItems: "center", cursor: "pointer", fontSize: 12, fontFamily: "inherit", gap: 4, flexDirection: "column" }}>
        <Icon.Plus size={20}/>
        <span>Add photo</span>
      </button>
    </div>
  );
}

function HistoryTab() {
  const events = [
    { when: "May 18, 2:14pm", who: "Ray L.", what: "Generated 'Tax Refund Special' campaign" },
    { when: "May 14, 9:02am", who: "System", what: "Auto-refreshed Facebook ad — no new leads in 7 days" },
    { when: "May 10, 11:30am", who: "Sarah K.", what: "Updated price from $12,495 → $11,995" },
    { when: "May 7, 4:20pm", who: "Ray L.", what: "Published 'Fresh Arrival — Week 1'" },
    { when: "May 7, 3:55pm", who: "Ray L.", what: "Uploaded 14 photos" },
    { when: "May 7, 2:00pm", who: "Mike T.", what: "Created vehicle record from website import" },
  ];
  return (
    <div style={{ position: "relative" }}>
      {events.map((e, i) => (
        <div key={i} style={{ display: "flex", gap: 12, padding: "8px 0", borderBottom: i < events.length - 1 ? "1px solid var(--border)" : "none" }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: i === 0 ? "var(--primary)" : "var(--border-strong)", marginTop: 5, flex: "0 0 8px" }}/>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12.5 }}>{e.what}</div>
            <div className="muted" style={{ fontSize: 11 }}>{e.who} · {e.when}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

window.VehicleDetail = VehicleDetail;
