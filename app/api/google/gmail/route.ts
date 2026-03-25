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
    const gmail = google.gmail({ version: "v1", auth });

    const response = await gmail.users.messages.list({
      userId: "me",
      maxResults: 25,
      q: "is:inbox",
    });

    const messageIds = response.data.messages || [];
    const emails = [];

    for (const msg of messageIds.slice(0, 25)) {
      const detail = await gmail.users.messages.get({
        userId: "me",
        id: msg.id!,
        format: "metadata",
        metadataHeaders: ["From", "Subject", "Date"],
      });

      const headers = detail.data.payload?.headers || [];
      const getHeader = (name: string) => headers.find((h) => h.name === name)?.value || "";

      emails.push({
        id: msg.id,
        from: getHeader("From"),
        subject: getHeader("Subject"),
        date: getHeader("Date"),
        snippet: detail.data.snippet || "",
      });
    }

    return NextResponse.json({ emails, total: emails.length });
  } catch (err) {
    console.error("Google gmail error:", err);
    return NextResponse.json({ error: "Failed to fetch emails" }, { status: 500 });
  }
}
