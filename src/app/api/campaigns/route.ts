import { NextResponse } from "next/server";

import type { Json, TablesInsert, TablesUpdate } from "@/lib/database.types";
import { getSupabaseAdmin } from "@/lib/supabase/server";

type CampaignChannelPayload = {
  id: string;
  name?: string;
  category?: string;
  headline?: string;
  primaryText?: string;
  description?: string;
  callToAction?: string;
  setupFields?: string[];
  generatedOutputs?: string[];
  creativeFormats?: string[];
  publishingMethod?: string;
  complianceNotes?: string[];
};

type CampaignSavePayload = {
  clientId?: string;
  vehicle?: {
    id?: string;
    vin?: string;
    stock?: string;
    year?: number | string;
    make?: string;
    model?: string;
    trim?: string;
    body?: string;
    color?: string;
    mileage?: number | string;
    price?: number | string;
    down?: number | string;
    notes?: string;
    sourceSystem?: string;
    sourceRecordId?: string | number | null;
    imageUrl?: string | null;
  };
  name?: string;
  goal?: string;
  language?: string;
  status?: string;
  channels?: CampaignChannelPayload[];
};

type CampaignPatchPayload = {
  channelId?: string;
  headline?: string | null;
  primaryText?: string | null;
  description?: string | null;
  callToAction?: string | null;
  destinationUrl?: string | null;
  publishedUrl?: string | null;
  platformPayload?: Record<string, unknown>;
  status?: string;
};

function campaignSelect() {
  return `
    id,
    name,
    campaign_type,
    goal,
    status,
    language,
    audience_type,
    budget,
    created_at,
    updated_at,
    vehicle:vehicles (
      id,
      vin,
      stock_number,
      year,
      make,
      model,
      trim,
      mileage,
      price,
      down_payment,
      exterior_color,
      body_style
    ),
    channels:campaign_channels (
      id,
      campaign_id,
      channel,
      status,
      headline,
      primary_text,
      description,
      call_to_action,
      destination_url,
      published_url,
      platform_payload,
      created_at,
      updated_at
    ),
    assets:campaign_assets (
      id,
      campaign_id,
      campaign_channel_id,
      asset_type,
      format,
      file_url,
      storage_path,
      template_id,
      metadata,
      created_at
    )
  `;
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value.replace(/[^0-9.-]/g, ""));
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function asYear(value: unknown): number | null {
  const year = asNumber(value);
  return year && year > 1900 ? Math.trunc(year) : null;
}

async function ensureDealership(
  supabase: NonNullable<ReturnType<typeof getSupabaseAdmin>>,
  clientId?: string | null,
) {
  if (clientId) {
    const { data: client, error: clientError } = await supabase
      .from("dealerships")
      .select("id")
      .eq("id", clientId)
      .maybeSingle();

    if (clientError) throw clientError;
    if (client?.id) return client.id;
  }

  const { data: existing, error: selectError } = await supabase
    .from("dealerships")
    .select("id")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (selectError) throw selectError;
  if (existing?.id) return existing.id;

  const { data: created, error: insertError } = await supabase
    .from("dealerships")
    .insert({
      name: process.env.GETGOGONE_DEFAULT_DEALERSHIP_NAME || "Right Price Auto Sales",
    })
    .select("id")
    .single();

  if (insertError) throw insertError;
  return created.id;
}

async function upsertVehicle(
  supabase: NonNullable<ReturnType<typeof getSupabaseAdmin>>,
  dealershipId: string,
  vehicle: CampaignSavePayload["vehicle"],
) {
  const vin = vehicle?.vin?.trim();
  if (!vin) return null;

  const row: TablesInsert<"vehicles"> = {
    dealership_id: dealershipId,
    vin,
    stock_number: vehicle?.stock || null,
    year: asYear(vehicle?.year),
    make: vehicle?.make || null,
    model: vehicle?.model || null,
    trim: vehicle?.trim || null,
    body_style: vehicle?.body || null,
    exterior_color: vehicle?.color || null,
    mileage: asNumber(vehicle?.mileage),
    price: asNumber(vehicle?.price),
    down_payment: asNumber(vehicle?.down),
    description: vehicle?.notes || null,
    source_system: vehicle?.sourceSystem || "getgogone_campaign_builder",
    source_record_id: vehicle?.sourceRecordId ? String(vehicle.sourceRecordId) : vehicle?.id || null,
    status: "active",
    last_synced_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("vehicles")
    .upsert(row, { onConflict: "dealership_id,vin" })
    .select("id")
    .single();

  if (error) throw error;
  return data.id;
}

export async function POST(request: Request) {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return NextResponse.json(
      { ok: false, error: "Supabase environment variables are not configured." },
      { status: 500 },
    );
  }

  let payload: CampaignSavePayload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON payload." }, { status: 400 });
  }

  if (!payload.vehicle) {
    return NextResponse.json({ ok: false, error: "A vehicle is required." }, { status: 400 });
  }

  if (!payload.channels?.length) {
    return NextResponse.json(
      { ok: false, error: "At least one campaign channel is required." },
      { status: 400 },
    );
  }

  try {
    const dealershipId = await ensureDealership(supabase, payload.clientId);
    const vehicleId = await upsertVehicle(supabase, dealershipId, payload.vehicle);
    const vehicleName = [
      payload.vehicle.year,
      payload.vehicle.make,
      payload.vehicle.model,
    ].filter(Boolean).join(" ");

    const { data: campaign, error: campaignError } = await supabase
      .from("campaigns")
      .insert({
        dealership_id: dealershipId,
        vehicle_id: vehicleId,
        name: payload.name || `${vehicleName || "Vehicle"} campaign`,
        campaign_type: "channel_builder",
        goal: payload.goal || null,
        language: payload.language || "en",
        status: payload.status || "draft",
        audience_type: "vehicle_campaign",
      })
      .select("id, name, status")
      .single();

    if (campaignError) throw campaignError;

    const channelRows: TablesInsert<"campaign_channels">[] = payload.channels.map((channel) => ({
      campaign_id: campaign.id,
      channel: channel.id,
      headline: channel.headline || null,
      primary_text: channel.primaryText || null,
      description: channel.description || null,
      call_to_action: channel.callToAction || null,
      status: "draft",
      platform_payload: {
        moduleName: channel.name || channel.id,
        category: channel.category || null,
        setupFields: channel.setupFields || [],
        generatedOutputs: channel.generatedOutputs || [],
        creativeFormats: channel.creativeFormats || [],
        publishingMethod: channel.publishingMethod || null,
        complianceNotes: channel.complianceNotes || [],
        goal: payload.goal || null,
        language: payload.language || "en",
        vehicleSnapshot: payload.vehicle,
      } satisfies Json,
    }));

    const { data: channels, error: channelsError } = await supabase
      .from("campaign_channels")
      .insert(channelRows)
      .select("id, channel, status");

    if (channelsError) throw channelsError;

    return NextResponse.json({
      ok: true,
      campaign,
      channels: channels || [],
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save campaign.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return NextResponse.json(
      { ok: false, campaigns: [], error: "Supabase environment variables are not configured." },
      { status: 500 },
    );
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const clientId = searchParams.get("clientId");

  if (id) {
    const { data, error } = await supabase
      .from("campaigns")
      .select(campaignSelect())
      .eq("id", id)
      .match(clientId ? { dealership_id: clientId } : {})
      .single();

    if (error) {
      return NextResponse.json({ ok: false, campaign: null, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, campaign: data });
  }

  let query = supabase
    .from("campaigns")
    .select(campaignSelect())
    .order("updated_at", { ascending: false })
    .limit(50);

  if (clientId) query = query.eq("dealership_id", clientId);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ ok: false, campaigns: [], error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, campaigns: data || [] });
}

export async function PATCH(request: Request) {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return NextResponse.json(
      { ok: false, error: "Supabase environment variables are not configured." },
      { status: 500 },
    );
  }

  let payload: CampaignPatchPayload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON payload." }, { status: 400 });
  }

  if (!payload.channelId) {
    return NextResponse.json({ ok: false, error: "A channelId is required." }, { status: 400 });
  }

  const updates: TablesUpdate<"campaign_channels"> = {
    headline: payload.headline ?? null,
    primary_text: payload.primaryText ?? null,
    description: payload.description ?? null,
    call_to_action: payload.callToAction ?? null,
    destination_url: payload.destinationUrl ?? undefined,
    published_url: payload.publishedUrl ?? undefined,
    status: payload.status || "draft",
    platform_payload: (payload.platformPayload || {}) as Json,
    updated_at: new Date().toISOString(),
  };

  const { data: existingChannel, error: existingError } = await supabase
    .from("campaign_channels")
    .select("campaign_id")
    .eq("id", payload.channelId)
    .single();

  if (existingError) {
    return NextResponse.json({ ok: false, error: existingError.message }, { status: 500 });
  }

  const { data: channel, error } = await supabase
    .from("campaign_channels")
    .update(updates)
    .eq("id", payload.channelId)
    .select(`
      id,
      channel,
      status,
      headline,
      primary_text,
      description,
      call_to_action,
      destination_url,
      published_url,
      platform_payload,
      created_at,
      updated_at
    `)
    .single();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  if (channel) {
    await supabase
      .from("campaigns")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", existingChannel.campaign_id);
  }

  return NextResponse.json({ ok: true, channel });
}
