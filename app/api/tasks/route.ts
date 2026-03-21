import { NextResponse } from "next/server";
import { getTasks, createTask, getTaskStats } from "@/lib/actions/tasks";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const completed = searchParams.get("completed");
    const priority = searchParams.get("priority");

    const [tasks, stats] = await Promise.all([
      getTasks({
        completed: completed === "true" ? true : completed === "false" ? false : undefined,
        priority: priority || undefined,
        limit: 100,
      }),
      getTaskStats(),
    ]);

    return NextResponse.json({ tasks, stats });
  } catch (err) {
    console.error("Tasks fetch error:", err);
    return NextResponse.json({ error: "Failed to fetch tasks", details: String(err) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, description, dueDate, priority } = body;

    if (!title || !dueDate) {
      return NextResponse.json({ error: "Title and due date are required" }, { status: 400 });
    }

    const task = await createTask({
      title,
      description,
      dueDate,
      priority: priority || "MEDIUM",
    });

    return NextResponse.json({ task });
  } catch (err) {
    console.error("Task create error:", err);
    return NextResponse.json({ error: "Failed to create task", details: String(err) }, { status: 500 });
  }
}
