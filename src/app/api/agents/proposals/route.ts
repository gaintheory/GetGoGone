import { NextResponse } from "next/server";

import { getSupabaseAdmin } from "@/lib/supabase/server";
import { resolveDealershipId } from "@/lib/dealerships";

const DECIDED_STATUSES = new Set(["approved", "rejected"]);
const ALLOWED_STATUSES = new Set(["pending", "approved", "rejected", "snoozed", "archived"]);

function defaultSnoozeUntil() {
  const next = new Date();
  next.setDate(next.getDate() + 1);
  return next.toISOString();
}

export async function GET(request: Request) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ ok: false, proposals: [], error: "Supabase environment variables are not configured." }, { status: 500 });
  const params = new URL(request.url).searchParams;
  const dealershipId = await resolveDealershipId(supabase, params.get("clientId"));
  if (!dealershipId) return NextResponse.json({ ok: true, proposals: [] });

  await (supabase as any)
    .from("agent_proposals")
    .update({ status: "pending", snoozed_until: null, updated_at: new Date().toISOString() })
    .eq("dealership_id", dealershipId)
    .eq("status", "snoozed")
    .lte("snoozed_until", new Date().toISOString());

  const { data, error } = await (supabase as any)
    .from("agent_proposals")
    .select("*")
    .eq("dealership_id", dealershipId)
    .neq("status", "archived")
    .order("updated_at", { ascending: false })
    .limit(50);
  if (error) return NextResponse.json({ ok: false, proposals: [], error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, proposals: data || [] });
}

export async function POST(request: Request) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ ok: false, error: "Supabase environment variables are not configured." }, { status: 500 });
  const payload = await request.json().catch(() => null);
  if (!payload?.proposals?.length) return NextResponse.json({ ok: false, error: "proposals array is required." }, { status: 400 });
  const dealershipId = await resolveDealershipId(supabase, payload.clientId);
  if (!dealershipId) return NextResponse.json({ ok: false, error: "No dealership available." }, { status: 400 });

  const rows = payload.proposals.map((proposal: any) => ({
    dealership_id: dealershipId,
    source_key: proposal.sourceKey,
    agent_type: proposal.agentType || "cockpit",
    target_type: proposal.targetType,
    target_id: String(proposal.targetId || ""),
    proposal_type: proposal.proposalType || proposal.type || "recommended_action",
    title: proposal.title,
    reasoning: proposal.reasoning || proposal.reason || null,
    proposed_payload: proposal.proposedPayload || proposal.item || {},
    risk_level: proposal.riskLevel || proposal.priority || "medium",
    status: "pending",
    updated_at: new Date().toISOString(),
  }));

  const { data, error } = await (supabase as any)
    .from("agent_proposals")
    .upsert(rows, { onConflict: "dealership_id,source_key", ignoreDuplicates: true })
    .select("*");
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, proposals: data || [] });
}

export async function PATCH(request: Request) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ ok: false, error: "Supabase environment variables are not configured." }, { status: 500 });
  const payload = await request.json().catch(() => null);
  if (!payload?.id || !payload?.status) return NextResponse.json({ ok: false, error: "id and status are required." }, { status: 400 });
  if (!ALLOWED_STATUSES.has(payload.status)) return NextResponse.json({ ok: false, error: "Unsupported proposal status." }, { status: 400 });

  const status = String(payload.status);
  const snoozedUntil = status === "snoozed"
    ? payload.snoozedUntil || defaultSnoozeUntil()
    : null;

  const { data, error } = await (supabase as any)
    .from("agent_proposals")
    .update({
      status,
      decided_at: DECIDED_STATUSES.has(status) ? new Date().toISOString() : null,
      snoozed_until: snoozedUntil,
      updated_at: new Date().toISOString(),
    })
    .eq("id", payload.id)
    .select("*")
    .single();
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, proposal: data });
}
