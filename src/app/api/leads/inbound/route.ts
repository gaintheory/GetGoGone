import { NextResponse } from "next/server";

import { getSupabaseAdmin } from "@/lib/supabase/server";

/**
 * Public inbound web-inquiry endpoint.
 *
 * This route is allowed past the auth gate (see middleware.ts → PUBLIC_API_PREFIXES).
 * It exists so the per-vehicle landing pages at /v/<vehicleId> can post inquiry
 * forms without a logged-in operator session.
 *
 * Day-1 abuse mitigation:
 *   - Requires a valid vehicleId (must exist in the database).
 *   - Requires at least one of phone/email and a name.
 *   - Stores raw UTM + IP + UA on the lead row for later attribution review.
 *
 * Real rate limiting and CAPTCHA come later (Phase 7 of remediation plan).
 */

type InboundPayload = {
  vehicleId: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  phone?: string;
  email?: string;
  message?: string;
  // Attribution params (forwarded from the landing page URL)
  utm?: Record<string, unknown>;
  campaignId?: string;
  campaignChannelId?: string;
  sourceChannel?: string;
  inboundUrl?: string;
};

function clientIp(request: Request): string | null {
  const h = request.headers;
  const fwd = h.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return h.get("x-real-ip") || null;
}

function splitFullName(full?: string): { first: string | null; last: string | null } {
  if (!full) return { first: null, last: null };
  const parts = full.trim().split(/\s+/);
  if (parts.length === 1) return { first: parts[0], last: null };
  return { first: parts[0], last: parts.slice(1).join(" ") };
}

export async function POST(request: Request) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json(
      { ok: false, error: "Server is not configured." },
      { status: 500 },
    );
  }

  let payload: InboundPayload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON." }, { status: 400 });
  }

  if (!payload.vehicleId) {
    return NextResponse.json({ ok: false, error: "vehicleId is required." }, { status: 400 });
  }

  const client = supabase as any;
  const { data: vehicle, error: vehicleError } = await client
    .from("vehicles")
    .select("id, dealership_id, year, make, model")
    .eq("id", payload.vehicleId)
    .maybeSingle();

  if (vehicleError) {
    return NextResponse.json({ ok: false, error: vehicleError.message }, { status: 500 });
  }
  if (!vehicle) {
    return NextResponse.json({ ok: false, error: "Vehicle not found." }, { status: 404 });
  }

  // Contact info — require at least one of phone or email
  const hasContact = (payload.phone && payload.phone.trim()) || (payload.email && payload.email.trim());
  if (!hasContact) {
    return NextResponse.json({ ok: false, error: "Phone or email is required." }, { status: 400 });
  }

  const split = splitFullName(payload.fullName);
  const firstName = (payload.firstName?.trim() || split.first || "").slice(0, 100);
  const lastName = (payload.lastName?.trim() || split.last || "").slice(0, 100);

  if (!firstName && !lastName) {
    return NextResponse.json({ ok: false, error: "Name is required." }, { status: 400 });
  }

  const { data: lead, error: leadError } = await client
    .from("leads")
    .insert({
      dealership_id: vehicle.dealership_id,
      vehicle_id: vehicle.id,
      campaign_id: payload.campaignId || null,
      campaign_channel_id: payload.campaignChannelId || null,
      first_name: firstName || null,
      last_name: lastName || null,
      phone: payload.phone?.trim() || null,
      email: payload.email?.trim() || null,
      source: "web_inquiry",
      source_channel: payload.sourceChannel?.trim() || null,
      status: "new",
      notes: payload.message?.trim() || null,
      utm: payload.utm && typeof payload.utm === "object" ? payload.utm : {},
      inbound_url: payload.inboundUrl?.slice(0, 2000) || null,
      inbound_ip: clientIp(request),
      inbound_user_agent: request.headers.get("user-agent")?.slice(0, 500) || null,
      updated_at: new Date().toISOString(),
    })
    .select("id, dealership_id")
    .single();

  if (leadError) {
    return NextResponse.json({ ok: false, error: leadError.message }, { status: 500 });
  }

  await client.from("lead_activities").insert({
    lead_id: lead.id,
    dealership_id: lead.dealership_id,
    activity_type: "note",
    body: `Web inquiry from landing page for ${vehicle.year} ${vehicle.make} ${vehicle.model}.`,
    metadata: {
      utm: payload.utm || {},
      sourceChannel: payload.sourceChannel || null,
      message: payload.message || null,
    },
    actor: "web",
  });

  return NextResponse.json({ ok: true, leadId: lead.id });
}
