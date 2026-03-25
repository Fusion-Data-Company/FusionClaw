import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { leads, googleIntegrations } from "@/lib/db/schema";
import { getAuthenticatedClient } from "@/lib/google/client";
import { google } from "googleapis";
import { eq } from "drizzle-orm";

export async function POST() {
  try {
    const integration = await db.query.googleIntegrations.findFirst();
    if (!integration) {
      return NextResponse.json({ error: "Google not connected" }, { status: 400 });
    }

    const auth = getAuthenticatedClient(integration.accessToken, integration.refreshToken);
    const people = google.people({ version: "v1", auth });

    const response = await people.people.connections.list({
      resourceName: "people/me",
      pageSize: 2000,
      personFields: "names,emailAddresses,phoneNumbers,organizations,urls,addresses",
    });

    const connections = response.data.connections || [];
    let imported = 0;
    let skipped = 0;
    const errors: Array<{ contact: string; reason: string }> = [];

    for (const person of connections) {
      const email = person.emailAddresses?.[0]?.value;
      const name = person.names?.[0]?.displayName || "";
      const company = person.organizations?.[0]?.name || "";

      // Skip contacts with no identifying info
      if (!company && !name && !email) {
        skipped++;
        continue;
      }

      // Check for duplicate by email
      if (email) {
        const existing = await db.query.leads.findFirst({
          where: (l, { eq }) => eq(l.email, email),
        });
        if (existing) {
          skipped++;
          continue;
        }
      }

      try {
        await db.insert(leads).values({
          company: company || name || "Unknown",
          contact: name || null,
          email: email || null,
          phone: person.phoneNumbers?.[0]?.value || null,
          jobTitle: person.organizations?.[0]?.title || null,
          website: person.urls?.[0]?.value || null,
          address: person.addresses?.[0]?.formattedValue || null,
          source: "google",
          contactType: "lead",
          status: "new",
        });
        imported++;
      } catch (err) {
        errors.push({ contact: name || email || "unknown", reason: String(err) });
      }
    }

    return NextResponse.json({
      imported,
      skipped,
      errors: errors.slice(0, 20), // limit error details
      total: connections.length,
    });
  } catch (err) {
    console.error("Google sync error:", err);
    return NextResponse.json({ error: "Failed to sync contacts" }, { status: 500 });
  }
}
