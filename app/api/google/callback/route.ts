import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getOAuth2Client } from "@/lib/google/client";
import { db } from "@/lib/db";
import { googleIntegrations } from "@/lib/db/schema";
import { google } from "googleapis";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const error = request.nextUrl.searchParams.get("error");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (error) {
    return NextResponse.redirect(`${appUrl}/settings?google=error&reason=${error}`);
  }

  if (!code) {
    return NextResponse.redirect(`${appUrl}/settings?google=error&reason=no_code`);
  }

  try {
    const client = getOAuth2Client();
    const { tokens } = await client.getToken(code);
    client.setCredentials(tokens);

    // Get the user's email from Google
    const oauth2 = google.oauth2({ version: "v2", auth: client });
    const { data: userInfo } = await oauth2.userinfo.get();

    // Get the current admin user (first admin in DB)
    const adminUser = await db.query.users.findFirst({
      where: (u, { eq }) => eq(u.role, "admin"),
    });

    if (!adminUser) {
      return NextResponse.redirect(`${appUrl}/settings?google=error&reason=no_admin`);
    }

    // Upsert the Google integration
    const existing = await db.query.googleIntegrations.findFirst({
      where: (g, { eq }) => eq(g.userId, adminUser.id),
    });

    if (existing) {
      const { eq } = await import("drizzle-orm");
      await db.update(googleIntegrations)
        .set({
          accessToken: tokens.access_token!,
          refreshToken: tokens.refresh_token || existing.refreshToken,
          scopes: tokens.scope?.split(" ") || [],
          googleEmail: userInfo.email || null,
          expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
          updatedAt: new Date(),
        })
        .where(eq(googleIntegrations.id, existing.id));
    } else {
      await db.insert(googleIntegrations).values({
        userId: adminUser.id,
        accessToken: tokens.access_token!,
        refreshToken: tokens.refresh_token || null,
        scopes: tokens.scope?.split(" ") || [],
        googleEmail: userInfo.email || null,
        expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
      });
    }

    return NextResponse.redirect(`${appUrl}/settings?google=connected`);
  } catch (err) {
    console.error("Google callback error:", err);
    return NextResponse.redirect(`${appUrl}/settings?google=error&reason=token_exchange`);
  }
}
