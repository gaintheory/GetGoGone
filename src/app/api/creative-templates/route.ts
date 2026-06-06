import { NextResponse } from "next/server";

import type { Json, TablesInsert } from "@/lib/database.types";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { ensureDealershipId } from "@/lib/dealerships";

type CreativeTemplatePayload = {
  clientId?: string;
  name?: string;
  category?: string;
  format?: string;
  language?: string;
  canvasJson?: Record<string, unknown>;
  previewUrl?: string | null;
  isSystem?: boolean;
};

export async function GET(request: Request) {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return NextResponse.json(
      { ok: false, templates: [], error: "Supabase environment variables are not configured." },
      { status: 500 },
    );
  }

  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const clientId = searchParams.get("clientId");

  let query = supabase
    .from("creative_templates")
    .select("id, name, category, format, language, canvas_json, preview_url, is_system, created_at, updated_at")
    .order("updated_at", { ascending: false })
    .limit(100);

  if (category) query = query.eq("category", category);
  if (clientId) query = query.eq("dealership_id", clientId);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ ok: false, templates: [], error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, templates: data || [] });
}

export async function POST(request: Request) {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return NextResponse.json(
      { ok: false, error: "Supabase environment variables are not configured." },
      { status: 500 },
    );
  }

  let payload: CreativeTemplatePayload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON payload." }, { status: 400 });
  }

  if (!payload.name?.trim()) {
    return NextResponse.json({ ok: false, error: "A template name is required." }, { status: 400 });
  }

  if (!payload.format?.trim()) {
    return NextResponse.json({ ok: false, error: "A format is required." }, { status: 400 });
  }

  try {
    const dealershipId = await ensureDealershipId(supabase, payload.clientId);
    const row: TablesInsert<"creative_templates"> = {
      dealership_id: dealershipId,
      name: payload.name.trim(),
      category: payload.category || "custom_template",
      format: payload.format,
      language: payload.language || "en",
      canvas_json: (payload.canvasJson || {}) as Json,
      preview_url: payload.previewUrl || null,
      is_system: payload.isSystem || false,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("creative_templates")
      .insert(row)
      .select("id, name, category, format, language, canvas_json, preview_url, is_system, created_at, updated_at")
      .single();

    if (error) throw error;

    return NextResponse.json({ ok: true, template: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save creative template.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
