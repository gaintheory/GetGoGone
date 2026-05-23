/**
 * Inventory Intake Pipeline
 *
 * The shared import engine. Every adapter (ZIP kit, CSV, API, manual) produces
 * VehicleImportRecord[] and calls runImportPipeline(). This module handles:
 *
 *  1. Validation   — minimum required fields, VIN format check
 *  2. Enrichment   — NHTSA VIN decode for sparse records (optional)
 *  3. Upsert       — insert or update vehicles by (dealership_id, vin)
 *                    fallback dedup on (dealership_id, stock_number)
 *  4. Photos       — upload local photos to Supabase Storage, upsert vehicle_photos rows
 *  5. Audit        — write an import run record to vehicle_import_runs
 *
 * Down payment is NEVER set by the pipeline from source data unless the adapter
 * explicitly provides it AND it was confirmed by a manager. The copy system
 * uses safe fallback labels when down_payment is null.
 */

import { randomUUID } from "crypto";
import fs from "fs/promises";
import path from "path";

import { getSupabaseAdmin } from "@/lib/supabase/server";

import { enrichFromVin, isValidVin, normalizeVin } from "./vin-decode";
import type {
  ImportPipelineOptions,
  ImportRowResult,
  ImportRunResult,
  IntakeSourceSystem,
  VehicleImportPhoto,
  VehicleImportRecord,
} from "./types";

// ─── Validation ───────────────────────────────────────────────────────────────

type ValidationResult = { ok: true } | { ok: false; error: string };

function validateRecord(record: VehicleImportRecord): ValidationResult {
  // Must have at least a VIN or stock number to dedup against
  if (!record.vin && !record.stockNumber) {
    return { ok: false, error: "Record has neither a VIN nor a stock number — cannot import." };
  }

  // If a VIN is provided, validate its format
  if (record.vin && !isValidVin(record.vin)) {
    return {
      ok: false,
      error: `VIN "${record.vin}" is not a valid 17-character VIN. Correct it before importing.`,
    };
  }

  return { ok: true };
}

// ─── Vehicle Upsert ───────────────────────────────────────────────────────────

/**
 * Maps a VehicleImportRecord to the vehicles table column shape.
 * Only maps fields that exist in the schema — no extra columns.
 */
function toVehicleRow(record: VehicleImportRecord, dealershipId: string) {
  return {
    dealership_id: dealershipId,
    source_system: record.sourceSystem,
    source_record_id: record.sourceId ?? record.stockNumber ?? null,
    source_url: record.sourceUrl ?? null,
    vin: record.vin ? normalizeVin(record.vin) : (record.stockNumber ?? "UNKNOWN"),
    stock_number: record.stockNumber ?? null,
    year: record.year ?? null,
    make: record.make ?? null,
    model: record.model ?? null,
    trim: record.trim ?? null,
    body_style: record.bodyStyle ?? null,
    mileage: record.mileage ?? null,
    exterior_color: record.exteriorColor ?? null,
    interior_color: record.interiorColor ?? null,
    fuel_type: record.fuelType ?? null,
    transmission: record.transmission ?? null,
    drivetrain: record.drivetrain ?? null,
    engine: record.engine ?? null,
    price: record.price ?? null,
    // down_payment: intentionally NOT set here — operator sets it manually after import
    description: record.description ?? null,
    notes: record.notes ?? null,
    status: "active",
    last_synced_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

/**
 * Upserts a single vehicle record. Deduplicates on (dealership_id, vin).
 * When overwriteExisting is false (default), only null/empty DB fields are
 * updated — existing data from a prior import is preserved.
 */
async function upsertVehicle(
  supabase: NonNullable<ReturnType<typeof getSupabaseAdmin>>,
  record: VehicleImportRecord,
  dealershipId: string,
  options: ImportPipelineOptions,
): Promise<{ vehicleId: string; action: "inserted" | "updated" }> {
  const row = toVehicleRow(record, dealershipId);
  const vin = record.vin ? normalizeVin(record.vin) : null;

  // Try to find an existing vehicle by VIN first, then by stock number
  let existingId: string | null = null;

  if (vin) {
    const { data } = await (supabase as any)
      .from("vehicles")
      .select("id")
      .eq("dealership_id", dealershipId)
      .eq("vin", vin)
      .maybeSingle();
    existingId = data?.id ?? null;
  }

  if (!existingId && record.stockNumber) {
    const { data } = await (supabase as any)
      .from("vehicles")
      .select("id")
      .eq("dealership_id", dealershipId)
      .eq("stock_number", record.stockNumber)
      .maybeSingle();
    existingId = data?.id ?? null;
  }

  if (existingId && !options.overwriteExisting) {
    // Selective update: only fill in null fields in the existing record
    const { error } = await (supabase as any)
      .from("vehicles")
      .update({
        // Update source tracking fields always
        source_system: row.source_system,
        last_synced_at: row.last_synced_at,
        updated_at: row.updated_at,
        // Selectively update spec fields only if they are null in the DB
        // Supabase doesn't support "update if null" natively, so we send
        // all non-null values and let the DB coalesce logic handle it via
        // the conditional below (we fetch nulls and patch only those).
      })
      .eq("id", existingId);

    // For overwrite=false, do a targeted patch of only the fields that are null
    const { data: existing } = await (supabase as any)
      .from("vehicles")
      .select("*")
      .eq("id", existingId)
      .single();

    if (existing) {
      const patch: Record<string, unknown> = {
        last_synced_at: row.last_synced_at,
        updated_at: row.updated_at,
      };
      const fillableFields = [
        "stock_number", "year", "make", "model", "trim", "body_style",
        "mileage", "exterior_color", "interior_color", "condition",
        "fuel_type", "transmission", "drivetrain", "engine", "price",
        "description", "notes", "source_url",
      ] as const;
      for (const field of fillableFields) {
        if (existing[field] == null && row[field as keyof typeof row] != null) {
          patch[field] = row[field as keyof typeof row];
        }
      }
      if (Object.keys(patch).length > 2) {
        await (supabase as any).from("vehicles").update(patch).eq("id", existingId);
      }
    }

    if (error) throw new Error(`Vehicle update failed: ${error.message}`);
    return { vehicleId: existingId, action: "updated" };
  }

  if (existingId && options.overwriteExisting) {
    // Full overwrite — replace all mapped fields
    const { error } = await (supabase as any)
      .from("vehicles")
      .update(row)
      .eq("id", existingId);
    if (error) throw new Error(`Vehicle overwrite failed: ${error.message}`);
    return { vehicleId: existingId, action: "updated" };
  }

  // New vehicle — insert
  const { data, error } = await (supabase as any)
    .from("vehicles")
    .insert(row)
    .select("id")
    .single();
  if (error) throw new Error(`Vehicle insert failed: ${error.message}`);
  return { vehicleId: data.id, action: "inserted" };
}

// ─── Photo Import ─────────────────────────────────────────────────────────────

const STORAGE_BUCKET = "campaign-assets";

/**
 * Uploads a single photo to Supabase Storage and returns its public URL.
 * Storage path: {dealershipId}/vehicles/{vin_or_stock}/{role}-{sequence}.jpg
 */
async function uploadPhoto(
  supabase: NonNullable<ReturnType<typeof getSupabaseAdmin>>,
  photo: VehicleImportPhoto,
  vehicleId: string,
  dealershipId: string,
  vin: string,
): Promise<string | null> {
  let buffer: Buffer | null = null;
  let contentType = "image/jpeg";

  if (photo.localPath) {
    try {
      buffer = await fs.readFile(photo.localPath);
      const ext = path.extname(photo.localPath).toLowerCase();
      if (ext === ".png") contentType = "image/png";
      else if (ext === ".webp") contentType = "image/webp";
    } catch {
      return null; // File not found or unreadable — skip
    }
  } else if (photo.sourceUrl) {
    try {
      const res = await fetch(photo.sourceUrl, { signal: AbortSignal.timeout(15000) });
      if (!res.ok) return null;
      buffer = Buffer.from(await res.arrayBuffer());
      const ct = res.headers.get("content-type");
      if (ct) contentType = ct.split(";")[0].trim();
    } catch {
      return null;
    }
  }

  if (!buffer) return null;

  const safeVin = vin.replace(/[^A-Z0-9]/gi, "").toUpperCase() || vehicleId.slice(0, 8);
  const storagePath = `${dealershipId}/vehicles/${safeVin}/${photo.role}-${photo.sequence}.jpg`;

  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(storagePath, buffer, {
      contentType,
      upsert: true,
    });

  if (error) return null;

  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(storagePath);
  return data?.publicUrl ?? null;
}

/**
 * Imports all photos for a vehicle.
 * Clears existing vehicle_photos rows for this vehicle first (fresh sync),
 * then uploads each photo and creates a new vehicle_photos row.
 */
async function importPhotos(
  supabase: NonNullable<ReturnType<typeof getSupabaseAdmin>>,
  photos: VehicleImportPhoto[],
  vehicleId: string,
  dealershipId: string,
  vin: string,
): Promise<number> {
  if (!photos.length) return 0;

  // Remove existing photo records so we get a clean sync
  await (supabase as any).from("vehicle_photos").delete().eq("vehicle_id", vehicleId);

  let imported = 0;
  for (const photo of photos) {
    const publicUrl = await uploadPhoto(supabase, photo, vehicleId, dealershipId, vin);
    if (!publicUrl) continue;

    const isPrimary = photo.role === "primary" || (photo.role === "gallery" && photo.sequence === 0);

    await (supabase as any).from("vehicle_photos").insert({
      vehicle_id: vehicleId,
      source_url: photo.sourceUrl ?? photo.localPath ?? null,
      storage_path: publicUrl,
      alt_text: photo.caption ?? null,
      position: photo.sequence,
      is_primary: isPrimary,
    });

    imported++;
  }

  return imported;
}

// ─── Import Run Audit ─────────────────────────────────────────────────────────

async function writeImportRun(
  supabase: NonNullable<ReturnType<typeof getSupabaseAdmin>>,
  result: ImportRunResult,
): Promise<void> {
  // Uses audit_log table (already in schema) — no new table needed
  await (supabase as any).from("audit_log").insert({
    dealership_id: result.dealershipId,
    action: "inventory_import",
    entity_type: "vehicle_import_run",
    entity_id: null,
    metadata: {
      run_id: result.runId,
      source_system: result.sourceSystem,
      started_at: result.startedAt,
      finished_at: result.finishedAt,
      total_records: result.totalRecords,
      inserted: result.inserted,
      updated: result.updated,
      skipped: result.skipped,
      errors: result.errors,
    },
  });
}

// ─── Main Pipeline ────────────────────────────────────────────────────────────

/**
 * Runs the full import pipeline for a batch of VehicleImportRecords.
 *
 * @param records   Normalized records from any adapter
 * @param dealershipId  The GetGoGone dealership to import into
 * @param sourceSystem  Which adapter produced these records
 * @param options   Pipeline behaviour options
 * @returns         Full import run result with per-row details
 */
export async function runImportPipeline(
  records: VehicleImportRecord[],
  dealershipId: string,
  sourceSystem: IntakeSourceSystem,
  options: ImportPipelineOptions = {},
): Promise<ImportRunResult> {
  const runId = randomUUID();
  const startedAt = new Date().toISOString();

  const result: ImportRunResult = {
    runId,
    dealershipId,
    sourceSystem,
    startedAt,
    finishedAt: startedAt,
    totalRecords: records.length,
    inserted: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
    rows: [],
  };

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    result.finishedAt = new Date().toISOString();
    result.rows = records.map((r) => ({
      stockNumber: r.stockNumber,
      vin: r.vin,
      make: r.make,
      model: r.model,
      year: r.year,
      action: "error" as const,
      error: "Supabase admin client unavailable — check environment variables.",
    }));
    result.errors = records.length;
    return result;
  }

  for (const rawRecord of records) {
    const rowResult: ImportRowResult = {
      stockNumber: rawRecord.stockNumber,
      vin: rawRecord.vin,
      make: rawRecord.make,
      model: rawRecord.model,
      year: rawRecord.year,
      action: "skipped",
      warnings: [],
    };

    try {
      // 1. Validate
      const validation = validateRecord(rawRecord);
      if (!validation.ok) {
        rowResult.action = "error";
        rowResult.error = validation.error;
        result.errors++;
        result.rows.push(rowResult);
        continue;
      }

      // 2. Enrich from VIN (skip if told to or if no VIN)
      const record = options.skipVinEnrichment
        ? rawRecord
        : await enrichFromVin(rawRecord);

      // 3. Dry run — validate only, no DB writes
      if (options.dryRun) {
        rowResult.action = "skipped";
        rowResult.warnings?.push("dry_run — no data was written");
        result.skipped++;
        result.rows.push(rowResult);
        continue;
      }

      // 4. Upsert vehicle
      const { vehicleId, action } = await upsertVehicle(supabase, record, dealershipId, options);
      rowResult.vehicleId = vehicleId;
      rowResult.action = action;

      // 5. Import photos
      const photos = record.photos ?? [];
      const vin = record.vin ? normalizeVin(record.vin) : record.stockNumber ?? vehicleId;
      const photosImported = photos.length > 0
        ? await importPhotos(supabase, photos, vehicleId, dealershipId, vin)
        : 0;
      rowResult.photosImported = photosImported;

      if (action === "inserted") result.inserted++;
      else result.updated++;

    } catch (err) {
      rowResult.action = "error";
      rowResult.error = err instanceof Error ? err.message : String(err);
      result.errors++;
    }

    result.rows.push(rowResult);
  }

  result.finishedAt = new Date().toISOString();

  // 6. Write audit log (non-fatal if it fails)
  try {
    await writeImportRun(supabase, result);
  } catch {
    // Audit failure should never block a successful import
  }

  return result;
}
