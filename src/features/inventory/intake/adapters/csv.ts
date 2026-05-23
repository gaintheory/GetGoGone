import Papa from "papaparse";
import type { VehicleImportRecord, VehicleImportPhoto } from "../types";
import { isValidVin, normalizeVin } from "../vin-decode";

// ─── Synonym Syn-Maps for Auto-Detection ──────────────────────────────────────

const MAPPABLE_FIELDS = [
  "vin",
  "stockNumber",
  "year",
  "make",
  "model",
  "trim",
  "bodyStyle",
  "mileage",
  "exteriorColor",
  "interiorColor",
  "price",
  "downPayment",
  "transmission",
  "drivetrain",
  "engine",
  "fuelType",
  "description",
  "photoUrls", // Special virtual field for comma-separated photo URLs
] as const;

export type MappableField = typeof MAPPABLE_FIELDS[number];

const FIELD_SYNONYMS: Record<MappableField, string[]> = {
  vin: ["vin", "vincode", "vin_number", "vin number", "vehicle identification number", "serial number", "serial_num"],
  stockNumber: ["stock", "stock_number", "stock number", "stock#", "stock_num", "stockno", "stock no"],
  year: ["year", "model_year", "model year", "yr"],
  make: ["make", "brand", "manufacturer", "mfg"],
  model: ["model", "vehicle_model", "model_name"],
  trim: ["trim", "trim_level", "trim level", "series", "version"],
  bodyStyle: ["body", "body_style", "body style", "body_type", "body type", "class", "bodyclass"],
  mileage: ["mileage", "miles", "odometer", "mil", "odo", "mileage_count"],
  exteriorColor: ["color", "exterior_color", "exterior color", "ext_color", "ext color", "paint", "exterior"],
  interiorColor: ["interior_color", "interior color", "int_color", "int color", "interior", "int"],
  price: ["price", "internet_price", "internet price", "retail_price", "retail price", "sell_price", "sell price", "msrp", "amount"],
  downPayment: ["down_payment", "down payment", "downpayment", "down", "payment down"],
  transmission: ["transmission", "trans", "gearbox", "transmission_style"],
  drivetrain: ["drivetrain", "drive_type", "drive type", "drive", "wd", "drivetype"],
  engine: ["engine", "engine_size", "engine size", "displacement", "motor", "cylinders"],
  fuelType: ["fuel", "fuel_type", "fuel type"],
  description: ["description", "comments", "notes", "copy", "web_description", "marketing_description"],
  photoUrls: ["photo_url", "photo url", "image_url", "image url", "primary_photo", "photos", "images", "photo_urls", "image_urls"],
};

/**
 * Automatically detects mappings between CSV headers and standard internal fields.
 * Returns a map of standard field keys to CSV header names.
 */
export function autoDetectCsvMapping(headers: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};
  const lowerHeaders = headers.map(h => h.trim().toLowerCase());

  for (const field of MAPPABLE_FIELDS) {
    const synonyms = FIELD_SYNONYMS[field];
    
    // Find the first header that matches one of the synonyms
    const headerIdx = lowerHeaders.findIndex(header => 
      synonyms.some(syn => header === syn || header.includes(syn))
    );

    if (headerIdx !== -1) {
      mapping[field] = headers[headerIdx];
    }
  }

  return mapping;
}

// ─── CSV Parser ───────────────────────────────────────────────────────────────

export type CsvImportConfig = {
  /** Map of standard field keys to CSV header names */
  fieldMapping: Record<string, string>;
  /** Optional custom delimiter (default: auto-detect) */
  delimiter?: string;
  /** ISO string for sync tracking */
  fetchedAt?: string;
};

/**
 * Parses raw CSV text and maps rows to VehicleImportRecords using the provided mapping.
 */
export function parseInventoryCsv(csvText: string, config: CsvImportConfig): VehicleImportRecord[] {
  const parsed = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: "greedy",
    delimiter: config.delimiter || "",
  });

  if (parsed.errors.length > 0 && parsed.data.length === 0) {
    throw new Error(`CSV parse failed: ${parsed.errors[0].message}`);
  }

  const rows = parsed.data as Record<string, string>[];
  const { fieldMapping } = config;
  const fetchedAt = config.fetchedAt || new Date().toISOString();

  return rows.map((row) => {
    // Helper to get raw column values by standard field name mapping
    const getVal = (field: MappableField): string | undefined => {
      const header = fieldMapping[field];
      if (!header) return undefined;
      return row[header]?.trim();
    };

    // 1. Process Photos
    const photos: VehicleImportPhoto[] = [];
    const rawPhotosStr = getVal("photoUrls");
    
    if (rawPhotosStr) {
      // Split by commas, semicolons, or pipes
      const urls = rawPhotosStr
        .split(/[,;|]/)
        .map(u => u.trim())
        .filter(u => u.startsWith("http://") || u.startsWith("https://"));

      urls.forEach((url, idx) => {
        photos.push({
          role: idx === 0 ? "primary" : "gallery",
          sourceUrl: url,
          sequence: idx,
          caption: `Photo ${idx + 1}`,
        });
      });
    }

    // 2. Parse numbers safely
    const yearVal = parseInt(getVal("year") || "", 10);
    const priceVal = parseFloat((getVal("price") || "").replace(/[^0-9.]/g, ""));
    const downVal = parseFloat((getVal("downPayment") || "").replace(/[^0-9.]/g, ""));
    const milesVal = parseInt((getVal("mileage") || "").replace(/[^0-9]/g, ""), 10);

    const record: VehicleImportRecord = {
      sourceSystem: "csv",
      sourceId: getVal("stockNumber") || getVal("vin"),
      sourceFetchedAt: fetchedAt,
      rawData: row,
      
      vin: getVal("vin") ? normalizeVin(getVal("vin")!) : undefined,
      stockNumber: getVal("stockNumber"),
      
      year: isNaN(yearVal) ? undefined : yearVal,
      make: getVal("make"),
      model: getVal("model"),
      trim: getVal("trim"),
      bodyStyle: getVal("bodyStyle"),
      mileage: isNaN(milesVal) ? undefined : milesVal,
      exteriorColor: getVal("exteriorColor"),
      interiorColor: getVal("interiorColor"),
      fuelType: getVal("fuelType"),
      transmission: getVal("transmission"),
      drivetrain: getVal("drivetrain"),
      engine: getVal("engine"),
      
      price: isNaN(priceVal) ? undefined : priceVal,
      downPayment: isNaN(downVal) ? undefined : downVal,
      
      description: getVal("description"),
      photos: photos.length > 0 ? photos : undefined,
    };

    return record;
  });
}
