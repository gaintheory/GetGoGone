import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { resolveDealershipId } from "@/lib/dealerships";
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
    return NextResponse.json({ error: "Invalid JSON request body." }, { status: 400 });
  }

  const { vehicle } = body;
  let dealershipId = body.dealershipId;

  if (!vehicle) {
    return NextResponse.json({ error: "Missing required property: vehicle." }, { status: 400 });
  }

  if (!dealershipId) {
    dealershipId = await resolveDealershipId(supabase);
    if (!dealershipId) {
      return NextResponse.json(
        { error: "No dealership found in the database. Please create one first." },
        { status: 400 }
      );
    }
  }

  try {
    console.log("Preparing manual vehicle import record...");
    
    // Normalize fields
    const record: VehicleImportRecord = {
      sourceSystem: "manual",
      sourceId: vehicle.stockNumber || vehicle.vin,
      sourceFetchedAt: new Date().toISOString(),
      sourceUrl: vehicle.sourceUrl || null,
      rawData: vehicle,

      vin: vehicle.vin ? vehicle.vin.trim().toUpperCase() : undefined,
      stockNumber: vehicle.stockNumber ? vehicle.stockNumber.trim() : undefined,
      
      year: vehicle.year ? parseInt(vehicle.year, 10) : undefined,
      make: vehicle.make?.trim(),
      model: vehicle.model?.trim(),
      trim: vehicle.trim?.trim(),
      bodyStyle: vehicle.bodyStyle?.trim(),
      mileage: vehicle.mileage ? parseInt(vehicle.mileage, 10) : undefined,
      exteriorColor: vehicle.exteriorColor?.trim(),
      interiorColor: vehicle.interiorColor?.trim(),
      fuelType: vehicle.fuelType?.trim(),
      transmission: vehicle.transmission?.trim(),
      drivetrain: vehicle.drivetrain?.trim(),
      engine: vehicle.engine?.trim(),
      
      price: vehicle.price ? parseFloat(vehicle.price) : undefined,
      downPayment: vehicle.downPayment ? parseFloat(vehicle.downPayment) : undefined,
      
      description: vehicle.description?.trim(),
      photos: [], // Manual form handles photos via file uploads later if needed
    };

    console.log("Running manual import pipeline...");
    const pipelineResult = await runImportPipeline([record], dealershipId, "manual", {
      overwriteExisting: true, // Always overwrite when doing a manual add/edit
      skipVinEnrichment: true, // They already decoded it, no need to query NHTSA again
    });

    return NextResponse.json({
      success: true,
      pipelineResult,
    });

  } catch (err) {
    console.error("Manual vehicle import failed:", err);
    return NextResponse.json(
      { error: `Manual import failed: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 }
    );
  }
}
