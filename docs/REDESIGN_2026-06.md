# GetGoGone Redesign — June 2026

## The decision

AutoDoss (tmc) is now the **DMS + CRM system of record**. GetGoGone is **not** a
second DMS, a second CRM, or a second lead inbox. GGG narrows to one job:

> **A per-vehicle creative + omnichannel distribution engine** that sits on top of
> AutoDoss inventory, produces ads/video/feeds, publishes them across channels,
> and hands warm leads to AutoDoss. Nothing downstream of the click.

Everything *after* the click — conversation, follow-up, scoring, Twilio, the
pipeline board — is AutoDoss. GGG never duplicates it.

## The seam

```
AutoDoss (gaintheory/autodoss)              GetGoGone
  system of record                            creative + distribution
  ───────────────────────────                 ───────────────────────────
  inventory  ──GET /api/v1/inventory──────►   pick vehicles to market
  dealers    ──GET /api/v1/dealers────────►   hydrate brand (logo/colors/phone)
  customers  ──GET /api/v1/customers──────►   read attribution outcomes
                                              produce creative (Designer)
                                              produce short-form video
                                              emit per-platform feeds
                                              publish + schedule posts
  CRM/board/Twilio/AI  ◄──POST /api/v1/leads── hand off captured leads
```

The AutoDoss Data API (`docs/getgogone-api.md` in the autodoss repo) is **read-only
today**: `/dealers`, `/inventory`, `/customers`. Every list response is
`{ data: [...], count }`. Auth is `Bearer <key>` (service master or per-dealership).

## The one missing rung

There is **no inbound lead endpoint** on AutoDoss yet. Until `POST /api/v1/leads`
exists, GGG cannot cleanly hand a captured lead to the CRM, so the loop is open:

```
GGG ad → UTM landing → lead captured → [GAP] → AutoDoss CRM
```

**Action (to finish together):** add `POST /api/v1/leads` to AutoDoss accepting
`{ dealership_id, vehicle_id, name, phone, email?, source, utm_campaign? }`.
Once it exists:
- GGG landing pages (`/v/[vehicleId]`) POST the lead straight into AutoDoss.
- GGG deletes its own `leads` / `lead_activities` tables and the Leads screen.
- Attribution closes: GGG stamps `utm_campaign` outbound, then reads
  `/customers?source=…` back to show "campaign → leads → sold".

## What this removes from GGG (the "overdone" cleanup)

| Remove | Because |
| --- | --- |
| Inventory ingestion: CSV/VIN/ZIP/manual import, `features/inventory/intake/*`, `eng.traineddata` (5 MB OCR blob) | AutoDoss owns intake |
| GGG `vehicles` / `vehicle_photos` tables + the `inspection_vehicle_source` fallback | Inventory is read live from AutoDoss; the local copy caused a split-brain (leads FK-joined a vehicle table that no longer fills) |
| Leads screen + `leads` / `lead_activities` tables + parallel CRM | AutoDoss owns CRM (board, Twilio, AI replies, scoring) |
| Hand-maintained brand (`defaultBrand`, Brand Brain duplication) | Brand comes from AutoDoss `/dealers` |
| Test Drive screen | Scope creep for a distribution engine |
| 3 overlapping strategy docs (AGENCY_ROADMAP, AGENTIC_IMPLEMENTATION_STRATEGY, agency_transformation_proposal) | Superseded by this doc |

*Deletions are staged for the in-person session because they depend on the
`POST /leads` decision and live API verification. Nothing destructive has been
done yet.*

## What GGG keeps / becomes (focused IA)

Primary nav collapses from 16 items to a focused set:

- **Inventory** — read-only AutoDoss browser; pick what to market
- **Campaigns** — multi-channel campaign builder
- **Designer** — Konva canvas (per-vehicle creative; ComfyUI image gen)
- **Video** — short-form per-vehicle vertical video (Remotion-based; see below)
- **Creatives** — saved asset library
- **Distribution** — feeds + publishing + scheduling
- **Reports** — attribution read back from AutoDoss
- *(Settings, plus de-emphasized: Agency overview)*

## Distribution strategy — "more than Facebook"

Two models, both owned by GGG:

### 1. Feed-based (the scalable engine)
A 40-car lot should publish a **feed once**, not post 40 times. GGG pulls
inventory from AutoDoss, applies creative templates, and emits a per-platform
vehicle feed; the platform auto-generates a dynamic ad per vehicle.
- **Meta Advantage+ Catalog** (Automotive Inventory Ads) — *first target; the dealer is already on Facebook*
- **Google Vehicle Ads / Performance Max** — feed-driven
- **Marketplace / Craigslist** — feed/listing export (no real API; GGG bundles listing + images)

### 2. Post-based (the engagement layer + the video wedge)
For featured vehicles and brand presence:
- **TikTok** (Content Posting API), **YouTube Shorts** (Data API),
  **Instagram/FB Reels** (Graph API), **Google Business posts**

### The video wedge
Auto-generate a vertical ~15s walkaround per vehicle from AutoDoss photos
(Ken Burns + price/down overlay, Spanish+English, CTA) using **Remotion**
(programmatic React → MP4, replacing the current mock compiler). A BHPH lot
getting an automatic Spanish TikTok/Reel for every new arrival is the demo that
sells the business.

## Build sequence

1. **AutoDoss `POST /api/v1/leads`** → delete GGG leads/CRM
2. **Brand from `/dealers`** → delete hand-maintained brand
3. **Feed engine** (Meta Catalog first)
4. **Remotion per-vehicle short-form video** (the wedge)
5. **TikTok / Shorts / GBP publishing**
6. **Reports** read attribution back from AutoDoss

## Status (this session, solo pass)

Done without touching the API or anything destructive:
- Deleted doc rot (`sonnet21.md`).
- This redesign doc written; `PRODUCT_SCOPE` / `ARCHITECTURE` / `DECISIONS` updated.
- Nav/IA restructured into the focused grouping (all screens still reachable).
- `toBrand()` AutoDoss→brand adapter added (pure, additive; ready to wire).
- Feed-engine + Remotion video route scaffolds added (return "not configured").

Pending the in-person session: `POST /leads`, brand rewire to live data,
inventory-ingestion + leads-table deletions, real feed/video implementations.

## UX layer — the "not bland" redesign (built 2026-06)

Direction: make GGG **intent-first + vehicle-as-hero** instead of a conventional
tool-first dashboard. New pieces (all in `src/prototype`):

- **Design Schemes** (`schemes.jsx`) — six one-click visual identities (palette +
  type + badge style + density) with `applyScheme()` and a picker.
- **MiniCreative** (`creative-preview.jsx`) — live ad preview driven by
  scheme × layout × language; bilingual EN/ES copy bank; compliance-safe.
- **Variant Explorer** (`screens/variant-explorer.jsx`) — "describe the campaign →
  watch it build": intent prompt + EN/ES/Both toggle → 6 live variants.
  `deriveVariants()` is a keyword heuristic to be replaced by a real `/api/ai` call.
- **Vehicle Hub** (`screens/vehicle-hub.jsx`) — radial command view; the car as
  hero with orbiting status tiles + readiness meter; embeds the Variant Explorer.
- **The Conveyor** (`screens/conveyor.jsx`) — marketing pipeline as an assembly
  line; stages driven by real signals only.

Deferred at the user's request: the **live multi-format canvas** (edit once, see
every format) — revisit after more exploration. Next: wire `deriveVariants` to
real AI, push `applyScheme` into the Konva Designer, add a living activity home.
