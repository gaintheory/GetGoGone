import { NextResponse } from "next/server";
import Papa from "papaparse";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { parseInventoryCsv, autoDetectCsvMapping } from "@/features/inventory/intake/adapters/csv";
import { runImportPipeline } from "@/features/inventory/intake/pipeline";

async function getFirstDealershipId(supabase: any): Promise<string | null> {
  const { data, error } = await supabase
    .from("dealerships")
    .select("id")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) return null;
  return data?.id || null;
}

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
    return NextResponse.json({ error: "Invalid JSON request body." }, { status: 400 });
  }

  const { csvText, fieldMapping, overwriteExisting, dryRun } = body;
  let dealershipId = body.dealershipId;

  if (!csvText || typeof csvText !== "string") {
    return NextResponse.json({ error: "Missing required string property: csvText." }, { status: 400 });
  }

  // ─── Mode 1: Mapping Analysis & Suggestion (Field Mapping is absent) ───────
  if (!fieldMapping) {
    try {
      const parsed = Papa.parse(csvText, {
        header: true,
        skipEmptyLines: "greedy",
      });

      if (parsed.errors.length > 0 && parsed.data.length === 0) {
        throw new Error(parsed.errors[0].message);
      }

      const headers = parsed.meta.fields || [];
      const suggestedMapping = autoDetectCsvMapping(headers);
      const previewRows = parsed.data.slice(0, 3); // Return first 3 rows for UI previewing

      return NextResponse.json({
        ok: true,
        analysisComplete: true,
        headers,
        suggestedMapping,
        previewRows,
        totalRecordsDetected: parsed.data.length,
      });
    } catch (err) {
      return NextResponse.json(
        { error: `Failed to analyze CSV structure: ${err instanceof Error ? err.message : String(err)}` },
        { status: 400 }
      );
    }
  }

  // ─── Mode 2: Execution (Field Mapping is present) ──────────────────────────
  if (!dealershipId) {
    dealershipId = await getFirstDealershipId(supabase);
    if (!dealershipId) {
      return NextResponse.json(
        { error: "No dealership found in the database. Please create one first." },
        { status: 400 }
      );
    }
  }

  try {
    console.log("Parsing CSV inventory rows using mapped columns...");
    const records = parseInventoryCsv(csvText, {
      fieldMapping,
      fetchedAt: new Date().toISOString(),
    });

    if (records.length === 0) {
      return NextResponse.json({ error: "No records found after mapping parsing." }, { status: 400 });
    }

    console.log(`Executing import pipeline for ${records.length} CSV records...`);
    const pipelineResult = await runImportPipeline(records, dealershipId, "csv", {
      dryRun: !!dryRun,
      overwriteExisting: !!overwriteExisting,
    });

    // Save mapping to dealership's metadata so we remember it next time!
    if (!dryRun) {
      try {
        const client = supabase as any;
        
        // Fetch current metadata
        const { data: current } = await client
          .from("dealerships")
          .select("brand_colors") // we can save it under metadata or extra columns, or brand_colors if generic is needed. 
          // Wait, dealerships has a jsonb metadata field or brand_colors. Let's look at dealerships columns:
          // dealerships has: brand_colors jsonb.
          // Wait, we can also use custom column adjustments, or just skip writing to DB if no metadata column exists, or check other options.
          // In dealerships table definition:
          // create table if not exists public.dealerships (
          //   id uuid primary key default gen_random_uuid(),
          //   name text not null,
          //   ...,
          //   brand_colors jsonb not null default '[]'::jsonb
          // )
          // Wait! In decisions: "Per-client custom mapping saved to dealerships.metadata.csv_field_map" - but dealerships does not have a "metadata" column!
          // So let's check if there is an integrations table!
          // In getgogone_core.sql:
          // create table if not exists public.integrations (
          //   id uuid primary key default gen_random_uuid(),
          //   dealership_id uuid not null references public.dealerships(id) on delete cascade,
          //   provider text not null,
          //   status text not null default 'disconnected',
          //   settings jsonb not null default '{}'::jsonb,
          //   unique (dealership_id, provider)
          // )
          // Ah! The `integrations` table is PERFECT! We can upsert an integration with provider = 'csv_import' and store the fieldMapping inside settings!
          // This is a beautiful and 100% correct relational design that keeps the core dealerships table clean!
          await client
            .from("integrations")
            .upsert({
              dealership_id: dealershipId,
              provider: "csv_import",
              status: "connected",
              settings: { fieldMapping },
              last_sync_at: new Date().toISOString(),
            }, { onConflict: "dealership_id, provider" });
      } catch (dbErr) {
        console.error("Failed to save custom CSV mapping to database:", dbErr);
      }
    }

    return NextResponse.json({
      success: true,
      pipelineResult,
    });

  } catch (err) {
    console.error("CSV import pipeline failed:", err);
    return NextResponse.json(
      { error: `CSV import failed: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 }
    );
  }
}

// Add GET route to fetch the saved CSV mapping for the active client!
export async function GET(request: Request) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase client offline." }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  let dealershipId = searchParams.get("clientId");

  if (!dealershipId) {
    dealershipId = await getFirstDealershipId(supabase);
    if (!dealershipId) return NextResponse.json({ mapping: null });
  }

  try {
    const client = supabase as any;
    const { data } = await client
      .from("integrations")
      .select("settings")
      .eq("dealership_id", dealershipId)
      .eq("provider", "csv_import")
      .maybeSingle();

    return NextResponse.json({
      mapping: data?.settings?.fieldMapping || null,
    });
  } catch {
    return NextResponse.json({ mapping: null });
  }
}
