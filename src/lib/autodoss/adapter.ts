import type { AutodossDealer, AutodossInventoryItem } from "./client";
import {
  normalizeBody,
  palettes,
  type PrototypeVehicle,
} from "@/features/inventory/prototype-adapter";
import { getLocalVehicleImageMap } from "@/features/inventory/local-images";

/**
 * Map an AutoDoss inventory item (pulled over the Data API) into the
 * PrototypeVehicle shape the GetGoGone UI already consumes. Ids are prefixed
 * `autodoss-` so they never collide with GetGoGone's own vehicle rows.
 */
export function fromAutodossInventory(item: AutodossInventoryItem): PrototypeVehicle {
  const body = normalizeBody(item.body_style);
  const vin = item.vin || "";

  let photosList = item.photos ?? [];
  let imageUrl: string | null = photosList[0] ?? null;
  if (!imageUrl && vin) {
    imageUrl = getLocalVehicleImageMap().get(vin.toUpperCase()) || null;
    if (imageUrl) photosList = [imageUrl];
  }

  return {
    id: `autodoss-${item.id}`,
    stock: item.stock_number || `AD-${item.id}`,
    year: item.year ?? "",
    make: item.make || "Unknown",
    model: item.model || "Vehicle",
    trim: item.trim || "",
    body,
    color: item.exterior_color || "",
    palette: palettes[body],
    price: item.price ?? 0,
    down: item.down_payment ?? 0,
    weekly: 0,
    monthly: 0,
    mileage: item.mileage ?? 0,
    vin,
    imageUrl,
    images: photosList,
    photosList,
    sourceUrl: null,
    status: item.status === "available" ? "Active" : item.status,
    campaign: item.featured ? "Featured" : "Draft",
    daysIn: 0,
    leads: 0,
    photos: photosList.length,
    features: [],
    notes: item.description || "",
    sourceSystem: "autodoss",
    sourceRecordId: item.id,
  };
}

// ─── Brand (dealer profile → Designer brand shape) ───────────────────────────

/**
 * The brand object the Designer / creative builder consumes. Mirrors the
 * `defaultBrand` shape in `src/prototype/screens/creative-templates.jsx`, plus a
 * `logoUrl` now that AutoDoss provides one. `offer` and `disclosure` are not
 * dealer-profile data, so they fall back to whatever the caller passes in.
 */
export type DesignerBrand = {
  name: string;
  phone: string;
  website: string;
  logoUrl: string | null;
  disclosure: string;
  colors: string[];
  offer: Record<string, unknown>;
};

const FALLBACK_BRAND_COLORS = ["#111827", "#2563EB", "#DC2626", "#F59E0B", "#16A34A"];

/** Best-effort extraction of hex colors from AutoDoss's free-form brand_colors jsonb. */
function extractBrandColors(raw: unknown): string[] {
  const hexes: string[] = [];
  const pushHex = (v: unknown) => {
    if (typeof v === "string" && /^#?[0-9a-fA-F]{6}$/.test(v.trim())) {
      const h = v.trim();
      hexes.push(h.startsWith("#") ? h : `#${h}`);
    }
  };
  if (Array.isArray(raw)) raw.forEach(pushHex);
  else if (raw && typeof raw === "object") Object.values(raw as Record<string, unknown>).forEach(pushHex);
  else pushHex(raw);
  return hexes.length ? hexes.slice(0, 5) : FALLBACK_BRAND_COLORS;
}

/**
 * Map an AutoDoss dealer profile into the Designer brand shape. Pure + additive —
 * not yet wired into any consumer. When the Data API is confirmed, the Designer
 * and Brand Brain should hydrate from this instead of the hand-maintained
 * `defaultBrand`. `fallback` supplies offer terms + disclosure the DMS can't know.
 */
export function toBrand(
  dealer: AutodossDealer,
  fallback?: Partial<DesignerBrand>,
): DesignerBrand {
  const website = (dealer.website_url || fallback?.website || "")
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "");

  return {
    name: dealer.name || fallback?.name || "Dealership",
    phone: dealer.phone || fallback?.phone || "",
    website,
    logoUrl: dealer.logo_url || fallback?.logoUrl || null,
    disclosure: fallback?.disclosure || "Subject to approval of credit. WAC. Tax, title, license additional.",
    colors: extractBrandColors(dealer.brand_colors),
    offer: fallback?.offer || {},
  };
}
