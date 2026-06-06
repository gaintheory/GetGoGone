# Architecture

Recommended stack:
- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase Postgres
- Supabase Auth
- Supabase Storage
- OpenAI API for campaign, copy, translation, and compliance assistance
- Twilio or similar provider for SMS
- Postmark, Resend, or SendGrid for email
- Meta APIs for paid ad workflows where practical

Project layout:
- src/app: routes and layouts
  - src/app/api/auth/: login + logout POST handlers
  - src/app/api/leads/: lead list/detail, activities, and public inbound endpoint
  - src/app/login/: site password login page
  - src/app/v/[vehicleId]/: public per-vehicle landing pages with inquiry form
- src/components: shared layout and UI components
- src/features: domain-specific product modules
- src/prototype: mechanically ported Claude Design screens, data, icons, and UI used as the initial app shell
- src/lib: shared app utilities and clients
  - src/lib/auth/: HMAC cookie helper (cookie.ts)
- docs: product and engineering guidance
- supabase: migrations and seed data
- packages: future shared/integration/AI code if the app grows into a workspace
- middleware.ts: Next.js Edge runtime auth gate (project root)

Workspace navigation:
- The app now starts in an Agency Command screen for the agency-owner workflow.
- The sidebar includes a client switcher backed by `/api/agency/clients`; the selected client is stored as the active client context and reused by inventory, campaign, Designer, and Creatives flows.
- Generate Campaign opens Package Builder, the operator workflow for generating a full multi-channel package from one vehicle before saving it as a campaign.
- Templates are not exposed as a standalone top-level route.
- Designer owns blank-canvas and template-based creative starts.
- Creatives should become the asset library for finished/saved outputs.
- Designer starts on the Vehicle panel. The canvas layer model keeps a vehicle photo base present for blank overlays and template overlays. The Clear Overlay action resets to that photo base.
- Designer now has a Stack panel for layer ordering and lock state. The protected background and vehicle photo base cannot be deleted, duplicated, reordered, dragged, resized, or edited, which keeps every design vehicle-first.
- Designer photo tools add secondary vehicle-photo layers and basic collage layouts without replacing the protected base. Shape tools add common ad overlay pieces such as panels, bars, rails, shade overlays, offer footers, and split-panel layouts.
- Designer offer values currently live in local brand/offer state and feed template variable substitution. Persisting dealership default offer rules and per-creative offer overrides is a future schema/API step.
- Template import is currently a Designer UI surface and guardrail model. Actual parsing/import persistence for JSON/SVG/PNG/PDF templates still needs backend/storage implementation.
- Designer save actions now persist through `src/app/api/creative-templates/route.ts`. `custom_template` rows reload into the Designer Templates panel, while `saved_creative` rows reload into the Designer Saved panel and the Creatives asset library.

Architecture principle:
Keep vehicles, campaigns, creatives, leads, workflows, and integrations separate. Do not let any one external provider define the internal data model.

Supabase client setup:
- `src/lib/database.types.ts` stores generated remote database types.
- `src/lib/supabase/client.ts` exports the browser/client Supabase instance.
- `src/lib/supabase/server.ts` exports the service-role admin client for server-only operations.

Inventory source mapping:
- `src/features/inventory/types.ts` defines starter inventory domain types.
- `src/features/inventory/source-map.ts` maps existing `inspections` records into GetGoGone `VehicleSummary` objects.
- `src/features/inventory/prototype-adapter.ts` maps the `inspection_vehicle_source` view into the current Claude prototype vehicle shape.
- `src/features/inventory/local-images.ts` scans `public/images/vehicles` for VIN-named local images and maps them onto live vehicles.
- `src/features/inventory/readiness.ts` scores vehicle marketing readiness from reusable rules: photo, price, down payment, mileage, description, campaign coverage, Spanish coverage, creative coverage, and opportunity tags.
- `src/app/api/inventory/route.ts` reads `inspection_vehicle_source` for the default dealership client and returns prototype-ready vehicles. When a non-default `clientId` is supplied, it reads normalized `vehicles` rows for that dealership.
- `src/app/api/inventory/readiness/route.ts` exposes the same readiness scorer as a structured API for agents and future server workflows.
- `src/prototype/app.jsx` owns the current shared inventory state and passes it into Inventory, Vehicle Detail, Campaign Builder, Package Builder, Creative Builder, Creatives, Campaigns, and Test Drive screens so they use the same vehicle set.
- Package Builder uses the shared readiness scorer to show selected-vehicle blockers, opportunities, and channel fit hints before generation.
- This mapping is intentionally separate from the UI so the Claude prototype can remain visually stable while data wiring evolves.

Agency client context:
- `src/app/api/agency/clients/route.ts` lists dealership clients and ensures a default client row exists.
- `src/prototype/app.jsx` owns `activeClientId`, stores it in `localStorage`, and passes it into client-aware screens.
- This is the prototype/admin form of multi-client scoping. Auth-backed access rules and RLS policies are still future production hardening.

Marketing Cockpit:
- `src/app/api/agency/cockpit/route.ts` builds a derived operator queue from inventory, campaigns, and saved creative templates.
- The cockpit now uses the shared vehicle readiness scorer for queue reasons and metrics, including average readiness and market-ready vehicle counts.
- Cockpit campaign queue items now include recommended channel IDs and open Package Builder with those channels preselected.
- Cockpit now includes the first table-backed agent proposal queue. It stages recommended campaign/review actions through `/api/agents/proposals`, persists them in `agent_proposals`, and supports approve, reject, and snooze lifecycle decisions.
- `src/prototype/screens/agency-cockpit.jsx` displays the daily action queue with priority filters and quick actions into Vehicle Detail, Campaign Builder, Campaign Review, or Designer.
- The cockpit action queue is still computed on demand rather than persisted in `marketing_queue_items`; a general queue table should be added only when non-agent items need assignment, completion history, recurring checks, or due dates.

Brand Brain:
- `public.client_brand_brains` stores client-specific tone, Spanish guidance, approved phrases, banned phrases, down-payment rules, finance disclaimers, audience notes, objection handling, and platform rules.
- `src/app/api/agency/brand-brain/route.ts` ensures a default Brand Brain exists for the active client and supports read/update operations.
- `src/prototype/screens/brand-brain.jsx` provides the first operator UI for editing client-specific generation and compliance rules.
- Campaign, creative, SMS/email, video, and compliance AI endpoints should read this profile before generating customer-facing output.

AI provider layer:
- `src/lib/ai/ai-provider.ts` provides the first provider abstraction for local Ollama text generation and status checks.
- `src/app/api/ai/status/route.ts` reports local AI health for the topbar indicator.
- `src/app/api/ai/generate-copy/route.ts` generates channel copy with the active client's Brand Brain. If Ollama is offline or generation fails, it returns a compliant rules-based fallback instead of failing the workflow.
- `src/app/api/ai/compliance-check/route.ts` reviews generated copy with deterministic dealership-advertising rules first and local AI compliance review when available. It returns a pass, needs-review, or fail verdict with issue-level suggestions. Deterministic English and Spanish rule checks include exact match metadata so the review UI can highlight flagged phrases directly in the headline/body preview.
- `src/app/api/ai/rewrite-copy/route.ts` rewrites failed copy toward compliance. Package Builder uses it in a bounded repair loop: generate, check, rewrite/check up to three times, then mark the generated output `hitl_required` if it still cannot pass.
- `src/app/api/ai/generated-outputs/route.ts` lists and updates saved AI outputs for the active client, including status changes such as approved or archived.
- Campaign Builder channel cards can request AI copy per channel, and the toolbar can generate copy for all selected channels.
- The AI Library screen is the operator review surface for generated outputs. It filters by status, task, and channel, previews and edits the saved headline/body, highlights exact flagged phrases in a review preview, exposes provider/model traceability, runs compliance checks, stores the review in `generated_outputs.output.compliance_review`, and supports copy/save/review/approve/archive actions.
- AI Library also acts as the HITL queue. Package Builder can deep-link directly into `status = hitl_required`, and saved outputs retain `output.rewrite_history` so the operator can see each compliance check and rewrite attempt before approving or editing.
- `src/app/api/ai/generated-output-events/route.ts` records review audit events such as rejection and send-back-to-rewrite. The AI Library reads these events when available but degrades gracefully if the audit migration has not been applied yet.
- Ollama model selection is dynamic. The provider discovers installed local models from `/api/tags` and chooses a task-appropriate model for copywriting, Spanish adaptation, compliance, strategy, or fast work. `LOCAL_TEXT_MODEL` is treated as a preferred fallback, not the only usable model.

Campaign persistence:
- `src/app/api/campaigns/route.ts` is the first campaign write endpoint.
- The Campaign Builder saves selected channel modules through this route.
- The old `builder` route now resolves to Package Builder with route state, so campaign creation has one primary flow. The older channel-builder component remains in the codebase for now but is no longer the active creation path.
- `src/features/campaigns/channel-modules.ts` is the channel contract. Modules define setup fields, expected outputs, creative formats, publishing method, compliance notes, metric fields, and integration path. New packages use specific priority modules for GBP, Google Ads, Meta, Instagram, Craigslist, Cars.com, and AutoTrader rather than a generic marketplace bucket.
- `src/prototype/screens/campaign-package.jsx` generates channel-specific copy for selected modules, runs compliance checks for each output, attempts bounded compliance rewrites, saves those outputs to AI Library through existing AI APIs, escalates unresolved outputs to HITL, and can create a draft campaign from the generated package.
- `src/features/campaigns/recommendations.ts` recommends channels from vehicle readiness and vehicle fit. `src/app/api/campaigns/recommendations/route.ts` exposes those recommendations for agents and server workflows.
- Package Builder shows recommended channels and can apply the recommended channel set before generation.
- Campaign reads and writes now accept `clientId`; saved campaigns use the selected client/dealership id instead of always falling back to the first dealership.
- The route creates the campaign parent row and child `campaign_channels` rows in one server-side flow.
- Channel module details stay in `platform_payload` for now so new channels can be added without a schema change.
- The same endpoint also supports campaign list/detail reads for the Campaigns and Campaign Review screens.
- The endpoint supports channel-level `PATCH` updates so review-screen edits can persist headline, copy, CTA, setup fields, publishing path, publish due date, owner approval state, checklist notes, destination URL, published URL/post ID, status, and module payload changes back to `campaign_channels`.
- Campaign package export currently runs client-side from the Campaign Review screen and downloads plain text files. This keeps export usable before storage-backed creative assets and server-side archive generation are added.
- Campaign Review is now the operational center for saved packages. It shows channel status counts, readiness checks, approval/export/published actions, saved assets, channel asset attachments, publish due dates, paid-channel owner approval state, and manual publish tracking before deeper platform integrations exist.
- `src/app/api/campaign-assets/route.ts` lists, registers, updates, and removes exported campaign/channel packages in `campaign_assets`. Current assets include text package metadata records, manual URL/note references, saved Designer creative attachments using `template_id`, and storage-backed rendered image exports.
- `src/app/api/creative-exports/route.ts` accepts a rendered PNG/JPG data URL from Designer, uploads it to the `campaign-assets` Supabase Storage bucket, updates the saved creative preview URL when a `creativeTemplateId` is supplied, and creates an `image_creative` campaign asset when campaign/channel context is supplied.

Creative persistence:
- `src/app/api/creative-templates/route.ts` reads and writes `creative_templates`.
- The Designer stores the editable canvas JSON for saved templates and saved creative versions in `creative_templates.canvas_json`.
- The Creatives screen currently reads `creative_templates` rows with `category = saved_creative` as the first real asset-library source.
- Creative template reads and writes now accept `clientId`, so saved templates and creative versions are scoped to the active client.
- Designer canvas JSON now treats the vehicle photo base as a protected layer and supports editable overlay layers for text, badges, shapes, photos, logos, CTAs, ribbons, and stat rows. Reorder/lock metadata is kept in the same layer document.
- This is still an editable-document-first persistence path. Saved Designer creative rows can be attached to campaign channels through `campaign_assets.template_id`, while rendered PNG/JPG exports create storage-backed file records in `campaign_assets` when campaign context is available.

## Authentication

- `middleware.ts` (Next.js Edge runtime, project root) intercepts every request and verifies the `ggg_auth` signed cookie before forwarding.
- Unauthenticated page requests are redirected to `/login?next=<original>`; unauthenticated API requests receive `401 { ok: false, error: "unauthenticated" }`.
- Public paths that bypass the gate: `PUBLIC_PATHS` (e.g. `/login`), `PUBLIC_API_PREFIXES` (e.g. `/api/leads/inbound`), `PUBLIC_PAGE_PREFIXES` (e.g. `/v/`), and static asset extensions.
- `src/lib/auth/cookie.ts` — Web Crypto API HMAC-SHA256 cookie signing, 30-day expiry, constant-time signature verification.
- `src/app/api/auth/login/route.ts` — POST handler, constant-time compares submitted password against `SITE_PASSWORD`, sets `ggg_auth` httpOnly + sameSite=lax + secure-in-prod cookie.
- `src/app/api/auth/logout/route.ts` — POST handler, clears cookie.
- `src/app/login/page.tsx` — client-side login form.
- Required env vars: `SITE_PASSWORD`, `SITE_AUTH_COOKIE_SECRET` (32-byte hex), `PUBLIC_BASE_URL`.

## Leads & attribution

End-to-end attribution flow:
1. Campaign save (`POST /api/campaigns`) creates `campaign_channels` rows and then sets each row's `destination_url` to `<PUBLIC_BASE_URL>/v/<vehicleId>?ch=<channel>&c=<campaignId>&cc=<channelId>&utm_source=<channel>&utm_medium=<paid|organic>&utm_campaign=<campaignId>`.
2. The operator copies that URL into the channel's ad, organic post, or listing.
3. A prospect opens the link and lands on `src/app/v/[vehicleId]/page.tsx` — a public page (no auth required; `/v/` is in `PUBLIC_PAGE_PREFIXES`). The page shows the vehicle and an inquiry form (`InquiryForm.tsx`).
4. Form submission calls `POST /api/leads/inbound` (also public — in `PUBLIC_API_PREFIXES`). The endpoint stores the lead with full attribution: `campaign_channel_id`, `source_channel`, `utm` (jsonb), `inbound_url`, `inbound_ip`, `inbound_user_agent`.
5. Operator-added leads (walk-in, phone, referral) use `POST /api/leads` with a manual `source` field; they skip the UTM path.

API surface:
- `GET /api/leads` — list leads (filterable by status) or fetch a single lead with its activity timeline.
- `POST /api/leads` — operator manually creates a lead.
- `PATCH /api/leads` — update lead status; auto-logs a `status_change` activity.
- `POST /api/leads/activities` — log a contact attempt (note, call, SMS, email, appointment). Updates `last_contacted_at` automatically for outbound activities.
- `POST /api/leads/inbound` — public inquiry endpoint; stores lead + UTM attribution.
