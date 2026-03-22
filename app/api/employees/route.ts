import { NextResponse } from "next/server";
import { getEmployeesWithStats } from "@/lib/actions/employees";

export async function GET() {
  try {
    const employees = await getEmployeesWithStats();
    return NextResponse.json({ employees });
  } catch (err) {
    console.error("Employees fetch error:", err);
    return NextResponse.json({ error: "Failed to fetch employees", details: String(err) }, { status: 500 });
  }
}
