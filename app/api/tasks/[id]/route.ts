import { NextResponse } from "next/server";
import { getTask, updateTask, deleteTask, toggleTaskComplete } from "@/lib/actions/tasks";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const task = await getTask(id);

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json({ task });
  } catch (err) {
    console.error("Task fetch error:", err);
    return NextResponse.json({ error: "Failed to fetch task", details: String(err) }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    // Handle toggle completion specifically
    if (body.action === "toggle") {
      const task = await toggleTaskComplete(id, body.userId);
      return NextResponse.json({ task });
    }

    const task = await updateTask(id, body);
    return NextResponse.json({ task });
  } catch (err) {
    console.error("Task update error:", err);
    return NextResponse.json({ error: "Failed to update task", details: String(err) }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await deleteTask(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Task delete error:", err);
    return NextResponse.json({ error: "Failed to delete task", details: String(err) }, { status: 500 });
  }
}
