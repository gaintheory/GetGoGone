import { GGG } from '../data';

// Creative Builder — ad templates & sizes
// All positions are in percentages of canvas width/height so templates scale across sizes.
// Font sizes use `cqw` (1% of container width) since canvas is a container.

const exportSizes = [
  { id: "fb-sq", name: "Facebook / IG Square", w: 1080, h: 1080, group: "Social", note: "1:1" },
  { id: "story", name: "IG / FB Story", w: 1080, h: 1920, group: "Social", note: "9:16" },
  { id: "fb-portrait", name: "Facebook Feed Portrait", w: 1080, h: 1350, group: "Social", note: "4:5" },
  { id: "tt-cover", name: "TikTok / Reels Cover", w: 1080, h: 1920, group: "Social", note: "9:16" },
  { id: "yt-thumb", name: "YouTube Thumbnail", w: 1280, h: 720, group: "Social", note: "16:9" },
  { id: "cl", name: "Craigslist Image", w: 1200, h: 900, group: "Marketplace", note: "4:3" },
  { id: "gad-300", name: "Google Display 300×250", w: 600, h: 500, group: "Display", note: "Medium Rectangle" },
  { id: "gad-728", name: "Google Display 728×90", w: 1456, h: 180, group: "Display", note: "Leaderboard" },
  { id: "web-banner", name: "Website Banner", w: 1920, h: 480, group: "Display", note: "Hero" },
  { id: "flyer", name: "Printable Flyer", w: 850, h: 1100, group: "Print", note: "8.5×11 @ 100dpi" },
  /* misplaced template removed from exportSizes:
  {
    id: "craigslist",
    name: "Craigslist Lead Image",
    category: "Marketplace",
    palette: "light",
    description: "Simple photo-first image for Craigslist and marketplace listings.",
    layers: [
      L("bg", "bg", { color: "#F8FAFC" }),
      L("photo", "photo", { x: 0, y: 0, w: 100, h: 70 }),
      L("shape", "info", { x: 0, y: 70, w: 100, h: 30, color: "#FFFFFF", border: true }),
      L("text", "title", { x: 4, y: 73, w: 66, h: 6, text: "{{year}} {{make}} {{model}}", size: 4, weight: 800, color: "#0F172A", align: "left", role: "headline" }),
      L("text", "details", { x: 4, y: 80, w: 66, h: 4, text: "{{mileage}} · {{color}} · {{trim}}", size: 2, weight: 500, color: "#64748B", align: "left" }),
      L("text", "down", { x: 72, y: 73, w: 24, h: 6, text: "{{down_payment}} DOWN", size: 3.2, weight: 900, color: "#DC2626", align: "right" }),
      L("text", "price", { x: 72, y: 81, w: 24, h: 5, text: "{{price}}", size: 3.3, weight: 800, color: "#0F172A", align: "right" }),
      L("cta", "cta", { x: 4, y: 89, w: 42, h: 6, text: "Call {{phone}}", bg: "#111827", color: "#FFFFFF" }),
      L("text", "disc", { x: 50, y: 90, w: 46, h: 4, text: "{{disclosure}}", size: 1.15, color: "#94A3B8", align: "right", role: "disclosure" }),
    ],
  },
  */
];

// Helper to build a layer
const L = (type, id, props = {}) => ({ id, type, ...props });

// Color palettes used across templates
const palettes = {
  midnight: { bg: "#0F172A", panel: "#1E293B", accent: "#DC2626", text: "#FFFFFF", muted: "#94A3B8" },
  light:    { bg: "#F8FAFC", panel: "#FFFFFF", accent: "#2563EB", text: "#0F172A", muted: "#64748B" },
  red:      { bg: "#7F1D1D", panel: "#991B1B", accent: "#FBBF24", text: "#FFFFFF", muted: "#FECACA" },
  green:    { bg: "#064E3B", panel: "#065F46", accent: "#FBBF24", text: "#FFFFFF", muted: "#A7F3D0" },
  amber:    { bg: "#78350F", panel: "#92400E", accent: "#FFFFFF", text: "#FFFFFF", muted: "#FED7AA" },
  rugged:   { bg: "#0C0A09", panel: "#1C1917", accent: "#F59E0B", text: "#FFFFFF", muted: "#D6D3D1" },
  cream:    { bg: "#FEF3C7", panel: "#FBBF24", accent: "#7F1D1D", text: "#451A03", muted: "#92400E" },
};

const adTemplates = [
  // 1. Fresh Arrival — dark, photo top, ribbon, stats row
  {
    id: "fresh",
    name: "Fresh Arrival",
    category: "New arrival",
    palette: "midnight",
    description: "Brand-new to the lot. Photo-led with a JUST IN ribbon.",
    layers: [
      L("bg", "bg", { color: "#0F172A" }),
      L("photo", "photo", { x: 0, y: 6, w: 100, h: 60 }),
      L("ribbon", "ribbon", { x: 4, y: 4, w: 22, h: 5, text: "JUST IN", color: "#DC2626", textColor: "#FFFFFF" }),
      L("text", "hdl", { x: 5, y: 70, w: 90, h: 10, text: "{{year}} {{make}} {{model}}", size: 7.5, weight: 800, color: "#FFFFFF", align: "left", role: "headline" }),
      L("text", "sub", { x: 5, y: 80, w: 90, h: 4, text: "{{trim}} · {{mileage}} · {{color}}", size: 2.4, weight: 500, color: "#94A3B8", align: "left", role: "subhead" }),
      L("stat-row", "stats", { x: 5, y: 85, w: 90, h: 9, items: [
        { label: "DOWN", value: "{{down_payment}}" },
        { label: "WEEKLY", value: "{{weekly_payment}}", highlight: true },
        { label: "PRICE", value: "{{price}}" },
      ], color: "#FFFFFF", bg: "#1E293B" }),
      L("text", "disc", { x: 5, y: 96, w: 90, h: 3, text: "{{disclosure}}", size: 1.4, color: "#64748B", align: "left", role: "disclosure" }),
      L("logo", "logo", { x: 86, y: 4, w: 10, h: 5 }),
    ],
  },

  // 2. Low Down Payment — big number focus
  {
    id: "lowdown",
    name: "Low Down Payment",
    category: "Payment focus",
    palette: "red",
    description: "Lead with the down payment number. High impact.",
    layers: [
      L("bg", "bg", { color: "#7F1D1D" }),
      L("shape", "panel", { x: 0, y: 0, w: 50, h: 100, color: "#991B1B" }),
      L("photo", "photo", { x: 50, y: 0, w: 50, h: 100, mask: "fade-left" }),
      L("text", "kicker", { x: 4, y: 8, w: 44, h: 4, text: "ONLY", size: 3, weight: 800, color: "#FBBF24", letterSpacing: 0.08, align: "left" }),
      L("text", "big", { x: 4, y: 14, w: 44, h: 28, text: "{{down_payment}}", size: 22, weight: 900, color: "#FFFFFF", align: "left", role: "headline" }),
      L("text", "kicker2", { x: 4, y: 40, w: 44, h: 4, text: "DOWN", size: 4, weight: 800, color: "#FBBF24", letterSpacing: 0.08, align: "left" }),
      L("text", "sub", { x: 4, y: 50, w: 44, h: 10, text: "Drives home a {{year}} {{make}} {{model}}", size: 3, weight: 600, color: "#FFFFFF", align: "left" }),
      L("text", "wkly", { x: 4, y: 64, w: 44, h: 8, text: "{{weekly_payment}}/week · WAC", size: 3.5, weight: 700, color: "#FFFFFF", align: "left" }),
      L("cta", "cta", { x: 4, y: 80, w: 30, h: 7, text: "Apply in 2 min →", bg: "#FBBF24", color: "#7F1D1D" }),
      L("logo", "logo", { x: 4, y: 90, w: 16, h: 5, color: "light" }),
      L("text", "disc", { x: 4, y: 96, w: 44, h: 3, text: "{{disclosure}}", size: 1.4, color: "#FCA5A5", align: "left", role: "disclosure" }),
    ],
  },

  // 3. Tax Refund Special — gold/cream cheerful
  {
    id: "tax",
    name: "Tax Refund Special",
    category: "Seasonal",
    palette: "cream",
    description: "Convert tax refunds into down payments. Seasonal (Jan–Apr).",
    layers: [
      L("bg", "bg", { color: "#FEF3C7" }),
      L("shape", "topbar", { x: 0, y: 0, w: 100, h: 8, color: "#7F1D1D" }),
      L("text", "topline", { x: 4, y: 1.5, w: 92, h: 5, text: "TAX REFUND SEASON · LIMITED TIME", size: 2.2, weight: 800, color: "#FBBF24", letterSpacing: 0.12, align: "center" }),
      L("text", "kicker", { x: 4, y: 11, w: 92, h: 5, text: "GOT YOUR REFUND?", size: 3, weight: 700, color: "#92400E", align: "left", letterSpacing: 0.06 }),
      L("text", "hdl", { x: 4, y: 16, w: 92, h: 14, text: "Use it as your down payment.", size: 7, weight: 800, color: "#451A03", align: "left", role: "headline" }),
      L("photo", "photo", { x: 4, y: 32, w: 60, h: 38 }),
      L("shape", "cardbg", { x: 66, y: 32, w: 30, h: 38, color: "#FFFFFF", border: true }),
      L("text", "vname", { x: 68, y: 34, w: 26, h: 5, text: "{{year}} {{make}}", size: 2.3, weight: 700, color: "#451A03", align: "left" }),
      L("text", "vmod", { x: 68, y: 38, w: 26, h: 5, text: "{{model}}", size: 3.5, weight: 800, color: "#451A03", align: "left" }),
      L("text", "lbl1", { x: 68, y: 47, w: 26, h: 3, text: "DOWN PAYMENT", size: 1.6, weight: 700, color: "#92400E", letterSpacing: 0.08, align: "left" }),
      L("text", "val1", { x: 68, y: 50, w: 26, h: 5, text: "{{down_payment}}", size: 4, weight: 800, color: "#7F1D1D", align: "left" }),
      L("text", "lbl2", { x: 68, y: 56, w: 26, h: 3, text: "WEEKLY", size: 1.6, weight: 700, color: "#92400E", letterSpacing: 0.08, align: "left" }),
      L("text", "val2", { x: 68, y: 59, w: 26, h: 5, text: "{{weekly_payment}}", size: 4, weight: 800, color: "#7F1D1D", align: "left" }),
      L("cta", "cta", { x: 4, y: 74, w: 92, h: 8, text: "Apply at {{website}} — drive today", bg: "#7F1D1D", color: "#FBBF24" }),
      L("text", "phone", { x: 4, y: 84, w: 60, h: 5, text: "📞 {{phone}} · We finance everyone", size: 2.5, weight: 600, color: "#451A03", align: "left" }),
      L("logo", "logo", { x: 80, y: 84, w: 16, h: 5 }),
      L("text", "disc", { x: 4, y: 95, w: 92, h: 3, text: "{{disclosure}}", size: 1.3, color: "#92400E", align: "left", role: "disclosure" }),
    ],
  },

  // 4. Work Truck — dark, rugged
  {
    id: "work",
    name: "Work Truck Ready",
    category: "Buyer type",
    palette: "rugged",
    description: "Tow-and-haul vibes. Targeted at tradespeople.",
    layers: [
      L("bg", "bg", { color: "#0C0A09" }),
      L("photo", "photo", { x: 0, y: 0, w: 100, h: 100, mask: "darken" }),
      L("shape", "scrim", { x: 0, y: 55, w: 100, h: 45, color: "#0C0A09", opacity: 0.92 }),
      L("ribbon", "ribbon", { x: 4, y: 5, w: 28, h: 5, text: "WORK-READY", color: "#F59E0B", textColor: "#0C0A09" }),
      L("text", "hdl", { x: 4, y: 60, w: 92, h: 10, text: "Built for the job site.", size: 7, weight: 800, color: "#FFFFFF", align: "left", role: "headline" }),
      L("text", "sub", { x: 4, y: 70, w: 92, h: 6, text: "{{year}} {{make}} {{model}} {{trim}}", size: 3, weight: 600, color: "#F59E0B", align: "left", role: "subhead" }),
      L("stat-row", "stats", { x: 4, y: 78, w: 92, h: 9, color: "#FFFFFF", bg: "#1C1917", items: [
        { label: "DOWN", value: "{{down_payment}}" },
        { label: "WEEKLY", value: "{{weekly_payment}}", highlight: true },
        { label: "MILEAGE", value: "{{mileage}}" },
      ]}),
      L("cta", "cta", { x: 4, y: 89, w: 92, h: 6, text: "Drive it home — apply at {{website}}", bg: "#F59E0B", color: "#0C0A09" }),
      L("text", "disc", { x: 4, y: 96, w: 92, h: 3, text: "{{disclosure}}", size: 1.3, color: "#A8A29E", align: "left", role: "disclosure" }),
    ],
  },

  // 5. Family SUV — clean light layout
  {
    id: "family",
    name: "Family SUV",
    category: "Buyer type",
    palette: "light",
    description: "Roomy + safe story. Light background, friendly.",
    layers: [
      L("bg", "bg", { color: "#F8FAFC" }),
      L("photo", "photo", { x: 0, y: 0, w: 100, h: 55 }),
      L("text", "kicker", { x: 5, y: 58, w: 90, h: 4, text: "FAMILY-READY", size: 2, weight: 700, color: "#2563EB", letterSpacing: 0.1, align: "left" }),
      L("text", "hdl", { x: 5, y: 62, w: 90, h: 12, text: "Room for the whole crew.", size: 7, weight: 800, color: "#0F172A", align: "left", role: "headline" }),
      L("text", "sub", { x: 5, y: 74, w: 90, h: 4, text: "{{year}} {{make}} {{model}} · {{mileage}}", size: 2.4, weight: 500, color: "#64748B", align: "left" }),
      L("stat-row", "stats", { x: 5, y: 80, w: 90, h: 9, color: "#0F172A", bg: "#FFFFFF", border: true, items: [
        { label: "DOWN", value: "{{down_payment}}" },
        { label: "WEEKLY", value: "{{weekly_payment}}", highlight: true },
        { label: "PRICE", value: "{{price}}" },
      ]}),
      L("cta", "cta", { x: 5, y: 91, w: 50, h: 5.5, text: "Apply at {{website}} →", bg: "#2563EB", color: "#FFFFFF" }),
      L("logo", "logo", { x: 85, y: 91, w: 10, h: 5 }),
      L("text", "disc", { x: 5, y: 97, w: 90, h: 3, text: "{{disclosure}}", size: 1.3, color: "#64748B", align: "left", role: "disclosure" }),
    ],
  },

  // 6. Recently Reduced — price drop, big slash
  {
    id: "reduced",
    name: "Price Just Dropped",
    category: "Urgency",
    palette: "red",
    description: "Price-cut callout with strikethrough old price.",
    layers: [
      L("bg", "bg", { color: "#FFFFFF" }),
      L("shape", "strip", { x: 0, y: 0, w: 100, h: 6, color: "#DC2626" }),
      L("text", "stripText", { x: 0, y: 1.2, w: 100, h: 4, text: "★ PRICE JUST DROPPED · LIMITED TIME ★", size: 2, weight: 800, color: "#FFFFFF", letterSpacing: 0.12, align: "center" }),
      L("photo", "photo", { x: 5, y: 10, w: 90, h: 45 }),
      L("text", "hdl", { x: 5, y: 58, w: 90, h: 8, text: "{{year}} {{make}} {{model}}", size: 5.5, weight: 800, color: "#0F172A", align: "left", role: "headline" }),
      L("text", "wasNow", { x: 5, y: 68, w: 90, h: 12, text: "{{price}}", size: 9, weight: 900, color: "#DC2626", align: "left" }),
      L("text", "wasOld", { x: 5, y: 66, w: 25, h: 4, text: "Was $13,995", size: 2.3, weight: 500, color: "#94A3B8", strike: true, align: "left" }),
      L("text", "saveTag", { x: 32, y: 67, w: 20, h: 4, text: "SAVE $2,000", size: 2.2, weight: 800, color: "#FFFFFF", bg: "#DC2626", letterSpacing: 0.06, align: "center", pad: true }),
      L("stat-row", "stats", { x: 5, y: 82, w: 90, h: 8, color: "#0F172A", bg: "#F1F5F9", items: [
        { label: "DOWN", value: "{{down_payment}}" },
        { label: "WEEKLY", value: "{{weekly_payment}}", highlight: true },
      ]}),
      L("cta", "cta", { x: 5, y: 91, w: 90, h: 5.5, text: "Call {{phone}} — won't last", bg: "#0F172A", color: "#FFFFFF" }),
      L("text", "disc", { x: 5, y: 97, w: 90, h: 3, text: "{{disclosure}}", size: 1.3, color: "#94A3B8", align: "left", role: "disclosure" }),
    ],
  },

  // 7. Still Available — re-engagement
  {
    id: "still",
    name: "Still Available",
    category: "Re-engagement",
    palette: "green",
    description: "Friendly nudge on aging inventory.",
    layers: [
      L("bg", "bg", { color: "#064E3B" }),
      L("ribbon", "ribbon", { x: 4, y: 5, w: 28, h: 5, text: "STILL HERE", color: "#FBBF24", textColor: "#064E3B" }),
      L("text", "hdl", { x: 4, y: 13, w: 92, h: 10, text: "Still waiting for the right owner.", size: 5.5, weight: 800, color: "#FFFFFF", align: "left", role: "headline" }),
      L("text", "sub", { x: 4, y: 24, w: 92, h: 4, text: "Take another look — terms are flexible.", size: 2.4, weight: 500, color: "#A7F3D0", align: "left" }),
      L("photo", "photo", { x: 4, y: 30, w: 92, h: 45 }),
      L("text", "vname", { x: 4, y: 76, w: 92, h: 6, text: "{{year}} {{make}} {{model}} {{trim}}", size: 3.5, weight: 800, color: "#FFFFFF", align: "left" }),
      L("stat-row", "stats", { x: 4, y: 84, w: 92, h: 8, color: "#FFFFFF", bg: "#065F46", items: [
        { label: "DOWN", value: "{{down_payment}}" },
        { label: "WEEKLY", value: "{{weekly_payment}}", highlight: true },
        { label: "PRICE", value: "{{price}}" },
      ]}),
      L("cta", "cta", { x: 4, y: 92, w: 92, h: 5, text: "Make an offer · {{phone}}", bg: "#FBBF24", color: "#064E3B" }),
      L("text", "disc", { x: 4, y: 97, w: 92, h: 3, text: "{{disclosure}}", size: 1.3, color: "#A7F3D0", align: "left", role: "disclosure" }),
    ],
  },

  // 8. Spanish promo
  {
    id: "es",
    name: "Promo en Español",
    category: "Spanish",
    palette: "amber",
    language: "es",
    description: "Spanish-language low down payment promo.",
    layers: [
      L("bg", "bg", { color: "#78350F" }),
      L("shape", "panel", { x: 0, y: 0, w: 100, h: 8, color: "#92400E" }),
      L("text", "topbar", { x: 0, y: 1.6, w: 100, h: 4, text: "FINANCIAMOS A TODOS · BUEN, MAL O SIN CRÉDITO", size: 2, weight: 800, color: "#FFFFFF", letterSpacing: 0.1, align: "center" }),
      L("photo", "photo", { x: 0, y: 8, w: 100, h: 48 }),
      L("text", "kicker", { x: 5, y: 58, w: 90, h: 4, text: "¡SOLO", size: 4, weight: 800, color: "#FBBF24", letterSpacing: 0.08, align: "left" }),
      L("text", "big", { x: 5, y: 62, w: 60, h: 18, text: "{{down_payment}}", size: 14, weight: 900, color: "#FFFFFF", align: "left" }),
      L("text", "kicker2", { x: 5, y: 78, w: 60, h: 4, text: "DE ENGANCHE!", size: 3.5, weight: 800, color: "#FBBF24", letterSpacing: 0.06, align: "left" }),
      L("text", "sub", { x: 66, y: 62, w: 30, h: 6, text: "{{year}} {{make}}", size: 2.8, weight: 700, color: "#FED7AA", align: "left" }),
      L("text", "sub2", { x: 66, y: 66, w: 30, h: 6, text: "{{model}}", size: 4, weight: 800, color: "#FFFFFF", align: "left" }),
      L("text", "wkly", { x: 66, y: 75, w: 30, h: 5, text: "{{weekly_payment}}/sem", size: 3.5, weight: 800, color: "#FBBF24", align: "left" }),
      L("cta", "cta", { x: 5, y: 86, w: 90, h: 6, text: "Aplica en 2 min · {{phone}}", bg: "#FBBF24", color: "#78350F" }),
      L("text", "disc", { x: 5, y: 95, w: 90, h: 4, text: "Sujeto a aprobación de crédito. WAC. Hablamos español.", size: 1.4, color: "#FED7AA", align: "left", role: "disclosure" }),
    ],
  },
  {
    id: "craigslist",
    name: "Craigslist Lead Image",
    category: "Marketplace",
    palette: "light",
    description: "Simple photo-first image for Craigslist and marketplace listings.",
    layers: [
      L("bg", "bg", { color: "#F8FAFC" }),
      L("photo", "photo", { x: 0, y: 0, w: 100, h: 70 }),
      L("shape", "info", { x: 0, y: 70, w: 100, h: 30, color: "#FFFFFF", border: true }),
      L("text", "title", { x: 4, y: 73, w: 66, h: 6, text: "{{year}} {{make}} {{model}}", size: 4, weight: 800, color: "#0F172A", align: "left", role: "headline" }),
      L("text", "details", { x: 4, y: 80, w: 66, h: 4, text: "{{mileage}} - {{color}} - {{trim}}", size: 2, weight: 500, color: "#64748B", align: "left" }),
      L("text", "down", { x: 72, y: 73, w: 24, h: 6, text: "{{down_payment}} DOWN", size: 3.2, weight: 900, color: "#DC2626", align: "right" }),
      L("text", "price", { x: 72, y: 81, w: 24, h: 5, text: "{{price}}", size: 3.3, weight: 800, color: "#0F172A", align: "right" }),
      L("cta", "cta", { x: 4, y: 89, w: 42, h: 6, text: "Call {{phone}}", bg: "#111827", color: "#FFFFFF" }),
      L("text", "disc", { x: 50, y: 90, w: 46, h: 4, text: "{{disclosure}}", size: 1.15, color: "#94A3B8", align: "right", role: "disclosure" }),
    ],
  },
];

// Variable substitution
function buildVars(v, brand) {
  const { fmt$, fmtMi } = GGG;
  const offer = brand.offer || {};
  const down = Number(offer.downPayment ?? v.down);
  const price = Number(offer.price ?? v.price);
  const weekly = Number(offer.weeklyPayment ?? v.weekly);
  const monthly = Number(offer.monthlyPayment ?? v.monthly);
  const downLabel = down > 0 ? fmt$(down) : (offer.downPaymentLabel || "Low Down Payment");
  const priceLabel = price > 0 ? fmt$(price) : (offer.priceLabel || "Call for Price");
  const weeklyLabel = offer.showWeekly && weekly > 0 ? fmt$(weekly) : (offer.weeklyPaymentLabel || "Terms Available");
  const monthlyLabel = offer.showMonthly && monthly > 0 ? fmt$(monthly) : (offer.monthlyPaymentLabel || "Pending");
  return {
    year: v.year, make: v.make, model: v.model, trim: v.trim, color: v.color,
    price: priceLabel,
    down_payment: downLabel,
    weekly_payment: weeklyLabel,
    monthly_payment: monthlyLabel,
    mileage: fmtMi(v.mileage),
    dealership_name: brand.name,
    phone: brand.phone,
    website: brand.website,
    disclosure: brand.disclosure,
  };
}

function substitute(text, vars) {
  if (typeof text !== "string") return text;
  return text.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] != null ? vars[k] : `{{${k}}}`);
}

// Default brand
const defaultBrand = {
  name: "Wabash Auto Sales",
  phone: "(317) 555-0100",
  website: "wabashauto.com",
  disclosure: "Subject to approval of credit. WAC. Tax, title, license additional. Dealer #IN-447128.",
  offer: {
    downPayment: "",
    price: "",
    weeklyPayment: "",
    monthlyPayment: "",
    downPaymentLabel: "Low Down Payment",
    priceLabel: "Call for Price",
    weeklyPaymentLabel: "Terms Available",
    monthlyPaymentLabel: "Pending",
    showWeekly: false,
    showMonthly: false,
  },
  colors: ["#111827", "#2563EB", "#DC2626", "#F59E0B", "#16A34A"],
};

const CreativeBuilderData = {
  exportSizes, palettes, adTemplates,
  buildVars, substitute, defaultBrand,
};

export { CreativeBuilderData, exportSizes, palettes, adTemplates, buildVars, substitute, defaultBrand };
