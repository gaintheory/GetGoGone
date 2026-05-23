function Reports({ nav }) {
  const { VEHICLES, LEADS, CHANNELS, fmt$ } = window.GGG;
  const { Pill, Btn, KPI, Sparkline } = window.UI;

  const channels = [
    { name: "Facebook", color: "#1877F2", imps: 38420, clicks: 1240, leads: 42, cpl: 2.10 },
    { name: "Craigslist", color: "#5C3D7E", imps: 12100, clicks: 818, leads: 31, cpl: 0 },
    { name: "Cars.com", color: "#A71930", imps: 9200, clicks: 412, leads: 18, cpl: 8.50 },
    { name: "Google", color: "#4285F4", imps: 5400, clicks: 198, leads: 12, cpl: 14.20 },
    { name: "Instagram", color: "#E1306C", imps: 18900, clicks: 612, leads: 9, cpl: 4.80 },
    { name: "CarGurus", color: "#1F8245", imps: 4100, clicks: 188, leads: 6, cpl: 12.00 },
  ];

  return (
    <div className="page">
      <div className="page-h">
        <div>
          <h1>Reports</h1>
          <div className="sub">Last 30 days · Compare to previous 30 days</div>
        </div>
        <div className="page-actions">
          <select className="select" style={{ width: 140 }}>
            <option>Last 30 days</option>
            <option>Last 14 days</option>
            <option>Last 90 days</option>
            <option>Year to date</option>
          </select>
          <Btn icon={Icon.Download}>Export PDF</Btn>
        </div>
      </div>

      <div className="kpis">
        <KPI label="Leads generated" value="128" delta="+22% vs prior 30d" deltaTone="up" icon={Icon.Inbox} spark={[3,5,4,6,5,8,7,9,8,10,9,12]} sparkColor="#16A34A"/>
        <KPI label="Cost per lead" value="$4.18" delta="-$0.92" deltaTone="up" icon={Icon.Dollar} spark={[6,6,5,5,5,4.5,4.5,4.2,4.2,4.1,4.1,4.18]} sparkColor="#2563EB"/>
        <KPI label="Sales attributed" value="11" delta="+3 vs prior" deltaTone="up" icon={Icon.CheckCircle} spark={[1,2,1,2,3,2,3,4,3,4,4,5]} sparkColor="#16A34A"/>
        <KPI label="Avg days to sell" value="23" delta="-4 days" deltaTone="up" icon={Icon.Clock} spark={[28,29,27,26,28,27,25,25,24,24,23,23]} sparkColor="#0891B2"/>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 14 }}>
        <div className="card">
          <div className="card-h">
            <div>
              <h3>Channel performance</h3>
              <div className="sub">Impressions, clicks, leads, cost-per-lead</div>
            </div>
          </div>
          <table className="tbl">
            <thead>
              <tr><th>Channel</th><th className="num" style={{ textAlign: "right" }}>Impressions</th><th className="num" style={{ textAlign: "right" }}>Clicks</th><th className="num" style={{ textAlign: "right" }}>CTR</th><th className="num" style={{ textAlign: "right" }}>Leads</th><th className="num" style={{ textAlign: "right" }}>CPL</th></tr>
            </thead>
            <tbody>
              {channels.map(c => (
                <tr key={c.name}>
                  <td>
                    <div className="row">
                      <div style={{ width: 8, height: 8, borderRadius: 2, background: c.color }}/>
                      <span style={{ fontWeight: 600 }}>{c.name}</span>
                    </div>
                  </td>
                  <td className="mono" style={{ textAlign: "right" }}>{c.imps.toLocaleString()}</td>
                  <td className="mono" style={{ textAlign: "right" }}>{c.clicks.toLocaleString()}</td>
                  <td className="mono" style={{ textAlign: "right" }}>{((c.clicks/c.imps)*100).toFixed(1)}%</td>
                  <td className="mono" style={{ textAlign: "right", fontWeight: 600 }}>{c.leads}</td>
                  <td className="mono" style={{ textAlign: "right" }}>{c.cpl ? "$" + c.cpl.toFixed(2) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <div className="card-h"><h3>Top performing vehicles</h3></div>
          <div className="card-b" style={{ padding: 0 }}>
            {VEHICLES.filter(v => v.leads > 3).sort((a,b) => b.leads - a.leads).slice(0, 6).map((v, i, arr) => (
              <div key={v.id} onClick={() => nav("vehicle", v.id)} style={{ display: "flex", gap: 10, padding: "10px 14px", borderBottom: i < arr.length - 1 ? "1px solid var(--border)" : "none", cursor: "pointer", alignItems: "center" }}>
                <window.UI.VehicleThumb v={v}/>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 12.5 }}>{v.year} {v.make} {v.model}</div>
                  <div className="muted mono" style={{ fontSize: 11 }}>{fmt$(v.price)}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div className="mono" style={{ fontWeight: 600 }}>{v.leads}</div>
                  <div className="muted" style={{ fontSize: 11 }}>leads</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 14 }}>
        <div className="card-h">
          <h3>Campaign type effectiveness</h3>
          <div className="sub">Conversion rate by campaign type · 90 days</div>
        </div>
        <div className="card-b">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
            {[
              { t: "Low Down Payment", leads: 58, conv: "8.4%", trend: [2,3,4,4,5,6,7,8,7,8,9,10] },
              { t: "Tax Refund Special", leads: 41, conv: "11.2%", trend: [1,2,3,5,8,12,14,11,8,4,3,2] },
              { t: "Fresh Arrival", leads: 28, conv: "6.1%", trend: [3,3,4,3,4,3,4,3,4,3,4,3] },
              { t: "Bad Credit / No Credit", leads: 22, conv: "5.8%", trend: [2,2,3,2,3,3,2,3,3,2,3,3] },
              { t: "Family SUV", leads: 18, conv: "7.2%", trend: [1,2,2,3,2,3,2,3,2,3,3,2] },
              { t: "Recently Reduced", leads: 14, conv: "9.1%", trend: [0,0,1,2,3,4,3,2,1,1,0,0] },
            ].map(c => (
              <div key={c.t} style={{ background: "var(--gray-50)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 12.5 }}>{c.t}</div>
                    <div className="muted" style={{ fontSize: 11 }}>{c.leads} leads · {c.conv} conv</div>
                  </div>
                  <Sparkline values={c.trend} color="#2563EB"/>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

window.Reports = Reports;
