import { NextResponse } from "next/server";

import type { Json, TablesInsert } from "@/lib/database.types";
import { getSupabaseAdmin } from "@/lib/supabase/server";

type AssetPayload = {
  id?: string;
  clientId?: string;
  campaignId?: string;
  campaignChannelId?: string | null;
  assetType?: string;
  format?: string | null;
  fileUrl?: string | null;
  storagePath?: string | null;
  templateId?: string | null;
  metadata?: Record<string, unknown>;
};

function assetSelect() {
  return "id, campaign_id, campaign_channel_id, asset_type, format, file_url, storage_path, template_id, metadata, created_at";
}

export async function GET(request: Request) {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return NextResponse.json(
      { ok: false, assets: [], error: "Supabase environment variables are not configured." },
      { status: 500 },
    );
  }

  const { searchParams } = new URL(request.url);
  const campaignId = searchParams.get("campaignId");
  const campaignChannelId = searchParams.get("campaignChannelId");

  if (!campaignId && !campaignChannelId) {
    return NextResponse.json({ ok: false, assets: [], error: "A campaignId or campaignChannelId is required." }, { status: 400 });
  }

  let query = supabase
    .from("campaign_assets")
    .select(assetSelect())
    .order("created_at", { ascending: false })
    .limit(100);

  if (campaignId) query = query.eq("campaign_id", campaignId);
  if (campaignChannelId) query = query.eq("campaign_channel_id", campaignChannelId);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ ok: false, assets: [], error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, assets: data || [] });
}

export async function POST(request: Request) {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return NextResponse.json(
      { ok: false, error: "Supabase environment variables are not configured." },
      { status: 500 },
    );
  }

  let payload: AssetPayload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON payload." }, { status: 400 });
  }

  if (!payload.campaignId) {
    return NextResponse.json({ ok: false, error: "A campaignId is required." }, { status: 400 });
  }

  const row: TablesInsert<"campaign_assets"> = {
    campaign_id: payload.campaignId,
    campaign_channel_id: payload.campaignChannelId || null,
    asset_type: payload.assetType || "text_package",
    format: payload.format || "txt",
    file_url: payload.fileUrl || null,
    storage_path: payload.storagePath || null,
    template_id: payload.templateId || null,
    metadata: (payload.metadata || {}) as Json,
  };

  const { data, error } = await supabase
    .from("campaign_assets")
    .insert(row)
    .select(assetSelect())
    .single();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  await supabase
    .from("campaigns")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", payload.campaignId);

  return NextResponse.json({ ok: true, asset: data });
}

export async function PATCH(request: Request) {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return NextResponse.json(
      { ok: false, error: "Supabase environment variables are not configured." },
      { status: 500 },
    );
  }

  let payload: AssetPayload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON payload." }, { status: 400 });
  }

  if (!payload.id) {
    return NextResponse.json({ ok: false, error: "An asset id is required." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("campaign_assets")
    .update({
      campaign_channel_id: payload.campaignChannelId === undefined ? undefined : payload.campaignChannelId,
      asset_type: payload.assetType,
      format: payload.format,
      file_url: payload.fileUrl,
      storage_path: payload.storagePath,
      template_id: payload.templateId,
      metadata: payload.metadata as Json | undefined,
    })
    .eq("id", payload.id)
    .select(assetSelect())
    .single();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, asset: data });
}

export async function DELETE(request: Request) {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return NextResponse.json(
      { ok: false, error: "Supabase environment variables are not configured." },
      { status: 500 },
    );
  }

  const id = new URL(request.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ ok: false, error: "An asset id is required." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("campaign_assets")
    .delete()
    .eq("id", id)
    .select(assetSelect())
    .single();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, asset: data });
}
