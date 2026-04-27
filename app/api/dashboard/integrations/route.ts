import { NextResponse } from "next/server";

/**
 * Returns the real connection status of every integration the dashboard
 * surfaces. Status is derived from env-var presence (not just hardcoded).
 *
 * - "connected"     → env var is present and looks valid
 * - "warning"       → env var is present but looks like a placeholder
 * - "disconnected"  → env var is missing or empty
 *
 * This replaces the hardcoded TOOLS array on the dashboard, which was
 * showing green checks for things that weren't actually configured.
 */
export const dynamic = "force-dynamic";

type Status = "connected" | "warning" | "disconnected";

function check(value: string | undefined, looksLike?: RegExp): Status {
  if (!value || value.trim().length === 0) return "disconnected";
  if (value.startsWith("# ") || value.toLowerCase().includes("not configured")) {
    return "disconnected";
  }
  if (looksLike && !looksLike.test(value)) return "warning";
  return "connected";
}

export async function GET() {
  const integrations = [
    {
      key: "neon",
      name: "Neon DB",
      detail: check(process.env.DATABASE_URL, /^postgresql:\/\//) === "connected"
        ? "PostgreSQL connected"
        : "DATABASE_URL not set",
      status: check(process.env.DATABASE_URL, /^postgresql:\/\//),
    },
    {
      key: "vercel",
      name: "Vercel",
      detail:
        process.env.VERCEL === "1"
          ? `Deployed (${process.env.VERCEL_ENV || "production"})`
          : "Local dev",
      status: (process.env.VERCEL === "1" ? "connected" : "disconnected") as Status,
    },
    {
      key: "mcp",
      name: "MCP Server",
      detail: check(process.env.MCP_API_KEY, /^fusionclaw_sk_/) === "connected"
        ? "234 tools ready"
        : "MCP_API_KEY not set",
      status: check(process.env.MCP_API_KEY, /^fusionclaw_sk_/),
    },
    {
      key: "openrouter",
      name: "OpenRouter",
      detail: check(process.env.OPENROUTER_API_KEY, /^sk-or-/) === "connected"
        ? "Chat ready"
        : "Not configured",
      status: check(process.env.OPENROUTER_API_KEY, /^sk-or-/),
    },
    {
      key: "fal",
      name: "FAL AI",
      detail: check(process.env.FAL_KEY) === "connected"
        ? "Image gen ready"
        : "Not configured",
      status: check(process.env.FAL_KEY),
    },
    {
      key: "resend",
      name: "Resend",
      detail: check(process.env.RESEND_API_KEY, /^re_/) === "connected"
        ? "Email ready"
        : "Not configured",
      status: check(process.env.RESEND_API_KEY, /^re_/),
    },
    {
      key: "blob",
      name: "Blob Storage",
      detail: check(process.env.BLOB_READ_WRITE_TOKEN, /^vercel_blob_/) === "connected"
        ? "Vercel Blob"
        : "Not configured",
      status: check(process.env.BLOB_READ_WRITE_TOKEN, /^vercel_blob_/),
    },
    {
      key: "wordpress",
      name: "WordPress",
      detail: "Configure in Settings",
      status: "disconnected" as Status,
    },
  ];

  return NextResponse.json({ integrations });
}
