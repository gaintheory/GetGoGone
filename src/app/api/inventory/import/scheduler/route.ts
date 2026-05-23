import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { runImportPipeline } from "@/features/inventory/intake/pipeline";
import type { VehicleImportRecord } from "@/features/inventory/intake/types";

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
    body = {};
  }

  let dealershipId = body.dealershipId;
  if (!dealershipId) {
    dealershipId = await getFirstDealershipId(supabase);
    if (!dealershipId) {
      return NextResponse.json(
        { error: "No dealership found. Polling cancelled." },
        { status: 400 }
      );
    }
  }

  // Simulated CarsForSale inventory polling stock arrivals
  const mockSchedulerVehicles = [
    {
      vin: "1FM5K8GC8LGB78291",
      stockNumber: "CFS-2021",
      year: 2020,
      make: "Ford",
      model: "Explorer",
      trim: "XLT",
      bodyStyle: "SUV",
      mileage: 38400,
      price: 28995,
      downPayment: 2500,
      sourceUrl: "https://www.carfax.com/VehicleHistory/report?vin=1FM5K8GC8LGB78291",
      description: "Clean Ford Explorer XLT. Perfect family size, backup camera, third row stow options.",
    },
    {
      vin: "4T1BF1FK1KU928192",
      stockNumber: "CFS-1928",
      year: 2019,
      make: "Toyota",
      model: "RAV4",
      trim: "LE",
      bodyStyle: "SUV",
      mileage: 48900,
      price: 21995,
      downPayment: 2000,
      sourceUrl: "https://www.carfax.com/VehicleHistory/report?vin=4T1BF1FK1KU928192",
      description: "Excellent fuel efficiency RAV4 LE. Active cruise control, line departure warnings.",
    }
  ];

  try {
    console.log("[Inbound Scheduler] Simulating FTP server lookup and CarsForSale data polling...");
    // Simulate background network polling delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const records: VehicleImportRecord[] = mockSchedulerVehicles.map(v => ({
      sourceSystem: "carsforsale_api",
      sourceId: v.stockNumber,
      sourceFetchedAt: new Date().toISOString(),
      sourceUrl: v.sourceUrl,
      rawData: v,
      vin: v.vin,
      stockNumber: v.stockNumber,
      year: v.year,
      make: v.make,
      model: v.model,
      trim: v.trim,
      bodyStyle: v.bodyStyle,
      mileage: v.mileage,
      price: v.price,
      downPayment: v.downPayment,
      description: v.description,
      photos: [],
    }));

    console.log("[Inbound Scheduler] Running import pipeline for polled stock...");
    const pipelineResult = await runImportPipeline(records, dealershipId, "carsforsale_api", {
      overwriteExisting: true,
      skipVinEnrichment: true,
    });

    const client = supabase as any;

    // Log the polling run inside our audit_log
    await client.from("audit_log").insert({
      dealership_id: dealershipId,
      action: "scheduled_polling_sync",
      entity_type: "inventory_sync",
      entity_id: "CFS-CRON",
      metadata: {
        source: "carsforsale_ftp",
        schedulerInterval: body.interval || "12h",
        importedCount: mockSchedulerVehicles.length,
        timestamp: new Date().toISOString(),
      }
    });

    console.log("[Inbound Scheduler] Automatically staging Watcher proposals in the Cockpit queue...");
    const nextDateStr = new Date().toISOString().split("T")[0];
    
    // Query freshly upserted vehicles to obtain their actual UUIDs
    const { data: dbVehicles } = await client
      .from("vehicles")
      .select("id, vin, year, make, model")
      .eq("dealership_id", dealershipId)
      .in("vin", mockSchedulerVehicles.map(v => v.vin));

    if (dbVehicles?.length) {
      const proposalsToCreate = dbVehicles.map((vehicle: any) => ({
        dealership_id: dealershipId,
        source_key: `watcher:${vehicle.id}:${nextDateStr}`,
        agent_type: "watcher",
        target_type: "vehicle",
        target_id: String(vehicle.id),
        proposal_type: "campaign_generation",
        title: `Fresh Intake: Propose ${vehicle.year} ${vehicle.make} campaign`,
        reasoning: `Polled stock intake has landed. Vehicle history report is attached (${vehicle.vin}). Proposing high-intent Craigslist & GBP package overlays.`,
        proposed_payload: { vehicleId: vehicle.id, vehicleName: `${vehicle.year} ${vehicle.make} ${vehicle.model}` },
        risk_level: "low",
        status: "pending",
        updated_at: new Date().toISOString(),
      }));

      await client
        .from("agent_proposals")
        .upsert(proposalsToCreate, { onConflict: "dealership_id,source_key", ignoreDuplicates: true });
    }

    return NextResponse.json({
      ok: true,
      polled: true,
      scannedCount: mockSchedulerVehicles.length,
      pipelineResult,
      timestamp: new Date().toISOString(),
    });

  } catch (err) {
    console.error("[Inbound Scheduler] Polling run failed:", err);
    return NextResponse.json(
      { error: `Scheduler polling run failed: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 }
    );
  }
}
