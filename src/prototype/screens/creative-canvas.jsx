import React from 'react';
import { Icon } from '../icons';
import { GGG } from '../data';
import { UI } from '../ui';
import { CreativeBuilderData } from './creative-templates';
import { VehicleMedia } from '../vehicle-media';

// Creative Builder — canvas + layer renderer (light theme, drag-to-move)

function CBCanvas({ width, height, layers, vars, vehicle, selectedId, onSelect, onLayerChange, onSnapshot, brand, scale = 1, interactive = true }) {
  return (
    <div style={{
      width: width * scale,
      height: height * scale,
      position: "relative",
      flexShrink: 0,
    }}>
      <div className="cb-artboard" style={{
        width, height,
        position: "absolute",
        top: 0, left: 0,
        transform: `scale(${scale})`,
        transformOrigin: "top left",
        background: "#fff",
        overflow: "hidden",
        boxShadow: "0 1px 3px rgba(15,23,42,0.08), 0 12px 30px -10px rgba(15,23,42,0.18)",
        containerType: "size",
        border: "1px solid var(--border)",
      }}
      onMouseDown={(e) => { if (e.target.classList.contains("cb-artboard")) onSelect && onSelect(null); }}
      >
        {layers.map(l => (
          <LayerEl key={l.id} l={l} vars={vars} vehicle={vehicle} brand={brand}
            selected={interactive && selectedId === l.id}
            onSelect={onSelect}
            onLayerChange={onLayerChange}
            onSnapshot={onSnapshot}
            interactive={interactive}/>
        ))}
      </div>
    </div>
  );
}

function LayerEl({ l, vars, vehicle, brand, selected, onSelect, onLayerChange, onSnapshot, interactive }) {
  const { vehicleSvg } = GGG;
  const { substitute } = CreativeBuilderData;
  const [dragging, setDragging] = React.useState(false);

  const isBg = l.type === "bg";
  const isLocked = !!l.locked;

  // --- pointer interaction (drag-to-move, click-to-select) ---
  const handlePointerDown = (e) => {
    if (!interactive || isBg || isLocked) return;
    if (e.button !== 0) return;
    e.stopPropagation();
    onSelect && onSelect(l.id);

    const artboard = e.currentTarget.closest(".cb-artboard");
    if (!artboard) return;
    const rect = artboard.getBoundingClientRect();   // screen px of the (scaled) artboard
    const startX = e.clientX, startY = e.clientY;
    const startLX = l.x, startLY = l.y;
    let moved = false;
    let didSnapshot = false;

    const move = (ev) => {
      const dxPct = ((ev.clientX - startX) / rect.width) * 100;
      const dyPct = ((ev.clientY - startY) / rect.height) * 100;
      if (!moved && Math.abs(dxPct) + Math.abs(dyPct) < 0.3) return;
      if (!moved) { moved = true; setDragging(true); }
      if (!didSnapshot) { onSnapshot && onSnapshot(); didSnapshot = true; }
      const maxX = Math.max(0, 100 - (l.w || 0));
      const maxY = Math.max(0, 100 - (l.h || 0));
      onLayerChange(l.id, {
        x: Math.max(-5, Math.min(maxX + 5, startLX + dxPct)),
        y: Math.max(-5, Math.min(maxY + 5, startLY + dyPct)),
      });
    };
    const up = () => {
      setDragging(false);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  // --- resize handle drag ---
  const handleResize = (corner) => (e) => {
    if (!interactive || isBg || isLocked) return;
    e.stopPropagation();
    e.preventDefault();
    const artboard = e.currentTarget.closest(".cb-artboard");
    if (!artboard) return;
    const rect = artboard.getBoundingClientRect();
    const startX = e.clientX, startY = e.clientY;
    const { x, y, w, h } = l;
    let didSnapshot = false;

    const move = (ev) => {
      if (!didSnapshot) { onSnapshot && onSnapshot(); didSnapshot = true; }
      const dxPct = ((ev.clientX - startX) / rect.width) * 100;
      const dyPct = ((ev.clientY - startY) / rect.height) * 100;
      let nx = x, ny = y, nw = w, nh = h;
      if (corner.includes("r")) nw = Math.max(2, w + dxPct);
      if (corner.includes("l")) { nx = x + dxPct; nw = Math.max(2, w - dxPct); }
      if (corner.includes("b")) nh = Math.max(2, h + dyPct);
      if (corner.includes("t")) { ny = y + dyPct; nh = Math.max(2, h - dyPct); }
      onLayerChange(l.id, { x: nx, y: ny, w: nw, h: nh });
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  // Geometry
  const baseBox = isBg ? { position: "absolute", inset: 0 } : {
    position: "absolute",
    left: `${l.x}%`, top: `${l.y}%`,
    width: `${l.w}%`, height: `${l.h}%`,
    boxSizing: "border-box",
  };
  const interactProps = interactive && !isBg ? {
    className: `cb-layer ${selected ? "selected" : ""} ${dragging ? "dragging" : ""} ${isLocked ? "locked" : ""}`,
    onPointerDown: handlePointerDown,
  } : {};

  // Resize handles when selected
  const handles = (interactive && selected && !isBg && !isLocked) ? (
    <>
      <div className="cb-handle tl" onPointerDown={handleResize("tl")}/>
      <div className="cb-handle tr" onPointerDown={handleResize("tr")}/>
      <div className="cb-handle bl" onPointerDown={handleResize("bl")}/>
      <div className="cb-handle br" onPointerDown={handleResize("br")}/>
    </>
  ) : null;

  switch (l.type) {
    case "bg":
      return <div style={{ ...baseBox, background: l.color }}/>;

    case "shape":
      return (
        <div {...interactProps} style={{
          ...baseBox,
          background: l.color,
          opacity: l.opacity ?? 1,
          border: l.border ? "1px solid rgba(0,0,0,0.1)" : "none",
        }}>{handles}</div>
      );

    case "photo": {
      return (
        <div {...interactProps} style={{ ...baseBox, overflow: "hidden", background: "#cbd5e1" }}>
          <div style={{ width: "100%", height: "100%", pointerEvents: "none" }}>
            <VehicleMedia v={vehicle} index={l.index} src={l.src}/>
          </div>
          {l.mask === "darken" && <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.6) 100%)", pointerEvents: "none" }}/>}
          {l.mask === "fade-left" && <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, rgba(127,29,29,0.85) 0%, transparent 35%)", pointerEvents: "none" }}/>}
          {handles}
        </div>
      );
    }

    case "text": {
      const text = substitute(l.text, vars);
      const align = l.align || "left";
      const just = align === "center" ? "center" : align === "right" ? "flex-end" : "flex-start";
      const inner = (
        <span style={{
          textDecoration: l.strike ? "line-through" : "none",
          letterSpacing: l.letterSpacing ? `${l.letterSpacing}em` : 0,
          lineHeight: 1.04,
          pointerEvents: "none",
        }}>{text}</span>
      );
      return (
        <div {...interactProps} style={{
          ...baseBox,
          display: "flex",
          alignItems: "center",
          justifyContent: just,
          fontSize: `${l.size}cqw`,
          fontWeight: l.weight || 600,
          color: l.color || "#0F172A",
          textAlign: align,
        }}>
          {l.pad ? (
            <span style={{
              background: l.bg, color: l.color,
              padding: "0.25em 0.55em",
              borderRadius: "0.3cqw",
              letterSpacing: l.letterSpacing ? `${l.letterSpacing}em` : 0,
              textDecoration: l.strike ? "line-through" : "none",
              pointerEvents: "none",
            }}>{text}</span>
          ) : inner}
          {handles}
        </div>
      );
    }

    case "ribbon":
      return (
        <div {...interactProps} style={{
          ...baseBox,
          background: l.color,
          color: l.textColor || "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 800,
          fontSize: `${(l.h || 5) * 0.45}cqw`,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          clipPath: "polygon(0 0, 100% 0, 95% 50%, 100% 100%, 0 100%)",
          paddingRight: "1%",
        }}>
          <span style={{ pointerEvents: "none" }}>{l.text}</span>
          {handles}
        </div>
      );

    case "stat-row": {
      const cols = l.items.length;
      return (
        <div {...interactProps} style={{
          ...baseBox,
          display: "grid",
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gap: "0.6cqw",
        }}>
          {l.items.map((it, i) => {
            const value = substitute(it.value, vars);
            const hi = it.highlight;
            return (
              <div key={i} style={{
                background: hi ? "#DC2626" : (l.bg || "#1E293B"),
                color: hi ? "#fff" : (l.color || "#fff"),
                padding: "4% 5%",
                borderRadius: "0.5cqw",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                border: l.border && !hi ? "1px solid #E2E8F0" : "none",
                pointerEvents: "none",
              }}>
                <div style={{ fontSize: "1.6cqw", fontWeight: 700, opacity: hi ? 0.95 : 0.6, letterSpacing: "0.1em" }}>{it.label}</div>
                <div style={{ fontSize: "3.6cqw", fontWeight: 800, letterSpacing: "-0.02em", marginTop: "0.15em" }}>{value}</div>
              </div>
            );
          })}
          {handles}
        </div>
      );
    }

    case "cta": {
      const text = substitute(l.text, vars);
      return (
        <div {...interactProps} style={{
          ...baseBox,
          background: l.bg || "#2563EB",
          color: l.color || "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 700,
          fontSize: `${Math.max((l.h || 5) * 0.38, 2.4)}cqw`,
          borderRadius: "0.4cqw",
          letterSpacing: "0.005em",
        }}>
          <span style={{ pointerEvents: "none" }}>{text}</span>
          {handles}
        </div>
      );
    }

    case "logo":
      return (
        <div {...interactProps} style={{
          ...baseBox,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
          <div style={{
            background: l.color === "light" ? "#fff" : "#111",
            color: l.color === "light" ? "#111" : "#fff",
            padding: "0.4em 0.6em",
            fontWeight: 800,
            fontSize: `${(l.h || 5) * 0.55}cqw`,
            borderRadius: "0.4cqw",
            letterSpacing: "-0.01em",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.15em",
            pointerEvents: "none",
          }}>
            G<span style={{ width: "0.25em", height: "0.25em", background: "#F59E0B", borderRadius: "50%" }}/>G
          </div>
          {handles}
        </div>
      );

    case "qr": {
      return (
        <div {...interactProps} style={{
          ...baseBox,
          background: "#fff",
          border: "2px solid #000",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "5%",
          boxSizing: "border-box"
        }}>
          <div style={{
            width: "80%",
            height: "80%",
            background: "radial-gradient(circle, #000 32%, transparent 32%), radial-gradient(circle, #000 32%, transparent 32%)",
            backgroundSize: "6px 6px",
            backgroundPosition: "0 0, 3px 3px",
            position: "relative",
            border: "1px solid #000",
            pointerEvents: "none",
            flex: 1
          }}>
            <div style={{ position: "absolute", top: 0, left: 0, width: 8, height: 8, border: "2px solid #000", background: "#fff" }}/>
            <div style={{ position: "absolute", top: 0, right: 0, width: 8, height: 8, border: "2px solid #000", background: "#fff" }}/>
            <div style={{ position: "absolute", bottom: 0, left: 0, width: 8, height: 8, border: "2px solid #000", background: "#fff" }}/>
          </div>
          <div style={{ fontSize: "1.4cqw", fontWeight: 900, color: "#000", marginTop: "4%", textTransform: "uppercase", pointerEvents: "none" }}>
            SCAN FOR REPORT
          </div>
          {handles}
        </div>
      );
    }

    default:
      return null;
  }
}


export { CBCanvas };
