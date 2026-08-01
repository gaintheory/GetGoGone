import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { resolveDealershipId } from "@/lib/dealerships";
import { refuseIfLiveCredentialPresent, simulatedId } from "@/lib/publishing/simulation";

export async function POST(request: Request) {
  const refusal = refuseIfLiveCredentialPresent("meta_ads");
  if (refusal) return refusal;

  const supabase = getSupabaseAdmin();
  let body: any = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { clientId, campaignId, channelId, adHeadline, adBody, campaignName } = body;

  if (!channelId || !campaignId) {
    return NextResponse.json(
      { error: "Missing required properties: channelId and campaignId are required." },
      { status: 400 }
    );
  }

  try {
    const finalDealershipId = supabase ? await resolveDealershipId(supabase, clientId) : null;

    const adId = simulatedId("meta");
    const destinationUrl = `https://ads.facebook.com/campaigns/${adId}`;

    console.log(`[Meta Ads SIMULATED] No API call made. Fake ad ${adId} for campaign ${campaignId}.`);

    if (supabase && finalDealershipId) {
      const client = supabase as any;

      await client.from("audit_log").insert({
        dealership_id: finalDealershipId,
        action: "channel_publish_simulated",
        entity_type: "campaign_channel",
        entity_id: channelId,
        metadata: {
          simulated: true,
          campaignId,
          platform: "meta_paid",
          destinationUrl,
          adId,
          adHeadline: adHeadline || "",
          adBody: adBody || "",
          campaignName: campaignName || "Meta Campaign",
          timestamp: new Date().toISOString(),
        }
      });
    }

    return NextResponse.json({
      ok: true,
      simulated: true,
      adId,
      status: "simulated",
      campaignUrl: destinationUrl,
      message: "Simulated publish — no Meta Ads API call was made.",
      timestamp: new Date().toISOString(),
    });

  } catch (err) {
    console.error("[Meta Ads SIMULATED] Failed:", err);
    return NextResponse.json(
      { error: `Meta Ad publishing failed: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 }
    );
  }
}
