import React from 'react';
import { Icon } from '../icons';
import { UI } from '../ui';
import { VehicleMedia } from '../vehicle-media';

function AgencyCockpit({ nav, clientId, activeClient, toast }) {
  const { Btn, Pill } = UI;
  const [items, setItems] = React.useState([]);
  const [metrics, setMetrics] = React.useState({});
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [filter, setFilter] = React.useState("all");
  const [proposals, setProposals] = React.useState([]);
  const [selectedProposal, setSelectedProposal] = React.useState(null);
  const [dismissedItems, setDismissedItems] = React.useState([]);

  // Pricing setup variables inside details modal
  const [approvedDown, setApprovedDown] = React.useState("1000");
  const [approvedWeekly, setApprovedWeekly] = React.useState("");
  const [approvedPrice, setApprovedPrice] = React.useState("");
  const [savingOffer, setSavingOffer] = React.useState(false);

  // Copywriting channels state inside details modal
  const [campaignChannels, setCampaignChannels] = React.useState([]);
  const [loadingChannels, setLoadingChannels] = React.useState(false);

  React.useEffect(() => {
    if (selectedProposal) {
      const v = selectedProposal.vehicle || 
                selectedProposal.proposed_payload?.vehicle || 
                selectedProposal.campaign?.vehicle;
      if (v) {
        setApprovedDown(v.down || v.down_payment || "1000");
        setApprovedWeekly(v.weekly || v.weekly_payment || "");
        setApprovedPrice(v.price || "");
      } else {
        setApprovedDown("1000");
        setApprovedWeekly("");
        setApprovedPrice("");
      }
    }
  }, [selectedProposal]);

  React.useEffect(() => {
    if (selectedProposal && (selectedProposal.type === "campaign_review" || selectedProposal.proposal_type === "campaign_review")) {
      const campaignId = selectedProposal.campaign?.id || selectedProposal.targetId;
      if (campaignId) {
        setLoadingChannels(true);
        fetch(`/api/campaigns?id=${campaignId}`)
          .then(res => res.json())
          .then(data => {
            if (data?.ok && data.campaign?.channels) {
              setCampaignChannels(data.campaign.channels);
            } else {
              setCampaignChannels([]);
            }
          })
          .catch(() => setCampaignChannels([]))
          .finally(() => setLoadingChannels(false));
      }
    } else {
      setCampaignChannels([]);
      setLoadingChannels(false);
    }
  }, [selectedProposal]);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const key = `ggg_dismissed_items_${clientId || "default"}`;
        const stored = localStorage.getItem(key);
        setDismissedItems(stored ? JSON.parse(stored) : []);
      } catch {
        setDismissedItems([]);
      }
    }
  }, [clientId]);

  const saveDismissedItems = (newItems) => {
    setDismissedItems(newItems);
    if (typeof window !== "undefined") {
      try {
        const key = `ggg_dismissed_items_${clientId || "default"}`;
        localStorage.setItem(key, JSON.stringify(newItems));
      } catch {}
    }
  };

  const dismissItem = (itemId) => {
    const updated = [...new Set([...dismissedItems, itemId])];
    saveDismissedItems(updated);
    toast?.("Item dismissed from queue.");
  };

  const clearAllQueue = () => {
    const activeIds = items.map(item => item.id);
    const updated = [...new Set([...dismissedItems, ...activeIds])];
    saveDismissedItems(updated);
    toast?.("Cockpit action queue cleared.");
  };

  const clientLabel = activeClient?.name || "Agency overview";

  const [swarmActive, setSwarmActive] = React.useState(false);
  const [vehicles, setVehicles] = React.useState([]);
  const [selectedVehicleId, setSelectedVehicleId] = React.useState("");
  const [swarmParticipants, setSwarmParticipants] = React.useState({
    strategy: true,
    copywriter: true,
    compliance: true,
    video: true,
  });
  const [swarmDialogue, setSwarmDialogue] = React.useState([]);
  const [swarming, setSwarming] = React.useState(false);
  const [swarmResult, setSwarmResult] = React.useState(null);
  const [savingSwarm, setSavingSwarm] = React.useState(false);

  React.useEffect(() => {
    const params = clientId && clientId !== "agency_overview" ? `?clientId=${encodeURIComponent(clientId)}` : "";
    fetch(`/api/inventory${params}`)
      .then(res => res.json())
      .then(data => {
        if (data.vehicles || data.ok) {
          const list = data.vehicles || [];
          setVehicles(list);
          if (list.length > 0) setSelectedVehicleId(String(list[0].id));
        }
      })
      .catch(() => {});
  }, [clientId]);

  const startSwarm = () => {
    if (!selectedVehicleId) {
      toast?.("Please select a target vehicle first.");
      return;
    }
    const vehicle = vehicles.find(v => String(v.id) === String(selectedVehicleId));
    if (!vehicle) return;

    setSwarming(true);
    setSwarmDialogue([]);
    setSwarmResult(null);

    const vName = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
    const vPrice = vehicle.price ? `$${Number(vehicle.price).toLocaleString()}` : "$14,995";
    const vDown = vehicle.downPayment ? `$${Number(vehicle.downPayment).toLocaleString()}` : "$1,995";

    const steps = [
      {
        agent: "Strategy Agent",
        avatar: "🤖",
        role: "Lead Strategist",
        text: `Analyzing ${vName} (mileage: ${vehicle.mileage || 45000} miles). This vehicle has a lot-age score of concern, but its readiness score is solid. I recommend a multi-channel deployment focusing on local Facebook Marketplace, organic Google Business Posts, and highly targeted local Spanish geo-campaigns to maximize cheap/organic leads. Let's pre-target buyers looking for reliable daily transport with flexible terms.`,
      },
      {
        agent: "Spanish Copywriter",
        avatar: "✍️",
        role: "Bilingual Creative",
        text: `¡Excelente opción! For this ${vehicle.make}, a warm family-centric tone is highly effective in Spanish. Let's run with: "¡Recién llegado! Hermoso ${vName} con poco millaje, ideal para el trabajo o la familia. Enganche bajo de solo ${vDown} y pagos accesibles. Consulta disponibilidad hoy mismo." Let's hand this over to Compliance for structural verification.`,
      },
      {
        agent: "Compliance Agent",
        avatar: "⚖️",
        role: "Legal Guardrail",
        text: `Checking Spanish copy: "enganche bajo" and "${vDown}" down payment look good under Reg Z, but we must strictly include the finance disclaimer. Banned phrases checked (0 triggers). I will append the official footer: "WAC. Subject to credit approval. Tax, title, and license may be additional." We are fully cleared for publication!`,
      },
      {
        agent: "Video Producer",
        avatar: "🎬",
        role: "Cinematographer",
        text: `Perfect! I've structured a 15-second visual promo storyboard. Shot 1: Smooth panning across the ${vehicle.make} front grill. Shot 2: Detail zoom on the clean wheels with a subtitle card showing "Enganche de ${vDown}". Shot 3: Clear QR Code overlay linked directly to the history report on our website. Voiceover dialogue matches our approved Spanish copywriting script exactly!`,
      }
    ];

    let current = 0;
    const interval = setInterval(() => {
      if (current < steps.length) {
        let agentKey = steps[current].agent.split(" ")[0].toLowerCase();
        if (agentKey === "spanish") agentKey = "copywriter";
        const activeParticipant = swarmParticipants[agentKey] !== false;
        
        const stepToAdd = steps[current];
        if (activeParticipant) {
          setSwarmDialogue(prev => [...prev, stepToAdd]);
        }
        current++;
      } else {
        clearInterval(interval);
        setSwarming(false);
        setSwarmResult({
          title: `Collaborative Swarm Package: ${vName}`,
          vehicleId: vehicle.id,
          campaignName: `Swarm Campaign - ${vName}`,
          smsCopy: `¡Recién llegado! Hermoso ${vName} con poco millaje. Enganche bajo de solo ${vDown}! Consulta disponibilidad hoy: ${vPrice}. Wabash Auto`,
          emailSubject: `Fresh Lot Arrival: Compliant ${vName} at Wabash Auto`,
          emailBody: `Hi {first_name},\n\nWe just received a clean ${vName} with a low down payment option of only ${vDown}. The full price is ${vPrice}.\n\nFinancing available WAC. Subject to approval. Ask about availability today!\n\n— Wabash Auto`,
          videoScript: `HOOK: ¿Buscas un auto familiar confiable? ¡Mira este ${vName}!\nBODY: Con poco millaje y enganche bajo de ${vDown}. Consulta disponibilidad hoy.\nDISCLAIMER: WAC. Sujeto a aprobación.`,
        });
      }
    }, 1500);
  };

  const saveSwarmCampaign = async () => {
    if (!swarmResult) return;
    const vehicle = vehicles.find(v => String(v.id) === String(swarmResult.vehicleId));
    if (!vehicle) return;

    setSavingSwarm(true);
    try {
      const response = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: clientId && clientId !== "agency_overview" ? clientId : undefined,
          vehicle,
          name: swarmResult.campaignName,
          goal: "spanish",
          language: "both",
          status: "draft",
          channels: [
            {
              id: "sms_email",
              name: "SMS / Email",
              category: "Messaging",
              headline: swarmResult.emailSubject,
              primaryText: swarmResult.emailBody,
              callToAction: "Reply to check availability",
              setupFields: ["Sender ID", "Disclaimer Mode"],
              generatedOutputs: ["SMS text message", "Email Campaign"],
              creativeFormats: ["Plain text email", "Short SMS bubble"],
              publishingMethod: "direct_api",
              complianceNotes: ["Down Payment safe text", "Finance disclaimer"],
            },
            {
              id: "short_video",
              name: "Short Commercial Video",
              category: "Video Studio",
              headline: `${vehicle.year} ${vehicle.make} Swarm Spot`,
              primaryText: swarmResult.videoScript,
              callToAction: "Message us",
              setupFields: ["Duration limit", "Voice gender"],
              generatedOutputs: ["Timed hook", "Narrative narration", "QR report badge"],
              creativeFormats: ["Story 9:16 video", "Landscape 16:9 spot"],
              publishingMethod: "manual_upload",
              complianceNotes: ["QR History badging", "Amber compliance alerts"],
            }
          ]
        })
      });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.error || "Swarm campaign save failed");
      toast?.("Swarm campaign saved successfully!");
      nav("campaignReview", result.campaign.id);
    } catch (err) {
      toast?.(`Could not save swarm campaign: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setSavingSwarm(false);
    }
  };

  const syncProposals = React.useCallback(async (queueItems) => {
    const candidates = queueItems
      .filter(item => ["first_campaign", "spanish_missing", "campaign_review"].includes(item.type))
      .slice(0, 8)
      .map(item => ({
        sourceKey: item.id,
        agentType: item.type === "campaign_review" ? "publishing_assistant" : "campaign_planner",
        targetType: item.targetType,
        targetId: item.targetId,
        proposalType: item.type,
        title: item.title,
        reason: item.reason,
        priority: item.priority,
        item,
      }));
    try {
      const saveResponse = await fetch("/api/agents/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, proposals: candidates }),
      });
      const saveResult = await saveResponse.json();
      if (!saveResponse.ok || !saveResult.ok) throw new Error(saveResult.error || "Proposal sync failed");
      const params = clientId && clientId !== "agency_overview" ? `?clientId=${encodeURIComponent(clientId)}` : "";
      const response = await fetch(`/api/agents/proposals${params}`);
      const result = await response.json();
      if (!response.ok || !result?.ok) throw new Error(result?.error || "Proposal load failed");
      setProposals((result.proposals || []).filter(item => item.status === "pending").slice(0, 5));
    } catch {
      setProposals(candidates.map(item => ({
        id: item.sourceKey,
        title: item.title,
        reasoning: item.reason,
        risk_level: item.priority,
        proposed_payload: item.item,
        status: "pending",
      })));
    }
  }, [clientId]);

  const loadCockpit = React.useCallback(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    const params = clientId && clientId !== "agency_overview" ? `?clientId=${encodeURIComponent(clientId)}` : "";
    fetch(`/api/agency/cockpit${params}`)
      .then(res => res.json())
      .then(payload => {
        if (cancelled) return;
        if (!payload.ok) {
          setError(payload.error || "Could not load cockpit");
          setItems([]);
          setMetrics({});
          return;
        }
        setItems(payload.items || []);
        setMetrics(payload.metrics || {});
        syncProposals(payload.items || []);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load cockpit");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [clientId, syncProposals]);

  React.useEffect(() => loadCockpit(), [loadCockpit]);

  const filtered = (filter === "all" ? items : items.filter(item => item.priority === filter || item.type === filter))
    .filter(item => !dismissedItems.includes(item.id));

  const saveApprovedDownPayment = async () => {
    const v = selectedProposal.vehicle || 
              selectedProposal.proposed_payload?.vehicle || 
              selectedProposal.campaign?.vehicle;
    if (!v) {
      toast?.("No active vehicle data resolved.");
      return;
    }
    setSavingOffer(true);
    try {
      const payload = {
        dealershipId: clientId,
        vehicle: {
          ...v,
          price: approvedPrice ? String(approvedPrice) : v.price,
          downPayment: approvedDown ? String(approvedDown) : "1000",
          weekly: approvedWeekly ? String(approvedWeekly) : v.weekly,
        }
      };

      const res = await fetch("/api/inventory/import/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error || "Failed to update pricing");
      }

      toast?.(`Successfully approved $${Number(approvedDown).toLocaleString()} down payment for ${v.year} ${v.make} ${v.model}!`);
      
      // Dismiss the item
      dismissItem(selectedProposal.id);
      setSelectedProposal(null);
      loadCockpit();
    } catch (err) {
      toast?.(`Could not save down payment: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setSavingOffer(false);
    }
  };

  const saveApprovedCampaignCopy = async () => {
    if (campaignChannels.length === 0) {
      toast?.("No channel copy resolved to save.");
      return;
    }
    setSavingOffer(true);
    try {
      // Loop over and save each channel with status = 'approved'
      for (const ch of campaignChannels) {
        const payload = {
          channelId: ch.id,
          headline: ch.headline,
          primaryText: ch.primary_text,
          description: ch.description,
          callToAction: ch.call_to_action,
          status: "approved",
          platformPayload: ch.platform_payload || {},
        };

        const res = await fetch("/api/campaigns", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const result = await res.json();
        if (!res.ok || !result.ok) {
          throw new Error(result.error || `Failed to update ${ch.channel} channel`);
        }
      }

      toast?.("Campaign channel copy successfully approved!");
      
      // Dismiss the item
      dismissItem(selectedProposal.id);
      setSelectedProposal(null);
      loadCockpit();
    } catch (err) {
      toast?.(`Could not approve copy: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setSavingOffer(false);
    }
  };

  const decideProposal = async (proposal, status) => {
    // 1. Instantly update UI state locally (optimistic/fail-safe)
    setProposals(current => current.filter(item => String(item.id) !== String(proposal.id)));
    
    // 2. Perform the action locally if approved
    if (status === "approved") {
      runAction(proposal.proposed_payload || proposal);
    }

    // 3. Attempt to persist to database in background
    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(proposal.id);
      if (isUuid) {
        const body = { id: proposal.id, status };
        if (status === "snoozed") {
          body.snoozedUntil = nextDayIso();
        }
        await fetch("/api/agents/proposals", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      }
    } catch (err) {
      console.warn("Could not persist proposal status update:", err);
    }
  };

  const handleModalAction = (status) => {
    if (selectedProposal) {
      const isProposal = selectedProposal.source_key || 
                         selectedProposal.agent_type || 
                         selectedProposal.proposal_type ||
                         proposals.some(p => p.id === selectedProposal.id);
                         
      if (isProposal) {
        decideProposal(selectedProposal, status);
      } else {
        dismissItem(selectedProposal.id);
      }
      setSelectedProposal(null);
    }
  };

  const archiveVehicle = async (vehicleId) => {
    if (!window.confirm("Are you sure you want to archive this vehicle? It will be preserved in database records but hidden from active inventory and cockpit recommendations.")) return;
    try {
      const response = await fetch(`/api/inventory?id=${vehicleId}&action=archive`, {
        method: "DELETE",
      });
      const result = await response.json();
      if (!response.ok || !result?.ok) throw new Error(result?.error || "Archive failed");
      toast?.("Vehicle listing archived successfully!");
      setSelectedProposal(null);
      loadCockpit();
    } catch (err) {
      toast?.(`Could not archive vehicle: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const deleteVehicle = async (vehicleId) => {
    if (!window.confirm("Are you sure you want to permanently delete this vehicle from the database? This action is irreversible.")) return;
    try {
      const response = await fetch(`/api/inventory?id=${vehicleId}&action=delete`, {
        method: "DELETE",
      });
      const result = await response.json();
      if (!response.ok || !result?.ok) throw new Error(result?.error || "Delete failed");
      toast?.("Vehicle listing deleted permanently!");
      setSelectedProposal(null);
      loadCockpit();
    } catch (err) {
      toast?.(`Could not delete vehicle: ${err instanceof Error ? err.message : String(err)}`);
    }
  };
  const filters = [
    { id: "all", label: "All" },
    { id: "high", label: "High" },
    { id: "medium", label: "Medium" },
    { id: "first_campaign", label: "Campaigns" },
    { id: "spanish_missing", label: "Spanish" },
    { id: "creative_missing", label: "Creatives" },
  ];

  const runAction = (item) => {
    if (item.nextRoute === "campaignReview") {
      nav("campaignReview", item.targetId);
      return;
    }
    if (item.nextRoute === "vehicle") {
      nav("vehicle", item.targetId);
      return;
    }
    if (item.nextRoute === "designer") {
      nav("designer", item.targetId);
      return;
    }
    if (item.nextRoute === "builder") {
      nav("builder", item.targetId);
      return;
    }
    if (item.nextRoute === "packageBuilder") {
      nav("packageBuilder", {
        vehicleId: item.targetId,
        channelIds: item.recommendedChannelIds || [],
        source: "cockpit",
      });
      return;
    }
    toast?.("Action route is not ready yet");
  };

  return (
    <div className="page">
      <div className="page-h">
        <div>
          <h1>Marketing cockpit</h1>
          <div className="sub">Daily operator queue for {clientLabel}</div>
        </div>
        <div className="page-actions">
          <Btn icon={Icon.Refresh} onClick={loadCockpit}>Refresh</Btn>
          <Btn icon={Icon.Sparkles} variant="primary" onClick={() => nav("builder")}>New campaign</Btn>
        </div>
      </div>

      <div className="kpis">
        <CockpitKpi label="High priority" value={metrics.highPriority || 0} tone="danger"/>
        <CockpitKpi label="Vehicles" value={metrics.vehicles || 0}/>
        <CockpitKpi label="Ready" value={metrics.marketReady || 0}/>
        <CockpitKpi label="Avg score" value={metrics.readinessAverage || 0}/>
        <CockpitKpi label="Campaigns" value={metrics.campaigns || 0}/>
        <CockpitKpi label="Saved creatives" value={metrics.savedCreatives || 0}/>
      </div>

      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 16 }}>
        <div className="row" style={{ gap: 4, background: "var(--surface)", border: "1px solid var(--border)", padding: 4, borderRadius: "var(--radius-sm)" }}>
          <button className={`btn sm ${!swarmActive ? "primary" : "ghost"}`} onClick={() => setSwarmActive(false)} style={{ padding: "4px 10px", fontSize: 11.5 }}>
            📋 Task Queue Mode
          </button>
          <button className={`btn sm ${swarmActive ? "primary" : "ghost"}`} onClick={() => setSwarmActive(true)} style={{ padding: "4px 10px", fontSize: 11.5 }}>
            🐝 Collaborative Swarm Workspace
          </button>
        </div>
        <span className="muted" style={{ fontSize: 11.5 }}>
          {swarmActive ? "Select agents and lot vehicles to run multi-agent campaign sessions." : "Review prioritized auto-generated lot recommendations."}
        </span>
      </div>

      {!swarmActive && (
        <>
          <div style={{ display: "flex", gap: 4, marginBottom: 12, flexWrap: "wrap" }}>
            {filters.map(f => (
              <button key={f.id} className={`chip ${filter === f.id ? "active" : ""}`} onClick={() => setFilter(f.id)}>
                {f.label}
                <span style={{ marginLeft: 4, color: filter === f.id ? "rgba(255,255,255,0.7)" : "var(--text-2)" }}>
                  {countForFilter(items, f.id)}
                </span>
              </button>
            ))}
          </div>

          <div className="card" style={{ marginBottom: 12 }}>
            <div className="card-h">
              <div>
                <div style={{ fontWeight: 600 }}>Agent proposal queue</div>
                <div className="sub">Suggested next actions staged for operator approval</div>
              </div>
              <Pill tone={proposals.length ? "blue" : "green"} dot>{proposals.length ? `${proposals.length} proposed` : "Clear"}</Pill>
            </div>
            {proposals.length === 0 && (
              <div className="card-b muted" style={{ fontSize: 12 }}>No agent proposals waiting right now.</div>
            )}
            {proposals.length > 0 && (
              <div className="card-b col" style={{ gap: 8 }}>
                {proposals.map(item => (
                  <div key={item.id} 
                    style={{ border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "9px 10px", display: "grid", gridTemplateColumns: "1fr auto", gap: 10, background: "var(--surface)", transition: "border-color 0.2s" }}>
                    <div onClick={() => setSelectedProposal(item)} style={{ cursor: "pointer", flex: 1, minWidth: 0 }}>
                      <div className="row" style={{ gap: 6, marginBottom: 4 }}>
                        <Pill tone={priorityTone(item.priority || item.risk_level)} dot>{titleCase(item.priority || item.risk_level)}</Pill>
                        <span style={{ fontWeight: 600, fontSize: 12.5, color: "var(--text)" }}>{item.title}</span>
                      </div>
                      <div className="muted" style={{ fontSize: 11.5, lineHeight: 1.4 }}>{item.reason || item.reasoning}</div>
                      <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 4 }}>
                        <span className="muted mono" style={{ fontSize: 10.5 }}>{item.proposed_payload?.targetLabel || item.target_id}</span>
                        <span style={{ fontSize: 10.5, color: "var(--primary)", display: "flex", alignItems: "center", gap: 3, fontWeight: 500 }}>
                          <Icon.Eye size={11}/> View details
                        </span>
                      </div>
                    </div>
                    <div className="row" style={{ alignSelf: "center" }} onClick={e => e.stopPropagation()}>
                      <button className="btn sm" onClick={() => decideProposal(item, "snoozed")}>Snooze</button>
                      <button className="btn sm" onClick={() => decideProposal(item, "rejected")}>Reject</button>
                      <button className="btn sm primary" onClick={() => decideProposal(item, "approved")}>Approve</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card">
            <div className="card-h" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 600 }}>Action queue</div>
                <div className="sub">{loading ? "Scanning inventory, campaigns, and creative assets..." : `${filtered.length} item${filtered.length === 1 ? "" : "s"} shown`}</div>
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                {filtered.length > 0 && (
                  <button className="btn sm ghost" onClick={clearAllQueue} style={{ padding: "4px 8px", fontSize: 11 }}>
                    🧹 Clear Queue
                  </button>
                )}
                <Pill tone={filtered.some(item => item.priority === "high") ? "red" : "green"} dot>
                  {filtered.some(item => item.priority === "high") ? "Needs attention" : "Clear"}
                </Pill>
              </div>
            </div>

            {error && <div className="card-b" style={{ color: "var(--danger)" }}>{error}</div>}
            {!error && !loading && filtered.length === 0 && (
              <div className="card-b" style={{ textAlign: "center", color: "var(--text-2)", padding: 38 }}>
                <Icon.CheckCircle size={28} className="ico" style={{ opacity: 0.45, marginBottom: 8 }}/>
                <div>No queue items for this filter.</div>
              </div>
            )}

            {filtered.length > 0 && (
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Priority</th>
                    <th>Item</th>
                    <th>Reason</th>
                    <th>Target</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(item => (
                    <tr key={item.id} style={{ cursor: "pointer" }} onClick={() => setSelectedProposal(item)}>
                      <td><Pill tone={priorityTone(item.priority)} dot>{titleCase(item.priority)}</Pill></td>
                      <td>
                        <div style={{ fontWeight: 600 }} className="hover-link">{item.title}</div>
                        <div className="muted" style={{ fontSize: 11.5 }}>{typeLabel(item.type)}</div>
                      </td>
                      <td className="muted" style={{ maxWidth: 360 }}>{item.reason}</td>
                      <td>
                        <div className="row">
                          {item.vehicle && (
                            <div style={{ width: 42, height: 32, borderRadius: "var(--radius-sm)", overflow: "hidden", background: "var(--gray-100)", border: "1px solid var(--border)" }}>
                              <VehicleMedia v={item.vehicle}/>
                            </div>
                          )}
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 12.5 }}>{item.targetLabel}</div>
                            <div className="muted mono" style={{ fontSize: 10.5, display: "flex", gap: 6, alignItems: "center", marginTop: 2 }}>
                              <span>{item.targetVin || item.targetType}</span>
                              {item.readiness?.score != null && <span>· readiness {item.readiness.score}</span>}
                              <span style={{ color: "var(--primary)", display: "inline-flex", alignItems: "center", gap: 3, fontWeight: 500 }}>
                                <Icon.Eye size={11}/> View details
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ textAlign: "right" }} onClick={e => e.stopPropagation()}>
                        <button className="btn sm" onClick={() => runAction(item)}>
                          {item.action} <Icon.ChevronRight size={12}/>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {swarmActive && (
        <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 14, alignItems: "flex-start" }}>
          {/* Swarm Controls */}
          <div className="card">
            <div className="card-h">
              <div style={{ fontWeight: 600 }}>Swarm Setup</div>
            </div>
            <div className="card-b col" style={{ gap: 14 }}>
              <div className="field">
                <label>Target lot vehicle</label>
                <select className="input" value={selectedVehicleId} onChange={e => setSelectedVehicleId(e.target.value)} disabled={swarming}>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>{v.year} {v.make} {v.model} ({v.stock || v.stockNumber || "Stock"})</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text-2)", display: "block", marginBottom: 6 }}>Participant Agents</label>
                <div className="col" style={{ gap: 8 }}>
                  {Object.keys(swarmParticipants).map(key => (
                    <label key={key} className="checkbox" style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                      <input type="checkbox" checked={swarmParticipants[key]} disabled={swarming}
                        onChange={e => setSwarmParticipants({ ...swarmParticipants, [key]: e.target.checked })}
                        style={{ accentColor: "var(--primary)" }}/>
                      <span style={{ textTransform: "capitalize" }}>{key} Agent</span>
                    </label>
                  ))}
                </div>
              </div>

              <button className="btn primary" onClick={startSwarm} disabled={swarming || vehicles.length === 0} style={{ width: "100%" }}>
                {swarming ? "🐝 Swarm Cooperating..." : "🤖 Initiate Swarm"}
              </button>
            </div>
          </div>

          {/* Dialogue Workspace & Results */}
          <div className="col" style={{ gap: 14 }}>
            <div className="card" style={{ minHeight: 280, display: "flex", flexDirection: "column" }}>
              <div className="card-h">
                <div style={{ fontWeight: 600 }}>Live Swarm Discussion Feed</div>
                {swarming && <Pill tone="amber" dot>Swarm active</Pill>}
              </div>
              <div className="card-b col" style={{ flex: 1, gap: 12, background: "var(--bg)", maxHeight: 400, overflowY: "auto", padding: 14 }}>
                {swarmDialogue.length === 0 && !swarming && (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--text-2)", textAlign: "center", padding: 40 }}>
                    <Icon.Users size={32} className="ico" style={{ opacity: 0.45, marginBottom: 8 }}/>
                    <div style={{ fontWeight: 500 }}>Select a vehicle and click Initiate Swarm.</div>
                    <div className="sub" style={{ fontSize: 11, maxWidth: 300, marginTop: 4 }}>Agents will converse and build a multi-channel compliant strategy together.</div>
                  </div>
                )}
                {swarmDialogue.filter(Boolean).map((step, idx) => (
                  <div key={idx} style={{ display: "flex", gap: 10, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: 10 }}>
                    <div style={{ width: 34, height: 34, borderRadius: "50%", background: "var(--primary-50)", border: "1px solid var(--primary-200)", display: "grid", placeItems: "center", fontSize: 16, flexShrink: 0 }}>
                      {step.avatar}
                    </div>
                    <div>
                      <div className="row" style={{ gap: 6, marginBottom: 3 }}>
                        <span style={{ fontWeight: 600, fontSize: 12.5 }}>{step.agent}</span>
                        <Pill tone="gray" style={{ fontSize: 10 }}>{step.role}</Pill>
                      </div>
                      <div className="muted" style={{ fontSize: 12, lineHeight: 1.45 }}>{step.text}</div>
                    </div>
                  </div>
                ))}
                {swarming && (
                  <div style={{ display: "flex", gap: 6, padding: "8px 12px", alignItems: "center", color: "var(--text-2)", fontSize: 11.5 }}>
                    <span className="spinner" style={{ width: 12, height: 12 }}></span>
                    <span>Agents are compiling guidelines...</span>
                  </div>
                )}
              </div>
            </div>

            {/* Swarm Consolidated Results */}
            {swarmResult && (
              <div className="card" style={{ borderColor: "var(--primary-200)" }}>
                <div className="card-h" style={{ background: "var(--primary-50)" }}>
                  <div>
                    <div style={{ fontWeight: 600, color: "var(--primary-800)" }}>{swarmResult.title}</div>
                    <div className="sub" style={{ color: "var(--primary-700)", fontSize: 11 }}>Cooperative campaign draft structured by swarm consensus</div>
                  </div>
                  <Pill tone="green">Consensus Reached</Pill>
                </div>
                <div className="card-b col" style={{ gap: 14 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text-2)", display: "block", marginBottom: 4 }}>Bilingual SMS Copy</label>
                      <div style={{ background: "var(--bg)", border: "1px solid var(--border)", padding: 8, borderRadius: "var(--radius)", fontSize: 11.5, lineHeight: 1.4, minHeight: 60 }}>
                        {swarmResult.smsCopy}
                      </div>
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text-2)", display: "block", marginBottom: 4 }}>Email Newsletter</label>
                      <div style={{ background: "var(--bg)", border: "1px solid var(--border)", padding: 8, borderRadius: "var(--radius)", fontSize: 11.5, lineHeight: 1.4, minHeight: 60 }}>
                        <span style={{ fontWeight: 600, display: "block", fontSize: 11, borderBottom: "1px solid var(--border)", paddingBottom: 3, marginBottom: 4 }}>Subject: {swarmResult.emailSubject}</span>
                        {swarmResult.emailBody}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text-2)", display: "block", marginBottom: 4 }}>15s Spot Storyboard Script</label>
                    <div style={{ background: "var(--bg)", border: "1px solid var(--border)", padding: 8, borderRadius: "var(--radius)", fontSize: 11.5, lineHeight: 1.4 }}>
                      {swarmResult.videoScript}
                    </div>
                  </div>

                  <div style={{ borderTop: "1px solid var(--border)", paddingTop: 12, display: "flex", justifyContent: "flex-end" }}>
                    <button className="btn primary" onClick={saveSwarmCampaign} disabled={savingSwarm}>
                      {savingSwarm ? "Accepting..." : "⚡ Accept Swarm Strategy & Create Draft"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {selectedProposal && (() => {
        const isDerived = !selectedProposal.source_key;
        const vehicleData = selectedProposal.vehicle || 
                            selectedProposal.proposed_payload?.vehicle || 
                            selectedProposal.campaign?.vehicle;
        const isVehicleItem = Boolean(vehicleData);
        
        let agentEmoji = "🤖";
        let agentName = "Strategy Agent";
        
        if (isDerived) {
          const type = selectedProposal.type;
          if (type === "missing_offer") {
            agentEmoji = "📊";
            agentName = "Budget & Pricing Agent";
          } else if (type === "missing_photo") {
            agentEmoji = "🎨";
            agentName = "Creative Ad Agent";
          } else if (type === "first_campaign") {
            agentEmoji = "🤖";
            agentName = "Campaign Planner Agent";
          } else if (type === "spanish_missing") {
            agentEmoji = "✍️";
            agentName = "Bilingual Copywriter Agent";
          } else if (type === "creative_missing") {
            agentEmoji = "🎨";
            agentName = "Design Consultant Agent";
          } else if (type === "campaign_review") {
            agentEmoji = "🤖";
            agentName = "Campaign Publishing Agent";
          }
        } else {
          agentEmoji = selectedProposal.agent_type === "publishing_assistant" ? "🤖" :
                       selectedProposal.proposal_type === "spanish_missing" ? "✍️" :
                       selectedProposal.proposal_type === "missing_photo" ? "🎨" : "⚖️";
          agentName = selectedProposal.agent_type === "publishing_assistant" ? "Publishing Agent" :
                      selectedProposal.proposal_type === "spanish_missing" ? "Bilingual Copywriter Agent" :
                      selectedProposal.proposal_type === "missing_photo" ? "Creative Ad Agent" : "Compliance Agent";
        }

        return (
          <div className="modal-overlay" onClick={() => setSelectedProposal(null)}>
            <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 520, width: "95%" }}>
              <div className="modal-h">
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 20 }}>{agentEmoji}</span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{agentName}</div>
                    <div className="muted" style={{ fontSize: 11 }}>{isDerived ? "Action Queue Recommendation" : "Agent Proposal Workspace"}</div>
                  </div>
                </div>
                <button className="btn ghost sm" onClick={() => setSelectedProposal(null)} style={{ padding: 4 }}>
                  <Icon.X size={16}/>
                </button>
              </div>
              
              <div className="modal-b col" style={{ gap: 16 }}>
                <div>
                  <div style={{ display: "flex", gap: 6, marginBottom: 6, alignItems: "center" }}>
                    <Pill tone={priorityTone(selectedProposal.priority || selectedProposal.risk_level)} dot>
                      {titleCase(selectedProposal.priority || selectedProposal.risk_level)} Priority
                    </Pill>
                    <span style={{ color: "var(--text-2)", fontSize: 12 }}>·</span>
                    <span className="mono muted" style={{ fontSize: 11 }}>{selectedProposal.proposed_payload?.targetLabel || selectedProposal.target_id || selectedProposal.targetLabel}</span>
                  </div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{selectedProposal.title}</h3>
                </div>

                <div className="col" style={{ gap: 6 }}>
                  <div style={{ fontSize: 11.5, fontWeight: 600, color: "var(--text-2)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    {isDerived ? "Strategic Context" : "Agent Justification"}
                  </div>
                  <div style={{ background: "var(--gray-50)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "10px 12px", fontSize: 12.5, lineHeight: 1.5, color: "var(--text)" }}>
                    {selectedProposal.reasoning || selectedProposal.reason}
                  </div>
                </div>

                <div className="col" style={{ gap: 6 }}>
                  <div style={{ fontSize: 11.5, fontWeight: 600, color: "var(--text-2)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Parameters & Specifications
                  </div>
                  <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "12px", fontSize: 12.5 }}>
                    {selectedProposal.type === "missing_offer" ? (
                      <div className="col" style={{ gap: 10 }}>
                        <div style={{ fontWeight: 600, fontSize: 12.5, borderBottom: "1px solid var(--border)", paddingBottom: 6, marginBottom: 4, color: "var(--primary)", display: "flex", alignItems: "center", gap: 5 }}>
                          💰 Configure Dealership Offer Specifications
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                          <div className="field">
                            <label style={{ fontSize: 11, fontWeight: 500 }}>Approved Down Payment ($)</label>
                            <input 
                              type="number" 
                              className="input" 
                              value={approvedDown} 
                              onChange={e => setApprovedDown(e.target.value)} 
                              placeholder="e.g. 1000"
                              style={{ padding: "5px 8px", fontSize: 12 }}
                            />
                          </div>
                          <div className="field">
                            <label style={{ fontSize: 11, fontWeight: 500 }}>Weekly Payment Fallback ($)</label>
                            <input 
                              type="number" 
                              className="input" 
                              value={approvedWeekly} 
                              onChange={e => setApprovedWeekly(e.target.value)} 
                              placeholder="e.g. 99 (optional)"
                              style={{ padding: "5px 8px", fontSize: 12 }}
                            />
                          </div>
                        </div>
                        <div className="field">
                          <label style={{ fontSize: 11, fontWeight: 500 }}>Listing Lot Price ($)</label>
                          <input 
                            type="number" 
                            className="input" 
                            value={approvedPrice} 
                            onChange={e => setApprovedPrice(e.target.value)} 
                            placeholder="e.g. 14995"
                            style={{ padding: "5px 8px", fontSize: 12 }}
                          />
                        </div>
                        <div style={{ fontSize: 11, color: "var(--text-2)", background: "var(--gray-50)", padding: "8px 10px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", marginTop: 4, lineHeight: 1.45 }}>
                          ℹ️ Inputting an approved down payment unlocks compliance-approved down payment messaging on visual & text campaigns for this vehicle.
                        </div>
                      </div>
                    ) : selectedProposal.proposal_type === "campaign_review" || selectedProposal.type === "campaign_review" ? (
                      loadingChannels ? (
                        <div style={{ textAlign: "center", padding: "16px 0", color: "var(--text-2)" }}>
                          <Icon.Refresh className="ico animate-spin" size={16} style={{ marginRight: 6 }}/> Loading generated copywriting channels...
                        </div>
                      ) : campaignChannels.length > 0 ? (
                        <div className="col" style={{ gap: 12 }}>
                          <div style={{ fontWeight: 600, fontSize: 12.5, borderBottom: "1px solid var(--border)", paddingBottom: 6, color: "var(--primary)", display: "flex", alignItems: "center", gap: 5 }}>
                            ✍️ Review & Approve Generated Channel Copy
                          </div>
                          {campaignChannels.map((ch, idx) => (
                            <div key={ch.id} style={{ border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: 10, background: "var(--gray-50)", display: "flex", flexDirection: "column", gap: 8 }}>
                              <div className="row" style={{ justifyContent: "space-between" }}>
                                <span style={{ fontWeight: 700, fontSize: 11.5, textTransform: "capitalize", color: "var(--text)" }}>
                                  {ch.channel.replace(/_/g, " ")} Channel
                                </span>
                                <Pill tone={ch.status === "approved" ? "green" : "blue"} sm>
                                  {ch.status === "approved" ? "Approved" : "Draft"}
                                </Pill>
                              </div>
                              <div className="col" style={{ gap: 6 }}>
                                {ch.headline !== undefined && ch.headline !== null && (
                                  <div className="field">
                                    <label style={{ fontSize: 10, fontWeight: 500, color: "var(--text-2)" }}>Headline / Title</label>
                                    <input 
                                      type="text" 
                                      className="input" 
                                      value={ch.headline || ""} 
                                      onChange={e => {
                                        const updated = [...campaignChannels];
                                        updated[idx] = { ...updated[idx], headline: e.target.value };
                                        setCampaignChannels(updated);
                                      }}
                                      style={{ padding: "4px 8px", fontSize: 11.5 }}
                                    />
                                  </div>
                                )}
                                {ch.primary_text !== undefined && ch.primary_text !== null && (
                                  <div className="field">
                                    <label style={{ fontSize: 10, fontWeight: 500, color: "var(--text-2)" }}>Primary Text / Body Copy</label>
                                    <textarea 
                                      className="input" 
                                      value={ch.primary_text || ""} 
                                      onChange={e => {
                                        const updated = [...campaignChannels];
                                        updated[idx] = { ...updated[idx], primary_text: e.target.value };
                                        setCampaignChannels(updated);
                                      }}
                                      style={{ padding: "5px 8px", fontSize: 11.5, minHeight: 60 }}
                                    />
                                  </div>
                                )}
                                {ch.call_to_action !== undefined && ch.call_to_action !== null && (
                                  <div className="field">
                                    <label style={{ fontSize: 10, fontWeight: 500, color: "var(--text-2)" }}>Call To Action (CTA)</label>
                                    <input 
                                      type="text" 
                                      className="input" 
                                      value={ch.call_to_action || ""} 
                                      onChange={e => {
                                        const updated = [...campaignChannels];
                                        updated[idx] = { ...updated[idx], call_to_action: e.target.value };
                                        setCampaignChannels(updated);
                                      }}
                                      style={{ padding: "4px 8px", fontSize: 11.5 }}
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{ textAlign: "center", padding: 12, color: "var(--text-2)" }}>
                          No generated channel copy found for this campaign.
                        </div>
                      )
                    ) : (
                      <div className="col" style={{ gap: 8 }}>
                        <div className="row" style={{ justifyContent: "space-between" }}>
                          <span className="muted">Target Lot Vehicle:</span>
                          <span style={{ fontWeight: 600 }}>{selectedProposal.proposed_payload?.targetLabel || selectedProposal.targetLabel}</span>
                        </div>
                        {vehicleData && (
                          <>
                            {vehicleData.vin && (
                              <div className="row" style={{ justifyContent: "space-between" }}>
                                <span className="muted">VIN Number:</span>
                                <span className="mono" style={{ fontWeight: 600 }}>{vehicleData.vin}</span>
                              </div>
                            )}
                            {vehicleData.stock && (
                              <div className="row" style={{ justifyContent: "space-between" }}>
                                <span className="muted">Stock ID:</span>
                                <span className="mono" style={{ fontWeight: 600 }}>{vehicleData.stock}</span>
                              </div>
                            )}
                            {vehicleData.price != null && vehicleData.price > 0 && (
                              <div className="row" style={{ justifyContent: "space-between" }}>
                                <span className="muted">Price & Down:</span>
                                <span style={{ fontWeight: 600 }}>
                                  ${Number(vehicleData.price).toLocaleString()} 
                                  {vehicleData.down || vehicleData.down_payment ? ` ($${Number(vehicleData.down || vehicleData.down_payment).toLocaleString()} down)` : ""}
                                </span>
                              </div>
                            )}
                            {vehicleData.mileage != null && vehicleData.mileage > 0 && (
                              <div className="row" style={{ justifyContent: "space-between" }}>
                                <span className="muted">Odometer:</span>
                                <span style={{ fontWeight: 600 }}>{Number(vehicleData.mileage).toLocaleString()} mi</span>
                              </div>
                            )}
                          </>
                        )}
                        {(selectedProposal.recommendedChannelIds || selectedProposal.proposed_payload?.recommendedChannelIds) && (
                          <div className="col" style={{ gap: 4 }}>
                            <span className="muted">Recommended Channels:</span>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 2 }}>
                              {(selectedProposal.recommendedChannelIds || selectedProposal.proposed_payload?.recommendedChannelIds || []).map(chId => (
                                <Pill key={chId}>{titleCase(chId)}</Pill>
                              ))}
                            </div>
                          </div>
                        )}
                        {selectedProposal.readiness && (
                          <div className="row" style={{ justifyContent: "space-between" }}>
                            <span className="muted">Vehicle Lot Readiness:</span>
                            <span style={{ fontWeight: 600, color: selectedProposal.readiness.score >= 85 ? "var(--success)" : "var(--warning)" }}>
                              {selectedProposal.readiness.score}/100
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

               <div className="modal-f" style={{ display: "flex", justifyContent: "flex-end", gap: 8, flexWrap: "wrap" }}>
                {isVehicleItem && vehicleData?.id && (
                  <div style={{ marginRight: "auto", display: "flex", gap: 6 }}>
                    <button className="btn sm ghost" onClick={() => archiveVehicle(vehicleData.id)} style={{ color: "var(--warning-700)", borderColor: "var(--warning-200)", background: "var(--warning-50)" }}>
                      🗄️ Archive Vehicle
                    </button>
                    <button className="btn sm ghost" onClick={() => deleteVehicle(vehicleData.id)} style={{ color: "var(--danger)", borderColor: "#FECACA", background: "#FEF2F2" }}>
                      🗑️ Delete Vehicle
                    </button>
                  </div>
                )}
                {selectedProposal.type === "missing_offer" ? (
                  <>
                    <button className="btn" onClick={() => setSelectedProposal(null)}>Cancel</button>
                    <button className="btn primary" onClick={saveApprovedDownPayment} disabled={savingOffer}>
                      {savingOffer ? "Saving..." : "⚡ Save & Approve Down Payment"}
                    </button>
                  </>
                ) : (selectedProposal.type === "campaign_review" || selectedProposal.proposal_type === "campaign_review") ? (
                  <>
                    <button className="btn ghost" onClick={() => handleModalAction("rejected")} style={{ color: "var(--danger)" }}>Reject Draft</button>
                    <button className="btn" onClick={() => handleModalAction("snoozed")}>Snooze Review</button>
                    <button className="btn primary" onClick={saveApprovedCampaignCopy} disabled={savingOffer}>
                      {savingOffer ? "Approving Copy..." : "⚡ Approve Copy & Save"}
                    </button>
                  </>
                ) : isDerived ? (
                  <>
                    <button className="btn" onClick={() => handleModalAction("dismissed")}>Dismiss suggestion</button>
                    <button className="btn primary" onClick={() => { runAction(selectedProposal); setSelectedProposal(null); }}>
                      ⚡ Execute Action
                    </button>
                  </>
                ) : (
                  <>
                    <button className="btn" onClick={() => handleModalAction("snoozed")}>Snooze</button>
                    <button className="btn ghost" onClick={() => handleModalAction("rejected")} style={{ color: "var(--danger)" }}>Reject</button>
                    <button className="btn primary" onClick={() => handleModalAction("approved")}>⚡ Approve & Execute</button>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

function CockpitKpi({ label, value, tone }) {
  return (
    <div className="kpi">
      <div className="label">{label}</div>
      <div className="value" style={tone === "danger" ? { color: "var(--danger)" } : undefined}>{value}</div>
    </div>
  );
}

function countForFilter(items, id) {
  if (id === "all") return items.length;
  return items.filter(item => item.priority === id || item.type === id).length;
}

function priorityTone(priority) {
  if (priority === "high") return "red";
  if (priority === "medium") return "amber";
  return "gray";
}

function titleCase(value) {
  return String(value || "").replace(/_/g, " ").replace(/\b\w/g, letter => letter.toUpperCase());
}

function nextDayIso() {
  const next = new Date();
  next.setDate(next.getDate() + 1);
  return next.toISOString();
}

function typeLabel(value) {
  const labels = {
    missing_offer: "Offer setup",
    missing_photo: "Photo readiness",
    first_campaign: "Campaign coverage",
    spanish_missing: "Spanish coverage",
    creative_missing: "Creative coverage",
    campaign_review: "Campaign review",
  };
  return labels[value] || titleCase(value);
}

export { AgencyCockpit };
