import { NextResponse } from "next/server";

/**
 * Shared guard for the channel publishing routes.
 *
 * GetGoGone does not yet talk to any real ad platform. Every publishing route
 * returns a *simulated* result so the campaign workflow can be demoed end to
 * end. Two rules keep that honest:
 *
 *  1. A simulated result is always labelled `simulated: true` in the response
 *     body and in the `audit_log` metadata. Nothing in the system should ever
 *     be able to mistake a simulated publish for a real one.
 *
 *  2. If an operator has configured a real platform credential, we refuse with
 *     501 instead of simulating. Previously these routes logged
 *     "Live publishing token detected!" and then returned a fabricated ad id —
 *     an operator with a token set would have been told their ad was live when
 *     no API call had been made. Failing loudly is the only safe behaviour
 *     until the real integration exists.
 *
 * Credentials are read from server-only env vars on purpose. Do NOT add
 * `NEXT_PUBLIC_*` fallbacks here: Next.js inlines those into the browser
 * bundle, which would publish the dealer's ad-platform token to every visitor.
 */

export type PlatformKey = "meta_ads" | "google_ads" | "google_business";

const LIVE_CREDENTIAL_ENV: Record<PlatformKey, string[]> = {
  meta_ads: ["META_ADS_TOKEN"],
  google_ads: ["GOOGLE_ADS_TOKEN"],
  google_business: ["GOOGLE_BUSINESS_TOKEN"],
};

const PLATFORM_LABEL: Record<PlatformKey, string> = {
  meta_ads: "Meta Ads",
  google_ads: "Google Ads",
  google_business: "Google Business Profile",
};

/**
 * Returns a 501 response if a live credential is present for this platform,
 * or `null` if it is safe to return a simulated result.
 */
export function refuseIfLiveCredentialPresent(platform: PlatformKey): NextResponse | null {
  const configured = LIVE_CREDENTIAL_ENV[platform].filter((name) => {
    const value = process.env[name];
    return typeof value === "string" && value.trim().length > 0;
  });

  if (configured.length === 0) return null;

  const label = PLATFORM_LABEL[platform];
  return NextResponse.json(
    {
      ok: false,
      error: "not_implemented",
      platform,
      message:
        `${label} publishing is not implemented yet. ${configured.join(", ")} is set, ` +
        `but GetGoGone has no ${label} API client — it would only be able to fabricate ` +
        `a result. Unset the credential to use the labelled simulator instead.`,
    },
    { status: 501 },
  );
}

/**
 * Deterministic-looking but obviously fake identifier. The `sim_` prefix is
 * intentional: a simulated id must never be mistaken for a platform id if it
 * leaks into a log, a report, or a screenshot.
 */
export function simulatedId(prefix: string): string {
  return `sim_${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}
