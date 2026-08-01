/**
 * Site-wide auth gate.
 *
 * LOCATION MATTERS. This file must live at `src/proxy.ts` — beside `src/app`, not
 * at the repository root. It was previously `middleware.ts` in the project root,
 * where Next.js never loaded it, so the gate silently did not run and every page
 * and API route was publicly reachable without a session.
 *
 * NAME MATTERS TOO. Next.js 16 renamed the `middleware` file convention to `proxy`
 * and the exported `middleware` function to `proxy`
 * (node_modules/next/dist/docs/01-app/02-guides/upgrading/version-16.md).
 * The `proxy` runtime is always `nodejs` and cannot be configured to `edge`.
 *
 * If you move or rename this file, re-run the check in scripts/check-auth-gate.mjs.
 */

import { NextRequest, NextResponse } from "next/server";

import { COOKIE_NAME, verifyCookieValue } from "@/lib/auth/cookie";

/**
 * Local development escape hatch: set DISABLE_AUTH_GATE=true in .env.local to skip
 * the password prompt entirely while working on the app.
 *
 * This is hard-wired off in production. `NODE_ENV` is set to "production" by
 * `next build` / `next start` and by every hosting platform, and it is not settable
 * from .env.local in a way that survives a production build — so this flag cannot
 * open a deployed site no matter how the environment is configured. That guard is
 * the whole reason this is safe to have: an unguarded bypass is precisely the bug
 * that left every route public before.
 */
const AUTH_GATE_DISABLED =
  process.env.NODE_ENV !== "production" &&
  process.env.DISABLE_AUTH_GATE === "true";

let warnedAboutDisabledGate = false;

// Paths that bypass auth entirely.
const PUBLIC_PATHS = new Set<string>([
  "/login",
  "/api/auth/login",
  "/api/auth/logout",
  "/favicon.ico",
  "/robots.txt",
]);

// API webhooks and public-facing endpoints that must remain reachable
// without a session cookie. Use prefix matching.
const PUBLIC_API_PREFIXES: string[] = [
  "/api/leads/inbound",       // public web-inquiry form posts here
  "/api/autodoss/webhook",    // AutoDoss inventory pings; verified by HMAC signature
  // "/api/inventory/webhook", // intentionally still gated until Phase 4.2
];

// Page paths that must be reachable without a session cookie (public landing pages).
const PUBLIC_PAGE_PREFIXES: string[] = [
  "/v/",                      // /v/<vehicleId> public vehicle inquiry pages
];

function isStaticAsset(pathname: string): boolean {
  if (pathname.startsWith("/_next/")) return true;
  if (pathname.startsWith("/static/")) return true;
  // File extension allowlist for things served from /public
  if (/\.(?:png|jpe?g|gif|svg|webp|ico|css|js|map|woff2?|ttf|otf|txt)$/i.test(pathname)) {
    return true;
  }
  return false;
}

function isPublic(pathname: string): boolean {
  if (PUBLIC_PATHS.has(pathname)) return true;
  if (isStaticAsset(pathname)) return true;
  for (const prefix of PUBLIC_API_PREFIXES) {
    if (pathname === prefix || pathname.startsWith(prefix + "/")) return true;
  }
  for (const prefix of PUBLIC_PAGE_PREFIXES) {
    if (pathname.startsWith(prefix)) return true;
  }
  return false;
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (AUTH_GATE_DISABLED) {
    if (!warnedAboutDisabledGate) {
      warnedAboutDisabledGate = true;
      console.warn(
        "\n  ⚠  AUTH GATE DISABLED — DISABLE_AUTH_GATE=true is set in development.\n" +
        "     Every page and API route is served without a session.\n" +
        "     Remove it from .env.local to restore the password prompt.\n"
      );
    }
    return NextResponse.next();
  }

  if (isPublic(pathname)) {
    return NextResponse.next();
  }

  const cookie = request.cookies.get(COOKIE_NAME)?.value;
  if (await verifyCookieValue(cookie)) {
    return NextResponse.next();
  }

  // Unauthenticated.
  // API routes get a JSON 401. Page routes get redirected to /login.
  if (pathname.startsWith("/api/")) {
    return NextResponse.json(
      { ok: false, error: "unauthenticated" },
      { status: 401 }
    );
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/login";
  // Preserve where the user was trying to go so we can bounce them back after login
  loginUrl.search = `?next=${encodeURIComponent(pathname + search)}`;
  return NextResponse.redirect(loginUrl);
}

export const config = {
  // Run on everything except the Next internals we already short-circuit above.
  // Keeping this broad on purpose — the isPublic() check is the real gate.
  matcher: ["/((?!_next/static|_next/image).*)"],
};
