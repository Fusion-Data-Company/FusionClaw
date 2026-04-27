---
title: Vercel install
summary: One-click deploy to Vercel. Live URL in 90 seconds.
---

# Vercel install

The fastest way to a public URL. Vercel handles building and hosting, Neon handles the database, you just provide env vars.

---

## Prerequisites

- A free [Vercel](https://vercel.com) account
- A free [Neon](https://neon.tech) account
- A GitHub account (Vercel will fork the repo into yours)

---

## One-click deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FFusion-Data-Company%2FFusionClaw&env=DATABASE_URL,MCP_API_KEY,SESSION_SECRET,OWNER_PASSWORD,OPENROUTER_API_KEY,FAL_KEY,OPENAI_API_KEY&envDescription=Generate%20MCP_API_KEY%2C%20SESSION_SECRET%2C%20and%20OWNER_PASSWORD%20locally%20first%20(see%20docs)&envLink=https%3A%2F%2Fgithub.com%2FFusion-Data-Company%2FFusionClaw%2Fblob%2Fmain%2Fdocs%2Finstall%2Fvercel.md)

What this does:
1. Forks `Fusion-Data-Company/FusionClaw` to your GitHub
2. Creates a new Vercel project pointed at the fork
3. Prompts for env vars (see below)
4. Deploys

---

## Env vars to provide

| Var | Required? | How to get |
|---|---|---|
| `DATABASE_URL` | **Yes** | Create a Neon project, copy the **pooled** connection string |
| `MCP_API_KEY` | **Yes** | Generate locally: `node -e "console.log('fusionclaw_sk_live_' + require('crypto').randomBytes(24).toString('base64url'))"` |
| `SESSION_SECRET` | **Yes** | Generate: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `OWNER_PASSWORD` | **Yes** for public URLs | Pick a strong password. This is the only auth gate for the deployed UI. |
| `ENCRYPTION_KEY` | Optional | Generate same as SESSION_SECRET. Required if you'll store user API keys in Settings. |
| `OPENROUTER_API_KEY` | Optional | [openrouter.ai/keys](https://openrouter.ai/keys) — needed for AI text features |
| `FAL_KEY` | Optional | [fal.ai/dashboard/keys](https://fal.ai/dashboard/keys) — needed for image generation |
| `OPENAI_API_KEY` | Optional | OpenAI dashboard — unlocks `/voice` (Realtime API) and Whisper transcription |
| `RESEND_API_KEY` | Optional | [resend.com](https://resend.com) — email campaigns |
| `BLOB_READ_WRITE_TOKEN` | Optional | Vercel project → Storage → Blob — file uploads (Studio, Branding) |

After deploy, Vercel runs `npm run build`, which includes the schema migration. First boot takes ~90 seconds; subsequent deploys are faster.

---

## Post-deploy checklist

1. **Visit your Vercel URL** (something like `fusionclaw-yourname.vercel.app`).
2. **Click any sidebar nav item** — you should be redirected to `/login`. The deployed instance enforces auth.
3. **Enter your `OWNER_PASSWORD`** at `/login`. You're in.
4. **Add additional API keys** at `/settings` if you skipped any during deploy.
5. **Connect your AI agent** with the `MCP_API_KEY` you generated → [snippets/claude-code-config](../snippets/claude-code-config.md)

---

## Custom domain

Vercel project → Settings → Domains → add your domain (e.g., `fusionclaw.yourdomain.com`).

Set your DNS:
- For apex (`yourdomain.com`): A record → Vercel's IP (Vercel will tell you which)
- For subdomain: CNAME → `cname.vercel-dns.com`

After DNS propagates (usually <1 hour), `https://fusionclaw.yourdomain.com` resolves to your instance.

Update `NEXT_PUBLIC_APP_URL` in Vercel env vars to match.

---

## Updating

Vercel auto-deploys on every push to `main` of your fork. To pull upstream changes:

```bash
git remote add upstream https://github.com/Fusion-Data-Company/FusionClaw.git
git fetch upstream
git merge upstream/main
git push origin main
```

Vercel kicks off a new deploy. Schema migrations run on build.

---

## Cost

| Tier | Vercel | Neon | Total |
|---|---|---|---|
| Free | $0 | $0 | $0 |
| Pro (more bandwidth, no sleep) | $20/mo | $19/mo | ~$40/mo |

For most self-hosters, the free tier is enough. Neon's free tier suspends after inactivity — first request after a long pause takes ~5 seconds to wake up. Vercel's free tier has bandwidth caps; if you're getting traffic, upgrade.

---

## Multi-tenant for agencies

You don't run one Vercel project for multiple clients. You fork the repo per client (or use Vercel's "Promote to Production" with separate Git branches per client). Each client gets their own Vercel project, their own Neon database, their own custom domain. The MIT license permits all of this.

For a true multi-tenant model (one deploy, multiple business databases), see the v1.1 roadmap in [VISION.md](../../VISION.md).

---

## Troubleshooting

**Build fails on first deploy** → usually missing `DATABASE_URL`. Re-check Vercel env vars.

**`/login` returns 503** → `OWNER_PASSWORD` is unset. Add it in Vercel project → Settings → Environment Variables → redeploy.

**Schema migration didn't run** → check Vercel build logs. If `drizzle-kit push` failed, run it manually with your Neon URL: `DATABASE_URL=... npx drizzle-kit push`.

More: [help/install-issues](../help/install-issues.md).
