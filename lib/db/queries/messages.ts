import { db } from "../index";
import { messages } from "../schema";
import { eq, asc } from "drizzle-orm";

export async function getMessagesByProject(projectId: string) {
  return db
    .select()
    .from(messages)
    .where(eq(messages.projectId, projectId))
    .orderBy(asc(messages.createdAt));
}

export async function createMessage(data: {
  projectId: string;
  role: string;
  content: string;
}) {
  const [message] = await db
    .insert(messages)
    .values({
      projectId: data.projectId,
      role: data.role,
      content: data.content,
    })
    .returning();
  return message;
}
