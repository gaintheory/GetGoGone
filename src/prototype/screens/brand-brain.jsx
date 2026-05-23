import React from 'react';
import { Icon } from '../icons';
import { UI } from '../ui';

function BrandBrain({ clientId, activeClient, toast }) {
  const { Btn, Pill } = UI;
  const [brain, setBrain] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [approvedText, setApprovedText] = React.useState("");
  const [bannedText, setBannedText] = React.useState("");
  const clientLabel = activeClient?.name || "Active client";

  React.useEffect(() => {
    let cancelled = false;
    const params = clientId && clientId !== "agency_overview" ? `?clientId=${encodeURIComponent(clientId)}` : "";
    setLoading(true);
    fetch(`/api/agency/brand-brain${params}`)
      .then(res => res.json())
      .then(payload => {
        if (cancelled) return;
        if (!payload.ok) throw new Error(payload.error || "Could not load Brand Brain");
        setBrain(payload.brain);
        setApprovedText((payload.brain.approvedPhrases || []).join("\n"));
        setBannedText((payload.brain.bannedPhrases || []).join("\n"));
      })
      .catch(error => toast?.(error.message || "Could not load Brand Brain"))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [clientId, toast]);

  const update = (patch) => setBrain(current => ({ ...(current || {}), ...patch }));

  const save = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/agency/brand-brain", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...brain,
          clientId: clientId && clientId !== "agency_overview" ? clientId : undefined,
          approvedPhrases: lines(approvedText),
          bannedPhrases: lines(bannedText),
        }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok) throw new Error(payload.error || "Could not save Brand Brain");
      setBrain(payload.brain);
      setApprovedText((payload.brain.approvedPhrases || []).join("\n"));
      setBannedText((payload.brain.bannedPhrases || []).join("\n"));
      toast?.("Brand Brain saved");
    } catch (error) {
      toast?.(error.message || "Could not save Brand Brain");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !brain) {
    return (
      <div className="page">
        <div className="card"><div className="card-b">Loading Brand Brain...</div></div>
      </div>
    );
  }

  return (
    <div className="page" style={{ maxWidth: 1180 }}>
      <div className="page-h">
        <div>
          <h1>Brand Brain</h1>
          <div className="sub">Voice, Spanish guidance, offers, and compliance rules for {clientLabel}</div>
        </div>
        <div className="page-actions">
          <Pill tone="blue" dot>{clientLabel}</Pill>
          <Btn icon={Icon.CheckCircle} variant="primary" onClick={save}>{saving ? "Saving..." : "Save brain"}</Btn>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 14 }}>
        <div>
          <BrainCard title="Voice and tone" sub="These rules feed AI copy, campaign packages, Spanish variants, and creative text.">
            <div className="field" style={{ marginBottom: 10 }}>
              <label>English tone</label>
              <textarea className="input" rows={3} value={brain.toneEnglish || ""} onChange={e => update({ toneEnglish: e.target.value })}/>
            </div>
            <div className="field">
              <label>Spanish tone</label>
              <textarea className="input" rows={3} value={brain.toneSpanish || ""} onChange={e => update({ toneSpanish: e.target.value })}/>
            </div>
          </BrainCard>

          <BrainCard title="Offer and finance guardrails" sub="Prevents accidental claims like $0 down, guaranteed approval, or unsupported payment terms.">
            <div className="field" style={{ marginBottom: 10 }}>
              <label>Down payment rules</label>
              <textarea className="input" rows={4} value={brain.downPaymentRules || ""} onChange={e => update({ downPaymentRules: e.target.value })}/>
            </div>
            <div className="field">
              <label>Finance disclaimer</label>
              <textarea className="input" rows={3} value={brain.financeDisclaimer || ""} onChange={e => update({ financeDisclaimer: e.target.value })}/>
            </div>
          </BrainCard>

          <BrainCard title="Spanish guidance" sub="Use this to make Spanish messages sound local and natural, not machine-translated.">
            <div className="field">
              <label>Spanish adaptation notes</label>
              <textarea className="input" rows={4} value={brain.spanishGuidance || ""} onChange={e => update({ spanishGuidance: e.target.value })}/>
            </div>
          </BrainCard>

          <BrainCard title="Audience and objections" sub="These notes help the AI write more like a salesperson who knows the buyer.">
            <div className="field" style={{ marginBottom: 10 }}>
              <label>Target audience notes</label>
              <textarea className="input" rows={4} value={brain.targetAudienceNotes || ""} onChange={e => update({ targetAudienceNotes: e.target.value })} placeholder="Example: credit-challenged buyers, Spanish-speaking families, work truck buyers, repeat BHPH customers..."/>
            </div>
            <div className="field">
              <label>Objection handling notes</label>
              <textarea className="input" rows={4} value={brain.objectionHandlingNotes || ""} onChange={e => update({ objectionHandlingNotes: e.target.value })} placeholder="Example: down payment concerns, proof of income, needs reliable work transportation..."/>
            </div>
          </BrainCard>
        </div>

        <aside>
          <BrainCard title="Approved phrases" sub="One phrase per line.">
            <textarea className="input" rows={9} value={approvedText} onChange={e => setApprovedText(e.target.value)} placeholder="Low down payment options&#10;Hablamos Espanol&#10;Apply online"/>
          </BrainCard>

          <BrainCard title="Banned phrases" sub="The AI and future compliance checker should block these.">
            <textarea className="input" rows={9} value={bannedText} onChange={e => setBannedText(e.target.value)}/>
          </BrainCard>

          <BrainCard title="Generation context" sub="How this profile will be used.">
            <div className="col" style={{ gap: 8 }}>
              {[
                "Campaign Builder copy",
                "Spanish adaptations",
                "Designer text layers",
                "SMS and email templates",
                "Video scripts and captions",
                "Compliance review",
              ].map(item => (
                <div key={item} className="row" style={{ gap: 8 }}>
                  <Icon.CheckCircle size={13} style={{ color: "var(--success)" }}/>
                  <span style={{ fontSize: 12.5 }}>{item}</span>
                </div>
              ))}
            </div>
          </BrainCard>
        </aside>
      </div>
    </div>
  );
}

function BrainCard({ title, sub, children }) {
  return (
    <div className="card" style={{ marginBottom: 14 }}>
      <div className="card-h">
        <div>
          <h3>{title}</h3>
          {sub && <div className="sub">{sub}</div>}
        </div>
      </div>
      <div className="card-b">{children}</div>
    </div>
  );
}

function lines(value) {
  return String(value || "")
    .split("\n")
    .map(item => item.trim())
    .filter(Boolean);
}

export { BrandBrain };
