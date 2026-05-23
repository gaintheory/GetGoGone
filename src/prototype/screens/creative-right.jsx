import React from 'react';
import { Icon } from '../icons';
import { GGG } from '../data';
import { UI } from '../ui';

// Creative Builder — Right sidebar (layer settings, export, AI) — light theme

function CBRightSidebar({ tab, onTab, selected, selectedId, layers, onSelect, onUpdateLayer, onDeleteLayer, onDuplicateLayer, onMoveLayer, onToggleLayerLock, sizeId, onSize, exportSizes, brand, onBrand, vars, onAI, onGenerateVariations, onSaveVersion, onExport }) {
  const tabs = [
    { id: "layer", label: "Layer" },
    { id: "stack", label: "Stack" },
    { id: "ai", label: "AI" },
    { id: "export", label: "Export" },
  ];
  return (
    <aside style={{
      background: "var(--surface)",
      borderLeft: "1px solid var(--border)",
      display: "flex", flexDirection: "column",
      overflow: "hidden",
      color: "var(--text)", fontSize: 12.5,
    }}>
      <div style={{ display: "flex", borderBottom: "1px solid var(--border)" }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => onTab(t.id)}
            style={{
              flex: 1, padding: "10px 8px", background: "transparent",
              color: tab === t.id ? "var(--text)" : "var(--text-2)",
              border: "none",
              borderBottom: tab === t.id ? "2px solid #111827" : "2px solid transparent",
              cursor: "pointer", fontFamily: "inherit", fontWeight: 600, fontSize: 12,
            }}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ overflow: "auto", padding: 14, flex: 1 }}>
        {tab === "layer" && <LayerInspector selected={selected} onUpdateLayer={onUpdateLayer} onDeleteLayer={onDeleteLayer} onDuplicateLayer={onDuplicateLayer} onMoveLayer={onMoveLayer} onToggleLayerLock={onToggleLayerLock} brand={brand} vars={vars}/>}
        {tab === "stack" && <LayerStack layers={layers} selectedId={selectedId} onSelect={onSelect} onMoveLayer={onMoveLayer} onDuplicateLayer={onDuplicateLayer} onToggleLayerLock={onToggleLayerLock} onDeleteLayer={onDeleteLayer}/>}
        {tab === "ai" && <AIPanel onAI={onAI} onGenerateVariations={onGenerateVariations} hasSelection={!!selected}/>}
        {tab === "export" && <ExportPanel sizeId={sizeId} onSize={onSize} exportSizes={exportSizes}/>}
      </div>

      <div style={{ borderTop: "1px solid var(--border)", padding: 10, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
        <button onClick={onSaveVersion} className="cb-btn">
          <Icon.CheckCircle size={12}/> Save creative
        </button>
        <button onClick={onExport} className="cb-btn primary">
          <Icon.Download size={12}/> Export PNG
        </button>
      </div>
    </aside>
  );
}

function LayerInspector({ selected, onUpdateLayer, onDeleteLayer, onDuplicateLayer, onMoveLayer, onToggleLayerLock, brand, vars }) {
  if (!selected) {
    return (
      <div style={{ textAlign: "center", padding: 30, color: "var(--text-2)", fontSize: 12 }}>
        <Icon.Image size={28} style={{ opacity: 0.4 }}/>
        <div style={{ marginTop: 8, fontWeight: 500, color: "var(--text)" }}>Nothing selected</div>
        <div style={{ marginTop: 4, fontSize: 11, lineHeight: 1.5 }}>Click any layer on the canvas to edit text, color, size, or position. Drag to move. ⌫ to delete.</div>
      </div>
    );
  }

  const update = (patch) => onUpdateLayer(selected.id, patch);

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-3)", letterSpacing: "0.08em" }}>SELECTED</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", marginTop: 1, textTransform: "capitalize" }}>
            {selected.role || selected.type.replace("-", " ")}
          </div>
        </div>
        {!selected.protected && (
          <div className="row" style={{ gap: 4 }}>
            <button onClick={() => onMoveLayer(selected.id, "down")} className="cb-icon-btn" title="Move backward" disabled={selected.locked}>
              <Icon.ChevronDown size={13}/>
            </button>
            <button onClick={() => onMoveLayer(selected.id, "up")} className="cb-icon-btn" title="Move forward" disabled={selected.locked}>
              <Icon.ChevronRight size={13} style={{ transform: "rotate(-90deg)" }}/>
            </button>
            <button onClick={() => onToggleLayerLock(selected.id)} className="cb-icon-btn" title={selected.locked ? "Unlock" : "Lock"}>
              {selected.locked ? <Icon.Eye size={13}/> : <Icon.Check size={13}/>}
            </button>
            <button onClick={() => onDuplicateLayer(selected.id)} className="cb-icon-btn" title="Duplicate" disabled={selected.locked}>
              <Icon.Copy size={13}/>
            </button>
            <button onClick={() => onDeleteLayer(selected.id)} className="cb-icon-btn" title="Delete (Del)" disabled={selected.locked}>
              <Icon.Trash size={13}/>
            </button>
          </div>
        )}
      </div>

      {selected.locked && (
        <div style={{ background: "var(--gray-50)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: 9, marginBottom: 12, fontSize: 11.5, color: "var(--text-2)", lineHeight: 1.45 }}>
          This layer is locked. Unlock it from the Stack or toolbar controls to move, resize, or edit it.
        </div>
      )}

      {selected.type === "text" && !selected.locked && (
        <>
          <CBSection title="CONTENT">
            <textarea value={selected.text} onChange={e => update({ text: e.target.value })} className="cb-input" rows={3} style={{ resize: "vertical" }}/>
            <div style={{ display: "flex", gap: 4, marginTop: 4, flexWrap: "wrap" }}>
              {["{{year}}","{{make}}","{{model}}","{{price}}","{{down_payment}}","{{weekly_payment}}","{{mileage}}","{{phone}}"].map(v => (
                <button key={v} className="cb-chip mono" onClick={() => update({ text: (selected.text || "") + " " + v })}>{v}</button>
              ))}
            </div>
          </CBSection>

          <CBSection title="TYPOGRAPHY">
            <CBSlider label="Size" value={selected.size} min={1} max={25} step={0.1} onChange={v => update({ size: v })} unit=""/>
            <CBRadio label="Weight" value={selected.weight} options={[
              { v: 400, l: "Reg" }, { v: 600, l: "Semi" }, { v: 700, l: "Bold" }, { v: 800, l: "Heavy" }, { v: 900, l: "Black" }
            ]} onChange={v => update({ weight: Number(v) })}/>
            <CBRadio label="Align" value={selected.align || "left"} options={[
              { v: "left", l: "←" }, { v: "center", l: "↔" }, { v: "right", l: "→" },
            ]} onChange={v => update({ align: v })}/>
            <CBSlider label="Letter spacing" value={selected.letterSpacing || 0} min={-0.05} max={0.2} step={0.01} onChange={v => update({ letterSpacing: v })}/>
          </CBSection>

          <CBSection title="COLOR">
            <CBColorRow value={selected.color} onChange={c => update({ color: c })} brand={brand}/>
          </CBSection>

          <CBSection title="STYLE">
            <label className="cb-check"><input type="checkbox" checked={!!selected.strike} onChange={e => update({ strike: e.target.checked })}/>Strikethrough</label>
            <label className="cb-check"><input type="checkbox" checked={!!selected.pad} onChange={e => update({ pad: e.target.checked })}/>Background pill</label>
            {selected.pad && <CBColorRow value={selected.bg || "#DC2626"} onChange={c => update({ bg: c })} brand={brand} label="Pill color"/>}
          </CBSection>
        </>
      )}

      {selected.type === "photo" && !selected.locked && (
        <>
          <CBSection title="PHOTO">
            <button className="cb-btn" style={{ width: "100%" }}>
              <Icon.Image size={12}/> Swap photo
            </button>
          </CBSection>
          <CBSection title="POSITION">
            <CBRadio label="Fit" value={selected.fit || "cover"} options={[
              { v: "cover", l: "Cover" }, { v: "contain", l: "Contain" }, { v: "fill", l: "Fill" },
            ]} onChange={v => update({ fit: v })}/>
            <CBSlider label="Zoom" value={selected.photoZoom || 100} min={50} max={200} step={1} onChange={v => update({ photoZoom: v })} unit="%"/>
          </CBSection>
          <CBSection title="OVERLAY">
            <CBRadio label="Mask" value={selected.mask || "none"} options={[
              { v: "none", l: "None" }, { v: "darken", l: "Darken" }, { v: "fade-left", l: "Fade" },
            ]} onChange={v => update({ mask: v === "none" ? null : v })}/>
          </CBSection>
        </>
      )}

      {selected.type === "stat-row" && !selected.locked && (
        <>
          <CBSection title="STATS">
            {selected.items.map((it, i) => (
              <div key={i} style={{ background: "var(--gray-50)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: 8, marginBottom: 6 }}>
                <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 4 }}>
                  <input value={it.label} onChange={e => {
                    const items = [...selected.items];
                    items[i] = { ...it, label: e.target.value };
                    update({ items });
                  }} className="cb-input" style={{ flex: 1, fontSize: 10.5, padding: "4px 6px" }}/>
                  <label className="cb-check" style={{ flexShrink: 0, fontSize: 10.5 }}>
                    <input type="checkbox" checked={!!it.highlight} onChange={e => {
                      const items = selected.items.map((x, idx) => idx === i ? { ...x, highlight: e.target.checked } : { ...x, highlight: false });
                      update({ items });
                    }}/>Hi
                  </label>
                </div>
                <input value={it.value} onChange={e => {
                  const items = [...selected.items];
                  items[i] = { ...it, value: e.target.value };
                  update({ items });
                }} className="cb-input mono" style={{ fontSize: 11 }}/>
              </div>
            ))}
          </CBSection>
          <CBSection title="COLOR">
            <CBColorRow label="Card" value={selected.bg || "#0F172A"} onChange={c => update({ bg: c })} brand={brand}/>
            <CBColorRow label="Text" value={selected.color || "#FFFFFF"} onChange={c => update({ color: c })} brand={brand}/>
          </CBSection>
        </>
      )}

      {selected.type === "cta" && !selected.locked && (
        <>
          <CBSection title="BUTTON">
            <input value={selected.text} onChange={e => update({ text: e.target.value })} className="cb-input"/>
          </CBSection>
          <CBSection title="COLOR">
            <CBColorRow label="Background" value={selected.bg || "#2563EB"} onChange={c => update({ bg: c })} brand={brand}/>
            <CBColorRow label="Text" value={selected.color || "#FFFFFF"} onChange={c => update({ color: c })} brand={brand}/>
          </CBSection>
        </>
      )}

      {selected.type === "ribbon" && !selected.locked && (
        <>
          <CBSection title="RIBBON">
            <input value={selected.text} onChange={e => update({ text: e.target.value })} className="cb-input"/>
          </CBSection>
          <CBSection title="COLOR">
            <CBColorRow label="Background" value={selected.color} onChange={c => update({ color: c })} brand={brand}/>
            <CBColorRow label="Text" value={selected.textColor} onChange={c => update({ textColor: c })} brand={brand}/>
          </CBSection>
        </>
      )}

      {(selected.type === "shape" || selected.type === "bg") && !selected.locked && (
        <CBSection title="FILL">
          <CBColorRow value={selected.color} onChange={c => update({ color: c })} brand={brand}/>
          {selected.type === "shape" && <CBSlider label="Opacity" value={selected.opacity ?? 1} min={0} max={1} step={0.05} onChange={v => update({ opacity: v })}/>}
        </CBSection>
      )}

      {selected.type === "logo" && !selected.locked && (
        <CBSection title="LOGO">
          <CBRadio label="Variant" value={selected.color || "dark"} options={[
            { v: "dark", l: "Dark" }, { v: "light", l: "Light" },
          ]} onChange={v => update({ color: v })}/>
        </CBSection>
      )}

      {selected.type !== "bg" && !selected.locked && (
        <CBSection title="POSITION & SIZE">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            <CBNumInput label="X" value={selected.x} onChange={v => update({ x: Number(v) })} unit="%"/>
            <CBNumInput label="Y" value={selected.y} onChange={v => update({ y: Number(v) })} unit="%"/>
            <CBNumInput label="W" value={selected.w} onChange={v => update({ w: Number(v) })} unit="%"/>
            <CBNumInput label="H" value={selected.h} onChange={v => update({ h: Number(v) })} unit="%"/>
          </div>
          <div className="muted" style={{ fontSize: 10.5, marginTop: 4 }}>Tip: drag the layer on the canvas, or use arrows to nudge.</div>
        </CBSection>
      )}
    </>
  );
}

function LayerStack({ layers = [], selectedId, onSelect, onMoveLayer, onDuplicateLayer, onToggleLayerLock, onDeleteLayer }) {
  const visibleLayers = [...layers].reverse();
  return (
    <>
      <CBSection title="LAYER ORDER">
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {visibleLayers.map((layer) => {
            const selected = layer.id === selectedId;
            return (
              <div key={layer.id} style={{
                display: "grid",
                gridTemplateColumns: "1fr auto",
                gap: 6,
                alignItems: "center",
                border: selected ? "2px solid var(--primary)" : "1px solid var(--border)",
                borderRadius: "var(--radius)",
                padding: 7,
                background: selected ? "rgba(37,99,235,0.06)" : "var(--surface)",
              }}>
                <button onClick={() => onSelect(layer.id)} style={{
                  border: "none",
                  background: "transparent",
                  padding: 0,
                  textAlign: "left",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  color: "var(--text)",
                  minWidth: 0,
                }}>
                  <div style={{ fontSize: 11.5, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{layerLabel(layer)}</div>
                  <div className="muted mono" style={{ fontSize: 10.5 }}>{layer.type}{layer.locked ? " - locked" : ""}</div>
                </button>
                <div className="row" style={{ gap: 3 }}>
                  {!layer.protected && (
                    <>
                      <button className="cb-icon-btn" title="Backward" onClick={() => onMoveLayer(layer.id, "down")} disabled={layer.locked}><Icon.ChevronDown size={12}/></button>
                      <button className="cb-icon-btn" title="Forward" onClick={() => onMoveLayer(layer.id, "up")} disabled={layer.locked}><Icon.ChevronRight size={12} style={{ transform: "rotate(-90deg)" }}/></button>
                      <button className="cb-icon-btn" title={layer.locked ? "Unlock" : "Lock"} onClick={() => onToggleLayerLock(layer.id)}>{layer.locked ? <Icon.Eye size={12}/> : <Icon.Check size={12}/>}</button>
                      <button className="cb-icon-btn" title="Duplicate" onClick={() => onDuplicateLayer(layer.id)} disabled={layer.locked}><Icon.Copy size={12}/></button>
                      <button className="cb-icon-btn" title="Delete" onClick={() => onDeleteLayer(layer.id)} disabled={layer.locked}><Icon.Trash size={12}/></button>
                    </>
                  )}
                  {layer.protected && <span className="muted" style={{ fontSize: 10.5 }}>Base</span>}
                </div>
              </div>
            );
          })}
        </div>
      </CBSection>
      <div className="muted" style={{ fontSize: 10.5, lineHeight: 1.45 }}>
        Top layers appear first. The vehicle photo and background are protected so every design remains vehicle-first.
      </div>
    </>
  );
}

function layerLabel(layer) {
  if (layer.role === "vehicle-photo") return "Vehicle photo base";
  if (layer.type === "bg") return "Background";
  if (layer.type === "text") return layer.text || "Text";
  if (layer.type === "cta") return layer.text || "CTA";
  if (layer.type === "ribbon") return layer.text || "Ribbon";
  if (layer.type === "stat-row") return "Payment/stat row";
  if (layer.type === "logo") return "Logo";
  return layer.role || layer.type || "Layer";
}

function CBSection({ title, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-3)", letterSpacing: "0.08em", marginBottom: 6 }}>{title}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>{children}</div>
    </div>
  );
}

function CBSlider({ label, value, min, max, step, onChange, unit }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
        <span style={{ fontSize: 10.5, color: "var(--text-2)" }}>{label}</span>
        <span className="mono" style={{ fontSize: 10.5, color: "var(--text)" }}>{typeof value === "number" ? value.toFixed(step < 1 ? 2 : 0) : value}{unit || ""}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))}
        style={{ width: "100%", accentColor: "var(--primary)" }}/>
    </div>
  );
}

function CBRadio({ label, value, options, onChange }) {
  return (
    <div>
      {label && <div style={{ fontSize: 10.5, color: "var(--text-2)", marginBottom: 3 }}>{label}</div>}
      <div style={{ display: "flex", background: "var(--gray-100)", borderRadius: "var(--radius)", padding: 2, border: "1px solid var(--border)" }}>
        {options.map(o => (
          <button key={o.v} onClick={() => onChange(o.v)}
            style={{
              flex: 1, padding: "5px 4px",
              background: value === o.v ? "var(--surface)" : "transparent",
              color: value === o.v ? "var(--text)" : "var(--text-2)",
              border: "none", borderRadius: 3,
              cursor: "pointer", fontFamily: "inherit",
              fontSize: 11, fontWeight: 500,
              boxShadow: value === o.v ? "var(--shadow-sm)" : "none",
            }}>{o.l}</button>
        ))}
      </div>
    </div>
  );
}

function CBColorRow({ label, value, onChange, brand }) {
  return (
    <div>
      {label && <div style={{ fontSize: 10.5, color: "var(--text-2)", marginBottom: 3 }}>{label}</div>}
      <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
        <div style={{ position: "relative", width: 26, height: 26, borderRadius: 4, background: value, border: "1px solid var(--border)", flex: "0 0 26px" }}>
          <input type="color" value={value} onChange={e => onChange(e.target.value)}
            style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }}/>
        </div>
        <input value={value} onChange={e => onChange(e.target.value)} className="cb-input mono" style={{ flex: 1, fontSize: 11, padding: "5px 8px" }}/>
        {brand?.colors?.map((c, i) => (
          <div key={i} onClick={() => onChange(c)} title={c}
            style={{ width: 20, height: 20, background: c, borderRadius: 3, cursor: "pointer", border: c.toLowerCase() === value.toLowerCase() ? "2px solid var(--primary)" : "1px solid var(--border)", flexShrink: 0 }}/>
        ))}
      </div>
    </div>
  );
}

function CBNumInput({ label, value, onChange, unit }) {
  return (
    <div>
      <div style={{ fontSize: 10.5, color: "var(--text-2)", marginBottom: 2 }}>{label}{unit && <span style={{ opacity: 0.5 }}> · {unit}</span>}</div>
      <input type="number" value={value?.toFixed ? +value.toFixed(1) : value} onChange={e => onChange(e.target.value)}
        className="cb-input mono" style={{ fontSize: 11.5, padding: "5px 8px" }}/>
    </div>
  );
}

// ============================================================
// AI PANEL
// ============================================================
function AIPanel({ onAI, onGenerateVariations, hasSelection }) {
  const actions = [
    { id: "headline", label: "Generate headline", icon: Icon.Sparkles, desc: "New headline for the selected vehicle." },
    { id: "spanish", label: "Make Spanish", icon: Icon.Globe, desc: "Translate the headline to Spanish." },
    { id: "payment", label: "Make payment-focused", icon: Icon.Dollar, desc: "Lead with the weekly payment." },
    { id: "shorten", label: "Shorten to fit", icon: Icon.ArrowRight, desc: "Trim copy to platform character limits." },
    { id: "compliance", label: "Make compliance-safe", icon: Icon.CheckCircle, desc: "Replace risky claims (\"guaranteed approval\")." },
  ];

  const suggestions = [
    "Drive home a {{year}} {{model}} for {{down_payment}} down.",
    "{{weekly_payment}} a week. That's it.",
    "Bad credit? Good credit? No credit? We got you.",
    "{{year}} {{make}} {{model}} — clean, low miles, ready to roll.",
    "Quick approval. Drive today. Apply at {{website}}.",
  ];

  return (
    <>
      <div style={{
        background: "linear-gradient(135deg, #2563EB, #0891B2)",
        padding: 12, borderRadius: "var(--radius)", marginBottom: 14, color: "#fff",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
          <Icon.Sparkles size={14}/>
          <span style={{ fontWeight: 700, fontSize: 12 }}>Creative AI</span>
        </div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.92)", lineHeight: 1.4 }}>
          {hasSelection
            ? "Apply an action to your selected text layer, or generate variations."
            : "Pick a layer first to fine-tune, or generate 5 versions in one click."}
        </div>
      </div>

      <CBSection title="ACTIONS">
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {actions.map(a => {
            const I = a.icon;
            return (
              <button key={a.id} onClick={() => onAI(a.id)}
                style={{
                  display: "flex", gap: 9, alignItems: "flex-start",
                  background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)",
                  padding: "8px 10px", cursor: "pointer", fontFamily: "inherit", color: "var(--text)",
                  textAlign: "left",
                }}>
                <div style={{ width: 22, height: 22, background: "var(--gray-100)", color: "var(--text-2)", borderRadius: 3, display: "grid", placeItems: "center", flex: "0 0 22px", marginTop: 1 }}>
                  <I size={11}/>
                </div>
                <div>
                  <div style={{ fontSize: 11.5, fontWeight: 600 }}>{a.label}</div>
                  <div style={{ fontSize: 10.5, color: "var(--text-2)", lineHeight: 1.4 }}>{a.desc}</div>
                </div>
              </button>
            );
          })}
        </div>
      </CBSection>

      <CBSection title="VARIATIONS">
        <button onClick={onGenerateVariations} className="cb-btn primary" style={{ width: "100%", justifyContent: "center", padding: "8px 10px" }}>
          <Icon.Layers size={13}/> Create 5 variations
        </button>
        <div className="muted" style={{ fontSize: 10.5, lineHeight: 1.4, marginTop: 4 }}>
          Generates 5 distinct riffs and saves them on the Saved tab.
        </div>
      </CBSection>

      <CBSection title="HEADLINE SUGGESTIONS">
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {suggestions.map((s, i) => (
            <div key={i} style={{ background: "var(--gray-50)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: 8, fontSize: 11, lineHeight: 1.4, color: "var(--text)" }}>
              {s}
              <button onClick={() => onAI("headline")} className="cb-link" style={{ marginTop: 4 }}>
                Apply →
              </button>
            </div>
          ))}
        </div>
      </CBSection>
    </>
  );
}

// ============================================================
// EXPORT PANEL
// ============================================================
function ExportPanel({ sizeId, onSize, exportSizes }) {
  const groups = ["Social", "Marketplace", "Display", "Print"];
  const current = exportSizes.find(s => s.id === sizeId);

  return (
    <>
      <CBSection title="CURRENT SIZE">
        <div style={{ background: "var(--gray-50)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: 10 }}>
          <div style={{ fontSize: 12, fontWeight: 600 }}>{current.name}</div>
          <div className="muted mono" style={{ fontSize: 10.5, marginTop: 2 }}>{current.w}×{current.h} · {current.note}</div>
        </div>
      </CBSection>

      {groups.map(g => (
        <CBSection key={g} title={g.toUpperCase()}>
          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {exportSizes.filter(s => s.group === g).map(s => (
              <button key={s.id} onClick={() => onSize(s.id)}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  background: s.id === sizeId ? "var(--primary)" : "var(--surface)",
                  border: "1px solid " + (s.id === sizeId ? "var(--primary)" : "var(--border)"),
                  borderRadius: "var(--radius)",
                  padding: "6px 8px", cursor: "pointer", fontFamily: "inherit",
                  color: s.id === sizeId ? "#fff" : "var(--text)",
                  textAlign: "left",
                }}>
                <div style={{
                  width: 24, height: 24, flex: "0 0 24px",
                  background: s.id === sizeId ? "rgba(255,255,255,0.2)" : "var(--gray-100)",
                  borderRadius: 3,
                  display: "grid", placeItems: "center",
                }}>
                  <div style={{
                    width: Math.max(4, (s.w / Math.max(s.w, s.h)) * 14),
                    height: Math.max(4, (s.h / Math.max(s.w, s.h)) * 14),
                    background: s.id === sizeId ? "#fff" : "var(--text-2)",
                    borderRadius: 1,
                  }}/>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11.5, fontWeight: 500 }}>{s.name}</div>
                  <div className="mono" style={{ fontSize: 10, color: s.id === sizeId ? "rgba(255,255,255,0.75)" : "var(--text-2)" }}>{s.w}×{s.h}</div>
                </div>
                {s.id === sizeId && <Icon.Check size={12}/>}
              </button>
            ))}
          </div>
        </CBSection>
      ))}

      <CBSection title="FORMAT">
        <CBRadio label="" value="png" options={[
          { v: "png", l: "PNG" }, { v: "jpg", l: "JPG" }, { v: "pdf", l: "PDF" },
        ]} onChange={() => {}}/>
      </CBSection>
    </>
  );
}


export { CBRightSidebar };
