function Leads({ nav, toast }) {
  const { LEADS, VEHICLES, statusPill } = window.GGG;
  const { Pill, Btn } = window.UI;
  const [selId, setSelId] = React.useState(LEADS[0].id);
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [sourceFilter, setSourceFilter] = React.useState("all");

  const sel = LEADS.find(l => l.id === selId);
  const vehicle = sel && VEHICLES.find(v => v.id === sel.vid);

  const counts = {
    all: LEADS.length,
    New: LEADS.filter(l => l.status === "New").length,
    Contacted: LEADS.filter(l => l.status === "Contacted").length,
    "Appointment Set": LEADS.filter(l => l.status === "Appointment Set").length,
    Sold: LEADS.filter(l => l.status === "Sold").length,
    Lost: LEADS.filter(l => l.status === "Lost").length,
  };

  const rows = LEADS.filter(l => {
    if (statusFilter !== "all" && l.status !== statusFilter) return false;
    if (sourceFilter !== "all" && l.source !== sourceFilter) return false;
    return true;
  });

  return (
    <div style={{ height: "100%", display: "grid", gridTemplateColumns: "1fr 440px", overflow: "hidden" }}>
      {/* List */}
      <div style={{ overflow: "auto" }}>
        <div className="page" style={{ paddingBottom: 20 }}>
          <div className="page-h">
            <div>
              <h1>Leads inbox</h1>
              <div className="sub">{LEADS.length} total · 2 new · 1 appointment today</div>
            </div>
            <div className="page-actions">
              <Btn icon={Icon.Download}>Export</Btn>
              <Btn icon={Icon.Plus} variant="dark">Add lead</Btn>
            </div>
          </div>

          <div style={{ display: "flex", gap: 4, marginBottom: 12, flexWrap: "wrap" }}>
            {Object.entries(counts).map(([k, n]) => (
              <button key={k} className={`chip ${statusFilter === k ? "active" : ""}`} onClick={() => setStatusFilter(k)}>
                {k === "all" ? "All" : k} <span style={{ marginLeft: 4, color: statusFilter === k ? "rgba(255,255,255,0.7)" : "var(--text-2)" }}>{n}</span>
              </button>
            ))}
            <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
              <select className="select" value={sourceFilter} onChange={e => setSourceFilter(e.target.value)} style={{ width: 140 }}>
                <option value="all">All sources</option>
                {[...new Set(LEADS.map(l => l.source))].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="card">
            <table className="tbl">
              <thead>
                <tr><th>Lead</th><th>Source</th><th>Vehicle</th><th>Status</th><th>When</th></tr>
              </thead>
              <tbody>
                {rows.map(l => (
                  <tr key={l.id} onClick={() => setSelId(l.id)} className={selId === l.id ? "selected" : ""} style={{ cursor: "pointer" }}>
                    <td>
                      <div className="row" style={{ gap: 9 }}>
                        <div className="avatar" style={{ background: "var(--gray-100)", color: "var(--gray-700)" }}>
                          {l.name.split(" ").map(s => s[0]).join("").slice(0, 2)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{l.name}</div>
                          <div className="muted mono" style={{ fontSize: 11 }}>{l.phone}</div>
                        </div>
                      </div>
                    </td>
                    <td><Pill>{l.source}</Pill></td>
                    <td>
                      <div style={{ fontSize: 12.5 }}>{l.vehicle}</div>
                    </td>
                    <td><Pill tone={statusPill(l.status)} dot>{l.status}</Pill></td>
                    <td className="muted">{l.when}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Detail panel */}
      <aside style={{ borderLeft: "1px solid var(--border)", background: "var(--surface)", overflow: "auto", display: "flex", flexDirection: "column" }}>
        {sel && (
          <>
            <div style={{ padding: 16, borderBottom: "1px solid var(--border)" }}>
              <div style={{ display: "flex", gap: 12 }}>
                <div className="avatar lg" style={{ background: "var(--primary-100)", color: "var(--primary-700)" }}>
                  {sel.name.split(" ").map(s => s[0]).join("").slice(0, 2)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 15, letterSpacing: "-0.01em" }}>{sel.name}</div>
                  <div className="muted mono" style={{ fontSize: 12 }}>{sel.phone}</div>
                  <div className="row" style={{ gap: 6, marginTop: 6 }}>
                    <Pill tone={statusPill(sel.status)} dot>{sel.status}</Pill>
                    <Pill>{sel.source}</Pill>
                  </div>
                </div>
              </div>
              <div className="row" style={{ marginTop: 12, gap: 6 }}>
                <Btn size="sm" icon={Icon.Phone} variant="primary">Call</Btn>
                <Btn size="sm" icon={Icon.Msg}>Text</Btn>
                <Btn size="sm" icon={Icon.Mail}>Email</Btn>
                <Btn size="sm" icon={Icon.Calendar}>Schedule</Btn>
              </div>
            </div>

            {/* Vehicle of interest */}
            <div style={{ padding: 16, borderBottom: "1px solid var(--border)" }}>
              <div className="muted" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600, marginBottom: 8 }}>Vehicle of interest</div>
              {vehicle && (
                <button onClick={() => nav("vehicle", vehicle.id)} style={{ background: "var(--gray-50)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: 10, width: "100%", textAlign: "left", cursor: "pointer", fontFamily: "inherit", display: "flex", gap: 10 }}>
                  <window.UI.VehicleThumb v={vehicle}/>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 12.5 }}>{vehicle.year} {vehicle.make} {vehicle.model}</div>
                    <div className="muted mono" style={{ fontSize: 11 }}>{window.GGG.fmt$(vehicle.price)} · {window.GGG.fmt$(vehicle.down)} down · {window.GGG.fmt$(vehicle.weekly)}/wk</div>
                  </div>
                  <Icon.ChevronRight size={14} className="ico"/>
                </button>
              )}
            </div>

            {/* Status / appointment */}
            <div style={{ padding: 16, borderBottom: "1px solid var(--border)" }}>
              <div className="muted" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600, marginBottom: 8 }}>Status</div>
              <select className="select" defaultValue={sel.status}>
                {["New","Contacted","Appointment Set","Showed","Sold","Lost"].map(s => <option key={s}>{s}</option>)}
              </select>
              {sel.appt && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10, padding: "8px 10px", background: "var(--primary-50)", borderRadius: "var(--radius)", color: "var(--primary-700)", fontSize: 12.5 }}>
                  <Icon.Calendar size={14}/>
                  <div style={{ fontWeight: 600 }}>Appointment {sel.appt}</div>
                </div>
              )}
            </div>

            {/* Notes */}
            <div style={{ padding: 16, borderBottom: "1px solid var(--border)" }}>
              <div className="muted" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600, marginBottom: 8 }}>Notes</div>
              <textarea className="input" defaultValue={sel.note} rows={3}/>
              <Btn size="sm" variant="dark" style={{ marginTop: 6 }} onClick={() => toast("Note saved")}>Save note</Btn>
            </div>

            {/* Timeline */}
            <div style={{ padding: 16, flex: 1 }}>
              <div className="muted" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600, marginBottom: 10 }}>Activity</div>
              <Timeline status={sel.status}/>
            </div>

            <div style={{ padding: 12, borderTop: "1px solid var(--border)" }}>
              <Btn variant="primary" icon={Icon.Send} style={{ width: "100%", justifyContent: "center" }}>Send follow-up text</Btn>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}

function Timeline({ status }) {
  const events = [
    { when: "Just now", what: "Lead created from Facebook ad", who: "System" },
    { when: "—", what: "Auto-reply sent: 'Thanks for your interest...'", who: "System" },
  ];
  if (status !== "New") events.push({ when: "Earlier", what: "Sales rep called — left voicemail", who: "Ray L." });
  if (["Appointment Set","Showed","Sold"].includes(status)) events.push({ when: "Earlier", what: "Appointment confirmed via text", who: "Sarah K." });
  if (["Showed","Sold"].includes(status)) events.push({ when: "Earlier", what: "Customer showed for test drive", who: "Ray L." });
  if (status === "Sold") events.push({ when: "Earlier", what: "Sale completed · Finance app submitted", who: "Mike T." });

  return (
    <div>
      {events.map((e, i) => (
        <div key={i} style={{ display: "flex", gap: 10, paddingBottom: 10, position: "relative" }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: i === events.length - 1 ? "var(--primary)" : "var(--border-strong)", marginTop: 5, flex: "0 0 7px", position: "relative", zIndex: 1 }}/>
          {i < events.length - 1 && <div style={{ position: "absolute", left: 3, top: 12, bottom: 0, width: 1, background: "var(--border)" }}/>}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12.5 }}>{e.what}</div>
            <div className="muted" style={{ fontSize: 11 }}>{e.who} · {e.when}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

window.Leads = Leads;
