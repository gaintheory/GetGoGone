# GetGoGone

Per-vehicle creative and omnichannel distribution engine for small used-car
dealerships. GetGoGone sits on top of AutoDoss inventory, produces ads, video and
feeds, publishes them across channels, and hands warm leads back to AutoDoss.

GetGoGone is **not** a DMS, a CRM, or a lead inbox — AutoDoss owns all of those.
See `docs/REDESIGN_2026-06.md` for the seam between the two systems.

## Running locally

```bash
npm install
npm run dev
```

Open http://localhost:3000. The whole operator app is behind a password gate; see
"Authentication" below.

## Required environment

Create `.env.local` in the project root.

| Variable | Required | Purpose |
|---|---|---|
| `SITE_PASSWORD` | yes | The single shared site password |
| `SITE_AUTH_COOKIE_SECRET` | yes | HMAC key for the session cookie (min 16 chars) |
| `NEXT_PUBLIC_SUPABASE_URL` | yes | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | yes | Server-side Supabase key |
| `AUTODOSS_API_URL` | for live inventory | AutoDoss Data API base URL |
| `AUTODOSS_API_KEY` | for live inventory | Service master or per-dealership key |
| `AUTODOSS_WEBHOOK_SECRET` | optional | Verifies AutoDoss inventory pings |
| `PUBLIC_BASE_URL` | for campaigns | Absolute base for landing-page links |
| `LOCAL_OLLAMA_URL` | optional | Defaults to `http://localhost:11434` |
| `COMFYUI_URL` | optional | Defaults to `http://localhost:8188` |

Without `AUTODOSS_API_URL` / `AUTODOSS_API_KEY` the app falls back to demo
vehicles and says so in a banner. If a client is selected but its
`dealerships.autodoss_dealer_id` is unset, `/api/inventory` returns
409 `dealership_not_linked` — set that column to the id AutoDoss reports from
`GET /api/v1/dealers`.

## Authentication — read this before deploying

There are **no user accounts**. `SITE_PASSWORD` is one shared password; the session
cookie carries no identity. The `profiles` table and every `created_by` column exist
in the schema but are never written, so `audit_log` has no actor. RLS is enabled on
all tables with **no policies defined**, and the app connects with the service-role
key, which bypasses RLS — tenant isolation depends entirely on correct filters in
route handlers.

This is workable for a single operator and must be resolved before any dealer is
given a login. See `docs/DATA_MODEL.md` → "Known gap — `profiles` is unused".

## What is real and what is simulated

AI text and image generation run against **local** services (Ollama, ComfyUI). They
do not work in a deployed environment without pointing those variables at reachable
hosts.

**Publishing and video rendering are simulated.** No ad-platform API client and no
video renderer exist. Simulated results are labelled `simulated: true`, use `sim_`
id prefixes, and write `audit_log.action = "channel_publish_simulated"`. If a real
platform credential is configured, those routes return **501** rather than fake a
result. Full detail in `docs/INTEGRATIONS.md`.

## Layout

```
src/app/api/         route handlers
src/app/v/           public per-vehicle landing pages
src/prototype/       the operator UI (screens + design system)
src/features/        domain logic (inventory, campaigns, ai)
src/lib/             supabase, autodoss client, auth, publishing guards
supabase/            migrations
docs/                see docs/DECISIONS.md for the running decision log
prototype-handoff/   frozen Claude Design handoff — visual source of truth, do not edit
```

## Checks

```bash
npm run build
npm run lint
```

`npm run build` passes. `npm run lint` does not yet — see `docs/REVIEW_2026-08.md`.

## Conventions

Read `AGENTS.md` before contributing. Two rules matter most: documentation under
`docs/` must be updated in the same session as the change it describes, and the
Claude Design handoff is the visual source of truth.
