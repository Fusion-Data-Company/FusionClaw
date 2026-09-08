# Provisioning a Hosted FusionClaw buyer ($99 / month)

FusionClaw is single-tenant by design: one owner password, one MCP key, one database per
business. So every hosted buyer gets their own Vercel project and their own Neon database.

| Instance | Vercel project | Database | Notes |
|---|---|---|---|
| Marketing site + our own instance | `fusionclaw` → fusionclaw.app | Neon (ours) | Frozen. Gated by OWNER_PASSWORD. Never sold, never linked as a demo, never migrated. |
| DEMO | `fusionclaw-demo` → fusionclaw-demo.vercel.app | Neon `square-cherry-03585664` | `NEXT_PUBLIC_DEMO_MODE=true`: every visitor is the owner, every write is refused, fictional seed. The only thing "Live Demo" buttons, the catalog and emails point at. |
| BUYER | `fusionclaw-<slug>` → `<slug>.fusionclaw.app` | new Neon project | One per paying customer, empty, their own password + MCP key. |

## Trigger

Stripe payment link https://buy.stripe.com/bJe00j7Hdcy87wb8h8aAw0c
(product `prod_VDDNrdNdWSbVlE`, price `price_1UCmwpEkfFOXPr6DHsgHlLxa`, 14-day trial).
Checkout collects `business` and `subdomain`; the confirmation page says the login link arrives
within 1 business day. Read both fields from the Checkout Session in the Stripe dashboard.

## Steps (about 25 minutes)

1. **Neon** – create project `fusionclaw-<slug>` (us-east-2), copy the pooled URI.
2. **Vercel** – create project `fusionclaw-<slug>` linked to `Fusion-Data-Company/FusionClaw`,
   branch `main`. Env for all environments, set **before** the first deploy:
   ```
   DATABASE_URL, DATABASE_URL_UNPOOLED   <neon>
   OWNER_PASSWORD        openssl rand -base64 18   (what they log in with)
   OWNER_EMAIL / OWNER_NAME   from the checkout customer
   SESSION_SECRET        openssl rand -hex 32
   MCP_API_KEY           fc_$(openssl rand -hex 24)   (their agents authenticate with this)
   ENCRYPTION_KEY        openssl rand -hex 32
   NEXT_PUBLIC_APP_URL   https://<slug>.fusionclaw.app
   OPENROUTER_API_KEY    platform key (they can replace it in Settings → Integrations)
   NEXT_PUBLIC_DEMO_MODE leave unset (never "true" on a buyer)
   ```
3. **Schema + owner** – on the device VM:
   ```
   cd ~/work/FusionClaw && git pull
   DATABASE_URL=<neon> npx drizzle-kit push --force
   DATABASE_URL=<neon> OWNER_EMAIL=<email> OWNER_NAME="<name>" npx tsx scripts/seed-wiki.ts   # wiki memory only, no sample business data
   ```
   Do **not** run `scripts/seed.ts` on a buyer — that is the fictional demo book.
4. **Domain** – add `<slug>.fusionclaw.app` to the project (fusionclaw.app DNS is on Vercel, so it
   verifies itself).
5. **Deploy** – `POST /v13/deployments` for the project. Confirm `/dashboard` redirects to `/login`
   and the password works.
6. **Hand-off email** – URL, owner password, MCP key with the Claude Code snippet from
   `docs/claude-code-setup.md`, and the customer-portal link for billing.
7. **Record** – append `slug | neon | vercel | stripe customer` to
   `~/Projects/_xfer/fusionclaw-buyers.txt` on the device.

## Custom integrations

Every integration (mail, WordPress, image generation, voice, models) sits behind a driver in
`lib/`. A buyer who wants their own stack gets a driver wired on their own env; demo and our
instance stay untouched.

## Tear-down

Cancel the Stripe subscription → export their data (`/api/export` as the owner) → delete the
Vercel project → delete the Neon project → remove the buyers.txt line.
