import { NextResponse } from "next/server";
import { getEmployeesWithStats } from "@/lib/actions/employees";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { nanoid } from "nanoid";

export async function GET() {
  try {
    const employees = await getEmployeesWithStats();
    return NextResponse.json({ employees });
  } catch (err) {
    console.error("Employees fetch error:", err);
    return NextResponse.json({ error: "Failed to fetch employees" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, role } = body;

    if (!name?.trim() || !email?.trim()) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
    }

    // Generate a placeholder authId for manually-added staff
    const placeholderAuthId = `manual_${nanoid(16)}`;

    const [newUser] = await db
      .insert(users)
      .values({
        authId: placeholderAuthId,
        name: name.trim(),
        email: email.trim(),
        role: role === "admin" ? "admin" : "employee",
      })
      .returning();

    return NextResponse.json({
      employee: {
        ...newUser,
        stats: {
          shiftsLast30Days: 0,
          avgCompletion: 0,
          tasksCompleted: 0,
          streak: 0,
        },
      },
    });
  } catch (err) {
    console.error("Employee create error:", err);
    return NextResponse.json({ error: "Failed to create employee" }, { status: 500 });
  }
}
