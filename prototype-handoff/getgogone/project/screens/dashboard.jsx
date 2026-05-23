function Dashboard({ nav }) {
  const { VEHICLES, LEADS, CHANNELS, fmt$, statusPill } = window.GGG;
  const { Pill, Btn, VehicleThumb, KPI, Sparkline, ChannelBadge } = window.UI;

  const active = VEHICLES.filter(v => v.status !== "Sold").length;
  const needsAttention = VEHICLES.filter(v => ["Needs Photos","Missing Payment","Needs Refresh"].includes(v.status) || v.campaign === "Needs Refresh");
  const aging = VEHICLES.filter(v => v.daysIn >= 30).sort((a,b) => b.daysIn - a.daysIn);
  const newLeadsToday = LEADS.filter(l => l.when.includes("min") || l.when.includes("hr ago")).length;
  const activeCampaigns = VEHICLES.filter(v => ["Published","Ready to Review"].includes(v.campaign)).length;

  return (
    <div className="page">
      <div className="page-h">
        <div>
          <h1>Good morning, Ray</h1>
          <div className="sub">Tuesday, May 19 · Wabash Auto Sales · 47 vehicles on the lot</div>
        </div>
        <div className="page-actions">
          <Btn icon={Icon.Upload}>Import CSV</Btn>
          <Btn icon={Icon.Sparkles} variant="primary" onClick={() => nav("builder")}>Generate Campaign</Btn>
        </div>
      </div>

      <div className="kpis">
        <KPI label="Active inventory" value={active} delta="3 new this week" deltaTone="up" icon={Icon.Car}
             spark={[20,22,21,24,26,28,29,30,29,31,32,34]} sparkColor="#2563EB"/>
        <KPI label="Active campaigns" value={activeCampaigns} delta="2 ready to review" deltaTone="up" icon={Icon.Megaphone}
             spark={[10,11,9,13,12,14,16,15,18,17,19,21]} sparkColor="#0891B2"/>
        <KPI label="New leads today" value={newLeadsToday} delta="vs 4 yesterday" deltaTone="up" icon={Icon.Inbox}
             spark={[3,5,2,6,4,7,5,8,6,9,7,11]} sparkColor="#16A34A"/>
        <KPI label="Needs attention" value={needsAttention.length} delta="3 vehicles" deltaTone="down" icon={Icon.AlertTriangle}
             spark={[5,6,7,6,7,8,7,9,8,7,6,7]} sparkColor="#F59E0B"/>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 14 }}>
        {/* Needs attention */}
        <div className="card">
          <div className="card-h">
            <div>
              <h3>Vehicles needing attention</h3>
              <div className="sub">Resolve to keep campaigns running</div>
            </div>
            <Btn size="sm" variant="ghost" iconRight={Icon.ChevronRight} onClick={() => nav("inventory")}>View all</Btn>
          </div>
          <div className="card-b flush">
            <table className="tbl">
              <tbody>
                {needsAttention.slice(0, 5).map(v => (
                  <tr key={v.id} onClick={() => nav("vehicle", v.id)} style={{cursor:"pointer"}}>
                    <td style={{ width: 70 }}><VehicleThumb v={v}/></td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{v.year} {v.make} {v.model}</div>
                      <div className="muted" style={{ fontSize: 11.5 }}>{v.stock} · {v.color}</div>
                    </td>
                    <td><Pill tone={statusPill(v.status)} dot>{v.status}</Pill></td>
                    <td style={{ textAlign: "right" }}>
                      <Btn size="sm" variant="ghost">
                        {v.status === "Needs Photos" ? "Add photos" :
                         v.status === "Missing Payment" ? "Set terms" : "Refresh ads"}
                        <Icon.ArrowRight size={12}/>
                      </Btn>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* New leads */}
        <div className="card">
          <div className="card-h">
            <div>
              <h3>New leads</h3>
              <div className="sub">Last 24 hours · {newLeadsToday} new</div>
            </div>
            <Btn size="sm" variant="ghost" iconRight={Icon.ChevronRight} onClick={() => nav("leads")}>Inbox</Btn>
          </div>
          <div className="card-b" style={{ padding: 0 }}>
            {LEADS.slice(0, 5).map((l, i) => (
              <div key={l.id} style={{ display: "flex", gap: 10, padding: "10px 14px", borderBottom: i < 4 ? "1px solid var(--border)" : "none" }}>
                <div className="avatar" style={{ background: "var(--gray-100)", color: "var(--gray-700)" }}>
                  {l.name.split(" ").map(s => s[0]).join("").slice(0, 2)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <span style={{ fontWeight: 600, fontSize: 12.5 }}>{l.name}</span>
                    <span className="muted" style={{ fontSize: 11 }}>{l.when}</span>
                  </div>
                  <div className="muted" style={{ fontSize: 11.5, marginTop: 1 }}>
                    {l.source} · {l.vehicle}
                  </div>
                </div>
                <Pill tone={statusPill(l.status)}>{l.status}</Pill>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Campaign performance + aging + channel mix */}
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 14, marginTop: 14 }}>
        <div className="card">
          <div className="card-h">
            <div>
              <h3>Campaign performance · 14 days</h3>
              <div className="sub">Leads attributed by channel</div>
            </div>
            <div className="row">
              <button className="chip active">14d</button>
              <button className="chip">30d</button>
              <button className="chip">90d</button>
            </div>
          </div>
          <div className="card-b">
            <BarChart/>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginTop: 14 }}>
              {[
                { ch: "Facebook", leads: 42, color: "#1877F2", pct: 80 },
                { ch: "Craigslist", leads: 31, color: "#5C3D7E", pct: 60 },
                { ch: "Cars.com", leads: 18, color: "#A71930", pct: 36 },
                { ch: "Google", leads: 12, color: "#4285F4", pct: 24 },
              ].map(c => (
                <div key={c.ch}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, marginBottom: 4 }}>
                    <span className="muted">{c.ch}</span>
                    <span className="mono" style={{ fontWeight: 600 }}>{c.leads}</span>
                  </div>
                  <div className="bar"><span style={{ width: `${c.pct}%`, background: c.color }}/></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-h">
            <div>
              <h3>Aging inventory</h3>
              <div className="sub">30+ days on the lot</div>
            </div>
            <Btn size="sm" variant="ghost">Run "Still Available"</Btn>
          </div>
          <div className="card-b" style={{ padding: 0 }}>
            {aging.slice(0, 4).map((v, i) => (
              <div key={v.id} style={{ display: "flex", gap: 10, padding: "10px 14px", borderBottom: i < aging.slice(0,4).length - 1 ? "1px solid var(--border)" : "none", alignItems: "center" }}
                onClick={() => nav("vehicle", v.id)} role="button">
                <VehicleThumb v={v}/>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 12.5 }}>{v.year} {v.make} {v.model}</div>
                  <div className="muted" style={{ fontSize: 11.5 }}>{fmt$(v.price)} · {v.leads} leads</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div className="mono" style={{ fontWeight: 600, fontSize: 13 }}>{v.daysIn}d</div>
                  <div className="muted" style={{ fontSize: 11 }}>on lot</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="card" style={{ marginTop: 14 }}>
        <div className="card-h">
          <div>
            <h3>Quick actions</h3>
            <div className="sub">Common Tuesday tasks</div>
          </div>
        </div>
        <div className="card-b" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
          {[
            { t: "Generate Tax Refund campaign", s: "All sedans under $13k", i: Icon.Star },
            { t: "Refresh aging Caravan", s: "41 days on lot · 5 leads", i: Icon.Refresh },
            { t: "Photograph 2017 Altima", s: "Detail booked Thu 9am", i: Icon.Camera },
            { t: "Set terms on Cherokee", s: "Missing weekly/down", i: Icon.Dollar },
          ].map((a, i) => {
            const I = a.i;
            return (
              <button key={i} className="card" style={{ textAlign: "left", padding: 12, cursor: "pointer", background: "var(--surface-2)", border: "1px solid var(--border)", fontFamily: "inherit" }}>
                <div style={{ width: 26, height: 26, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", display: "grid", placeItems: "center", marginBottom: 8 }}><I size={14}/></div>
                <div style={{ fontWeight: 600, fontSize: 12.5 }}>{a.t}</div>
                <div className="muted" style={{ fontSize: 11.5 }}>{a.s}</div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function BarChart() {
  const days = ["W","Th","F","Sa","Su","M","T","W","Th","F","Sa","Su","M","T"];
  const data = [
    [4,3,1], [6,4,2], [5,5,1], [3,2,1], [2,1,1],
    [8,5,2], [9,6,3], [7,4,2], [10,7,3], [11,6,4],
    [8,4,2], [4,2,1], [12,7,4], [9,5,3],
  ];
  const max = 18;
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 140, padding: "8px 4px 0" }}>
      {data.map((d, i) => {
        const tot = d.reduce((a,b)=>a+b,0);
        const h = (tot / max) * 124;
        const fbH = (d[0]/tot)*h, clH = (d[1]/tot)*h, otH = (d[2]/tot)*h;
        return (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <div style={{ display: "flex", flexDirection: "column-reverse", height: 124, width: "100%", justifyContent: "flex-start" }}>
              <div style={{ height: fbH, background: "#1877F2", borderRadius: "3px 3px 0 0" }}/>
              <div style={{ height: clH, background: "#5C3D7E" }}/>
              <div style={{ height: otH, background: "#A71930" }}/>
            </div>
            <div className="muted" style={{ fontSize: 10.5 }}>{days[i]}</div>
          </div>
        );
      })}
    </div>
  );
}

window.Dashboard = Dashboard;
