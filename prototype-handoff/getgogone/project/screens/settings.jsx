function Settings({ toast }) {
  const { Pill, Btn } = window.UI;
  const { CHANNELS } = window.GGG;
  const [tab, setTab] = React.useState("dealership");
  const tabs = [
    { id: "dealership", label: "Dealership" },
    { id: "brand", label: "Brand" },
    { id: "financing", label: "Financing & disclosures" },
    { id: "platforms", label: "Platform accounts" },
    { id: "import", label: "Import & sync" },
    { id: "notifications", label: "Notifications" },
    { id: "team", label: "Team" },
  ];

  return (
    <div className="page" style={{ maxWidth: 1100 }}>
      <div className="page-h">
        <div>
          <h1>Settings</h1>
          <div className="sub">Dealership profile, brand, channels, and team</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 24 }}>
        <nav className="col" style={{ gap: 2 }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="btn ghost"
              style={{ justifyContent: "flex-start", background: tab === t.id ? "var(--gray-100)" : "transparent", fontWeight: tab === t.id ? 600 : 500 }}>
              {t.label}
            </button>
          ))}
        </nav>

        <div>
          {tab === "dealership" && <DealershipSettings toast={toast}/>}
          {tab === "brand" && <BrandSettings toast={toast}/>}
          {tab === "financing" && <FinancingSettings toast={toast}/>}
          {tab === "platforms" && <PlatformSettings toast={toast}/>}
          {tab === "import" && <ImportSettings toast={toast}/>}
          {tab === "notifications" && <NotificationsSettings toast={toast}/>}
          {tab === "team" && <TeamSettings toast={toast}/>}
        </div>
      </div>
    </div>
  );
}

function SettingCard({ title, sub, children, footer }) {
  return (
    <div className="card" style={{ marginBottom: 14 }}>
      <div className="card-h">
        <div>
          <h3>{title}</h3>
          {sub && <div className="sub">{sub}</div>}
        </div>
      </div>
      <div className="card-b">{children}</div>
      {footer && <div style={{ padding: 12, borderTop: "1px solid var(--border)", background: "var(--gray-50)", display: "flex", justifyContent: "flex-end", gap: 8, borderRadius: "0 0 var(--radius-lg) var(--radius-lg)" }}>{footer}</div>}
    </div>
  );
}

function DealershipSettings({ toast }) {
  const { Btn } = window.UI;
  return (
    <SettingCard title="Dealership profile" sub="Shown on landing pages, ads, and email signatures" footer={<Btn variant="primary" onClick={() => toast("Profile saved")}>Save changes</Btn>}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div className="field"><label>Legal name</label><input className="input" defaultValue="Wabash Auto Sales LLC"/></div>
        <div className="field"><label>Display name</label><input className="input" defaultValue="Wabash Auto Sales"/></div>
        <div className="field" style={{ gridColumn: "1/-1" }}><label>Street address</label><input className="input" defaultValue="2451 W Washington St"/></div>
        <div className="field"><label>City</label><input className="input" defaultValue="Indianapolis"/></div>
        <div className="field" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div className="field"><label>State</label><input className="input" defaultValue="IN"/></div>
          <div className="field"><label>ZIP</label><input className="input mono" defaultValue="46222"/></div>
        </div>
        <div className="field"><label>Main phone</label><input className="input mono" defaultValue="(317) 555-0100"/></div>
        <div className="field"><label>Website</label><input className="input" defaultValue="wabashauto.com"/></div>
        <div className="field"><label>Dealer license #</label><input className="input mono" defaultValue="IN-447128"/></div>
        <div className="field"><label>Hours</label><input className="input" defaultValue="Mon–Sat 9am–7pm, Sun closed"/></div>
      </div>
    </SettingCard>
  );
}

function BrandSettings({ toast }) {
  const { Btn } = window.UI;
  return (
    <SettingCard title="Brand" sub="Logo, colors, and ad accents" footer={<Btn variant="primary" onClick={() => toast("Brand saved")}>Save changes</Btn>}>
      <div className="field" style={{ marginBottom: 14 }}>
        <label>Logo</label>
        <div className="row" style={{ gap: 12, alignItems: "center" }}>
          <div style={{ width: 64, height: 64, background: "#111", color: "#fff", borderRadius: "var(--radius)", display: "grid", placeItems: "center", fontWeight: 700, fontSize: 18 }}>GGG</div>
          <div className="col" style={{ gap: 4 }}>
            <div className="row" style={{ gap: 6 }}>
              <Btn size="sm" icon={Icon.Upload}>Replace</Btn>
              <Btn size="sm" variant="ghost">Remove</Btn>
            </div>
            <div className="muted" style={{ fontSize: 11 }}>SVG or PNG · 512×512 recommended</div>
          </div>
        </div>
      </div>

      <div className="field" style={{ marginBottom: 14 }}>
        <label>Brand colors</label>
        <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
          {[
            { l: "Primary", v: "#111827" },
            { l: "Accent", v: "#DC2626" },
            { l: "Highlight", v: "#F59E0B" },
          ].map(c => (
            <div key={c.l} className="row" style={{ gap: 8, border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "6px 8px 6px 6px" }}>
              <div style={{ width: 24, height: 24, borderRadius: "var(--radius-sm)", background: c.v }}/>
              <div>
                <div style={{ fontSize: 11, color: "var(--text-2)" }}>{c.l}</div>
                <input className="mono" defaultValue={c.v} style={{ border: "none", outline: "none", fontFamily: "inherit", fontSize: 12, width: 70, padding: 0, background: "transparent" }}/>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="field">
        <label>Ad tagline</label>
        <input className="input" defaultValue="We Finance Everyone — Drive Home Today."/>
      </div>
    </SettingCard>
  );
}

function FinancingSettings({ toast }) {
  const { Btn } = window.UI;
  return (
    <>
      <SettingCard title="Default financing terms" sub="Used to auto-fill new vehicles">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          <div className="field"><label>Default APR</label><input className="input mono" defaultValue="19.99%"/></div>
          <div className="field"><label>Default term</label><input className="input" defaultValue="42 weeks"/></div>
          <div className="field"><label>Minimum down</label><input className="input mono" defaultValue="$1,500"/></div>
        </div>
      </SettingCard>

      <SettingCard title="Disclosures" sub="Auto-appended to every ad, listing, and creative" footer={<Btn variant="primary" onClick={() => toast("Disclosures saved")}>Save changes</Btn>}>
        <div className="col" style={{ gap: 10 }}>
          <div className="field">
            <label>Short disclosure (under 100 chars)</label>
            <input className="input" defaultValue="WAC. Subject to approval of credit."/>
          </div>
          <div className="field">
            <label>Long disclosure (flyers, landing pages)</label>
            <textarea className="input" rows={4} defaultValue="All vehicles sold as-is unless otherwise noted. Down payment and weekly payment subject to approval of credit. APR varies by credit profile. Tax, title, license, and dealer fees additional. WAC. Wabash Auto Sales — Dealer License #IN-447128."/>
          </div>
          <div className="hr"/>
          <div className="field">
            <label>Blocked phrases</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {["guaranteed approval","no credit check","100% approved","drive away free"].map(p => (
                <span key={p} className="pill red">⊘ {p}</span>
              ))}
              <button className="chip" style={{ borderStyle: "dashed", borderWidth: 1, borderColor: "var(--border)" }}><Icon.Plus size={11}/> Add phrase</button>
            </div>
            <div className="muted" style={{ fontSize: 11, marginTop: 4 }}>Campaigns won't publish if copy contains any blocked phrase.</div>
          </div>
        </div>
      </SettingCard>
    </>
  );
}

function PlatformSettings({ toast }) {
  const { CHANNELS } = window.GGG;
  const { Pill, Btn, ChannelBadge } = window.UI;
  return (
    <SettingCard title="Platform accounts" sub="Connect each channel to publish from GGG">
      <div className="col" style={{ gap: 0 }}>
        {CHANNELS.map((ch, i) => (
          <div key={ch.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: i < CHANNELS.length - 1 ? "1px solid var(--border)" : "none" }}>
            <ChannelBadge ch={ch}/>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 12.5 }}>{ch.name}</div>
              <div className="muted" style={{ fontSize: 11 }}>
                {ch.on ? `Connected as @wabashauto · last sync 2h ago` : "Not connected"}
              </div>
            </div>
            {ch.on
              ? <><Pill tone="green" dot>Connected</Pill><Btn size="sm" variant="ghost">Disconnect</Btn></>
              : <Btn size="sm" variant="dark" onClick={() => toast(`Connect ${ch.name}...`)}>Connect</Btn>}
          </div>
        ))}
      </div>
    </SettingCard>
  );
}

function ImportSettings({ toast }) {
  const { Btn } = window.UI;
  return (
    <>
      <SettingCard title="Website import" sub="Pull inventory from your dealership site automatically">
        <div className="field" style={{ marginBottom: 10 }}>
          <label>Inventory feed URL</label>
          <input className="input mono" defaultValue="https://wabashauto.com/inventory.xml"/>
        </div>
        <div className="row" style={{ gap: 12 }}>
          <label className="checkbox"><input type="checkbox" defaultChecked/> Auto-sync every 4 hours</label>
          <label className="checkbox"><input type="checkbox" defaultChecked/> Auto-create Fresh Arrival campaigns</label>
          <label className="checkbox"><input type="checkbox"/> Auto-pause campaigns when sold</label>
        </div>
      </SettingCard>

      <SettingCard title="CSV import" sub="One-off uploads">
        <div style={{ border: "2px dashed var(--border-strong)", borderRadius: "var(--radius)", padding: 24, textAlign: "center", color: "var(--text-2)" }}>
          <Icon.Upload size={20} className="ico"/>
          <div style={{ marginTop: 6, fontSize: 12.5 }}>Drop a CSV here, or <button className="btn ghost sm" style={{ padding: 0, color: "var(--primary)" }}>browse</button></div>
          <div style={{ fontSize: 11, marginTop: 2 }}>Supports vAuto, DealerCenter, AutoManager exports</div>
        </div>
      </SettingCard>
    </>
  );
}

function NotificationsSettings({ toast }) {
  const { Btn } = window.UI;
  const rows = [
    ["New lead from any channel", true, true, false],
    ["Lead with no response > 30 min", true, true, true],
    ["Appointment in next 24 hours", true, true, false],
    ["Vehicle aged > 30 days", false, true, false],
    ["Campaign ready to review", true, false, false],
    ["Photo missing for active vehicle", false, true, false],
    ["Disclosure rejected by platform", true, true, true],
  ];
  return (
    <SettingCard title="Notifications" sub="Choose where each alert goes" footer={<Btn variant="primary" onClick={() => toast("Notifications saved")}>Save changes</Btn>}>
      <table className="tbl">
        <thead><tr><th>Event</th><th style={{ width: 80, textAlign: "center" }}>Email</th><th style={{ width: 80, textAlign: "center" }}>In-app</th><th style={{ width: 80, textAlign: "center" }}>SMS</th></tr></thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td style={{ fontWeight: 500 }}>{r[0]}</td>
              <td style={{ textAlign: "center" }}><input type="checkbox" defaultChecked={r[1]} style={{ accentColor: "var(--primary)" }}/></td>
              <td style={{ textAlign: "center" }}><input type="checkbox" defaultChecked={r[2]} style={{ accentColor: "var(--primary)" }}/></td>
              <td style={{ textAlign: "center" }}><input type="checkbox" defaultChecked={r[3]} style={{ accentColor: "var(--primary)" }}/></td>
            </tr>
          ))}
        </tbody>
      </table>
    </SettingCard>
  );
}

function TeamSettings({ toast }) {
  const { Pill, Btn } = window.UI;
  const team = [
    { name: "Ray Lawson", role: "Lot owner", email: "ray@wabashauto.com", status: "Active" },
    { name: "Sarah Kim", role: "Sales manager", email: "sarah@wabashauto.com", status: "Active" },
    { name: "Mike Tran", role: "Internet sales rep", email: "mike@wabashauto.com", status: "Active" },
    { name: "Jessica Diaz", role: "Internet sales rep", email: "jessica@wabashauto.com", status: "Invited" },
  ];
  return (
    <SettingCard title="Team" sub="Who has access to GGG">
      <table className="tbl">
        <thead><tr><th>Name</th><th>Role</th><th>Email</th><th>Status</th><th></th></tr></thead>
        <tbody>
          {team.map(t => (
            <tr key={t.email}>
              <td>
                <div className="row">
                  <div className="avatar" style={{ background: "var(--gray-100)", color: "var(--gray-700)" }}>
                    {t.name.split(" ").map(s => s[0]).join("")}
                  </div>
                  <span style={{ fontWeight: 600 }}>{t.name}</span>
                </div>
              </td>
              <td>{t.role}</td>
              <td className="muted">{t.email}</td>
              <td><Pill tone={t.status === "Active" ? "green" : "amber"} dot>{t.status}</Pill></td>
              <td><button className="icon-btn" style={{ width: 26, height: 26 }}><Icon.More size={14}/></button></td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ marginTop: 10 }}>
        <Btn icon={Icon.Plus} variant="dark">Invite teammate</Btn>
      </div>
    </SettingCard>
  );
}

window.Settings = Settings;
