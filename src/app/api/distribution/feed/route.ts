import { NextRequest, NextResponse } from "next/server";

import {
  isAutodossConfigured,
  listDealers,
  listInventory,
  type AutodossInventoryItem,
} from "@/lib/autodoss/client";

/**
 * Distribution feed engine (2026-06 redesign).
 *
 * Emits a per-platform vehicle feed from AutoDoss inventory so platforms can
 * auto-generate a dynamic ad per vehicle (rather than hand-posting each car).
 * Read-only: pulls from the AutoDoss Data API, maps to the platform schema.
 *
 *   GET /api/distribution/feed?platform=meta&dealership_id=<id>&format=json|csv
 *
 * Supported platforms (initial): `meta` (Advantage+ Automotive Inventory Ads).
 * `google` (Vehicle Ads) and `marketplace` mappers are stubbed for the next pass.
 *
 * Until AUTODOSS_API_URL / AUTODOSS_API_KEY are set this returns 503 with a clear
 * shape — nothing here writes or publishes; that's a later, gated step.
 */

type FeedPlatform = "meta" | "google" | "marketplace";

// Meta Automotive Inventory Ads — minimal required vehicle fields.
// https://developers.facebook.com/docs/marketing-api/catalog/reference (auto)
function toMetaVehicle(item: AutodossInventoryItem, dealershipName: string) {
  const title = [item.year, item.make, item.model, item.trim].filter(Boolean).join(" ");
  return {
    vehicle_id: item.id,
    vin: item.vin || undefined,
    title: title || "Vehicle",
    description: item.description || title,
    make: item.make || "",
    model: item.model || "",
    year: item.year || undefined,
    mileage: item.mileage != null ? { value: item.mileage, unit: "MI" } : undefined,
    price: item.price != null ? `${item.price} USD` : undefined,
    state_of_vehicle: "USED",
    exterior_color: item.exterior_color || undefined,
    transmission: item.transmission || undefined,
    fuel_type: item.fuel_type || undefined,
    drivetrain: item.drivetrain || undefined,
    availability: item.status === "available" ? "AVAILABLE" : "NOT_AVAILABLE",
    image: (item.photos || []).map((url) => ({ url })),
    dealer_name: dealershipName,
    // url is set per-campaign with UTM tags at publish time
  };
}

function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headers = Array.from(
    rows.reduce((set, r) => {
      Object.keys(r).forEach((k) => set.add(k));
      return set;
    }, new Set<string>()),
  );
  const escape = (v: unknown) => {
    if (v == null) return "";
    const s = typeof v === "object" ? JSON.stringify(v) : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [headers.join(",")];
  for (const r of rows) lines.push(headers.map((h) => escape(r[h])).join(","));
  return lines.join("\n");
}

export async function GET(req: NextRequest) {
  const platform = (req.nextUrl.searchParams.get("platform") || "meta") as FeedPlatform;
  const format = req.nextUrl.searchParams.get("format") || "json";
  const dealershipParam = req.nextUrl.searchParams.get("dealership_id");

  if (!isAutodossConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        configured: false,
        error: "AutoDoss Data API not configured (AUTODOSS_API_URL / AUTODOSS_API_KEY).",
        hint: "This feed reads live inventory from AutoDoss; set those env vars to enable it.",
      },
      { status: 503 },
    );
  }

  if (platform !== "meta") {
    return NextResponse.json(
      { ok: false, error: `Platform "${platform}" feed mapper not implemented yet (meta only).` },
      { status: 501 },
    );
  }

  try {
    const dealers = await listDealers({ limit: 1 });
    const dealershipId = dealershipParam || dealers[0]?.id;
    const dealershipName = dealers.find((d) => d.id === dealershipId)?.name || "Dealership";
    if (!dealershipId) {
      return NextResponse.json({ ok: false, error: "No dealership available." }, { status: 404 });
    }

    const items = await listInventory(dealershipId, { status: "available" });
    const rows = items.map((i) => toMetaVehicle(i, dealershipName));

    if (format === "csv") {
      return new NextResponse(toCsv(rows as Record<string, unknown>[]), {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="meta-vehicle-feed.csv"`,
        },
      });
    }

    return NextResponse.json({ ok: true, platform: "meta", count: rows.length, data: rows });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Feed generation failed.";
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}
