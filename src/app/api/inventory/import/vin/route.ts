import { NextResponse } from "next/server";
import { enrichFromVin, isValidVin, normalizeVin } from "@/features/inventory/intake/vin-decode";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const vin = searchParams.get("vin");

  if (!vin) {
    return NextResponse.json({ error: "Missing required query parameter: vin." }, { status: 400 });
  }

  const cleanVin = normalizeVin(vin);
  if (!isValidVin(cleanVin)) {
    return NextResponse.json(
      { error: `VIN "${vin}" is not a valid 17-character VIN.` },
      { status: 400 }
    );
  }

  try {
    console.log(`Decoding VIN for manual prefill: ${cleanVin}...`);
    
    // Enrich a blank record of source type "vin_decode"
    const enriched = await enrichFromVin({
      sourceSystem: "vin_decode",
      vin: cleanVin,
    });

    if (!enriched.vinDecoded) {
      return NextResponse.json(
        { error: "NHTSA was unable to decode this VIN. You can still enter details manually." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      specs: {
        vin: enriched.vin,
        year: enriched.year,
        make: enriched.make,
        model: enriched.model,
        trim: enriched.trim,
        bodyStyle: enriched.bodyStyle,
        engine: enriched.engine,
        transmission: enriched.transmission,
        drivetrain: enriched.drivetrain,
        fuelType: enriched.fuelType,
      },
    });

  } catch (err) {
    console.error("VIN decode API failed:", err);
    return NextResponse.json(
      { error: "Failed to communicate with the NHTSA decoding API. Please enter details manually." },
      { status: 500 }
    );
  }
}
