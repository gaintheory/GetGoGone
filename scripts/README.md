# scripts/

Diagnostic and seeding helpers — not part of the production app.

| File | Purpose |
|------|---------|
| `carsforsale-photo-spike.mjs` | Scrapes a hardcoded dealer website (rightpriceautosales.net) to explore vehicle listing and photo URL structure; used for feed-import research. |
| `db-check.mjs` | Connects to Supabase via `.env.local` and dumps basic table-row counts for quick sanity checks during development. |
| `db-check-dealerships.mjs` | Connects to Supabase via `.env.local` and queries the `dealerships` table; used to verify dealership rows after migrations. |
| `test-create-worker.mjs` | Spins up a Tesseract.js OCR worker with explicit local paths and runs a test recognition; used to diagnose the `eng.traineddata` path issue. |
| `seed-demo-proposals.mjs` | Seeds demo `agent_proposals` rows into a running dev server; requires a valid `ggg_auth` session cookie or the `COOKIE` env var. |
| `set-site-password.mjs` | Sets `SITE_PASSWORD` in `.env.local` and generates `SITE_AUTH_COOKIE_SECRET` if missing. The site password is not recoverable from the codebase — if you've forgotten it, run this to set a new one, then restart the dev server. |
| `check-auth-gate.mjs` | Asserts the site-wide auth gate is actually enforcing against a running server (`node scripts/check-auth-gate.mjs [base-url]`). Exists because the gate once failed silently — build, types and lint all passed while every route was public. |
