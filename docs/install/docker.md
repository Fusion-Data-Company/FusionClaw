---
title: Docker install
summary: Run FusionClaw + Postgres in containers with one curl command. Zero Node setup.
---

# Docker install

Use this path if you want to skip Node/npm entirely or run FusionClaw in an isolated environment.

---

## Prerequisites

| Tool | Version |
|---|---|
| Docker | 24+ |
| Docker Compose | v2 (built into modern Docker Desktop) |

That's it. No Node, no Postgres, no Neon account required — Docker spins up its own Postgres locally.

---

## One-command install

```bash
curl -fsSL fusionclaw.app/install-docker.sh | bash
```

The script:

1. Pulls the FusionClaw `docker-compose.yml`
2. Pulls the FusionClaw image (or builds locally if you cloned the repo)
3. Brings up Next.js + Postgres
4. Runs `drizzle-kit push` against the local Postgres
5. Opens `http://localhost:3000`

---

## Manual install

```bash
git clone https://github.com/Fusion-Data-Company/FusionClaw.git
cd FusionClaw
docker compose up -d
```

First run takes ~2 minutes (image pull + build + schema migration). Subsequent runs start in seconds.

---

## What's running

`docker compose ps` shows:

```
NAME                   IMAGE                 STATUS         PORTS
fusionclaw-app-1       fusionclaw:latest     running        0.0.0.0:3000->3000/tcp
fusionclaw-postgres-1  postgres:16-alpine    running        0.0.0.0:5432->5432/tcp
```

The `fusionclaw-postgres-1` container has its own data volume; data persists across restarts.

---

## Add API keys

Without API keys, AI features (chat, image gen, voice) will be disabled but everything else works.

To add keys, edit `.env` in the repo root:

```bash
OPENROUTER_API_KEY=sk-or-v1-...
FAL_KEY=...
OPENAI_API_KEY=sk-...   # for /voice
RESEND_API_KEY=re_...   # for email campaigns
```

Then restart:

```bash
docker compose restart app
```

---

## Updating

```bash
git pull
docker compose pull        # if you're using the published image
docker compose up -d       # restart with new image / new code
```

Schema migrations run automatically on app startup.

---

## Stopping / removing

```bash
docker compose down              # stop containers, keep data
docker compose down -v           # stop containers AND wipe Postgres data
```

---

## Troubleshooting

**Port 3000 already in use** → another app is on it. Either stop the other app, or edit `docker-compose.yml` to change the host port: `"3001:3000"`.

**Postgres won't start** → check disk space; Docker volumes can fill up. `docker volume ls` to inspect.

**Schema migration fails** → check the app logs: `docker compose logs app`. Most common: a previous schema change conflicts. Wipe and rebuild: `docker compose down -v && docker compose up -d`.

More: [help/troubleshooting](../help/troubleshooting.md).
