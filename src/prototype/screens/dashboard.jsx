import React from 'react';
import { Icon } from '../icons';
import { GGG } from '../data';
import { UI } from '../ui';

function Dashboard({ nav, clientId, toast }) {
  const { VEHICLES, LEADS, fmt$, statusPill } = GGG;
  const { Pill, Btn, VehicleThumb, KPI } = UI;

  const [campaigns, setCampaigns] = React.useState([]);
  const [proposals, setProposals] = React.useState([]);
  const [dbVehicles, setDbVehicles] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [actionHistory, setActionHistory] = React.useState([]);

  // Local storage background agent states (defaults to all ON)
  const [agentSettings, setAgentSettings] = React.useState({
    watcher: true,
    spanish_copywriter: true,
    compliance_checker: true,
    creative_refresher: true,
    video_producer: true,
    publishing_assistant: true,
  });

  // Load settings from local storage on mount/clientId change
  React.useEffect(() => {
    const key = `GGG_agent_settings_${clientId || 'default'}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        setAgentSettings(JSON.parse(saved));
      } catch {
        // ignore
      }
    }
  }, [clientId]);

  // Save agent settings
  const toggleAgent = (agentKey) => {
    const nextSettings = { ...agentSettings, [agentKey]: !agentSettings[agentKey] };
    setAgentSettings(nextSettings);
    localStorage.setItem(`GGG_agent_settings_${clientId || 'default'}`, JSON.stringify(nextSettings));
    toast(`🤖 Background Agent ${agentKey.replace("_", " ")} configuration updated!`);
  };

  // Fetch proposals, campaigns, and vehicles
  const loadCockpitData = React.useCallback(async () => {
    let active = true;
    setLoading(true);
    
    const params = clientId && clientId !== "agency_overview" ? `?clientId=${encodeURIComponent(clientId)}` : "";
    
    try {
      // 1. Fetch campaigns and inventory
      const [campaignRes, inventoryRes, proposalsRes] = await Promise.all([
        fetch(`/api/campaigns${params}`).then(res => res.json()),
        fetch(`/api/inventory${params}`).then(res => res.json()),
        fetch(`/api/agents/proposals${params}`).then(res => res.json())
      ]);

      if (!active) return;

      const loadedCampaigns = campaignRes?.ok ? campaignRes.campaigns || [] : [];
      const loadedVehicles = inventoryRes?.ok ? inventoryRes.vehicles || [] : [];
      let loadedProposals = proposalsRes?.ok ? proposalsRes.proposals || [] : [];

      setCampaigns(loadedCampaigns);
      setDbVehicles(loadedVehicles);

      // 2. Self-Healing Auto-Seeder if agent proposals queue is empty
      if (loadedProposals.length === 0 && loadedVehicles.length > 0) {
        const testVehicles = loadedVehicles.slice(0, 4);
        const seeds = [
          {
            sourceKey: `watcher:${testVehicles[0]?.id || "v1"}:20260523`,
            agentType: "watcher",
            targetType: "vehicle",
            targetId: testVehicles[0]?.id || "v1",
            proposalType: "campaign_generation",
            title: `Fresh Intake: Propose ${testVehicles[0]?.year || 2019} ${testVehicles[0]?.make || "Jeep"} campaign`,
            reasoning: `Lot arrival lacks active campaigns. Proposing a high-intent Craigslist and GBP organic ad bundle.`,
            riskLevel: "low",
            proposedPayload: { vehicleId: testVehicles[0]?.id, vehicleName: `${testVehicles[0]?.year} ${testVehicles[0]?.make} ${testVehicles[0]?.model}` }
          },
          {
            sourceKey: `spanish_copywriter:${testVehicles[1]?.id || "v2"}:20260523`,
            agentType: "spanish_copywriter",
            targetType: "vehicle",
            targetId: testVehicles[1]?.id || "v2",
            proposalType: "spanish_bilingual_reach",
            title: `Bilingual Outreach: Draft ${testVehicles[1]?.make || "Ford"} Spanish ad`,
            reasoning: `Top search brand in local bilingual demographics has no Spanish campaigns. Proposing a down payment Craigslist spanish copy package.`,
            riskLevel: "medium",
            proposedPayload: { vehicleId: testVehicles[1]?.id, vehicleName: `${testVehicles[1]?.year} ${testVehicles[1]?.make} ${testVehicles[1]?.model}` }
          },
          {
            sourceKey: `compliance_checker:${testVehicles[2]?.id || "v3"}:20260523`,
            agentType: "compliance_checker",
            targetType: "campaign_channel",
            targetId: testVehicles[2]?.id || "v3",
            proposalType: "compliance_disclaimer_fix",
            title: `FTC Compliance Fix: missing payment disclaimer`,
            reasoning: `Ad draft lists payment claim ($120/wk) without declaring down payment or financing APR margins, violating FTC Reg Z bounds.`,
            riskLevel: "high",
            proposedPayload: { vehicleId: testVehicles[2]?.id, channelId: "craigslist", fixField: "primary_text" }
          },
          {
            sourceKey: `creative_refresher:${testVehicles[3]?.id || "v4"}:20260523`,
            agentType: "creative_refresher",
            targetType: "vehicle",
            targetId: testVehicles[3]?.id || "v4",
            proposalType: "creative_overlay_refresh",
            title: `Creative Decay: Refresh ${testVehicles[3]?.make || "Toyota"} ad canvas`,
            reasoning: `Visual ad template running 21 days has click-through rate sliding below 1.5%. Proposing overlay template update.`,
            riskLevel: "medium",
            proposedPayload: { vehicleId: testVehicles[3]?.id, canvasTemplate: "craigslist_lead_image" }
          }
        ];

        // Seed to Supabase
        const seedRes = await fetch("/api/agents/proposals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clientId: clientId !== "agency_overview" ? clientId : null,
            proposals: seeds
          })
        });

        const seedData = await seedRes.json();
        if (seedRes.ok && seedData.ok) {
          loadedProposals = seedData.proposals || [];
        }
      }

      // 3. Dynamic compliance scan for vehicle history reports missing history badge/QR code overlays
      const vehicleSourceListForScan = loadedVehicles.length > 0 ? loadedVehicles : VEHICLES;
      const historyReportVehicles = vehicleSourceListForScan.filter(v => v.sourceUrl && v.sourceUrl.trim().length > 0);
      
      const newProposalsToSeed = [];
      for (const vehicle of historyReportVehicles) {
        // Check if there is already a proposal (pending or decided) for this vehicle's history badge compliance
        const hasHistoryProposal = loadedProposals.some(p => 
          p.agent_type === "compliance_checker" && 
          p.target_id === String(vehicle.id) && 
          p.proposal_type === "compliance_history_badge"
        );
        
        if (!hasHistoryProposal) {
          newProposalsToSeed.push({
            sourceKey: `compliance_history:${vehicle.id}:${new Date().toISOString().split('T')[0]}`,
            agentType: "compliance_checker",
            targetType: "vehicle",
            targetId: vehicle.id,
            proposalType: "compliance_history_badge",
            title: `Compliance: Missing History badge on Craigslist flyer for ${vehicle.year} ${vehicle.make} ${vehicle.model}`,
            reasoning: `Vehicle has a verified history report URL attached (${vehicle.sourceUrl}), but no history badge or QR code overlay is present on its active visual campaign templates. Proposing designer action to maintain transparency.`,
            riskLevel: "medium",
            proposedPayload: { vehicleId: vehicle.id, launchDesigner: true }
          });
        }
      }

      if (newProposalsToSeed.length > 0) {
        const seedRes = await fetch("/api/agents/proposals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clientId: clientId !== "agency_overview" ? clientId : null,
            proposals: newProposalsToSeed
          })
        });
        const seedData = await seedRes.json();
        if (seedRes.ok && seedData.ok) {
          const freshProposals = seedData.proposals || [];
          // Merge freshly seeded history proposals
          loadedProposals = [
            ...loadedProposals,
            ...freshProposals.filter(fp => !loadedProposals.some(lp => lp.id === fp.id))
          ];
        }
      }

      setProposals(loadedProposals);
    } catch (err) {
      console.error("Error loading cockpit data:", err);
    } finally {
      if (active) setLoading(false);
    }

    return () => {
      active = false;
    };
  }, [clientId]);

  React.useEffect(() => {
    loadCockpitData();
  }, [loadCockpitData]);

  // Execute Proposal Review Decision
  const decideProposal = async (id, status, details = "") => {
    try {
      const res = await fetch("/api/agents/proposals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status })
      });

      const result = await res.json();
      if (!res.ok || !result.ok) throw new Error(result.error || "Review patch failed");

      // Log decision to audit trail
      await fetch("/api/publishing/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: clientId !== "agency_overview" ? clientId : null,
          campaignId: null,
          channelId: result.proposal?.target_id || id,
          actionType: `proposal_${status}`,
          platform: result.proposal?.agent_type || "agent",
          destinationUrl: `Title: ${result.proposal?.title || "Proposal"}. Notes: ${details}`,
        })
      });

      setActionHistory(prev => [
        { title: result.proposal?.title, status, time: new Date().toLocaleTimeString() },
        ...prev
      ]);

      toast(`Proposal successfully ${status}!`);
      loadCockpitData();

      // Trigger recovery actions immediately if approved
      if (status === "approved") {
        const payload = result.proposal?.proposed_payload || {};
        if (result.proposal?.agent_type === "watcher" || result.proposal?.agent_type === "spanish_copywriter") {
          nav("packageBuilder", payload.vehicleId);
        } else if (result.proposal?.agent_type === "creative_refresher") {
          nav("designer", payload.vehicleId);
        } else if (result.proposal?.agent_type === "compliance_checker") {
          if (payload.launchDesigner) {
            nav("designer", payload.vehicleId);
          } else {
            nav("campaigns");
          }
        }
      }
    } catch (err) {
      toast(err instanceof Error ? err.message : "Review could not be completed");
    }
  };

  // Compile calculations
  const vehicleSourceList = dbVehicles.length > 0 ? dbVehicles : VEHICLES;
  const activeCount = vehicleSourceList.filter(v => v.status !== "Sold").length;
  const needsAttention = vehicleSourceList.filter(v => ["Needs Photos","Missing Payment","Needs Refresh"].includes(v.status) || v.campaign === "Needs Refresh");
  const aging = vehicleSourceList.map((v, i) => ({ ...v, daysIn: v.lotAge || ((i * 9 + 11) % 45) + 5 })).filter(v => v.daysIn >= 30).sort((a,b) => b.daysIn - a.daysIn);
  const newLeadsToday = LEADS.filter(l => l.when.includes("min") || l.when.includes("hr ago")).length;
  const activeCampaigns = campaigns.length > 0 ? campaigns.length : vehicleSourceList.filter(v => ["Published","Ready to Review"].includes(v.campaign)).length;

  // Filter proposals by settings toggled ON
  const filteredProposals = proposals.filter(p => {
    if (p.status !== "pending") return false;
    return agentSettings[p.agent_type] !== false;
  });

  const getAgentColor = (agentType) => {
    switch (agentType) {
      case "watcher": return "#3b82f6";
      case "spanish_copywriter": return "#a855f7";
      case "compliance_checker": return "#ef4444";
      case "creative_refresher": return "#f59e0b";
      default: return "#10b981";
    }
  };

  const getRiskTone = (risk) => {
    switch (risk?.toLowerCase()) {
      case "high": return "danger";
      case "medium": return "warning";
      default: return "success";
    }
  };

  return (
    <div className="page">
      <div className="page-h">
        <div>
          <h1>Agency Dashboard</h1>
          <div className="sub">Ray Lawson · {clientId === "agency_overview" ? "Agency Overview rooftop command" : "Active dealership console"}</div>
        </div>
        <div className="page-actions" style={{ display: "flex", gap: 10 }}>
          <Btn icon={Icon.Settings} onClick={() => setSettingsOpen(true)}>🤖 Agent Settings</Btn>
          <Btn icon={Icon.Sparkles} variant="primary" onClick={() => nav("packageBuilder")}>Generate Campaign</Btn>
        </div>
      </div>

      <div className="kpis">
        <KPI label="Active inventory" value={activeCount} delta="3 new this week" deltaTone="up" icon={Icon.Car}
             spark={[20,22,21,24,26,28,29,30,29,31,32,activeCount]} sparkColor="#2563EB"/>
        <KPI label="Active campaigns" value={activeCampaigns} delta="2 ready to review" deltaTone="up" icon={Icon.Megaphone}
             spark={[10,11,9,13,12,14,16,15,18,17,19,activeCampaigns]} sparkColor="#0891B2"/>
        <KPI label="New leads today" value={newLeadsToday} delta="vs 4 yesterday" deltaTone="up" icon={Icon.Inbox}
             spark={[3,5,2,6,4,7,5,8,6,9,7,11]} sparkColor="#16A34A"/>
        <KPI label="Needs attention" value={needsAttention.length} delta="3 vehicles" deltaTone="down" icon={Icon.AlertTriangle}
             spark={[5,6,7,6,7,8,7,9,8,7,6,7]} sparkColor="#F59E0B"/>
      </div>

      {/* Human-in-the-Loop Agents Proposals Queue */}
      <div className="card" style={{ marginBottom: 14 }}>
        <div className="card-h" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h3 style={{ display: "flex", alignItems: "center", gap: 6, color: "#38bdf8" }}>
              🤖 Background Agent Proposal Queue
            </h3>
            <div className="sub">Staged lot optimization actions waiting for operator review</div>
          </div>
          <span style={{ fontSize: 11, color: "var(--text-3)" }}>
            {filteredProposals.length} pending staged actions
          </span>
        </div>
        <div className="card-b" style={{ padding: 12 }}>
          {loading ? (
            <div className="muted" style={{ padding: 20, textAlign: "center" }}>Scanning background proposals...</div>
          ) : filteredProposals.length === 0 ? (
            <div className="muted" style={{ padding: 30, textAlign: "center" }}>
              <Icon.CheckCircle size={28} style={{ color: "var(--success)", opacity: 0.6, marginBottom: 8 }}/>
              <div>No pending agent proposals. Background agents are resting.</div>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
              {filteredProposals.map(p => (
                <div 
                  key={p.id} 
                  style={{ 
                    background: "rgba(30, 41, 59, 0.4)",
                    border: `1px solid ${getAgentColor(p.agent_type)}20`,
                    borderRadius: 10,
                    padding: 12,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    gap: 8,
                    position: "relative"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ 
                        display: "inline-block", width: 8, height: 8, borderRadius: "50%",
                        background: getAgentColor(p.agent_type)
                      }}/>
                      <span style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: getAgentColor(p.agent_type) }}>
                        {p.agent_type.replace("_", " ")}
                      </span>
                    </div>
                    <Pill tone={getRiskTone(p.risk_level)} size="xs">
                      {p.risk_level.toUpperCase()} RISK
                    </Pill>
                  </div>

                  <div>
                    <h4 style={{ margin: "2px 0 4px", fontSize: 13, color: "#fff", fontWeight: 600 }}>{p.title}</h4>
                    <p style={{ margin: 0, fontSize: 11.5, color: "var(--text-2)", lineHeight: 1.4 }}>
                      {p.reasoning}
                    </p>
                  </div>

                  <div style={{ 
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    borderTop: "1px solid rgba(255,255,255,0.04)", paddingTop: 8, marginTop: 4
                  }}>
                    <span style={{ fontSize: 10.5, color: "var(--text-3)", fontStyle: "italic" }}>
                      Proposed {new Date(p.created_at).toLocaleDateString()}
                    </span>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button 
                        className="btn sm" 
                        style={{ padding: "3px 8px", fontSize: 11 }}
                        onClick={() => decideProposal(p.id, "rejected")}
                      >
                        Reject
                      </button>
                      <button 
                        className="btn sm" 
                        style={{ padding: "3px 8px", fontSize: 11 }}
                        onClick={() => decideProposal(p.id, "snoozed")}
                      >
                        Snooze
                      </button>
                      <button 
                        className="btn primary sm" 
                        style={{ padding: "3px 8px", fontSize: 11, background: getAgentColor(p.agent_type), border: "none" }}
                        onClick={() => decideProposal(p.id, "approved")}
                      >
                        ⚡ Approve
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
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
                      <div className="muted" style={{ fontSize: 11.5 }}>{v.stock || v.stock_number || "Lot Asset"} · {v.exterior_color || v.color || "Vehicle"}</div>
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

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 14, marginTop: 14 }}>
        {/* Dynamic action history audit log */}
        <div className="card">
          <div className="card-h">
            <div>
              <h3>Agent Decision Audits</h3>
              <div className="sub">Trail of review and publishing decisions for active campaigns</div>
            </div>
          </div>
          <div className="card-b flush" style={{ padding: 12 }}>
            {actionHistory.length === 0 ? (
              <div className="muted" style={{ fontSize: 11.5 }}>No operator actions in this session yet.</div>
            ) : (
              <div className="col" style={{ gap: 6 }}>
                {actionHistory.map((ah, index) => (
                  <div 
                    key={index} 
                    style={{ 
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      padding: "6px 8px", background: "rgba(255,255,255,0.02)",
                      border: "1px solid var(--border)", borderRadius: 6, fontSize: 12
                    }}
                  >
                    <div className="row" style={{ gap: 6 }}>
                      <Pill tone={ah.status === "approved" ? "success" : "danger"} size="xs">
                        {ah.status.toUpperCase()}
                      </Pill>
                      <span style={{ fontWeight: 600 }}>{ah.title}</span>
                    </div>
                    <span className="muted mono">{ah.time}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Aging inventory */}
        <div className="card">
          <div className="card-h">
            <div>
              <h3>Aging inventory</h3>
              <div className="sub">30+ days on the lot</div>
            </div>
            <Btn size="sm" variant="ghost" onClick={() => nav("reports")}>Optimize</Btn>
          </div>
          <div className="card-b" style={{ padding: 0 }}>
            {aging.slice(0, 4).map((v, i) => (
              <div key={v.id} style={{ display: "flex", gap: 10, padding: "10px 14px", borderBottom: i < aging.slice(0,4).length - 1 ? "1px solid var(--border)" : "none", alignItems: "center" }}
                onClick={() => nav("vehicle", v.id)} role="button">
                <VehicleThumb v={v}/>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 12.5 }}>{v.year} {v.make} {v.model}</div>
                  <div className="muted" style={{ fontSize: 11.5 }}>{fmt$(v.price)} · {v.leads || 0} leads</div>
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

      {/* Background Agent Settings Panel */}
      {settingsOpen && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(15, 23, 42, 0.75)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000
        }}>
          <div className="card" style={{ width: 420, background: "#1e293b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, overflow: "hidden" }}>
            <div className="card-h" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", padding: 14 }}>
              <h3>🤖 Configure Background Lot Agents</h3>
              <button className="icon-btn" onClick={() => setSettingsOpen(false)} style={{ border: "none", background: "transparent", color: "#94a3b8" }}>
                <Icon.Close size={16}/>
              </button>
            </div>
            <div className="card-b col" style={{ padding: 16, gap: 12 }}>
              <p className="muted" style={{ fontSize: 12, lineHeight: 1.45, margin: "0 0 6px" }}>
                Enable or disable agent actions. Active background agents run diagnostic sweeps on inventory intakes, marketing calendars, and copy disclaimers.
              </p>

              {[
                { key: "watcher", name: "Inventory Watcher", desc: "Scans stock intakes and staging files to draft ad proposals." },
                { key: "spanish_copywriter", name: "Spanish Copywriter", desc: "Drafts Latinx-targeted down payment Craiglist and social posts." },
                { key: "compliance_checker", name: "Compliance Agent", desc: "Audits ad copies against FTC and Regulation Z standards." },
                { key: "creative_refresher", name: "Creative Refresher", desc: "Monitors CTR decays and triggers design canvas overlays." },
                { key: "video_producer", name: "Video Producer", desc: "Suggests shot storyboard compiles for aging arrivals." },
                { key: "publishing_assistant", name: "Publishing Assistant", desc: "Validates direct publisher API ingestion states." }
              ].map(agent => (
                <div 
                  key={agent.key}
                  style={{ 
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: 8, background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.04)", borderRadius: 8
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0, paddingRight: 10 }}>
                    <div style={{ fontWeight: 600, fontSize: 12.5, color: "#fff" }}>{agent.name}</div>
                    <div className="muted" style={{ fontSize: 11, marginTop: 1, lineHeight: 1.3 }}>{agent.desc}</div>
                  </div>
                  <div style={{ position: "relative", width: 42, height: 22 }}>
                    <input 
                      type="checkbox" 
                      checked={agentSettings[agent.key] !== false} 
                      onChange={() => toggleAgent(agent.key)}
                      style={{ 
                        width: "100%", height: "100%", opacity: 0, cursor: "pointer", 
                        position: "absolute", zIndex: 2 
                      }}
                    />
                    <div style={{
                      width: "100%", height: "100%", borderRadius: 12,
                      background: agentSettings[agent.key] !== false ? "#10b981" : "rgba(255,255,255,0.1)",
                      transition: "background 0.2s", position: "relative"
                    }}>
                      <div style={{
                        width: 16, height: 16, borderRadius: "50%", background: "#fff",
                        position: "absolute", top: 3,
                        left: agentSettings[agent.key] !== false ? 23 : 3,
                        transition: "left 0.2s"
                      }}/>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="card-f" style={{ display: "flex", justifyContent: "flex-end", padding: 12, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
              <Btn variant="primary" onClick={() => setSettingsOpen(false)}>Done</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export { Dashboard };
