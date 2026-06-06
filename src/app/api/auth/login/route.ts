import { NextResponse } from "next/server";

import {
  COOKIE_NAME,
  COOKIE_MAX_AGE_SECONDS,
  issueCookieValue,
} from "@/lib/auth/cookie";

// Constant-time string compare implemented against Uint8Arrays so the same
// route runs in both Node and Edge runtimes.
function constantTimeEquals(a: string, b: string): boolean {
  const encoder = new TextEncoder();
  const aBytes = encoder.encode(a);
  const bBytes = encoder.encode(b);
  const len = Math.max(aBytes.length, bBytes.length);
  let diff = aBytes.length ^ bBytes.length;
  for (let i = 0; i < len; i++) {
    const av = i < aBytes.length ? aBytes[i] : 0;
    const bv = i < bBytes.length ? bBytes[i] : 0;
    diff |= av ^ bv;
  }
  return diff === 0;
}

export async function POST(request: Request) {
  let body: { password?: string } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid request." },
      { status: 400 }
    );
  }

  const expected = process.env.SITE_PASSWORD;
  if (!expected) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "SITE_PASSWORD is not configured on the server. Set it in .env.local.",
      },
      { status: 500 }
    );
  }

  const provided = typeof body.password === "string" ? body.password : "";

  // Slow brute-force attempts a bit. Cheap; not a substitute for rate limiting.
  await new Promise((resolve) => setTimeout(resolve, 300));

  if (!constantTimeEquals(provided, expected)) {
    return NextResponse.json(
      { ok: false, error: "Wrong password." },
      { status: 401 }
    );
  }

  const cookieValue = await issueCookieValue();
  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: COOKIE_NAME,
    value: cookieValue,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: COOKIE_MAX_AGE_SECONDS,
  });

  return response;
}
