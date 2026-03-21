import { NextResponse } from "next/server";
import { getDashboardMetrics, getRecentActivity } from "@/lib/actions/dashboard";

export async function GET() {
  try {
    const [metrics, recentActivity] = await Promise.all([
      getDashboardMetrics(),
      getRecentActivity(5),
    ]);

    return NextResponse.json({ metrics, recentActivity });
  } catch (err) {
    console.error("Dashboard fetch error:", err);
    return NextResponse.json({ error: "Failed to fetch dashboard data", details: String(err) }, { status: 500 });
  }
}
