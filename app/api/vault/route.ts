import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiVault, users } from "@/lib/db/schema";
import { encrypt, maskKey } from "@/lib/crypto";
import { eq } from "drizzle-orm";

// ─── GET — List all vault entries (masked keys) ─────────────────────────────

export async function GET() {
  try {
    const entries = await db.select().from(apiVault);

    const providers = entries.map((entry) => ({
      id: entry.id,
      provider: entry.provider,
      label: entry.label,
      maskedKey: maskKey(entry.encryptedKey),
      status: entry.status,
      lastUsedAt: entry.lastUsedAt,
      scopes: entry.scopes,
      baseUrl: entry.baseUrl,
      createdAt: entry.createdAt,
    }));

    return NextResponse.json({ providers });
  } catch (error) {
    console.error("[vault/GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch vault entries" },
      { status: 500 },
    );
  }
}

// ─── POST — Add a new API key ───────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { provider, label, key, secret, baseUrl, scopes } = body;

    if (!provider || !label || !key) {
      return NextResponse.json(
        { error: "provider, label, and key are required" },
        { status: 400 },
      );
    }

    let encryptedKey: string;
    let encryptedSecret: string | null = null;

    try {
      encryptedKey = encrypt(key);
      if (secret) {
        encryptedSecret = encrypt(secret);
      }
    } catch (err) {
      console.error("[vault/POST] Encryption error:", err);
      return NextResponse.json(
        {
          error:
            "ENCRYPTION_KEY is not set or invalid. " +
            'Set a 64-char hex string in your environment. Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"',
        },
        { status: 500 },
      );
    }

    // Get the first admin user as the owner
    const [adminUser] = await db
      .select()
      .from(users)
      .where(eq(users.role, "admin"))
      .limit(1);

    if (!adminUser) {
      return NextResponse.json(
        { error: "No admin user found in database" },
        { status: 500 },
      );
    }

    const [created] = await db
      .insert(apiVault)
      .values({
        userId: adminUser.id,
        provider,
        label,
        encryptedKey,
        encryptedSecret,
        baseUrl: baseUrl || null,
        scopes: scopes || [],
        status: "active",
      })
      .returning();

    return NextResponse.json(
      {
        id: created.id,
        provider: created.provider,
        label: created.label,
        maskedKey: maskKey(key),
        status: created.status,
        lastUsedAt: created.lastUsedAt,
        scopes: created.scopes,
        baseUrl: created.baseUrl,
        createdAt: created.createdAt,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[vault/POST]", error);
    return NextResponse.json(
      { error: "Failed to create vault entry" },
      { status: 500 },
    );
  }
}
