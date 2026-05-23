import { NextResponse } from "next/server";

import { recommendCampaignChannels, topRecommendedChannelIds } from "@/features/campaigns/recommendations";
import { assessVehicleReadiness } from "@/features/inventory/readiness";

type RecommendationPayload = {
  vehicle?: Record<string, unknown>;
  limit?: number;
};

export async function POST(request: Request) {
  let payload: RecommendationPayload;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON payload." }, { status: 400 });
  }

  if (!payload.vehicle) {
    return NextResponse.json({ ok: false, error: "A vehicle is required." }, { status: 400 });
  }

  const readiness = assessVehicleReadiness(payload.vehicle);
  const recommendations = recommendCampaignChannels(payload.vehicle, readiness);
  const selectedChannelIds = topRecommendedChannelIds(payload.vehicle, readiness, payload.limit || 7);

  return NextResponse.json({
    ok: true,
    readiness,
    selectedChannelIds,
    recommendations,
  });
}
