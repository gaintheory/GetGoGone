#!/usr/bin/env bash
#
# Codespace / dev container first-run setup.
#
# Installs dependencies only. This script deliberately does NOT create .env.local,
# generate credentials, or alter the auth gate — a committed script that turns
# authentication off is a footgun waiting to be copied somewhere it does not belong.
# Configuring the environment stays an explicit, human decision. See the README
# section "Running it from a browser" for the one command that gets you in.

set -euo pipefail

echo "==> Installing dependencies"
npm install --no-audit --no-fund

cat <<'EOF'

────────────────────────────────────────────────────────────────────────
 GetGoGone dependencies are installed.

 This app is behind a password gate and there is no default password.
 To open it without one while you work in this Codespace:

     echo "DISABLE_AUTH_GATE=true" > .env.local
     npm run dev

 Then open the forwarded port 3000. DISABLE_AUTH_GATE is ignored in
 production builds, so it cannot affect a real deployment.

 To use a password instead:

     node scripts/set-site-password.mjs 'choose something'
     npm run dev

 Screens stay mostly empty until NEXT_PUBLIC_SUPABASE_URL and
 SUPABASE_SERVICE_ROLE_KEY are set in .env.local — the app shows a banner
 telling you it is displaying demo vehicles. See .env.example.

 SECURITY: this Codespace's forwarded port is private to your GitHub
 account by default. If you disable the auth gate, do NOT switch port 3000
 to Public — that would expose the whole app with no password.
────────────────────────────────────────────────────────────────────────

EOF
