import { NextResponse } from "next/server";

import { mapSourceVehicleToPrototypeVehicle } from "@/features/inventory/prototype-adapter";
import { getLocalVehicleImageMap } from "@/features/inventory/local-images";
import type { Tables } from "@/lib/database.types";
import { getSupabaseAdmin } from "@/lib/supabase/server";

type VehicleRow = Tables<"vehicles">;

const palettes: Record<string, string[]> = {
  sedan: ["#64748b", "#334155", "#cbd5e1"],
  truck: ["#1e293b", "#0f172a", "#cbd5e1"],
  suv: ["#0f766e", "#0f172a", "#cbd5e1"],
  van: ["#475569", "#1e293b", "#cbd5e1"],
};

function normalizeBody(body?: string | null): string {
  const value = (body || "").toLowerCase();
  if (value.includes("truck") || value.includes("pickup")) return "truck";
  if (value.includes("suv") || value.includes("utility")) return "suv";
  if (value.includes("van")) return "van";
  return "sedan";
}

type VehicleRowWithPhotos = VehicleRow & {
  vehicle_photos?: {
    storage_path: string;
    is_primary: boolean;
    position: number;
  }[];
};

function mapVehicleRowToPrototypeVehicle(row: VehicleRowWithPhotos) {
  const body = normalizeBody(row.body_style);
  
  // Find primary photo or lowest sequence photo from imported photos
  let imageUrl = null;
  const photosCount = row.vehicle_photos?.length || 0;
  let photosList: string[] = [];
  if (row.vehicle_photos && photosCount > 0) {
    const sorted = [...row.vehicle_photos].sort((a, b) => a.position - b.position);
    const primary = row.vehicle_photos.find(p => p.is_primary) || sorted[0];
    imageUrl = primary?.storage_path || null;
    photosList = sorted.map(p => p.storage_path);
  }
  
  if (!imageUrl) {
    imageUrl = getLocalVehicleImageMap().get(row.vin.toUpperCase()) || null;
  }

  if (imageUrl && photosList.length === 0) {
    photosList = [imageUrl];
  }

  return {
    id: row.id,
    stock: row.stock_number || row.source_record_id || "INV",
    year: row.year || "",
    make: row.make || "Unknown",
    model: row.model || "Vehicle",
    trim: row.trim || "",
    body,
    color: row.exterior_color || "",
    palette: palettes[body],
    price: row.price || 0,
    down: row.down_payment || 0,
    weekly: 0,
    monthly: 0,
    mileage: row.mileage || 0,
    vin: row.vin,
    imageUrl,
    images: photosList,
    photosList,
    sourceUrl: row.source_url,
    status: row.status === "active" ? "Active" : row.status,
    campaign: "Draft",
    daysIn: 0,
    leads: 0,
    photos: photosCount || (imageUrl ? 1 : 0),
    features: [],
    notes: row.notes || row.description || "",
    sourceSystem: row.source_system || "getgogone_vehicles",
    sourceRecordId: row.source_record_id,
  };
}

async function firstDealershipId(supabase: NonNullable<ReturnType<typeof getSupabaseAdmin>>) {
  const { data, error } = await supabase
    .from("dealerships")
    .select("id")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data?.id || null;
}

async function sourceInventory(supabase: NonNullable<ReturnType<typeof getSupabaseAdmin>>) {
  const { data, error } = await supabase
    .from("inspection_vehicle_source")
    .select("*")
    .order("source_updated_at", { ascending: false, nullsFirst: false });

  if (error) throw error;
  return (data || []).map(mapSourceVehicleToPrototypeVehicle);
}

export async function GET(request: Request) {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return NextResponse.json({
      configured: false,
      vehicles: [],
      error: "Supabase environment variables are not configured.",
    });
  }

  const clientId = new URL(request.url).searchParams.get("clientId");

  try {
    if (clientId) {
      const includeArchived = new URL(request.url).searchParams.get("includeArchived") === "true";
      let query = supabase
        .from("vehicles")
        .select(`
          *,
          vehicle_photos (
            storage_path,
            is_primary,
            position
          )
        `)
        .eq("dealership_id", clientId);
      
      if (!includeArchived) {
        query = query.neq("status", "archived");
      }

      const { data: clientVehicles, error: vehicleError } = await query.order("updated_at", { ascending: false });

      if (vehicleError) throw vehicleError;

      // 2. If we have live vehicles, return them immediately
      if (clientVehicles && clientVehicles.length > 0) {
        return NextResponse.json({
          configured: true,
          source: "GetGoGone vehicles",
          vehicles: (clientVehicles as any[]).map(mapVehicleRowToPrototypeVehicle),
        });
      }

      // 3. Fallback to demo seeds only if table is completely empty and it is the default dealership
      const defaultClientId = await firstDealershipId(supabase);
      if (defaultClientId && clientId === defaultClientId) {
        return NextResponse.json({
          configured: true,
          source: "Supabase inspections",
          vehicles: await sourceInventory(supabase),
        });
      }

      // 4. Return empty if no fallbacks apply
      return NextResponse.json({
        configured: true,
        source: "GetGoGone vehicles",
        vehicles: [],
      });
    }

    return NextResponse.json({
      configured: true,
      source: "Supabase inspections",
      vehicles: await sourceInventory(supabase),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load inventory.";
    return NextResponse.json(
      { configured: true, vehicles: [], error: message },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: "Supabase not configured" }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const action = searchParams.get("action") || "delete"; // "delete" or "archive"

  if (!id) {
    return NextResponse.json({ ok: false, error: "Vehicle ID is required" }, { status: 400 });
  }

  const isSource = String(id).startsWith("source-");

  try {
    if (isSource) {
      const numericId = Number(String(id).replace("source-", ""));
      // For source vehicles, delete from inspections table
      const { error } = await supabase
        .from("inspections")
        .delete()
        .eq("id", numericId);
      
      if (error) throw error;
      return NextResponse.json({ ok: true, id, action: action === "archive" ? "archive" : "delete" });
    } else {
      if (action === "archive") {
        const { data, error } = await supabase
          .from("vehicles")
          .update({ status: "archived", updated_at: new Date().toISOString() })
          .eq("id", id)
          .select("*")
          .single();
        
        if (error) throw error;
        return NextResponse.json({ ok: true, vehicle: data, action: "archive" });
      } else {
        const { error } = await supabase
          .from("vehicles")
          .delete()
          .eq("id", id);
        
        if (error) throw error;
        return NextResponse.json({ ok: true, id, action: "delete" });
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Database operation failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
