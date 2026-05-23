import React from 'react';
import { Icon } from '../icons';
import { GGG } from '../data';
import { UI } from '../ui';
import { CreativeBuilderData } from './creative-templates';
import { VehicleMedia } from '../vehicle-media';

// Creative Builder — Left sidebar (light theme)

function CBLeftSidebar({ tab, onTab, templateId, onTemplate, vehicle, onVehicle, vehicles: providedVehicles, layers, onAddLayer, onAddLayers, brand, onBrand, versions, savedTemplates, onSavedTemplate, onLoadVersion, toast, clientId }) {
  const { adTemplates } = CreativeBuilderData;
  const { VEHICLES, vehicleSvg } = GGG;
  const vehicles = providedVehicles && providedVehicles.length ? providedVehicles : VEHICLES;

  const tabs = [
    { id: "vehicle", label: "Vehicle", icon: Icon.Car },
    { id: "templates", label: "Templates", icon: Icon.Layers },
    { id: "import", label: "Import", icon: Icon.Upload },
    { id: "photos", label: "Photos", icon: Icon.Image },
    { id: "text", label: "Text", icon: Icon.FileText },
    { id: "aiOverlays", label: "AI Overlays", icon: Icon.Sparkles },
    { id: "badges", label: "Badges", icon: Icon.Tag },
    { id: "shapes", label: "Shapes", icon: Icon.Layers },
    { id: "offer", label: "Offer", icon: Icon.Dollar },
    { id: "brand", label: "Brand", icon: Icon.Star },
    { id: "versions", label: "Saved", icon: Icon.Folder },
  ];

  return (
    <aside style={{
      background: "var(--surface)",
      borderRight: "1px solid var(--border)",
      display: "grid",
      gridTemplateColumns: "56px 1fr",
      overflow: "hidden",
    }}>
      {/* Rail */}
      <div style={{
        background: "var(--gray-50)",
        borderRight: "1px solid var(--border)",
        display: "flex", flexDirection: "column",
        padding: "8px 6px", gap: 4,
      }}>
        {tabs.map(t => {
          const I = t.icon;
          const sel = tab === t.id;
          return (
            <button key={t.id} onClick={() => onTab(t.id)}
              style={{
                background: sel ? "#111827" : "transparent",
                color: sel ? "#fff" : "var(--text-2)",
                border: "none",
                borderRadius: "var(--radius)",
                padding: "8px 4px",
                cursor: "pointer",
                fontFamily: "inherit",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                fontSize: 9.5, fontWeight: 500,
              }}>
              <I size={16}/>
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Panel */}
      <div style={{ overflow: "auto", color: "var(--text)", fontSize: 12.5, padding: 12 }}>
        {tab === "vehicle" && <VehicleTab vehicle={vehicle} onVehicle={onVehicle} vehicles={vehicles} onTemplate={onTemplate} onTab={onTab}/>}
        {tab === "templates" && <TemplatesTab templateId={templateId} onTemplate={onTemplate} adTemplates={adTemplates} savedTemplates={savedTemplates} onSavedTemplate={onSavedTemplate} vehicle={vehicle} onVehicle={onVehicle} vehicles={vehicles}/>}
        {tab === "import" && <ImportTemplateTab onAddLayer={onAddLayer}/>}
        {tab === "photos" && <PhotosTab vehicle={vehicle} onAddLayer={onAddLayer} onAddLayers={onAddLayers}/>}
        {tab === "text" && <TextTab onAddLayer={onAddLayer} onAddLayers={onAddLayers}/>}
        {tab === "aiOverlays" && <AIOverlaysTab onAddLayer={onAddLayer} onAddLayers={onAddLayers} toast={toast} clientId={clientId}/>}
        {tab === "badges" && <BadgesTab onAddLayer={onAddLayer}/>}
        {tab === "shapes" && <ShapesTab onAddLayer={onAddLayer} onAddLayers={onAddLayers}/>}
        {tab === "offer" && <OfferTab brand={brand} onBrand={onBrand}/>}
        {tab === "brand" && <BrandTab brand={brand} onBrand={onBrand}/>}
        {tab === "versions" && <VersionsTab versions={versions} onLoadVersion={onLoadVersion}/>}
      </div>
    </aside>
  );
}

function CBPanelTitle({ children, action }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
      <div style={{ fontSize: 10.5, fontWeight: 700, color: "var(--text-3)", letterSpacing: "0.08em" }}>{children}</div>
      {action}
    </div>
  );
}

function VehicleTab({ vehicle, onVehicle, vehicles, onTemplate, onTab }) {
  return (
    <>
      <CBPanelTitle>VEHICLE FIRST</CBPanelTitle>
      <select className="cb-select" value={vehicle.id} onChange={e => onVehicle(vehicles.find(v => v.id === e.target.value))}>
        {vehicles.map(v => <option key={v.id} value={v.id}>{v.year} {v.make} {v.model}</option>)}
      </select>
      <div style={{
        marginTop: 8,
        borderRadius: "var(--radius)",
        overflow: "hidden",
        border: "1px solid var(--border)",
        background: "#cbd5e1",
      }}>
        <div style={{ aspectRatio: "4/3" }}>
          <VehicleMedia v={vehicle}/>
        </div>
        <div style={{ padding: 9, background: "var(--surface)", borderTop: "1px solid var(--border)" }}>
          <div style={{ fontSize: 12.5, fontWeight: 700 }}>{vehicle.year} {vehicle.make} {vehicle.model}</div>
          <div className="mono muted" style={{ fontSize: 10.5, marginTop: 2 }}>${vehicle.down.toLocaleString()} down · {vehicle.mileage?.toLocaleString?.() || vehicle.mileage} mi</div>
        </div>
      </div>

      <div style={{ height: 14 }}/>
      <CBPanelTitle>OVERLAY APPROACH</CBPanelTitle>
      <div className="col" style={{ gap: 8 }}>
        <button className="cb-add-btn" onClick={() => onTab("templates")} style={{ alignItems: "flex-start", padding: 10 }}>
          <div>
            <div style={{ fontWeight: 700 }}>Use template</div>
            <div className="muted" style={{ fontSize: 10.5, marginTop: 2 }}>Pick a defined overlay for Facebook, Craigslist, Spanish, low down, work truck, and more.</div>
          </div>
          <Icon.Layers size={14}/>
        </button>
        <button className="cb-add-btn" onClick={() => onTemplate("blank")} style={{ alignItems: "flex-start", padding: 10 }}>
          <div>
            <div style={{ fontWeight: 700 }}>Blank overlay</div>
            <div className="muted" style={{ fontSize: 10.5, marginTop: 2 }}>Keep the vehicle photo and build your own text, badges, CTA, and disclosure.</div>
          </div>
          <Icon.Plus size={14}/>
        </button>
      </div>

      <div style={{ height: 14 }}/>
      <CBPanelTitle>NEXT TOOLS</CBPanelTitle>
      <div className="col" style={{ gap: 5 }}>
        <button className="cb-link" onClick={() => onTab("text")}><Icon.FileText size={11}/> Add text</button>
        <button className="cb-link" onClick={() => onTab("badges")}><Icon.Tag size={11}/> Add badges</button>
        <button className="cb-link" onClick={() => onTab("offer")}><Icon.Dollar size={11}/> Set offer terms</button>
        <button className="cb-link" onClick={() => onTab("photos")}><Icon.Image size={11}/> Photo/collage tools</button>
      </div>
    </>
  );
}

function TemplatesTab({ templateId, onTemplate, adTemplates, savedTemplates = [], onSavedTemplate, vehicle, onVehicle, vehicles }) {
  const { vehicleSvg } = GGG;
  const { palettes } = CreativeBuilderData;
  return (
    <>
      <CBPanelTitle>VEHICLE</CBPanelTitle>
      <select className="cb-select" value={vehicle.id} onChange={e => onVehicle(vehicles.find(v => v.id === e.target.value))}>
        {vehicles.map(v => <option key={v.id} value={v.id}>{v.year} {v.make} {v.model}</option>)}
      </select>
      <div style={{
        marginTop: 8, padding: 8,
        background: "var(--gray-50)",
        borderRadius: "var(--radius)",
        border: "1px solid var(--border)",
        display: "flex", gap: 8, alignItems: "center",
      }}>
        <div style={{ width: 48, height: 36, borderRadius: 3, overflow: "hidden", background: "#cbd5e1", flex: "0 0 48px" }}>
          <VehicleMedia v={vehicle}/>
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 11.5, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{vehicle.year} {vehicle.make} {vehicle.model}</div>
          <div className="mono muted" style={{ fontSize: 10.5 }}>${vehicle.down.toLocaleString()} down · ${vehicle.weekly}/wk</div>
        </div>
      </div>

      <div style={{ height: 14 }}/>

      <CBPanelTitle>STARTING POINTS</CBPanelTitle>
      <button onClick={() => onTemplate("blank")}
        style={{
          width: "100%",
          background: "var(--surface)",
          border: templateId === "blank" ? "2px solid var(--primary)" : "1px solid var(--border)",
          borderRadius: "var(--radius)",
          padding: 10,
          cursor: "pointer",
          fontFamily: "inherit",
          textAlign: "left",
          marginBottom: 10,
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}>
        <div style={{ width: 42, height: 32, background: "#fff", border: "1px solid var(--border)", borderRadius: 4, display: "grid", placeItems: "center", color: "var(--text-2)" }}>
          <Icon.Plus size={16}/>
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text)" }}>Blank overlay</div>
          <div className="muted" style={{ fontSize: 10.5 }}>Keep the vehicle photo and build the ad overlay yourself.</div>
        </div>
      </button>

      <CBPanelTitle>AD TEMPLATES</CBPanelTitle>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {adTemplates.map(t => {
          const sel = t.id === templateId;
          const p = palettes[t.palette];
          return (
            <button key={t.id} onClick={() => onTemplate(t.id)}
              style={{
                background: "transparent",
                border: sel ? "2px solid var(--primary)" : "1px solid var(--border)",
                borderRadius: "var(--radius)",
                padding: 0,
                cursor: "pointer",
                fontFamily: "inherit",
                overflow: "hidden",
                textAlign: "left",
              }}>
              <div style={{ aspectRatio: "1/1", background: p.bg, position: "relative", overflow: "hidden" }}>
                <MiniTemplatePreview tpl={t} palette={p} vehicle={vehicle}/>
              </div>
              <div style={{ padding: "5px 7px", background: "var(--surface)", borderTop: "1px solid var(--border)" }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.name}</div>
                <div style={{ fontSize: 9.5, color: "var(--text-2)" }}>{t.category}</div>
              </div>
            </button>
          );
        })}
      </div>

      {savedTemplates.length > 0 && (
        <>
          <div style={{ height: 14 }}/>
          <CBPanelTitle>SAVED TEMPLATES</CBPanelTitle>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {savedTemplates.map(t => {
              const canvas = t.canvas_json || {};
              return (
                <button key={t.id} onClick={() => onSavedTemplate?.(t)}
                  style={{
                    display: "flex", gap: 8, alignItems: "center",
                    background: "var(--surface)", border: templateId === `saved-${t.id}` ? "2px solid var(--primary)" : "1px solid var(--border)", borderRadius: "var(--radius)",
                    padding: 8, cursor: "pointer", fontFamily: "inherit", color: "var(--text)",
                    textAlign: "left",
                  }}>
                  <div style={{ width: 40, height: 40, background: "var(--gray-100)", borderRadius: 3, overflow: "hidden", flex: "0 0 40px" }}>
                    <VehicleMedia v={canvas.vehicle || vehicle}/>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11.5, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.name}</div>
                    <div className="muted mono" style={{ fontSize: 10.5 }}>{canvas.size?.name || t.format}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}
    </>
  );
}

function ImportTemplateTab({ onAddLayer }) {
  const sources = [
    { name: "GetGoGone JSON", detail: "Fully editable layer templates exported from this app." },
    { name: "SVG layout", detail: "Best for simple vector layouts; parsed import comes later." },
    { name: "PNG/JPG design", detail: "Use as a locked overlay/background reference." },
    { name: "Dealer-owned Canva export", detail: "Upload only designs the dealership has rights to use." },
    { name: "Approved partner badge", detail: "Upload official assets only when the dealer has permission." },
  ];
  return (
    <>
      <CBPanelTitle>IMPORT TEMPLATE</CBPanelTitle>
      <div style={{ border: "2px dashed var(--border-strong)", borderRadius: "var(--radius)", padding: 18, textAlign: "center", color: "var(--text-2)", marginBottom: 12 }}>
        <Icon.Upload size={22} className="ico"/>
        <div style={{ marginTop: 8, fontWeight: 600, color: "var(--text)", fontSize: 12 }}>Upload template asset</div>
        <div style={{ fontSize: 10.5, marginTop: 4 }}>PNG, JPG, SVG, PDF, or GetGoGone JSON</div>
      </div>

      <CBPanelTitle>SUPPORTED SOURCES</CBPanelTitle>
      <div className="col" style={{ gap: 6 }}>
        {sources.map(source => (
          <div key={source.name} style={{ border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: 8 }}>
            <div style={{ fontSize: 11.5, fontWeight: 700 }}>{source.name}</div>
            <div className="muted" style={{ fontSize: 10.5, lineHeight: 1.4, marginTop: 2 }}>{source.detail}</div>
          </div>
        ))}
      </div>

      <div style={{ height: 14 }}/>
      <CBPanelTitle>QUICK IMPORT PLACEHOLDER</CBPanelTitle>
      <button className="cb-add-btn" onClick={() => onAddLayer({
        id: "import-" + Date.now(),
        type: "shape",
        x: 8,
        y: 8,
        w: 84,
        h: 84,
        color: "rgba(15,23,42,0.08)",
        border: true,
      })}>
        <span>Add import frame</span>
        <Icon.Plus size={13}/>
      </button>
      <div className="muted" style={{ fontSize: 10.5, marginTop: 8, lineHeight: 1.45 }}>
        License guardrail: free or third-party templates should only be imported when commercial-use rights are clear. Official logos and badges are upload-only, not generated.
      </div>
    </>
  );
}

function MiniTemplatePreview({ tpl, palette, vehicle }) {
  const hasPhoto = tpl.layers.some(l => l.type === "photo");
  const ribbon = tpl.layers.find(l => l.type === "ribbon");
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {hasPhoto && (
        <div style={{
          position: "absolute", left: 0, right: 0,
          top: tpl.id === "lowdown" ? 0 : tpl.id === "tax" ? "30%" : 0,
          bottom: tpl.id === "lowdown" ? 0 : tpl.id === "tax" ? "30%" : tpl.id === "family" ? "45%" : tpl.id === "fresh" ? "35%" : "40%",
          overflow: "hidden", background: "#cbd5e1",
        }}>
          <VehicleMedia v={vehicle}/>
        </div>
      )}
      {ribbon && (
        <div style={{ position: "absolute", top: 4, left: 4, background: ribbon.color, color: ribbon.textColor, padding: "2px 5px", fontSize: 6, fontWeight: 800, borderRadius: 1, letterSpacing: "0.06em" }}>{ribbon.text}</div>
      )}
      <div style={{ position: "absolute", left: 6, right: 6, bottom: 6, color: palette.text, fontSize: 8 }}>
        <div style={{ fontSize: 8.5, fontWeight: 800, color: palette.text, lineHeight: 1, marginBottom: 2 }}>
          {vehicle.year} {vehicle.make}
        </div>
        <div style={{ display: "flex", gap: 3 }}>
          <span style={{ background: palette.panel, color: palette.text, padding: "1px 3px", fontSize: 6, fontWeight: 700, borderRadius: 1 }}>${vehicle.down.toString().slice(0,2)}+ DOWN</span>
          <span style={{ background: palette.accent, color: palette.bg, padding: "1px 3px", fontSize: 6, fontWeight: 700, borderRadius: 1 }}>${vehicle.weekly}/WK</span>
        </div>
      </div>
    </div>
  );
}

function PhotosTab({ vehicle, onAddLayer, onAddLayers }) {
  return (
    <>
      <CBPanelTitle action={<button className="cb-link"><Icon.Upload size={11}/> Upload</button>}>VEHICLE PHOTOS</CBPanelTitle>
      <div className="col" style={{ gap: 6, marginBottom: 10 }}>
        <button className="cb-add-btn" onClick={() => onAddLayer({
          id: "photo-" + Date.now(),
          type: "photo",
          x: 8,
          y: 10,
          w: 84,
          h: 54,
          fit: "cover",
        })}>
          <span>Add vehicle photo layer</span>
          <Icon.Plus size={13}/>
        </button>
        <button className="cb-add-btn" onClick={() => {
          const collageLayers = [
            { x: 5, y: 8, w: 43, h: 36 },
            { x: 52, y: 8, w: 43, h: 36 },
            { x: 5, y: 48, w: 90, h: 40 },
          ].map((box, index) => ({
            id: "collage-" + Date.now() + "-" + index,
            type: "photo",
            fit: "cover",
            ...box,
          }));
          if (onAddLayers) {
            onAddLayers(collageLayers);
          } else {
            collageLayers.forEach(l => onAddLayer(l));
          }
        }}>
          <span>Add 3-photo collage</span>
          <Icon.Image size={13}/>
        </button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
        {(() => {
          const photos = vehicle.images || vehicle.photosList || [];
          if (photos.length > 0) {
            return photos.map((url, i) => (
              <button key={i} onClick={() => onAddLayer({
                id: "photo-thumb-" + Date.now() + "-" + i,
                type: "photo",
                x: 10 + (i % 2) * 8,
                y: 12 + (i % 3) * 6,
                w: 70,
                h: 48,
                fit: "cover",
                index: i,
                src: url,
              })} style={{ aspectRatio: "4/3", background: "#cbd5e1", border: "1px solid var(--border)", borderRadius: 4, overflow: "hidden", cursor: "pointer", position: "relative", padding: 0 }}>
                <VehicleMedia v={vehicle} index={i}/>
              </button>
            ));
          }
          
          return Array.from({ length: 4 }).map((_, i) => (
            <button key={i} onClick={() => onAddLayer({
              id: "photo-thumb-" + Date.now() + "-" + i,
              type: "photo",
              x: 10 + (i % 2) * 8,
              y: 12 + (i % 3) * 6,
              w: 70,
              h: 48,
              fit: "cover",
              index: 0,
            })} style={{ aspectRatio: "4/3", background: "#cbd5e1", border: "1px solid var(--border)", borderRadius: 4, overflow: "hidden", cursor: "pointer", position: "relative", padding: 0 }}>
              <VehicleMedia v={vehicle} index={0}/>
            </button>
          ));
        })()}
      </div>
      <div style={{ marginTop: 14 }}>
        <CBPanelTitle>BACKGROUND PHOTOS</CBPanelTitle>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
          {[
            { l: "Lot · day", bg: "linear-gradient(180deg, #87CEEB, #B0C4DE)" },
            { l: "Lot · dusk", bg: "linear-gradient(180deg, #FB923C, #7C2D12)" },
            { l: "Showroom", bg: "linear-gradient(180deg, #1E293B, #0F172A)" },
            { l: "Garage", bg: "linear-gradient(180deg, #44403C, #292524)" },
            { l: "Open road", bg: "linear-gradient(180deg, #FCD34D, #92400E)" },
            { l: "City street", bg: "linear-gradient(180deg, #6B7280, #374151)" },
          ].map((b, i) => (
            <div key={i} style={{ aspectRatio: "4/3", borderRadius: 4, background: b.bg, border: "1px solid var(--border)", cursor: "pointer", display: "flex", alignItems: "flex-end", padding: 5 }}>
              <span style={{ fontSize: 9, color: "#fff", textShadow: "0 1px 2px rgba(0,0,0,0.5)" }}>{b.l}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function ShapesTab({ onAddLayer, onAddLayers }) {
  const shapes = [
    { label: "Rectangle", patch: { type: "shape", x: 10, y: 70, w: 80, h: 18, color: "#111827", opacity: 0.92 } },
    { label: "White panel", patch: { type: "shape", x: 6, y: 66, w: 88, h: 28, color: "#FFFFFF", border: true } },
    { label: "Accent bar", patch: { type: "shape", x: 0, y: 0, w: 100, h: 8, color: "#F59E0B" } },
    { label: "Side rail", patch: { type: "shape", x: 0, y: 0, w: 18, h: 100, color: "#111827", opacity: 0.94 } },
    { label: "Overlay shade", patch: { type: "shape", x: 0, y: 0, w: 100, h: 100, color: "#000000", opacity: 0.28 } },
  ];
  return (
    <>
      <CBPanelTitle>BASIC SHAPES</CBPanelTitle>
      <div className="col" style={{ gap: 6 }}>
        {shapes.map((shape, index) => (
          <button key={shape.label} className="cb-add-btn" onClick={() => onAddLayer({
            id: "shape-" + Date.now() + "-" + index,
            ...shape.patch,
          })}>
            <span>{shape.label}</span>
            <span style={{ width: 22, height: 14, borderRadius: 3, background: shape.patch.color, border: shape.patch.border ? "1px solid var(--border)" : "none", opacity: shape.patch.opacity ?? 1 }}/>
          </button>
        ))}
      </div>

      <div style={{ height: 14 }}/>
      <CBPanelTitle>QUICK LAYOUTS</CBPanelTitle>
      <div className="col" style={{ gap: 6 }}>
        <button className="cb-add-btn" onClick={() => {
          const list = [
            { type: "shape", x: 0, y: 70, w: 100, h: 30, color: "#111827", opacity: 0.94 },
            { type: "shape", x: 5, y: 76, w: 28, h: 12, color: "#DC2626" },
            { type: "shape", x: 36, y: 76, w: 28, h: 12, color: "#1F2937" },
            { type: "shape", x: 67, y: 76, w: 28, h: 12, color: "#1F2937" },
          ].map((layer, idx) => ({ id: "layout-footer-" + Date.now() + "-" + idx, ...layer }));
          if (onAddLayers) onAddLayers(list);
          else list.forEach(l => onAddLayer(l));
        }}>
          <span>Offer footer layout</span>
          <Icon.Plus size={13}/>
        </button>
        <button className="cb-add-btn" onClick={() => {
          const list = [
            { type: "shape", x: 0, y: 0, w: 34, h: 100, color: "#7F1D1D", opacity: 0.92 },
            { type: "shape", x: 34, y: 0, w: 66, h: 100, color: "#000000", opacity: 0.2 },
          ].map((layer, idx) => ({ id: "layout-split-" + Date.now() + "-" + idx, ...layer }));
          if (onAddLayers) onAddLayers(list);
          else list.forEach(l => onAddLayer(l));
        }}>
          <span>Split-panel layout</span>
          <Icon.Plus size={13}/>
        </button>
      </div>
    </>
  );
}

function TextTab({ onAddLayer, onAddLayers }) {
  const presets = [
    { label: "Headline", size: 7, weight: 800, role: "headline" },
    { label: "Subhead", size: 4, weight: 600, role: "subhead" },
    { label: "Body text", size: 2.5, weight: 500 },
    { label: "Small print", size: 1.5, weight: 500 },
    { label: "Disclosure", size: 1.3, weight: 400, role: "disclosure" },
  ];
  const quick = [
    "{{year}} {{make}} {{model}}",
    "{{down_payment}} DOWN",
    "{{weekly_payment}}",
    "Financing Available",
    "Drive Today - Apply at {{website}}",
    "Call {{phone}}",
  ];
  const blocks = [
    { label: "Vehicle title block", layers: [
      { type: "text", text: "{{year}} {{make}} {{model}}", x: 5, y: 72, w: 90, h: 7, size: 5, weight: 800, color: "#FFFFFF", align: "left", role: "headline" },
      { type: "text", text: "{{trim}} - {{mileage}}", x: 5, y: 80, w: 90, h: 4, size: 2.2, weight: 500, color: "#E2E8F0", align: "left" },
    ]},
    { label: "Offer footer", layers: [
      { type: "shape", x: 0, y: 76, w: 100, h: 24, color: "#111827", opacity: 0.94 },
      { type: "stat-row", x: 5, y: 80, w: 90, h: 9, color: "#FFFFFF", bg: "#1F2937", items: [
        { label: "DOWN", value: "{{down_payment}}" },
        { label: "TERMS", value: "{{weekly_payment}}", highlight: true },
        { label: "PRICE", value: "{{price}}" },
      ]},
      { type: "text", text: "{{disclosure}}", x: 5, y: 95, w: 90, h: 3, size: 1.3, weight: 400, color: "#94A3B8", align: "left", role: "disclosure" },
    ]},
    { label: "Spanish CTA block", layers: [
      { type: "text", text: "Hablamos Espanol", x: 5, y: 68, w: 50, h: 5, size: 3.4, weight: 800, color: "#FBBF24", align: "left" },
      { type: "cta", text: "Llama {{phone}}", x: 5, y: 88, w: 45, h: 6, bg: "#DC2626", color: "#FFFFFF" },
    ]},
    { label: "Marketplace info panel", layers: [
      { type: "shape", x: 0, y: 70, w: 100, h: 30, color: "#FFFFFF", border: true },
      { type: "text", text: "{{year}} {{make}} {{model}}", x: 4, y: 73, w: 66, h: 6, size: 4, weight: 800, color: "#0F172A", align: "left" },
      { type: "text", text: "{{down_payment}} DOWN", x: 72, y: 73, w: 24, h: 6, size: 3.2, weight: 900, color: "#DC2626", align: "right" },
      { type: "cta", text: "Call {{phone}}", x: 4, y: 89, w: 42, h: 6, bg: "#111827", color: "#FFFFFF" },
    ]},
  ];
  return (
    <>
      <CBPanelTitle>TEXT STYLES</CBPanelTitle>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {presets.map((p, i) => (
          <button key={i} onClick={() => onAddLayer({
            id: "text-" + Date.now() + i,
            type: "text",
            x: 10, y: 40 + i * 7, w: 80, h: p.size * 1.3,
            text: p.label,
            size: p.size, weight: p.weight, color: "#0F172A", align: "left", role: p.role,
          })}
            className="cb-add-btn">
            <div style={{ fontWeight: p.weight, fontSize: Math.min(p.size * 2 + 4, 17) }}>{p.label}</div>
            <Icon.Plus size={13}/>
          </button>
        ))}
      </div>

      <div style={{ height: 16 }}/>
      <CBPanelTitle>BUILDING BLOCKS</CBPanelTitle>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {blocks.map((block, i) => (
          <button key={block.label} onClick={() => {
            const list = block.layers.map((layer, idx) => ({
              id: "block-" + Date.now() + "-" + i + "-" + idx,
              ...layer,
            }));
            if (onAddLayers) onAddLayers(list);
            else list.forEach(l => onAddLayer(l));
          }} className="cb-add-btn" style={{ padding: "8px" }}>
            <span>{block.label}</span>
            <Icon.Plus size={13}/>
          </button>
        ))}
      </div>

      <div style={{ height: 16 }}/>
      <CBPanelTitle>QUICK TEXT</CBPanelTitle>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {quick.map((t, i) => (
          <button key={i} onClick={() => onAddLayer({
            id: "qt-" + Date.now() + i, type: "text",
            x: 10, y: 40 + i * 5, w: 80, h: 5,
            text: t, size: 3, weight: 700, color: "#0F172A", align: "left",
          })}
            className="cb-add-btn" style={{ padding: "6px 8px", fontSize: 11.5 }}>
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{t}</span>
            <Icon.Plus size={12}/>
          </button>
        ))}
      </div>

      <div style={{ height: 16 }}/>
      <CBPanelTitle>VARIABLES</CBPanelTitle>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
        {["{{year}}","{{make}}","{{model}}","{{trim}}","{{price}}","{{down_payment}}","{{weekly_payment}}","{{monthly_payment}}","{{mileage}}","{{dealership_name}}","{{phone}}","{{website}}","{{disclosure}}"].map(v => (
          <button key={v} className="cb-chip mono" title="Copy variable"
            onClick={() => { navigator.clipboard?.writeText(v); }}>{v}</button>
        ))}
      </div>
      <div className="muted" style={{ fontSize: 10.5, marginTop: 4, lineHeight: 1.4 }}>
        Auto-fill from the selected vehicle. Paste into any text layer.
      </div>
    </>
  );
}

function BadgesTab({ onAddLayer }) {
  const ribbons = [
    { label: "Just In", color: "#DC2626", textColor: "#fff" },
    { label: "Price Drop", color: "#F59E0B", textColor: "#0F172A" },
    { label: "Low Miles", color: "#16A34A", textColor: "#fff" },
    { label: "Hablamos Espanol", color: "#0891B2", textColor: "#fff" },
    { label: "Free Vehicle History", color: "#1e3a8a", textColor: "#fff" },
    { label: "Reporte de Historial Gratis", color: "#1e3a8a", textColor: "#fff" },
    { label: "Going Fast", color: "#7C3AED", textColor: "#fff" },
    { label: "Work Ready", color: "#111827", textColor: "#fff" },
    { label: "Apply Online", color: "#16A34A", textColor: "#fff" },
  ];
  return (
    <>
      <CBPanelTitle>RIBBONS</CBPanelTitle>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {ribbons.map((b, i) => (
          <button key={b.label} onClick={() => onAddLayer({
            id: "ribbon-" + Date.now() + i, type: "ribbon",
            x: 4, y: 6 + i * 2, w: 30, h: 6, text: b.label.toUpperCase(),
            color: b.color, textColor: b.textColor,
          })}
            style={{
              background: b.color, color: b.textColor,
              border: "none", padding: "8px 12px", borderRadius: 4,
              fontWeight: 800, fontSize: 11, letterSpacing: "0.1em",
              cursor: "pointer", textAlign: "left", fontFamily: "inherit",
              clipPath: "polygon(0 0, 100% 0, 95% 50%, 100% 100%, 0 100%)",
            }}>
            {b.label.toUpperCase()}
          </button>
        ))}
      </div>

      <div style={{ height: 16 }}/>
      <CBPanelTitle>HISTORY QR CODES</CBPanelTitle>
      <button className="cb-add-btn" onClick={() => onAddLayer({
        id: "qr-" + Date.now(),
        type: "qr",
        x: 80, y: 4, w: 16, h: 20
      })}>
        <span>Add Report QR Code block</span>
        <Icon.Plus size={13}/>
      </button>

      <div style={{ height: 16 }}/>
      <CBPanelTitle>PAYMENT BADGES</CBPanelTitle>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {[
          { label: "Down · Weekly · Price", items: [
            { label: "DOWN", value: "{{down_payment}}" },
            { label: "WEEKLY", value: "{{weekly_payment}}", highlight: true },
            { label: "PRICE", value: "{{price}}" },
          ]},
          { label: "Down · Weekly · Monthly", items: [
            { label: "DOWN", value: "{{down_payment}}" },
            { label: "WEEKLY", value: "{{weekly_payment}}" },
            { label: "MONTHLY", value: "{{monthly_payment}}", highlight: true },
          ]},
          { label: "Price + Payment", items: [
            { label: "PRICE", value: "{{price}}" },
            { label: "WEEKLY", value: "{{weekly_payment}}", highlight: true },
          ]},
        ].map((p, i) => (
          <button key={i} onClick={() => onAddLayer({
            id: "stat-" + Date.now() + i, type: "stat-row",
            x: 5, y: 78, w: 90, h: 9, color: "#fff", bg: "#0F172A",
            items: p.items,
          })}
            className="cb-add-btn">
            <span>{p.label}</span>
            <Icon.Plus size={13}/>
          </button>
        ))}
      </div>

      <div style={{ height: 16 }}/>
      <CBPanelTitle>CTA BUTTONS</CBPanelTitle>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {[
          { t: "Apply in 2 minutes →", bg: "#2563EB", color: "#fff" },
          { t: "Drive Today — Call {{phone}}", bg: "#DC2626", color: "#fff" },
          { t: "Visit {{website}}", bg: "#16A34A", color: "#fff" },
          { t: "Get Pre-Approved →", bg: "#F59E0B", color: "#0F172A" },
        ].map((c, i) => (
          <button key={i} onClick={() => onAddLayer({
            id: "cta-" + Date.now() + i, type: "cta",
            x: 5, y: 88, w: 50, h: 6, text: c.t, bg: c.bg, color: c.color,
          })} className="cb-add-btn">
            <span style={{
              background: c.bg, color: c.color, padding: "3px 8px",
              borderRadius: 3, fontWeight: 700, fontSize: 10.5,
            }}>{c.t}</span>
            <Icon.Plus size={13}/>
          </button>
        ))}
      </div>

      <div style={{ height: 16 }}/>
      <CBPanelTitle>LOGOS</CBPanelTitle>
      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        {[
          { l: "Dark", c: "dark", bg: "#111", color: "#fff" },
          { l: "Light", c: "light", bg: "#fff", color: "#111" },
        ].map((o, i) => (
          <button key={i} onClick={() => onAddLayer({
            id: "logo-" + Date.now() + i, type: "logo",
            x: 6, y: 6, w: 16, h: 7, color: o.c,
          })}
            style={{
              flex: 1, padding: "10px",
              background: o.bg, color: o.color,
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              fontFamily: "inherit", fontWeight: 800, fontSize: 14, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 2,
            }}>
            G<span style={{ width: 4, height: 4, background: "#F59E0B", borderRadius: "50%" }}/>G
          </button>
        ))}
      </div>

      <div style={{
        marginTop: 14,
        background: "rgba(245, 158, 11, 0.08)",
        border: "1px solid rgba(245, 158, 11, 0.2)",
        borderRadius: "var(--radius)",
        padding: 9,
        fontSize: 11,
        lineHeight: 1.45,
        color: "var(--text)"
      }}>
        <div style={{ fontWeight: 700, color: "#d97706", marginBottom: 3, display: "flex", alignItems: "center", gap: 4 }}>
          <Icon.AlertTriangle size={12}/> Badging Compliance Notice
        </div>
        Since the dealership does not possess an active Carfax license, do NOT use official Carfax logo badges in ad creatives to avoid trademark liabilities. Safely use our generic <strong>"Free Vehicle History"</strong> ribbons or dynamic <strong>QR Code blocks</strong> to direct buyers to hosted history reports securely!
      </div>
    </>
  );
}

function OfferTab({ brand, onBrand }) {
  const offer = brand.offer || {};
  const updateOffer = (patch) => onBrand({ ...brand, offer: { ...offer, ...patch } });

  return (
    <>
      <CBPanelTitle>OFFER TERMS</CBPanelTitle>
      <div style={{ background: "var(--amber-50, #FFFBEB)", border: "1px solid var(--warning)", borderRadius: "var(--radius)", padding: 9, fontSize: 11.5, lineHeight: 1.45, color: "var(--text)", marginBottom: 12 }}>
        Missing amounts will not render as $0. Use labels like "Low Down Payment" until the manager approves exact terms.
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <CBField label="Down payment amount" value={offer.downPayment || ""} onChange={v => updateOffer({ downPayment: v })}/>
        <CBField label="Fallback down label" value={offer.downPaymentLabel || "Low Down Payment"} onChange={v => updateOffer({ downPaymentLabel: v })}/>
        <CBField label="Price" value={offer.price || ""} onChange={v => updateOffer({ price: v })}/>
        <CBField label="Fallback price label" value={offer.priceLabel || "Call for Price"} onChange={v => updateOffer({ priceLabel: v })}/>
        <CBField label="Weekly payment" value={offer.weeklyPayment || ""} onChange={v => updateOffer({ weeklyPayment: v })}/>
        <CBField label="Weekly fallback" value={offer.weeklyPaymentLabel || "Terms Available"} onChange={v => updateOffer({ weeklyPaymentLabel: v })}/>
        <CBField label="Monthly payment" value={offer.monthlyPayment || ""} onChange={v => updateOffer({ monthlyPayment: v })}/>
        <CBField label="Monthly fallback" value={offer.monthlyPaymentLabel || "Pending"} onChange={v => updateOffer({ monthlyPaymentLabel: v })}/>
      </div>

      <div style={{ height: 14 }}/>
      <CBPanelTitle>OFFER DISPLAY</CBPanelTitle>
      <label className="cb-check"><input type="checkbox" checked={!!offer.showWeekly} onChange={e => updateOffer({ showWeekly: e.target.checked })}/>Weekly terms approved</label>
      <label className="cb-check"><input type="checkbox" checked={!!offer.showMonthly} onChange={e => updateOffer({ showMonthly: e.target.checked })}/>Monthly terms approved</label>

      <div style={{ height: 14 }}/>
      <CBPanelTitle>DISCLOSURE</CBPanelTitle>
      <textarea value={brand.disclosure} onChange={e => onBrand({ ...brand, disclosure: e.target.value })}
        className="cb-input" rows={4} style={{ resize: "vertical", lineHeight: 1.4 }}/>
    </>
  );
}

function BrandTab({ brand, onBrand }) {
  return (
    <>
      <CBPanelTitle>BRAND COLORS</CBPanelTitle>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 4 }}>
        {brand.colors.map((c, i) => (
          <div key={i} style={{ aspectRatio: "1/1", background: c, borderRadius: 4, border: "1px solid var(--border)", cursor: "pointer", position: "relative" }}
            title={c}>
            <input type="color" value={c} onChange={(e) => {
              const newColors = [...brand.colors];
              newColors[i] = e.target.value;
              onBrand({ ...brand, colors: newColors });
            }} style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }}/>
          </div>
        ))}
      </div>
      <div className="muted" style={{ fontSize: 10.5, marginTop: 4 }}>Click any swatch to recolor.</div>

      <div style={{ height: 14 }}/>
      <CBPanelTitle>LOGO</CBPanelTitle>
      <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--gray-50)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: 10 }}>
        <div style={{
          width: 36, height: 36, background: "#111", color: "#fff", borderRadius: 4,
          display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14, gap: 1,
        }}>
          G<span style={{ width: 4, height: 4, background: "#F59E0B", borderRadius: "50%" }}/>G
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: 11.5 }}>{brand.name}</div>
          <div className="cb-link" style={{ marginTop: 2 }}>Replace logo</div>
        </div>
      </div>

      <div style={{ height: 14 }}/>
      <CBPanelTitle>DEALERSHIP INFO</CBPanelTitle>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <CBField label="Name" value={brand.name} onChange={v => onBrand({ ...brand, name: v })}/>
        <CBField label="Phone" value={brand.phone} onChange={v => onBrand({ ...brand, phone: v })}/>
        <CBField label="Website" value={brand.website} onChange={v => onBrand({ ...brand, website: v })}/>
      </div>

      <div style={{ height: 14 }}/>
      <CBPanelTitle>DISCLOSURE</CBPanelTitle>
      <textarea value={brand.disclosure} onChange={e => onBrand({ ...brand, disclosure: e.target.value })}
        className="cb-input"
        rows={4} style={{ resize: "vertical", lineHeight: 1.4 }}/>
    </>
  );
}

function VersionsTab({ versions, onLoadVersion }) {
  if (versions.length === 0) {
    return (
      <>
        <CBPanelTitle>SAVED VARIATIONS</CBPanelTitle>
        <div style={{
          padding: 24, textAlign: "center",
          color: "var(--text-2)", fontSize: 11.5,
          background: "var(--gray-50)", borderRadius: "var(--radius)",
          border: "1px dashed var(--border-strong)",
        }}>
          <Icon.Folder size={24} style={{ opacity: 0.4 }}/>
          <div style={{ marginTop: 8 }}>No saved variations yet.<br/>Hit <strong style={{ color: "var(--text)" }}>Save version</strong> or <strong style={{ color: "var(--text)" }}>Create 5 variations</strong> on the right.</div>
        </div>
      </>
    );
  }
  return (
    <>
      <CBPanelTitle>SAVED VARIATIONS</CBPanelTitle>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {versions.map(v => {
          const canvas = v.canvas_json || v;
          const versionVehicle = canvas.vehicle || v.vehicle;
          const versionSize = canvas.size || v.size || { name: v.format };
          return (
          <button key={v.id} onClick={() => onLoadVersion(v)}
            style={{
              display: "flex", gap: 8, alignItems: "center",
              background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)",
              padding: 8, cursor: "pointer", fontFamily: "inherit", color: "var(--text)",
              textAlign: "left",
            }}>
            <div style={{ width: 40, height: 40, background: "var(--gray-100)", borderRadius: 3, overflow: "hidden", flex: "0 0 40px" }}>
              <VehicleMedia v={versionVehicle}/>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11.5, fontWeight: 600 }}>{v.name}</div>
              <div className="muted mono" style={{ fontSize: 10.5 }}>{versionSize.name || versionSize.id || v.format}</div>
            </div>
          </button>
          );
        })}
      </div>
    </>
  );
}

function CBField({ label, value, onChange }) {
  return (
    <div>
      <label style={{ fontSize: 10, fontWeight: 600, color: "var(--text-2)", letterSpacing: "0.04em", display: "block", marginBottom: 3 }}>{label.toUpperCase()}</label>
      <input value={value} onChange={e => onChange(e.target.value)} className="cb-input"/>
    </div>
  );
}

function AIOverlaysTab({ onAddLayer, onAddLayers, toast, clientId }) {
  const [prompt, setPrompt] = React.useState("");
  const [generating, setGenerating] = React.useState(false);

  const presets = [
    {
      label: "Bilingual Spanish Ribbon",
      description: "Gold and red footer banner with approved bilingual lending CTA",
      layers: [
        { type: "shape", x: 0, y: 74, w: 100, h: 26, color: "#991B1B", opacity: 0.95 },
        { type: "shape", x: 0, y: 74, w: 100, h: 2, color: "#D97706" },
        { type: "text", text: "FINANCIAMIENTO DISPONIBLE", x: 5, y: 77, w: 90, h: 7, size: 4.8, weight: 800, color: "#FFFFFF", align: "center" },
        { type: "text", text: "¡Aprobación garantizada con tu pasaporte o identificación!", x: 5, y: 86, w: 90, h: 4, size: 2.1, weight: 600, color: "#FEF08A", align: "center" },
        { type: "cta", text: "Llama ahora: {{phone}}", x: 25, y: 92, w: 50, h: 5.5, bg: "#D97706", color: "#FFFFFF" }
      ]
    },
    {
      label: "Craigslist High-Impact",
      description: "Contrasting orange borders and bold white title/financing callout panels",
      layers: [
        { type: "shape", x: 0, y: 0, w: 100, h: 6, color: "#EA580C" },
        { type: "shape", x: 0, y: 84, w: 100, h: 16, color: "#EA580C" },
        { type: "text", text: "{{year}} {{make}} {{model}}", x: 4, y: 1.2, w: 92, h: 4.5, size: 3.8, weight: 900, color: "#FFFFFF", align: "center", role: "headline" },
        { type: "text", text: "ONLY {{down_payment}} DOWN & LOW WEEKLY PAYMENTS!", x: 4, y: 86, w: 92, h: 5, size: 3.5, weight: 900, color: "#FFFFFF", align: "center" },
        { type: "text", text: "APPLY DIRECTLY ON {{website}} OR CALL {{phone}}", x: 4, y: 92, w: 92, h: 4, size: 2.2, weight: 800, color: "#FEF08A", align: "center" }
      ]
    },
    {
      label: "Free History QR Badge",
      description: "Clean right-hand vector history card with simulated QR scan decal",
      layers: [
        { type: "shape", x: 68, y: 4, w: 28, h: 32, color: "#FFFFFF", opacity: 0.95, border: true },
        { type: "text", text: "FREE HISTORY REPORT", x: 69, y: 6, w: 26, h: 4, size: 1.6, weight: 800, color: "#0F172A", align: "center" },
        { type: "shape", x: 74, y: 11, w: 16, h: 16, color: "#000000" },
        { type: "shape", x: 75.5, y: 12.5, w: 13, h: 13, color: "#FFFFFF" },
        { type: "text", text: "SCAN ME", x: 74, y: 28.5, w: 16, h: 3, size: 1.2, weight: 700, color: "#0F172A", align: "center" }
      ]
    },
    {
      label: "Minimalist Lot Specs Bar",
      description: "Translucent dark overlay band showing lot inspection mileage and price details",
      layers: [
        { type: "shape", x: 0, y: 80, w: 100, h: 20, color: "#0F172A", opacity: 0.86 },
        { type: "text", text: "PRICE: {{price}}   ·   DOWN: {{down_payment}}   ·   WEEKLY: {{weekly_payment}}", x: 5, y: 83, w: 90, h: 5, size: 3.2, weight: 800, color: "#FFFFFF", align: "center" },
        { type: "text", text: "{{trim}} PACKAGE  ·  LOT READY INSPECTED  ·  {{mileage}} ORIGINAL MILES", x: 5, y: 91, w: 90, h: 4, size: 2, weight: 600, color: "#94A3B8", align: "center" }
      ]
    }
  ];

  const applyPreset = (preset) => {
    const list = preset.layers.map(layer => ({
      ...layer,
      id: `${layer.type}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`
    }));
    if (onAddLayers) {
      onAddLayers(list);
    } else {
      list.forEach(layer => onAddLayer(layer));
    }
    toast?.(`Applied "${preset.label}" overlay preset layers!`);
  };

  const generateAIOverlay = async () => {
    if (!prompt.trim()) {
      toast?.("Please enter a custom style description prompt.");
      return;
    }
    setGenerating(true);
    try {
      const res = await fetch("/api/ai/overlay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, clientId }),
      });
      const result = await res.json();
      if (!res.ok || !result.success || !Array.isArray(result.layers)) {
        throw new Error(result.error || "Failed to generate overlay");
      }
      
      const list = result.layers.map(layer => ({
        ...layer,
        id: `${layer.type}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`
      }));
      
      if (onAddLayers) {
        onAddLayers(list);
      } else {
        list.forEach(layer => onAddLayer(layer));
      }
      
      toast?.("🤖 AI overlay layers successfully generated and applied!");
      setPrompt("");
    } catch (err) {
      toast?.(`Could not generate AI overlay: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <>
      <CBPanelTitle>AI OVERLAY PRESETS</CBPanelTitle>
      <div className="col" style={{ gap: 8, marginBottom: 16 }}>
        {presets.map(p => (
          <button key={p.label} className="cb-add-btn" onClick={() => applyPreset(p)}
            style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", padding: "10px 12px", textAlign: "left", gap: 3 }}>
            <div style={{ fontWeight: 700, fontSize: 12, color: "var(--primary)", display: "flex", alignItems: "center", gap: 4 }}>
              <Icon.Sparkles size={11}/> {p.label}
            </div>
            <div className="muted" style={{ fontSize: 10.5, lineHeight: 1.35 }}>{p.description}</div>
          </button>
        ))}
      </div>

      <CBPanelTitle>🤖 DYNAMIC AI OVERLAY GENERATOR</CBPanelTitle>
      <div className="col" style={{ gap: 10, background: "var(--gray-50)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: 12 }}>
        <div className="field">
          <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text-2)" }}>Describe Overlay Style</label>
          <textarea
            className="input"
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder="e.g. Neon blue border framing with a large Craigslist title and yellow accent bar"
            disabled={generating}
            style={{ minHeight: 70, padding: "6px 8px", fontSize: 11.5 }}
          />
        </div>
        
        <button className="btn primary sm" onClick={generateAIOverlay} disabled={generating || !prompt.trim()} style={{ width: "100%", justifyContent: "center" }}>
          {generating ? (
            <>
              <Icon.Refresh className="ico animate-spin" size={12}/> Synthesizing custom AI layers...
            </>
          ) : (
            <>
              <Icon.Sparkles size={12}/> 🤖 Generate & Apply Overlay
            </>
          )}
        </button>
      </div>
    </>
  );
}

export { CBLeftSidebar };
