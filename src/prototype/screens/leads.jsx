import React from 'react';
import { Icon } from '../icons';
import { UI } from '../ui';

const STATUSES = [
  { id: "new",         label: "New",         tone: "blue" },
  { id: "contacted",   label: "Contacted",   tone: "amber" },
  { id: "appointment", label: "Appointment", tone: "green" },
  { id: "sold",        label: "Sold",        tone: "green" },
  { id: "lost",        label: "Lost",        tone: "gray" },
];

const ACTIVITY_LABEL = {
  note: "Note",
  call_attempt: "Call attempt",
  call_connected: "Call connected",
  sms_sent: "SMS sent",
  email_sent: "Email sent",
  appointment_scheduled: "Appointment scheduled",
  status_change: "Status changed",
  viewed_vehicle: "Viewed vehicle",
};

function fmtDateTime(ts) {
  if (!ts) return "";
  try {
    return new Date(ts).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  } catch {
    return ts;
  }
}

function fullNameOf(lead) {
  const parts = [lead.first_name, lead.last_name].filter(Boolean);
  if (parts.length) return parts.join(" ");
  return lead.email || lead.phone || "Unnamed lead";
}

function initialsOf(lead) {
  const name = fullNameOf(lead);
  return name.split(/\s+/).map(s => s[0]).filter(Boolean).join("").slice(0, 2).toUpperCase() || "?";
}

function statusTone(statusId) {
  return STATUSES.find(s => s.id === statusId)?.tone || "gray";
}

function statusLabel(statusId) {
  return STATUSES.find(s => s.id === statusId)?.label || statusId;
}

function Leads({ nav, toast, clientId, vehicles }) {
  const { Pill, Btn } = UI;
  const [leads, setLeads] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [selId, setSelId] = React.useState(null);
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [showAdd, setShowAdd] = React.useState(false);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = clientId && clientId !== "agency_overview" ? `?clientId=${encodeURIComponent(clientId)}` : "";
      const res = await fetch(`/api/leads${params}`);
      const data = await res.json();
      if (!res.ok || !data?.ok) throw new Error(data?.error || "Could not load leads");
      setLeads(data.leads || []);
      if (data.leads?.length && !data.leads.some(l => l.id === selId)) {
        setSelId(data.leads[0].id);
      }
    } catch (err) {
      setError(err.message || String(err));
      setLeads([]);
    } finally {
      setLoading(false);
    }
  }, [clientId, selId]);

  React.useEffect(() => { refresh(); }, [clientId]); // eslint-disable-line react-hooks/exhaustive-deps

  const counts = React.useMemo(() => {
    const out = { all: leads.length };
    STATUSES.forEach(s => { out[s.id] = leads.filter(l => l.status === s.id).length; });
    return out;
  }, [leads]);

  const rows = leads.filter(l => statusFilter === "all" || l.status === statusFilter);
  const selected = leads.find(l => l.id === selId) || null;

  return (
    <div style={{ height: "100%", display: "grid", gridTemplateColumns: "1fr 460px", overflow: "hidden" }}>
      <div style={{ overflow: "auto" }}>
        <div className="page" style={{ paddingBottom: 20 }}>
          <div className="page-h">
            <div>
              <h1>Leads inbox</h1>
              <div className="sub">
                {loading ? "Loading…" : error ? `Error: ${error}` : `${leads.length} lead${leads.length === 1 ? "" : "s"}`}
              </div>
            </div>
            <div className="page-actions">
              <Btn icon={Icon.Refresh} onClick={refresh}>Refresh</Btn>
              <Btn icon={Icon.Plus} variant="dark" onClick={() => setShowAdd(true)}>Add lead</Btn>
            </div>
          </div>

          <div style={{ display: "flex", gap: 4, marginBottom: 12, flexWrap: "wrap" }}>
            <button
              className={`chip ${statusFilter === "all" ? "active" : ""}`}
              onClick={() => setStatusFilter("all")}
            >
              All <span style={{ marginLeft: 4, color: statusFilter === "all" ? "rgba(255,255,255,0.7)" : "var(--text-2)" }}>{counts.all}</span>
            </button>
            {STATUSES.map(s => (
              <button
                key={s.id}
                className={`chip ${statusFilter === s.id ? "active" : ""}`}
                onClick={() => setStatusFilter(s.id)}
              >
                {s.label} <span style={{ marginLeft: 4, color: statusFilter === s.id ? "rgba(255,255,255,0.7)" : "var(--text-2)" }}>{counts[s.id] || 0}</span>
              </button>
            ))}
          </div>

          {leads.length === 0 && !loading && !error && (
            <div className="card" style={{ padding: 36, textAlign: "center" }}>
              <Icon.Inbox size={36} className="ico" style={{ opacity: 0.4, marginBottom: 8 }}/>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>No leads yet.</div>
              <div className="muted" style={{ fontSize: 12, marginBottom: 14 }}>
                Add walk-ins and phone calls manually, or publish a campaign with a tracking URL so web inquiries land here.
              </div>
              <Btn icon={Icon.Plus} variant="primary" onClick={() => setShowAdd(true)}>Add lead</Btn>
            </div>
          )}

          {leads.length > 0 && (
            <div className="card">
              <table className="tbl">
                <thead>
                  <tr><th>Lead</th><th>Source</th><th>Vehicle</th><th>Status</th><th>When</th></tr>
                </thead>
                <tbody>
                  {rows.map(l => (
                    <tr
                      key={l.id}
                      onClick={() => setSelId(l.id)}
                      className={selId === l.id ? "selected" : ""}
                      style={{ cursor: "pointer" }}
                    >
                      <td>
                        <div className="row" style={{ gap: 9 }}>
                          <div className="avatar" style={{ background: "var(--gray-100)", color: "var(--gray-700)" }}>
                            {initialsOf(l)}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600 }}>{fullNameOf(l)}</div>
                            <div className="muted mono" style={{ fontSize: 11 }}>{l.phone || l.email || "—"}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                          <Pill>{l.source || "manual"}</Pill>
                          {l.source_channel && <span className="muted" style={{ fontSize: 10.5 }}>{l.source_channel}</span>}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: 12.5 }}>
                          {l.vehicle ? `${l.vehicle.year || ""} ${l.vehicle.make || ""} ${l.vehicle.model || ""}`.trim() : "—"}
                        </div>
                      </td>
                      <td><Pill tone={statusTone(l.status)} dot>{statusLabel(l.status)}</Pill></td>
                      <td className="muted">{fmtDateTime(l.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <aside style={{ borderLeft: "1px solid var(--border)", background: "var(--surface)", overflow: "auto", display: "flex", flexDirection: "column" }}>
        {selected ? (
          <LeadDetail
            leadId={selected.id}
            key={selected.id}
            clientId={clientId}
            toast={toast}
            nav={nav}
            onChanged={refresh}
          />
        ) : (
          <div style={{ padding: 24, color: "var(--text-2)", fontSize: 13 }}>
            Select a lead to see details.
          </div>
        )}
      </aside>

      {showAdd && (
        <AddLeadModal
          onClose={() => setShowAdd(false)}
          onCreated={() => { setShowAdd(false); refresh(); }}
          clientId={clientId}
          vehicles={vehicles || []}
          toast={toast}
        />
      )}
    </div>
  );
}

function LeadDetail({ leadId, clientId, toast, nav, onChanged }) {
  const { Pill, Btn } = UI;
  const [lead, setLead] = React.useState(null);
  const [activities, setActivities] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [noteText, setNoteText] = React.useState("");
  const [savingNote, setSavingNote] = React.useState(false);
  const [savingStatus, setSavingStatus] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ id: leadId });
      if (clientId && clientId !== "agency_overview") params.set("clientId", clientId);
      const res = await fetch(`/api/leads?${params.toString()}`);
      const data = await res.json();
      if (!res.ok || !data?.ok) throw new Error(data?.error || "Could not load lead");
      setLead(data.lead);
      setActivities(data.activities || []);
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }, [leadId, clientId]);

  React.useEffect(() => { load(); }, [load]);

  const setStatus = async (nextStatus) => {
    setSavingStatus(true);
    try {
      const res = await fetch("/api/leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: leadId, status: nextStatus }),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) throw new Error(data?.error || "Could not update status");
      toast?.("Status updated");
      await load();
      onChanged?.();
    } catch (err) {
      toast?.(err.message || "Status update failed");
    } finally {
      setSavingStatus(false);
    }
  };

  const logActivity = async (activityType, body) => {
    try {
      const res = await fetch("/api/leads/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId, activityType, body }),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) throw new Error(data?.error || "Could not log activity");
      await load();
    } catch (err) {
      toast?.(err.message || "Activity log failed");
    }
  };

  const saveNote = async () => {
    if (!noteText.trim()) return;
    setSavingNote(true);
    try {
      await logActivity("note", noteText.trim());
      setNoteText("");
      toast?.("Note saved");
    } finally {
      setSavingNote(false);
    }
  };

  if (loading) return <div style={{ padding: 24, color: "var(--text-2)" }}>Loading…</div>;
  if (error) return <div style={{ padding: 24, color: "var(--danger)" }}>{error}</div>;
  if (!lead) return null;

  const name = fullNameOf(lead);
  const vehicle = lead.vehicle;

  return (
    <>
      <div style={{ padding: 16, borderBottom: "1px solid var(--border)" }}>
        <div style={{ display: "flex", gap: 12 }}>
          <div className="avatar lg" style={{ background: "var(--primary-100)", color: "var(--primary-700)" }}>
            {initialsOf(lead)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: 15 }}>{name}</div>
            <div className="muted mono" style={{ fontSize: 12 }}>{lead.phone || "—"}</div>
            {lead.email && <div className="muted mono" style={{ fontSize: 11.5 }}>{lead.email}</div>}
            <div className="row" style={{ gap: 6, marginTop: 6, flexWrap: "wrap" }}>
              <Pill tone={statusTone(lead.status)} dot>{statusLabel(lead.status)}</Pill>
              <Pill>{lead.source || "manual"}</Pill>
              {lead.source_channel && <Pill tone="blue">{lead.source_channel}</Pill>}
            </div>
          </div>
        </div>
        <div className="row" style={{ marginTop: 12, gap: 6, flexWrap: "wrap" }}>
          <Btn size="sm" icon={Icon.Phone} onClick={() => logActivity("call_attempt", "Outbound call attempted")}>Logged call</Btn>
          <Btn size="sm" icon={Icon.Msg} onClick={() => logActivity("sms_sent", "SMS sent")}>Logged SMS</Btn>
          <Btn size="sm" icon={Icon.Mail} onClick={() => logActivity("email_sent", "Email sent")}>Logged email</Btn>
        </div>
      </div>

      {vehicle && (
        <div style={{ padding: 16, borderBottom: "1px solid var(--border)" }}>
          <div className="muted" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600, marginBottom: 8 }}>
            Vehicle of interest
          </div>
          <button
            onClick={() => nav("vehicle", vehicle.id)}
            style={{
              background: "var(--gray-50)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              padding: 10,
              width: "100%",
              textAlign: "left",
              cursor: "pointer",
              fontFamily: "inherit",
              display: "flex",
              gap: 10,
              alignItems: "center",
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 12.5 }}>
                {vehicle.year} {vehicle.make} {vehicle.model} {vehicle.trim || ""}
              </div>
              <div className="muted mono" style={{ fontSize: 11 }}>
                {vehicle.stock_number ? `#${vehicle.stock_number}` : vehicle.vin}
                {typeof vehicle.price === "number" ? ` · $${vehicle.price.toLocaleString()}` : ""}
              </div>
            </div>
            <Icon.ChevronRight size={14} className="ico"/>
          </button>
        </div>
      )}

      {(lead.campaign || lead.campaign_channel || (lead.utm && Object.keys(lead.utm).length > 0)) && (
        <div style={{ padding: 16, borderBottom: "1px solid var(--border)" }}>
          <div className="muted" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600, marginBottom: 8 }}>
            Attribution
          </div>
          {lead.campaign && (
            <div style={{ fontSize: 12.5 }}>Campaign: <strong>{lead.campaign.name}</strong></div>
          )}
          {lead.campaign_channel && (
            <div style={{ fontSize: 12.5 }}>Channel: <strong>{lead.campaign_channel.channel}</strong></div>
          )}
          {lead.utm && Object.keys(lead.utm).length > 0 && (
            <div className="muted mono" style={{ fontSize: 11, marginTop: 4 }}>
              {Object.entries(lead.utm).filter(([, v]) => v).map(([k, v]) => `${k}=${v}`).join(" · ")}
            </div>
          )}
        </div>
      )}

      <div style={{ padding: 16, borderBottom: "1px solid var(--border)" }}>
        <div className="muted" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600, marginBottom: 8 }}>
          Status
        </div>
        <select
          className="select"
          value={lead.status}
          disabled={savingStatus}
          onChange={(e) => setStatus(e.target.value)}
        >
          {STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
      </div>

      <div style={{ padding: 16, borderBottom: "1px solid var(--border)" }}>
        <div className="muted" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600, marginBottom: 8 }}>
          Add note
        </div>
        <textarea
          className="input"
          rows={3}
          value={noteText}
          onChange={e => setNoteText(e.target.value)}
          placeholder="Log a note (visible in activity timeline)"
        />
        <Btn size="sm" variant="dark" style={{ marginTop: 6 }} onClick={saveNote} disabled={savingNote || !noteText.trim()}>
          {savingNote ? "Saving…" : "Save note"}
        </Btn>
      </div>

      <div style={{ padding: 16, flex: 1 }}>
        <div className="muted" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600, marginBottom: 10 }}>
          Activity
        </div>
        {activities.length === 0 ? (
          <div className="muted" style={{ fontSize: 12 }}>No activity logged yet.</div>
        ) : (
          <div>
            {activities.map((a, i) => (
              <div key={a.id} style={{ display: "flex", gap: 10, paddingBottom: 10, position: "relative" }}>
                <div style={{
                  width: 7, height: 7, borderRadius: "50%",
                  background: i === 0 ? "var(--primary)" : "var(--border-strong)",
                  marginTop: 5, flex: "0 0 7px", position: "relative", zIndex: 1
                }}/>
                {i < activities.length - 1 && (
                  <div style={{ position: "absolute", left: 3, top: 12, bottom: 0, width: 1, background: "var(--border)" }}/>
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600 }}>
                    {ACTIVITY_LABEL[a.activity_type] || a.activity_type}
                  </div>
                  {a.body && <div style={{ fontSize: 12, color: "var(--text-2)", marginTop: 2 }}>{a.body}</div>}
                  <div className="muted" style={{ fontSize: 11, marginTop: 2 }}>
                    {a.actor || "system"} · {fmtDateTime(a.occurred_at)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function AddLeadModal({ onClose, onCreated, clientId, vehicles, toast }) {
  const { Btn } = UI;
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [vehicleId, setVehicleId] = React.useState("");
  const [source, setSource] = React.useState("walk_in");
  const [notes, setNotes] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState(null);

  const SOURCE_OPTIONS = [
    { id: "walk_in",  label: "Walk-in" },
    { id: "phone",    label: "Phone call" },
    { id: "referral", label: "Referral" },
    { id: "manual",   label: "Other / manual" },
  ];

  const save = async () => {
    setError(null);
    if (!firstName.trim() && !lastName.trim() && !phone.trim() && !email.trim()) {
      setError("Add a name, phone, or email.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: clientId && clientId !== "agency_overview" ? clientId : undefined,
          firstName, lastName, phone, email,
          vehicleId: vehicleId || null,
          source,
          notes: notes || null,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) throw new Error(data?.error || "Could not create lead");
      toast?.("Lead created");
      onCreated();
    } catch (err) {
      setError(err.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="drawer-bg" onClick={onClose}/>
      <div className="drawer">
        <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0, fontSize: 14 }}>Add lead</h3>
          <button className="icon-btn" onClick={onClose}><Icon.X size={15}/></button>
        </div>
        <div style={{ padding: 16, flex: 1, overflow: "auto", display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div className="field"><label>First name</label><input className="input" value={firstName} onChange={e => setFirstName(e.target.value)}/></div>
            <div className="field"><label>Last name</label><input className="input" value={lastName} onChange={e => setLastName(e.target.value)}/></div>
          </div>
          <div className="field"><label>Phone</label><input className="input mono" value={phone} onChange={e => setPhone(e.target.value)} inputMode="tel"/></div>
          <div className="field"><label>Email</label><input className="input" value={email} onChange={e => setEmail(e.target.value)} type="email"/></div>
          <div className="field">
            <label>Vehicle of interest</label>
            <select className="select" value={vehicleId} onChange={e => setVehicleId(e.target.value)}>
              <option value="">No specific vehicle</option>
              {(vehicles || []).map(v => (
                <option key={v.id} value={v.id}>
                  {v.year} {v.make} {v.model} {v.stock ? `· ${v.stock}` : ""}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Source</label>
            <select className="select" value={source} onChange={e => setSource(e.target.value)}>
              {SOURCE_OPTIONS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Notes (optional)</label>
            <textarea className="input" rows={3} value={notes} onChange={e => setNotes(e.target.value)}/>
          </div>
          {error && (
            <div style={{ padding: "8px 10px", borderRadius: 6, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "var(--danger)", fontSize: 12 }}>{error}</div>
          )}
        </div>
        <div style={{ padding: 12, borderTop: "1px solid var(--border)", display: "flex", justifyContent: "flex-end", gap: 6 }}>
          <Btn onClick={onClose}>Cancel</Btn>
          <Btn variant="primary" onClick={save} disabled={saving}>{saving ? "Saving…" : "Add lead"}</Btn>
        </div>
      </div>
    </>
  );
}

export { Leads };
