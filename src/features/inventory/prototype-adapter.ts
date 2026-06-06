import type { Json, Tables } from "@/lib/database.types";
import { getLocalVehicleImageMap } from "./local-images";

type InspectionVehicleSource = Tables<"inspection_vehicle_source">;
type VehicleRow = Tables<"vehicles">;
type VehiclePhotoRow = Pick<Tables<"vehicle_photos">, "storage_path" | "is_primary" | "position">;

export type VehicleRowWithPhotos = VehicleRow & {
  vehicle_photos?: VehiclePhotoRow[] | null;
};

export type BodyKind = "sedan" | "truck" | "suv" | "van";

export type PrototypeVehicle = {
  id: string;
  stock: string;
  year: number | string;
  make: string;
  model: string;
  trim: string;
  body: BodyKind;
  color: string;
  palette: string[];
  price: number;
  down: number;
  weekly: number;
  monthly: number;
  mileage: number;
  vin: string;
  imageUrl: string | null;
  images: string[];
  photosList: string[];
  sourceUrl: string | null;
  status: string;
  campaign: string;
  daysIn: number;
  leads: number;
  photos: number;
  features: string[];
  notes: string;
  sourceSystem: string | null;
  sourceRecordId: string | null;
};

export const palettes: Record<BodyKind, string[]> = {
  sedan: ["#64748b", "#334155", "#cbd5e1"],
  truck: ["#1e293b", "#0f172a", "#cbd5e1"],
  suv: ["#0f766e", "#0f172a", "#cbd5e1"],
  van: ["#475569", "#1e293b", "#cbd5e1"],
};

export function normalizeBody(body?: string | null): BodyKind {
  const value = (body || "").toLowerCase();
  if (value.includes("truck") || value.includes("pickup")) return "truck";
  if (value.includes("suv") || value.includes("utility")) return "suv";
  if (value.includes("van")) return "van";
  return "sedan";
}

function photoCount(value: Json | null | undefined): number {
  return Array.isArray(value) ? value.length : 0;
}

// ─── Adapter 1: vehicles table rows (with optional joined vehicle_photos) ────

export function fromVehiclesTable(row: VehicleRowWithPhotos): PrototypeVehicle {
  const body = normalizeBody(row.body_style);

  let imageUrl: string | null = null;
  let photosList: string[] = [];
  const photos = row.vehicle_photos || [];
  const photosCount = photos.length;

  if (photosCount > 0) {
    const sorted = [...photos].sort((a, b) => a.position - b.position);
    const primary = photos.find(p => p.is_primary) || sorted[0];
    imageUrl = primary?.storage_path || null;
    photosList = sorted.map(p => p.storage_path).filter((s): s is string => Boolean(s));
  }

  if (!imageUrl) {
    imageUrl = getLocalVehicleImageMap().get(row.vin.toUpperCase()) || null;
  }

  if (imageUrl && photosList.length === 0) {
    photosList = [imageUrl];
  }

  return {
    id: row.id,
    stock: row.stock_number || row.source_record_id || "INV",
    year: row.year || "",
    make: row.make || "Unknown",
    model: row.model || "Vehicle",
    trim: row.trim || "",
    body,
    color: row.exterior_color || "",
    palette: palettes[body],
    price: row.price || 0,
    down: row.down_payment || 0,
    weekly: 0,
    monthly: 0,
    mileage: row.mileage || 0,
    vin: row.vin,
    imageUrl,
    images: photosList,
    photosList,
    sourceUrl: row.source_url,
    status: row.status === "active" ? "Active" : (row.status || ""),
    campaign: "Draft",
    daysIn: 0,
    leads: 0,
    photos: photosCount || (imageUrl ? 1 : 0),
    features: [],
    notes: row.notes || row.description || "",
    sourceSystem: row.source_system || "getgogone_vehicles",
    sourceRecordId: row.source_record_id,
  };
}

// ─── Adapter 2: inspection_vehicle_source rows ───────────────────────────────

function campaignStatus(row: InspectionVehicleSource): string {
  if (!row.down_payment) return "Draft";
  if (photoCount(row.photo_urls) < 6) return "Draft";
  return "Ready to Review";
}

function vehicleStatus(row: InspectionVehicleSource): string {
  if (!row.down_payment) return "Missing Payment";
  if (photoCount(row.photo_urls) < 6) return "Needs Photos";
  return "Active";
}

export function fromInspectionSource(row: InspectionVehicleSource): PrototypeVehicle {
  const body = normalizeBody(row.body_style);
  const vin = row.vin || "";
  const imageUrl = getLocalVehicleImageMap().get(vin.toUpperCase()) || null;

  const rawPhotoUrls = row.photo_urls;
  let photosList: string[] = [];
  if (Array.isArray(rawPhotoUrls)) {
    photosList = rawPhotoUrls.map((x: unknown) => String(x));
  } else if (imageUrl) {
    photosList = [imageUrl];
  }

  return {
    id: `source-${row.source_record_id || row.vin}`,
    stock: row.source_record_id ? `INSP-${row.source_record_id}` : "INSP",
    year: row.year || "",
    make: row.make || "Unknown",
    model: row.model || "Vehicle",
    trim: "",
    body,
    color: row.exterior_color || "",
    palette: palettes[body],
    price: row.price || 0,
    down: row.down_payment || 0,
    weekly: 0,
    monthly: 0,
    mileage: row.mileage || 0,
    vin,
    imageUrl,
    images: photosList,
    photosList,
    sourceUrl: null,
    status: vehicleStatus(row),
    campaign: campaignStatus(row),
    daysIn: 0,
    leads: 0,
    photos: photoCount(row.photo_urls),
    features: [],
    notes: row.notes || row.service_notes || row.description || "",
    sourceSystem: row.source_system || "internal_inspections",
    sourceRecordId: row.source_record_id,
  };
}

// ─── Backward-compatibility shim ─────────────────────────────────────────────
// Kept temporarily so other route files don't break mid-refactor.
// New code should call fromInspectionSource directly.

export const mapSourceVehicleToPrototypeVehicle = fromInspectionSource;
