import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { shifts, checklistItems } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";

// GET today's shift or recent shifts
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const today = searchParams.get("today") === "true";

    if (today && userId) {
      const todayDate = new Date().toISOString().split("T")[0];
      const shift = await db
        .select()
        .from(shifts)
        .where(and(eq(shifts.userId, userId), eq(shifts.shiftDate, todayDate)))
        .limit(1);

      if (shift[0]) {
        const items = await db
          .select()
          .from(checklistItems)
          .where(eq(checklistItems.shiftId, shift[0].id));

        return NextResponse.json({ shift: shift[0], checklistItems: items });
      }

      return NextResponse.json({ shift: null, checklistItems: [] });
    }

    // Get recent shifts
    let query = db.select().from(shifts).$dynamic();
    if (userId) {
      query = query.where(eq(shifts.userId, userId));
    }
    const result = await query.orderBy(desc(shifts.createdAt)).limit(30);

    return NextResponse.json({ shifts: result });
  } catch (err) {
    console.error("Shifts fetch error:", err);
    return NextResponse.json({ error: "Failed to fetch shifts", details: String(err) }, { status: 500 });
  }
}

// POST create a new shift
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, checklistTemplate } = body;

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    const todayDate = new Date().toISOString().split("T")[0];

    // Check if shift already exists
    const existing = await db
      .select()
      .from(shifts)
      .where(and(eq(shifts.userId, userId), eq(shifts.shiftDate, todayDate)))
      .limit(1);

    if (existing[0]) {
      return NextResponse.json({ error: "Shift already exists for today" }, { status: 409 });
    }

    // Create new shift
    const [newShift] = await db
      .insert(shifts)
      .values({
        userId,
        shiftDate: todayDate,
        startedAt: new Date(),
        status: "OPEN",
      })
      .returning();

    // Create checklist items if template provided
    if (checklistTemplate && Array.isArray(checklistTemplate)) {
      await db.insert(checklistItems).values(
        checklistTemplate.map((item: any) => ({
          shiftId: newShift.id,
          key: item.key,
          label: item.label,
          category: item.category,
          checkpoint: item.checkpoint,
          platform: item.platform,
          completed: false,
        }))
      );
    }

    const items = await db
      .select()
      .from(checklistItems)
      .where(eq(checklistItems.shiftId, newShift.id));

    return NextResponse.json({ shift: newShift, checklistItems: items });
  } catch (err) {
    console.error("Shift create error:", err);
    return NextResponse.json({ error: "Failed to create shift", details: String(err) }, { status: 500 });
  }
}
