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

## Drop-in API Credentials

GetGoGone is designed with a token-ready architecture: all publishing and video generation routes check for the presence of an environment variable before switching from simulator mode to live mode. No code changes are needed — only a `.env.local` entry.

### Paid Advertising

| Platform | Env Var | Fallback Behavior |
|---|---|---|
| Meta Ads (Facebook/Instagram) | `META_ADS_TOKEN` | High-fidelity mock simulator |
| Google Ads | `GOOGLE_ADS_TOKEN` | High-fidelity mock simulator |
| CarsForSale Direct API | `CARSFORSALE_API_KEY` | ZIP kit / CSV import |

Ad ID prefixes distinguish live from mock in audit logs:
- Live Meta: `meta_live_*` · Simulator: `act_meta_*`
- Live Google: `g_live_*` · Simulator: `g_ads_*`

### Video Generation

Priority adapter chain (first key found wins):

| Priority | Provider | Env Var |
|---|---|---|
| 1 | Google Veo | `GOOGLE_VEO_API_KEY` |
| 2 | Google Omni | `GOOGLE_OMNI_API_KEY` |
| 3 | Local Mock | _(no key required)_ |

The resolved provider name is recorded in every `campaign_assets.metadata.provider` field for full audit traceability.

### How to Activate a Live Provider

Add the relevant key to `.env.local` at the project root:

```env
META_ADS_TOKEN=your_meta_system_user_token
GOOGLE_ADS_TOKEN=your_google_ads_developer_token
GOOGLE_VEO_API_KEY=your_veo_api_key
```

Restart the dev server (`npm run dev`) and the routes will automatically detect and switch to live mode on the next request.

