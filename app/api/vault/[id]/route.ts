import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiVault } from "@/lib/db/schema";
import { encrypt, decrypt, maskKey } from "@/lib/crypto";
import { eq } from "drizzle-orm";

type RouteContext = { params: Promise<{ id: string }> };

// ─── PATCH — Update a vault entry ───────────────────────────────────────────

export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await req.json();
    const { label, key, secret, baseUrl, scopes, status } = body;

    // Build the update payload dynamically
    const updates: Record<string, unknown> = { updatedAt: new Date() };

    if (label !== undefined) updates.label = label;
    if (baseUrl !== undefined) updates.baseUrl = baseUrl;
    if (scopes !== undefined) updates.scopes = scopes;
    if (status !== undefined) updates.status = status;

    if (key !== undefined) {
      updates.encryptedKey = encrypt(key);
    }
    if (secret !== undefined) {
      updates.encryptedSecret = encrypt(secret);
    }

    const [updated] = await db
      .update(apiVault)
      .set(updates)
      .where(eq(apiVault.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { error: "Vault entry not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      id: updated.id,
      provider: updated.provider,
      label: updated.label,
      maskedKey: maskKey(updated.encryptedKey),
      status: updated.status,
      lastUsedAt: updated.lastUsedAt,
      scopes: updated.scopes,
      baseUrl: updated.baseUrl,
      createdAt: updated.createdAt,
    });
  } catch (error) {
    console.error("[vault/PATCH]", error);
    return NextResponse.json(
      { error: "Failed to update vault entry" },
      { status: 500 },
    );
  }
}

// ─── DELETE — Revoke a vault entry ──────────────────────────────────────────

export async function DELETE(_req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    const [revoked] = await db
      .update(apiVault)
      .set({ status: "revoked", updatedAt: new Date() })
      .where(eq(apiVault.id, id))
      .returning();

    if (!revoked) {
      return NextResponse.json(
        { error: "Vault entry not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, id: revoked.id });
  } catch (error) {
    console.error("[vault/DELETE]", error);
    return NextResponse.json(
      { error: "Failed to revoke vault entry" },
      { status: 500 },
    );
  }
}

// ─── POST — Test a provider connection ──────────────────────────────────────

export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await req.json();

    if (body.action !== "test") {
      return NextResponse.json(
        { error: 'Invalid action. Use { "action": "test" }' },
        { status: 400 },
      );
    }

    const [entry] = await db
      .select()
      .from(apiVault)
      .where(eq(apiVault.id, id))
      .limit(1);

    if (!entry) {
      return NextResponse.json(
        { error: "Vault entry not found" },
        { status: 404 },
      );
    }

    let decryptedKey: string;
    try {
      decryptedKey = decrypt(entry.encryptedKey);
    } catch {
      return NextResponse.json(
        { success: false, message: "Failed to decrypt key — ENCRYPTION_KEY may have changed" },
        { status: 500 },
      );
    }

    const result = await testProviderConnection(entry.provider, decryptedKey);

    // Update lastUsedAt on success, lastError on failure
    if (result.success) {
      await db
        .update(apiVault)
        .set({ lastUsedAt: new Date(), lastError: null, updatedAt: new Date() })
        .where(eq(apiVault.id, id));
    } else {
      await db
        .update(apiVault)
        .set({ lastError: result.message, updatedAt: new Date() })
        .where(eq(apiVault.id, id));
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("[vault/test]", error);
    return NextResponse.json(
      { success: false, message: "Connection test failed unexpectedly" },
      { status: 500 },
    );
  }
}

// ─── Provider test helpers ──────────────────────────────────────────────────

async function testProviderConnection(
  provider: string,
  key: string,
): Promise<{ success: boolean; message: string }> {
  try {
    switch (provider.toLowerCase()) {
      case "apollo": {
        const res = await fetch("https://api.apollo.io/api/v1/auth/health", {
          headers: { "x-api-key": key },
        });
        return res.ok
          ? { success: true, message: "Apollo connection verified" }
          : { success: false, message: `Apollo returned ${res.status}` };
      }

      case "hunter": {
        const res = await fetch(
          `https://api.hunter.io/v2/account?api_key=${encodeURIComponent(key)}`,
        );
        return res.ok
          ? { success: true, message: "Hunter connection verified" }
          : { success: false, message: `Hunter returned ${res.status}` };
      }

      case "apify": {
        const res = await fetch(
          `https://api.apify.com/v2/users/me?token=${encodeURIComponent(key)}`,
        );
        return res.ok
          ? { success: true, message: "Apify connection verified" }
          : { success: false, message: `Apify returned ${res.status}` };
      }

      case "firecrawl": {
        const res = await fetch("https://api.firecrawl.dev/v1/scrape", {
          headers: { Authorization: `Bearer ${key}` },
        });
        // 400 is expected (no body) but proves auth works; 401/403 means bad key
        return res.status === 401 || res.status === 403
          ? { success: false, message: `Firecrawl auth failed (${res.status})` }
          : { success: true, message: "Firecrawl connection verified" };
      }

      case "proxycurl": {
        const res = await fetch(
          "https://nubela.co/proxycurl/api/credit-balance",
          { headers: { Authorization: `Bearer ${key}` } },
        );
        return res.ok
          ? { success: true, message: "Proxycurl connection verified" }
          : { success: false, message: `Proxycurl returned ${res.status}` };
      }

      case "abstract": {
        const res = await fetch(
          `https://emailvalidation.abstractapi.com/v1/?api_key=${encodeURIComponent(key)}&email=test@test.com`,
        );
        return res.ok
          ? { success: true, message: "Abstract API connection verified" }
          : { success: false, message: `Abstract returned ${res.status}` };
      }

      default:
        return {
          success: true,
          message: `No test available for provider "${provider}" — key stored successfully`,
        };
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown network error";
    return { success: false, message: `Connection failed: ${message}` };
  }
}
