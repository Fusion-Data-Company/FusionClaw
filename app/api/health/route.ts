import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { SignJWT, jwtVerify } from "jose";
import { readFileSync } from "fs";
import { join } from "path";

export const dynamic = "force-dynamic";

function readCommit(): { sha: string; short: string } {
  // Production: env var (Vercel sets this automatically)
  const envSha = process.env.VERCEL_GIT_COMMIT_SHA || process.env.GIT_COMMIT_SHA;
  if (envSha) return { sha: envSha, short: envSha.slice(0, 7) };

  // Local dev: read from .git/HEAD without spawning a subprocess
  try {
    const head = readFileSync(join(process.cwd(), ".git/HEAD"), "utf8").trim();
    if (head.startsWith("ref: ")) {
      const refPath = head.slice(5);
      const sha = readFileSync(join(process.cwd(), ".git", refPath), "utf8").trim();
      return { sha, short: sha.slice(0, 7) };
    }
    return { sha: head, short: head.slice(0, 7) };
  } catch {
    return { sha: "dev", short: "dev" };
  }
}

function readBranch(): string {
  if (process.env.VERCEL_GIT_COMMIT_REF) return process.env.VERCEL_GIT_COMMIT_REF;
  try {
    const head = readFileSync(join(process.cwd(), ".git/HEAD"), "utf8").trim();
    if (head.startsWith("ref: refs/heads/")) return head.slice(16);
    return "detached";
  } catch {
    return "local";
  }
}

async function checkDb(): Promise<{ ok: boolean; ms: number; error?: string }> {
  const t0 = Date.now();
  try {
    await db.execute(sql`SELECT 1`);
    return { ok: true, ms: Date.now() - t0 };
  } catch (err) {
    return { ok: false, ms: Date.now() - t0, error: String(err) };
  }
}

async function checkJwt(): Promise<{ ok: boolean; ms: number; error?: string }> {
  const t0 = Date.now();
  try {
    const secret =
      process.env.SESSION_SECRET ||
      process.env.MCP_API_KEY ||
      process.env.OWNER_PASSWORD;
    if (!secret) return { ok: false, ms: 0, error: "No JWT secret configured" };
    const key = new TextEncoder().encode(secret);
    const token = await new SignJWT({ test: true })
      .setProtectedHeader({ alg: "HS256" })
      .sign(key);
    await jwtVerify(token, key);
    return { ok: true, ms: Date.now() - t0 };
  } catch (err) {
    return { ok: false, ms: Date.now() - t0, error: String(err) };
  }
}

async function checkOpenRouter(): Promise<{ ok: boolean; ms: number; configured: boolean; error?: string }> {
  if (!process.env.OPENROUTER_API_KEY) return { ok: false, ms: 0, configured: false };
  const t0 = Date.now();
  try {
    const res = await fetch("https://openrouter.ai/api/v1/models", {
      headers: { Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}` },
      signal: AbortSignal.timeout(4000),
    });
    return { ok: res.ok, ms: Date.now() - t0, configured: true, error: res.ok ? undefined : `HTTP ${res.status}` };
  } catch (err) {
    return { ok: false, ms: Date.now() - t0, configured: true, error: String(err) };
  }
}

export async function GET() {
  const [dbCheck, jwtCheck, orCheck] = await Promise.all([
    checkDb(),
    checkJwt(),
    checkOpenRouter(),
  ]);
  const commit = readCommit();
  const branch = readBranch();
  const allOk = dbCheck.ok && jwtCheck.ok;

  return NextResponse.json({
    ok: allOk,
    version: process.env.npm_package_version || "0.1.0",
    commit: commit.short,
    fullCommit: commit.sha,
    branch,
    env: process.env.VERCEL_ENV || process.env.NODE_ENV || "development",
    deployedAt: process.env.VERCEL_DEPLOYED_AT || null,
    uptime: process.uptime(),
    checks: {
      database: dbCheck,
      jwt: jwtCheck,
      openrouter: orCheck,
    },
  });
}
