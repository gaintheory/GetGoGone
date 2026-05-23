import { NextResponse } from "next/server";

import { mapSourceVehicleToPrototypeVehicle } from "@/features/inventory/prototype-adapter";
import { getLocalVehicleImageMap } from "@/features/inventory/local-images";
import { assessVehicleReadiness } from "@/features/inventory/readiness";
import { topRecommendedChannelIds } from "@/features/campaigns/recommendations";
import type { Tables } from "@/lib/database.types";
import { getSupabaseAdmin } from "@/lib/supabase/server";

type VehicleRow = Tables<"vehicles">;

const palettes: Record<string, string[]> = {
  sedan: ["#64748b", "#334155", "#cbd5e1"],
  truck: ["#1e293b", "#0f172a", "#cbd5e1"],
  suv: ["#0f766e", "#0f172a", "#cbd5e1"],
  van: ["#475569", "#1e293b", "#cbd5e1"],
};

function normalizeBody(body?: string | null): string {
  const value = (body || "").toLowerCase();
  if (value.includes("truck") || value.includes("pickup")) return "truck";
  if (value.includes("suv") || value.includes("utility")) return "suv";
  if (value.includes("van")) return "van";
  return "sedan";
}

function mapVehicleRow(row: VehicleRow) {
  const body = normalizeBody(row.body_style);
  const imageUrl = getLocalVehicleImageMap().get(row.vin.toUpperCase()) || null;

  return {
    id: row.id,
    stock: row.stock_number || row.source_record_id || "INV",
    year: row.year || "",
    make: row.make || "Unknown",
    model: row.model || "Vehicle",
    trim: row.trim || "",
    body,
    price: row.price || 0,
    down: row.down_payment || 0,
    mileage: row.mileage || 0,
    vin: row.vin,
    photos: imageUrl ? 1 : 0,
    imageUrl,
    sourceUrl: row.source_url,
    status: row.status,
    campaign: "Draft",
    palette: palettes[body],
    sourceSystem: row.source_system || "getgogone_vehicles",
    sourceRecordId: row.source_record_id,
  };
}

function vehicleName(vehicle: { year?: string | number; make?: string; model?: string; trim?: string }) {
  return [vehicle.year, vehicle.make, vehicle.model, vehicle.trim].filter(Boolean).join(" ");
}

function priorityRank(priority: string) {
  if (priority === "high") return 0;
  if (priority === "medium") return 1;
  return 2;
}

function titleCase(value: string) {
  return String(value || "").replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

async function firstDealershipId(supabase: NonNullable<ReturnType<typeof getSupabaseAdmin>>) {
  const { data, error } = await supabase
    .from("dealerships")
    .select("id")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data?.id || null;
}

async function loadVehicles(
  supabase: NonNullable<ReturnType<typeof getSupabaseAdmin>>,
  clientId: string | null,
) {
  const defaultClientId = await firstDealershipId(supabase);

  if (!clientId || clientId === defaultClientId) {
    const { data, error } = await supabase
      .from("inspection_vehicle_source")
      .select("*")
      .order("source_updated_at", { ascending: false, nullsFirst: false });

    if (error) throw error;
    return {
      defaultClientId,
      vehicles: (data || []).map(mapSourceVehicleToPrototypeVehicle),
    };
  }

  const { data, error } = await supabase
    .from("vehicles")
    .select("*")
    .eq("dealership_id", clientId)
    .neq("status", "archived")
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return {
    defaultClientId,
    vehicles: (data || []).map(mapVehicleRow),
  };
}

export async function GET(request: Request) {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return NextResponse.json(
      { ok: false, items: [], metrics: {}, error: "Supabase environment variables are not configured." },
      { status: 500 },
    );
  }

  const clientId = new URL(request.url).searchParams.get("clientId");

  try {
    const { vehicles } = await loadVehicles(supabase, clientId);

    let campaignQuery = supabase
      .from("campaigns")
      .select(`
        id,
        name,
        status,
        language,
        goal,
        created_at,
        updated_at,
        vehicle:vehicles (
          id,
          vin,
          year,
          make,
          model,
          trim
        )
      `)
      .order("updated_at", { ascending: false })
      .limit(100);

    if (clientId) campaignQuery = campaignQuery.eq("dealership_id", clientId);
    const { data: campaigns, error: campaignError } = await campaignQuery;
    if (campaignError) throw campaignError;

    let creativeQuery = supabase
      .from("creative_templates")
      .select("id, name, category, canvas_json, created_at, updated_at")
      .eq("category", "saved_creative")
      .order("updated_at", { ascending: false })
      .limit(100);

    if (clientId) creativeQuery = creativeQuery.eq("dealership_id", clientId);
    const { data: creatives, error: creativeError } = await creativeQuery;
    if (creativeError) throw creativeError;

    const campaignVinSet = new Set(
      (campaigns || []).map((campaign) => campaign.vehicle?.vin).filter(Boolean),
    );
    const spanishVinSet = new Set(
      (campaigns || [])
        .filter((campaign) => campaign.language === "es" || campaign.language === "both")
        .map((campaign) => campaign.vehicle?.vin)
        .filter(Boolean),
    );
    const creativeVinSet = new Set(
      (creatives || [])
        .map((creative) => {
          const canvas = creative.canvas_json as { vehicle?: { vin?: string } } | null;
          return canvas?.vehicle?.vin;
        })
        .filter(Boolean),
    );

    const items = [];
    const readinessScores = [];

    for (const vehicle of vehicles) {
      const readiness = assessVehicleReadiness(vehicle, {
        hasCampaign: Boolean(vehicle.vin && campaignVinSet.has(vehicle.vin)),
        hasSpanishCampaign: Boolean(vehicle.vin && spanishVinSet.has(vehicle.vin)),
        hasCreative: Boolean(vehicle.vin && creativeVinSet.has(vehicle.vin)),
      });
      readinessScores.push(readiness.score);
      const name = vehicleName(vehicle);
      const base = {
        clientId,
        targetType: "vehicle",
        targetId: vehicle.id,
        targetVin: vehicle.vin || null,
        targetLabel: name || vehicle.vin || "Vehicle",
        vehicle,
        readiness,
      };

      const issueMap = new Map(readiness.issues.map((issue) => [issue.id, issue]));

      if (issueMap.has("missing_down")) {
        const issue = issueMap.get("missing_down");
        items.push({
          ...base,
          id: `missing-offer-${vehicle.id}`,
          type: "missing_offer",
          priority: "high",
          title: issue?.label || "Missing approved down payment",
          reason: issue?.agentAction || "Offer fields need review before strong finance-focused campaigns.",
          action: "Open vehicle",
          nextRoute: "vehicle",
        });
      }

      if (issueMap.has("missing_photo")) {
        const issue = issueMap.get("missing_photo");
        items.push({
          ...base,
          id: `missing-photo-${vehicle.id}`,
          type: "missing_photo",
          priority: "high",
          title: issue?.label || "Missing usable vehicle photo",
          reason: issue?.agentAction || "Creative and listing packages need at least one approved photo.",
          action: "Open Designer",
          nextRoute: "designer",
        });
      }

      if (issueMap.has("missing_campaign")) {
        const issue = issueMap.get("missing_campaign");
        const recommendedChannelIds = topRecommendedChannelIds(vehicle, readiness);
        items.push({
          ...base,
          id: `first-campaign-${vehicle.id}`,
          type: "first_campaign",
          priority: "medium",
          title: issue?.label || "No saved campaign package",
          reason: recommendedChannelIds.length
            ? `Recommended package: ${recommendedChannelIds.map(titleCase).join(", ")}.`
            : issue?.agentAction || "This vehicle needs a channel-specific campaign bundle.",
          action: "Build recommended package",
          nextRoute: "packageBuilder",
          recommendedChannelIds,
        });
      }

      if (issueMap.has("missing_spanish")) {
        const issue = issueMap.get("missing_spanish");
        const recommendedChannelIds = topRecommendedChannelIds(vehicle, readiness);
        items.push({
          ...base,
          id: `spanish-missing-${vehicle.id}`,
          type: "spanish_missing",
          priority: "medium",
          title: issue?.label || "No Spanish campaign found",
          reason: issue?.agentAction || "Spanish copy is a core requirement for this dealership's buyers.",
          action: "Build bilingual package",
          nextRoute: "packageBuilder",
          recommendedChannelIds,
        });
      }

      if (issueMap.has("missing_creative")) {
        const issue = issueMap.get("missing_creative");
        items.push({
          ...base,
          id: `creative-missing-${vehicle.id}`,
          type: "creative_missing",
          priority: "low",
          title: issue?.label || "No saved creative version",
          reason: issue?.agentAction || "Create at least one reusable visual asset for this vehicle.",
          action: "Open Designer",
          nextRoute: "designer",
        });
      }
    }

    for (const campaign of campaigns || []) {
      if (campaign.status === "draft") {
        items.push({
          id: `campaign-review-${campaign.id}`,
          clientId,
          type: "campaign_review",
          priority: "high",
          targetType: "campaign",
          targetId: campaign.id,
          targetVin: campaign.vehicle?.vin || null,
          targetLabel: campaign.name,
          title: "Campaign draft needs review",
          reason: "Review channel copy, setup fields, and export package.",
          action: "Review campaign",
          nextRoute: "campaignReview",
          campaign,
        });
      }
    }

    const sortedItems = items
      .sort((a, b) => priorityRank(a.priority) - priorityRank(b.priority))
      .slice(0, 80);

    return NextResponse.json({
      ok: true,
      metrics: {
        vehicles: vehicles.length,
        readinessAverage: readinessScores.length
          ? Math.round(readinessScores.reduce((sum, score) => sum + score, 0) / readinessScores.length)
          : 0,
        marketReady: readinessScores.filter((score) => score >= 85).length,
        campaigns: campaigns?.length || 0,
        savedCreatives: creatives?.length || 0,
        highPriority: sortedItems.filter((item) => item.priority === "high").length,
        mediumPriority: sortedItems.filter((item) => item.priority === "medium").length,
        lowPriority: sortedItems.filter((item) => item.priority === "low").length,
      },
      items: sortedItems,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to build cockpit queue.";
    return NextResponse.json({ ok: false, items: [], metrics: {}, error: message }, { status: 500 });
  }
}
