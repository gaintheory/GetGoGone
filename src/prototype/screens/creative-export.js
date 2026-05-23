import { GGG } from '../data';
import { CreativeBuilderData } from './creative-templates';

function renderCreativePng({ layers, size, vars, vehicle, brand }) {
  const canvas = document.createElement("canvas");
  canvas.width = size.w;
  canvas.height = size.h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return Promise.reject(new Error("Canvas rendering is not available."));

  const orderedLayers = layers || [];
  const draw = async () => {
    for (const layer of orderedLayers) {
      await drawLayer(ctx, layer, size, vars, vehicle, brand);
    }
    return canvas.toDataURL("image/png");
  };

  return draw();
}

async function drawLayer(ctx, layer, size, vars, vehicle, brand) {
  const box = layer.type === "bg"
    ? { x: 0, y: 0, w: size.w, h: size.h }
    : {
      x: pct(layer.x, size.w),
      y: pct(layer.y, size.h),
      w: pct(layer.w, size.w),
      h: pct(layer.h, size.h),
    };

  switch (layer.type) {
    case "bg":
      ctx.fillStyle = layer.color || "#FFFFFF";
      ctx.fillRect(0, 0, size.w, size.h);
      break;
    case "shape":
      ctx.save();
      ctx.globalAlpha = layer.opacity ?? 1;
      ctx.fillStyle = layer.color || "#E5E7EB";
      ctx.fillRect(box.x, box.y, box.w, box.h);
      ctx.restore();
      break;
    case "photo":
      await drawVehiclePhoto(ctx, box, layer, vehicle);
      break;
    case "text":
      drawTextLayer(ctx, box, layer, vars);
      break;
    case "ribbon":
      drawRibbon(ctx, box, layer);
      break;
    case "stat-row":
      drawStatRow(ctx, box, layer, vars);
      break;
    case "cta":
      drawCta(ctx, box, layer, vars);
      break;
    case "logo":
      drawLogo(ctx, box, layer, brand);
      break;
    case "qr":
      drawQr(ctx, box);
      break;
    default:
      break;
  }
}

async function drawVehiclePhoto(ctx, box, layer, vehicle) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(box.x, box.y, box.w, box.h);
  ctx.clip();

  let drewImage = false;
  if (vehicle?.imageUrl) {
    try {
      const image = await loadImage(vehicle.imageUrl);
      drawObjectFit(ctx, image, box, layer.fit || "cover");
      drewImage = true;
    } catch {
      drewImage = false;
    }
  }

  if (!drewImage) {
    const svg = GGG.vehicleSvg(vehicle?.body, vehicle?.palette);
    const image = await loadImage(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`);
    drawObjectFit(ctx, image, box, layer.fit || "cover");
  }

  if (layer.mask === "darken") {
    const gradient = ctx.createLinearGradient(0, box.y, 0, box.y + box.h);
    gradient.addColorStop(0, "rgba(0,0,0,0.2)");
    gradient.addColorStop(1, "rgba(0,0,0,0.6)");
    ctx.fillStyle = gradient;
    ctx.fillRect(box.x, box.y, box.w, box.h);
  }

  if (layer.mask === "fade-left") {
    const gradient = ctx.createLinearGradient(box.x, 0, box.x + box.w, 0);
    gradient.addColorStop(0, "rgba(127,29,29,0.85)");
    gradient.addColorStop(0.35, "rgba(127,29,29,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(box.x, box.y, box.w, box.h);
  }

  ctx.restore();
}

function drawTextLayer(ctx, box, layer, vars) {
  const text = substitute(layer.text, vars);
  const fontSize = Math.max(8, pct(layer.size || 4, ctx.canvas.width));
  const fontWeight = layer.weight || 600;
  const align = layer.align || "left";
  const x = align === "center" ? box.x + box.w / 2 : align === "right" ? box.x + box.w : box.x;
  const y = box.y + box.h / 2;

  ctx.save();
  ctx.font = `${fontWeight} ${fontSize}px Arial, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = "middle";
  ctx.fillStyle = layer.color || "#0F172A";

  if (layer.pad) {
    const metrics = ctx.measureText(text);
    const padX = fontSize * 0.55;
    const padY = fontSize * 0.25;
    const pillW = metrics.width + padX * 2;
    const pillH = fontSize + padY * 2;
    const pillX = align === "center" ? x - pillW / 2 : align === "right" ? x - pillW : x;
    const pillY = y - pillH / 2;
    roundedRect(ctx, pillX, pillY, pillW, pillH, fontSize * 0.25);
    ctx.fillStyle = layer.bg || "#DC2626";
    ctx.fill();
    ctx.fillStyle = layer.color || "#FFFFFF";
  }

  ctx.fillText(text, x, y, box.w);
  if (layer.strike) {
    const metrics = ctx.measureText(text);
    const startX = align === "center" ? x - metrics.width / 2 : align === "right" ? x - metrics.width : x;
    ctx.strokeStyle = layer.color || "#0F172A";
    ctx.lineWidth = Math.max(1, fontSize * 0.07);
    ctx.beginPath();
    ctx.moveTo(startX, y);
    ctx.lineTo(startX + metrics.width, y);
    ctx.stroke();
  }
  ctx.restore();
}

function drawRibbon(ctx, box, layer) {
  ctx.save();
  ctx.fillStyle = layer.color || "#DC2626";
  ctx.beginPath();
  ctx.moveTo(box.x, box.y);
  ctx.lineTo(box.x + box.w, box.y);
  ctx.lineTo(box.x + box.w * 0.95, box.y + box.h / 2);
  ctx.lineTo(box.x + box.w, box.y + box.h);
  ctx.lineTo(box.x, box.y + box.h);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = layer.textColor || "#FFFFFF";
  ctx.font = `800 ${Math.max(10, box.h * 0.45)}px Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(layer.text || "", box.x + box.w / 2, box.y + box.h / 2, box.w * 0.9);
  ctx.restore();
}

function drawStatRow(ctx, box, layer, vars) {
  const items = layer.items || [];
  const gap = ctx.canvas.width * 0.006;
  const colW = (box.w - gap * Math.max(0, items.length - 1)) / Math.max(1, items.length);
  items.forEach((item, index) => {
    const x = box.x + index * (colW + gap);
    const hi = item.highlight;
    ctx.save();
    ctx.fillStyle = hi ? "#DC2626" : (layer.bg || "#1E293B");
    roundedRect(ctx, x, box.y, colW, box.h, ctx.canvas.width * 0.005);
    ctx.fill();
    ctx.fillStyle = hi ? "#FFFFFF" : (layer.color || "#FFFFFF");
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.font = `700 ${ctx.canvas.width * 0.016}px Arial, sans-serif`;
    ctx.globalAlpha = hi ? 0.95 : 0.65;
    ctx.fillText(item.label || "", x + colW * 0.06, box.y + box.h * 0.22, colW * 0.88);
    ctx.globalAlpha = 1;
    ctx.font = `800 ${ctx.canvas.width * 0.036}px Arial, sans-serif`;
    ctx.fillText(substitute(item.value, vars), x + colW * 0.06, box.y + box.h * 0.46, colW * 0.88);
    ctx.restore();
  });
}

function drawCta(ctx, box, layer, vars) {
  ctx.save();
  ctx.fillStyle = layer.bg || "#2563EB";
  roundedRect(ctx, box.x, box.y, box.w, box.h, ctx.canvas.width * 0.004);
  ctx.fill();
  ctx.fillStyle = layer.color || "#FFFFFF";
  ctx.font = `700 ${Math.max(10, box.h * 0.38)}px Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(substitute(layer.text, vars), box.x + box.w / 2, box.y + box.h / 2, box.w * 0.9);
  ctx.restore();
}

function drawLogo(ctx, box, layer) {
  ctx.save();
  ctx.fillStyle = layer.color === "light" ? "#FFFFFF" : "#111111";
  roundedRect(ctx, box.x + box.w * 0.18, box.y + box.h * 0.12, box.w * 0.64, box.h * 0.76, ctx.canvas.width * 0.004);
  ctx.fill();
  ctx.fillStyle = layer.color === "light" ? "#111111" : "#FFFFFF";
  ctx.font = `800 ${Math.max(12, box.h * 0.55)}px Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("G G", box.x + box.w / 2, box.y + box.h / 2, box.w * 0.5);
  ctx.restore();
}

function drawObjectFit(ctx, image, box, fit) {
  if (fit === "fill") {
    ctx.drawImage(image, box.x, box.y, box.w, box.h);
    return;
  }

  const scale = fit === "contain"
    ? Math.min(box.w / image.width, box.h / image.height)
    : Math.max(box.w / image.width, box.h / image.height);
  const w = image.width * scale;
  const h = image.height * scale;
  ctx.drawImage(image, box.x + (box.w - w) / 2, box.y + (box.h - h) / 2, w, h);
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

function roundedRect(ctx, x, y, w, h, r) {
  const radius = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function substitute(value, vars) {
  return CreativeBuilderData.substitute(value || "", vars || {});
}

function pct(value, total) {
  return ((Number(value) || 0) / 100) * total;
}

function drawQr(ctx, box) {
  ctx.save();
  // Draw white background
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(box.x, box.y, box.w, box.h);
  
  // Draw black outer border
  ctx.strokeStyle = "#000000";
  ctx.lineWidth = Math.max(1.5, ctx.canvas.width * 0.002);
  ctx.strokeRect(box.x, box.y, box.w, box.h);

  // Padding
  const pad = box.w * 0.08;
  const innerW = box.w - pad * 2;
  const innerH = box.h - pad * 2 - (box.h * 0.15); // Leave room at the bottom for text
  
  // Draw the QR-like patterns inside the bounds
  const dotSize = Math.max(2, box.w * 0.045);
  ctx.fillStyle = "#000000";
  
  // Let's paint simulated QR code noise using nested loops, avoiding the corners where anchor boxes reside
  // Anchor sizes are 25% of inner width
  const anchorSize = innerW * 0.25;
  
  // Helper to check if point falls in anchor regions
  const isInsideAnchor = (px, py) => {
    // Top-left anchor
    if (px < anchorSize && py < anchorSize) return true;
    // Top-right anchor
    if (px > innerW - anchorSize && py < anchorSize) return true;
    // Bottom-left anchor
    if (px < anchorSize && py > innerH - anchorSize) return true;
    return false;
  };
  
  // Draw simulated noise
  ctx.save();
  ctx.translate(box.x + pad, box.y + pad);
  for (let x = 0; x < innerW; x += dotSize) {
    for (let y = 0; y < innerH; y += dotSize) {
      if (isInsideAnchor(x, y)) continue;
      // Deterministic noise pattern
      const noise = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
      if ((noise - Math.floor(noise)) > 0.3) {
        ctx.fillRect(x, y, dotSize * 0.8, dotSize * 0.8);
      }
    }
  }
  
  // Draw 3 corner anchor squares (top-left, top-right, bottom-left)
  const drawAnchor = (ax, ay, size) => {
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = Math.max(1.5, size * 0.18);
    ctx.strokeRect(ax, ay, size, size);
    
    const innerSize = size * 0.4;
    const offset = (size - innerSize) / 2;
    ctx.fillStyle = "#000000";
    ctx.fillRect(ax + offset, ay + offset, innerSize, innerSize);
  };
  
  drawAnchor(0, 0, anchorSize);
  drawAnchor(innerW - anchorSize, 0, anchorSize);
  drawAnchor(0, innerH - anchorSize, anchorSize);
  ctx.restore();

  // Draw "SCAN FOR REPORT" text at the bottom
  ctx.fillStyle = "#000000";
  ctx.font = `900 ${Math.max(7, box.h * 0.085)}px Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  ctx.fillText("SCAN FOR REPORT", box.x + box.w / 2, box.y + box.h - pad * 0.8, box.w * 0.9);
  
  ctx.restore();
}

export { renderCreativePng };
