import { notFound } from "next/navigation";

import { getSupabaseAdmin } from "@/lib/supabase/server";

import InquiryForm from "./InquiryForm";

type Params = { vehicleId: string };

type SearchParams = {
  ch?: string;          // channel slug ("facebook_paid", "craigslist", ...)
  c?: string;           // campaign id
  cc?: string;          // campaign_channel id
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
};

async function loadVehicle(vehicleId: string) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  const client = supabase as any;
  const { data, error } = await client
    .from("vehicles")
    .select(`
      id, vin, stock_number, year, make, model, trim, body_style,
      mileage, price, down_payment, exterior_color, interior_color,
      description, status, dealership_id,
      vehicle_photos ( storage_path, is_primary, position )
    `)
    .eq("id", vehicleId)
    .maybeSingle();

  if (error || !data) return null;
  if (data.status === "archived") return null;
  return data;
}

function dollars(n: number | null | undefined): string {
  if (n == null) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

function miles(n: number | null | undefined): string {
  if (n == null) return "—";
  return `${n.toLocaleString()} mi`;
}

export default async function VehicleLandingPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<SearchParams>;
}) {
  const { vehicleId } = await params;
  const search = await searchParams;
  const vehicle = await loadVehicle(vehicleId);
  if (!vehicle) notFound();

  const photos = (vehicle.vehicle_photos || [])
    .sort((a: any, b: any) => a.position - b.position)
    .map((p: any) => p.storage_path);
  const primary = photos[0] || null;

  const title = [vehicle.year, vehicle.make, vehicle.model, vehicle.trim].filter(Boolean).join(" ");

  const utm = {
    utm_source: search.utm_source || null,
    utm_medium: search.utm_medium || null,
    utm_campaign: search.utm_campaign || null,
    utm_term: search.utm_term || null,
    utm_content: search.utm_content || null,
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#f8fafc",
      color: "#0f172a",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    }}>
      <header style={{
        background: "#0f172a",
        color: "#fff",
        padding: "12px 20px",
        display: "flex",
        alignItems: "center",
        gap: 10,
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: "#1f2937", display: "grid", placeItems: "center",
          fontWeight: 800, fontSize: 12, letterSpacing: 0.5,
          border: "1px solid rgba(255,255,255,0.08)",
        }}>
          G<span style={{ color: "#38bdf8" }}>•</span>G
        </div>
        <div style={{ fontWeight: 600, fontSize: 14 }}>Vehicle inquiry</div>
      </header>

      <main style={{ maxWidth: 980, margin: "0 auto", padding: "32px 20px", display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 28 }}>
        <section>
          {primary ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={primary}
              alt={title}
              style={{ width: "100%", aspectRatio: "16/10", objectFit: "cover", borderRadius: 12, background: "#e2e8f0" }}
            />
          ) : (
            <div style={{ width: "100%", aspectRatio: "16/10", borderRadius: 12, background: "#e2e8f0", display: "grid", placeItems: "center", color: "#64748b", fontSize: 13 }}>
              No photo on file
            </div>
          )}

          <h1 style={{ margin: "20px 0 6px", fontSize: 26, fontWeight: 700 }}>{title}</h1>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", color: "#475569", fontSize: 13, marginBottom: 18 }}>
            {vehicle.stock_number && <span>Stock #{vehicle.stock_number}</span>}
            {vehicle.exterior_color && <span>{vehicle.exterior_color}</span>}
            <span>{miles(vehicle.mileage)}</span>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: 10,
            background: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: 12,
            padding: 16,
            marginBottom: 20,
          }}>
            <div>
              <div style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>Price</div>
              <div style={{ fontSize: 22, fontWeight: 700 }}>{dollars(vehicle.price)}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>Down payment</div>
              <div style={{ fontSize: 22, fontWeight: 700 }}>{vehicle.down_payment ? dollars(vehicle.down_payment) : "Ask"}</div>
            </div>
          </div>

          {vehicle.description && (
            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 16, fontSize: 13.5, lineHeight: 1.6, color: "#334155" }}>
              {vehicle.description}
            </div>
          )}
        </section>

        <aside>
          <div style={{
            position: "sticky",
            top: 20,
            background: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: 12,
            padding: 20,
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          }}>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Check availability</div>
            <div style={{ fontSize: 12.5, color: "#64748b", marginBottom: 16 }}>
              Send us your info and we&apos;ll reply with availability, financing options, and a test-drive window.
            </div>
            <InquiryForm
              vehicleId={vehicle.id}
              vehicleTitle={title}
              sourceChannel={search.ch || null}
              campaignId={search.c || null}
              campaignChannelId={search.cc || null}
              utm={utm}
            />
          </div>
        </aside>
      </main>

      <footer style={{ borderTop: "1px solid #e2e8f0", padding: "16px 20px", textAlign: "center", fontSize: 11.5, color: "#94a3b8" }}>
        Subject to availability. Financing subject to approval of credit (WAC).
      </footer>
    </div>
  );
}
