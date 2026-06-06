import { NextResponse } from "next/server";

import { getSupabaseAdmin } from "@/lib/supabase/server";
import { resolveDealershipId } from "@/lib/dealerships";

export async function GET(request: Request) {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return NextResponse.json(
      { ok: false, outputs: [], error: "Supabase environment variables are not configured." },
      { status: 500 },
    );
  }

  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get("clientId");
  const status = searchParams.get("status");
  const taskType = searchParams.get("taskType");
  const channel = searchParams.get("channel");
  const limit = Math.min(Number(searchParams.get("limit") || 50), 100);

  try {
    const dealershipId = await resolveDealershipId(supabase, clientId);
    if (!dealershipId) return NextResponse.json({ ok: true, outputs: [] });

    let query = (supabase as any)
      .from("generated_outputs")
      .select(`
        id,
        dealership_id,
        vehicle_id,
        campaign_id,
        target_type,
        target_id,
        task_type,
        provider,
        model,
        language,
        prompt_context,
        output,
        status,
        created_at,
        updated_at,
        vehicle:vehicles (
          id,
          vin,
          stock_number,
          year,
          make,
          model,
          trim
        ),
        campaign:campaigns (
          id,
          name,
          status
        )
      `)
      .eq("dealership_id", dealershipId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (status && status !== "all") query = query.eq("status", status);
    if (taskType && taskType !== "all") query = query.eq("task_type", taskType);
    if (channel && channel !== "all") query = query.eq("target_id", channel);

    const { data, error } = await query;
    if (error) throw error;

    const outputs = data || [];
    const outputIds = outputs.map((item: any) => item.id).filter(Boolean);

    if (outputIds.length) {
      try {
        const { data: events } = await (supabase as any)
          .from("generated_output_events")
          .select("id, generated_output_id, event_type, actor_type, note, metadata, created_at")
          .in("generated_output_id", outputIds)
          .order("created_at", { ascending: false });
        const eventsByOutput = new Map<string, any[]>();
        for (const event of events || []) {
          const list = eventsByOutput.get(event.generated_output_id) || [];
          list.push(event);
          eventsByOutput.set(event.generated_output_id, list);
        }
        for (const output of outputs as any[]) {
          output.events = eventsByOutput.get(output.id) || [];
        }
      } catch {
        for (const output of outputs as any[]) output.events = [];
      }
    }

    return NextResponse.json({ ok: true, outputs });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load generated outputs.";
    return NextResponse.json({ ok: false, outputs: [], error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return NextResponse.json(
      { ok: false, error: "Supabase environment variables are not configured." },
      { status: 500 },
    );
  }

  let payload: {
    id?: string;
    status?: string;
    output?: Record<string, unknown>;
  };

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON payload." }, { status: 400 });
  }

  if (!payload.id) {
    return NextResponse.json({ ok: false, error: "An output id is required." }, { status: 400 });
  }

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  const allowedStatuses = new Set(["draft", "reviewed", "approved", "archived", "hitl_required", "rejected"]);
  if (payload.status && allowedStatuses.has(payload.status)) updates.status = payload.status;
  if (payload.output) updates.output = payload.output;

  const { data, error } = await (supabase as any)
    .from("generated_outputs")
    .update(updates)
    .eq("id", payload.id)
    .select("id, status, output, updated_at")
    .single();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, output: data });
}
