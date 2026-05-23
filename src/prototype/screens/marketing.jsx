import React from 'react';
import { Icon } from '../icons';
import { GGG } from '../data';
import { UI } from '../ui';

// Marketing — SMS & Email campaign composer

const SMS_LIMIT = 160;
const SMS_WARN = 140;
const SUBJECT_HINT = 50;

const MKT_TEMPLATES = [
  {
    id: "fresh",
    name: "Fresh Arrival",
    icon: "Sparkles",
    tone: "blue",
    blurb: "Notify warm leads about a new arrival.",
    sms: "Hi {first_name}, just got a {vehicle_year_make_model} on the lot — looks like what you wanted. {price}. Want me to hold it? — {dealership_name}",
    email: {
      subject: "Fresh arrival: {vehicle_year_make_model}",
      body: "Hi {first_name},\n\nA {vehicle_year_make_model} just hit the lot at {price} — exactly the kind of car you've been looking at.\n\nClean Carfax. Low down payment options.\nReply or call us to lock it in before the weekend.\n\n— {dealership_name}",
    },
  },
  {
    id: "pricedrop",
    name: "Price Drop",
    icon: "Tag",
    tone: "red",
    blurb: "Trigger urgency with a price-cut alert.",
    sms: "{first_name}, the {vehicle_year_make_model} you were watching just dropped to {price}. Limited time. Reply YES to hold it. — {dealership_name}",
    email: {
      subject: "Price drop on the {vehicle_year_make_model}",
      body: "Hi {first_name},\n\nGood news — the {vehicle_year_make_model} you looked at just dropped to {price}.\n\nIt won't last at this price. Reply to schedule a test drive or call us today.\n\n— {dealership_name}",
    },
  },
  {
    id: "trade",
    name: "Trade-in Offer",
    icon: "Refresh",
    tone: "cyan",
    blurb: "Invite leads to use their current car as down payment.",
    sms: "Hey {first_name} — your current ride could be your down payment on a {vehicle_year_make_model}. Free 5-min trade quote. Reply TRADE. — {dealership_name}",
    email: {
      subject: "Your trade-in could cover the down payment",
      body: "Hi {first_name},\n\nWe'll appraise your current vehicle for free — and apply the value straight to your down payment on a {vehicle_year_make_model}.\n\nNo appointment needed. Stop by or reply with your year/make/model for a quick estimate.\n\n— {dealership_name}",
    },
  },
  {
    id: "drive",
    name: "Test Drive Reminder",
    icon: "Calendar",
    tone: "amber",
    blurb: "Confirm an upcoming test-drive appointment.",
    sms: "{first_name}, this is a reminder of your {vehicle_year_make_model} test drive at {appointment_time}. See you soon! — {dealership_name}",
    email: {
      subject: "Reminder: your test drive on the {vehicle_year_make_model}",
      body: "Hi {first_name},\n\nQuick reminder — you're scheduled to test drive the {vehicle_year_make_model} at {appointment_time}.\n\nBring your driver's license and proof of insurance. Reply if anything changes.\n\nSee you soon,\n{dealership_name}",
    },
  },
  {
    id: "sale",
    name: "Sale Ending",
    icon: "Clock",
    tone: "red",
    blurb: "Last-chance push before a sale ends.",
    sms: "Final day, {first_name}. {price} on the {vehicle_year_make_model} ends tonight. Open till 7pm. — {dealership_name}",
    email: {
      subject: "Last day: {price} on the {vehicle_year_make_model}",
      body: "Hi {first_name},\n\nToday's the last day to get the {vehicle_year_make_model} at {price}.\n\nWe're open till 7pm — stop in or reply to lock the deal.\n\n— {dealership_name}",
    },
  },
  {
    id: "custom",
    name: "Custom Message",
    icon: "Edit",
    tone: "gray",
    blurb: "Start with a blank composer.",
    sms: "",
    email: { subject: "", body: "" },
  },
];

const MKT_RECIPIENTS = [
  { id: "all", label: "All leads", count: 847 },
  { id: "new", label: "New leads", count: 23 },
  { id: "suv", label: "Vehicle interest: SUVs", count: 124 },
  { id: "cold", label: "Interested but not contacted", count: 156 },
  { id: "custom", label: "Custom segment", count: 0 },
];

const TOKENS = [
  "{first_name}",
  "{vehicle_year_make_model}",
  "{price}",
  "{appointment_time}",
  "{dealership_name}",
];

// Substitute tokens with sample values for preview
function previewTokens(text) {
  return text
    .replaceAll("{first_name}", "Marcus")
    .replaceAll("{vehicle_year_make_model}", "2016 Chevy Malibu")
    .replaceAll("{price}", "$11,995")
    .replaceAll("{appointment_time}", "Tue 5:30pm")
    .replaceAll("{dealership_name}", "Wabash Auto");
}

function Marketing({ nav, toast }) {
  const { Pill, Btn } = UI;
  const { VEHICLES } = GGG;
  const [channel, setChannel] = React.useState("sms");
  const [templateId, setTemplateId] = React.useState("fresh");
  const [sms, setSms] = React.useState(MKT_TEMPLATES[0].sms);
  const [subject, setSubject] = React.useState(MKT_TEMPLATES[0].email.subject);
  const [body, setBody] = React.useState(MKT_TEMPLATES[0].email.body);
  const [recipientId, setRecipientId] = React.useState("all");
  const [timing, setTiming] = React.useState("now"); // now | later
  const [frequency, setFrequency] = React.useState("one-time");
  const [date, setDate] = React.useState("2026-05-22");
  const [time, setTime] = React.useState("10:00");
  
  const [selectedVehicleId, setSelectedVehicleId] = React.useState(VEHICLES[0]?.id || "");
  const [targetLanguage, setTargetLanguage] = React.useState("en");
  const [generating, setGenerating] = React.useState(false);

  const template = MKT_TEMPLATES.find(t => t.id === templateId);
  const recipient = MKT_RECIPIENTS.find(r => r.id === recipientId);
  
  const activeVehicle = VEHICLES.find(v => v.id === selectedVehicleId) || VEHICLES[0];
  
  const previewTokens = (text) => {
    if (!text) return "";
    const vName = `${activeVehicle?.year || 2016} ${activeVehicle?.make || "Chevy"} ${activeVehicle?.model || "Malibu"}`;
    const vPrice = activeVehicle?.price ? `$${activeVehicle.price.toLocaleString()}` : "$11,995";
    const vDown = activeVehicle?.down ? `$${activeVehicle.down.toLocaleString()}` : "$1,500";
    return text
      .replaceAll("{first_name}", "Marcus")
      .replaceAll("{vehicle_year_make_model}", vName)
      .replaceAll("{price}", vPrice)
      .replaceAll("{appointment_time}", "Tue 5:30pm")
      .replaceAll("{dealership_name}", "Wabash Auto");
  };

  const generateWithBrandBrain = async () => {
    setGenerating(true);
    try {
      const response = await fetch("/api/messaging/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: null,
          vehicle: activeVehicle,
          channel,
          templateId,
          targetLanguage,
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.error || "Generation failed");

      if (channel === "sms") {
        setSms(result.copy);
      } else {
        setSubject(result.copy.subject);
        setBody(result.copy.body);
      }
      toast(`AI Campaign draft generated in ${targetLanguage === "es" ? "Spanish" : "English"} successfully!`);
    } catch (error) {
      toast(error instanceof Error ? error.message : "AI generation failed");
    } finally {
      setGenerating(false);
    }
  };

  const loadTemplate = (id) => {
    const t = MKT_TEMPLATES.find(x => x.id === id);
    if (!t) return;
    setTemplateId(id);
    setSms(t.sms);
    setSubject(t.email.subject);
    setBody(t.email.body);
  };

  const insertToken = (token) => {
    if (channel === "sms") setSms(s => (s + " " + token).trim());
    else setBody(b => (b + " " + token).trim());
  };

  const send = () => {
    if (channel === "sms" && !sms.trim()) return toast("Message is empty");
    if (channel === "email" && !subject.trim()) return toast("Add a subject line");
    const when = timing === "now" ? "now" : `${date} at ${time}`;
    toast(`${channel === "sms" ? "SMS" : "Email"} campaign ${timing === "now" ? "sent" : "scheduled"} to ${recipient.count.toLocaleString()} leads`);
  };

  return (
    <div className="page mkt-page">
      <div className="page-h">
        <div>
          <h1>Marketing</h1>
          <div className="sub">SMS &amp; email campaigns · 847 leads in your audience</div>
        </div>
        <div className="page-actions">
          <Btn icon={Icon.Chart}>Campaign history</Btn>
          <Btn icon={Icon.Plus} variant="dark">New template</Btn>
        </div>
      </div>

      <div className="mkt-layout">
        {/* ---------- LEFT — TEMPLATE PICKER ---------- */}
        <aside className="mkt-templates">
          <div className="mkt-section-h">
            <span>Templates</span>
            <span className="muted" style={{ fontSize: 11 }}>{MKT_TEMPLATES.length}</span>
          </div>
          <div className="mkt-tpl-list">
            {MKT_TEMPLATES.map(t => {
              const I = Icon[t.icon] || Icon.Sparkles;
              const sel = t.id === templateId;
              const preview = channel === "sms" ? t.sms : t.email.subject;
              return (
                <button key={t.id} onClick={() => loadTemplate(t.id)}
                  className={`mkt-tpl-card ${sel ? "active" : ""}`}>
                  <div className={`mkt-tpl-ico tone-${t.tone}`}>
                    <I size={14}/>
                  </div>
                  <div className="mkt-tpl-body">
                    <div className="mkt-tpl-h">
                      <span className="mkt-tpl-name">{t.name}</span>
                      <Pill tone="gray">{channel === "sms" ? "SMS" : "Email"}</Pill>
                    </div>
                    <div className="mkt-tpl-preview">{preview || t.blurb}</div>
                  </div>
                </button>
              );
            })}
          </div>
          <button className="btn" style={{ width: "100%", justifyContent: "center", marginTop: 8 }}>
            <Icon.Plus size={13}/> New template
          </button>
        </aside>

        {/* ---------- CENTER — COMPOSE ---------- */}
        <main className="mkt-compose">
          <div className="card">
            {/* Channel toggle */}
            <div className="card-h" style={{ paddingBottom: 10 }}>
              <div className="mkt-channel-toggle">
                <button onClick={() => setChannel("sms")} className={channel === "sms" ? "active" : ""}>
                  <Icon.Msg size={13}/> SMS
                </button>
                <button onClick={() => setChannel("email")} className={channel === "email" ? "active" : ""}>
                  <Icon.Mail size={13}/> Email
                </button>
              </div>
              <div className="row" style={{ gap: 6 }}>
                <Btn size="sm" icon={Icon.Eye}>Test send to me</Btn>
                <Btn size="sm" variant="primary" icon={Icon.Sparkles} onClick={generateWithBrandBrain} disabled={generating}>
                  {generating ? "Drafting..." : "🤖 Generate with Brand AI"}
                </Btn>
              </div>
            </div>

            <div className="card-b">
              {/* Target Vehicle & Language Scopes */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
                <div className="field">
                  <label>Target Vehicle</label>
                  <select className="select" value={selectedVehicleId} onChange={e => setSelectedVehicleId(e.target.value)}>
                    {VEHICLES.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.year} {v.make} {v.model} ({v.stock})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label>Language Tone</label>
                  <select className="select" value={targetLanguage} onChange={e => setTargetLanguage(e.target.value)}>
                    <option value="en">English (Compliant Tone)</option>
                    <option value="es">Spanish (Bilingual Adaptation)</option>
                  </select>
                </div>
              </div>

              {/* From */}
              <div className="mkt-from" style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 10 }}>
                <span className="muted">From:</span>
                {channel === "sms"
                  ? <span><strong>Wabash Auto</strong> · <span className="mono muted">(317) 555-0100</span></span>
                  : <span><strong>Wabash Auto Sales</strong> · <span className="mono muted">sales@wabashauto.com</span></span>}
              </div>

              {channel === "email" && (
                <div className="field" style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <label>Subject</label>
                    <CharCount value={subject.length} limit={SUBJECT_HINT} mode="hint"/>
                  </div>
                  <input value={subject} onChange={e => setSubject(e.target.value)}
                    className="input" placeholder="Short, punchy subject line..."/>
                </div>
              )}

              {/* Body */}
              <div className="field">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <label>{channel === "sms" ? "Message" : "Body"}</label>
                  {channel === "sms"
                    ? <CharCount value={sms.length} limit={SMS_LIMIT} warn={SMS_WARN}/>
                    : <span className="muted" style={{ fontSize: 11 }}>{body.length} chars · {Math.ceil(body.split(/\s+/).filter(Boolean).length / 200)} min read</span>}
                </div>
                <textarea
                  className="input"
                  rows={channel === "sms" ? 5 : 10}
                  value={channel === "sms" ? sms : body}
                  onChange={e => channel === "sms" ? setSms(e.target.value) : setBody(e.target.value)}
                  placeholder={channel === "sms"
                    ? "Hi {first_name}, ..."
                    : "Write your email body. Use tokens to personalize."}/>
              </div>

              {/* Tokens */}
              <div className="mkt-tokens">
                <span className="muted" style={{ fontSize: 11, fontWeight: 500 }}>Insert token:</span>
                {TOKENS.map(t => (
                  <button key={t} className="chip" onClick={() => insertToken(t)}>
                    <span className="mono">{t}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="card" style={{ marginTop: 14 }}>
            <div className="card-h">
              <h3>Preview</h3>
              <span className="muted" style={{ fontSize: 11 }}>How it'll look for Marcus W.</span>
            </div>
            <div className="card-b">
              {channel === "sms" ? <SMSPreview text={sms} previewFn={previewTokens}/> : <EmailPreview subject={subject} body={body} previewFn={previewTokens}/>}
            </div>
          </div>
        </main>

        {/* ---------- RIGHT — RECIPIENTS & TIMING ---------- */}
        <aside className="mkt-side">
          <div className="card">
            <div className="card-h">
              <h3>Recipients</h3>
            </div>
            <div className="card-b col" style={{ gap: 6 }}>
              {MKT_RECIPIENTS.map(r => {
                const sel = r.id === recipientId;
                return (
                  <button key={r.id} onClick={() => setRecipientId(r.id)}
                    className={`mkt-recip ${sel ? "active" : ""}`}>
                    <span style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid " + (sel ? "var(--primary)" : "var(--border-strong)"), display: "grid", placeItems: "center", flex: "0 0 14px" }}>
                      {sel && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--primary)" }}/>}
                    </span>
                    <span style={{ flex: 1, fontSize: 12.5 }}>{r.label}</span>
                    {r.count > 0 && <span className="mono muted" style={{ fontSize: 11.5 }}>{r.count.toLocaleString()}</span>}
                    {r.id === "custom" && <Icon.Filter size={11} className="ico"/>}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="card" style={{ marginTop: 14 }}>
            <div className="card-h">
              <h3>Send timing</h3>
            </div>
            <div className="card-b col" style={{ gap: 10 }}>
              <div className="mkt-tabs">
                <button onClick={() => setTiming("now")} className={timing === "now" ? "active" : ""}>Send now</button>
                <button onClick={() => setTiming("later")} className={timing === "later" ? "active" : ""}>Schedule</button>
              </div>

              {timing === "later" && (
                <div className="col" style={{ gap: 8 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <div className="field">
                      <label>Date</label>
                      <input type="date" className="input mono" value={date} onChange={e => setDate(e.target.value)}/>
                    </div>
                    <div className="field">
                      <label>Time</label>
                      <input type="time" className="input mono" value={time} onChange={e => setTime(e.target.value)}/>
                    </div>
                  </div>
                </div>
              )}

              <div className="field">
                <label>Frequency</label>
                <div className="mkt-tabs">
                  {["one-time","daily","weekly"].map(f => (
                    <button key={f} onClick={() => setFrequency(f)} className={frequency === f ? "active" : ""}>
                      {f === "one-time" ? "One-time" : f === "daily" ? "Daily" : "Weekly"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mkt-reach">
                <Icon.Users size={14} className="ico"/>
                <span>Will reach <strong className="mono">{recipient.count.toLocaleString()}</strong> {recipient.label.toLowerCase()}</span>
              </div>

              {channel === "sms" && (
                <div className="mkt-est">
                  <Icon.Dollar size={11} className="ico"/>
                  <span>Est. cost: <span className="mono">${(recipient.count * 0.012).toFixed(2)}</span></span>
                  <span className="muted" style={{ marginLeft: "auto", fontSize: 10.5 }}>$0.012/msg</span>
                </div>
              )}
              {channel === "email" && (
                <div className="mkt-est" style={{ background: "rgba(16, 185, 129, 0.08)", border: "1px solid rgba(16, 185, 129, 0.2)", borderRadius: "var(--radius)", padding: "6px 8px" }}>
                  <Icon.CheckCircle size={12} style={{ color: "var(--success)" }}/>
                  <span>Est. cost: <span className="mono" style={{ color: "var(--success)", fontWeight: 700 }}>$0.00 (Unlimited Free!)</span></span>
                </div>
              )}
            </div>
            <div style={{ padding: 12, borderTop: "1px solid var(--border)", display: "grid", gridTemplateColumns: "1fr 2fr", gap: 6 }}>
              <button className="btn" onClick={() => { loadTemplate("custom"); toast("Composer cleared"); }}>Cancel</button>
              <button className="btn primary" onClick={send}>
                <Icon.Send size={13}/>
                {timing === "now" ? "Send campaign" : "Schedule campaign"}
              </button>
            </div>
          </div>

          <div className="card" style={{ marginTop: 14 }}>
            <div className="card-h">
              <h3>Recent campaigns</h3>
            </div>
            <div className="card-b" style={{ padding: 0 }}>
              {[
                { name: "Tax Refund — SMS blast", when: "May 8", reach: 412, opens: 38, ch: "sms" },
                { name: "Memorial Day Sale — Email", when: "May 1", reach: 802, opens: 211, ch: "email" },
                { name: "F-150 Restock — SMS", when: "Apr 24", reach: 96, opens: 12, ch: "sms" },
              ].map((c, i, arr) => (
                <div key={i} style={{ padding: "10px 14px", borderBottom: i < arr.length - 1 ? "1px solid var(--border)" : "none", display: "flex", alignItems: "center", gap: 10 }}>
                  <div className="ch-badge" style={{ background: c.ch === "sms" ? "#64748B" : "#0891B2", width: 22, height: 22, flexBasis: 22 }}>
                    {c.ch === "sms" ? <Icon.Msg size={11}/> : <Icon.Mail size={11}/>}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 12 }}>{c.name}</div>
                    <div className="muted" style={{ fontSize: 11 }}>{c.when} · {c.reach} reached · {c.opens} {c.ch === "sms" ? "replies" : "opens"}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function CharCount({ value, limit, warn, mode }) {
  const over = value > limit;
  const warning = warn ? value >= warn : (mode === "hint" && value > limit);
  const color = over ? "var(--danger)" : warning ? "var(--warning)" : "var(--text-2)";
  return (
    <span className="mono" style={{ fontSize: 11, color, fontWeight: warning || over ? 600 : 400 }}>
      {value}/{limit}{mode === "hint" && over ? " · long" : ""}
    </span>
  );
}

function SMSPreview({ text, previewFn }) {
  const rendered = previewFn(text || "Your message will appear here.");
  return (
    <div className="mkt-phone">
      <div className="mkt-phone-head">
        <Icon.ChevronLeft size={14}/>
        <div style={{ flex: 1, textAlign: "center" }}>
          <div style={{ fontWeight: 600, fontSize: 11.5 }}>Wabash Auto</div>
          <div style={{ fontSize: 10, color: "var(--text-2)" }}>SMS</div>
        </div>
        <Icon.Phone size={14}/>
      </div>
      <div className="mkt-phone-body">
        <div className="mkt-bubble-time">Today 10:02 AM</div>
        <div className="mkt-bubble">{rendered}</div>
        <div className="mkt-bubble-meta">Delivered</div>
      </div>
    </div>
  );
}

function EmailPreview({ subject, body, previewFn }) {
  const subj = previewFn(subject || "(no subject)");
  const bod = previewFn(body || "Your email body will appear here.");
  return (
    <div className="mkt-email">
      <div className="mkt-email-head">
        <div className="avatar" style={{ background: "var(--primary-100)", color: "var(--primary-700)" }}>WA</div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontWeight: 600, fontSize: 12.5 }}>Wabash Auto Sales</span>
            <span className="muted" style={{ fontSize: 11 }}>10:02 AM</span>
          </div>
          <div className="muted" style={{ fontSize: 11.5 }}>to Marcus Williams · sales@wabashauto.com</div>
        </div>
      </div>
      <div className="mkt-email-subj">{subj}</div>
      <div className="mkt-email-body">{bod}</div>
      <div className="mkt-email-foot">
        Wabash Auto Sales · 2451 W Washington St, Indianapolis IN · (317) 555-0100
        <br/><a href="#" onClick={(e) => e.preventDefault()} style={{ color: "var(--text-2)" }}>Unsubscribe</a>
      </div>
    </div>
  );
}


export { Marketing };
