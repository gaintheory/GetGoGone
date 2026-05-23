// Creative Builder screen — Canva-style editor specialized for vehicle ads (light theme)

function CreativeBuilder({ vehicleId, nav, toast }) {
  const { VEHICLES, vehicleSvg } = window.GGG;
  const { adTemplates, exportSizes, buildVars, substitute, defaultBrand } = window.CreativeBuilderData;
  const { Pill, Btn, VehicleThumb } = window.UI;

  const [vehicleSel, setVehicleSel] = React.useState(VEHICLES.find(v => v.id === vehicleId) || VEHICLES[1]);
  const [templateId, setTemplateId] = React.useState("fresh");
  const [sizeId, setSizeId] = React.useState("fb-sq");
  const [layers, setLayers] = React.useState(() => JSON.parse(JSON.stringify(adTemplates[0].layers)));
  const [selectedId, setSelectedId] = React.useState(null);
  const [brand, setBrand] = React.useState(defaultBrand);
  const [leftTab, setLeftTab] = React.useState("templates");
  const [rightTab, setRightTab] = React.useState("layer");
  const [history, setHistory] = React.useState({ past: [], future: [] });
  const [versions, setVersions] = React.useState([]);
  const [previewMode, setPreviewMode] = React.useState(false);
  const canvasAreaRef = React.useRef(null);
  const [areaSize, setAreaSize] = React.useState({ w: 800, h: 600 });
  const layersRef = React.useRef(layers);
  layersRef.current = layers;
  const lastSnapshotAt = React.useRef(0);

  React.useEffect(() => {
    if (!canvasAreaRef.current) return;
    const ro = new ResizeObserver(entries => {
      for (const e of entries) setAreaSize({ w: e.contentRect.width, h: e.contentRect.height });
    });
    ro.observe(canvasAreaRef.current);
    return () => ro.disconnect();
  }, []);

  const size = exportSizes.find(s => s.id === sizeId);
  const vars = buildVars(vehicleSel, brand);
  const selected = layers.find(l => l.id === selectedId);
  const template = adTemplates.find(t => t.id === templateId);

  const padding = 56;
  const availW = Math.max(200, areaSize.w - padding * 2);
  const availH = Math.max(200, areaSize.h - padding * 2);
  const scale = Math.min(availW / size.w, availH / size.h, 1);

  // -------- History --------
  // pushHistory: snapshot current + set new (used by adds, deletes, template loads)
  const pushHistory = (next) => {
    setHistory(h => ({ past: [...h.past, layersRef.current].slice(-50), future: [] }));
    setLayers(next);
    lastSnapshotAt.current = Date.now();
  };
  // snapshot(): push current to history WITHOUT changing layers (for drag start, etc.)
  const snapshot = () => {
    setHistory(h => ({ past: [...h.past, layersRef.current].slice(-50), future: [] }));
    lastSnapshotAt.current = Date.now();
  };
  // Live update (no history) — used during drag/resize and frequent input
  const setLayersLive = (updater) => {
    setLayers(prev => typeof updater === "function" ? updater(prev) : updater);
  };
  const undo = () => {
    setHistory(h => {
      if (h.past.length === 0) return h;
      const prev = h.past[h.past.length - 1];
      const past = h.past.slice(0, -1);
      const future = [layersRef.current, ...h.future];
      setLayers(prev);
      return { past, future };
    });
  };
  const redo = () => {
    setHistory(h => {
      if (h.future.length === 0) return h;
      const next = h.future[0];
      const future = h.future.slice(1);
      const past = [...h.past, layersRef.current];
      setLayers(next);
      return { past, future };
    });
  };

  // Throttled snapshot for input typing: snapshot at most once per 600ms
  const snapshotThrottled = () => {
    const now = Date.now();
    if (now - lastSnapshotAt.current > 600) snapshot();
  };

  const updateLayer = (id, patch) => {
    snapshotThrottled();
    setLayersLive(prev => prev.map(l => l.id === id ? { ...l, ...patch } : l));
  };
  // Used during drag — no snapshot inside (drag snapshot already taken)
  const updateLayerLive = (id, patch) => {
    setLayersLive(prev => prev.map(l => l.id === id ? { ...l, ...patch } : l));
  };
  const deleteLayer = (id) => {
    snapshot();
    setLayersLive(prev => prev.filter(l => l.id !== id));
  };
  const addLayer = (l) => {
    snapshot();
    setLayersLive(prev => [...prev, l]);
    setSelectedId(l.id);
  };

  const loadTemplate = (id) => {
    const tpl = adTemplates.find(t => t.id === id);
    if (!tpl) return;
    setTemplateId(id);
    pushHistory(JSON.parse(JSON.stringify(tpl.layers)));
    setSelectedId(null);
  };
  const resetTemplate = () => {
    pushHistory(JSON.parse(JSON.stringify(template.layers)));
    setSelectedId(null);
    toast("Reset to template defaults");
  };

  const saveVersion = () => {
    const v = { id: Date.now(), name: `${template.name} v${versions.length + 1}`, layers: JSON.parse(JSON.stringify(layers)), size, vehicle: vehicleSel };
    setVersions([v, ...versions].slice(0, 8));
    toast(`Saved variation "${v.name}"`);
  };

  // AI actions — modify selected text layer (or headline)
  const aiAction = (action) => {
    const target = selected && selected.type === "text"
      ? selected
      : layers.find(l => l.role === "headline") || layers.find(l => l.type === "text");
    if (!target) return;
    let newText = target.text;
    switch (action) {
      case "headline":
        newText = pickRandom([
          "{{year}} {{make}} {{model}} — Drive Today",
          "Just In: {{year}} {{model}}",
          "Your Next Ride is Here.",
          "{{down_payment}} Down — That's It.",
          "Built for the Long Haul.",
        ]);
        break;
      case "spanish":
        newText = "¡{{year}} {{make}} {{model}} — Solo {{down_payment}}!";
        break;
      case "payment":
        newText = "{{weekly_payment}}/week. Drive Today.";
        break;
      case "shorten":
        newText = newText.length > 30 ? newText.slice(0, 28).trim() + "…" : newText;
        break;
      case "compliance":
        newText = newText.replace(/guaranteed approval/gi, "we work with all credit").replace(/100% approved/gi, "all credit considered");
        break;
    }
    snapshot();
    setLayersLive(prev => prev.map(l => l.id === target.id ? { ...l, text: newText } : l));
    toast("AI applied");
  };

  // Keyboard
  React.useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      if ((e.metaKey || e.ctrlKey) && e.key === "z" && !e.shiftKey) { e.preventDefault(); undo(); }
      else if ((e.metaKey || e.ctrlKey) && (e.key === "y" || (e.key === "z" && e.shiftKey))) { e.preventDefault(); redo(); }
      else if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedId && !["bg"].includes(selected?.type)) { deleteLayer(selectedId); setSelectedId(null); }
      }
      else if (e.key === "Escape") setSelectedId(null);
      else if (selectedId && !["bg"].includes(selected?.type)) {
        // Arrow nudge
        const step = e.shiftKey ? 2 : 0.5;
        if (e.key === "ArrowLeft")  { e.preventDefault(); updateLayer(selectedId, { x: (selected.x || 0) - step }); }
        else if (e.key === "ArrowRight") { e.preventDefault(); updateLayer(selectedId, { x: (selected.x || 0) + step }); }
        else if (e.key === "ArrowUp")   { e.preventDefault(); updateLayer(selectedId, { y: (selected.y || 0) - step }); }
        else if (e.key === "ArrowDown") { e.preventDefault(); updateLayer(selectedId, { y: (selected.y || 0) + step }); }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedId, selected]);

  return (
    <div style={{
      height: "100%",
      background: "var(--bg)",
      display: "grid",
      gridTemplateRows: "48px 1fr",
      overflow: "hidden",
      color: "var(--text)",
    }}>
      <CBToolbar
        nav={nav}
        template={template}
        vehicle={vehicleSel}
        size={size}
        onUndo={undo} onRedo={redo}
        canUndo={history.past.length > 0}
        canRedo={history.future.length > 0}
        onPreview={() => setPreviewMode(!previewMode)}
        previewMode={previewMode}
        onSaveTemplate={() => toast("Saved as reusable template")}
        onExport={() => toast(`Exporting ${size.name}...`)}
        onSizeChange={setSizeId}
        onReset={resetTemplate}
        exportSizes={exportSizes}
      />

      <div style={{ display: "grid", gridTemplateColumns: previewMode ? "1fr" : "260px 1fr 300px", overflow: "hidden" }}>
        {!previewMode && (
          <CBLeftSidebar
            tab={leftTab} onTab={setLeftTab}
            templateId={templateId} onTemplate={loadTemplate}
            vehicle={vehicleSel} onVehicle={setVehicleSel}
            layers={layers} onAddLayer={addLayer}
            brand={brand} onBrand={setBrand}
            versions={versions}
            onLoadVersion={(v) => { setVehicleSel(v.vehicle); setSizeId(v.size.id); pushHistory(v.layers); }}
          />
        )}

        <div ref={canvasAreaRef} style={{
          position: "relative",
          overflow: "hidden",
          background: "var(--gray-100)",
          backgroundImage: "radial-gradient(rgba(15,23,42,0.06) 1px, transparent 1px)",
          backgroundSize: "16px 16px",
          display: "grid",
          placeItems: "center",
        }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setSelectedId(null);
          }}>
          <CBCanvas
            width={size.w} height={size.h}
            layers={layers} vars={vars} vehicle={vehicleSel} brand={brand}
            selectedId={previewMode ? null : selectedId}
            onSelect={setSelectedId}
            onLayerChange={updateLayerLive}
            onSnapshot={snapshot}
            scale={scale}
            interactive={!previewMode}
          />
          {/* Bottom overlay info */}
          <div style={{
            position: "absolute", bottom: 12, left: 12,
            background: "var(--surface)", color: "var(--text)",
            padding: "6px 10px", borderRadius: "var(--radius)", fontSize: 11,
            border: "1px solid var(--border)",
            boxShadow: "var(--shadow-sm)",
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <Icon.Eye size={12}/>
            <span className="mono">{size.w}×{size.h}</span>
            <span className="muted">· {Math.round(scale * 100)}%</span>
            <span className="muted">· {size.name}</span>
          </div>
          {/* Help hint */}
          {!selectedId && !previewMode && (
            <div style={{
              position: "absolute", bottom: 12, right: 12,
              background: "var(--surface)", color: "var(--text-2)",
              padding: "6px 10px", borderRadius: "var(--radius)", fontSize: 11,
              border: "1px solid var(--border)",
              boxShadow: "var(--shadow-sm)",
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <Icon.Sparkles size={11}/>
              Click any layer to select · drag to move · ⌫ to delete
            </div>
          )}
          {previewMode && (
            <div style={{ position: "absolute", top: 12, right: 12 }}>
              <button className="btn primary" onClick={() => setPreviewMode(false)}>
                <Icon.X size={13}/> Exit preview
              </button>
            </div>
          )}
        </div>

        {!previewMode && (
          <CBRightSidebar
            tab={rightTab} onTab={setRightTab}
            selected={selected}
            onUpdateLayer={updateLayer}
            onDeleteLayer={(id) => { deleteLayer(id); setSelectedId(null); }}
            sizeId={sizeId} onSize={setSizeId}
            exportSizes={exportSizes}
            brand={brand} onBrand={setBrand}
            vars={vars}
            onAI={aiAction}
            onGenerateVariations={() => {
              const newVersions = [];
              for (let i = 0; i < 5; i++) {
                newVersions.push({ id: Date.now() + i, name: `Variation ${i+1}`, layers: JSON.parse(JSON.stringify(layers)), size, vehicle: vehicleSel });
              }
              setVersions([...newVersions, ...versions].slice(0, 8));
              toast("Created 5 variations");
            }}
            onSaveVersion={saveVersion}
            onExport={() => toast(`Downloaded ${size.name}`)}
          />
        )}
      </div>
    </div>
  );
}

function pickRandom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

// ============================================================
// TOP TOOLBAR
// ============================================================
function CBToolbar({ nav, template, vehicle, size, onUndo, onRedo, canUndo, canRedo, onPreview, previewMode, onSaveTemplate, onExport, onSizeChange, onReset, exportSizes }) {
  const [sizeOpen, setSizeOpen] = React.useState(false);
  return (
    <header style={{
      background: "var(--surface)",
      borderBottom: "1px solid var(--border)",
      display: "flex", alignItems: "center", gap: 6, padding: "0 12px",
      color: "var(--text)", fontSize: 12.5,
    }}>
      <button onClick={() => nav("creatives")} className="cb-tb-btn" title="Back to Creatives">
        <Icon.ChevronLeft size={14}/>
      </button>
      <div style={{ width: 1, height: 22, background: "var(--border)" }}/>

      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 4px" }}>
        <div style={{
          width: 22, height: 22, background: "#111827", color: "#fff", borderRadius: 4,
          display: "grid", placeItems: "center", fontWeight: 700, fontSize: 10,
        }}>GGG</div>
        <div>
          <div style={{ fontWeight: 600, fontSize: 12.5, lineHeight: 1.1 }}>
            {template?.name} <span className="muted" style={{ fontWeight: 400 }}>· {vehicle.year} {vehicle.make} {vehicle.model}</span>
          </div>
          <div style={{ fontSize: 10.5, color: "var(--text-2)" }}>Untitled creative · Edited just now</div>
        </div>
      </div>

      <div style={{ width: 1, height: 22, background: "var(--border)", marginLeft: 8 }}/>

      <button onClick={onUndo} disabled={!canUndo} className="cb-tb-btn" title="Undo (⌘Z)">
        <Icon.Refresh size={14} style={{ transform: "scaleX(-1)" }}/>
        <span>Undo</span>
      </button>
      <button onClick={onRedo} disabled={!canRedo} className="cb-tb-btn" title="Redo (⌘⇧Z)">
        <Icon.Refresh size={14}/>
        <span>Redo</span>
      </button>
      <button onClick={onReset} className="cb-tb-btn" title="Reset to template defaults">
        <Icon.Trash size={13}/>
        <span>Reset</span>
      </button>

      <div style={{ width: 1, height: 22, background: "var(--border)", margin: "0 4px" }}/>

      <div style={{ position: "relative" }}>
        <button onClick={() => setSizeOpen(!sizeOpen)} className="cb-tb-btn" style={{ padding: "5px 10px", gap: 6, border: "1px solid var(--border)" }}>
          <Icon.Layers size={13}/>
          <span style={{ fontWeight: 500 }}>{size.name}</span>
          <span className="muted mono" style={{ fontSize: 11 }}>{size.w}×{size.h}</span>
          <Icon.ChevronDown size={12}/>
        </button>
        {sizeOpen && (
          <>
            <div style={{ position: "fixed", inset: 0, zIndex: 100 }} onClick={() => setSizeOpen(false)}/>
            <div style={{
              position: "absolute", top: "calc(100% + 4px)", left: 0,
              background: "var(--surface)", border: "1px solid var(--border)",
              borderRadius: "var(--radius-lg)", padding: 8, minWidth: 320,
              boxShadow: "var(--shadow-lg)", zIndex: 101,
            }}>
              {["Social","Marketplace","Display","Print"].map(g => (
                <div key={g}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-3)", letterSpacing: "0.08em", padding: "8px 8px 4px" }}>{g.toUpperCase()}</div>
                  {exportSizes.filter(s => s.group === g).map(s => (
                    <button key={s.id} onClick={() => { onSizeChange(s.id); setSizeOpen(false); }}
                      style={{
                        display: "flex", alignItems: "center", gap: 10,
                        width: "100%", padding: "7px 8px", borderRadius: 4,
                        background: s.id === size.id ? "var(--primary)" : "transparent",
                        color: s.id === size.id ? "#fff" : "var(--text)",
                        border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 12, textAlign: "left",
                      }}>
                      <div style={{
                        width: 22, height: 22, flex: "0 0 22px",
                        background: s.id === size.id ? "rgba(255,255,255,0.25)" : "var(--gray-100)",
                        borderRadius: 3,
                        display: "grid", placeItems: "center",
                      }}>
                        <div style={{
                          width: Math.max(4, (s.w / Math.max(s.w, s.h)) * 14),
                          height: Math.max(4, (s.h / Math.max(s.w, s.h)) * 14),
                          background: s.id === size.id ? "#fff" : "var(--text-2)",
                          borderRadius: 1,
                        }}/>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 500 }}>{s.name}</div>
                        <div style={{ fontSize: 10.5, opacity: 0.6 }} className="mono">{s.w}×{s.h} · {s.note}</div>
                      </div>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
        <button onClick={onPreview} className="cb-tb-btn" title="Preview">
          <Icon.Eye size={13}/> Preview
        </button>
        <button onClick={onSaveTemplate} className="cb-tb-btn">
          <Icon.Folder size={13}/> Save template
        </button>
        <button onClick={onExport} className="btn primary" style={{ height: 30 }}>
          <Icon.Download size={13}/> Export
        </button>
      </div>
    </header>
  );
}

window.CreativeBuilder = CreativeBuilder;
window.CBToolbar = CBToolbar;
