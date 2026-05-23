import { randomUUID } from "crypto";
import fs from "fs/promises";
import path from "path";
import AdmZip from "adm-zip";
import { createWorker } from "tesseract.js";
import type { VehicleImportRecord, VehicleImportPhoto } from "../types";
import { isValidVin, normalizeVin } from "../vin-decode";

// ─── Filename Parsing ─────────────────────────────────────────────────────────

export type ParsedFilename = {
  year?: number;
  make?: string;
  model?: string;
  stockNumber?: string;
  exportDate?: string;
};

/**
 * Parses a standard CarsForSale ZIP kit filename.
 * Example: "2016_Jeep_Wrangler_Unlimited_17176_20260522.zip"
 * Returns year, make, model, stock number, and date.
 */
export function parseZipFilename(filename: string): ParsedFilename {
  // Strip extension
  const base = path.basename(filename, ".zip");
  
  // Split by underscores
  const parts = base.split("_");
  if (parts.length < 4) {
    return {};
  }

  // 1. Year is always first (4 digits)
  const yearStr = parts[0];
  const year = /^\d{4}$/.test(yearStr) ? parseInt(yearStr, 10) : undefined;

  // 2. Export date is always last (8 digits)
  const dateStr = parts[parts.length - 1];
  const exportDate = /^\d{8}$/.test(dateStr) ? dateStr : undefined;

  // 3. Stock number is second to last
  const stockNumber = parts[parts.length - 2];

  // 4. Everything in between is Make and Model
  // e.g. ["Ford", "F", "250", "Super", "Duty"]
  const makeModelParts = parts.slice(1, parts.length - 2);
  
  let make = makeModelParts[0];
  let model = makeModelParts.slice(1).join(" ");

  // Handle common multi-word makes
  if (make?.toLowerCase() === "land" && makeModelParts[1]?.toLowerCase() === "rover") {
    make = "Land Rover";
    model = makeModelParts.slice(2).join(" ");
  } else if (make?.toLowerCase() === "aston" && makeModelParts[1]?.toLowerCase() === "martin") {
    make = "Aston Martin";
    model = makeModelParts.slice(2).join(" ");
  } else if (make?.toLowerCase() === "alfa" && makeModelParts[1]?.toLowerCase() === "romeo") {
    make = "Alfa Romeo";
    model = makeModelParts.slice(2).join(" ");
  }

  // Clean up model name
  if (model) {
    model = model.replace(/_/g, " ").trim();
  }

  return {
    year,
    make,
    model,
    stockNumber,
    exportDate,
  };
}

// ─── OCR Spec Extraction ──────────────────────────────────────────────────────

type OcrSpecs = {
  price?: number;
  mileage?: number;
  vin?: string;
  stockNumber?: string;
  bodyStyle?: string;
  engine?: string;
  transmission?: string;
  drivetrain?: string;
  exteriorColor?: string;
  interiorColor?: string;
  fuelType?: string;
  mpgCity?: number;
  mpgHighway?: number;
};

function parseMpg(mpgStr: string | undefined): { city?: number; highway?: number } {
  if (!mpgStr) return {};
  // e.g. "21City / 31 Hwy" or "21 / 31"
  const parts = mpgStr.split("/");
  const cityMatch = parts[0]?.match(/(\d+)/);
  const hwyMatch = parts[1]?.match(/(\d+)/);
  
  return {
    city: cityMatch ? parseInt(cityMatch[1], 10) : undefined,
    highway: hwyMatch ? parseInt(hwyMatch[1], 10) : undefined,
  };
}

function cleanNumber(str: string | undefined): number | undefined {
  if (!str) return undefined;
  const num = parseInt(str.replace(/[^0-9]/g, ""), 10);
  return isNaN(num) ? undefined : num;
}

/**
 * Extracts structured specs from OCR text output.
 */
export function extractSpecsFromOcrText(text: string): OcrSpecs {
  const specs: OcrSpecs = {};

  // Matches "Price $10,900" or similar
  const priceMatch = text.match(/Price\s*\$?\s*([\d,]+)/i);
  if (priceMatch) specs.price = cleanNumber(priceMatch[1]);

  // Matches "Mileage 13,751 mi" or similar
  const mileageMatch = text.match(/Mileage\s*([\d,]+)/i);
  if (mileageMatch) specs.mileage = cleanNumber(mileageMatch[1]);

  // Matches "VIN THGCP2F37AA009460"
  const vinMatch = text.match(/VIN\s*([A-HJ-NPR-Z0-9]{17})/i);
  if (vinMatch) specs.vin = normalizeVin(vinMatch[1]);

  // Matches "Stock# m21" or "Stock # 17121"
  const stockMatch = text.match(/Stock\s*#?\s*(\S+)/i);
  if (stockMatch) specs.stockNumber = stockMatch[1].trim();

  // Matches specs text
  const bodyMatch = text.match(/Body\s*Style\s*(.+?)(?:\r?\n|$)/i);
  if (bodyMatch) specs.bodyStyle = bodyMatch[1].trim();

  const engineMatch = text.match(/Engine\s*(.+?)(?:\r?\n|$)/i);
  if (engineMatch) specs.engine = engineMatch[1].trim();

  const transMatch = text.match(/Transmission\s*(.+?)(?:\r?\n|$)/i);
  if (transMatch) specs.transmission = transMatch[1].trim();

  const driveMatch = text.match(/Drivetrain\s*(.+?)(?:\r?\n|$)/i);
  if (driveMatch) specs.drivetrain = driveMatch[1].trim();

  const extColorMatch = text.match(/Exterior\s*Color\s*(.+?)(?:\r?\n|$)/i);
  if (extColorMatch) specs.exteriorColor = extColorMatch[1].trim();

  const intColorMatch = text.match(/Interior\s*Color\s*(.+?)(?:\r?\n|$)/i);
  if (intColorMatch) specs.interiorColor = intColorMatch[1].trim();

  const fuelMatch = text.match(/Fuel\s*(.+?)(?:\r?\n|$)/i);
  if (fuelMatch) specs.fuelType = fuelMatch[1].trim();

  const mpgMatch = text.match(/MPG\s*(.+?)(?:\r?\n|$)/i);
  if (mpgMatch) {
    const { city, highway } = parseMpg(mpgMatch[1]);
    specs.mpgCity = city;
    specs.mpgHighway = highway;
  }

  return specs;
}

// ─── Main Parser ──────────────────────────────────────────────────────────────

export type ZipKitParseResult = {
  record: VehicleImportRecord;
  tempDir: string;
};

/**
 * Extracts a CarsForSale ZIP kit, parses its Info.txt, runs OCR on Details.jpg,
 * and normalizes the photo files into localPaths.
 * 
 * NOTE: The caller MUST call `cleanupZipKitTempDir(tempDir)` when the pipeline
 * run is completely finished.
 */
export async function parseZipKit(zipPath: string): Promise<ZipKitParseResult> {
  const filename = path.basename(zipPath);
  const parsedFn = parseZipFilename(filename);

  // 1. Setup temp directory in supabase/.temp
  const runId = randomUUID();
  const tempDir = path.resolve("supabase/.temp", `zip-intake-${runId}`);
  await fs.mkdir(tempDir, { recursive: true });

  // 2. Extract ZIP contents
  try {
    const zip = new AdmZip(zipPath);
    zip.extractAllTo(tempDir, true);
  } catch (err) {
    // Cleanup temp dir before throwing
    await fs.rm(tempDir, { recursive: true, force: true });
    throw new Error(`Failed to extract ZIP file: ${err instanceof Error ? err.message : String(err)}`);
  }

  try {
    // 3. Scan extracted files
    const files = await fs.readdir(tempDir);
    
    // Find Info.txt
    const infoFile = files.find(f => f.toLowerCase().endsWith("-info.txt"));
    let description = "";
    let trim: string | undefined;

    if (infoFile) {
      const infoContent = await fs.readFile(path.join(tempDir, infoFile), "utf8");
      const lines = infoContent.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      if (lines.length > 0) {
        // Line 1 is the full title e.g. "2010 Honda Accord LX"
        const fullTitle = lines[0];
        
        // Extract trim by stripping Year Make Model
        if (parsedFn.year && parsedFn.make && parsedFn.model) {
          const prefix = `${parsedFn.year} ${parsedFn.make} ${parsedFn.model}`.toLowerCase();
          if (fullTitle.toLowerCase().startsWith(prefix)) {
            trim = fullTitle.substring(prefix.length).trim();
          }
        }
        
        description = lines.slice(1).join("\n\n");
      }
    }

    // Find Details image and run OCR
    const detailsFile = files.find(f => f.toLowerCase().endsWith("-details.jpg"));
    let ocrSpecs: OcrSpecs = {};

    if (detailsFile) {
      const detailsPath = path.join(tempDir, detailsFile);
      const worker = await createWorker("eng", 1, {
        workerPath: path.resolve(process.cwd(), "node_modules/tesseract.js/src/worker-script/node/index.js"),
        langPath: path.resolve(process.cwd()),
        cachePath: path.resolve(process.cwd()),
      });
      try {
        const { data: { text } } = await worker.recognize(detailsPath);
        ocrSpecs = extractSpecsFromOcrText(text);
      } catch (ocrErr) {
        console.error("OCR extraction failed for", detailsFile, ocrErr);
      } finally {
        await worker.terminate();
      }
    }

    // 4. Build photo list
    const photos: VehicleImportPhoto[] = [];
    
    // Filter to image files
    const imgFiles = files.filter(f => {
      const ext = path.extname(f).toLowerCase();
      return ext === ".jpg" || ext === ".jpeg" || ext === ".png" || ext === ".webp";
    });

    for (const f of imgFiles) {
      const fLower = f.toLowerCase();
      const localPath = path.join(tempDir, f);

      if (fLower.endsWith("-details.jpg")) {
        photos.push({
          role: "detail_card",
          localPath,
          sequence: 100,
          caption: "CarsForSale Specifications Card",
        });
      } else if (fLower.endsWith("-highlight.jpg")) {
        photos.push({
          role: "highlight_card",
          localPath,
          sequence: 101,
          caption: "CarsForSale Highlight Card",
        });
      } else {
        // Check for numbered photos e.g. "-1.jpg", "-2.jpg", etc.
        const numMatch = fLower.match(/-(\d+)\.(?:jpg|jpeg|png|webp)$/i);
        if (numMatch) {
          const num = parseInt(numMatch[1], 10);
          const sequence = num - 1;
          const role = num === 1 ? "primary" : "gallery";
          photos.push({
            role,
            localPath,
            sequence,
            caption: `${parsedFn.year} ${parsedFn.make} ${parsedFn.model} - Photo ${num}`,
          });
        } else {
          // Fallback if not matching the standard CarsForSale naming
          photos.push({
            role: "gallery",
            localPath,
            sequence: 50,
            caption: f,
          });
        }
      }
    }

    // Sort photos by sequence
    photos.sort((a, b) => a.sequence - b.sequence);

    // 5. Combine everything into a VehicleImportRecord
    const record: VehicleImportRecord = {
      sourceSystem: "zip_kit",
      sourceId: parsedFn.stockNumber ?? ocrSpecs.stockNumber,
      sourceFetchedAt: new Date().toISOString(),
      rawData: {
        filename,
        parsedFilename: parsedFn,
        ocrSpecs,
      },
      vin: ocrSpecs.vin,
      stockNumber: parsedFn.stockNumber ?? ocrSpecs.stockNumber,
      year: parsedFn.year,
      make: parsedFn.make,
      model: parsedFn.model,
      trim: trim,
      bodyStyle: ocrSpecs.bodyStyle,
      mileage: ocrSpecs.mileage,
      exteriorColor: ocrSpecs.exteriorColor,
      interiorColor: ocrSpecs.interiorColor,
      fuelType: ocrSpecs.fuelType,
      transmission: ocrSpecs.transmission,
      drivetrain: ocrSpecs.drivetrain,
      engine: ocrSpecs.engine,
      price: ocrSpecs.price,
      description: description || undefined,
      photos,
    };

    return {
      record,
      tempDir,
    };

  } catch (err) {
    // Clean up on inner failures
    await fs.rm(tempDir, { recursive: true, force: true });
    throw err;
  }
}

/**
 * Removes the temporary directory and all its contents.
 */
export async function cleanupZipKitTempDir(tempDir: string): Promise<void> {
  try {
    await fs.rm(tempDir, { recursive: true, force: true });
  } catch (err) {
    console.error("Failed to cleanup temp directory:", tempDir, err);
  }
}
