# GetGoGone Agentic Implementation Strategy

Last updated: May 22, 2026

## Purpose

GetGoGone is becoming a personal agency command center for running dealership marketing, not a salesperson self-serve SaaS dashboard. The system should help one operator manage multiple dealerships, generate compliant marketing packages, create and reuse creative assets, track publishing work, and eventually coordinate AI agents that prepare work for human approval.

This document defines the build sequence so features do not become redundant, antiquated, or disconnected later. Every screen, table, API, and agent workflow should have a clear purpose and should fit into the same operating flow.

## Locked Decisions

- A client equals one dealership for the current build.
- If one owner has multiple dealerships later, add an owner/group layer above dealerships without changing the dealership-level data scope.
- Ollama is the first and only active AI provider for now.
- Free/local-first is the default operating rule.
- Cloud models will be added later as explicit opt-in provider adapters, not automatic fallbacks during the current build.
- Storyboard, script, shot list, caption, and voiceover planning must exist before Google Omni video generation.
- Google Omni is the intended future video engine.
- Google Business Profile and Google Ads are top-priority publishing channels.
- Meta paid ads, Instagram, Craigslist, Cars.com, and AutoTrader are also high-priority channels.
- Facebook personal/group posting can remain handled by CarsForSale/MyCommandCenter for now; GetGoGone should focus first on the marketing surface area they are not using.
- Manual inventory, photo, publishing, and metric entry are acceptable during the early agency build.
- The long-term goal remains seamless integration where API access is available and worth the cost/complexity.

## Product Principle

The core workflow is:

1. Inventory enters the system.
2. The system evaluates what marketing is needed.
3. Agents propose campaign, copy, creative, and publishing actions.
4. AI output is saved with full traceability.
5. Compliance checks and bounded rewrites run automatically.
6. Anything unresolved goes to human review.
7. Approved packages become campaign drafts.
8. Campaign assets are exported, published, tracked, and refreshed.
9. Reporting feeds the next round of recommendations.

Nothing should be built as a loose utility. If a feature does not fit this flow, it should either be deferred or redesigned.

## Current Build State

The app already has the right foundation pieces:

- Multi-client shell with active client context.
- Client-aware inventory reads.
- Campaign persistence with campaign and campaign channel records.
- Package Builder for generating channel-specific copy.
- AI provider layer with local Ollama status.
- Brand Brain for client-specific rules.
- Compliance check API.
- Rewrite-to-pass API.
- Bounded repair loop with three attempts.
- HITL escalation through `hitl_required` generated outputs.
- AI Library review screen with editable outputs, compliance review, approval, archive, and rewrite history.
- Designer with saved templates/creatives persistence.
- Creatives asset library using saved creative rows.
- Marketing Cockpit as an early operator queue.

The build should now move from "screens exist" to "operator workflow is precise."

## Strategic Architecture

### One Source Of Truth Per Concept

Avoid duplicate places for the same concept.

- Inventory lives in vehicle/inventory data.
- Generated AI work lives in `generated_outputs`.
- Campaign packages live in `campaigns` and `campaign_channels`.
- Finished text/image/video exports live in campaign assets.
- Editable creative documents live in creative template/design records.
- Templates are assets inside Designer and AI Library, not standalone top-level app sections.
- Agent recommendations should live in a proposal queue, not as hidden local UI state.

### Agent-Friendly By Default

Every important user action should eventually be callable by an agent through a stable API route or action model.

That means:

- Screens should read/write through APIs, not isolated local-only state.
- Important actions need IDs, statuses, and audit trails.
- Buttons should map to clear operations: generate, check, rewrite, approve, reject, export, mark published, create task.
- Agents should never have to "guess" from UI text when a structured object can exist.
- Human approval states must be explicit.

### Human-In-Control Autonomy

Agents may prepare, draft, score, summarize, and recommend.

Agents should not publish, spend ad budget, send SMS/email, modify live client-facing material, or mark work complete without approval until that behavior is intentionally enabled.

The default operating model is:

- Agent proposes.
- System validates.
- Human approves.
- System records.
- Agent learns from outcome.

### Free-First Provider Strategy

The app should be architected for multiple providers, but the active implementation is local-only until the core workflows are stable.

Current rule:

- Use Ollama for copy, Spanish adaptation, compliance review, rewrite repair, strategy drafts, and story/script generation.
- Use deterministic server checks before invoking a local LLM whenever possible.
- Avoid unnecessary local model swapping inside a single workflow. One flagship local model should handle copy, compliance, and rewrite work during a campaign package run unless there is a strong reason to switch.
- If Ollama is offline or times out, fail gracefully into human/manual workflow instead of silently spending cloud credits.

Future rule:

- Add cloud providers as explicit settings and adapters.
- Use cheaper frontier models only when enabled by the operator.
- Use Google Omni for video generation after storyboards and scripts are structured and approved.

## Core Flow Logic

### Inventory Flow

1. Vehicle is imported or synced.
2. Vehicle is normalized into the internal inventory shape.
3. Vehicle receives a marketing readiness score.
4. Missing fields/photos/offers are flagged.
5. Agent proposes actions only when the vehicle is marketable enough or clearly needs setup.

Do not let campaign generation become the place where missing vehicle data is fixed. Campaign generation should consume vehicle data, not repair inventory.

### Campaign Flow

1. Operator chooses a vehicle.
2. Operator chooses goal and channels.
3. Package Builder creates channel-specific outputs.
4. Compliance runs per output.
5. Rewrite loop attempts repair up to three times.
6. Failed outputs go to HITL.
7. Passed outputs become reviewed generated outputs.
8. Operator approves or edits.
9. Campaign draft is created.
10. Campaign Review becomes the export/publishing center.

Campaign Builder should not be a generic form with identical text boxes for every platform. Each channel module must define its own requirements.

### Creative Flow

1. Vehicle is selected first.
2. Vehicle photo or collage becomes the base.
3. Operator chooses a template overlay or blank overlay.
4. All layers remain editable.
5. Design can be saved as a reusable template or finished creative.
6. Finished creative can attach to a campaign channel.
7. Export creates a campaign asset record.

Templates should live inside Designer because they are creative assets. A separate Templates top-level tab would create redundancy.

### AI Output Flow

1. AI generation writes a `generated_outputs` row.
2. Output includes provider, model, prompt context, task type, target, language, and status.
3. Compliance review is saved inside output metadata.
4. Rewrite attempts are saved in output metadata.
5. Human edits update the same output record.
6. Approval changes status.
7. Approved outputs can be attached to campaigns or assets.

AI output should never disappear into a screen-only result. If the system generated it, the operator should be able to find it later.

### Agent Proposal Flow

1. Agent run starts with a clear trigger.
2. Agent reads scoped client data.
3. Agent creates proposals, not final actions.
4. Proposal includes target type, target ID, reasoning, suggested action, risk level, and required approval.
5. Operator approves, edits, rejects, or snoozes.
6. Approved proposal executes through the same API route a human action would use.
7. Result is logged.

This keeps agents useful without creating parallel hidden workflows.

## Session Build Plan

Each session should leave the app in a better, coherent state. Avoid building half-connected features that require later replacement.

## Session 1: Workflow Control And HITL Hardening

Goal:
Make AI review and human review reliable enough to trust as the backbone for later agents.

Build:

- Improve AI Library as the official HITL queue.
- Add clear status filters: draft, reviewed, approved, HITL, archived.
- Add visible rewrite attempt history.
- Highlight exact banned or risky phrases in the reviewed copy, including English and Spanish finance/approval/down-payment phrases.
- Add "send back through rewrite loop" action.
- Add "edit and approve" flow.
- Add rejection reason field.
- Add audit record for approval/rejection.

Current build changes:

- Package Builder already creates HITL outputs.
- AI Library already displays rewrite history.
- AI Library now highlights exact flagged phrases in the review preview.
- AI Library now supports rejection notes, send-back-to-rewrite, and review event logging.
- Next step is turning AI Library from a viewer into a true approval workspace.

Benefit:

- Agents can safely produce work because failed or risky work lands in a controlled queue.

Do not build yet:

- Autonomous publishing.
- Automated SMS/email sending.
- Large agent dashboard.

## Session 2: Campaign Review As The Publishing Center

Goal:
Make saved campaigns operational, not just stored records.

Build:

- Upgrade Campaign Review into the single place to finalize a campaign.
- Show vehicle, goal, language, channel list, copy, compliance status, attached creatives, setup checklist, and publishing path.
- Add per-channel status: draft, needs review, approved, exported, published, paused.
- Add manual publish tracker.
- Store published URL/post ID.
- Add export package per channel.
- Add campaign-level export bundle.

Current build changes:

- Campaign Package Builder should end in Campaign Review.
- Campaign Review should consume campaign channels and generated outputs rather than duplicating copy state.
- Campaign Review now exposes channel status counts, readiness checks, approve/export/published actions, destination URLs, published URL/post ID tracking, publish due dates, attached asset readiness, checklist notes, and owner approval state for paid channels.

Benefit:

- The operator gets one clear command center for each campaign.
- Publishing Assistant Agent can later act on structured campaign/channel statuses.

Avoid redundancy:

- Do not create a separate "Publishing" tab yet.
- Publishing belongs inside Campaign Review until it outgrows that surface.

## Session 3: Channel Module Contract

Goal:
Make every marketing channel modular, specific, and future-proof.

Build:

- Formalize `channelModules` as the contract for each channel.
- Each module should define:
  - channel ID
  - display name
  - goal fit
  - required copy fields
  - creative formats
  - setup checklist
  - compliance notes
  - export format
  - publishing method
  - metrics fields
  - whether API publishing is possible later

Add first clean channel modules in this priority order:

- Google Business Profile
- Google Ads
- Meta Paid Ads
- Instagram
- Craigslist
- Cars.com manual assisted package
- AutoTrader manual assisted package
- Facebook Organic Support for later CarsForSale-adjacent workflows
- TikTok/YouTube short-form package
- LinkedIn Commercial when the client has a business page and commercial inventory use case
- SMS/Email follow-up draft
- Short-form video package

Current build changes:

- Package Builder should render from channel modules.
- Campaign Review should render from channel modules.
- Reporting should later read metric definitions from channel modules.
- Channel modules now include Google Business Profile, Google Ads, Meta Paid, Instagram, Craigslist, Cars.com, AutoTrader, Facebook Organic, LinkedIn Commercial, SMS/Email, short-form video, and a legacy marketplace bundle for backward compatibility.
- New packages default to the priority channels instead of the old generic marketplace bundle.

Benefit:

- New channels can be added without redesigning the campaign system.
- Agents can understand each channel through structured requirements.

Avoid redundancy:

- Do not build separate custom forms per channel by hand.
- Let modules drive UI sections.

## Session 4: Inventory Readiness And Opportunity Scoring

Goal:
Make the system tell the operator what vehicles need marketing attention.

Build:

- Add readiness scoring:
  - has photo
  - has price
  - has down payment
  - has mileage
  - has description
  - has Spanish copy
  - has active campaign
  - inventory age
  - last marketed date

- Add opportunity scoring:
  - aging risk
  - commercial fit
  - Spanish-market fit
  - fresh arrival
  - high priority

- Show scores in Inventory and Cockpit.
- Create API route for readiness calculation.

Current build changes:

- Cockpit should stop being a mostly static queue and begin using scoring logic.
- Shared readiness scoring now exists in `src/features/inventory/readiness.ts`.
- `POST /api/inventory/readiness` exposes that scoring for agents and server workflows.
- Inventory shows readiness score and issue summary per vehicle.
- Cockpit uses the same readiness score for queue reasons, market-ready counts, and average readiness.
- Package Builder now shows selected-vehicle readiness, blockers, opportunities, and channel fit hints before generation.
- Shared campaign recommendation logic now ranks channels from readiness and vehicle fit.
- `POST /api/campaigns/recommendations` exposes recommendations for agents.
- Package Builder now shows recommended channels and can apply the recommended channel set.
- Cockpit campaign queue items now open Package Builder with recommended channels preselected.
- The old Campaign Builder route now redirects into Package Builder so campaign creation has one clear path.

Benefit:

- Campaign Planner Agent has a real basis for recommendations.
- Operator knows what to do next without digging.

Avoid redundancy:

- Do not put scoring only in UI.
- Scoring must be reusable by agents and reports.

## Session 5: Designer Workbench Redesign

Goal:
Make Designer a real vehicle-first creative builder.

Build:

- Vehicle selector as the first required step.
- Vehicle image/collage always acts as the base.
- Template overlay or blank overlay starts the design.
- Add full layer controls:
  - add text
  - add badge
  - add shape
  - add image/logo
  - delete
  - duplicate
  - undo
  - redo
  - clear overlay
  - reorder
  - lock/unlock

- Add template section inside Designer.
- Save as template.
- Save as finished creative.
- Attach creative to campaign/channel.
- Export image creates asset record.

Current build changes:

- Templates are not standalone navigation; Designer owns reusable template starts and editable work.
- Creatives is the finished/saved asset library.
- Designer starts vehicle-first with a protected background and protected vehicle photo base. Blank canvas now means blank overlay on top of the selected vehicle photo.
- The left rail includes Vehicle, Templates, Text, Photos, Shapes, Badges, Offer, Brand, Import, and Saved panels.
- Photo tools can add vehicle photo layers and simple collage compositions without replacing the protected base.
- Shape/layout tools add panels, bars, rails, shade overlays, offer footers, and split-panel starter layouts.
- Layer controls now include duplicate, reorder, lock/unlock, delete, undo, redo, reset, clear overlay, and a Stack panel.
- Save template persists `category = custom_template`; Save creative persists `category = saved_creative`.
- Saved Designer creatives can already attach to campaign channels through Campaign Review.
- Rendered PNG export now saves a `saved_creative` snapshot, uploads the PNG through `/api/creative-exports`, updates the saved creative preview URL, and downloads the file locally.
- `/api/creative-exports` can also register a storage-backed `campaign_assets` row when campaign/channel context is supplied.

Benefit:

- Creative generation and campaign assembly become connected.
- Creative Agent can later create/edit layer documents.

Avoid redundancy:

- Do not create separate "template builder" and "creative builder."
- A template is just a saved editable creative asset with reusable intent.

## Session 6: Campaign Assets And Export System

Goal:
Create a reliable asset system for text, images, scripts, videos, and export bundles.

Build:

- Expand `campaign_assets`.
- Add storage paths for exported files.
- Support asset types:
  - text_package
  - image_creative
  - video_script
  - storyboard
  - video_asset
  - report

- Add asset attachment to campaign channels.
- Add download/export history.
- Add generated file naming conventions.

Current build changes:

- Text exports create metadata-backed `campaign_assets` records.
- Campaign Review can attach manual URL/note references and saved Designer creatives directly to campaign channels.
- Saved creative attachments use `campaign_assets.template_id` so the editable Designer source stays traceable.
- Rendered image exports should use Supabase Storage or local file-backed storage during development.

Benefit:

- The app becomes a usable work product machine.
- Agents can reason about assets instead of loose downloads.

Avoid redundancy:

- Do not store finished creative only in Designer.
- Finished exports belong in campaign assets.

## Session 7: Agent Proposal Queue

Goal:
Create the control surface where agents can suggest work without taking over.

Build:

- Add proposal data model:
  - dealership_id
  - agent_type
  - target_type
  - target_id
  - proposal_type
  - title
  - reasoning
  - proposed_payload
  - risk_level
  - status
  - created_at
  - decided_at

- Add proposal API:
  - list proposals
  - approve proposal
  - reject proposal
  - snooze proposal

- Add proposal queue to Cockpit.
- Approved proposal executes existing app action.

Current build changes:

- Cockpit becomes the agent-friendly command center.
- Agents should not create one-off UI state.
- Agent proposals now persist in `agent_proposals` with idempotent `source_key` sync from Cockpit.
- `/api/agents/proposals` lists, creates, approves, rejects, archives, and snoozes proposals.
- Cockpit now shows persisted proposal rows with approve, reject, and snooze controls, and approved proposals execute the existing app navigation/action path.

Benefit:

- You can safely scale agentic workflows.
- Every agent action becomes reviewable and auditable.

Avoid redundancy:

- Do not make separate screens for every agent.
- Start with one proposal queue and filter by agent type.

## Session 8: Agent Runs And Daily Plan

Goal:
Let the system prepare a daily marketing plan.

Build:

- Add `agent_runs` model.
- Add Daily Plan Agent.
- Agent reviews inventory, campaigns, HITL, publishing status, leads, and performance.
- Agent creates ranked proposals.
- Cockpit shows:
  - do now
  - review
  - waiting
  - blocked
  - completed

Current build changes:

- Cockpit should become the default first screen for daily work.

Benefit:

- The operator no longer has to hunt for the next best action.

Avoid redundancy:

- Do not create a separate "Tasks" system unless proposals need recurring/manual assignments.
- Proposals can serve as early tasks.

## Session 9: Lead And Follow-Up Foundation

Goal:
Bring leads into the same operator workflow without prematurely automating risky communication.

Build:

- Normalize lead data.
- Track source, language, vehicle interest, status, assigned salesperson, last contact, next action.
- Add lead follow-up draft generator.
- Add Spanish response generator.
- Add approval before send.
- Store message drafts in generated outputs.

Current build changes:

- Marketing/SMS/email should not become a separate disconnected app.
- Lead follow-up should use Brand Brain, AI Library, compliance, and approval flow.

Benefit:

- Agents can help with follow-up while keeping control with the operator.

Avoid redundancy:

- Do not build a full CRM clone.
- Build only the lead actions that support marketing and sales follow-up.

## Session 10: Reporting And Feedback Loop

Goal:
Let results guide future agent recommendations.

Build:

- Manual metric entry per campaign channel.
- Metrics:
  - impressions
  - clicks
  - leads
  - calls
  - messages
  - appointments
  - sales
  - spend

- Add performance summaries.
- Add reporting agent recommendations.
- Feed campaign performance back into vehicle opportunity score.

Manual entry is not a temporary embarrassment; it is the correct early operating mode. The app should let the operator enter what is known now, then replace manual entry with API sync where access becomes available.

Current build changes:

- Reports should connect to campaigns/channels/assets, not demo-only analytics.

Benefit:

- Marketing decisions become data-backed.
- Agents can recommend refreshes based on performance.

Avoid redundancy:

- Do not build isolated report cards that do not map back to campaign/channel IDs.

## Session 11: Video And Rich Media Pipeline

Goal:
Prepare for Google Omni video commercial generation without blocking the current product.

Build:

- Video script generator.
- Storyboard generator.
- Shot list generator.
- Voiceover copy generator.
- Spanish voiceover copy.
- Prompt package export for Google Omni.
- Store scripts/storyboards in generated outputs.
- Store finished videos in campaign assets.

Current build changes:

- Video starts as a campaign asset workflow, not a separate app.

Benefit:

- You can use cloud credits for high-value production tasks only after the plan is reviewed.
- Video fits the same approve/export/publish flow.

Avoid redundancy:

- Do not create a disconnected video tool.
- Video is another asset type attached to campaigns/channels.

## Session 12: Platform Integrations

Goal:
Connect external services only after internal workflow is stable.

Build order:

1. Supabase Storage for assets.
2. Google Business Profile manual/API support.
3. Google Ads setup/export/API support.
4. Meta paid ads setup/export/API support.
5. Instagram publishing support where available.
6. Craigslist assisted manual packages.
7. Cars.com and AutoTrader assisted manual packages.
8. Google Omni video provider adapter.
9. SMS/email provider.
10. Marketplace integrations if accessible.

Current build changes:

- APIs should be provider adapters behind internal actions.
- The internal campaign/channel model should not be shaped around one provider.

Benefit:

- Integrations enhance the product instead of hijacking the data model.

Avoid redundancy:

- Do not create provider-specific app flows until the shared campaign flow is stable.

## Screen Purpose Map

Every screen should have a job.

- Agency: client-level overview.
- Cockpit: daily operator and agent proposal queue.
- Brand Brain: client rules and voice.
- AI Library: generated output memory, review, HITL, approval.
- Dashboard: client snapshot.
- Inventory: vehicle source of truth and readiness.
- Campaigns: saved campaign list.
- Package Builder: generate campaign package from a vehicle.
- Campaign Review: approve, export, publish, and track one campaign.
- Designer: editable creative workbench.
- Creatives: finished/saved asset library.
- Leads: lead follow-up and sales handoff.
- Marketing: only keep if it becomes broadcast/message campaign management; otherwise merge into Leads/Campaigns.
- Reports: performance feedback and recommendations.
- Settings: integrations, account, system config.

If a screen cannot be described in one clear sentence, it should be merged or deferred.

## Data Model Guardrails

Every new table should answer:

- Does this need its own lifecycle?
- Does this need permissions?
- Does this need audit history?
- Will agents need to query it?
- Can it be represented by an existing table?

Every multi-client row needs `dealership_id` unless explicitly global.

Every generic relationship needs both:

- `target_type`
- `target_id`

Every AI output needs:

- provider
- model
- prompt context
- source target
- language
- status
- review/compliance state
- approval state

## Agent Interface Standards

Agent-friendly operations should be structured as action APIs:

- generate campaign package
- run compliance check
- rewrite generated output
- create proposal
- approve proposal
- reject proposal
- create campaign
- update campaign channel
- attach asset
- export package
- mark published
- create lead follow-up draft
- score vehicle readiness

Each action should return structured status:

- `ok`
- `result`
- `warnings`
- `requiresApproval`
- `nextActions`

Agents should be able to operate without scraping the UI.

## Avoid These Traps

- Do not create a separate template tab.
- Do not create generic campaign text boxes for every channel.
- Do not let AI output exist only in local state.
- Do not create agent-specific workflows that bypass human approval.
- Do not build publishing automation before review/export is solid.
- Do not build video as a separate product.
- Do not build reports that are not tied to campaign/channel IDs.
- Do not let one provider's API shape the internal model.
- Do not create multiple places to approve the same thing.
- Do not bloat navigation with every internal concept.

## Build Quality Definition

A feature is not considered complete until:

- It has a clear screen purpose.
- It saves useful data.
- It is scoped to the active client.
- It has a status lifecycle if needed.
- It can be audited if AI or approval is involved.
- It uses existing design patterns.
- It can be called or reasoned about by an agent later.
- It does not duplicate another feature.
- It has documentation updated in the same session.
- It passes build verification.

## Recommended Immediate Next Session

Build Session 1 fully:

- Strengthen AI Library as the HITL queue.
- Add reject/edit/approve/send-back actions.
- Add audit trail for generated output decisions.
- Add clean UI states for unresolved compliance.
- Add structured APIs for those actions.

This is the right next move because the whole agentic platform depends on safe review and approval. Once that is solid, Campaign Review, Designer, publishing, and agents can all rely on the same control logic.
