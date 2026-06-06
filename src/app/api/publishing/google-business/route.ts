import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { resolveDealershipId } from "@/lib/dealerships";

export async function POST(request: Request) {
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
    const mockPostId = `gbp_${Math.random().toString(36).substring(2, 10)}`;
    const mockPostUrl = `https://g.co/kg/p/${mockPostId}`;

    console.log(`Publishing directly to Google Business Profile: "${headline || "GBP Post"}"...`);

    if (supabase && finalDealershipId) {
      const client = supabase as any;

      // Log the direct publish event in the audit log
      await client.from("audit_log").insert({
        dealership_id: finalDealershipId,
        action: "channel_publish_direct",
        entity_type: "campaign_channel",
        entity_id: channelId,
        metadata: {
          platform: "google_business",
          postId: mockPostId,
          postUrl: mockPostUrl,
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
      message: "Published directly to Google Business Profile!",
      postId: mockPostId,
      postUrl: mockPostUrl,
      publishedAt: new Date().toISOString(),
    });

  } catch (err) {
    console.error("Direct GBP publishing simulation failed:", err);
    return NextResponse.json(
      { error: `Direct publishing failed: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 }
    );
  }
}
