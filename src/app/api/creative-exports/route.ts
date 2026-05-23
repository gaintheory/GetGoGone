import { NextResponse } from "next/server";

import type { Json, TablesInsert } from "@/lib/database.types";
import { getSupabaseAdmin } from "@/lib/supabase/server";

type CreativeExportPayload = {
  clientId?: string;
  imageDataUrl?: string;
  fileName?: string;
  format?: string;
  creativeTemplateId?: string | null;
  campaignId?: string | null;
  campaignChannelId?: string | null;
  metadata?: Record<string, unknown>;
};

const BUCKET = "campaign-assets";

function assetSelect() {
  return "id, campaign_id, campaign_channel_id, asset_type, format, file_url, storage_path, template_id, metadata, created_at";
}

function parseImageDataUrl(value?: string) {
  const match = value?.match(/^data:(image\/(?:png|jpeg|jpg));base64,(.+)$/);
  if (!match) return null;
  const contentType = match[1] === "image/jpg" ? "image/jpeg" : match[1];
  const extension = contentType === "image/jpeg" ? "jpg" : "png";
  return {
    contentType,
    extension,
    buffer: Buffer.from(match[2], "base64"),
  };
}

function cleanFilePart(value?: string | null) {
  return (value || "creative")
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "creative";
}

async function ensureBucket(supabase: NonNullable<ReturnType<typeof getSupabaseAdmin>>) {
  const { data: buckets, error } = await supabase.storage.listBuckets();
  if (error) throw error;
  if (buckets?.some((bucket) => bucket.name === BUCKET)) return;

  const { error: createError } = await supabase.storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: 10 * 1024 * 1024,
    allowedMimeTypes: ["image/png", "image/jpeg"],
  });
  if (createError) throw createError;
}

export async function POST(request: Request) {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return NextResponse.json(
      { ok: false, error: "Supabase environment variables are not configured." },
      { status: 500 },
    );
  }

  let payload: CreativeExportPayload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON payload." }, { status: 400 });
  }

  const image = parseImageDataUrl(payload.imageDataUrl);
  if (!image) {
    return NextResponse.json({ ok: false, error: "A PNG or JPG data URL is required." }, { status: 400 });
  }

  const fileStem = cleanFilePart(payload.fileName);
  const clientPart = cleanFilePart(payload.clientId || "default-client");
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const path = [
    clientPart,
    "designer",
    `${timestamp}-${fileStem}.${image.extension}`,
  ].join("/");

  try {
    await ensureBucket(supabase);

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, image.buffer, {
        contentType: image.contentType,
        upsert: true,
      });

    if (uploadError) throw uploadError;

    const { data: publicData } = supabase.storage.from(BUCKET).getPublicUrl(path);
    const publicUrl = publicData.publicUrl;

    if (payload.creativeTemplateId) {
      await supabase
        .from("creative_templates")
        .update({
          preview_url: publicUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", payload.creativeTemplateId);
    }

    let asset = null;
    if (payload.campaignId) {
      const row: TablesInsert<"campaign_assets"> = {
        campaign_id: payload.campaignId,
        campaign_channel_id: payload.campaignChannelId || null,
        asset_type: "image_creative",
        format: payload.format || image.extension,
        file_url: publicUrl,
        storage_path: path,
        template_id: payload.creativeTemplateId || null,
        metadata: {
          ...(payload.metadata || {}),
          bucket: BUCKET,
          contentType: image.contentType,
          fileName: `${fileStem}.${image.extension}`,
          exportedFrom: "designer",
        } as Json,
      };

      const { data, error } = await supabase
        .from("campaign_assets")
        .insert(row)
        .select(assetSelect())
        .single();

      if (error) throw error;
      asset = data;

      await supabase
        .from("campaigns")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", payload.campaignId);
    }

    return NextResponse.json({
      ok: true,
      export: {
        bucket: BUCKET,
        storagePath: path,
        fileUrl: publicUrl,
        contentType: image.contentType,
      },
      asset,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to export creative.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
