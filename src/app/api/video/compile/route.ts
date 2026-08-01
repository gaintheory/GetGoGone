import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { resolveDealershipId } from "@/lib/dealerships";

// ─── Video Provider Adapter ──────────────────────────────────────────────────
// There is NO real video renderer wired up yet. This route returns a simulated
// asset so the Video Studio workflow can be exercised end to end.
//
// The previous version claimed otherwise: when GOOGLE_VEO_API_KEY was set it
// logged "routing to Veo generation pipeline" and returned a path to an .mp4
// that was never rendered, which would have written a dead file_url into
// campaign_assets. If a real provider credential is configured we now refuse
// with 501 rather than fabricate a render.
//
// Real implementation target is Remotion (programmatic React → MP4).
// See docs/REDESIGN_2026-06.md → "the video wedge".

const LIVE_VIDEO_CREDENTIALS = ["GOOGLE_VEO_API_KEY", "GOOGLE_OMNI_API_KEY"];

function configuredLiveVideoCredentials(): string[] {
  return LIVE_VIDEO_CREDENTIALS.filter((name) => {
    const value = process.env[name];
    return typeof value === "string" && value.trim().length > 0;
  });
}

async function compileSimulated(
  params: { duration: number; vehicleId: string }
): Promise<{ videoUrl: string; renderMs: number }> {
  const start = Date.now();
  await new Promise((r) => setTimeout(r, 800));
  return {
    videoUrl: `/videos/simulated-render-${params.duration}s.mp4`,
    renderMs: Date.now() - start,
  };
}
// ────────────────────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  const liveCredentials = configuredLiveVideoCredentials();
  if (liveCredentials.length > 0) {
    return NextResponse.json(
      {
        ok: false,
        error: "not_implemented",
        message:
          `Video rendering is not implemented yet. ${liveCredentials.join(", ")} is set, but ` +
          `GetGoGone has no video generation client — it would only be able to return a link ` +
          `to a file that was never rendered. Unset the credential to use the labelled simulator.`,
      },
      { status: 501 },
    );
  }

  const supabase = getSupabaseAdmin();
  let body: any = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { clientId, vehicleId, campaignId, title, duration, script, storyboard } = body;

  if (!vehicleId || !script || !storyboard) {
    return NextResponse.json(
      { error: "Missing required properties: vehicleId, script, or storyboard." },
      { status: 400 }
    );
  }

  try {
    const provider = "simulated";
    console.log(`[Video Compile SIMULATED] No render performed | Title: "${title}" | Duration: ${duration}s`);

    const { videoUrl, renderMs } = await compileSimulated({
      duration: duration || 30,
      vehicleId,
    });

    let assetRow: any = null;
    const finalDealershipId = supabase ? await resolveDealershipId(supabase, clientId) : null;

    if (supabase && finalDealershipId && campaignId) {
      const client = supabase as any;

      // Upsert a record under campaign_assets
      const { data, error } = await client
        .from("campaign_assets")
        .insert({
          dealership_id: finalDealershipId,
          campaign_id: campaignId,
          asset_type: "video_asset",
          format: "mp4",
          file_url: videoUrl,
          storage_path: `campaign-assets/${finalDealershipId}/videos/${provider}-${vehicleId}.mp4`,
          metadata: {
            simulated: true,
            title,
            durationSeconds: duration,
            script,
            storyboard,
            compiledAt: new Date().toISOString(),
            provider,
            renderMs,
          }
        })
        .select()
        .maybeSingle();

      if (error) {
        console.error("[Video Compile] Failed to insert video into campaign_assets table:", error);
      } else {
        assetRow = data;
      }
    }

    return NextResponse.json({
      ok: true,
      simulated: true,
      message: "Simulated render — no video file was produced.",
      videoUrl,
      provider,
      renderMs,
      asset: assetRow || {
        asset_type: "video_asset",
        format: "mp4",
        file_url: videoUrl,
        metadata: {
          simulated: true,
          title,
          durationSeconds: duration,
          compiledAt: new Date().toISOString(),
          provider,
          renderMs,
        }
      }
    });

  } catch (err) {
    console.error("[Video Compile] Pipeline failed:", err);
    return NextResponse.json(
      { error: `Video compilation failed: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 }
    );
  }
}
