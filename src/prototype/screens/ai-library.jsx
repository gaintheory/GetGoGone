import React from 'react';
import { Icon } from '../icons';
import { UI } from '../ui';
import { channelModules } from '../../features/campaigns/channel-modules';

function AiLibrary({ clientId, activeClient, toast, initialStatus }) {
  const { Pill, Btn } = UI;
  const [outputs, setOutputs] = React.useState([]);
  const [selectedId, setSelectedId] = React.useState(null);
  const [status, setStatus] = React.useState("all");
  const [taskType, setTaskType] = React.useState("all");
  const [channel, setChannel] = React.useState("all");
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  const selected = outputs.find(item => item.id === selectedId) || outputs[0] || null;

  React.useEffect(() => {
    if (initialStatus) setStatus(initialStatus);
  }, [initialStatus]);

  const loadOutputs = React.useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (clientId && clientId !== "agency_overview") params.set("clientId", clientId);
    if (status !== "all") params.set("status", status);
    if (taskType !== "all") params.set("taskType", taskType);
    if (channel !== "all") params.set("channel", channel);

    fetch(`/api/ai/generated-outputs?${params.toString()}`)
      .then(res => res.json())
      .then(payload => {
        if (payload?.ok) {
          setOutputs(payload.outputs || []);
          setSelectedId(current => current || payload.outputs?.[0]?.id || null);
          setError(null);
        } else {
          setError(payload?.error || "Could not load AI outputs");
        }
      })
      .catch(() => setError("Could not load AI outputs"))
      .finally(() => setLoading(false));
  }, [channel, clientId, status, taskType]);

  React.useEffect(() => {
    loadOutputs();
  }, [loadOutputs]);

  const updateStatus = async (id, nextStatus) => {
    try {
      const response = await fetch("/api/ai/generated-outputs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: nextStatus }),
      });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.error || "Output could not be updated");
      setOutputs(current => current.map(item => item.id === id ? { ...item, status: result.output.status, updated_at: result.output.updated_at } : item));
      toast(`Marked ${nextStatus}`);
    } catch (updateError) {
      toast(updateError instanceof Error ? updateError.message : "Output could not be updated");
    }
  };

  const updateOutput = async (id, nextOutput, nextStatus = "reviewed") => {
    try {
      const existing = outputs.find(item => item.id === id);
      const response = await fetch("/api/ai/generated-outputs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          status: nextStatus,
          output: {
            ...(existing?.output || {}),
            ...nextOutput,
            edited_at: new Date().toISOString(),
          },
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.error || "Output could not be saved");
      setOutputs(current => current.map(item => item.id === id ? {
        ...item,
        output: result.output.output,
        status: result.output.status,
        updated_at: result.output.updated_at,
      } : item));
      toast("AI output saved for review");
      return true;
    } catch (saveError) {
      toast(saveError instanceof Error ? saveError.message : "Output could not be saved");
      return false;
    }
  };

  const runComplianceCheck = async (id, draft) => {
    const existing = outputs.find(item => item.id === id);
    try {
      const response = await fetch("/api/ai/compliance-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: clientId && clientId !== "agency_overview" ? clientId : undefined,
          outputId: id,
          headline: draft.headline,
          body: draft.body,
          language: existing?.language,
          channel: {
            id: existing?.target_id,
            name: channelLabel(existing?.target_id),
            complianceNotes: existing?.prompt_context?.channel?.complianceNotes || [],
          },
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.error || "Compliance check failed");

      const saved = await updateOutput(id, {
        ...(existing?.output || {}),
        headline: draft.headline,
        body: draft.body,
        compliance_review: result.review,
      }, result.review.verdict === "pass" ? "reviewed" : "draft");

      if (saved) {
        toast(result.review.verdict === "pass" ? "Compliance check passed" : "Compliance needs review");
      }
      return result.review;
    } catch (checkError) {
      toast(checkError instanceof Error ? checkError.message : "Compliance check failed");
      return null;
    }
  };

  const copySelected = () => {
    if (!selected) return;
    navigator.clipboard?.writeText(outputText(selected)).then(
      () => toast("AI output copied"),
      () => toast("Copy failed"),
    );
  };

  return (
    <div className="page">
      <div className="page-h">
        <div>
          <h1>AI Library</h1>
          <div className="sub">Saved generated output for {activeClient?.name || "the active client"}</div>
        </div>
        <div className="page-actions">
          <Btn icon={Icon.Refresh} onClick={loadOutputs}>{loading ? "Loading..." : "Refresh"}</Btn>
          <Btn icon={Icon.Copy} variant="primary" onClick={copySelected} disabled={!selected}>Copy selected</Btn>
        </div>
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
        <FilterSelect label="Status" value={status} onChange={setStatus} options={[
          ["all", "All statuses"],
          ["draft", "Draft"],
          ["reviewed", "Reviewed"],
          ["approved", "Approved"],
          ["hitl_required", "HITL"],
          ["rejected", "Rejected"],
          ["archived", "Archived"],
        ]}/>
        <FilterSelect label="Task" value={taskType} onChange={setTaskType} options={[
          ["all", "All tasks"],
          ["campaign_copy", "Campaign copy"],
          ["designer_text", "Designer text"],
          ["video_script", "Video script"],
        ]}/>
        <FilterSelect label="Channel" value={channel} onChange={setChannel} options={[
          ["all", "All channels"],
          ...channelModules.map(module => [module.id, module.name]),
        ]}/>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(320px, 0.8fr) minmax(360px, 1.2fr)", gap: 14, alignItems: "start" }}>
        <div className="card">
          <div className="card-h">
            <div style={{ fontWeight: 600 }}>Generated outputs</div>
            <Pill tone="blue">{outputs.length}</Pill>
          </div>
          {error && <div className="card-b" style={{ color: "var(--danger)" }}>{error}</div>}
          {!error && !loading && outputs.length === 0 && (
            <div className="card-b" style={{ textAlign: "center", color: "var(--text-2)", padding: 38 }}>
              <Icon.Sparkles size={28} className="ico" style={{ opacity: 0.45, marginBottom: 8 }}/>
              <div>No generated outputs match these filters yet.</div>
            </div>
          )}
          <div style={{ maxHeight: "calc(100vh - 250px)", overflow: "auto" }}>
            {outputs.map(item => (
              <button
                key={item.id}
                onClick={() => setSelectedId(item.id)}
                style={{
                  width: "100%",
                  border: 0,
                  borderTop: "1px solid var(--border)",
                  background: selected?.id === item.id ? "var(--primary-50)" : "var(--surface)",
                  padding: "10px 12px",
                  textAlign: "left",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
                  <div style={{ fontWeight: 600, fontSize: 12.5 }}>{outputTitle(item)}</div>
                  <Pill tone={statusTone(item.status)} dot>{titleCase(item.status)}</Pill>
                </div>
                <div className="muted" style={{ fontSize: 11, marginTop: 3 }}>{vehicleLabel(item)} · {channelLabel(item.target_id)}</div>
                <div className="muted mono" style={{ fontSize: 10.5, marginTop: 6 }}>{item.provider} / {item.model} · {formatDate(item.created_at)}</div>
              </button>
            ))}
          </div>
        </div>

        <OutputDetail
          output={selected}
          onCopy={copySelected}
          onSave={updateOutput}
          onComplianceCheck={runComplianceCheck}
          onApprove={() => selected && updateStatus(selected.id, "approved")}
          onReject={async (reason) => {
            if (!selected) return false;
            const saved = await updateOutput(selected.id, {
              ...(selected.output || {}),
              rejection_reason: reason,
              rejected_at: new Date().toISOString(),
              review_decision: {
                status: "rejected",
                reason,
                decided_at: new Date().toISOString(),
              },
            }, "rejected");
            if (saved) await logOutputEvent(selected.id, "rejected", reason);
            return saved;
          }}
          onSendBack={async (draft, reason) => {
            if (!selected) return null;
            const response = await fetch("/api/ai/rewrite-copy", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                headline: draft.headline,
                body: draft.body,
                language: selected.language,
                channel: {
                  id: selected.target_id,
                  name: channelLabel(selected.target_id),
                  complianceNotes: selected.prompt_context?.channel?.complianceNotes || [],
                },
                issues: [
                  ...(selected.output?.compliance_review?.issues || []),
                  reason ? { severity: "note", message: "Operator rewrite feedback", suggestion: reason } : null,
                ].filter(Boolean),
              }),
            });
            const result = await response.json();
            if (!response.ok || !result.ok) throw new Error(result.error || "Rewrite failed");

            const review = await runComplianceCheckOnly({
              clientId,
              outputId: selected.id,
              headline: result.copy.headline,
              body: result.copy.body,
              language: selected.language,
              channelId: selected.target_id,
              complianceNotes: selected.prompt_context?.channel?.complianceNotes || [],
            });
            if (!review) throw new Error("Rewrite completed, but compliance check failed");

            const nextHistory = [
              ...(selected.output?.rewrite_history || []),
              {
                attempt: (selected.output?.rewrite_history || []).length,
                headline: result.copy.headline,
                body: result.copy.body,
                provider: result.provider,
                model: result.model,
                verdict: review.verdict,
                issues: review.issues || [],
                checked_at: review.checked_at || new Date().toISOString(),
                operator_feedback: reason || null,
              },
            ];
            const nextStatus = review.verdict === "pass" ? "reviewed" : "hitl_required";
            const saved = await updateOutput(selected.id, {
              ...(selected.output || {}),
              headline: result.copy.headline,
              body: result.copy.body,
              compliance_review: review,
              rewrite_attempts: nextHistory.length,
              rewrite_history: nextHistory,
              sent_back_at: new Date().toISOString(),
              last_operator_feedback: reason || null,
            }, nextStatus);
            if (saved) await logOutputEvent(selected.id, "sent_back_to_rewrite", reason, {
              provider: result.provider,
              model: result.model,
              verdict: review.verdict,
            });
            return { copy: result.copy, review };
          }}
          onArchive={() => selected && updateStatus(selected.id, "archived")}
        />
      </div>
    </div>
  );
}

async function runComplianceCheckOnly({ clientId, outputId, headline, body, language, channelId, complianceNotes }) {
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
        id: channelId,
        name: channelLabel(channelId),
        complianceNotes,
      },
    }),
  });
  const result = await response.json();
  return response.ok && result.ok ? result.review : null;
}

async function logOutputEvent(outputId, eventType, note, metadata = {}) {
  try {
    await fetch("/api/ai/generated-output-events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ outputId, eventType, note, metadata }),
    });
  } catch {
    // Audit logging should not block the operator review flow in the prototype.
  }
}

function OutputDetail({ output, onCopy, onSave, onComplianceCheck, onApprove, onReject, onSendBack, onArchive }) {
  const { Pill, Btn } = UI;
  const [headline, setHeadline] = React.useState("");
  const [body, setBody] = React.useState("");
  const [reviewNote, setReviewNote] = React.useState("");
  const [reviewPanel, setReviewPanel] = React.useState(null);
  const [saving, setSaving] = React.useState(false);
  const [checking, setChecking] = React.useState(false);
  const [deciding, setDeciding] = React.useState(false);

  React.useEffect(() => {
    setHeadline(output?.output?.headline || "");
    setBody(output?.output?.body || output?.output?.raw || "");
    setReviewNote("");
    setReviewPanel(null);
  }, [output]);

  if (!output) {
    return (
      <div className="card">
        <div className="card-b" style={{ textAlign: "center", color: "var(--text-2)", padding: 46 }}>
          Select an output to review.
        </div>
      </div>
    );
  }

  const promptContext = output.prompt_context || {};
  const risks = complianceRisks(`${headline}\n${body}`);
  const complianceReview = output.output?.compliance_review || null;
  const attemptHistory = output.output?.rewrite_history || [];
  const highlights = collectComplianceHighlights(headline, body, complianceReview);
  const dirty = headline !== (output.output?.headline || "") || body !== (output.output?.body || output.output?.raw || "");

  const saveReview = async () => {
    setSaving(true);
    const saved = await onSave(output.id, { headline, body });
    setSaving(false);
    return saved;
  };

  const approveReview = async () => {
    if (dirty) {
      const saved = await saveReview();
      if (!saved) return;
    }
    if (!complianceReview || complianceReview.verdict !== "pass") {
      const review = await runCheck();
      if (!review || review.verdict !== "pass") return;
    }
    onApprove();
  };

  const runCheck = async () => {
    setChecking(true);
    const review = await onComplianceCheck(output.id, { headline, body });
    setChecking(false);
    return review;
  };

  const rejectReview = async () => {
    if (!reviewNote.trim()) return;
    setDeciding(true);
    const saved = await onReject(reviewNote.trim());
    setDeciding(false);
    if (saved) setReviewPanel(null);
  };

  const sendBack = async () => {
    setDeciding(true);
    try {
      const result = await onSendBack({ headline, body }, reviewNote.trim());
      if (result?.copy) {
        setHeadline(result.copy.headline || headline);
        setBody(result.copy.body || body);
        setReviewPanel(null);
      }
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Rewrite failed");
    } finally {
      setDeciding(false);
    }
  };

  return (
    <div className="card">
      <div className="card-h">
        <div className="row">
          <Icon.Sparkles size={15}/>
          <div>
            <div style={{ fontWeight: 600 }}>{outputTitle(output)}</div>
            <div className="muted" style={{ fontSize: 11.5 }}>{vehicleLabel(output)} · {channelLabel(output.target_id)}</div>
          </div>
        </div>
        <div className="row">
          <Pill tone={statusTone(output.status)} dot>{titleCase(output.status)}</Pill>
          <Btn size="sm" icon={Icon.Copy} onClick={onCopy}>Copy</Btn>
          <Btn size="sm" icon={Icon.AlertTriangle} onClick={runCheck} disabled={checking}>{checking ? "Checking..." : "Check"}</Btn>
          <Btn size="sm" icon={Icon.CheckCircle} onClick={saveReview} disabled={!dirty || saving}>{saving ? "Saving..." : "Save edits"}</Btn>
          <Btn size="sm" icon={Icon.Refresh} onClick={() => setReviewPanel(reviewPanel === "rewrite" ? null : "rewrite")}>Send back</Btn>
          <Btn size="sm" variant="primary" icon={Icon.CheckCircle} onClick={approveReview}>Approve</Btn>
          <Btn size="sm" icon={Icon.X} onClick={() => setReviewPanel(reviewPanel === "reject" ? null : "reject")}>Reject</Btn>
          <Btn size="sm" icon={Icon.Trash} onClick={onArchive}>Archive</Btn>
        </div>
      </div>
      <div className="card-b" style={{ display: "grid", gridTemplateColumns: "1fr 0.7fr", gap: 14 }}>
        <div className="col" style={{ gap: 10 }}>
          {reviewPanel && (
            <div style={{ border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: 10, background: reviewPanel === "reject" ? "rgba(220, 38, 38, 0.06)" : "var(--gray-50)" }}>
              <div style={{ fontWeight: 600, fontSize: 12.5, marginBottom: 6 }}>{reviewPanel === "reject" ? "Reject output" : "Send back to rewrite"}</div>
              <textarea
                className="input"
                value={reviewNote}
                onChange={event => setReviewNote(event.target.value)}
                rows={3}
                placeholder={reviewPanel === "reject" ? "Why is this not usable?" : "What should the rewrite fix?"}
              />
              <div className="row" style={{ justifyContent: "flex-end", marginTop: 8 }}>
                <Btn size="sm" onClick={() => setReviewPanel(null)}>Cancel</Btn>
                {reviewPanel === "reject" ? (
                  <Btn size="sm" variant="primary" icon={Icon.X} onClick={rejectReview} disabled={!reviewNote.trim() || deciding}>{deciding ? "Rejecting..." : "Reject"}</Btn>
                ) : (
                  <Btn size="sm" variant="primary" icon={Icon.Refresh} onClick={sendBack} disabled={deciding}>{deciding ? "Rewriting..." : "Rewrite"}</Btn>
                )}
              </div>
            </div>
          )}
          <div className="field">
            <label>Headline</label>
            <input className="input" value={headline} onChange={event => setHeadline(event.target.value)}/>
          </div>
          <div className="field">
            <label>Body</label>
            <textarea className="input" value={body} onChange={event => setBody(event.target.value)} rows={12}/>
          </div>
          <FlaggedCopyPreview headline={headline} body={body} highlights={highlights}/>
          <CompliancePanel risks={risks} review={complianceReview}/>
          {attemptHistory.length > 0 && <AttemptHistory attempts={attemptHistory}/>}
        </div>
        <div className="col" style={{ gap: 10 }}>
          <ReviewMini title="Provider">{output.provider} / {output.model}</ReviewMini>
          <ReviewMini title="Language">{languageLabel(output.language)}</ReviewMini>
          <ReviewMini title="Task">{titleCase(output.task_type)}</ReviewMini>
          <ReviewMini title="Created">{formatDate(output.created_at)}</ReviewMini>
          <ReviewMini title="Campaign">{output.campaign?.name || "Not attached"}</ReviewMini>
          <ReviewMini title="Goal">{titleCase(promptContext.goal || "Not set")}</ReviewMini>
          <ReviewMini title="Guardrail">{promptContext.warning || (promptContext.offline ? "Fallback output" : "Brand Brain rules applied")}</ReviewMini>
          <ReviewMini title="Compliance">{complianceReview ? `${titleCase(complianceReview.verdict)} · ${complianceReview.provider} / ${complianceReview.model}` : "Not checked"}</ReviewMini>
          <ReviewMini title="Rewrite loop">{attemptHistory.length ? `${attemptHistory.length} attempt${attemptHistory.length === 1 ? "" : "s"} saved` : "No repair history"}</ReviewMini>
          <ReviewMini title="Rejection">{output.output?.rejection_reason || "No rejection recorded"}</ReviewMini>
          <ReviewMini title="Edited">{output.output?.edited_at ? formatDate(output.output.edited_at) : "Original output"}</ReviewMini>
          <EventTimeline events={output.events || []}/>
        </div>
      </div>
    </div>
  );
}

function FlaggedCopyPreview({ headline, body, highlights }) {
  const headlineHighlights = highlights.filter(item => item.source === "headline");
  const bodyHighlights = highlights.filter(item => item.source === "body");
  const hasHighlights = headlineHighlights.length > 0 || bodyHighlights.length > 0;

  if (!hasHighlights) {
    return (
      <div style={{ border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "9px 10px", background: "var(--gray-50)" }}>
        <div className="label">Flagged phrase preview</div>
        <div className="muted" style={{ fontSize: 11.5, marginTop: 4 }}>No exact banned phrases highlighted. General notes may still require review.</div>
      </div>
    );
  }

  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "9px 10px", background: "var(--surface)" }}>
      <div className="label" style={{ marginBottom: 6 }}>Flagged phrase preview</div>
      <div style={{ fontSize: 12.5, lineHeight: 1.55, fontWeight: 600, marginBottom: 8 }}>
        {renderHighlightedText(headline || "No headline", headlineHighlights)}
      </div>
      <div style={{ fontSize: 12.5, lineHeight: 1.55, whiteSpace: "pre-wrap" }}>
        {renderHighlightedText(body || "No body copy", bodyHighlights)}
      </div>
    </div>
  );
}

function renderHighlightedText(text, highlights) {
  const sorted = normalizeHighlights(text, highlights);
  if (sorted.length === 0) return text;

  const parts = [];
  let cursor = 0;

  sorted.forEach((highlight, index) => {
    if (highlight.start > cursor) {
      parts.push(text.slice(cursor, highlight.start));
    }
    parts.push(
      <mark
        key={`${highlight.start}-${highlight.end}-${index}`}
        title={highlight.message}
        style={{
          background: highlight.severity === "blocker" ? "rgba(220, 38, 38, 0.18)" : "rgba(245, 158, 11, 0.22)",
          color: "inherit",
          borderBottom: `2px solid ${highlight.severity === "blocker" ? "var(--danger)" : "var(--warning)"}`,
          borderRadius: 3,
          padding: "0 2px",
        }}
      >
        {text.slice(highlight.start, highlight.end)}
      </mark>
    );
    cursor = highlight.end;
  });

  if (cursor < text.length) parts.push(text.slice(cursor));
  return parts;
}

function normalizeHighlights(text, highlights) {
  const sorted = [...highlights]
    .filter(item => Number.isFinite(item.start) && Number.isFinite(item.end) && item.end > item.start)
    .filter(item => item.start >= 0 && item.end <= text.length)
    .sort((a, b) => a.start - b.start || b.end - a.end);
  const result = [];
  let lastEnd = -1;

  sorted.forEach(item => {
    if (item.start < lastEnd) return;
    result.push(item);
    lastEnd = item.end;
  });

  return result;
}

function collectComplianceHighlights(headline, body, review) {
  const fromReview = (review?.issues || []).flatMap(issue => (
    (issue.matches || []).map(match => ({
      ...match,
      severity: issue.severity,
      message: issue.message,
    }))
  ));
  const local = localComplianceHighlights(headline, body);
  return dedupeHighlights([...fromReview, ...local]);
}

function localComplianceHighlights(headline, body) {
  const rules = [
    [/finance your/gi, "headline", "warning", "Banned phrase 'Finance Your' is used."],
    [/guaranteed approval|100% approved|everyone approved|no credit check/gi, "both", "blocker", "Approval language is too strong."],
    [/\$0\s*down|zero down/gi, "both", "blocker", "Zero-down claim detected."],
    [/monthly payment|weekly payment|\$\d+[^\n.]{0,16}\/(?:wk|mo)/gi, "both", "warning", "Payment amount or schedule detected."],
    [/drive (?:it|this|the|your|our).{0,80}home today|take (?:it|this|the|your|our).{0,80}home today/gi, "both", "warning", "Drive-away-today language detected."],
    [/get started on your path to ownership today/gi, "both", "note", "This phrase may be too vague or promotional."],
    [/aprobaci[oó]n garantizada|100% aprobado|todos aprobados|sin revisar cr[eé]dito|sin chequeo de cr[eé]dito/gi, "both", "blocker", "Spanish approval language is too strong."],
    [/\$0\s*(?:de\s*)?enganche|cero\s*(?:de\s*)?enganche|sin enganche/gi, "both", "blocker", "Spanish zero-down claim detected."],
    [/maneja(?:lo|la)? hoy|ll[eé]vatelo hoy|sal manejando hoy/gi, "both", "warning", "Spanish drive-away-today language detected."],
    [/descuento|bajada de precio/gi, "both", "warning", "Spanish down payment may be translated incorrectly."],
  ];

  return rules.flatMap(([pattern, sourceHint, severity, message]) => {
    const sources = sourceHint === "headline" ? [["headline", headline]] : [["headline", headline], ["body", body]];
    return sources.flatMap(([source, value]) => findUiMatches(value, pattern, source, severity, message));
  });
}

function findUiMatches(value, pattern, source, severity, message) {
  const matches = [];
  const regex = new RegExp(pattern.source, pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`);
  let match;

  while ((match = regex.exec(value || "")) !== null) {
    matches.push({
      text: match[0],
      source,
      start: match.index,
      end: match.index + match[0].length,
      severity,
      message,
    });
    if (match[0].length === 0) regex.lastIndex += 1;
  }

  return matches;
}

function dedupeHighlights(highlights) {
  const seen = new Set();
  return highlights.filter(item => {
    const key = `${item.source}:${item.start}:${item.end}:${item.message}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function CompliancePanel({ risks, review }) {
  const { Pill } = UI;
  const reviewIssues = review?.issues || [];
  const allRisks = [...risks, ...reviewIssues.map(issue => `${titleCase(issue.severity)}: ${issue.message}${issue.suggestion ? ` ${issue.suggestion}` : ""}`)];
  const clean = allRisks.length === 0 && (!review || review.verdict === "pass");
  const verdict = review?.verdict || (clean ? "pass" : "needs_review");

  return (
    <div style={{
      border: "1px solid var(--border)",
      borderRadius: "var(--radius)",
      background: clean ? "var(--gray-50)" : "rgba(245, 158, 11, 0.08)",
      padding: "9px 10px",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: clean ? 0 : 8 }}>
        <div className="row" style={{ gap: 6 }}>
          {clean ? <Icon.CheckCircle size={14} style={{ color: "var(--success)" }}/> : <Icon.AlertTriangle size={14} style={{ color: "var(--warning)" }}/>}
          <div style={{ fontWeight: 600, fontSize: 12.5 }}>{clean ? "Compliance passed" : "Review before approval"}</div>
        </div>
        <Pill tone={verdict === "pass" ? "green" : verdict === "fail" ? "red" : "amber"}>{review ? titleCase(verdict) : `${allRisks.length} flags`}</Pill>
      </div>
      {!clean && (
        <div className="col" style={{ gap: 5 }}>
          {allRisks.map(risk => (
            <div key={risk} className="muted" style={{ fontSize: 11.5, lineHeight: 1.4 }}>{risk}</div>
          ))}
        </div>
      )}
    </div>
  );
}

function AttemptHistory({ attempts }) {
  const { Pill } = UI;
  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "9px 10px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
        <div style={{ fontWeight: 600, fontSize: 12.5 }}>Attempt history</div>
        <Pill tone="blue">{attempts.length}</Pill>
      </div>
      <div className="col" style={{ gap: 7 }}>
        {attempts.map((attempt, index) => (
          <div key={`${attempt.attempt}-${attempt.checked_at}-${index}`} style={{ borderTop: index ? "1px solid var(--border)" : 0, paddingTop: index ? 7 : 0 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
              <div className="muted" style={{ fontSize: 11.5 }}>
                Attempt {attempt.attempt} · {attempt.provider || "system"} / {attempt.model || "unknown"}
              </div>
              <Pill tone={attempt.verdict === "pass" ? "green" : attempt.verdict === "fail" ? "red" : "amber"}>{titleCase(attempt.verdict)}</Pill>
            </div>
            {attempt.issues?.length > 0 && (
              <div className="muted" style={{ fontSize: 11, lineHeight: 1.4, marginTop: 4 }}>
                {attempt.issues.map(issue => issue.message).join(" ")}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function EventTimeline({ events }) {
  if (!events.length) return <ReviewMini title="Audit trail">No events yet</ReviewMini>;
  const sorted = [...events].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5);

  return (
    <div>
      <div className="label">Audit trail</div>
      <div className="col" style={{ gap: 6, marginTop: 5 }}>
        {sorted.map(event => (
          <div key={event.id} style={{ border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "6px 7px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
              <div style={{ fontSize: 11.5, fontWeight: 600 }}>{titleCase(event.event_type)}</div>
              <div className="muted" style={{ fontSize: 10.5 }}>{formatDate(event.created_at)}</div>
            </div>
            {event.note && <div className="muted" style={{ fontSize: 11, lineHeight: 1.35, marginTop: 3 }}>{event.note}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

function FilterSelect({ label, value, onChange, options }) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span className="label" style={{ margin: 0 }}>{label}</span>
      <select className="select" value={value} onChange={event => onChange(event.target.value)} style={{ height: 32, minWidth: 150 }}>
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>{optionLabel}</option>
        ))}
      </select>
    </label>
  );
}

function ReviewMini({ title, children }) {
  return (
    <div>
      <div className="label">{title}</div>
      <div className="muted" style={{ fontSize: 11.5, lineHeight: 1.45, marginTop: 3 }}>{children}</div>
    </div>
  );
}

function outputText(output) {
  return [output.output?.headline, output.output?.body || output.output?.raw].filter(Boolean).join("\n\n");
}

function outputTitle(output) {
  return output.output?.headline || titleCase(output.task_type || "Generated output");
}

function vehicleLabel(output) {
  const vehicle = output.vehicle;
  if (!vehicle) return "No vehicle linked";
  return [vehicle.year, vehicle.make, vehicle.model, vehicle.trim].filter(Boolean).join(" ") || vehicle.vin || "Vehicle";
}

function channelLabel(channelId) {
  const module = channelModules.find(item => item.id === channelId);
  return module?.name || channelId || "No channel";
}

function statusTone(status) {
  if (status === "approved") return "green";
  if (status === "reviewed") return "amber";
  if (status === "hitl_required") return "red";
  if (status === "rejected") return "red";
  if (status === "archived") return "gray";
  return "blue";
}

function complianceRisks(text) {
  const checks = [
    [/guaranteed approval|100% approved|no credit check/i, "Avoid guaranteed approval, 100% approval, or no-credit-check language."],
    [/\$0\s*down|zero down/i, "Do not advertise zero down unless it is specifically approved."],
    [/monthly payment|weekly payment|\$\d+[^\n.]{0,16}\/(?:wk|mo)/i, "Payment amounts or schedules need approved terms before publishing."],
    [/drive (?:it|this|the|your|our).{0,80}home today|take (?:it|this|the|your|our).{0,80}home today/i, "Avoid drive-away-today language; use availability or message-us wording."],
    [/finance your/i, "Avoid direct 'Finance Your' phrasing; use neutral financing-options wording."],
    [/aprobaci[oó]n garantizada|100% aprobado|todos aprobados|sin revisar cr[eé]dito|sin chequeo de cr[eé]dito/i, "Avoid Spanish guaranteed-approval or no-credit-check language."],
    [/\$0\s*(?:de\s*)?enganche|cero\s*(?:de\s*)?enganche|sin enganche/i, "Do not advertise Spanish zero-down claims unless specifically approved."],
    [/maneja(?:lo|la)? hoy|ll[eé]vatelo hoy|sal manejando hoy/i, "Avoid Spanish drive-away-today language; use availability or contact-us wording."],
    [/descuento|bajada de precio/i, "Spanish down payment wording may be wrong; use enganche for down payment."],
    [/wac|subject to approval/i, null],
  ];
  const risks = checks
    .filter(([pattern, message]) => message && pattern.test(text))
    .map(([, message]) => message);

  if (!/wac|subject to approval/i.test(text)) {
    risks.push("Finance copy should include WAC or subject-to-approval language.");
  }

  return [...new Set(risks)];
}

function titleCase(value) {
  return String(value || "").replace(/_/g, " ").replace(/\b\w/g, letter => letter.toUpperCase());
}

function languageLabel(value) {
  if (value === "both") return "English + Spanish";
  if (value === "es") return "Spanish";
  return "English";
}

function formatDate(value) {
  if (!value) return "Not set";
  return new Date(value).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export { AiLibrary };
