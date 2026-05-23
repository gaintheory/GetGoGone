import React from 'react';
import { Icon } from '../icons';
import { GGG } from '../data';
import { UI } from '../ui';
import { CreativeBuilderData } from './creative-templates';
import { CBCanvas } from './creative-canvas';
import { CBLeftSidebar } from './creative-left';
import { CBRightSidebar } from './creative-right';
import { renderCreativePng } from './creative-export';

const photoBaseLayers = [
  { id: "bg", type: "bg", color: "#FFFFFF", locked: true, protected: true },
  { id: "photo-base", type: "photo", x: 0, y: 0, w: 100, h: 100, fit: "cover", role: "vehicle-photo", locked: true, protected: true },
];

// Creative Builder screen — Canva-style editor specialized for vehicle ads (light theme)

function CreativeBuilder({ vehicleId, nav, toast, vehicles: providedVehicles, clientId }) {
  const { VEHICLES, vehicleSvg } = GGG;
  const { adTemplates, exportSizes, buildVars, substitute, defaultBrand } = CreativeBuilderData;
  const { Pill, Btn, VehicleThumb } = UI;
  const vehicles = providedVehicles && providedVehicles.length ? providedVehicles : VEHICLES;

  const [vehicleSel, setVehicleSel] = React.useState(vehicles.find(v => v.id === vehicleId) || vehicles[1] || vehicles[0] || VEHICLES[1]);
  const [templateId, setTemplateId] = React.useState("fresh");
  const [sizeId, setSizeId] = React.useState("fb-sq");
  const [layers, setLayers] = React.useState(() => ensurePhotoBase(adTemplates[0].layers));
  const [selectedId, setSelectedId] = React.useState(null);
  const [brand, setBrand] = React.useState(defaultBrand);
  const [leftTab, setLeftTab] = React.useState("vehicle");
  const [rightTab, setRightTab] = React.useState("layer");
  const [history, setHistory] = React.useState({ past: [], future: [] });
  const [versions, setVersions] = React.useState([]);
  const [savedTemplates, setSavedTemplates] = React.useState([]);
  const [savingCreative, setSavingCreative] = React.useState(false);
  const [exportingCreative, setExportingCreative] = React.useState(false);
  const [previewMode, setPreviewMode] = React.useState(false);
  const canvasAreaRef = React.useRef(null);
  const [areaSize, setAreaSize] = React.useState({ w: 800, h: 600 });
  const layersRef = React.useRef(layers);
  layersRef.current = layers;
  const lastSnapshotAt = React.useRef(0);

  React.useEffect(() => {
    const next = vehicles.find(v => v.id === vehicleId) || vehicles.find(v => v.id === vehicleSel?.id);
    if (next && next.id !== vehicleSel?.id) {
      setTimeout(() => setVehicleSel(next), 0);
    }
  }, [vehicleId, vehicles, vehicleSel?.id]);

  React.useEffect(() => {
    if (!canvasAreaRef.current) return;
    const ro = new ResizeObserver(entries => {
      for (const e of entries) setAreaSize({ w: e.contentRect.width, h: e.contentRect.height });
    });
    ro.observe(canvasAreaRef.current);
    return () => ro.disconnect();
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    const params = clientId && clientId !== "agency_overview" ? `?clientId=${encodeURIComponent(clientId)}` : "";
    fetch(`/api/creative-templates${params}`)
      .then(res => res.json())
      .then(data => {
        if (cancelled || !data.ok) return;
        const records = data.templates || [];
        setSavedTemplates(records.filter(item => item.category === "custom_template"));
        setVersions(records.filter(item => item.category === "saved_creative").map(mapSavedCreative));
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [clientId]);

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
    const layer = layersRef.current.find(l => l.id === id);
    if (!layer || layer.protected || layer.locked) return;
    snapshot();
    setLayersLive(prev => prev.filter(l => l.id !== id));
  };
  const addLayer = (l) => {
    snapshot();
    setLayersLive(prev => [...prev, l]);
    setSelectedId(l.id);
  };
  const addLayers = (newLayersList) => {
    snapshot();
    const prepared = newLayersList.map((l, i) => ({
      ...l,
      id: l.id || `${l.type}-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 5)}`
    }));
    setLayersLive(prev => [...prev, ...prepared]);
    if (prepared.length > 0) {
      setSelectedId(prepared[prepared.length - 1].id);
    }
  };
  const duplicateLayer = (id) => {
    const source = layersRef.current.find(l => l.id === id);
    if (!source || source.protected || source.locked) return;
    const copy = {
      ...JSON.parse(JSON.stringify(source)),
      id: `${source.type}-${Date.now()}`,
      x: Math.min(95, (source.x || 0) + 3),
      y: Math.min(95, (source.y || 0) + 3),
      locked: false,
      protected: false,
    };
    snapshot();
    setLayersLive(prev => {
      const index = prev.findIndex(l => l.id === id);
      const next = [...prev];
      next.splice(index + 1, 0, copy);
      return next;
    });
    setSelectedId(copy.id);
  };
  const moveLayer = (id, direction) => {
    const current = layersRef.current;
    const index = current.findIndex(l => l.id === id);
    if (index < 0 || current[index].protected || current[index].locked) return;
    const nextIndex = direction === "up" ? index + 1 : index - 1;
    if (nextIndex < 0 || nextIndex >= current.length || current[nextIndex]?.protected) return;
    snapshot();
    setLayersLive(prev => {
      const next = [...prev];
      const [item] = next.splice(index, 1);
      next.splice(nextIndex, 0, item);
      return next;
    });
  };
  const toggleLayerLock = (id) => {
    const layer = layersRef.current.find(l => l.id === id);
    if (!layer || layer.protected) return;
    snapshot();
    setLayersLive(prev => prev.map(l => l.id === id ? { ...l, locked: !l.locked } : l));
  };

  const loadTemplate = (id) => {
    if (id === "blank") {
      setTemplateId("blank");
      pushHistory(ensurePhotoBase([]));
      setSelectedId(null);
      toast("Started blank overlay");
      return;
    }
    const tpl = adTemplates.find(t => t.id === id);
    if (!tpl) return;
    setTemplateId(id);
    pushHistory(ensurePhotoBase(tpl.layers));
    setSelectedId(null);
  };
  const loadSavedTemplate = (record) => {
    const canvas = record.canvas_json || {};
    if (canvas.brand) setBrand(canvas.brand);
    if (canvas.size?.id) setSizeId(canvas.size.id);
    setTemplateId(`saved-${record.id}`);
    pushHistory(ensurePhotoBase(canvas.layers || []));
    setSelectedId(null);
    toast(`Loaded template "${record.name}"`);
  };
  const loadSavedCreative = (record) => {
    const canvas = record.canvas_json || record;
    const nextVehicle = vehicles.find(v => v.id === canvas.vehicle?.id || v.vin === canvas.vehicle?.vin) || canvas.vehicle || vehicleSel;
    if (nextVehicle) setVehicleSel(nextVehicle);
    if (canvas.size?.id) setSizeId(canvas.size.id);
    if (canvas.brand) setBrand(canvas.brand);
    if (canvas.templateId) setTemplateId(canvas.templateId);
    pushHistory(ensurePhotoBase(canvas.layers || []));
    setSelectedId(null);
    toast(`Loaded "${record.name}"`);
  };
  const resetTemplate = () => {
    if (!template) {
      pushHistory(ensurePhotoBase([]));
      setSelectedId(null);
      toast("Reset to vehicle photo");
      return;
    }
    pushHistory(ensurePhotoBase(template.layers));
    setSelectedId(null);
    toast("Reset to template defaults");
  };
  const clearOverlay = () => {
    pushHistory(ensurePhotoBase([]));
    setTemplateId("blank");
    setSelectedId(null);
    toast("Cleared overlay");
  };

  const buildCreativePayload = (category) => {
    const vehicleName = [vehicleSel?.year, vehicleSel?.make, vehicleSel?.model].filter(Boolean).join(" ");
    const templateName = template?.name || "Blank Overlay";
    const suffix = category === "custom_template" ? "Template" : "Creative";

    let saveLayers = layers;
    if (category === "custom_template") {
      saveLayers = layers.filter(l => !l.protected && l.id !== "photo-base" && l.id !== "bg" && l.role !== "vehicle-photo");
    }

    return {
      name: `${vehicleName || "Vehicle"} ${templateName} ${suffix}`,
      category,
      format: size.id,
      language: template?.language || "en",
      canvasJson: {
        layers: JSON.parse(JSON.stringify(saveLayers)),
        size,
        vehicle: vehicleSel,
        brand,
        templateId,
        templateName,
        savedFrom: "designer",
      },
    };
  };
  const postCreativeTemplate = async (payload) => {
    const response = await fetch("/api/creative-templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...payload,
        clientId: clientId && clientId !== "agency_overview" ? clientId : undefined,
      }),
    });
    const data = await response.json();
    if (!response.ok || !data.ok) throw new Error(data.error || "Save failed.");
    return data.template;
  };
  const saveDesignerTemplate = async () => {
    if (savingCreative) return;
    const templateNameInput = prompt("Enter a name for this custom overlay template:", `${vehicleSel?.make || "Custom"} Overlay Template`);
    if (templateNameInput === null) return; // User cancelled
    const name = templateNameInput.trim() || `${vehicleSel?.make || "Custom"} Overlay Template`;

    setSavingCreative(true);
    try {
      const payload = buildCreativePayload("custom_template");
      payload.name = name;
      const saved = await postCreativeTemplate(payload);
      setSavedTemplates(prev => [saved, ...prev]);
      toast(`Saved template "${saved.name}"`);
    } catch (error) {
      toast(error.message || "Template save failed");
    } finally {
      setSavingCreative(false);
    }
  };
  const saveVersion = async () => {
    if (savingCreative) return;
    setSavingCreative(true);
    try {
      const saved = await postCreativeTemplate(buildCreativePayload("saved_creative"));
      setVersions(prev => [mapSavedCreative(saved), ...prev].slice(0, 20));
      toast(`Saved creative "${saved.name}"`);
      return saved;
    } catch (error) {
      toast(error.message || "Creative save failed");
      return null;
    } finally {
      setSavingCreative(false);
    }
  };

  const exportPng = async () => {
    if (exportingCreative) return;
    setExportingCreative(true);
    try {
      const saved = await postCreativeTemplate(buildCreativePayload("saved_creative"));
      setVersions(prev => [mapSavedCreative(saved), ...prev].slice(0, 20));
      const dataUrl = await renderCreativePng({ layers, size, vars, vehicle: vehicleSel, brand });
      const fileName = `${saved.name || "designer-creative"}-${size.id}`;
      const response = await fetch("/api/creative-exports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: clientId && clientId !== "agency_overview" ? clientId : undefined,
          creativeTemplateId: saved.id,
          imageDataUrl: dataUrl,
          fileName,
          format: size.id,
          metadata: {
            size,
            vehicle: vehicleSel,
            templateId,
            templateName: template?.name || "Blank Overlay",
          },
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || "Export failed.");

      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `${fileName.replace(/[^a-z0-9._-]+/gi, "-")}.png`;
      link.click();
      toast("Exported PNG and saved storage preview");
    } catch (error) {
      toast(error.message || "Creative export failed");
    } finally {
      setExportingCreative(false);
    }
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
        if (selectedId && selected && !selected.protected) { deleteLayer(selectedId); setSelectedId(null); }
      }
      else if (e.key === "Escape") setSelectedId(null);
      else if (selectedId && !selected?.locked && !["bg"].includes(selected?.type)) {
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
        onSaveTemplate={saveDesignerTemplate}
        onSaveCreative={saveVersion}
        exporting={exportingCreative}
        onExport={exportPng}
        onSizeChange={setSizeId}
        onReset={resetTemplate}
        onClearOverlay={clearOverlay}
        exportSizes={exportSizes}
      />

      <div style={{ display: "grid", gridTemplateColumns: previewMode ? "1fr" : "260px 1fr 300px", overflow: "hidden" }}>
        {!previewMode && (
          <CBLeftSidebar
            tab={leftTab} onTab={setLeftTab}
            templateId={templateId} onTemplate={loadTemplate}
            vehicle={vehicleSel} onVehicle={setVehicleSel}
            vehicles={vehicles}
            layers={layers} onAddLayer={addLayer} onAddLayers={addLayers}
            brand={brand} onBrand={setBrand}
            versions={versions}
            savedTemplates={savedTemplates}
            onSavedTemplate={loadSavedTemplate}
            onLoadVersion={loadSavedCreative}
            toast={toast}
            clientId={clientId}
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
            selectedId={selectedId}
            layers={layers}
            onSelect={setSelectedId}
            onUpdateLayer={updateLayer}
            onDeleteLayer={(id) => { deleteLayer(id); setSelectedId(null); }}
            onDuplicateLayer={duplicateLayer}
            onMoveLayer={moveLayer}
            onToggleLayerLock={toggleLayerLock}
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
            onExport={exportPng}
          />
        )}
      </div>
    </div>
  );
}

function pickRandom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function mapSavedCreative(record) {
  const canvas = record.canvas_json || {};
  return {
    ...record,
    layers: canvas.layers || [],
    size: canvas.size || { id: record.format, name: record.format },
    vehicle: canvas.vehicle,
    brand: canvas.brand,
  };
}

function ensurePhotoBase(sourceLayers) {
  const cloned = JSON.parse(JSON.stringify(sourceLayers || []));
  const withoutBase = cloned.filter(l => l.id !== "photo-base");
  const hasBg = withoutBase.some(l => l.type === "bg");
  const hasPhotoBase = withoutBase.some(l => l.role === "vehicle-photo");
  const base = [];
  if (!hasBg) base.push(photoBaseLayers[0]);
  if (!hasPhotoBase) base.push(photoBaseLayers[1]);
  return [...base.map(l => ({ ...l })), ...withoutBase];
}

// ============================================================
// TOP TOOLBAR
// ============================================================
function CBToolbar({ nav, template, vehicle, size, onUndo, onRedo, canUndo, canRedo, onPreview, previewMode, onSaveTemplate, onSaveCreative, exporting, onExport, onSizeChange, onReset, onClearOverlay, exportSizes }) {
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
      <button onClick={onClearOverlay} className="cb-tb-btn" title="Clear overlay and keep vehicle photo">
        <Icon.X size={13}/>
        <span>Clear overlay</span>
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
        <button onClick={onSaveCreative} className="cb-tb-btn">
          <Icon.CheckCircle size={13}/> Save creative
        </button>
        <button onClick={onExport} disabled={exporting} className="btn primary" style={{ height: 30 }}>
          <Icon.Download size={13}/> {exporting ? "Exporting..." : "Export"}
        </button>
      </div>
    </header>
  );
}


export { CreativeBuilder };
