/**
 * VIN Decode — NHTSA Vehicle API
 *
 * Uses the free, public NHTSA vPIC API to enrich a VehicleImportRecord
 * with make/model/year/specs when the source data is sparse.
 *
 * API: https://vpic.nhtsa.dot.gov/api/vehicles/decodevinvalues/{VIN}?format=json
 * - No API key required
 * - Free and maintained by the US government
 * - Returns manufacturer specs (not dealer-specific data like price/mileage)
 */

import type { VehicleImportRecord } from "./types";

const NHTSA_BASE = "https://vpic.nhtsa.dot.gov/api/vehicles/decodevinvalues";
const VIN_PATTERN = /^[A-HJ-NPR-Z0-9]{17}$/i;

// ─── Raw NHTSA Response Shape ─────────────────────────────────────────────────

type NhtsaDecodeResult = {
  Make?: string;
  Model?: string;
  ModelYear?: string;
  Trim?: string;
  BodyClass?: string;
  DriveType?: string;
  TransmissionStyle?: string;
  DisplacementL?: string;
  EngineCylinders?: string;
  EngineHP?: string;
  FuelTypePrimary?: string;
  PlantCountry?: string;
  ErrorCode?: string;
  ErrorText?: string;
  [key: string]: string | undefined;
};

// ─── Internal Helpers ─────────────────────────────────────────────────────────

function cleanString(val: string | undefined): string | undefined {
  const s = val?.trim();
  return s && s !== "Not Applicable" && s !== "0" ? s : undefined;
}

function toNumber(val: string | undefined): number | undefined {
  if (!val) return undefined;
  const n = parseFloat(val.replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

function buildEngineString(result: NhtsaDecodeResult): string | undefined {
  const parts: string[] = [];
  const displacement = cleanString(result.DisplacementL);
  const cylinders = cleanString(result.EngineCylinders);
  const hp = cleanString(result.EngineHP);

  if (displacement) {
    const rounded = parseFloat(displacement).toFixed(1);
    parts.push(`${rounded}L`);
  }
  if (cylinders) {
    const n = parseInt(cylinders);
    if (n === 4) parts.push("I4");
    else if (n === 6) parts.push("V6");
    else if (n === 8) parts.push("V8");
    else if (n === 3) parts.push("I3");
    else parts.push(`${n}-cyl`);
  }
  if (hp) parts.push(`${Math.round(parseFloat(hp))}hp`);

  return parts.length > 0 ? parts.join(" ") : undefined;
}

function normalizeBodyStyle(bodyClass: string | undefined): string | undefined {
  if (!bodyClass) return undefined;
  const b = bodyClass.toLowerCase();
  if (b.includes("sedan")) return "Sedan";
  if (b.includes("coupe")) return "Coupe";
  if (b.includes("convertible") || b.includes("cabriolet")) return "Convertible";
  if (b.includes("hatchback")) return "Hatchback";
  if (b.includes("wagon") || b.includes("estate")) return "Wagon";
  if (b.includes("pickup") || b.includes("truck")) return "Truck";
  if (b.includes("van") || b.includes("minivan")) return "Van";
  if (b.includes("suv") || b.includes("sport utility") || b.includes("multipurpose")) return "SUV";
  if (b.includes("bus")) return "Bus";
  if (b.includes("cargo van")) return "Cargo Van";
  return bodyClass; // preserve original if no match
}

// ─── VIN Validation ───────────────────────────────────────────────────────────

export function isValidVin(vin: string | undefined): boolean {
  if (!vin) return false;
  return VIN_PATTERN.test(vin.trim());
}

export function normalizeVin(vin: string): string {
  return vin.trim().toUpperCase();
}

// ─── NHTSA Decode ─────────────────────────────────────────────────────────────

/**
 * Fetches manufacturer specs for a VIN from the NHTSA free API.
 * Returns null if the VIN is invalid, the API is unreachable, or decoding fails.
 * Never throws — all errors are caught and logged.
 */
export async function decodeVin(vin: string): Promise<NhtsaDecodeResult | null> {
  if (!isValidVin(vin)) return null;

  try {
    const url = `${NHTSA_BASE}/${encodeURIComponent(vin.trim())}?format=json`;
    const res = await fetch(url, {
      signal: AbortSignal.timeout(8000), // 8s timeout — NHTSA can be slow
      headers: { Accept: "application/json" },
    });

    if (!res.ok) return null;

    const json = await res.json();
    const results: NhtsaDecodeResult[] = json?.Results ?? [];
    if (!results.length) return null;

    const result = results[0];

    // NHTSA returns error code "0" for success, non-zero for failure
    const errorCode = result.ErrorCode?.split(",")[0]?.trim();
    if (errorCode && errorCode !== "0") {
      // ErrorCode 6 = VIN corrected but decoded — still usable
      if (errorCode !== "6") return null;
    }

    return result;
  } catch {
    // Network error, timeout, parse error — fail gracefully
    return null;
  }
}

// ─── Enrichment ───────────────────────────────────────────────────────────────

/**
 * Enriches a VehicleImportRecord with NHTSA manufacturer data.
 *
 * Rules:
 * - Only fills in fields that are currently undefined/null/0
 * - Never overwrites a field the adapter already provided
 * - Never sets price, mileage, downPayment, or description (these are dealer data)
 * - If VIN is missing or invalid, returns the record unchanged
 * - If NHTSA is unreachable, returns the record unchanged (soft failure)
 */
export async function enrichFromVin(
  record: VehicleImportRecord,
): Promise<VehicleImportRecord & { vinDecoded?: boolean }> {
  const vin = record.vin ? normalizeVin(record.vin) : undefined;
  if (!vin || !isValidVin(vin)) {
    return { ...record, vinDecoded: false };
  }

  const decoded = await decodeVin(vin);
  if (!decoded) {
    return { ...record, vin, vinDecoded: false };
  }

  const year = toNumber(decoded.ModelYear);
  const engine = buildEngineString(decoded);
  const bodyStyle = normalizeBodyStyle(cleanString(decoded.BodyClass));

  return {
    // Preserve all existing adapter data
    ...record,
    // Normalize the VIN to uppercase
    vin,
    // Fill in only missing fields from NHTSA
    make: record.make || cleanString(decoded.Make),
    model: record.model || cleanString(decoded.Model),
    year: record.year || year,
    trim: record.trim || cleanString(decoded.Trim),
    bodyStyle: record.bodyStyle || bodyStyle,
    drivetrain: record.drivetrain || cleanString(decoded.DriveType),
    transmission: record.transmission || cleanString(decoded.TransmissionStyle),
    engine: record.engine || engine,
    fuelType: record.fuelType || cleanString(decoded.FuelTypePrimary),
    // Signal that VIN decode ran successfully
    vinDecoded: true,
  };
}
