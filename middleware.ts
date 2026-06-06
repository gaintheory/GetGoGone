import { NextRequest, NextResponse } from "next/server";

import { COOKIE_NAME, verifyCookieValue } from "@/lib/auth/cookie";

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

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

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
