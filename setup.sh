#!/usr/bin/env bash
# FusionClaw — one-command quickstart bootstrap
# ----------------------------------------------------------------------------
# This script:
#   1. Verifies Node 20+ is installed
#   2. Copies .env.local.example → .env.local if missing
#   3. Generates a SESSION_SECRET if blank
#   4. Generates an MCP_API_KEY if blank
#   5. Generates an ENCRYPTION_KEY if blank
#   6. Runs `npm install`
#   7. Runs `drizzle-kit push` (if DATABASE_URL is set)
#   8. Tells you what's next
# ----------------------------------------------------------------------------

set -e

GREEN='\033[0;32m'
AMBER='\033[0;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
RESET='\033[0m'

say() { printf "${CYAN}▸${RESET} %s\n" "$1"; }
ok()  { printf "${GREEN}✓${RESET} %s\n" "$1"; }
warn(){ printf "${AMBER}!${RESET} %s\n" "$1"; }
err() { printf "${RED}✗${RESET} %s\n" "$1"; }

echo ""
echo "  ▰▰▰  FusionClaw — Quickstart  ▰▰▰"
echo ""

# ── 1. Node version ────────────────────────────────────────────────────────
if ! command -v node >/dev/null 2>&1; then
  err "Node.js not found. Install Node 20+ from https://nodejs.org"
  exit 1
fi
NODE_MAJOR=$(node -p "process.versions.node.split('.')[0]")
if [ "$NODE_MAJOR" -lt 20 ]; then
  err "Node $NODE_MAJOR detected. FusionClaw needs Node 20+."
  exit 1
fi
ok "Node $(node -v)"

# ── 2. .env.local ──────────────────────────────────────────────────────────
if [ ! -f .env.local ]; then
  if [ -f .env.local.example ]; then
    cp .env.local.example .env.local
    ok "Created .env.local from template"
  else
    warn ".env.local.example not found — creating empty .env.local"
    touch .env.local
  fi
else
  ok ".env.local exists"
fi

# ── 3-5. Generate secrets if blank ─────────────────────────────────────────
gen_hex32() { node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"; }
gen_b64()   { node -e "console.log('fusionclaw_sk_live_' + require('crypto').randomBytes(24).toString('base64url'))"; }

ensure_key() {
  local key="$1"; local generator="$2"; local label="$3"
  if grep -q "^${key}=$" .env.local || ! grep -q "^${key}=" .env.local; then
    local value
    value=$($generator)
    if grep -q "^${key}=" .env.local; then
      # macOS sed compat
      sed -i.bak "s|^${key}=.*|${key}=${value}|" .env.local && rm .env.local.bak
    else
      echo "${key}=${value}" >> .env.local
    fi
    ok "Generated ${label}"
  fi
}

ensure_key "SESSION_SECRET"  gen_hex32 "SESSION_SECRET (32-byte hex)"
ensure_key "ENCRYPTION_KEY"  gen_hex32 "ENCRYPTION_KEY (32-byte hex)"
ensure_key "MCP_API_KEY"     gen_b64   "MCP_API_KEY"

# ── 6. npm install ─────────────────────────────────────────────────────────
say "Installing dependencies (this may take a minute)…"
npm install --silent
ok "Dependencies installed"

# ── 7. Database push ───────────────────────────────────────────────────────
if grep -q "^DATABASE_URL=postgresql" .env.local; then
  say "Pushing schema to your database…"
  if npx drizzle-kit push 2>&1 | tail -5; then
    ok "Schema applied"
  else
    warn "drizzle-kit push had issues — check DATABASE_URL"
  fi
else
  warn "DATABASE_URL not configured. Edit .env.local and rerun ./setup.sh — or:"
  echo "       npx drizzle-kit push"
fi

# ── 8. What's next ─────────────────────────────────────────────────────────
echo ""
echo "${GREEN}▰▰▰  Setup complete  ▰▰▰${RESET}"
echo ""
echo "Next steps:"
echo "  1. Add your OPENROUTER_API_KEY to .env.local (required for skills + agents)"
echo "  2. Optional: OPENAI_API_KEY (for /voice + voice notes), FAL_KEY, RESEND_API_KEY"
echo "  3. Start the dev server:"
echo ""
echo "       ${CYAN}npm run dev${RESET}"
echo ""
echo "  4. Open http://localhost:3000"
echo "  5. To populate demo data, after the server is running:"
echo ""
echo "       ${CYAN}curl -X POST http://localhost:3000/api/demo/seed${RESET}"
echo ""
echo "Local mode requires no auth. For self-host with public URL, set OWNER_PASSWORD."
echo ""
