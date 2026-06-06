import { NextResponse } from "next/server";

import { getSupabaseAdmin } from "@/lib/supabase/server";
import { resolveDealershipId } from "@/lib/dealerships";

const LEAD_STATUSES = ["new", "contacted", "appointment", "sold", "lost"] as const;
type LeadStatus = (typeof LEAD_STATUSES)[number];

function isLeadStatus(value: unknown): value is LeadStatus {
  return typeof value === "string" && (LEAD_STATUSES as readonly string[]).includes(value);
}

function leadSelect() {
  return `
    *,
    vehicle:vehicles (
      id, vin, stock_number, year, make, model, trim, mileage, price, exterior_color
    ),
    campaign:campaigns (
      id, name
    ),
    campaign_channel:campaign_channels (
      id, channel
    )
  `;
}

// ─── GET — list leads (or fetch one with full activity) ─────────────────────

export async function GET(request: Request) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json(
      { ok: false, leads: [], error: "Supabase environment variables are not configured." },
      { status: 500 },
    );
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const clientId = searchParams.get("clientId");
  const status = searchParams.get("status");

  const dealershipId = await resolveDealershipId(supabase, clientId);
  if (!dealershipId) {
    return NextResponse.json({ ok: true, leads: [] });
  }

  const client = supabase as any;

  if (id) {
    const { data: lead, error: leadError } = await client
      .from("leads")
      .select(leadSelect())
      .eq("id", id)
      .eq("dealership_id", dealershipId)
      .maybeSingle();

    if (leadError) {
      return NextResponse.json({ ok: false, lead: null, error: leadError.message }, { status: 500 });
    }
    if (!lead) {
      return NextResponse.json({ ok: false, lead: null, error: "Lead not found." }, { status: 404 });
    }

    const { data: activities, error: activitiesError } = await client
      .from("lead_activities")
      .select("*")
      .eq("lead_id", id)
      .order("occurred_at", { ascending: false });

    if (activitiesError) {
      return NextResponse.json({ ok: false, lead: null, error: activitiesError.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, lead, activities: activities || [] });
  }

  let query = client
    .from("leads")
    .select(leadSelect())
    .eq("dealership_id", dealershipId)
    .order("created_at", { ascending: false })
    .limit(200);

  if (status && isLeadStatus(status)) query = query.eq("status", status);

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ ok: false, leads: [], error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, leads: data || [] });
}

// ─── POST — create a lead (operator manual add) ─────────────────────────────

type CreatePayload = {
  clientId?: string;
  vehicleId?: string | null;
  campaignId?: string | null;
  campaignChannelId?: string | null;
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  source?: string;
  sourceChannel?: string;
  status?: string;
  notes?: string;
  appointmentAt?: string | null;
};

export async function POST(request: Request) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json(
      { ok: false, error: "Supabase environment variables are not configured." },
      { status: 500 },
    );
  }

  let payload: CreatePayload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON payload." }, { status: 400 });
  }

  if (!payload.firstName?.trim() && !payload.lastName?.trim() && !payload.phone?.trim() && !payload.email?.trim()) {
    return NextResponse.json(
      { ok: false, error: "A lead needs at least a name, phone, or email." },
      { status: 400 },
    );
  }

  const dealershipId = await resolveDealershipId(supabase, payload.clientId);
  if (!dealershipId) {
    return NextResponse.json({ ok: false, error: "No dealership available." }, { status: 400 });
  }

  const status: LeadStatus = isLeadStatus(payload.status) ? payload.status : "new";
  const client = supabase as any;

  const { data, error } = await client
    .from("leads")
    .insert({
      dealership_id: dealershipId,
      vehicle_id: payload.vehicleId || null,
      campaign_id: payload.campaignId || null,
      campaign_channel_id: payload.campaignChannelId || null,
      first_name: payload.firstName?.trim() || null,
      last_name: payload.lastName?.trim() || null,
      phone: payload.phone?.trim() || null,
      email: payload.email?.trim() || null,
      source: payload.source?.trim() || "manual",
      source_channel: payload.sourceChannel?.trim() || null,
      status,
      notes: payload.notes?.trim() || null,
      appointment_at: payload.appointmentAt || null,
      updated_at: new Date().toISOString(),
    })
    .select(leadSelect())
    .single();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  // Log initial activity
  await client.from("lead_activities").insert({
    lead_id: data.id,
    dealership_id: dealershipId,
    activity_type: "note",
    body: `Lead created (source: ${data.source}${data.source_channel ? `, channel: ${data.source_channel}` : ""}).`,
    actor: "operator",
  });

  return NextResponse.json({ ok: true, lead: data });
}

// ─── PATCH — update lead fields ─────────────────────────────────────────────

type PatchPayload = {
  id: string;
  status?: string;
  notes?: string | null;
  phone?: string | null;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  appointmentAt?: string | null;
  vehicleId?: string | null;
};

export async function PATCH(request: Request) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json(
      { ok: false, error: "Supabase environment variables are not configured." },
      { status: 500 },
    );
  }

  let payload: PatchPayload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON payload." }, { status: 400 });
  }

  if (!payload.id) {
    return NextResponse.json({ ok: false, error: "Lead id is required." }, { status: 400 });
  }

  const client = supabase as any;
  const { data: existing, error: existingError } = await client
    .from("leads")
    .select("id, dealership_id, status")
    .eq("id", payload.id)
    .maybeSingle();

  if (existingError) {
    return NextResponse.json({ ok: false, error: existingError.message }, { status: 500 });
  }
  if (!existing) {
    return NextResponse.json({ ok: false, error: "Lead not found." }, { status: 404 });
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (payload.status !== undefined) {
    if (!isLeadStatus(payload.status)) {
      return NextResponse.json({ ok: false, error: "Invalid status." }, { status: 400 });
    }
    updates.status = payload.status;
    if (payload.status !== "new") updates.last_contacted_at = new Date().toISOString();
  }
  if (payload.notes !== undefined) updates.notes = payload.notes;
  if (payload.phone !== undefined) updates.phone = payload.phone;
  if (payload.email !== undefined) updates.email = payload.email;
  if (payload.firstName !== undefined) updates.first_name = payload.firstName;
  if (payload.lastName !== undefined) updates.last_name = payload.lastName;
  if (payload.appointmentAt !== undefined) updates.appointment_at = payload.appointmentAt;
  if (payload.vehicleId !== undefined) updates.vehicle_id = payload.vehicleId;

  const { data, error } = await client
    .from("leads")
    .update(updates)
    .eq("id", payload.id)
    .select(leadSelect())
    .single();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  // Log a status_change activity if status moved
  if (payload.status && payload.status !== existing.status) {
    await client.from("lead_activities").insert({
      lead_id: payload.id,
      dealership_id: existing.dealership_id,
      activity_type: "status_change",
      body: `Status changed from ${existing.status} to ${payload.status}.`,
      metadata: { from: existing.status, to: payload.status },
      actor: "operator",
    });
  }

  return NextResponse.json({ ok: true, lead: data });
}
