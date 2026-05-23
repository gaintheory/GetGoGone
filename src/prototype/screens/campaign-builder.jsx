import React from 'react';
import { Icon } from '../icons';
import { GGG } from '../data';
import { UI } from '../ui';
import { CreativePreview } from './creative-preview';
import { activeChannelModules, channelModules } from '../../features/campaigns/channel-modules';

const GOALS = [
  { id: "finance", title: "Finance applications", desc: "Send buyers to the credit app or finance lead form." },
  { id: "calls", title: "Calls and messages", desc: "Get shoppers to call, text, or send a direct message." },
  { id: "spanish", title: "Spanish-language buyers", desc: "Build Spanish or bilingual creative and follow-up." },
  { id: "commercial", title: "Commercial vehicle push", desc: "Use business-focused copy for trucks and vans." },
  { id: "aging", title: "Move aging inventory", desc: "Create stronger listing and local-market pushes." },
  { id: "fresh", title: "Fresh arrival", desc: "Announce a newly listed vehicle across channels." },
];

const DEFAULT_CHANNELS = ["google_business", "google_ads", "meta_paid", "instagram_organic", "craigslist", "cars_com", "autotrader"];

function CampaignBuilder({ vehicleId, nav, toast, vehicles: providedVehicles, clientId }) {
  const { VEHICLES, fmt$, fmtMi } = GGG;
  const { Pill, Btn, VehicleThumb } = UI;
  const vehicles = providedVehicles && providedVehicles.length ? providedVehicles : VEHICLES;
  const v = vehicles.find(x => x.id === vehicleId) || vehicles[1] || vehicles[0] || VEHICLES[1];
  const downOfferLabel = safeDownLabel(v, fmt$);
  const priceLabel = Number(v.price) > 0 ? fmt$(v.price) : "Call for price";
  const paymentLabel = Number(v.weekly) > 0 ? `${fmt$(v.weekly)}/wk` : "Terms available";
  const [goal, setGoal] = React.useState("finance");
  const [language, setLanguage] = React.useState("both");
  const [activeChannels, setActiveChannels] = React.useState(DEFAULT_CHANNELS);
  const [previewChannel, setPreviewChannel] = React.useState(DEFAULT_CHANNELS[0]);
  const [previewFormat, setPreviewFormat] = React.useState("square");
  const [drafts, setDrafts] = React.useState({});
  const [headlines, setHeadlines] = React.useState({});
  const [generationMeta, setGenerationMeta] = React.useState({});
  const [generating, setGenerating] = React.useState({});
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!activeChannels.includes(previewChannel)) {
      setPreviewChannel(activeChannels[0] || "");
    }
  }, [activeChannels, previewChannel]);

  const modules = activeChannels
    .map(id => channelModules.find(m => m.id === id))
    .filter(Boolean);
  const previewModule = channelModules.find(m => m.id === previewChannel) || modules[0];
  const headline = headlines[previewModule?.id] || generateHeadline(v, goal, language, previewModule?.id);
  const body = drafts[previewModule?.id] || generateBody(v, goal, language, previewModule?.id);

  const toggleChannel = (id) => {
    setActiveChannels(current => (
      current.includes(id) ? current.filter(channelId => channelId !== id) : [...current, id]
    ));
  };

  const generateForModule = async (module) => {
    if (!module) return;
    setGenerating(current => ({ ...current, [module.id]: true }));
    try {
      const response = await fetch("/api/ai/generate-copy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: clientId && clientId !== "agency_overview" ? clientId : undefined,
          vehicle: v,
          channel: {
            id: module.id,
            name: module.name,
            category: module.category,
            complianceNotes: module.complianceNotes,
          },
          goal,
          language,
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.error || "AI copy failed");
      setHeadlines(current => ({ ...current, [module.id]: result.copy.headline }));
      setDrafts(current => ({ ...current, [module.id]: result.copy.body }));
      setGenerationMeta(current => ({
        ...current,
        [module.id]: {
          provider: result.provider,
          model: result.model,
          id: result.generatedOutput?.id,
          offline: !!result.offline,
        },
      }));
      toast(result.offline ? "Local AI offline; used Brand Brain fallback" : `Generated with ${result.provider}`);
    } catch (error) {
      toast(error instanceof Error ? error.message : "AI copy failed");
    } finally {
      setGenerating(current => ({ ...current, [module.id]: false }));
    }
  };

  const generateAll = async () => {
    for (const module of modules) {
      await generateForModule(module);
    }
  };

  const saveCampaign = async () => {
    if (!modules.length) {
      toast("Select at least one channel before saving");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: clientId && clientId !== "agency_overview" ? clientId : undefined,
          vehicle: v,
          name: `${v.year} ${v.make} ${v.model} channel campaign`,
          goal,
          language,
          status: "draft",
          channels: modules.map(module => ({
            id: module.id,
            name: module.name,
            category: module.category,
            headline: headlines[module.id] || generateHeadline(v, goal, language, module.id),
            primaryText: drafts[module.id] || generateBody(v, goal, language, module.id),
            callToAction: ctaForModule(module.id, goal),
            setupFields: module.setupFields,
            generatedOutputs: module.generatedOutputs,
            creativeFormats: module.creativeFormats,
            publishingMethod: module.publishingMethod,
            complianceNotes: module.complianceNotes,
          })),
        }),
      });
      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(result.error || "Campaign could not be saved");
      }

      toast(`Saved ${result.channels.length} channel drafts`);
      nav("campaignReview", result.campaign.id);
    } catch (error) {
      toast(error instanceof Error ? error.message : "Campaign could not be saved");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ height: "100%", display: "grid", gridTemplateColumns: "320px 1fr 380px", overflow: "hidden" }}>
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
              <div style={{ fontWeight: 600, fontSize: 13 }}>{v.year} {v.make} {v.model}</div>
              <div className="muted" style={{ fontSize: 11.5 }}>{v.trim}</div>
              <div className="muted mono" style={{ fontSize: 11 }}>{v.stock} · {fmtMi(v.mileage)}</div>
            </div>
          </div>
          <div style={{ background: "var(--primary-50)", borderRadius: "var(--radius)", padding: "8px 10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 11, color: "var(--primary-700)", fontWeight: 500 }}>{downOfferLabel}</div>
              <div className="mono" style={{ fontWeight: 600, fontSize: 16, color: "var(--primary-700)" }}>{paymentLabel}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div className="muted" style={{ fontSize: 11 }}>List price</div>
              <div className="mono" style={{ fontWeight: 600, fontSize: 14 }}>{priceLabel}</div>
            </div>
          </div>
        </div>

        <section style={{ padding: 14, borderBottom: "1px solid var(--border)" }}>
          <SectionTitle n={1} title="Campaign goal"/>
          <div className="col" style={{ gap: 4, marginTop: 8 }}>
            {GOALS.map(item => {
              const selected = goal === item.id;
              return (
                <button key={item.id} onClick={() => setGoal(item.id)}
                  style={{ display: "flex", gap: 10, padding: "8px 10px", borderRadius: "var(--radius)", border: selected ? "1px solid var(--primary)" : "1px solid var(--border)", background: selected ? "var(--primary-50)" : "var(--surface)", cursor: "pointer", textAlign: "left", fontFamily: "inherit", alignItems: "flex-start" }}>
                  <div style={{ width: 22, height: 22, background: selected ? "var(--primary)" : "var(--gray-100)", color: selected ? "#fff" : "var(--text-2)", borderRadius: "var(--radius-sm)", display: "grid", placeItems: "center", flex: "0 0 22px", marginTop: 1 }}>
                    <Icon.Sparkles size={12}/>
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 12.5 }}>{item.title}</div>
                    <div className="muted" style={{ fontSize: 11, lineHeight: 1.4 }}>{item.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section style={{ padding: 14, borderBottom: "1px solid var(--border)" }}>
          <SectionTitle n={2} title="Language"/>
          <div style={{ display: "flex", gap: 4, marginTop: 8 }}>
            <button className={`chip ${language === "en" ? "active" : ""}`} onClick={() => setLanguage("en")} style={{ flex: 1, justifyContent: "center" }}>English</button>
            <button className={`chip ${language === "es" ? "active" : ""}`} onClick={() => setLanguage("es")} style={{ flex: 1, justifyContent: "center" }}>Espanol</button>
            <button className={`chip ${language === "both" ? "active" : ""}`} onClick={() => setLanguage("both")} style={{ flex: 1, justifyContent: "center" }}>Both</button>
          </div>
        </section>

        <section style={{ padding: 14, borderBottom: "1px solid var(--border)" }}>
          <SectionTitle n={3} title="Marketing channels" right={`${activeChannels.length} selected`}/>
          <div className="col" style={{ gap: 5, marginTop: 8 }}>
            {activeChannelModules.map(module => {
              const selected = activeChannels.includes(module.id);
              return (
                <label key={module.id}
                  style={{ display: "flex", alignItems: "flex-start", gap: 9, padding: "7px 6px", borderRadius: "var(--radius)", cursor: "pointer", background: selected ? "var(--gray-50)" : "transparent" }}>
                  <input type="checkbox" checked={selected} onChange={() => toggleChannel(module.id)} style={{ accentColor: "var(--primary)", marginTop: 3 }}/>
                  <ModuleDot module={module}/>
                  <span style={{ fontSize: 12.5, flex: 1 }}>
                    <span style={{ fontWeight: 600, display: "block" }}>{module.shortName}</span>
                    <span className="muted" style={{ fontSize: 10.8 }}>{module.category}</span>
                  </span>
                </label>
              );
            })}
          </div>
        </section>

        <section style={{ padding: 14 }}>
          <SectionTitle n={4} title="Guardrails"/>
          <div className="col" style={{ gap: 6, marginTop: 8 }}>
            <label className="checkbox"><input type="checkbox" defaultChecked/> Down payment first</label>
            <label className="checkbox"><input type="checkbox" defaultChecked/> Include subject-to-approval language</label>
            <label className="checkbox"><input type="checkbox" defaultChecked/> Block guaranteed approval claims</label>
            <label className="checkbox"><input type="checkbox" defaultChecked/> Generate Spanish where useful</label>
          </div>
        </section>
      </aside>

      <main style={{ overflow: "auto", background: "var(--bg)" }}>
        <div style={{ padding: "16px 22px", background: "var(--surface)", borderBottom: "1px solid var(--border)", position: "sticky", top: 0, zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <h1 style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>
                Channel campaign
                <span style={{ fontWeight: 400, color: "var(--text-2)" }}> · {v.year} {v.make} {v.model}</span>
              </h1>
              <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
                Build each selected channel with its own format, copy, and launch path.
              </div>
            </div>
            <div className="row">
              <Btn size="sm" icon={Icon.Refresh} onClick={generateAll}>Generate all with AI</Btn>
              <Btn size="sm" icon={Icon.Folder}>Save template</Btn>
            </div>
          </div>
        </div>

        <div style={{ padding: "16px 22px" }}>
          {modules.map(module => (
            <ChannelModuleCard
              key={module.id}
              module={module}
              vehicle={v}
              goal={goal}
              language={language}
              isPreview={previewChannel === module.id}
              onPreview={() => setPreviewChannel(module.id)}
              draft={drafts[module.id]}
              headline={headlines[module.id]}
              generationMeta={generationMeta[module.id]}
              generating={!!generating[module.id]}
              onHeadlineChange={(text) => setHeadlines({ ...headlines, [module.id]: text })}
              onDraftChange={(text) => setDrafts({ ...drafts, [module.id]: text })}
              onGenerate={() => generateForModule(module)}
            />
          ))}

          {modules.length === 0 && (
            <div style={{ textAlign: "center", padding: 60, color: "var(--text-2)" }}>
              <Icon.Megaphone size={32} className="ico" style={{ opacity: 0.4, marginBottom: 8 }}/>
              <div>Select at least one marketing channel on the left.</div>
            </div>
          )}
        </div>
      </main>

      <aside style={{ borderLeft: "1px solid var(--border)", background: "var(--surface)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: 14, borderBottom: "1px solid var(--border)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <div style={{ fontWeight: 600, fontSize: 13 }}>Review package</div>
            <div className="muted" style={{ fontSize: 11.5 }}>{previewModule?.name || "No channel"}</div>
          </div>
          <div style={{ display: "flex", gap: 4, marginTop: 10, flexWrap: "wrap" }}>
            {[
              { id: "square", label: "Feed 1:1" },
              { id: "story", label: "Story 9:16" },
              { id: "cl", label: "Listing" },
              { id: "banner", label: "Banner" },
              { id: "flyer", label: "Flyer" },
            ].map(f => (
              <button key={f.id} className={`chip ${previewFormat === f.id ? "active" : ""}`} onClick={() => setPreviewFormat(f.id)}>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, overflow: "auto", padding: 18, background: "var(--bg)" }}>
          <div style={{ display: "grid", placeItems: "center", marginBottom: 14 }}>
            <CreativePreview v={v} format={previewFormat} headline={headline} body={body} language={language}/>
          </div>
          {previewModule && (
            <div className="card">
              <div className="card-h">
                <div className="row">
                  <ModuleDot module={previewModule}/>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 12.5 }}>{previewModule.name}</div>
                    <div className="muted" style={{ fontSize: 11 }}>{previewModule.category}</div>
                  </div>
                </div>
              </div>
              <div className="card-b col" style={{ gap: 10 }}>
                <MiniBlock title="Publishing">{previewModule.publishingMethod}</MiniBlock>
                <MiniBlock title="Creative formats">{previewModule.creativeFormats.join(", ")}</MiniBlock>
                <MiniBlock title="Compliance">{previewModule.complianceNotes.join(" ")}</MiniBlock>
              </div>
            </div>
          )}
        </div>

        <div style={{ borderTop: "1px solid var(--border)", padding: 12, background: "var(--surface)" }}>
          <div className="col" style={{ gap: 6 }}>
            <div className="row" style={{ gap: 6 }}>
              <Btn size="sm" icon={Icon.Download} style={{ flex: 1 }}>Export package</Btn>
              <Btn size="sm" icon={Icon.Copy}>Copy</Btn>
              <Btn size="sm" icon={Icon.Refresh}>Regen</Btn>
            </div>
            <Btn variant="primary" icon={Icon.Send} onClick={saveCampaign}>
              {saving ? "Saving..." : "Save campaign"}
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

function ModuleDot({ module }) {
  return (
    <span style={{ width: 22, height: 22, borderRadius: "var(--radius-sm)", background: module.color, color: "#fff", display: "grid", placeItems: "center", flex: "0 0 22px", fontSize: 10, fontWeight: 700 }}>
      {module.shortName.slice(0, 2).toUpperCase()}
    </span>
  );
}

function ChannelModuleCard({ module, vehicle, goal, language, isPreview, onPreview, draft, headline: headlineDraft, generationMeta, generating, onHeadlineChange, onDraftChange, onGenerate }) {
  const { fmt$ } = GGG;
  const { Pill, Btn } = UI;
  const generatedText = draft ?? generateBody(vehicle, goal, language, module.id);
  const headline = headlineDraft ?? generateHeadline(vehicle, goal, language, module.id);
  const downLabel = Number(vehicle.down) > 0 ? `${fmt$(vehicle.down)} down` : "Down payment options available";

  return (
    <div className="card" style={{ marginBottom: 12, borderColor: isPreview ? "var(--primary)" : undefined, boxShadow: isPreview ? "0 0 0 3px rgba(37,99,235,0.08)" : undefined }}>
      <div className="card-h" style={{ paddingTop: 10, paddingBottom: 10 }}>
        <div className="row">
          <ModuleDot module={module}/>
          <div>
            <div style={{ fontWeight: 600, fontSize: 12.5 }}>{module.name}</div>
            <div className="muted" style={{ fontSize: 11 }}>{module.bestFor}</div>
          </div>
        </div>
        <div className="row">
          <Pill tone="blue">{module.category}</Pill>
          <Btn size="sm" icon={Icon.Sparkles} onClick={onGenerate} disabled={generating}>
            {generating ? "Generating..." : "AI copy"}
          </Btn>
          <Btn size="sm" variant={isPreview ? "primary" : "ghost"} icon={Icon.Eye} onClick={onPreview}>
            {isPreview ? "Previewing" : "Preview"}
          </Btn>
        </div>
      </div>

      <div className="card-b" style={{ paddingTop: 10 }}>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(220px, 0.85fr) 1.15fr", gap: 12 }}>
          <div className="col" style={{ gap: 10 }}>
            <MiniBlock title="Use this when">{module.whenToUse}</MiniBlock>
            <div>
              <div className="label">Setup fields</div>
              <div className="row" style={{ gap: 4, flexWrap: "wrap", marginTop: 5 }}>
                {module.setupFields.map(field => <Pill key={field}>{field}</Pill>)}
              </div>
            </div>
            <div>
              <div className="label">Generated outputs</div>
              <div className="row" style={{ gap: 4, flexWrap: "wrap", marginTop: 5 }}>
                {module.generatedOutputs.map(output => <Pill key={output} tone="green">{output}</Pill>)}
              </div>
            </div>
          </div>

          <div className="col" style={{ gap: 8 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <div className="field">
                <label>Channel setup</label>
                <select className="input" defaultValue={module.setupFields[0]}>
                  {module.setupFields.map(field => <option key={field}>{field}</option>)}
                </select>
              </div>
              <div className="field">
                <label>Primary offer</label>
                <input className="input mono" defaultValue={downLabel}/>
              </div>
            </div>
            <div className="field">
              <label>Headline / title</label>
              <input className="input" value={headline} onChange={e => onHeadlineChange(e.target.value)}/>
            </div>
            <div className="field">
              <label>{copyLabel(module.id)}</label>
              <textarea className="input" value={generatedText} onChange={e => onDraftChange(e.target.value)} rows={module.id === "sms_email" ? 3 : 6}/>
            </div>
            {generationMeta && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, background: "var(--gray-50)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "7px 9px" }}>
                <div className="row" style={{ gap: 6 }}>
                  <Icon.Sparkles size={12} style={{ color: generationMeta.offline ? "var(--warning)" : "var(--primary)" }}/>
                  <span className="muted" style={{ fontSize: 11.5 }}>
                    Generated with {generationMeta.provider} / {generationMeta.model}
                  </span>
                </div>
                {generationMeta.id && <span className="mono muted" style={{ fontSize: 10 }}>saved</span>}
              </div>
            )}
            <div className="row" style={{ gap: 4, flexWrap: "wrap" }}>
              {module.complianceNotes.map(note => <Pill key={note} tone="amber">{note}</Pill>)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniBlock({ title, children }) {
  return (
    <div>
      <div className="label">{title}</div>
      <div className="muted" style={{ fontSize: 11.5, lineHeight: 1.45, marginTop: 3 }}>{children}</div>
    </div>
  );
}

function copyLabel(channelId) {
  if (channelId === "meta_paid") return "Primary ad text";
  if (channelId === "google_ads") return "Search headlines / descriptions";
  if (channelId === "instagram_organic") return "Caption / story text";
  if (channelId === "craigslist") return "Plain-text listing body";
  if (["cars_com", "autotrader", "marketplace_listings"].includes(channelId)) return "Marketplace description";
  if (channelId === "sms_email") return "SMS / email draft";
  if (channelId === "short_video") return "Script / shot list";
  if (channelId === "linkedin_commercial") return "Professional post copy";
  return "Generated copy";
}

function ctaForModule(channelId, goal) {
  if (channelId === "meta_paid" && goal === "finance") return "Apply now";
  if (channelId === "meta_paid") return "Send message";
  if (channelId === "google_ads") return "Call now";
  if (channelId === "sms_email") return "Reply to check availability";
  if (channelId === "google_business") return "Call now";
  if (channelId === "instagram_organic") return "Message us";
  if (channelId === "linkedin_commercial") return "Contact the dealership";
  if (channelId === "short_video") return "Message us";
  return "Check availability";
}

function safeDownLabel(v, fmt$, spanish = false) {
  return Number(v.down) > 0
    ? `${fmt$(v.down)} ${spanish ? "de enganche" : "down"}`
    : spanish ? "Opciones de enganche disponibles" : "Down payment options available";
}

function generateHeadline(v, goal, lang, channelId) {
  const { fmt$ } = GGG;
  const downLabel = safeDownLabel(v, fmt$, lang === "es");
  if (lang === "es") return `${v.year} ${v.make} ${v.model} - ${downLabel}`;
  if (channelId === "linkedin_commercial") return `Work-ready ${v.year} ${v.make} ${v.model}`;
  if (channelId === "google_ads") return `${v.year} ${v.make} ${v.model} Available`;
  if (channelId === "craigslist") return `${v.year} ${v.make} ${v.model} - ${downLabel}`;
  if (["cars_com", "autotrader", "marketplace_listings"].includes(channelId)) return `${v.year} ${v.make} ${v.model} ${v.trim || ""}`.trim();
  if (goal === "spanish") return `${v.year} ${v.make} ${v.model} - English / Espanol`;
  if (goal === "aging") return `Still available: ${v.year} ${v.make} ${v.model}`;
  if (goal === "commercial") return `Business-ready ${v.year} ${v.make} ${v.model}`;
  if (goal === "calls") return `Call today on this ${v.year} ${v.make} ${v.model}`;
  return `${v.year} ${v.make} ${v.model} - ${downLabel}`;
}

function generateBody(v, goal, lang, channelId) {
  const { fmt$, fmtMi } = GGG;
  const trim = v.trim ? ` ${v.trim}` : "";
  const color = v.color ? `${v.color}. ` : "";
  const features = (v.features || []).slice(0, 3).join(", ");
  const featureLine = features ? `${features}. ` : "";
  const downLine = Number(v.down) > 0 ? `${fmt$(v.down)} down` : "down payment options available";
  const approval = "Financing available with approved application. Subject to approval.";

  if (lang === "es") {
    return `${v.year} ${v.make} ${v.model}${trim}. ${Number(v.down) > 0 ? `${fmt$(v.down)} de enganche.` : "Opciones de enganche disponibles."} ${fmtMi(v.mileage)}. Hablamos espanol. ${approval}`;
  }

  if (channelId === "sms_email") {
    return `Still looking? This ${v.year} ${v.make} ${v.model} is available with ${downLine}. Reply here or call us to check availability. ${approval}`;
  }

  if (channelId === "linkedin_commercial") {
    return `${v.year} ${v.make} ${v.model}${trim} ready for business use. ${fmtMi(v.mileage)}. ${featureLine}A strong option for contractors, service businesses, or fleet needs. ${approval}`;
  }

  if (channelId === "google_ads") {
    return `Headlines: ${v.year} ${v.make} ${v.model} Available | Used Cars in Wabash | Financing Options Available\nDescriptions: See this ${v.year} ${v.make} ${v.model}${trim}. Call Right Price Auto Sales to check availability. ${approval}`;
  }

  if (channelId === "instagram_organic") {
    return `${v.year} ${v.make} ${v.model}${trim} on the lot. ${fmtMi(v.mileage)}. ${featureLine}Message us to check availability. ${approval}\n\n#UsedCars #WabashIN #BuyHerePayHere`;
  }

  if (channelId === "craigslist") {
    return `${v.year} ${v.make} ${v.model}${trim}\n${fmtMi(v.mileage)}\n${color}${featureLine}${downLine}\n\nCall or message Right Price Auto Sales for availability. ${approval}`;
  }

  if (["cars_com", "autotrader", "marketplace_listings"].includes(channelId)) {
    return `Clean listing package for this ${v.year} ${v.make} ${v.model}${trim}. ${fmtMi(v.mileage)}, ${color}${featureLine}${downLine}. Contact the lot for details and availability. ${approval}`;
  }

  if (channelId === "short_video") {
    return `Hook: Quick look at this ${v.year} ${v.make} ${v.model}. Show front, interior, mileage, key features, and down payment. Close with: message us or apply online. ${approval}`;
  }

  if (goal === "spanish" || lang === "both") {
    return `Take a look at this ${v.year} ${v.make} ${v.model}${trim}. ${fmtMi(v.mileage)}, ${color}${featureLine}${downLine}. We speak English and Spanish. Hablamos espanol. ${approval}`;
  }

  return `Take a look at this ${v.year} ${v.make} ${v.model}${trim}. ${fmtMi(v.mileage)}, ${color}${featureLine}${downLine}. Apply online or message the lot to check availability. ${approval}`;
}

export { CampaignBuilder };
