import { NextResponse } from "next/server";

import { assessVehicleReadiness } from "@/features/inventory/readiness";

type ReadinessPayload = {
  vehicle?: Record<string, unknown>;
  vehicles?: Record<string, unknown>[];
  context?: {
    hasCampaign?: boolean;
    hasSpanishCampaign?: boolean;
    hasCreative?: boolean;
  };
};

export async function POST(request: Request) {
  let payload: ReadinessPayload;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON payload." }, { status: 400 });
  }

  const vehicles = payload.vehicles || (payload.vehicle ? [payload.vehicle] : []);

  if (!vehicles.length) {
    return NextResponse.json({ ok: false, error: "A vehicle or vehicles array is required." }, { status: 400 });
  }

  const results = vehicles.map((vehicle) => ({
    vehicleId: String(vehicle.id || vehicle.vin || ""),
    vin: vehicle.vin || null,
    readiness: assessVehicleReadiness(vehicle, payload.context || {}),
  }));

  return NextResponse.json({
    ok: true,
    results,
    summary: {
      total: results.length,
      ready: results.filter((item) => item.readiness.status === "ready").length,
      needsWork: results.filter((item) => item.readiness.status === "needs_work").length,
      blocked: results.filter((item) => item.readiness.status === "blocked").length,
      averageScore: Math.round(results.reduce((sum, item) => sum + item.readiness.score, 0) / results.length),
    },
  });
}
