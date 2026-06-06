import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { resolveDealershipId } from "@/lib/dealerships";
import { parseZipKit, cleanupZipKitTempDir } from "@/features/inventory/intake/adapters/zip-kit";
import { runImportPipeline } from "@/features/inventory/intake/pipeline";
import type { VehicleImportRecord } from "@/features/inventory/intake/types";

export async function POST(request: Request) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase admin client unavailable — check environment variables." },
      { status: 500 }
    );
  }

  let body: any = {};
  try {
    body = await request.json();
  } catch {
    // Fallback if empty body
  }

  // 1. Resolve parameters
  let rawPath = (body.folderPath || "").replace(/^"|"$/g, "").trim();
  const folderPath = rawPath ? path.resolve(rawPath) : path.resolve("Inventory");
  let dealershipId = body.dealershipId;
  const overwriteExisting = !!body.overwriteExisting;
  const dryRun = !!body.dryRun;

  // If no dealershipId, use the first one in the database
  if (!dealershipId) {
    dealershipId = await resolveDealershipId(supabase);
    if (!dealershipId) {
      return NextResponse.json(
        { error: "No dealership found in the database. Please create a dealership first." },
        { status: 400 }
      );
    }
  }

  try {
    // 2. Scan the directory for ZIP files
    const stats = await fs.stat(folderPath).catch(() => null);
    if (!stats || !stats.isDirectory()) {
      return NextResponse.json(
        { error: `Inventory folder not found at path: ${folderPath}` },
        { status: 404 }
      );
    }

    const files = await fs.readdir(folderPath);
    const zipFiles = files.filter(f => f.toLowerCase().endsWith(".zip"));

    if (zipFiles.length === 0) {
      return NextResponse.json(
        { error: `No ZIP files found in the folder: ${folderPath}` },
        { status: 400 }
      );
    }

    console.log(`Starting bulk import of ${zipFiles.length} ZIP files from ${folderPath}...`);

    const records: VehicleImportRecord[] = [];
    const tempDirs: string[] = [];
    const parseErrors: { filename: string; error: string }[] = [];

    // 3. Parse each ZIP kit
    for (const zipFile of zipFiles) {
      const zipPath = path.join(folderPath, zipFile);
      try {
        const { record, tempDir } = await parseZipKit(zipPath);
        records.push(record);
        tempDirs.push(tempDir);
      } catch (err) {
        console.error(`Failed to parse ZIP: ${zipFile}`, err);
        parseErrors.push({
          filename: zipFile,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    if (records.length === 0) {
      return NextResponse.json(
        {
          error: "Failed to parse any ZIP kits from the folder.",
          parseErrors,
        },
        { status: 400 }
      );
    }

    // 4. Execute the pipeline
    console.log(`Running import pipeline for ${records.length} records...`);
    const pipelineResult = await runImportPipeline(records, dealershipId, "zip_kit", {
      dryRun,
      overwriteExisting,
    });

    // 5. Cleanup temporary extraction directories
    console.log("Cleaning up temporary extraction folders...");
    await Promise.all(tempDirs.map(dir => cleanupZipKitTempDir(dir)));

    // 6. Return response
    return NextResponse.json({
      success: true,
      parseErrors: parseErrors.length > 0 ? parseErrors : undefined,
      pipelineResult,
    });

  } catch (err) {
    console.error("Bulk ZIP import failed:", err);
    return NextResponse.json(
      { error: `Bulk ZIP import failed: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 }
    );
  }
}
