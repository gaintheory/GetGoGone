/**
 * Inventory Intake Layer — Shared Types
 *
 * Every inventory source (ZIP kit, CSV, CarsForSale API, manual entry, etc.)
 * must produce a VehicleImportRecord. The shared pipeline consumes only this
 * shape — it never knows or cares which adapter produced it.
 */

// ─── Source Systems ───────────────────────────────────────────────────────────

export type IntakeSourceSystem =
  | "zip_kit"          // CarsForSale ZIP kit export (Right Price Auto Sales — current)
  | "csv"              // Generic dealer CSV export (configurable field map)
  | "carsforsale_api"  // CarsForSale API (future — pending access grant)
  | "manual"           // Operator-entered single vehicle
  | "vin_decode"       // VIN-only entry enriched via NHTSA
  | "other";           // Catch-all for future adapters

// ─── Photo Roles ──────────────────────────────────────────────────────────────

export type VehiclePhotoRole =
  | "primary"        // Lead photo shown in ads and Designer base layer
  | "gallery"        // Additional lot/detail photos (numbered -2 through -11 in ZIP kits)
  | "detail_card"    // CarsForSale-generated spec card image (-Details.jpg)
  | "highlight_card" // CarsForSale-generated hero card with price + contact (-Highlight.jpg)
  | "other";

export type VehicleImportPhoto = {
  role: VehiclePhotoRole;
  /** External CDN or web URL — used for API-sourced photos */
  sourceUrl?: string;
  /** Absolute local filesystem path — used for ZIP/CSV sources */
  localPath?: string;
  /** Display order (0 = primary, 1+ = gallery) */
  sequence: number;
  /** Optional OCR or label text attached to this photo */
  caption?: string;
};

// ─── Core Import Record ───────────────────────────────────────────────────────

/**
 * The normalized shape every adapter must produce.
 * All fields except `sourceSystem` are optional — the pipeline validates
 * minimum requirements (VIN or stockNumber) before committing.
 */
export type VehicleImportRecord = {
  // ── Source provenance ──────────────────────────────────────────────────────
  sourceSystem: IntakeSourceSystem;
  /** Source-system's own identifier (stock number, external ID, etc.) */
  sourceId?: string;
  /** Direct URL to the source listing, if available */
  sourceUrl?: string;
  /** ISO timestamp when this data was fetched from the source */
  sourceFetchedAt?: string;
  /** Raw source data preserved for debugging and audit */
  rawData?: Record<string, unknown>;

  // ── Identity ───────────────────────────────────────────────────────────────
  /** Full 17-character VIN. Primary dedup key. */
  vin?: string;
  /** Dealer stock number. Secondary dedup key when VIN is unavailable. */
  stockNumber?: string;

  // ── Vehicle specs ──────────────────────────────────────────────────────────
  year?: number;
  make?: string;
  model?: string;
  trim?: string;
  bodyStyle?: string;
  mileage?: number;
  exteriorColor?: string;
  interiorColor?: string;
  condition?: "used" | "new" | "certified";
  fuelType?: string;
  transmission?: string;
  drivetrain?: string;
  /** Full engine string e.g. "3.6L V6 285hp 260ft.lbs." */
  engine?: string;
  mpgCity?: number;
  mpgHighway?: number;

  // ── Pricing ────────────────────────────────────────────────────────────────
  /** Advertised sale price in USD */
  price?: number;
  /**
   * Manager-approved ad down payment in USD.
   * Left undefined when not confirmed — copy system uses safe fallback labels.
   * NEVER infer or guess this value.
   */
  downPayment?: number;

  // ── Content ────────────────────────────────────────────────────────────────
  /** Full marketing description (from Info.txt or CSV description field) */
  description?: string;
  /** Internal notes not shown publicly */
  notes?: string;

  // ── Photos ─────────────────────────────────────────────────────────────────
  photos?: VehicleImportPhoto[];
};

// ─── Import Run Result ────────────────────────────────────────────────────────

export type ImportRowResult = {
  stockNumber?: string;
  vin?: string;
  make?: string;
  model?: string;
  year?: number;
  action: "inserted" | "updated" | "skipped" | "error";
  vehicleId?: string;
  photosImported?: number;
  warnings?: string[];
  error?: string;
};

export type ImportRunResult = {
  runId: string;
  dealershipId: string;
  sourceSystem: IntakeSourceSystem;
  startedAt: string;
  finishedAt: string;
  totalRecords: number;
  inserted: number;
  updated: number;
  skipped: number;
  errors: number;
  rows: ImportRowResult[];
};

// ─── Import Options ───────────────────────────────────────────────────────────

export type ImportPipelineOptions = {
  /**
   * When true, validate and report results but do not write to the database.
   * Useful for the import review screen preview step.
   */
  dryRun?: boolean;
  /**
   * When true, overwrite existing vehicle fields with new values.
   * When false (default), only fill in fields that are currently null/empty.
   */
  overwriteExisting?: boolean;
  /**
   * When true, skip VIN enrichment from NHTSA even when VIN is present.
   * Useful when the source already has complete, trusted specs.
   */
  skipVinEnrichment?: boolean;
};
