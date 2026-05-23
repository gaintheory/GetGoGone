import { NextResponse } from "next/server";

import { getSupabaseAdmin } from "@/lib/supabase/server";

type EventPayload = {
  outputId?: string;
  eventType?: string;
  note?: string;
  metadata?: Record<string, unknown>;
};

export async function POST(request: Request) {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return NextResponse.json(
      { ok: false, error: "Supabase environment variables are not configured." },
      { status: 500 },
    );
  }

  let payload: EventPayload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON payload." }, { status: 400 });
  }

  if (!payload.outputId || !payload.eventType) {
    return NextResponse.json({ ok: false, error: "outputId and eventType are required." }, { status: 400 });
  }

  const { data: output, error: outputError } = await (supabase as any)
    .from("generated_outputs")
    .select("id, dealership_id")
    .eq("id", payload.outputId)
    .maybeSingle();

  if (outputError) {
    return NextResponse.json({ ok: false, error: outputError.message }, { status: 500 });
  }

  if (!output) {
    return NextResponse.json({ ok: false, error: "Generated output was not found." }, { status: 404 });
  }

  const { data, error } = await (supabase as any)
    .from("generated_output_events")
    .insert({
      dealership_id: output.dealership_id,
      generated_output_id: output.id,
      event_type: payload.eventType,
      actor_type: "operator",
      note: payload.note || null,
      metadata: payload.metadata || {},
    })
    .select("id, event_type, actor_type, note, metadata, created_at")
    .single();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, event: data });
}
