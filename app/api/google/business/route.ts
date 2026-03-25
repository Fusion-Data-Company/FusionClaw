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

    // Google Business Profile API (mybusinessbusinessinformation)
    const mybusiness = google.mybusinessbusinessinformation({ version: "v1", auth });

    // List accounts first
    const accountsApi = google.mybusinessaccountmanagement({ version: "v1", auth });
    const accountsRes = await accountsApi.accounts.list();
    const accounts = accountsRes.data.accounts || [];

    if (accounts.length === 0) {
      return NextResponse.json({ profiles: [], total: 0, message: "No Google Business Profile accounts found" });
    }

    const profiles = [];

    for (const account of accounts) {
      if (!account.name) continue;
      try {
        const locationsRes = await mybusiness.accounts.locations.list({
          parent: account.name,
          readMask: "name,title,storefrontAddress,websiteUri,phoneNumbers,regularHours",
        });

        for (const loc of locationsRes.data.locations || []) {
          profiles.push({
            accountName: account.accountName || account.name,
            locationName: loc.title || "",
            address: loc.storefrontAddress
              ? [loc.storefrontAddress.addressLines?.join(", "), loc.storefrontAddress.locality, loc.storefrontAddress.administrativeArea].filter(Boolean).join(", ")
              : "",
            phone: loc.phoneNumbers?.primaryPhone || "",
            website: loc.websiteUri || "",
          });
        }
      } catch {
        // Skip accounts without Business Profile access
      }
    }

    return NextResponse.json({ profiles, total: profiles.length });
  } catch (err) {
    console.error("Google business error:", err);
    return NextResponse.json({ error: "Failed to fetch business profiles" }, { status: 500 });
  }
}
