import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

import { AUTODOSS_INVENTORY_TAG } from "@/lib/autodoss/client";

/**
 * Receiver for AutoDoss inventory-change pings. AutoDoss POSTs a small signed
 * payload when a dealership's inventory changes; we verify the signature and
 * bust the cached inventory so the next read re-pulls fresh data.
 *
 * Verified against AUTODOSS_WEBHOOK_SECRET via HMAC-SHA256 over the raw body
 * (X-GetGoGone-Signature header).
 */

function validSignature(rawBody: string, signature: string, secret: string): boolean {
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const expectedBytes = Buffer.from(expected);
  const signatureBytes = Buffer.from(signature);
  return (
    expectedBytes.length === signatureBytes.length &&
    timingSafeEqual(expectedBytes, signatureBytes)
  );
}

export async function POST(request: Request) {
  const secret = process.env.AUTODOSS_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  }

  const signature = request.headers.get("x-getgogone-signature") ?? "";
  const rawBody = await request.text();

  if (!signature || !validSignature(rawBody, signature, secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: { event?: string; dealership_id?: string; change_type?: string } = {};
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (event.event === "inventory.changed") {
    // Next 16 requires a cache-life profile; "max" purges tagged fetch entries.
    revalidateTag(AUTODOSS_INVENTORY_TAG, "max");
  }

  return NextResponse.json({ ok: true });
}
