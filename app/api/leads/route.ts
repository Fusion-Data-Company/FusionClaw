import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { leads } from "@/lib/db/schema";
import { eq, ilike, or, asc, desc, sql } from "drizzle-orm";

// GET /api/leads - Get all leads with filtering
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "all";
  const limit = parseInt(searchParams.get("limit") || "100");
  const offset = parseInt(searchParams.get("offset") || "0");
  const sortBy = searchParams.get("sortBy") || "createdAt";
  const sortOrder = (searchParams.get("sortOrder") || "desc") as "asc" | "desc";

  try {
    let query = db.select().from(leads).$dynamic();

    // Search filter
    if (search) {
      query = query.where(
        or(
          ilike(leads.company, `%${search}%`),
          ilike(leads.contact, `%${search}%`),
          ilike(leads.email, `%${search}%`),
          ilike(leads.phone, `%${search}%`)
        )
      );
    }

    // Status filter
    if (status && status !== "all") {
      query = query.where(eq(leads.status, status as typeof leads.status.enumValues[number]));
    }

    // Sorting
    const column = leads[sortBy as keyof typeof leads] || leads.createdAt;
    if (sortOrder === "asc") {
      query = query.orderBy(asc(column as any));
    } else {
      query = query.orderBy(desc(column as any));
    }

    // Pagination
    query = query.limit(limit).offset(offset);

    const result = await query;

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(leads);
    const total = Number(countResult[0]?.count || 0);

    return NextResponse.json({ leads: result, total });
  } catch (error) {
    console.error("Error fetching leads:", error);
    return NextResponse.json({ error: "Failed to fetch leads" }, { status: 500 });
  }
}

// POST /api/leads - Create a new lead
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const result = await db.insert(leads).values({
      company: body.company,
      type: body.type,
      website: body.website,
      contact: body.contact,
      jobTitle: body.jobTitle,
      phone: body.phone,
      altPhone: body.altPhone,
      email: body.email,
      email2: body.email2,
      linkedin: body.linkedin,
      instagram: body.instagram,
      facebook: body.facebook,
      twitterX: body.twitterX,
      youtube: body.youtube,
      tiktok: body.tiktok,
      address: body.address,
      description: body.description,
      status: body.status || "new",
      priority: body.priority,
      source: body.source,
      tags: body.tags || [],
      dealValue: body.dealValue,
      notes: body.notes,
    }).returning();

    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error("Error creating lead:", error);
    return NextResponse.json({ error: "Failed to create lead" }, { status: 500 });
  }
}
