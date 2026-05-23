import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";

async function resolveClientId(supabase: any, clientId?: string | null) {
  if (clientId && clientId !== "agency_overview") return clientId;
  const { data, error } = await supabase
    .from("dealerships")
    .select("id")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) return null;
  return data?.id || null;
}

export async function POST(request: Request) {
  const supabase = getSupabaseAdmin();
  let body: any = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { clientId, campaignId, channelId, actionType, destinationUrl, platform } = body;

  if (!channelId || !actionType) {
    return NextResponse.json(
      { error: "Missing required properties: channelId or actionType." },
      { status: 400 }
    );
  }

  try {
    const finalDealershipId = supabase ? await resolveClientId(supabase, clientId) : null;

    console.log(`Auditing publishing action "${actionType}" for channel ${channelId}...`);

    if (supabase && finalDealershipId) {
      const client = supabase as any;

      // Log the publishing activity in the audit log
      await client.from("audit_log").insert({
        dealership_id: finalDealershipId,
        action: `channel_${actionType}`,
        entity_type: "campaign_channel",
        entity_id: channelId,
        metadata: {
          campaignId: campaignId || null,
          platform: platform || "unknown",
          destinationUrl: destinationUrl || null,
          timestamp: new Date().toISOString(),
        }
      });
    }

    return NextResponse.json({
      ok: true,
      message: "Publishing action successfully logged.",
      timestamp: new Date().toISOString(),
    });

  } catch (err) {
    console.error("Failed to log publishing action:", err);
    return NextResponse.json(
      { error: `Logging failed: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 }
    );
  }
}
