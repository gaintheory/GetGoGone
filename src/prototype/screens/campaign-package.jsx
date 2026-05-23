import React from 'react';
import { Icon } from '../icons';
import { GGG } from '../data';
import { UI } from '../ui';
import { activeChannelModules, channelModules } from '../../features/campaigns/channel-modules';
import { recommendCampaignChannels, topRecommendedChannelIds } from '../../features/campaigns/recommendations';
import { assessVehicleReadiness } from '../../features/inventory/readiness';

const DEFAULT_CHANNELS = ["google_business", "google_ads", "meta_paid", "instagram_organic", "craigslist", "cars_com", "autotrader"];
const MAX_REWRITE_ATTEMPTS = 3;

function CampaignPackage({ nav, toast, vehicles: providedVehicles, clientId, routeState }) {
  const { VEHICLES, fmt$, fmtMi } = GGG;
  const { Pill, Btn, VehicleThumb } = UI;
  const vehicles = providedVehicles && providedVehicles.length ? providedVehicles : VEHICLES;
  const initialVehicleId = typeof routeState === "object" && routeState?.vehicleId ? routeState.vehicleId : vehicles[0]?.id || "";
  const initialChannelIds = typeof routeState === "object" && routeState?.channelIds?.length ? routeState.channelIds : DEFAULT_CHANNELS;
  const [vehicleId, setVehicleId] = React.useState(initialVehicleId);
  const [goal, setGoal] = React.useState("finance");
  const [language, setLanguage] = React.useState("both");
  const [selectedChannels, setSelectedChannels] = React.useState(initialChannelIds);
  const [outputs, setOutputs] = React.useState({});
  const [generating, setGenerating] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [ackHitlSave, setAckHitlSave] = React.useState(false);

  // Track applied route state values to completely prevent re-entrancy loops
  const appliedRouteStateRef = React.useRef("");

  const vehicle = vehicles.find(item => item.id === vehicleId) || vehicles[0];
  const readiness = vehicle ? assessVehicleReadiness(vehicle) : null;
  const recommendations = vehicle && readiness ? recommendCampaignChannels(vehicle, readiness) : [];
  const topChannelIds = vehicle && readiness ? topRecommendedChannelIds(vehicle, readiness) : DEFAULT_CHANNELS;
  const selectedModules = selectedChannels
    .map(id => channelModules.find(module => module.id === id))
    .filter(Boolean);
  const outputList = selectedModules.map(module => ({ module, output: outputs[module.id] })).filter(item => item.output);
  const passCount = outputList.filter(item => item.output?.review?.verdict === "pass").length;
  const issueCount = outputList.filter(item => item.output?.review?.verdict && item.output.review.verdict !== "pass").length;
  const hitlCount = outputList.filter(item => item.output?.hitlRequired).length;

  React.useEffect(() => {
    setAckHitlSave(false);
  }, [hitlCount]);

  React.useEffect(() => {
    if (vehicles.length && !vehicles.some(item => item.id === vehicleId)) {
      setVehicleId(vehicles[0].id);
    }
  }, [vehicleId, vehicles]);

  React.useEffect(() => {
    if (typeof routeState !== "object" || !routeState) return;
    
    // Create a value-serialized key
    const serializedKey = `${routeState.vehicleId}_${(routeState.channelIds || []).join(",")}_${routeState.source}`;
    if (appliedRouteStateRef.current === serializedKey) return;
    
    if (routeState.vehicleId && vehicles.some(item => item.id === routeState.vehicleId)) {
      setVehicleId(routeState.vehicleId);
    }
    if (routeState.channelIds?.length) {
      setSelectedChannels(routeState.channelIds);
      toast?.("Loaded recommended channels from Cockpit");
    }
    
    appliedRouteStateRef.current = serializedKey;
  }, [routeState, toast, vehicles]);

  const toggleChannel = (id) => {
    setSelectedChannels(current => (
      current.includes(id) ? current.filter(channelId => channelId !== id) : [...current, id]
    ));
  };

  const applyRecommendedChannels = () => {
    setSelectedChannels(topChannelIds.length ? topChannelIds : DEFAULT_CHANNELS);
    toast("Applied recommended channels");
  };

  const generatePackage = async () => {
    if (!vehicle) {
      toast("Select a vehicle first");
      return;
    }
    if (!selectedModules.length) {
      toast("Select at least one channel");
      return;
    }

    setGenerating(true);
    const nextOutputs = {};

    for (const module of selectedModules) {
      try {
        const copyResponse = await fetch("/api/ai/generate-copy", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clientId: clientId && clientId !== "agency_overview" ? clientId : undefined,
            vehicle,
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
        const copyResult = await copyResponse.json();
        if (!copyResponse.ok || !copyResult.ok) throw new Error(copyResult.error || "Copy generation failed");

        const repaired = await rewriteUntilCompliant({
          clientId,
          outputId: copyResult.generatedOutput?.id,
          module,
          language,
          headline: copyResult.copy.headline,
          body: copyResult.copy.body,
        });

        if (copyResult.generatedOutput?.id) {
          await fetch("/api/ai/generated-outputs", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: copyResult.generatedOutput.id,
              status: repaired.review.verdict === "pass" ? "reviewed" : "hitl_required",
              output: {
                headline: repaired.headline,
                body: repaired.body,
                raw: copyResult.raw || null,
                compliance_review: repaired.review,
                rewrite_attempts: repaired.attempts,
                rewrite_history: repaired.history,
                hitl_required: repaired.hitlRequired,
              },
            }),
          });
        }

        nextOutputs[module.id] = {
          headline: repaired.headline,
          body: repaired.body,
          provider: repaired.provider || copyResult.provider,
          model: repaired.model || copyResult.model,
          generatedOutputId: copyResult.generatedOutput?.id,
          review: repaired.review,
          attempts: repaired.attempts,
          history: repaired.history,
          hitlRequired: repaired.hitlRequired,
        };
        setOutputs(current => ({ ...current, [module.id]: nextOutputs[module.id] }));
      } catch (error) {
        nextOutputs[module.id] = {
          headline: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
          body: error instanceof Error ? error.message : "Generation failed",
          provider: "error",
          model: "none",
          error: true,
        };
        setOutputs(current => ({ ...current, [module.id]: nextOutputs[module.id] }));
      }
    }

    setGenerating(false);
    toast(`Generated ${Object.keys(nextOutputs).length} channel outputs`);
  };

  const saveCampaign = async () => {
    if (!vehicle || outputList.length === 0) {
      toast("Generate a package before saving");
      return;
    }

    if (hitlCount > 0 && !ackHitlSave) {
      setAckHitlSave(true);
      toast(`${hitlCount} output${hitlCount === 1 ? "" : "s"} need HITL review. Click Save again to keep as draft.`);
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: clientId && clientId !== "agency_overview" ? clientId : undefined,
          vehicle,
          name: `${vehicle.year} ${vehicle.make} ${vehicle.model} campaign package`,
          goal,
          language,
          status: "draft",
          channels: outputList.map(({ module, output }) => ({
            id: module.id,
            name: module.name,
            category: module.category,
            headline: output.headline,
            primaryText: output.body,
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
      if (!response.ok || !result.ok) throw new Error(result.error || "Campaign package could not be saved");
      toast("Campaign package saved");
      nav("campaignReview", result.campaign.id);
    } catch (error) {
      toast(error instanceof Error ? error.message : "Campaign package could not be saved");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page">
      <div className="page-h">
        <div>
          <h1>Package Builder</h1>
          <div className="sub">Generate channel-specific copy, compliance checks, and a draft campaign from one vehicle.</div>
        </div>
        <div className="page-actions">
          {hitlCount > 0 && <Btn icon={Icon.AlertTriangle} onClick={() => nav("aiLibrary", { status: "hitl_required" })}>Review HITL</Btn>}
          <Btn icon={Icon.CheckCircle} onClick={applyRecommendedChannels}>Use recommended</Btn>
          <Btn icon={Icon.Sparkles} onClick={generatePackage} disabled={generating}>{generating ? "Generating..." : "Generate package"}</Btn>
          <Btn icon={Icon.Send} variant="primary" onClick={saveCampaign} disabled={saving || !outputList.length}>{saving ? "Saving..." : "Save as campaign"}</Btn>
        </div>
      </div>

      <div className="kpi-grid" style={{ marginBottom: 14 }}>
        <PackageKpi label="Channels" value={selectedModules.length} note="Selected for this package"/>
        <PackageKpi label="Generated" value={outputList.length} note="Saved to AI Library"/>
        <PackageKpi label="Compliance pass" value={passCount} note="Ready for review"/>
        <PackageKpi label="Needs review" value={issueCount} note="After bounded repair"/>
        <PackageKpi label="HITL" value={hitlCount} note="Manual review required"/>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 14, alignItems: "start" }}>
        <div className="card">
          <div className="card-h"><div style={{ fontWeight: 600 }}>Package setup</div></div>
          <div className="card-b col" style={{ gap: 12 }}>
            <div className="field">
              <label>Vehicle</label>
              <select className="select" value={vehicle?.id || ""} onChange={event => setVehicleId(event.target.value)}>
                {vehicles.map(item => (
                  <option key={item.id} value={item.id}>{item.year} {item.make} {item.model}</option>
                ))}
              </select>
            </div>
            {vehicle && (
              <div style={{ display: "flex", gap: 10, alignItems: "center", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: 9 }}>
                <VehicleThumb v={vehicle} size="lg"/>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 12.5 }}>{vehicle.year} {vehicle.make} {vehicle.model}</div>
                  <div className="muted" style={{ fontSize: 11 }}>{fmtMi(vehicle.mileage)} · {vehicle.color || "Color not set"}</div>
                  <div className="muted mono" style={{ fontSize: 11 }}>{safeOffer(vehicle, fmt$)}</div>
                </div>
              </div>
            )}
            {routeState?.source === "cockpit" && (
              <div style={{ border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "8px 9px", background: "var(--primary-50)", fontSize: 11.5 }}>
                Loaded from Cockpit with recommended channels preselected.
              </div>
            )}
            {readiness && <ReadinessPanel readiness={readiness}/>}
            {recommendations.length > 0 && <RecommendationPanel recommendations={recommendations}/>}
            <div className="field">
              <label>Goal</label>
              <select className="select" value={goal} onChange={event => setGoal(event.target.value)}>
                <option value="finance">Finance applications</option>
                <option value="calls">Calls and messages</option>
                <option value="spanish">Spanish-language buyers</option>
                <option value="commercial">Commercial vehicle push</option>
                <option value="aging">Move aging inventory</option>
                <option value="fresh">Fresh arrival</option>
              </select>
            </div>
            <div className="field">
              <label>Language</label>
              <select className="select" value={language} onChange={event => setLanguage(event.target.value)}>
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="both">English + Spanish</option>
              </select>
            </div>
            <div>
              <div className="label" style={{ marginBottom: 6 }}>Channels</div>
              <div className="col" style={{ gap: 5 }}>
                {activeChannelModules.map(module => (
                  <label key={module.id} className="checkbox" style={{ justifyContent: "space-between" }}>
                    <span className="row" style={{ gap: 7 }}>
                      <input type="checkbox" checked={selectedChannels.includes(module.id)} onChange={() => toggleChannel(module.id)}/>
                      <span style={{ width: 10, height: 10, borderRadius: 999, background: module.color }}/>
                      <span>
                        {module.name}
                        {channelFitNote(module, readiness) && <span className="muted" style={{ display: "block", fontSize: 10.5 }}>{channelFitNote(module, readiness)}</span>}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="col" style={{ gap: 12 }}>
          {selectedModules.map(module => (
            <PackageOutputCard key={module.id} module={module} output={outputs[module.id]}/>
          ))}
        </div>
      </div>
    </div>
  );
}

function RecommendationPanel({ recommendations }) {
  const { Pill } = UI;
  const top = recommendations.filter(item => !item.blocked).slice(0, 4);

  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "8px 9px", background: "var(--surface)" }}>
      <div className="label" style={{ marginBottom: 6 }}>Recommended channels</div>
      <div className="col" style={{ gap: 6 }}>
        {top.map(item => (
          <div key={item.channelId} style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 11.5 }}>{item.module?.name || item.channelId}</div>
              <div className="muted" style={{ fontSize: 10.5, lineHeight: 1.35 }}>{item.reason}</div>
            </div>
            <Pill tone={item.priority === "high" ? "green" : item.priority === "medium" ? "amber" : "gray"}>{item.score}</Pill>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReadinessPanel({ readiness }) {
  const { Pill } = UI;
  const blockers = readiness.issues.filter(issue => issue.severity === "high");

  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "8px 9px", background: readiness.status === "ready" ? "rgba(22, 163, 74, 0.06)" : "rgba(245, 158, 11, 0.08)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <div className="label">Vehicle readiness</div>
        <Pill tone={readiness.status === "ready" ? "green" : readiness.status === "needs_work" ? "amber" : "red"}>{readiness.score}</Pill>
      </div>
      <div className="muted" style={{ fontSize: 11.5, lineHeight: 1.4, marginTop: 5 }}>{readiness.summary}</div>
      {blockers.length > 0 && (
        <div className="col" style={{ gap: 4, marginTop: 7 }}>
          {blockers.slice(0, 3).map(issue => (
            <div key={issue.id} style={{ fontSize: 11.5, color: "var(--danger)" }}>{issue.label}</div>
          ))}
        </div>
      )}
      {readiness.opportunities.length > 0 && (
        <div className="row" style={{ gap: 4, marginTop: 8, flexWrap: "wrap" }}>
          {readiness.opportunities.map(item => <Pill key={item} tone="blue">{titleCase(item)}</Pill>)}
        </div>
      )}
    </div>
  );
}

function channelFitNote(module, readiness) {
  if (!readiness) return "";
  if (readiness.status === "blocked" && ["google_ads", "meta_paid", "instagram_organic"].includes(module.id)) {
    return "Fix blockers first";
  }
  if (readiness.opportunities.includes("commercial_fit") && module.id === "linkedin_commercial") {
    return "Recommended for work-use vehicle";
  }
  if (readiness.opportunities.includes("creative_ready") && ["instagram_organic", "short_video", "meta_paid"].includes(module.id)) {
    return "Photo-ready channel";
  }
  if (readiness.opportunities.includes("finance_ready") && ["google_ads", "meta_paid", "google_business"].includes(module.id)) {
    return "Finance-ready";
  }
  return "";
}

function PackageOutputCard({ module, output }) {
  const { Pill } = UI;
  const verdict = output?.review?.verdict;

  return (
    <div className="card">
      <div className="card-h">
        <div className="row">
          <span style={{ width: 22, height: 22, borderRadius: "var(--radius-sm)", background: module.color, color: "#fff", display: "grid", placeItems: "center", fontSize: 10, fontWeight: 700 }}>
            {module.shortName.slice(0, 2).toUpperCase()}
          </span>
          <div>
            <div style={{ fontWeight: 600, fontSize: 13 }}>{module.name}</div>
            <div className="muted" style={{ fontSize: 11.5 }}>{module.category}</div>
          </div>
        </div>
        <div className="row">
          {output?.generatedOutputId && <Pill tone="blue">saved</Pill>}
          {output?.attempts > 0 && <Pill tone="amber">{output.attempts} rewrites</Pill>}
          {output?.hitlRequired && <Pill tone="red">HITL</Pill>}
          {verdict && <Pill tone={verdict === "pass" ? "green" : verdict === "fail" ? "red" : "amber"}>{titleCase(verdict)}</Pill>}
          {!output && <Pill>Not generated</Pill>}
        </div>
      </div>
      <div className="card-b" style={{ display: "grid", gridTemplateColumns: "1fr 0.55fr", gap: 12 }}>
        <div className="col" style={{ gap: 8 }}>
          <div className="field">
            <label>Headline</label>
            <input className="input" value={output?.headline || ""} readOnly placeholder="Generate package to fill this"/>
          </div>
          <div className="field">
            <label>Copy</label>
            <textarea className="input" value={output?.body || ""} readOnly rows={6} placeholder="Generated channel copy will appear here"/>
          </div>
        </div>
        <div className="col" style={{ gap: 8 }}>
          <Mini title="Provider">{output ? `${output.provider} / ${output.model}` : "Not generated"}</Mini>
          <Mini title="Repair loop">{output ? repairLabel(output) : `Max ${MAX_REWRITE_ATTEMPTS} rewrites before HITL`}</Mini>
          <Mini title="Attempt history">{output?.history?.length ? `${output.history.length} compliance check${output.history.length === 1 ? "" : "s"} stored` : "Stored after generation"}</Mini>
          <Mini title="Outputs">{module.generatedOutputs.join(", ")}</Mini>
          <Mini title="Metrics">{(module.metricFields || []).join(", ") || "Manual notes"}</Mini>
          <Mini title="Publishing">{module.publishingMethod}</Mini>
          <Mini title="Compliance">{output?.review?.issues?.length ? output.review.issues.map(issue => issue.message).join(" ") : verdict === "pass" ? "Passed" : module.complianceNotes.join(" ")}</Mini>
        </div>
      </div>
    </div>
  );
}

function PackageKpi({ label, value, note }) {
  return (
    <div className="kpi">
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
      <div className="kpi-sub">{note}</div>
    </div>
  );
}

async function checkCompliance({ clientId, outputId, module, language, headline, body }) {
  const response = await fetch("/api/ai/compliance-check", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      clientId: clientId && clientId !== "agency_overview" ? clientId : undefined,
      outputId,
      headline,
      body,
      language,
      channel: {
        id: module.id,
        name: module.name,
        complianceNotes: module.complianceNotes,
      },
    }),
  });
  const result = await response.json();
  return response.ok && result.ok ? result.review : null;
}

async function rewriteCopy({ module, language, headline, body, issues }) {
  const response = await fetch("/api/ai/rewrite-copy", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      headline,
      body,
      language,
      channel: {
        id: module.id,
        name: module.name,
        complianceNotes: module.complianceNotes,
      },
      issues,
    }),
  });
  const result = await response.json();
  if (!response.ok || !result.ok) return null;
  return result;
}

async function rewriteUntilCompliant({ clientId, outputId, module, language, headline, body }) {
  let currentHeadline = headline;
  let currentBody = body;
  let review = await checkCompliance({ clientId, outputId, module, language, headline: currentHeadline, body: currentBody });
  let provider = null;
  let model = null;
  let attempts = 0;
  const history = [];

  history.push(buildHistoryEntry({
    attempt: 0,
    headline: currentHeadline,
    body: currentBody,
    review,
    provider: "initial",
    model: "generated",
  }));

  while (review && review.verdict !== "pass" && attempts < MAX_REWRITE_ATTEMPTS) {
    const rewritten = await rewriteCopy({
      module,
      language,
      headline: currentHeadline,
      body: currentBody,
      issues: review.issues || [],
    });

    if (!rewritten?.copy) break;

    attempts += 1;
    currentHeadline = rewritten.copy.headline;
    currentBody = rewritten.copy.body;
    provider = rewritten.provider;
    model = rewritten.model;
    review = await checkCompliance({ clientId, outputId, module, language, headline: currentHeadline, body: currentBody });
    history.push(buildHistoryEntry({
      attempt: attempts,
      headline: currentHeadline,
      body: currentBody,
      review,
      provider,
      model,
    }));
  }

  if (!review) {
    review = {
      verdict: "needs_review",
      provider: "system",
      model: "compliance-fallback",
      checked_at: new Date().toISOString(),
      issues: [{
        severity: "medium",
        message: "Compliance check did not complete.",
        suggestion: "Route this output to human review before publishing.",
      }],
    };
    history.push(buildHistoryEntry({
      attempt: attempts,
      headline: currentHeadline,
      body: currentBody,
      review,
      provider: "system",
      model: "compliance-fallback",
    }));
  }

  return {
    headline: currentHeadline,
    body: currentBody,
    review,
    provider,
    model,
    attempts,
    history,
    hitlRequired: !review || review.verdict !== "pass",
  };
}

function buildHistoryEntry({ attempt, headline, body, review, provider, model }) {
  return {
    attempt,
    headline,
    body,
    provider,
    model,
    verdict: review?.verdict || "not_checked",
    issues: review?.issues || [],
    checked_at: review?.checked_at || new Date().toISOString(),
  };
}

function repairLabel(output) {
  if (output.hitlRequired) return `Stopped after ${output.attempts || 0} rewrite attempts`;
  if (!output.attempts) return "Passed without rewrite";
  return `Passed after ${output.attempts} rewrite attempt${output.attempts === 1 ? "" : "s"}`;
}

function Mini({ title, children }) {
  return (
    <div>
      <div className="label">{title}</div>
      <div className="muted" style={{ fontSize: 11.5, lineHeight: 1.45, marginTop: 3 }}>{children}</div>
    </div>
  );
}

function safeOffer(vehicle, fmt$) {
  return Number(vehicle.down) > 0 ? `${fmt$(vehicle.down)} down` : "Down payment options available";
}

function ctaForModule(channelId, goal) {
  if (channelId === "meta_paid" && goal === "finance") return "Apply now";
  if (channelId === "google_ads") return "Call now";
  if (channelId === "sms_email") return "Reply to check availability";
  if (channelId === "google_business") return "Call now";
  if (channelId === "cars_com" || channelId === "autotrader") return "Check availability";
  if (channelId === "linkedin_commercial") return "Contact the dealership";
  return "Check availability";
}

function titleCase(value) {
  return String(value || "").replace(/_/g, " ").replace(/\b\w/g, letter => letter.toUpperCase());
}

export { CampaignPackage };
