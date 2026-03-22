import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { campaigns } from "@/lib/db/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  try {
    const allCampaigns = await db
      .select()
      .from(campaigns)
      .orderBy(desc(campaigns.createdAt));

    // Format campaigns for the frontend
    const formattedCampaigns = allCampaigns.map((campaign) => {
      const stats = (campaign.stats as { recipients?: number; openRate?: number; clickRate?: number }) || {};
      return {
        id: campaign.id,
        title: campaign.title,
        type: campaign.type || "email",
        status: campaign.status,
        subject: campaign.subject,
        recipients: stats.recipients || 0,
        openRate: stats.openRate || 0,
        clickRate: stats.clickRate || 0,
        scheduledFor: campaign.scheduledFor?.toISOString() || null,
        sentAt: campaign.sentAt
          ? campaign.sentAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
          : null,
        createdAt: campaign.createdAt.toISOString(),
      };
    });

    return NextResponse.json({ campaigns: formattedCampaigns });
  } catch (err) {
    console.error("Campaigns fetch error:", err);
    return NextResponse.json({ error: "Failed to fetch campaigns", details: String(err) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, type, subject, contentHtml, scheduledFor } = body;

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const [newCampaign] = await db
      .insert(campaigns)
      .values({
        title,
        type: type || "email",
        subject,
        contentHtml,
        scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
        status: "draft",
      })
      .returning();

    return NextResponse.json({ campaign: newCampaign });
  } catch (err) {
    console.error("Campaign create error:", err);
    return NextResponse.json({ error: "Failed to create campaign", details: String(err) }, { status: 500 });
  }
}
