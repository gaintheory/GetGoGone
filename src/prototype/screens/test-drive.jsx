import React from 'react';
import { Icon } from '../icons';
import { GGG } from '../data';
import { UI } from '../ui';

function TestDrive({ nav, toast, vehicles: providedVehicles }) {
  const { VEHICLES, fmt$, fmtMi } = GGG;
  const { Pill, Btn, VehicleThumb } = UI;
  const allVehicles = providedVehicles || [];

  const [source, setSource] = React.useState("Walk-in");
  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [budget, setBudget] = React.useState("");
  // Demo: pre-populated so the multi-vehicle profile is visible on first load
  const [vehicleIds, setVehicleIds] = React.useState(() => allVehicles.slice(0, 2).map(v => v.id));
  const [expandedId, setExpandedId] = React.useState(() => allVehicles[0]?.id || null);
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const [liked, setLiked] = React.useState("");
  const [objection, setObjection] = React.useState("");
  const [search, setSearch] = React.useState("");

  React.useEffect(() => {
    setTimeout(() => {
      setVehicleIds(ids => {
        const filtered = ids.filter(id => allVehicles.some(v => v.id === id));
        return filtered.length ? filtered : allVehicles.slice(0, 1).map(v => v.id);
      });
    }, 0);
  }, [allVehicles]);

  const vehicles = vehicleIds.map(id => allVehicles.find(v => v.id === id)).filter(Boolean);

  const addVehicle = (id) => {
    if (vehicleIds.includes(id)) return;
    setVehicleIds([...vehicleIds, id]);
    setExpandedId(id);
    setPickerOpen(false);
    setSearch("");
  };
  const removeVehicle = (id) => {
    const next = vehicleIds.filter(x => x !== id);
    setVehicleIds(next);
    if (expandedId === id) setExpandedId(next[0] || null);
    if (next.length === 0) setPickerOpen(true);
  };

  const sources = [
    { id: "Walk-in", icon: Icon.Building, desc: "Stopped by the lot" },
    { id: "Phone Inquiry", icon: Icon.Phone, desc: "Called in for a drive" },
    { id: "Trade-in Appraisal", icon: Icon.Refresh, desc: "Brought their car in" },
  ];

  const filtered = allVehicles
    .filter(v => !vehicleIds.includes(v.id))
    .filter(v => {
      if (!search) return true;
      const s = search.toLowerCase();
      return v.stock.toLowerCase().includes(s)
        || v.vin.toLowerCase().includes(s)
        || `${v.year} ${v.make} ${v.model} ${v.trim} ${v.color}`.toLowerCase().includes(s);
    });

  // Synthesize future-alert criteria across ALL selected vehicles
  const criteria = vehicles.length > 0 ? (() => {
    const bodies = [...new Set(vehicles.map(v => v.body))];
    const prices = vehicles.map(v => v.price);
    const mileages = vehicles.map(v => v.mileage);
    const featCount = {};
    vehicles.forEach(v => v.features.forEach(f => { featCount[f] = (featCount[f] || 0) + 1; }));
    const sharedFeatures = vehicles.length === 1
      ? vehicles[0].features.slice(0, 4)
      : Object.entries(featCount)
          .filter(([_, c]) => c >= 2)
          .sort((a, b) => b[1] - a[1])
          .map(([f]) => f)
          .slice(0, 4);
    return {
      bodies,
      priceMin: Math.floor(Math.min(...prices) * 0.85 / 500) * 500,
      priceMax: Math.ceil(Math.max(...prices) * 1.15 / 500) * 500,
      mileageMax: Math.ceil((Math.max(...mileages) + 20000) / 5000) * 5000,
      sharedFeatures,
      isCrossBody: bodies.length > 1,
    };
  })() : null;

  const futureMatches = criteria ? allVehicles.filter(v =>
    !vehicleIds.includes(v.id)
    && criteria.bodies.includes(v.body)
    && v.price >= criteria.priceMin
    && v.price <= criteria.priceMax
  ).slice(0, 3) : [];

  const canSave = name.trim() && phone.trim() && vehicleIds.length > 0;

  const onSave = () => {
    const tag = vehicleIds.length > 1
      ? `Lead created · ${vehicleIds.length} vehicles · tagged “In-Store Test Drive”`
      : `Lead created · tagged “In-Store Test Drive”`;
    toast(tag);
    setTimeout(() => nav("leads"), 700);
  };

  const initials = (name.trim() || "").split(/\s+/).map(s => s[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Sticky header */}
      <div style={{
        padding: "14px 22px", borderBottom: "1px solid var(--border)", background: "var(--surface)",
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexShrink: 0,
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <h1 style={{ margin: 0, fontSize: 19, fontWeight: 600, letterSpacing: "-0.015em" }}>Test drive capture</h1>
            <Pill tone="amber" dot>In-store</Pill>
          </div>
          <div className="muted" style={{ fontSize: 12.5, marginTop: 2 }}>
            Quick lead entry · every vehicle they drove becomes matching criteria for future alerts
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div className="muted" style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
            <Icon.MapPin size={12}/>
            Wabash Auto · <strong style={{ color: "var(--text)", fontWeight: 600 }}>Ray Lawson</strong>
          </div>
          <div style={{ width: 1, height: 22, background: "var(--border)" }}/>
          <Btn onClick={() => nav("leads")}>Cancel</Btn>
          <Btn variant="primary" icon={Icon.Check} disabled={!canSave} onClick={onSave}>Save lead</Btn>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflow: "auto", background: "var(--bg)" }}>
        <div style={{ maxWidth: 1260, margin: "0 auto", padding: "22px 22px 48px",
          display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 22 }}>

          {/* ============ LEFT — lead ============ */}
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

            <Section number={1} title="How did they come in?" hint="Required">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                {sources.map(s => {
                  const I = s.icon, active = source === s.id;
                  return (
                    <button key={s.id} onClick={() => setSource(s.id)} style={{
                      display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 8,
                      padding: "12px 12px 10px", background: active ? "var(--primary-50)" : "var(--surface)",
                      border: `1px solid ${active ? "var(--primary)" : "var(--border)"}`,
                      boxShadow: active ? "0 0 0 1px var(--primary)" : "none",
                      borderRadius: "var(--radius-lg)", cursor: "pointer", fontFamily: "inherit", textAlign: "left",
                    }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: "var(--radius)", display: "grid", placeItems: "center",
                        background: active ? "var(--primary)" : "var(--gray-100)",
                        color: active ? "#fff" : "var(--text-2)",
                      }}>
                        <I size={14}/>
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 12.5, color: active ? "var(--primary-700)" : "var(--text)" }}>{s.id}</div>
                        <div className="muted" style={{ fontSize: 11.5, marginTop: 1 }}>{s.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </Section>

            <Section number={2} title="Customer">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div className="field" style={{ gridColumn: "1 / -1" }}>
                  <label>Name <span style={{ color: "var(--danger)" }}>*</span></label>
                  <input className="input" autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="First and last"/>
                </div>
                <div className="field">
                  <label>Phone <span style={{ color: "var(--danger)" }}>*</span></label>
                  <input className="input mono" value={phone} onChange={e => setPhone(e.target.value)} placeholder="(317) 555-0000"/>
                </div>
                <div className="field">
                  <label>Email</label>
                  <input className="input" value={email} onChange={e => setEmail(e.target.value)} placeholder="optional"/>
                </div>
                <div className="field" style={{ gridColumn: "1 / -1" }}>
                  <label>Budget <span className="muted" style={{ fontWeight: 400 }}>· optional</span></label>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {["Under $250/mo","$250–$350/mo","$350–$450/mo","$450+/mo","Cash buyer"].map(b => (
                      <button key={b} className={`chip ${budget === b ? "active" : ""}`} onClick={() => setBudget(budget === b ? "" : b)}>
                        {b}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </Section>

            <Section number={4} title="Conversation" hint="What stuck and what didn't?">
              <div className="field" style={{ marginBottom: 10 }}>
                <label>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                    <Icon.Star size={11} color="var(--success)"/> What did they like?
                  </span>
                </label>
                <textarea className="input" rows={3} value={liked} onChange={e => setLiked(e.target.value)}
                  placeholder="e.g. Loved how the F-150 drove, said the leather in the Malibu was clean, kids fit easy in the Caravan…"/>
              </div>
              <div className="field">
                <label>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                    <Icon.AlertTriangle size={11} color="var(--warning)"/> Any objections?
                  </span>
                </label>
                <textarea className="input" rows={3} value={objection} onChange={e => setObjection(e.target.value)}
                  placeholder="e.g. Wants under $300/mo, color isn't right, needs co-signer first…"/>
              </div>
            </Section>
          </div>

          {/* ============ RIGHT — vehicles ============ */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Section
              number={3}
              title="Vehicles test driven"
              hint={vehicles.length === 0 ? "Most customers drive 2–3" : `${vehicles.length} selected`}
              action={vehicles.length > 0 && !pickerOpen && (
                <button className="cb-link" onClick={() => setPickerOpen(true)}>
                  <Icon.Plus size={11}/> Add another vehicle
                </button>
              )}
            >
              {/* Stacked selected cards */}
              {vehicles.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: pickerOpen ? 10 : 0 }}>
                  {vehicles.map((v, i) => (
                    <VehicleCard
                      key={v.id}
                      v={v}
                      index={i + 1}
                      expanded={expandedId === v.id}
                      onToggle={() => setExpandedId(expandedId === v.id ? null : v.id)}
                      onRemove={() => removeVehicle(v.id)}
                    />
                  ))}
                </div>
              )}

              {/* Picker */}
              {pickerOpen && (
                <VehiclePicker
                  filtered={filtered}
                  search={search}
                  setSearch={setSearch}
                  onPick={addVehicle}
                  onCancel={vehicles.length > 0 ? () => setPickerOpen(false) : null}
                  showHeader={vehicles.length > 0}
                />
              )}
            </Section>

            {criteria && <FutureAlerts vehicles={vehicles} criteria={criteria} matches={futureMatches} name={name} nav={nav}/>}
            {vehicles.length > 0 && (
              <SaveSummary
                name={name} initials={initials} phone={phone} source={source}
                vehicles={vehicles} canSave={canSave} onSave={onSave}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============ Section helper ============ */
function Section({ number, title, hint, action, children }) {
  return (
    <section>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <div style={{
            width: 20, height: 20, borderRadius: "50%",
            background: "var(--gray-100)", color: "var(--text-2)",
            display: "grid", placeItems: "center",
            fontSize: 11, fontWeight: 700, fontVariantNumeric: "tabular-nums",
          }}>{number}</div>
          <h3 style={{ margin: 0, fontSize: 13.5, fontWeight: 600, letterSpacing: "-0.005em" }}>{title}</h3>
          {hint && <span className="muted" style={{ fontSize: 11.5 }}>· {hint}</span>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

/* ============ Vehicle picker (search + list) ============ */
function VehiclePicker({ filtered, search, setSearch, onPick, onCancel, showHeader }) {
  const { fmt$, fmtMi } = GGG;
  const { VehicleThumb } = UI;
  return (
    <div className="card" style={{ overflow: "hidden", borderColor: showHeader ? "var(--primary)" : "var(--border)", boxShadow: showHeader ? "0 0 0 1px var(--primary)" : "none" }}>
      {showHeader && (
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "8px 12px",
          background: "var(--primary-50)",
          borderBottom: "1px solid var(--border)",
          color: "var(--primary-700)",
          fontSize: 11.5, fontWeight: 600,
        }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <Icon.Plus size={12}/> Add another vehicle they drove
          </span>
          {onCancel && (
            <button onClick={onCancel} className="icon-btn" style={{ width: 22, height: 22, color: "var(--primary-700)" }}>
              <Icon.X size={13}/>
            </button>
          )}
        </div>
      )}
      <div style={{ padding: 12, borderBottom: "1px solid var(--border)", position: "relative" }}>
        <Icon.Search size={13} className="ico"
          style={{ position: "absolute", left: 22, top: "50%", transform: "translateY(-50%)", color: "var(--text-2)" }}/>
        <input
          className="input"
          autoComplete="off"
          autoFocus={showHeader}
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by VIN, stock #, year, make, model, color…"
          style={{ paddingLeft: 30, background: "var(--gray-50)" }}
        />
      </div>
      <div style={{ maxHeight: 320, overflow: "auto" }}>
        {filtered.length === 0 && (
          <div style={{ padding: 26, textAlign: "center", color: "var(--text-2)", fontSize: 12.5 }}>
            {search ? "No matches in current inventory." : "All inventory already added."}
          </div>
        )}
        {filtered.map((v, i) => (
          <button key={v.id} onClick={() => onPick(v.id)} style={{
            display: "flex", gap: 10, alignItems: "center", width: "100%",
            padding: "10px 12px",
            background: "transparent", border: "none",
            borderBottom: i < filtered.length - 1 ? "1px solid var(--border)" : "none",
            cursor: "pointer", fontFamily: "inherit", textAlign: "left",
          }}
          onMouseEnter={e => e.currentTarget.style.background = "var(--gray-50)"}
          onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
            <VehicleThumb v={v}/>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 12.5 }}>
                {v.year} {v.make} {v.model}{" "}
                <span className="muted" style={{ fontWeight: 400 }}>{v.trim}</span>
              </div>
              <div className="muted mono" style={{ fontSize: 11, display: "flex", gap: 8, marginTop: 1 }}>
                <span>{v.stock}</span>
                <span>·</span>
                <span style={{ color: "var(--text)", fontWeight: 600 }}>{fmt$(v.price)}</span>
                <span>·</span>
                <span>{fmtMi(v.mileage)}</span>
                <span>·</span>
                <span>{v.color}</span>
              </div>
            </div>
            <span className="cb-link" style={{ fontSize: 11 }}>
              <Icon.Plus size={11}/> Add
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ============ Selected vehicle card (collapsible) ============ */
function VehicleCard({ v, index, expanded, onToggle, onRemove }) {
  const { fmt$, fmtMi } = GGG;
  const { Pill, VehicleThumb } = UI;
  const bodyLabel = { sedan: "Sedan", truck: "Truck", suv: "SUV", van: "Minivan" }[v.body] || v.body;

  const meta = [
    ["Year", v.year],
    ["Make", v.make],
    ["Model", `${v.model} ${v.trim}`],
    ["Body type", bodyLabel],
    ["Color", v.color],
    ["Mileage", fmtMi(v.mileage)],
    ["Price", fmt$(v.price)],
    ["Stock #", v.stock],
  ];

  return (
    <div className="card" style={{ overflow: "hidden" }}>
      {/* Header strip — always visible, click to toggle */}
      <div
        onClick={onToggle}
        style={{
          display: "flex", gap: 12, padding: "10px 12px",
          cursor: "pointer", alignItems: "center",
          background: expanded ? "var(--gray-50)" : "var(--surface)",
          borderBottom: expanded ? "1px solid var(--border)" : "none",
        }}>
        <div style={{
          width: 22, height: 22, borderRadius: "50%",
          background: "#111827", color: "#fff",
          display: "grid", placeItems: "center",
          fontSize: 10.5, fontWeight: 700, fontVariantNumeric: "tabular-nums",
          flexShrink: 0,
        }}>{index}</div>
        <VehicleThumb v={v}/>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 13, letterSpacing: "-0.005em" }}>
            {v.year} {v.make} {v.model}{" "}
            <span className="muted" style={{ fontWeight: 400 }}>{v.trim}</span>
          </div>
          <div className="muted mono" style={{ fontSize: 11, display: "flex", gap: 7, marginTop: 1 }}>
            <span style={{ color: "var(--text)", fontWeight: 600 }}>{fmt$(v.price)}</span>
            <span>·</span>
            <span>{fmtMi(v.mileage)}</span>
            <span>·</span>
            <span>{v.color}</span>
          </div>
        </div>
        <span style={{ color: "var(--text-2)", display: "inline-flex", alignItems: "center", gap: 2, fontSize: 11 }}>
          {expanded ? "Collapse" : "Details"}
          <Icon.ChevronDown size={12} style={{ transform: expanded ? "rotate(180deg)" : "none", transition: "transform .15s" }}/>
        </span>
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="icon-btn"
          title="Remove"
          style={{ width: 26, height: 26, color: "var(--text-2)" }}>
          <Icon.X size={13}/>
        </button>
      </div>

      {/* Expanded body */}
      {expanded && (
        <>
          <div style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "7px 14px",
            background: "var(--success-50)",
            borderBottom: "1px solid var(--border)",
            color: "var(--success)",
          }}>
            <Icon.Zap size={11}/>
            <span style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Auto-captured · saved as part of customer profile
            </span>
          </div>
          <div style={{ padding: "12px 14px" }}>
            <dl style={{ margin: 0,
              display: "grid", gridTemplateColumns: "auto 1fr auto 1fr",
              rowGap: 7, columnGap: 14, fontSize: 12.5, alignItems: "baseline",
            }}>
              {meta.map(([k, val]) => (
                <React.Fragment key={k}>
                  <dt className="muted" style={{ fontSize: 11.5 }}>{k}</dt>
                  <dd style={{ margin: 0, fontWeight: 600 }}>{val}</dd>
                </React.Fragment>
              ))}
            </dl>
            <div style={{ height: 1, background: "var(--border)", margin: "10px 0" }}/>
            <div className="muted" style={{ fontSize: 10.5, fontWeight: 700, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              VIN
            </div>
            <div className="mono" style={{ fontSize: 12, fontWeight: 500, marginBottom: 10 }}>{v.vin}</div>
            <div className="muted" style={{ fontSize: 10.5, fontWeight: 700, marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Key features
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {v.features.map(f => <Pill key={f}>{f}</Pill>)}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ============ Future inventory-alert preview ============ */
function FutureAlerts({ vehicles, criteria, matches, name, nav }) {
  const { fmt$, fmtMi } = GGG;
  const { Pill, VehicleThumb } = UI;
  const bodyLabelMap = { sedan: "Sedan", truck: "Truck", suv: "SUV", van: "Minivan" };
  const customerLabel = name.trim() || "this customer";

  return (
    <div style={{
      background: "var(--surface)",
      border: "1px solid var(--border)",
      borderRadius: "var(--radius-lg)",
      overflow: "hidden",
    }}>
      <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--border)",
        display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 24, height: 24, borderRadius: "var(--radius)",
            background: "var(--primary-50)", color: "var(--primary)",
            display: "grid", placeItems: "center",
          }}>
            <Icon.Bell size={13}/>
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 13 }}>Future inventory alerts</div>
            <div className="muted" style={{ fontSize: 11.5 }}>
              Synthesized from {vehicles.length} {vehicles.length === 1 ? "vehicle" : "vehicles"} they drove
            </div>
          </div>
        </div>
        <Pill tone="blue" dot>Active on save</Pill>
      </div>

      <div style={{ padding: 14 }}>
        <div style={{ fontSize: 12.5, color: "var(--text-2)", marginBottom: 10, lineHeight: 1.5 }}>
          Wabash will text <strong style={{ color: "var(--text)" }}>{customerLabel}</strong> when a new vehicle hits the lot matching:
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 12 }}>
          {criteria.bodies.map(b => (
            <CritChip key={b} icon={Icon.Car}>{bodyLabelMap[b] || b}</CritChip>
          ))}
          <CritChip icon={Icon.Dollar}>{fmt$(criteria.priceMin)}–{fmt$(criteria.priceMax)}</CritChip>
          <CritChip icon={Icon.Clock}>Under {fmtMi(criteria.mileageMax)}</CritChip>
          {criteria.sharedFeatures.map(f => <CritChip key={f} icon={Icon.Check}>{f}</CritChip>)}
        </div>

        {vehicles.length > 1 && (
          <div style={{
            padding: "8px 10px", background: "var(--warning-50)",
            border: "1px solid var(--warning-100)", borderRadius: "var(--radius)",
            fontSize: 11.5, color: "#92400E", marginBottom: 12,
            display: "flex", alignItems: "flex-start", gap: 6,
          }}>
            <Icon.Sparkles size={12} style={{ marginTop: 1, flexShrink: 0 }}/>
            <div>
              <strong>Cross-shopping detected.</strong>{" "}
              {criteria.isCrossBody
                ? `${customerLabel} drove ${criteria.bodies.map(b => bodyLabelMap[b] || b).join(" and ")} — we'll alert on either.`
                : `Price band widened to cover all ${vehicles.length} test drives. Shared features only.`}
            </div>
          </div>
        )}

        <div style={{ height: 1, background: "var(--border)", margin: "0 0 12px" }}/>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <div className="muted" style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            {matches.length} similar in stock today
          </div>
          <span className="muted" style={{ fontSize: 11 }}>Preview only — alerts fire on new arrivals</span>
        </div>

        {matches.length === 0 && (
          <div style={{ padding: 14, textAlign: "center", background: "var(--gray-50)", borderRadius: "var(--radius)", color: "var(--text-2)", fontSize: 12 }}>
            No close matches right now — alerts will catch the next one.
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {matches.map(v => (
            <button key={v.id} onClick={() => nav("vehicle", v.id)} style={{
              display: "flex", gap: 10, alignItems: "center",
              padding: "8px 10px",
              background: "var(--gray-50)",
              borderRadius: "var(--radius)",
              border: "1px solid var(--border)",
              cursor: "pointer", fontFamily: "inherit", textAlign: "left",
            }}>
              <VehicleThumb v={v}/>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 12 }}>
                  {v.year} {v.make} {v.model} <span className="muted" style={{ fontWeight: 400 }}>{v.trim}</span>
                </div>
                <div className="muted mono" style={{ fontSize: 11 }}>
                  {fmt$(v.price)} · {fmtMi(v.mileage)} · {v.color}
                </div>
              </div>
              <Pill tone="green">Match</Pill>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function CritChip({ icon: I, children }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "4px 8px",
      background: "var(--primary-50)",
      color: "var(--primary-700)",
      borderRadius: "var(--radius)",
      fontSize: 11.5, fontWeight: 600,
      border: "1px solid var(--primary-100)",
    }}>
      <I size={11}/> {children}
    </span>
  );
}

/* ============ Save summary card ============ */
function SaveSummary({ name, initials, phone, source, vehicles, canSave, onSave }) {
  const v0 = vehicles[0];
  const vehiclePreview = vehicles.length === 1
    ? `${v0.year} ${v0.make} ${v0.model}`
    : `${v0.year} ${v0.make} ${v0.model} +${vehicles.length - 1} more`;

  return (
    <div style={{
      background: "#111827", color: "#fff",
      borderRadius: "var(--radius-lg)",
      padding: 14,
      display: "flex", alignItems: "center", gap: 12,
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: "var(--radius)",
        background: "rgba(255,255,255,0.08)",
        display: "grid", placeItems: "center",
        fontWeight: 600, fontSize: 13,
        letterSpacing: "0.02em",
      }}>
        {initials || <Icon.Plus size={16}/>}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>
          Lead preview
        </div>
        <div style={{ fontWeight: 600, fontSize: 13, marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {name.trim() || <span style={{ color: "rgba(255,255,255,0.45)" }}>Customer name…</span>}
          <span style={{ color: "rgba(255,255,255,0.55)", fontWeight: 400 }}> · {vehiclePreview}</span>
        </div>
        <div style={{ display: "flex", gap: 6, marginTop: 5, flexWrap: "wrap" }}>
          <TagDark>In-Store Test Drive</TagDark>
          <TagDark>{source}</TagDark>
          {vehicles.length > 1 && <TagDark>{vehicles.length} vehicles</TagDark>}
          {phone.trim() && <TagDark mono>{phone}</TagDark>}
        </div>
      </div>
      <button
        onClick={onSave}
        disabled={!canSave}
        style={{
          background: canSave ? "var(--primary)" : "rgba(255,255,255,0.1)",
          color: canSave ? "#fff" : "rgba(255,255,255,0.4)",
          border: "none",
          borderRadius: "var(--radius)",
          padding: "8px 14px",
          fontFamily: "inherit", fontSize: 12.5, fontWeight: 600,
          cursor: canSave ? "pointer" : "not-allowed",
          display: "inline-flex", alignItems: "center", gap: 6,
          whiteSpace: "nowrap",
        }}>
        <Icon.Check size={13}/> Save lead
      </button>
    </div>
  );
}

function TagDark({ children, mono }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      background: "rgba(255,255,255,0.08)",
      color: "rgba(255,255,255,0.85)",
      borderRadius: 999,
      padding: "2px 8px",
      fontSize: 10.5, fontWeight: 500,
      fontVariantNumeric: mono ? "tabular-nums" : "normal",
      fontFamily: mono ? "ui-monospace, Menlo, monospace" : "inherit",
    }}>{children}</span>
  );
}


export { TestDrive };
