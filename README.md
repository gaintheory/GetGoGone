# GetGoGone

Per-vehicle creative and omnichannel distribution engine for small used-car
dealerships. GetGoGone sits on top of AutoDoss inventory, produces ads, video and
feeds, publishes them across channels, and hands warm leads back to AutoDoss.

GetGoGone is **not** a DMS, a CRM, or a lead inbox — AutoDoss owns all of those.
See `docs/REDESIGN_2026-06.md` for the seam between the two systems.

## Running it from a browser (no local setup)

If you are away from your development machine, open the repo in a **GitHub Codespace**:

> On GitHub → green **Code** button → **Codespaces** tab → **Create codespace on
> `<branch>`**

`.devcontainer/` installs dependencies for you. Then, in the Codespace terminal:

```bash
echo "DISABLE_AUTH_GATE=true" > .env.local
npm run dev
```

Open the forwarded port 3000 and you are in, no password required. First container
build takes a couple of minutes.

The devcontainer deliberately does not write `.env.local` or disable the gate for you —
a committed script that turns authentication off is too easy to copy somewhere it does
not belong. Doing it yourself keeps it an explicit choice.

The forwarded port is private to your GitHub account by default. If you disable the
gate, **do not set port 3000 to Public** — that would expose the whole app with no
password.

If Codespaces is unavailable, an organisation owner may need to enable it for the repo
under Settings → Codespaces.

## Running locally

```bash
npm install
npm run dev
```

Open http://localhost:3000. The whole operator app is behind a password gate.

**Forgotten the password?** It is not stored in this repository and cannot be
recovered — it lives only in the environment where the app runs. Set a new one:

```bash
node scripts/set-site-password.mjs 'choose something'
```

That writes `SITE_PASSWORD` to `.env.local` and generates `SITE_AUTH_COOKIE_SECRET`
if it is missing. Restart the dev server and sign in at `/login`. When deployed, change
`SITE_PASSWORD` in your host's environment settings instead and redeploy.

**Just want in without a password while you work?** Add this to `.env.local`:

```env
DISABLE_AUTH_GATE=true
```

The gate is skipped and the server prints a warning on the first request. This is
**ignored in production builds** — `next build` / `next start` and every hosting
platform set `NODE_ENV=production`, and the flag is only read when `NODE_ENV` is not
production, so it cannot open a deployed site. Verified: a production build with the
flag set still redirects to `/login` and still returns 401 on APIs.

After any change to the gate, confirm it is still enforcing:

```bash
node scripts/check-auth-gate.mjs            # or pass a deployment URL
```

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

The auth gate lives at `src/proxy.ts`. It must sit beside `src/app` and export a
function named `proxy` — Next.js 16 renamed the old `middleware` convention. Both the
path and the name matter, and getting either wrong disables the gate **silently**: the
build, the type checker and lint all still pass while every route serves anonymously.
That exact bug shipped once. `scripts/check-auth-gate.mjs` guards against a repeat.

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
