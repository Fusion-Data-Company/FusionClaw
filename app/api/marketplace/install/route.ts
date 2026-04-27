import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { skills, skillEvals } from "@/lib/db/schema";
import { findTemplate } from "@/lib/marketplace/templates";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const id: string | undefined = body.templateId;
    if (!id) return NextResponse.json({ error: "templateId required" }, { status: 400 });

    const template = findTemplate(id);
    if (!template) return NextResponse.json({ error: "template not found" }, { status: 404 });

    // Insert as a new skill in Idea stage so the operator reviews before promoting
    const [created] = await db.insert(skills).values({
      name: template.name,
      description: template.description,
      category: template.category,
      stage: "idea",
      prompt: template.prompt,
      evalCriteria: template.evalCriteria,
      agentProvider: "openrouter",
      agentModel: template.agentModel,
      tags: [...template.tags, `template:${id}`, `v${template.version}`],
    }).returning();

    // Auto-install the seed test cases
    if (template.tests.length > 0) {
      await db.insert(skillEvals).values(
        template.tests.map((t) => ({
          skillId: created.id,
          name: t.name,
          inputs: t.inputs,
          assertionType: t.assertionType as "contains" | "not_contains" | "regex" | "json_path_equals" | "json_valid" | "min_length",
          assertionValue: t.assertionValue,
        }))
      );
    }

    return NextResponse.json({ ok: true, skill: created, testsInstalled: template.tests.length });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
