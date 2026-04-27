---
title: Authentication
summary: How auth works in FusionClaw — localhost trust, OWNER_PASSWORD, MCP API key, and the security model behind each.
---

# Authentication

FusionClaw has **no third-party auth provider.** No Clerk, no Auth0, no NextAuth, no signup with anyone but yourself. The auth model is deliberately simple:

- **Localhost** is trusted. No login screen.
- **Deployed** instances gate the web UI on a single `OWNER_PASSWORD` env var.
- **Agents** authenticate with the `MCP_API_KEY` over a Bearer header.
- **Multi-user** support exists in the schema but is opt-in and uses invite-link tokens, not passwords.

This page documents the model and where the security perimeter lives.

---

## The four authentication paths

| Caller | How it authenticates | What it can do |
|---|---|---|
| Owner (you) on localhost | Trusted automatically — middleware sees `host: localhost:*` | Everything |
| Owner on a deployed URL | Submit `OWNER_PASSWORD` at `/login`, get signed JWT cookie | Everything |
| Employee | Owner generates an invite link with a one-time token, employee clicks, gets signed cookie | Per-role permissions |
| AI agent (MCP) | `Authorization: Bearer <MCP_API_KEY>` on API requests | Bypasses session auth on `/api/*` routes |

These four paths converge in `lib/auth.ts` and `middleware.ts`.

---

## Path 1 — Localhost trust

When the request `host` header matches `localhost:*`, `127.0.0.1:*`, or `[::1]:*`, the middleware lets it through unconditionally. `lib/auth.ts:isLocalhostRequest()` is the gate.

In server components, `getCurrentUser()` returns the singleton "owner" user — automatically created on the first request via `getOrCreateOwner()`. There's exactly one row in `users` with `auth_id = 'owner'` and `role = 'admin'`.

**Why we can trust localhost:** if someone has shell access to your machine, they already have your data. There's no useful threat model where they go through your local web UI when they could just `psql` your DB directly.

**Implication:** never `npm run dev` on a machine you've forwarded port 3000 from to the internet (e.g., via ngrok, Tailscale Funnel) without setting up auth or restricting access.

---

## Path 2 — `OWNER_PASSWORD` (deployed instances)

When the request `host` is anything other than localhost (e.g., `fusionclaw.yourdomain.com`), the middleware requires either a valid session cookie or an MCP Bearer token.

The user signs in by POSTing their password to `/api/auth/login`:

```
POST /api/auth/login
Content-Type: application/json

{ "password": "your-owner-password" }
```

The server checks against `process.env.OWNER_PASSWORD` using `crypto.timingSafeEqual` (constant-time, no timing leaks). If it matches, it issues a signed JWT (using `jose`) and sets it in an HttpOnly, SameSite=Lax, Secure-in-prod cookie called `fc_session`.

```js
// lib/auth.ts
export async function setSessionCookie(userId: string) {
  const token = await signSession(userId)
  const cookieStore = await cookies()
  cookieStore.set('fc_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 30 * 24 * 60 * 60,  // 30 days
  })
}
```

The cookie carries a signed `{ uid: string }` payload. The JWT signing key is `SESSION_SECRET` (or fallback to `MCP_API_KEY` or `OWNER_PASSWORD`).

If `OWNER_PASSWORD` is not set on a deployed instance, `/api/auth/login` returns 503 with a clear error pointing the operator at env-var setup.

---

## Path 3 — Employee invite (multi-user)

Optional. Owners stay single-user by default.

When the owner adds an employee from `/employees`, the system generates a one-time invite token (random 32 bytes, base64url encoded) stored in the `users` table as the employee's `auth_id`. The owner shares the invite link with the employee out-of-band (email, Signal, Slack — not FusionClaw's problem).

The employee clicks the link, the server verifies the token, issues a signed cookie, and the employee is now authenticated as themselves with `role = 'employee'`. They have a subset of admin's permissions.

**No passwords.** The invite token is the credential. It can be rotated by the owner from `/employees`.

---

## Path 4 — MCP API key (agents)

API routes accept a Bearer token in the `Authorization` header. The middleware checks every request to `/api/*`:

```ts
// middleware.ts
if (isApi(pathname)) {
  const authHeader = req.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const key = authHeader.slice(7)
    if (validateMcpApiKey(key)) return NextResponse.next()
  }
}
```

`validateMcpApiKey` does a constant-time compare against `process.env.MCP_API_KEY`. The key format is `fusionclaw_sk_live_<48 chars of base64url>`.

The Bearer path **bypasses session auth entirely** — the agent doesn't need a cookie. This is by design: agents are stateless callers and auth needs to be a single header.

**Implication:** the MCP API key is your most sensitive secret. Anyone with it has full programmatic access to your business state. Treat it like a credit card number.

→ See [security/mcp-key](mcp-key.md) for handling, rotation, and revocation.

---

## What's NOT in scope

- **OAuth / SSO** — not in v1.0. Self-hosted single-tenant doesn't need it. Multi-tenant SaaS deploys would; those aren't shipping in v1.0.
- **MFA** — the threat model is single-owner self-host. Adding MFA on top of `OWNER_PASSWORD` means another secret to lose. v1.1 may add TOTP for deployed instances.
- **Per-page permissions** — admin/employee role gating exists for a few admin-only routes (employee management). Fine-grained ACLs (e.g., "this employee can see leads but not invoices") are v1.1+.

---

## Security perimeter

The files that define the perimeter:

| File | What it does |
|---|---|
| `middleware.ts` | First gate — runs on every request, decides public vs auth-required, agent vs human |
| `lib/auth.ts` | Session signing/verification, cookie setting, MCP key validation, role checks |
| `app/api/auth/login/route.ts` | Owner password login endpoint |
| `app/api/auth/logout/route.ts` | Cookie clearing |
| `.env.local` | Where the secrets live |

When auditing FusionClaw security, start with these four. Don't trust any other code claiming to "verify" auth without going through these.

---

## Public routes (intentionally unauthenticated)

The middleware allows these without auth:

- `/` — landing page (marketing)
- `/login` — the auth gate
- `/api/auth/login` — POST endpoint
- `/api/auth/logout` — POST endpoint
- `/api/google/callback` — Google OAuth callback for Workspace integration
- `/embed/*` — tokenized client-portal pages (token in URL is the auth)
- `/api/hooks/*` — inbound webhooks (secret in URL is the auth)
- `/api/inbound-emails` — inbound email receiver (provider auth at the receiving end)

The `/embed`, `/api/hooks`, and `/api/inbound-emails` paths each carry their own credential in the URL or body. Their security model is documented per-route in [security/webhooks](webhooks.md).

---

## Next

- [security/owner-password](owner-password.md) — picking a strong password, rotating it, recovering from loss
- [security/mcp-key](mcp-key.md) — handling the agent credential, rotation
- [security/secrets](secrets.md) — env-var hygiene
- [security/webhooks](webhooks.md) — inbound webhook secrets
- [security/deployment](deployment.md) — hardening for production
