import type { Json, Tables } from "@/lib/database.types";

export type InspectionSourceVehicle = Tables<"inspections"> & {
  service_records?: Tables<"service_records"> | null;
};

export type VehicleSummary = {
  id: string;
  sourceSystem: string;
  sourceRecordId: string;
  vin: string;
  stockNumber?: string | null;
  year?: number | null;
  make?: string | null;
  model?: string | null;
  trim?: string | null;
  bodyStyle?: string | null;
  mileage?: number | null;
  exteriorColor?: string | null;
  transmission?: string | null;
  price?: number | null;
  downPayment?: number | null;
  status: string;
  readinessStatus?: string | null;
  description?: string | null;
  notes?: string | null;
  photoUrls: string[];
};

export function jsonToStringArray(value: Json | null): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}
