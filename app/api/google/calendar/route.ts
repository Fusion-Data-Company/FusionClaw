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
    const calendar = google.calendar({ version: "v3", auth });

    const now = new Date();
    const twoWeeksFromNow = new Date(now.getTime() + 14 * 86400000);

    const response = await calendar.events.list({
      calendarId: "primary",
      timeMin: now.toISOString(),
      timeMax: twoWeeksFromNow.toISOString(),
      maxResults: 50,
      singleEvents: true,
      orderBy: "startTime",
    });

    const events = (response.data.items || []).map((event) => ({
      id: event.id,
      title: event.summary || "Untitled",
      start: event.start?.dateTime || event.start?.date,
      end: event.end?.dateTime || event.end?.date,
      location: event.location || null,
      attendees: (event.attendees || []).map((a) => ({ email: a.email, name: a.displayName })),
      link: event.htmlLink,
    }));

    return NextResponse.json({ events, total: events.length });
  } catch (err) {
    console.error("Google calendar error:", err);
    return NextResponse.json({ error: "Failed to fetch calendar events" }, { status: 500 });
  }
}
