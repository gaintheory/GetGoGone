import type { AutodossInventoryItem } from "./client";
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
