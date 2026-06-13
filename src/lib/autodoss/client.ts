/**
 * Typed client for the AutoDoss Data API (tmc). This is how GetGoGone reads
 * dealer inventory, customers, and profiles *without* sharing AutoDoss's
 * database. See AutoDoss `docs/getgogone-api.md` for the contract.
 *
 * Configure with:
 *   AUTODOSS_API_URL   e.g. https://autodoss.vercel.app
 *   AUTODOSS_API_KEY   service master key, or a per-dealership key
 */

// ─── Response shapes (mirror of the AutoDoss contract) ───────────────────────

export type AutodossDealer = {
  id: string;
  name: string;
  legal_name: string | null;
  phone: string | null;
  website_url: string | null;
  logo_url: string | null;
  brand_colors: unknown;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  timezone: string;
  updated_at: string;
};

export type AutodossInventoryItem = {
  id: string;
  vehicle_id: string | null;
  vin: string | null;
  stock_number: string | null;
  year: number | null;
  make: string | null;
  model: string | null;
  trim: string | null;
  body_style: string | null;
  mileage: number | null;
  price: number | null;
  down_payment: number | null;
  exterior_color: string | null;
  interior_color: string | null;
  transmission: string | null;
  drivetrain: string | null;
  fuel_type: string | null;
  engine: string | null;
  status: "available" | "pending" | "sold" | "archived";
  featured: boolean;
  description: string | null;
  photos: string[];
  video_url: string | null;
  created_at: string;
  updated_at: string;
};

export type AutodossCustomer = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  status: string;
  source: string | null;
  preferred_contact: string;
  sms_consent: boolean;
  sms_opted_out: boolean;
  email_marketable: boolean;
  last_contacted_at: string | null;
  created_at: string;
  updated_at: string;
};

type ListResponse<T> = { data: T[]; count: number };

export type ListOptions = {
  updatedSince?: string;
  limit?: number;
  offset?: number;
  /** Cache tag for on-demand revalidation when AutoDoss webhooks fire. */
  tags?: string[];
};

export const AUTODOSS_INVENTORY_TAG = "autodoss-inventory";

export function isAutodossConfigured(): boolean {
  return Boolean(process.env.AUTODOSS_API_URL && process.env.AUTODOSS_API_KEY);
}

function buildUrl(path: string, params: Record<string, string | number | undefined>): string {
  const base = process.env.AUTODOSS_API_URL!.replace(/\/$/, "");
  const url = new URL(`${base}${path}`);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") url.searchParams.set(key, String(value));
  }
  return url.toString();
}

async function get<T>(
  path: string,
  params: Record<string, string | number | undefined>,
  tags?: string[],
): Promise<T> {
  const key = process.env.AUTODOSS_API_KEY;
  if (!process.env.AUTODOSS_API_URL || !key) {
    throw new Error("AutoDoss API is not configured (AUTODOSS_API_URL / AUTODOSS_API_KEY).");
  }

  const res = await fetch(buildUrl(path, params), {
    headers: { Authorization: `Bearer ${key}`, Accept: "application/json" },
    // Cache between webhook-driven revalidations; tag lets the receiver bust it.
    next: tags ? { tags } : { revalidate: 60 },
  });

  if (!res.ok) {
    let detail = "";
    try {
      detail = (await res.json())?.error ?? "";
    } catch {
      /* non-JSON error body */
    }
    throw new Error(`AutoDoss ${path} returned ${res.status}${detail ? `: ${detail}` : ""}`);
  }
  return res.json() as Promise<T>;
}

// ─── Endpoints ───────────────────────────────────────────────────────────────

export async function listDealers(options: ListOptions = {}): Promise<AutodossDealer[]> {
  const { data } = await get<ListResponse<AutodossDealer>>("/api/v1/dealers", {
    updated_since: options.updatedSince,
    limit: options.limit,
    offset: options.offset,
  });
  return data;
}

export async function listInventory(
  dealershipId: string,
  options: ListOptions & { status?: AutodossInventoryItem["status"] } = {},
): Promise<AutodossInventoryItem[]> {
  const { data } = await get<ListResponse<AutodossInventoryItem>>(
    "/api/v1/inventory",
    {
      dealership_id: dealershipId,
      status: options.status,
      updated_since: options.updatedSince,
      limit: options.limit,
      offset: options.offset,
    },
    options.tags ?? [AUTODOSS_INVENTORY_TAG],
  );
  return data;
}

export async function listCustomers(
  dealershipId: string,
  options: ListOptions = {},
): Promise<AutodossCustomer[]> {
  const { data } = await get<ListResponse<AutodossCustomer>>("/api/v1/customers", {
    dealership_id: dealershipId,
    updated_since: options.updatedSince,
    limit: options.limit,
    offset: options.offset,
  });
  return data;
}
