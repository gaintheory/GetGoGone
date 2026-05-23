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
    body = {}; // Fallback to handle mock triggers
  }

  const { webhookSecret, vehicleData } = body;
  let dealershipId = body.dealershipId;

  if (!dealershipId) {
    dealershipId = await getFirstDealershipId(supabase);
    if (!dealershipId) {
      return NextResponse.json(
        { error: "No dealership found. Ingestion cannot proceed." },
        { status: 400 }
      );
    }
  }

  // High-fidelity mock vehicle data for CarsForSale webhook simulator in testing environments
  const defaultMockVehicle = {
    vin: "1C4HJXEG8KW182918",
    stockNumber: "CFS-9811",
    year: 2019,
    make: "Jeep",
    model: "Wrangler",
    trim: "Unlimited Rubicon",
    bodyStyle: "SUV",
    mileage: 42100,
    price: 36995,
    downPayment: 3500,
    sourceUrl: "https://www.carfax.com/VehicleHistory/report?vin=1C4HJXEG8KW182918",
    description: "Stunning Jeep Wrangler Rubicon 4x4. Clean history report. Upgraded wheel package. Trail rated ready!",
  };

  const incomingVehicle = vehicleData || defaultMockVehicle;

  try {
    console.log("[Webhook Ingestion] Normalizing incoming stock record...");
    const record: VehicleImportRecord = {
      sourceSystem: "carsforsale_api",
      sourceId: incomingVehicle.stockNumber || incomingVehicle.vin,
      sourceFetchedAt: new Date().toISOString(),
      sourceUrl: incomingVehicle.sourceUrl || null,
      rawData: incomingVehicle,
      vin: incomingVehicle.vin?.trim().toUpperCase(),
      stockNumber: incomingVehicle.stockNumber?.trim(),
      year: incomingVehicle.year,
      make: incomingVehicle.make?.trim(),
      model: incomingVehicle.model?.trim(),
      trim: incomingVehicle.trim?.trim(),
      bodyStyle: incomingVehicle.bodyStyle?.trim(),
      mileage: incomingVehicle.mileage,
      price: incomingVehicle.price,
      downPayment: incomingVehicle.downPayment,
      description: incomingVehicle.description?.trim(),
      photos: [],
    };

    console.log("[Webhook Ingestion] Launching ingestion pipeline...");
    const pipelineResult = await runImportPipeline([record], dealershipId, "carsforsale_api", {
      overwriteExisting: body.overwriteExisting ?? false,
      skipVinEnrichment: true,
    });

    // Write a system-level log into the audit_log
    const client = supabase as any;
    await client.from("audit_log").insert({
      dealership_id: dealershipId,
      action: "webhook_sync",
      entity_type: "inventory_sync",
      entity_id: incomingVehicle.vin,
      metadata: {
        source: "carsforsale",
        syncType: "realtime_webhook",
        vehicleName: `${incomingVehicle.year} ${incomingVehicle.make} ${incomingVehicle.model}`,
        timestamp: new Date().toISOString(),
      }
    });

    return NextResponse.json({
      ok: true,
      webhookReceived: true,
      message: "Webhook processed successfully",
      vehicleSync: {
        vin: incomingVehicle.vin,
        name: `${incomingVehicle.year} ${incomingVehicle.make} ${incomingVehicle.model}`,
        pipelineResult,
      }
    });

  } catch (err) {
    console.error("[Webhook Ingestion] Ingest transaction failed:", err);
    return NextResponse.json(
      { error: `Webhook ingest failed: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 }
    );
  }
}
