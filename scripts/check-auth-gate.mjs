#!/usr/bin/env node
/**
 * Verify the site-wide auth gate is actually enforcing.
 *
 * Why this exists: the gate lived at `middleware.ts` in the repository root, where
 * Next.js never loaded it. It failed *silently* — no error, no warning, the app just
 * served every page and every API route to anonymous requests. Nothing in the build,
 * the type checker, or the lint run catches that. Only a live request does.
 *
 * Run against a server that is already up:
 *   node scripts/check-auth-gate.mjs                  # defaults to localhost:3000
 *   node scripts/check-auth-gate.mjs https://your-deployment
 *
 * Exits non-zero if any expectation fails.
 */

const BASE = (process.argv[2] || "http://localhost:3000").replace(/\/$/, "");

// A structurally valid but unsigned cookie: right shape, wrong signature. Proves the
// gate verifies the HMAC rather than merely checking the cookie's presence.
const FORGED_COOKIE = `ggg_auth=${Date.now()}.${"0".repeat(64)}`;

const checks = [
  {
    name: "operator page requires a session",
    path: "/",
    expect: (r) => r.status === 307 || r.status === 302,
    describe: "redirect to /login",
  },
  {
    name: "protected API requires a session",
    path: "/api/agency/clients",
    expect: (r) => r.status === 401,
    describe: "401",
  },
  {
    name: "forged cookie is rejected",
    path: "/",
    headers: { cookie: FORGED_COOKIE },
    expect: (r) => r.status === 307 || r.status === 302,
    describe: "redirect to /login",
  },
  {
    name: "login page stays reachable",
    path: "/login",
    expect: (r) => r.status === 200,
    describe: "200",
  },
  {
    name: "public vehicle page bypasses the gate",
    path: "/v/does-not-exist",
    // 404 is correct here: the gate let it through and the page found no vehicle.
    // A redirect would mean the public prefix stopped working.
    expect: (r) => r.status === 404 || r.status === 200,
    describe: "200 or 404, not a redirect",
  },
  {
    name: "public lead intake bypasses the gate",
    path: "/api/leads/inbound",
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{}",
    // Any non-401 means the gate allowed it through to the handler's own validation.
    expect: (r) => r.status !== 401,
    describe: "not 401",
  },
];

async function main() {
  console.log(`Checking auth gate at ${BASE}\n`);

  let failures = 0;

  for (const check of checks) {
    let result;
    try {
      result = await fetch(`${BASE}${check.path}`, {
        method: check.method || "GET",
        headers: check.headers,
        body: check.body,
        redirect: "manual",
      });
    } catch (error) {
      console.error(`  FAIL  ${check.name}\n        request failed: ${error.message}`);
      failures++;
      continue;
    }

    if (check.expect(result)) {
      console.log(`  ok    ${check.name} (${result.status})`);
    } else {
      console.error(
        `  FAIL  ${check.name}\n` +
        `        expected ${check.describe}, got ${result.status}`
      );
      failures++;
    }
  }

  if (failures > 0) {
    console.error(
      `\n${failures} check(s) failed.\n\n` +
      `If the page checks returned 200, the gate is not enforcing. Two likely causes:\n\n` +
      `  1. DISABLE_AUTH_GATE=true is set in .env.local. That is the intentional\n` +
      `     development bypass — remove the line to restore the password prompt.\n` +
      `     (It is ignored in production builds, so it cannot explain a failure\n` +
      `     against a deployed URL.)\n\n` +
      `  2. The gate is not running at all. Confirm src/proxy.ts exists — beside\n` +
      `     src/app, NOT in the repository root — and exports a function named\n` +
      `     'proxy'. Next.js 16 renamed the middleware convention to proxy.`
    );
    process.exit(1);
  }

  console.log("\nAll checks passed — the auth gate is enforcing.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
