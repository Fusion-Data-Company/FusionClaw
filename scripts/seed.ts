import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { config } from "dotenv";
import * as schema from "../lib/db/schema";

config({ path: ".env.local" });

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

async function seed() {
  console.log("Seeding database...\n");

  // 1. Create admin user
  const [admin] = await db
    .insert(schema.users)
    .values({
      authId: "admin_gateway",
      email: process.env.ADMIN_EMAIL || "admin@fusionclaw.local",
      name: process.env.ADMIN_NAME || "Admin",
      role: "admin",
    })
    .onConflictDoNothing({ target: schema.users.authId })
    .returning();

  const adminId = admin?.id;
  if (adminId) {
    console.log(`Created admin user: ${admin.name} (${admin.email})`);
  } else {
    console.log("Admin user already exists, skipping...");
    const existing = await db.query.users.findFirst({
      where: (u, { eq }) => eq(u.authId, "admin_gateway"),
    });
    if (!existing) {
      console.error("Could not find admin user!");
      process.exit(1);
    }
  }

  // 2. Create some sample tasks
  const userId =
    adminId ||
    (
      await db.query.users.findFirst({
        where: (u, { eq }) => eq(u.authId, "admin_gateway"),
      })
    )?.id;

  if (userId) {
    const today = new Date().toISOString().split("T")[0];
    const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];
    const nextMonth = new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0];

    await db
      .insert(schema.tasks)
      .values([
        {
          title: "Set up production environment",
          description: "Configure Vercel env vars and verify deployment",
          dueDate: today,
          priority: "HIGH",
          assignedBy: userId,
        },
        {
          title: "Import lead database",
          description: "Migrate existing leads from CSV to FusionClaw",
          dueDate: nextWeek,
          priority: "MEDIUM",
          assignedBy: userId,
        },
        {
          title: "Configure AI chat system prompts",
          description: "Customize OpenRouter chat prompts for business context",
          dueDate: nextMonth,
          priority: "LOW",
          assignedBy: userId,
        },
      ])
      .onConflictDoNothing();

    console.log("Created 3 sample tasks");
  }

  // 3. Create settings row
  await db
    .insert(schema.settings)
    .values({
      defaultImageModel: "fal-ai/fast-sdxl",
      chatModel: "anthropic/claude-sonnet-4",
      chatMaxTokens: 4096,
      chatTemperature: "0.7",
    })
    .onConflictDoNothing();

  console.log("Created default settings");

  // 4. Create a knowledge base article
  await db
    .insert(schema.knowledgeBase)
    .values({
      title: "Getting Started with FusionClaw",
      content:
        "Welcome to FusionClaw! This is your unified business platform. Use the sidebar to navigate between modules: Dashboard for overview, Contacts for CRM, Tasks for project management, and Studio for AI content generation.",
    })
    .onConflictDoNothing();

  console.log("Created knowledge base article");

  console.log("\nSeed complete!");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
