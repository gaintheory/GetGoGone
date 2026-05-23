function CampaignBuilder({ vehicleId, nav, toast }) {
  const { VEHICLES, CAMPAIGN_TYPES, CHANNELS, fmt$, fmtMi, vehicleSvg } = window.GGG;
  const { Pill, Btn, VehicleThumb, ChannelBadge } = window.UI;
  const v = VEHICLES.find(x => x.id === vehicleId) || VEHICLES[1]; // default F-150 (truck has best art)
  const [type, setType] = React.useState("fresh");
  const [activeChans, setActiveChans] = React.useState(["fb","ig","cl","cars"]);
  const [language, setLanguage] = React.useState("en");
  const [previewCh, setPreviewCh] = React.useState("fb");
  const [previewFormat, setPreviewFormat] = React.useState("square");
  const [copy, setCopy] = React.useState({});

  const toggleChan = (id) => {
    setActiveChans(activeChans.includes(id) ? activeChans.filter(c => c !== id) : [...activeChans, id]);
  };

  const headline = generateHeadline(v, type, language);
  const body = generateBody(v, type, language);

  return (
    <div style={{ height: "100%", display: "grid", gridTemplateColumns: "320px 1fr 380px", overflow: "hidden" }}>
      {/* ============ LEFT PANEL: Vehicle + campaign settings ============ */}
      <aside style={{ borderRight: "1px solid var(--border)", background: "var(--surface)", overflow: "auto" }}>
        <div style={{ padding: 14, borderBottom: "1px solid var(--border)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-2)", marginBottom: 10 }}>
            <button onClick={() => nav("vehicle", v.id)} className="btn ghost sm" style={{ padding: "2px 6px" }}>
              <Icon.ChevronLeft size={12}/> Back
            </button>
          </div>
          <div style={{ display: "flex", gap: 10, marginBottom: 8 }}>
            <VehicleThumb v={v} size="lg"/>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 13, letterSpacing: "-0.01em" }}>{v.year} {v.make} {v.model}</div>
              <div className="muted" style={{ fontSize: 11.5 }}>{v.trim}</div>
              <div className="muted mono" style={{ fontSize: 11 }}>{v.stock} · {fmtMi(v.mileage)}</div>
            </div>
          </div>
          <div style={{ background: "var(--primary-50)", borderRadius: "var(--radius)", padding: "8px 10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 11, color: "var(--primary-700)", fontWeight: 500 }}>{fmt$(v.down)} down</div>
              <div className="mono" style={{ fontWeight: 600, fontSize: 16, color: "var(--primary-700)" }}>{fmt$(v.weekly)}/wk</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div className="muted" style={{ fontSize: 11 }}>List price</div>
              <div className="mono" style={{ fontWeight: 600, fontSize: 14 }}>{fmt$(v.price)}</div>
            </div>
          </div>
        </div>

        {/* Campaign type */}
        <section style={{ padding: 14, borderBottom: "1px solid var(--border)" }}>
          <SectionTitle n={1} title="Campaign type"/>
          <div className="col" style={{ gap: 4, marginTop: 8 }}>
            {CAMPAIGN_TYPES.map(t => {
              const I = Icon[t.icon] || Icon.Sparkles;
              const sel = type === t.id;
              return (
                <button key={t.id} onClick={() => setType(t.id)}
                  style={{ display: "flex", gap: 10, padding: "8px 10px", borderRadius: "var(--radius)", border: sel ? "1px solid var(--primary)" : "1px solid var(--border)", background: sel ? "var(--primary-50)" : "var(--surface)", cursor: "pointer", textAlign: "left", fontFamily: "inherit", alignItems: "flex-start" }}>
                  <div style={{ width: 22, height: 22, background: sel ? "var(--primary)" : "var(--gray-100)", color: sel ? "#fff" : "var(--text-2)", borderRadius: "var(--radius-sm)", display: "grid", placeItems: "center", flex: "0 0 22px", marginTop: 1 }}>
                    <I size={12}/>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 12.5 }}>{t.title}</div>
                    <div className="muted" style={{ fontSize: 11, lineHeight: 1.4 }}>{t.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Language */}
        <section style={{ padding: 14, borderBottom: "1px solid var(--border)" }}>
          <SectionTitle n={2} title="Language"/>
          <div style={{ display: "flex", gap: 4, marginTop: 8 }}>
            <button className={`chip ${language === "en" ? "active" : ""}`} onClick={() => setLanguage("en")} style={{ flex: 1, justifyContent: "center" }}>English</button>
            <button className={`chip ${language === "es" ? "active" : ""}`} onClick={() => setLanguage("es")} style={{ flex: 1, justifyContent: "center" }}>Español</button>
            <button className={`chip ${language === "both" ? "active" : ""}`} onClick={() => setLanguage("both")} style={{ flex: 1, justifyContent: "center" }}>Both</button>
          </div>
        </section>

        {/* Channels */}
        <section style={{ padding: 14, borderBottom: "1px solid var(--border)" }}>
          <SectionTitle n={3} title="Channels" right={`${activeChans.length} selected`}/>
          <div className="col" style={{ gap: 2, marginTop: 8 }}>
            {CHANNELS.map(ch => {
              const sel = activeChans.includes(ch.id);
              return (
                <label key={ch.id}
                  style={{ display: "flex", alignItems: "center", gap: 9, padding: "6px 6px", borderRadius: "var(--radius)", cursor: "pointer", background: sel ? "var(--gray-50)" : "transparent" }}>
                  <input type="checkbox" checked={sel} onChange={() => toggleChan(ch.id)} style={{ accentColor: "var(--primary)" }}/>
                  <ChannelBadge ch={ch} size={20}/>
                  <span style={{ fontSize: 12.5, fontWeight: 500, flex: 1 }}>{ch.name}</span>
                  {!ch.on && <Pill tone="amber">Connect</Pill>}
                </label>
              );
            })}
          </div>
        </section>

        {/* Compliance */}
        <section style={{ padding: 14 }}>
          <SectionTitle n={4} title="Compliance disclosures"/>
          <div className="col" style={{ gap: 6, marginTop: 8 }}>
            <label className="checkbox"><input type="checkbox" defaultChecked/> Include WAC / OAC disclosure</label>
            <label className="checkbox"><input type="checkbox" defaultChecked/> Include Buy Here Pay Here clarification</label>
            <label className="checkbox"><input type="checkbox" defaultChecked/> Block "guaranteed approval" language</label>
            <label className="checkbox"><input type="checkbox"/> Add dealer license # on every asset</label>
          </div>
        </section>
      </aside>

      {/* ============ CENTER PANEL: Generated copy by channel ============ */}
      <main style={{ overflow: "auto", background: "var(--bg)" }}>
        <div style={{ padding: "16px 22px", background: "var(--surface)", borderBottom: "1px solid var(--border)", position: "sticky", top: 0, zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <h1 style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>
                {CAMPAIGN_TYPES.find(t => t.id === type).title}
                <span style={{ fontWeight: 400, color: "var(--text-2)" }}> · {v.year} {v.make} {v.model}</span>
              </h1>
              <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
                <div className="dotline" style={{ marginRight: 8 }}>
                  <span className="done"/><span className="done"/><span className="on"/><span/><span/>
                </div>
                Step 3 of 5 · Generated copy across {activeChans.length} channel{activeChans.length !== 1 ? "s" : ""}
              </div>
            </div>
            <div className="row">
              <Btn size="sm" icon={Icon.Refresh}>Regenerate all</Btn>
              <Btn size="sm" icon={Icon.Folder}>Save as template</Btn>
            </div>
          </div>
        </div>

        <div style={{ padding: "16px 22px" }}>
          {activeChans.map(chId => {
            const ch = CHANNELS.find(c => c.id === chId);
            return (
              <ChannelCopyCard key={chId} ch={ch} v={v} type={type} language={language}
                isPreview={previewCh === chId}
                onPreview={() => setPreviewCh(chId)}
                copy={copy[chId]} onCopyChange={(val) => setCopy({ ...copy, [chId]: val })}
                headline={headline} body={body}/>
            );
          })}

          {activeChans.length === 0 && (
            <div style={{ textAlign: "center", padding: 60, color: "var(--text-2)" }}>
              <Icon.Megaphone size={32} className="ico" style={{ opacity: 0.4, marginBottom: 8 }}/>
              <div>Select at least one channel on the left to generate ads.</div>
            </div>
          )}
        </div>
      </main>

      {/* ============ RIGHT PANEL: Live preview + export ============ */}
      <aside style={{ borderLeft: "1px solid var(--border)", background: "var(--surface)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: 14, borderBottom: "1px solid var(--border)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <div style={{ fontWeight: 600, fontSize: 13 }}>Live preview</div>
            <div className="muted" style={{ fontSize: 11.5 }}>{CHANNELS.find(c => c.id === previewCh)?.name}</div>
          </div>
          <div style={{ display: "flex", gap: 4, marginTop: 10, flexWrap: "wrap" }}>
            {[
              { id: "square", label: "Feed 1:1" },
              { id: "story", label: "Story 9:16" },
              { id: "cl", label: "Craigslist" },
              { id: "banner", label: "Banner" },
              { id: "flyer", label: "Flyer" },
            ].map(f => (
              <button key={f.id} className={`chip ${previewFormat === f.id ? "active" : ""}`} onClick={() => setPreviewFormat(f.id)}>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, overflow: "auto", padding: 18, background: "var(--bg)", display: "grid", placeItems: "center" }}>
          <CreativePreview v={v} format={previewFormat} headline={headline} body={body} language={language}/>
        </div>

        <div style={{ borderTop: "1px solid var(--border)", padding: 12, background: "var(--surface)" }}>
          <div className="col" style={{ gap: 6 }}>
            <div className="row" style={{ gap: 6 }}>
              <Btn size="sm" icon={Icon.Download} style={{ flex: 1 }}>Download</Btn>
              <Btn size="sm" icon={Icon.Copy}>Copy text</Btn>
              <Btn size="sm" icon={Icon.Refresh}>Regen</Btn>
            </div>
            <Btn variant="primary" icon={Icon.Send} onClick={() => { toast("Campaign published to " + activeChans.length + " channels"); }}>
              Publish to {activeChans.length} channel{activeChans.length !== 1 ? "s" : ""}
            </Btn>
            <button className="btn dark" onClick={() => toast("Saved as draft")}>
              <Icon.CheckCircle size={13}/> Save draft & exit
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}

function SectionTitle({ n, title, right }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ width: 18, height: 18, background: "#111827", color: "#fff", borderRadius: "var(--radius-sm)", display: "grid", placeItems: "center", fontSize: 10.5, fontWeight: 600 }}>{n}</span>
        <span style={{ fontWeight: 600, fontSize: 12.5 }}>{title}</span>
      </div>
      {right && <span className="muted" style={{ fontSize: 11 }}>{right}</span>}
    </div>
  );
}

function ChannelCopyCard({ ch, v, type, isPreview, onPreview, copy, onCopyChange, headline, body, language }) {
  const { fmt$ } = window.GGG;
  const { Pill, Btn, ChannelBadge } = window.UI;
  const charLimit = { fb: 280, ig: 220, cl: 1200, cars: 400, gads: 90, gbp: 200, tt: 150, sms: 160, email: 600 }[ch.id] || 400;
  const text = copy ?? body;
  const used = text.length;
  const overLimit = used > charLimit;

  return (
    <div className="card" style={{ marginBottom: 12, borderColor: isPreview ? "var(--primary)" : undefined, boxShadow: isPreview ? "0 0 0 3px rgba(37,99,235,0.08)" : undefined }}>
      <div className="card-h" style={{ paddingTop: 10, paddingBottom: 10 }}>
        <div className="row">
          <ChannelBadge ch={ch}/>
          <div>
            <div style={{ fontWeight: 600, fontSize: 12.5 }}>{ch.name}</div>
            <div className="muted" style={{ fontSize: 11 }}>
              {ch.kind === "social" ? "Feed post + Story" : ch.kind === "marketplace" ? "Listing copy" : ch.kind === "search" ? "Search ad" : "Direct message"}
              · <span className={overLimit ? "" : "muted"} style={{ color: overLimit ? "var(--danger)" : undefined }}>{used}/{charLimit}</span>
            </div>
          </div>
        </div>
        <div className="row">
          {!ch.on && <Pill tone="amber" dot>Account not connected</Pill>}
          <Btn size="sm" variant={isPreview ? "primary" : "ghost"} icon={Icon.Eye} onClick={onPreview}>
            {isPreview ? "Previewing" : "Preview"}
          </Btn>
          <button className="icon-btn" style={{ width: 26, height: 26 }} title="Regenerate"><Icon.Refresh size={13}/></button>
        </div>
      </div>
      <div className="card-b" style={{ paddingTop: 10 }}>
        {(ch.kind === "social" || ch.kind === "direct") && (
          <div className="col" style={{ gap: 8 }}>
            <div className="field">
              <label>Headline</label>
              <input className="input" defaultValue={headline}/>
            </div>
            <div className="field">
              <label>Body</label>
              <textarea className="input" value={text} onChange={e => onCopyChange(e.target.value)} rows={5}/>
            </div>
            <div className="row" style={{ flexWrap: "wrap", gap: 4 }}>
              <Pill tone="blue">#{v.make}</Pill>
              <Pill tone="blue">#{v.model}</Pill>
              <Pill tone="blue">#BuyHerePayHere</Pill>
              <Pill tone="blue">#LowDownPayment</Pill>
              {type === "credit" && <Pill tone="blue">#SecondChance</Pill>}
            </div>
          </div>
        )}
        {ch.kind === "marketplace" && (
          <div className="col" style={{ gap: 8 }}>
            <div className="field">
              <label>Title</label>
              <input className="input" defaultValue={`${v.year} ${v.make} ${v.model} ${v.trim} — ${fmt$(v.down)} DOWN!`}/>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              <div className="field"><label>Price</label><input className="input mono" defaultValue={fmt$(v.price)}/></div>
              <div className="field"><label>Down</label><input className="input mono" defaultValue={fmt$(v.down)}/></div>
              <div className="field"><label>Weekly</label><input className="input mono" defaultValue={fmt$(v.weekly)}/></div>
            </div>
            <div className="field">
              <label>Description</label>
              <textarea className="input" value={text} onChange={e => onCopyChange(e.target.value)} rows={6}/>
            </div>
          </div>
        )}
        {ch.kind === "search" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div className="field"><label>Headline 1</label><input className="input" defaultValue={`${v.year} ${v.make} ${v.model}`}/></div>
            <div className="field"><label>Headline 2</label><input className="input" defaultValue={`${fmt$(v.down)} Down — Drive Today`}/></div>
            <div className="field"><label>Headline 3</label><input className="input" defaultValue="We Finance All Credit"/></div>
            <div className="field"><label>Description</label><input className="input" defaultValue={`${fmt$(v.weekly)}/wk. Apply in minutes.`}/></div>
          </div>
        )}
      </div>
    </div>
  );
}

function generateHeadline(v, type, lang) {
  const { fmt$ } = window.GGG;
  if (lang === "es") {
    return `¡${v.year} ${v.make} ${v.model} — Solo ${fmt$(v.down)} de Enganche!`;
  }
  switch (type) {
    case "fresh": return `Just In: ${v.year} ${v.make} ${v.model}`;
    case "lowdown": return `${fmt$(v.down)} Down. Drive Home Today.`;
    case "credit": return `Bad Credit? No Credit? We've Got You.`;
    case "work": return `Job-Site Ready: ${v.year} ${v.make} ${v.model}`;
    case "family": return `Room For The Whole Crew — ${v.year} ${v.model}`;
    case "tax": return `Use Your Tax Refund As Your Down Payment.`;
    case "reduced": return `Price Drop: ${v.year} ${v.make} ${v.model}`;
    case "still": return `Still Available — ${v.year} ${v.make} ${v.model}`;
    case "last": return `Last Chance — Going This Week!`;
    default: return `${v.year} ${v.make} ${v.model}`;
  }
}

function generateBody(v, type, lang) {
  const { fmt$, fmtMi } = window.GGG;
  if (lang === "es") {
    return `Solo ${fmt$(v.down)} de enganche, ${fmt$(v.weekly)}/semana. ${fmtMi(v.mileage)}, ${v.color}. Aprobamos a todos — buen crédito, mal crédito, sin crédito. Aplica en 2 minutos. Hablamos español. Sujeto a aprobación de crédito.`;
  }
  const feats = v.features.slice(0, 3).join(", ");
  switch (type) {
    case "lowdown":
      return `🚗 Just ${fmt$(v.down)} down gets you driving a ${v.year} ${v.make} ${v.model}. ${fmt$(v.weekly)}/week. Bad credit? No credit? We finance. Apply online in 2 minutes — drive home today. ${feats}. ${fmtMi(v.mileage)}. WAC.`;
    case "credit":
      return `Second-chance financing on this clean ${v.year} ${v.model}. We work with all credit situations — repos, bankruptcies, first-time buyers welcome. ${fmt$(v.down)} down, ${fmt$(v.weekly)}/week. Quick approval. Subject to approval of credit.`;
    case "tax":
      return `Got your refund yet? Put it to work. This ${v.year} ${v.make} ${v.model} can be yours for ${fmt$(v.down)} down — exactly what most folks get back. ${fmt$(v.weekly)}/wk. ${feats}. WAC.`;
    case "work":
      return `Built for the job site. ${v.year} ${v.make} ${v.model} ${v.trim}. ${feats}. ${fmtMi(v.mileage)}. ${fmt$(v.down)} down, ${fmt$(v.weekly)}/wk gets you working tomorrow. WAC.`;
    default:
      return `Take a look at this ${v.year} ${v.make} ${v.model} ${v.trim}. ${fmtMi(v.mileage)}, ${v.color}. ${feats}. ${fmt$(v.down)} down, ${fmt$(v.weekly)}/week. We finance — apply in 2 minutes. WAC.`;
  }
}

window.CampaignBuilder = CampaignBuilder;
