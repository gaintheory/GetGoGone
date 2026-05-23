import type { Json, Tables } from "@/lib/database.types";
import { getLocalVehicleImageMap } from "./local-images";

type InspectionVehicleSource = Tables<"inspection_vehicle_source">;

const palettes: Record<string, string[]> = {
  sedan: ["#64748b", "#334155", "#cbd5e1"],
  truck: ["#1e293b", "#0f172a", "#cbd5e1"],
  suv: ["#0f766e", "#0f172a", "#cbd5e1"],
  van: ["#475569", "#1e293b", "#cbd5e1"],
};

function photoCount(value: Json | null): number {
  return Array.isArray(value) ? value.length : 0;
}

function normalizeBody(body?: string | null): string {
  const value = (body || "").toLowerCase();
  if (value.includes("truck") || value.includes("pickup")) return "truck";
  if (value.includes("suv") || value.includes("utility")) return "suv";
  if (value.includes("van")) return "van";
  return "sedan";
}

function campaignStatus(row: InspectionVehicleSource): string {
  if (!row.down_payment) return "Draft";
  if (photoCount(row.photo_urls) < 6) return "Draft";
  return "Ready to Review";
}

function vehicleStatus(row: InspectionVehicleSource): string {
  if (!row.down_payment) return "Missing Payment";
  if (photoCount(row.photo_urls) < 6) return "Needs Photos";
  if (row.readiness_status && row.readiness_status.toLowerCase().includes("ready")) {
    return "Active";
  }
  return "Active";
}

export function mapSourceVehicleToPrototypeVehicle(row: InspectionVehicleSource) {
  const body = normalizeBody(row.body_style);
  const vin = row.vin || "";
  const imageUrl = getLocalVehicleImageMap().get(vin.toUpperCase()) || null;

  const rawPhotoUrls = row.photo_urls;
  let photosList: string[] = [];
  if (Array.isArray(rawPhotoUrls)) {
    photosList = rawPhotoUrls.map((x: any) => String(x));
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
