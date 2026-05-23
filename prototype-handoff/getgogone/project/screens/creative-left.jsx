// Creative Builder — Left sidebar (light theme)

function CBLeftSidebar({ tab, onTab, templateId, onTemplate, vehicle, onVehicle, layers, onAddLayer, brand, onBrand, versions, onLoadVersion }) {
  const { adTemplates } = window.CreativeBuilderData;
  const { VEHICLES, vehicleSvg } = window.GGG;

  const tabs = [
    { id: "templates", label: "Templates", icon: Icon.Layers },
    { id: "photos", label: "Photos", icon: Icon.Image },
    { id: "text", label: "Text", icon: Icon.FileText },
    { id: "badges", label: "Badges", icon: Icon.Tag },
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
        {tab === "templates" && <TemplatesTab templateId={templateId} onTemplate={onTemplate} adTemplates={adTemplates} vehicle={vehicle} onVehicle={onVehicle} vehicles={VEHICLES}/>}
        {tab === "photos" && <PhotosTab vehicle={vehicle} vehicleSvg={vehicleSvg}/>}
        {tab === "text" && <TextTab onAddLayer={onAddLayer}/>}
        {tab === "badges" && <BadgesTab onAddLayer={onAddLayer}/>}
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

function TemplatesTab({ templateId, onTemplate, adTemplates, vehicle, onVehicle, vehicles }) {
  const { vehicleSvg } = window.GGG;
  const { palettes } = window.CreativeBuilderData;
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
        <div style={{ width: 48, height: 36, borderRadius: 3, overflow: "hidden", background: "#cbd5e1", flex: "0 0 48px" }}
          dangerouslySetInnerHTML={{ __html: vehicleSvg(vehicle.body, vehicle.palette) }}/>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 11.5, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{vehicle.year} {vehicle.make} {vehicle.model}</div>
          <div className="mono muted" style={{ fontSize: 10.5 }}>${vehicle.down.toLocaleString()} down · ${vehicle.weekly}/wk</div>
        </div>
      </div>

      <div style={{ height: 14 }}/>

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
    </>
  );
}

function MiniTemplatePreview({ tpl, palette, vehicle }) {
  const { vehicleSvg } = window.GGG;
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
        }}
          dangerouslySetInnerHTML={{ __html: vehicleSvg(vehicle.body, vehicle.palette).replace('viewBox="0 0 200 130"', 'viewBox="0 0 200 130" preserveAspectRatio="xMidYMid slice" width="100%" height="100%"') }}/>
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

function PhotosTab({ vehicle, vehicleSvg }) {
  return (
    <>
      <CBPanelTitle action={<button className="cb-link"><Icon.Upload size={11}/> Upload</button>}>VEHICLE PHOTOS</CBPanelTitle>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} draggable style={{ aspectRatio: "4/3", background: "#cbd5e1", border: "1px solid var(--border)", borderRadius: 4, overflow: "hidden", cursor: "grab", position: "relative" }}
            dangerouslySetInnerHTML={{ __html: vehicleSvg(vehicle.body, vehicle.palette) }}/>
        ))}
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

function TextTab({ onAddLayer }) {
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
    "{{weekly_payment}}/week",
    "We Finance Everyone",
    "Drive Today — Apply at {{website}}",
    "📞 {{phone}}",
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
    { label: "1-Owner", color: "#0891B2", textColor: "#fff" },
    { label: "Clean Carfax", color: "#2563EB", textColor: "#fff" },
    { label: "Going Fast", color: "#7C3AED", textColor: "#fff" },
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
      <div style={{ display: "flex", gap: 6 }}>
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
  const { vehicleSvg } = window.GGG;
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
        {versions.map(v => (
          <button key={v.id} onClick={() => onLoadVersion(v)}
            style={{
              display: "flex", gap: 8, alignItems: "center",
              background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)",
              padding: 8, cursor: "pointer", fontFamily: "inherit", color: "var(--text)",
              textAlign: "left",
            }}>
            <div style={{ width: 40, height: 40, background: "var(--gray-100)", borderRadius: 3, overflow: "hidden", flex: "0 0 40px" }}
              dangerouslySetInnerHTML={{ __html: vehicleSvg(v.vehicle.body, v.vehicle.palette) }}/>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11.5, fontWeight: 600 }}>{v.name}</div>
              <div className="muted mono" style={{ fontSize: 10.5 }}>{v.size.name}</div>
            </div>
          </button>
        ))}
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

window.CBLeftSidebar = CBLeftSidebar;
window.CBField = CBField;
window.CBPanelTitle = CBPanelTitle;
