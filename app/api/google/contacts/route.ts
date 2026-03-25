import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthenticatedClient } from "@/lib/google/client";
import { google } from "googleapis";

export async function GET() {
  try {
    const integration = await db.query.googleIntegrations.findFirst();
    if (!integration) {
      return NextResponse.json({ error: "Google not connected" }, { status: 400 });
    }

    const auth = getAuthenticatedClient(integration.accessToken, integration.refreshToken);
    const people = google.people({ version: "v1", auth });

    const response = await people.people.connections.list({
      resourceName: "people/me",
      pageSize: 1000,
      personFields: "names,emailAddresses,phoneNumbers,organizations,urls,addresses",
    });

    const contacts = (response.data.connections || []).map((person) => ({
      contact: person.names?.[0]?.displayName || "",
      company: person.organizations?.[0]?.name || "",
      jobTitle: person.organizations?.[0]?.title || "",
      email: person.emailAddresses?.[0]?.value || "",
      phone: person.phoneNumbers?.[0]?.value || "",
      website: person.urls?.[0]?.value || "",
      address: person.addresses?.[0]?.formattedValue || "",
    }));

    return NextResponse.json({ contacts, total: contacts.length });
  } catch (err) {
    console.error("Google contacts error:", err);
    return NextResponse.json({ error: "Failed to fetch contacts" }, { status: 500 });
  }
}
