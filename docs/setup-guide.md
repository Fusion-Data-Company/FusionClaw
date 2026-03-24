# Setup Guide

Complete guide to getting FusionClaw running locally and in production.

## Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | 20+ | Runtime |
| npm | 10+ | Package manager |
| Git | 2.x | Version control |

## 1. Clone and Install

```bash
git clone https://github.com/Fusion-Data-Company/FusionClaw.git
cd FusionClaw
npm install
```

## 2. Database Setup (Neon PostgreSQL)

1. Create a free database at [neon.tech](https://neon.tech)
2. Copy the connection string from the Neon dashboard
3. You'll need both the pooled and unpooled URLs

## 3. API Keys

| Service | Get Key At | Purpose |
|---------|-----------|---------|
| OpenRouter | [openrouter.ai/keys](https://openrouter.ai/keys) | AI text generation |
| fal.ai | [fal.ai/dashboard](https://fal.ai/dashboard/keys) | Image generation |
| Vercel Blob | Vercel project settings | File storage |

## 4. Interactive Setup

The fastest way to configure everything:

```bash
npm run onboard
```

This will:
- Prompt for your database URL
- Prompt for API keys
- Generate a secure MCP API key
- Create `.env.local`
- Push the database schema

## 5. Manual Setup

If you prefer manual configuration, create `.env.local`:

```bash
# Database (from Neon dashboard)
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require

# AI Services
OPENROUTER_API_KEY=sk-or-v1-...
FAL_KEY=...

# Storage (from Vercel project settings)
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...

# Auth
GATEWAY_PASSWORD=your-secure-password
ADMIN_EMAIL=you@example.com
ADMIN_NAME=Your Name

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Then push the schema:

```bash
npx drizzle-kit push
```

## 6. Start Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and log in with your `GATEWAY_PASSWORD`.

## 7. MCP Server (Optional)

To enable AI agent access:

```bash
npm run mcp:build   # compile the MCP server
npm run mcp         # start it
```

See [MCP Tools Reference](./mcp-tools.md) for the full tool catalog.

## Production Deployment (Vercel)

1. Push to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Set all environment variables in Vercel project settings
4. Deploy

The build command is automatically detected (`next build`).

## Troubleshooting

### Database connection fails
- Verify `DATABASE_URL` uses `?sslmode=require`
- Check that your Neon project is not suspended (free tier suspends after inactivity)

### Build fails with TypeScript errors
- Run `npm run build` locally first
- The `mcp-server/` directory is excluded from TypeScript checking (it builds separately)

### Images not generating
- Verify `FAL_KEY` is set
- Check the fal.ai dashboard for usage limits

### Chat not responding
- Verify `OPENROUTER_API_KEY` is set
- Check OpenRouter dashboard for credit balance
