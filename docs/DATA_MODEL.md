# Data Model

Core entities:
- dealership
- user / salesperson
- vehicle
- vehicle_photo
- campaign
- campaign_channel
- campaign_asset
- creative_template
- message_template
- lead
- lead_event
- marketing_send
- workflow
- workflow_run
- task
- integration

Key relationship:
Dealership -> Vehicles -> Campaigns -> Channel Assets -> Leads/Events -> Tasks/Reports

Vehicles may originate from Carsforsale, CSV, manual entry, or future integrations. GetGoGone should store source metadata while keeping its own normalized vehicle record.

Agency client model:
For the agency-owner platform direction, `dealerships` is currently the client/root account table. The active client context uses `dealerships.id` as `clientId`. Future support for one client owning multiple rooftops may require an additional parent `clients` table, but the current implementation keeps one dealership equal to one client.

Campaign channels should support Facebook, Instagram, Google Business Profile, Google Ads, Craigslist, Cars.com, LinkedIn, TikTok, YouTube Shorts, SMS, email, print, and website/landing pages.

Lead events are first-class. Calls, texts, emails, notes, status changes, appointments, ad clicks, and campaign activity should be tracked as events for reporting and automation.

## Existing Supabase Source Tables

The linked dealership Supabase project currently has these public tables:

- `inspections`: vehicle intake data and current best source for starter inventory records.
- `service_records`: mechanic/lot readiness data keyed primarily by VIN.
- `marketing_posts`: early marketing activity records keyed by VIN/platform.
- `credit_applications`: sensitive credit application data containing PII. GetGoGone should not query or expose this table until a secure credit module is intentionally designed.

Initial mapping:

- `inspections.vin` -> `vehicles.vin`
- `inspections.id` -> `vehicles.source_record_id`
- `inspections.year/make/model/body/color/transmission` -> normalized vehicle fields
- `inspections.miles` -> `vehicles.mileage`
- `inspections.price` -> `vehicles.price`
- `inspections.down_payment` -> `vehicles.down_payment`
- `inspections.photo_urls` -> future `vehicle_photos`
- `inspections.website_copy` -> vehicle description/source copy
- `service_records.vin` -> readiness/service context for a vehicle
- `marketing_posts` -> legacy source for future campaign/posting activity

Known issue:
`inspections.id` is `int4`, while `marketing_posts.inspection_id` is typed as `uuid`. Do not create a foreign key between those fields as-is. Prefer linking by VIN or adding a corrected source reference when GetGoGone campaign tables are introduced.

## GetGoGone Schema Extension

Local migration:
`supabase/migrations/20260520000001_getgogone_core.sql`

Remote status:
Applied to the linked Supabase project.

This migration adds GetGoGone-owned tables beside the existing dealership tables:

- `dealerships`
- `profiles`
- `vehicles`
- `vehicle_photos`
- `campaigns`
- `campaign_channels`
- `campaign_assets`
- `creative_templates`
- `message_templates`
- `leads`
- `lead_events`
- `marketing_sends`
- `marketing_send_recipients`
- `tasks`
- `workflows`
- `workflow_runs`
- `integrations`
- `audit_log`
- `client_brand_brains`

It also adds `inspection_vehicle_source`, a read-only view that normalizes the existing `inspections` and `service_records` data into a starter vehicle source shape.

Current app wiring:
The app shell calls `/api/agency/clients` to load dealership clients and set the active client. The Inventory screen now calls `/api/inventory?clientId=...`. For the default dealership client, the endpoint reads `inspection_vehicle_source`; for non-default clients, it reads normalized `vehicles` rows scoped by `dealership_id`. If credentials are missing or no source vehicles are returned, the screen keeps using the preserved Claude demo data.

Campaign save wiring:
The Campaign Builder and Package Builder post to `/api/campaigns`. The server uses the Supabase service-role client to:

- ensure a `dealerships` row exists or use the supplied active `clientId`
- upsert the selected vehicle into `vehicles` by `(dealership_id, vin)` when a VIN is available
- create a `campaigns` draft with `campaign_type = channel_builder`
- create one `campaign_channels` draft row per selected channel module
- store channel-specific setup, generated outputs, creative formats, publishing method, publish due date, owner approval state, checklist notes, compliance notes, language, goal, and vehicle snapshot in `campaign_channels.platform_payload`

Package Builder currently uses the same `campaigns` and `campaign_channels` tables rather than a separate `campaign_packages` table. Generated AI rows remain in `generated_outputs`; the saved campaign stores the reviewed copy snapshot in each campaign channel. A dedicated `campaign_packages` table should be added later only when packages need independent lifecycle, partial approval state, scheduled publishing, or multi-vehicle batch grouping.

Campaign edit wiring:
The Campaign Review screen patches individual channel drafts through `/api/campaigns`. Editable channel fields map to:

- `campaign_channels.headline`
- `campaign_channels.primary_text`
- `campaign_channels.call_to_action`
- `campaign_channels.status`
- `campaign_channels.destination_url`
- `campaign_channels.published_url`
- `campaign_channels.platform_payload.setupFields`
- `campaign_channels.platform_payload.publishingMethod`
- `campaign_channels.platform_payload.publishDueAt`
- `campaign_channels.platform_payload.ownerApprovalRequired`
- `campaign_channels.platform_payload.ownerApproved`
- `campaign_channels.platform_payload.checklistNotes`

Campaign Review uses channel status values such as `draft`, `approved`, `exported`, and `published` to track manual publishing progress before provider APIs are connected. Paid channels such as Google Ads and Meta Paid default to requiring owner approval before launch. The flexible `platform_payload` shape remains intentional while channel modules are still evolving.

Channel module contract:
`src/features/campaigns/channel-modules.ts` defines the operational contract used by Package Builder, Campaign Builder, Campaign Review, AI Library filters, exports, and future reporting.

Current module metadata:

- `id`
- `name`
- `category`
- `bestFor`
- `whenToUse`
- `setupFields`
- `generatedOutputs`
- `creativeFormats`
- `publishingMethod`
- `complianceNotes`
- `metricFields`
- `integrationPath`
- `availableInBuilder`

The legacy `marketplace_listings` module remains available for old saved records but is hidden from new builder defaults. New work should use specific modules such as `cars_com` and `autotrader`.

Campaign assets:
Text/checklist exports and manual channel attachments now create `campaign_assets` records. Current fields:

- `campaign_assets.campaign_id`
- `campaign_assets.campaign_channel_id`
- `campaign_assets.asset_type` as `campaign_text_package`, `channel_text_package`, `image_creative`, or `creative_reference`
- `campaign_assets.format` as `txt`, a Designer creative format such as `fb-sq`, or `url`/`note`
- `campaign_assets.file_url`
- `campaign_assets.storage_path`
- `campaign_assets.template_id` for saved Designer creative/template attachments
- `campaign_assets.metadata.fileName`
- `campaign_assets.metadata.text`

Campaign Review can attach saved Designer creatives to a specific campaign channel by storing the editable creative row ID in `template_id`. Rendered image exports now use the same table with `asset_type = image_creative`, a creative/export format, `file_url`, and `storage_path` pointing to the `campaign-assets` Supabase Storage bucket when campaign context is supplied.

Creative templates and saved designs:
The Designer now uses `creative_templates` for two editable canvas categories:

- `category = custom_template`: reusable Designer templates that appear inside the Designer Templates panel.
- `category = saved_creative`: saved Designer versions that appear in the Designer Saved panel and the Creatives asset library.

Both categories store the editable layer document in `creative_templates.canvas_json`, including layers, selected size, vehicle snapshot, brand/offer state, and source template metadata. The current layer document supports protected vehicle-base layers plus editable overlay text, badge, shape, secondary photo, logo, CTA, ribbon, and stat-row layers. Layer order, lock state, role metadata, and reusable template/source metadata stay inside the same JSON document. This preserves editability before rendered image export/storage is implemented.

Creative template reads and writes are now client-aware through `creative_templates.dealership_id`.

Designer export wiring:
`POST /api/creative-exports` stores rendered PNG/JPG files in Supabase Storage. When `creativeTemplateId` is supplied, the route updates `creative_templates.preview_url`. When `campaignId` is supplied, it also creates a `campaign_assets` row linked to the campaign and optional channel.

Marketing cockpit queue:
The current cockpit queue is derived on demand from existing tables and source views:

- inventory from `inspection_vehicle_source` or client-scoped `vehicles`
- saved campaigns from `campaigns`
- saved creative versions from `creative_templates`

This avoids adding a general queue table before the operator workflow is proven. Agent proposals now have their own lifecycle table; introduce `marketing_queue_items` later only when non-agent queue items need assignment, completion history, recurring checks, due dates, or independent ownership.

Inventory readiness:
`src/features/inventory/readiness.ts` is the shared scoring model for vehicle marketing readiness. It currently derives a score and issues from available vehicle data plus context flags for campaign, Spanish, and creative coverage.

Current readiness checks:

- usable photo
- price
- approved down payment
- mileage
- description/website copy
- campaign package coverage
- Spanish campaign coverage
- saved creative coverage

The readiness result includes `score`, `status`, `issues`, `opportunities`, and `summary`. This is intentionally code-derived for now; persist readiness snapshots later only when reporting history, agent comparisons, or scheduled rescoring require it.

API:

- `POST /api/inventory/readiness` scores one vehicle or a supplied `vehicles` array and returns per-vehicle readiness plus aggregate counts. This keeps readiness agent-friendly without requiring agents to scrape Inventory or Cockpit UI.

Campaign recommendations:
`src/features/campaigns/recommendations.ts` derives suggested campaign channels from the readiness result and vehicle fit. Recommendations are code-derived for now and include `channelId`, `score`, `priority`, `reason`, `blocked`, and the matching channel module.

API:

- `POST /api/campaigns/recommendations` returns readiness, ranked channel recommendations, and the selected top channel IDs for one vehicle.

Agent proposals:
`agent_proposals` persists agent-suggested work for Cockpit. Cockpit derives proposal candidates from readiness, campaign recommendations, and campaign review queue items, then syncs them through `/api/agents/proposals` using `source_key` for idempotency.

Current proposal fields include:

- `dealership_id`
- `source_key`
- `agent_type`
- `target_type`
- `target_id`
- `proposal_type`
- `title`
- `reasoning`
- `proposed_payload`
- `risk_level`
- `status`
- `decided_at`
- `snoozed_until`

Supported statuses are `pending`, `approved`, `rejected`, `snoozed`, and `archived`. Snoozed proposals are reactivated by the proposal API when `snoozed_until` has passed.

Brand Brain:
Migration `supabase/migrations/20260521000001_client_brand_brains.sql` adds `client_brand_brains`.

Current fields:

- `dealership_id`
- `tone_english`
- `tone_spanish`
- `approved_phrases`
- `banned_phrases`
- `down_payment_rules`
- `finance_disclaimer`
- `spanish_guidance`
- `target_audience_notes`
- `objection_handling_notes`
- `platform_rules`

This table is the client-specific rule source for future AI copy, Spanish adaptation, Designer text, video scripts, SMS/email templates, and compliance review.

Generated outputs:
Migration `supabase/migrations/20260521000002_generated_outputs.sql` adds `generated_outputs`.

Current fields:

- `dealership_id`
- `vehicle_id`
- `campaign_id`
- `target_type`
- `target_id`
- `task_type`
- `provider`
- `model`
- `language`
- `prompt_context`
- `output`
- `status`

`generated_outputs` is the reusable memory layer for AI work. Campaign copy generation now writes draft rows here, and the AI Library reads the table for review, edit, copy, approval, and archive workflows. Edited review copy is saved back into `output.headline`, `output.body`, and `output.edited_at`, with row `status` moving to `reviewed` before final approval. Compliance review results are stored in `output.compliance_review` with verdict, issues, provider, model, checked timestamp, and exact issue matches when deterministic rules can locate the phrase. Match records include source, start, end, and matched text so review surfaces can highlight banned English and Spanish phrases. Package Builder stores bounded repair metadata in `output.rewrite_attempts`, `output.rewrite_history`, and `output.hitl_required`; rows that fail after the repair limit use `status = hitl_required`. `output.rewrite_history` is an array of attempt snapshots with attempt number, headline/body, provider/model, verdict, issues, and check timestamp. Future Designer text, image prompts, video scripts, storyboards, and optimization recommendations should write to the same table or to a specialized child table only when the asset has a distinct lifecycle.

Generated output events:
Migration `supabase/migrations/20260521000003_generated_output_events.sql` adds `generated_output_events` as the audit trail for AI review decisions.

Current fields:

- `dealership_id`
- `generated_output_id`
- `event_type`
- `actor_type`
- `note`
- `metadata`

AI Library writes events for operator decisions such as rejection and send-back-to-rewrite. The generated output row remains the source of truth for current status, while this table preserves the decision trail.

RLS posture:
The new GetGoGone tables enable Row Level Security, but detailed policies are intentionally deferred until auth and dealership membership rules are implemented. Server-side/service-role operations can be used during controlled setup and imports.
