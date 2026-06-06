import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

type Supabase = SupabaseClient<Database>;

/**
 * Resolve the dealership UUID to use for a request.
 *
 * Rules:
 *   - If `clientId` is a non-empty string AND not the `"agency_overview"`
 *     sentinel, return it as-is. Caller is expected to validate it's a real
 *     dealership downstream via FK / .eq filter.
 *   - Otherwise, return the first dealership in the database, ordered by
 *     created_at ascending. Returns `null` only if zero dealerships exist.
 *
 * Throws on Supabase errors. Callers should surface a 500 in that case.
 *
 * This is the single source of truth for the legacy patchwork of
 * resolveClientId / resolveDealershipId / firstDealershipId / getFirstDealershipId
 * helpers that used to live in every route.
 */
export async function resolveDealershipId(
  supabase: Supabase,
  clientId?: string | null,
): Promise<string | null> {
  if (clientId && clientId.trim() && clientId !== "agency_overview") {
    return clientId;
  }

  const { data, error } = await supabase
    .from("dealerships")
    .select("id")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data?.id ?? null;
}

/**
 * Like `resolveDealershipId`, but creates a default dealership if zero exist.
 * Use this only from write endpoints that genuinely need a dealership to exist
 * (campaigns, creative-templates, brand-brain). Read endpoints should use
 * `resolveDealershipId` and surface "no dealership configured" themselves.
 *
 * If a non-"agency_overview" clientId is passed, the function additionally
 * verifies that dealership exists before returning it.
 */
export async function ensureDealershipId(
  supabase: Supabase,
  clientId?: string | null,
): Promise<string> {
  if (clientId && clientId.trim() && clientId !== "agency_overview") {
    const { data, error } = await supabase
      .from("dealerships")
      .select("id")
      .eq("id", clientId)
      .maybeSingle();
    if (error) throw error;
    if (data?.id) return data.id;
  }

  const { data: existing, error: selectError } = await supabase
    .from("dealerships")
    .select("id")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (selectError) throw selectError;
  if (existing?.id) return existing.id;

  const { data: created, error: insertError } = await supabase
    .from("dealerships")
    .insert({
      name: process.env.GETGOGONE_DEFAULT_DEALERSHIP_NAME || "Right Price Auto Sales",
    })
    .select("id")
    .single();

  if (insertError) throw insertError;
  return created.id;
}
