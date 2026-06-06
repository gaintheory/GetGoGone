#!/usr/bin/env node
/**
 * Seed demo agent_proposals for the currently-running dev server.
 *
 * Usage:
 *   node scripts/seed-demo-proposals.mjs
 *
 * What it does:
 *   1. Hits /api/agents/proposals (GET) to learn the current proposal queue.
 *   2. Hits /api/inventory (GET) to learn the current vehicles.
 *   3. POSTs four demo proposals (one per agent type) referencing the first
 *      four real vehicles, using TODAY's date as the source-key suffix so
 *      reruns dedupe naturally.
 *   4. Also creates compliance_history_badge proposals for every vehicle that
 *      has a sourceUrl and doesn't already have one.
 *
 * Notes:
 *   - The dev server enforces the password gate from Phase 0.1. Either run
 *     this from a logged-in browser session by copy/pasting the ggg_auth cookie
 *     into the COOKIE env var, OR set BASE_URL to a deployment that's bypassing
 *     the gate (not recommended).
 *
 *     Example:
 *       COOKIE='ggg_auth=...' node scripts/seed-demo-proposals.mjs
 *
 *   - If CLIENT_ID is set, only that dealership is targeted. Otherwise the
 *     first dealership in the database (alphabetical by created_at) is used.
 */

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const COOKIE = process.env.COOKIE || "";
const CLIENT_ID = process.env.CLIENT_ID || "";

const headers = {
  "Content-Type": "application/json",
  ...(COOKIE ? { Cookie: COOKIE } : {}),
};

const todayKey = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

async function getJSON(path) {
  const res = await fetch(`${BASE_URL}${path}`, { headers });
  if (!res.ok) throw new Error(`${path} → ${res.status} ${res.statusText}`);
  return res.json();
}

async function postJSON(path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${path} → ${res.status} ${JSON.stringify(json)}`);
  return json;
}

const clientParam = CLIENT_ID ? `?clientId=${encodeURIComponent(CLIENT_ID)}` : "";

async function main() {
  console.log(`Seeding demo proposals against ${BASE_URL}…`);

  const [inventory, proposalsResponse] = await Promise.all([
    getJSON(`/api/inventory${clientParam}`),
    getJSON(`/api/agents/proposals${clientParam}`),
  ]);

  const vehicles = inventory?.vehicles || [];
  const existing = proposalsResponse?.proposals || [];

  if (vehicles.length === 0) {
    console.error("No vehicles found. Import inventory first.");
    process.exit(1);
  }

  const top = vehicles.slice(0, 4);

  const baseSeeds = [
    top[0] && {
      sourceKey: `watcher:${top[0].id}:${todayKey}`,
      agentType: "watcher",
      targetType: "vehicle",
      targetId: top[0].id,
      proposalType: "campaign_generation",
      title: `Fresh Intake: Propose ${top[0].year} ${top[0].make} campaign`,
      reasoning: "Lot arrival lacks active campaigns. Proposing a high-intent Craigslist and GBP organic ad bundle.",
      riskLevel: "low",
      proposedPayload: { vehicleId: top[0].id, vehicleName: `${top[0].year} ${top[0].make} ${top[0].model}` },
    },
    top[1] && {
      sourceKey: `spanish_copywriter:${top[1].id}:${todayKey}`,
      agentType: "spanish_copywriter",
      targetType: "vehicle",
      targetId: top[1].id,
      proposalType: "spanish_bilingual_reach",
      title: `Bilingual Outreach: Draft ${top[1].make} Spanish ad`,
      reasoning: "Top search brand in local bilingual demographics has no Spanish campaigns. Proposing a down payment Craigslist spanish copy package.",
      riskLevel: "medium",
      proposedPayload: { vehicleId: top[1].id, vehicleName: `${top[1].year} ${top[1].make} ${top[1].model}` },
    },
    top[2] && {
      sourceKey: `compliance_checker:${top[2].id}:${todayKey}`,
      agentType: "compliance_checker",
      targetType: "campaign_channel",
      targetId: top[2].id,
      proposalType: "compliance_disclaimer_fix",
      title: "FTC Compliance Fix: missing payment disclaimer",
      reasoning: "Ad draft lists payment claim without declaring down payment or financing APR margins, violating FTC Reg Z bounds.",
      riskLevel: "high",
      proposedPayload: { vehicleId: top[2].id, channelId: "craigslist", fixField: "primary_text" },
    },
    top[3] && {
      sourceKey: `creative_refresher:${top[3].id}:${todayKey}`,
      agentType: "creative_refresher",
      targetType: "vehicle",
      targetId: top[3].id,
      proposalType: "creative_overlay_refresh",
      title: `Creative Decay: Refresh ${top[3].make} ad canvas`,
      reasoning: "Visual ad template running 21 days has click-through rate sliding below 1.5%. Proposing overlay template update.",
      riskLevel: "medium",
      proposedPayload: { vehicleId: top[3].id, canvasTemplate: "craigslist_lead_image" },
    },
  ].filter(Boolean);

  const historySeeds = vehicles
    .filter(v => typeof v.sourceUrl === "string" && v.sourceUrl.trim().length > 0)
    .filter(v => !existing.some(p =>
      p.agent_type === "compliance_checker" &&
      p.target_id === String(v.id) &&
      p.proposal_type === "compliance_history_badge"
    ))
    .map(v => ({
      sourceKey: `compliance_history:${v.id}:${todayKey}`,
      agentType: "compliance_checker",
      targetType: "vehicle",
      targetId: v.id,
      proposalType: "compliance_history_badge",
      title: `Compliance: Missing History badge on Craigslist flyer for ${v.year} ${v.make} ${v.model}`,
      reasoning: `Vehicle has a verified history report URL attached (${v.sourceUrl}), but no history badge or QR code overlay is present on its active visual campaign templates.`,
      riskLevel: "medium",
      proposedPayload: { vehicleId: v.id, launchDesigner: true },
    }));

  const allSeeds = [...baseSeeds, ...historySeeds];
  if (allSeeds.length === 0) {
    console.log("Nothing new to seed.");
    return;
  }

  const result = await postJSON("/api/agents/proposals", {
    clientId: CLIENT_ID || null,
    proposals: allSeeds,
  });

  const created = result?.proposals?.length || 0;
  console.log(`Seeded ${created} proposal${created === 1 ? "" : "s"} (${baseSeeds.length} demo + ${historySeeds.length} history).`);
}

main().catch(err => {
  console.error("Seed failed:", err.message || err);
  process.exit(1);
});
