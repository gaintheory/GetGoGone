import { NextResponse } from "next/server";

import {
  fromInspectionSource,
  fromVehiclesTable,
  type VehicleRowWithPhotos,
} from "@/features/inventory/prototype-adapter";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { resolveDealershipId } from "@/lib/dealerships";

async function sourceInventory(supabase: NonNullable<ReturnType<typeof getSupabaseAdmin>>) {
  const { data, error } = await supabase
    .from("inspection_vehicle_source")
    .select("*")
    .order("source_updated_at", { ascending: false, nullsFirst: false });

  if (error) throw error;
  return (data || []).map(fromInspectionSource);
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
          vehicles: (clientVehicles as VehicleRowWithPhotos[]).map(fromVehiclesTable),
        });
      }

      // 3. Fallback to demo seeds only if table is completely empty and it is the default dealership
      const defaultClientId = await resolveDealershipId(supabase, null);
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
