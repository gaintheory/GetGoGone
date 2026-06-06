# scripts/

Diagnostic and seeding helpers — not part of the production app.

| File | Purpose |
|------|---------|
| `carsforsale-photo-spike.mjs` | Scrapes a hardcoded dealer website (rightpriceautosales.net) to explore vehicle listing and photo URL structure; used for feed-import research. |
| `db-check.mjs` | Connects to Supabase via `.env.local` and dumps basic table-row counts for quick sanity checks during development. |
| `db-check-dealerships.mjs` | Connects to Supabase via `.env.local` and queries the `dealerships` table; used to verify dealership rows after migrations. |
| `test-create-worker.mjs` | Spins up a Tesseract.js OCR worker with explicit local paths and runs a test recognition; used to diagnose the `eng.traineddata` path issue. |
| `seed-demo-proposals.mjs` | Seeds demo `agent_proposals` rows into a running dev server; requires a valid `ggg_auth` session cookie or the `COOKIE` env var. |
