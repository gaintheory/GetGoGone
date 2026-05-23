import type { InspectionSourceVehicle, VehicleSummary } from "./types";
import { jsonToStringArray } from "./types";

function parseNumber(value: number | string | null): number | null {
  if (typeof value === "number") return value;
  if (!value) return null;

  const normalized = value.replace(/[^0-9.]/g, "");
  if (!normalized) return null;

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

export function mapInspectionToVehicleSummary(
  inspection: InspectionSourceVehicle,
): VehicleSummary {
  return {
    id: `inspection:${inspection.id}`,
    sourceSystem: "internal_inspections",
    sourceRecordId: String(inspection.id),
    vin: inspection.vin,
    year: parseNumber(inspection.year),
    make: inspection.make,
    model: inspection.model,
    bodyStyle: inspection.body,
    mileage: parseNumber(inspection.miles),
    exteriorColor: inspection.color,
    transmission: inspection.transmission,
    price: inspection.price,
    downPayment: inspection.down_payment,
    status: "source",
    readinessStatus: inspection.service_records?.safety_status ?? null,
    description: inspection.website_copy,
    notes: inspection.remarks,
    photoUrls: jsonToStringArray(inspection.photo_urls),
  };
}
