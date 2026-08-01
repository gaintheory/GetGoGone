# Integrations

Initial integration priorities:
1. Carsforsale/MyCommandCenter inventory import or sync
2. Meta paid ads support for Facebook and Instagram
3. Google Business Profile posts
4. Craigslist export/posting package
5. LinkedIn company page and commercial vehicle campaigns
6. SMS provider
7. Email provider
8. Credit application portal

Integration rule:
If direct publishing is restricted, GetGoGone should still produce a structured posting package: copy, creative, destination link, checklist, and posting activity record.

## Supabase

The project is linked to the dealership Supabase project via Supabase CLI metadata in `supabase/.temp/`.

Current status:
- Type generation works with `npx supabase gen types typescript --linked`.
- Generated database types are stored at `src/lib/database.types.ts`.
- `npx supabase db pull` currently cannot run in this environment because the Supabase CLI requires Docker for remote schema dumps, and Docker is not available/running here.
- `npx supabase db push` successfully applied the GetGoGone core schema migration to the linked project.
- `supabase/migrations/20260520043239_remote_schema.sql` is an empty migration file created during the earlier pull attempt and recorded during push. Keep it unless migration history is intentionally repaired.

Use the existing database as a source system first. Add GetGoGone-specific tables through migrations once the schema extension is finalized.

## Public Website Photo Sync

Right Price Auto Sales public inventory:
`https://www.rightpriceautosales.net/cars-for-sale`

Initial approach:
- Treat the public site as a read-only photo/source helper, not the system of record.
- Crawl inventory pages for `/Inventory/Details/{guid}` URLs.
- Fetch detail pages and match by VIN first, stock number second.
- Extract public image URLs and store them as source URLs before deciding whether to download/copy images into Supabase Storage.
- Keep detail URL, VIN, stock number, image URL, and crawl timestamp together for traceability.

Spike script:
`scripts/carsforsale-photo-spike.mjs`

This script is read-only and prints detected detail pages, identifiers, and candidate image URLs. It does not write to Supabase.

Current finding:
Plain server-side HTTP requests from this environment receive `403 Forbidden` from `rightpriceautosales.net`, even with browser-like headers. The page is still visible through normal browser/search-rendered access, so a production photo sync should not assume simple `fetch` will work from the app server. Next options are:
- ask Carsforsale/MyCommandCenter for a dealer feed/API/export that includes photo URLs;
- use a controlled browser-rendered scraper for owner-approved one-off syncs;
- support manual CSV/photo URL import as a fallback.

Local photo fallback:
VIN-named images can be placed in `public/images/vehicles`. The API maps the first file matching `{VIN}.jpg` or `{VIN}_n.jpg` to the live Supabase vehicle with the same VIN and returns it as `imageUrl`. This is a practical bridge until an automated feed or browser-based photo sync is implemented.

## Inventory Intake Architecture (Adapter-Based Layer)

We have implemented a multi-channel inventory intake framework to unify imports from any source (ZIP files, CSVs, live APIs, and manual additions). This is modularly decoupled from the rest of the application so that any new dealer import method can be added as a standard plug-and-play adapter.

### The Unified Import Shape

Regardless of the source channel, every adapter normalizes its data into a standard `VehicleImportRecord` containing:
- **Providence fields:** `sourceSystem`, `sourceId`, `sourceUrl`, `sourceFetchedAt`, `rawData`
- **Identity specs:** `vin` (primary de-duplication key), `stockNumber` (secondary key)
- **Specifications:** `year`, `make`, `model`, `trim`, `bodyStyle`, `mileage`, `exteriorColor`, `interiorColor`, `engine`, `transmission`, `drivetrain`, `fuelType`, `mpgCity`, `mpgHighway`
- **Dealer financial controls:** `price`, `downPayment` (requires manual confirmation)
- **Content:** `description`, `notes`
- **Media mapping:** `photos` collection with custom roles (`primary`, `gallery`, `detail_card`, `highlight_card`)

### Adapter 1: CarsForSale ZIP Kit Parser + OCR

Because MyCommandCenter (CarsForSale) does not support direct CSV downloads, we have engineered a sophisticated local ZIP kit ingestion pipeline:
1. **Filename Split:** Extracts `year`, `make`, `model`, and `stockNumber` from standard formatted names like `2016_Jeep_Wrangler_Unlimited_17176_20260522.zip`.
2. **Title Ingestion:** Parses `-Info.txt` to isolate the first-line full vehicle title and deduce the `trim` field, while loading the rest as the advertisement text.
3. **Spec OCR Extraction:** Since the specs are generated into a static image card (`-Details.jpg`), the adapter initializes an inline, purely JavaScript-based WebAssembly Tesseract.js worker to OCR-scan the specs. Regex matching extracts the actual `Price`, `Mileage`, `VIN`, `Stock#`, `Transmission`, `Drivetrain`, `Exterior Color`, `Interior Color`, `Fuel`, and `MPG` values.
4. **Media Mapping:** Re-sequences local photos, allocating the `-1.jpg` as the primary marketing thumbnail and registering `-Details.jpg` and `-Highlight.jpg` with their designated roles.

### Adapter 2: Configurable CSV Mapping Ingestion
For lots that export structured inventory data (e.g. CDK, Reynolds & Reynolds, DealerSocket, or vAuto), we integrated a customizable CSV ingestion mapping pipeline:
1. **Dynamic Synonyms Auto-Detection:** PapaParse extracts fields, and the adapter uses predefined keyword synonyms to automatically map imported columns (e.g. mapping `Miles`/`Odometer` to `mileage`, `MSRP`/`Retail` to `price`).
2. **Persistent Column-Mapping Memory:** Mapping selections are stored in the database's `integrations` table under the dealership's active profile, so column relationships are remembered and auto-applied on future uploads.
3. **Smart Image Stream Parsing:** Splits comma-, semicolon-, or pipe-delimited photo URL fields from a single column (e.g., `url1.jpg|url2.jpg`) into individual `primary` and `gallery` images, uploading them automatically.

### Adapter 3: Manual Entry & NHTSA VIN Ingest
For one-off listings or dealers without exports, we implemented a custom manual input interface:
1. **Instant NHTSA Spec Autofill:** Entering a 17-character VIN triggers an asynchronous client fetch to `/api/inventory/import/vin`, which queries the public US Gov NHTSA vPIC API to decode and return 9 key specifications (Year, Make, Model, Trim, Body, Engine, Transmission, Drivetrain, Fuel Type) instantly prefilling the UI.
2. **Manual Pipeline Integration:** Submissions route through `/api/inventory/import/manual` which normalizes fields to standard types, validates VIN compliance, and inserts the record via the shared intake pipeline.

### Adapter 4: Video Commercial Studio & Google Omni Handoff
To support automated visual promotions on modern ad platforms, we developed a cinematic video storyboarding and mock rendering pipeline:
1. **Interactive Script & Strategy API:** Calls `/api/video/script` to load client brand brains and specifications, creating timed hook, walkaround, and Regulation Z disclaimer text assets.
2. **Shot-by-Shot Storyboard Engine:** Calls `/api/video/storyboard` to automatically map dialogue sections to structured scenes, generating Google Omni visual prompts (text-to-video instructions), text overlays, and camera pacing triggers.
3. **Interactive Visual Mock Render:** Renders a simulated canvas combining the active lot vehicle's photo with animated sliding pans, visual card subtitles, and timed captions matching the progress timeline.
4. **Mock Compiler Integration:** Calls `/api/video/compile` to packaging storyboard outputs, uploading the MP4 manifest to Supabase Storage, and appending `video_asset` records to `campaign_assets` libraries.

### Shared Import Pipeline

The core engine (`pipeline.ts`) runs all normalized adapter records through standard validations:
- **Validation:** Ensures a valid 17-character VIN or stock number exists before allowing ingestion.
- **VIN Decodes:** Performs free, real-time spec enrichment from the official NHTSA vPIC API for sparse fields.
- **De-duplication:** Automatically resolves upserts. If the vehicle VIN/stock number exists under the active dealer, it selectively patches only missing/null database columns unless an overwrite is requested.
- **Media Uploads:** Buffers files and securely pushes them to the `campaign-assets` Supabase Storage bucket, creating alt-captioned records in `vehicle_photos` that are mapped instantly onto client views.
- **Audit Trails:** Logs import outcomes to `audit_log` with details of inserted, updated, skipped, or failed files.

## Publishing and Video Credentials

**There is no live publishing or video rendering in GetGoGone today.** No ad-platform
API client and no video renderer exist in the codebase. Every publishing route and the
video compiler return a *simulated* result.

This section previously described a "token-ready architecture" where dropping a key into
`.env.local` switched the routes to live mode with no code changes. That was not true.
The credential check existed, but both branches returned fabricated data — the "live"
branch only changed the prefix on the made-up id. An operator who set `META_ADS_TOKEN`
would have been told their ad was live while nothing had been published.

### Current behaviour

| Route | No credential set | Credential set |
|---|---|---|
| `POST /api/publishing/meta-ads` | Simulated result | **501 not_implemented** |
| `POST /api/publishing/google-ads` | Simulated result | **501 not_implemented** |
| `POST /api/publishing/google-business` | Simulated result | **501 not_implemented** |
| `POST /api/video/compile` | Simulated result | **501 not_implemented** |

Credentials that trigger the 501: `META_ADS_TOKEN`, `GOOGLE_ADS_TOKEN`,
`GOOGLE_BUSINESS_TOKEN`, `GOOGLE_VEO_API_KEY`, `GOOGLE_OMNI_API_KEY`.

Refusing is deliberate. Until a real API client exists, the only honest response to
"publish this, here is my token" is to say it is not implemented.

### Identifying simulated output

- Response bodies carry `simulated: true` and a `message` saying no API call was made.
- Fake ids use a `sim_` prefix (`sim_meta_*`, `sim_gads_*`, `sim_gbp_*`).
- Audit rows use `action: "channel_publish_simulated"` with `metadata.simulated = true`.
- `campaign_assets.metadata.simulated` is `true` for simulated video renders, and
  `file_url` points at a path where no file was ever written.

Anything in the database without those markers predates this change (2026-08-01) and
should be treated as untrustworthy — the old routes wrote `action: "channel_publish"`
for results that were equally fabricated.

### Never use `NEXT_PUBLIC_*` for credentials

The routes used to accept `NEXT_PUBLIC_META_ADS_TOKEN`, `NEXT_PUBLIC_GOOGLE_ADS_TOKEN`,
`NEXT_PUBLIC_GOOGLE_VEO_API_KEY` and `NEXT_PUBLIC_GOOGLE_OMNI_API_KEY` as fallbacks.
Next.js inlines every `NEXT_PUBLIC_*` variable into the client bundle, so setting one of
those names would have shipped the dealer's ad-platform token to every visitor of the
site. These fallbacks are removed. Credentials are read from server-only env vars only.

### Implementing a real integration

Replace the `refuseIfLiveCredentialPresent()` guard in the route with an actual client
call. The guard lives in `src/lib/publishing/simulation.ts` and is intentionally the
first statement in each handler, so it is obvious what has to be removed. Target order
per `docs/REDESIGN_2026-06.md`: Meta Advantage+ catalog feed first, then Remotion video.
