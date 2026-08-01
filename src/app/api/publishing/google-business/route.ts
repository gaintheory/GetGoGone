import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { resolveDealershipId } from "@/lib/dealerships";
import { refuseIfLiveCredentialPresent, simulatedId } from "@/lib/publishing/simulation";

export async function POST(request: Request) {
  const refusal = refuseIfLiveCredentialPresent("google_business");
  if (refusal) return refusal;

  const supabase = getSupabaseAdmin();
  let body: any = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { clientId, campaignId, channelId, headline, primaryText, callToAction, destinationUrl } = body;

  if (!channelId || !primaryText) {
    return NextResponse.json(
      { error: "Missing required properties: channelId or primaryText." },
      { status: 400 }
    );
  }

  try {
    const finalDealershipId = supabase ? await resolveDealershipId(supabase, clientId) : null;
    const postId = simulatedId("gbp");
    const postUrl = `https://g.co/kg/p/${postId}`;

    console.log(`[Google Business SIMULATED] No API call made. Fake post ${postId}.`);

    if (supabase && finalDealershipId) {
      const client = supabase as any;

      await client.from("audit_log").insert({
        dealership_id: finalDealershipId,
        action: "channel_publish_simulated",
        entity_type: "campaign_channel",
        entity_id: channelId,
        metadata: {
          simulated: true,
          campaignId: campaignId || null,
          platform: "google_business",
          postId,
          postUrl,
          headline: headline || null,
          primaryText,
          callToAction: callToAction || null,
          destinationUrl: destinationUrl || null,
          publishedAt: new Date().toISOString(),
        }
      });
    }

    return NextResponse.json({
      ok: true,
      simulated: true,
      message: "Simulated publish — no Google Business Profile API call was made.",
      postId,
      postUrl,
      publishedAt: new Date().toISOString(),
    });

  } catch (err) {
    console.error("[Google Business SIMULATED] Failed:", err);
    return NextResponse.json(
      { error: `Direct publishing failed: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 }
    );
  }
}
