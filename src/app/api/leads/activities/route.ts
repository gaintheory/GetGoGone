import { NextResponse } from "next/server";

import { getSupabaseAdmin } from "@/lib/supabase/server";

const ACTIVITY_TYPES = new Set([
  "note",
  "call_attempt",
  "call_connected",
  "sms_sent",
  "email_sent",
  "appointment_scheduled",
  "status_change",
  "viewed_vehicle",
]);

type CreateActivityPayload = {
  leadId?: string;
  activityType?: string;
  body?: string;
  metadata?: Record<string, unknown>;
  actor?: string;
  occurredAt?: string;
};

export async function POST(request: Request) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json(
      { ok: false, error: "Supabase environment variables are not configured." },
      { status: 500 },
    );
  }

  let payload: CreateActivityPayload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON payload." }, { status: 400 });
  }

  if (!payload.leadId) {
    return NextResponse.json({ ok: false, error: "leadId is required." }, { status: 400 });
  }
  if (!payload.activityType || !ACTIVITY_TYPES.has(payload.activityType)) {
    return NextResponse.json(
      { ok: false, error: `activityType must be one of ${[...ACTIVITY_TYPES].join(", ")}` },
      { status: 400 },
    );
  }

  const client = supabase as any;

  const { data: lead, error: leadError } = await client
    .from("leads")
    .select("id, dealership_id")
    .eq("id", payload.leadId)
    .maybeSingle();
  if (leadError) {
    return NextResponse.json({ ok: false, error: leadError.message }, { status: 500 });
  }
  if (!lead) {
    return NextResponse.json({ ok: false, error: "Lead not found." }, { status: 404 });
  }

  const { data, error } = await client
    .from("lead_activities")
    .insert({
      lead_id: lead.id,
      dealership_id: lead.dealership_id,
      activity_type: payload.activityType,
      body: payload.body?.trim() || null,
      metadata: payload.metadata || {},
      actor: payload.actor?.trim() || "operator",
      occurred_at: payload.occurredAt || new Date().toISOString(),
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  // Update last_contacted_at for outbound activities
  if (["call_attempt", "call_connected", "sms_sent", "email_sent"].includes(payload.activityType)) {
    await client
      .from("leads")
      .update({ last_contacted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq("id", lead.id);
  }

  return NextResponse.json({ ok: true, activity: data });
}
