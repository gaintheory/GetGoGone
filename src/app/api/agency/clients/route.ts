import { NextResponse } from "next/server";

import type { TablesInsert } from "@/lib/database.types";
import { getSupabaseAdmin } from "@/lib/supabase/server";

async function ensureDefaultClient(
  supabase: NonNullable<ReturnType<typeof getSupabaseAdmin>>,
) {
  const { data: existing, error: selectError } = await supabase
    .from("dealerships")
    .select("id")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (selectError) throw selectError;
  if (existing?.id) return existing.id;

  const row: TablesInsert<"dealerships"> = {
    name: process.env.GETGOGONE_DEFAULT_DEALERSHIP_NAME || "Right Price Auto Sales",
  };

  const { data: created, error: insertError } = await supabase
    .from("dealerships")
    .insert(row)
    .select("id")
    .single();

  if (insertError) throw insertError;
  return created.id;
}

export async function GET() {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return NextResponse.json({
      ok: false,
      clients: [],
      error: "Supabase environment variables are not configured.",
    });
  }

  try {
    await ensureDefaultClient(supabase);

    const { data, error } = await supabase
      .from("dealerships")
      .select("id, name, legal_name, phone, website_url, city, state, created_at, updated_at")
      .order("created_at", { ascending: true });

    if (error) throw error;

    return NextResponse.json({ ok: true, clients: data || [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load clients.";
    return NextResponse.json({ ok: false, clients: [], error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return NextResponse.json(
      { ok: false, error: "Supabase environment variables are not configured." },
      { status: 500 },
    );
  }

  let payload: { name?: string; phone?: string; websiteUrl?: string; city?: string; state?: string };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON payload." }, { status: 400 });
  }

  if (!payload.name?.trim()) {
    return NextResponse.json({ ok: false, error: "Client name is required." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("dealerships")
    .insert({
      name: payload.name.trim(),
      phone: payload.phone || null,
      website_url: payload.websiteUrl || null,
      city: payload.city || null,
      state: payload.state || null,
    })
    .select("id, name, legal_name, phone, website_url, city, state, created_at, updated_at")
    .single();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, client: data });
}
