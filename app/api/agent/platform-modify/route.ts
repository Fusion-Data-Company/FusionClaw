import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { skills, settings, wikiLog } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { writeToWiki } from "@/lib/wiki/memory";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * POST /api/agent/platform-modify
 *
 * Single ingress point for an agent (the user's AI) to modify the platform.
 * Every successful action is mirrored to wiki_log under type=platform_modify
 * so the wiki keeps a permanent audit trail of what the agent did.
 *
 * Supported actions (extensible):
 *  - { action: "create_skill", skill: { name, description, category?, prompt?, ... } }
 *  - { action: "update_skill", id, patch: { ... } }
 *  - { action: "delete_skill", id }
 *  - { action: "update_settings", patch: { tipsEnabled?, onboardingEnabled?, chatModel?, ... } }
 *  - { action: "write_wiki", page: { slug, title, content, folderPath?, confidence? } }
 *
 * Auth gating: this endpoint is protected by the same middleware that gates
 * all (app) routes. Future work can add an explicit MCP-key path for headless
 * agent access — the wiki_log entries will identify the actor.
 */

interface ModifyRequest {
  action: string;
  reason?: string;
  [k: string]: unknown;
}

async function logModify(summary: string, metadata: unknown) {
  await db.insert(wikiLog).values({
    type: "platform_modify",
    summary,
    metadata: metadata as never,
  });
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ModifyRequest;
    const reason = body.reason ?? "(no reason given)";

    switch (body.action) {
      case "create_skill": {
        const s = body.skill as Record<string, unknown> | undefined;
        if (!s || !s.name) return NextResponse.json({ error: "skill.name required" }, { status: 400 });
        const inserted = await db.insert(skills).values({
          name: s.name as string,
          description: (s.description as string) ?? "",
          category: (s.category as string) ?? "general",
          stage: (s.stage as string) ?? "idea",
          prompt: (s.prompt as string) ?? "",
        } as never).returning({ id: skills.id, name: skills.name });
        await logModify(`Agent created skill "${s.name}" — ${reason}`, { action: "create_skill", id: inserted[0].id, reason });
        return NextResponse.json({ ok: true, action: "create_skill", id: inserted[0].id, name: inserted[0].name });
      }

      case "update_skill": {
        const id = body.id as string | undefined;
        const patch = body.patch as Record<string, unknown> | undefined;
        if (!id || !patch) return NextResponse.json({ error: "id + patch required" }, { status: 400 });
        await db.update(skills).set(patch as never).where(eq(skills.id, id));
        await logModify(`Agent updated skill ${id} — ${reason}`, { action: "update_skill", id, patch, reason });
        return NextResponse.json({ ok: true, action: "update_skill", id });
      }

      case "delete_skill": {
        const id = body.id as string | undefined;
        if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
        await db.delete(skills).where(eq(skills.id, id));
        await logModify(`Agent deleted skill ${id} — ${reason}`, { action: "delete_skill", id, reason });
        return NextResponse.json({ ok: true, action: "delete_skill", id });
      }

      case "update_settings": {
        const patch = body.patch as Record<string, unknown> | undefined;
        if (!patch) return NextResponse.json({ error: "patch required" }, { status: 400 });
        const existing = await db.select().from(settings).limit(1);
        const row = existing[0] ?? (await db.insert(settings).values({}).returning())[0];
        await db.update(settings).set({ ...patch, updatedAt: new Date() } as never).where(eq(settings.id, row.id));
        await logModify(`Agent updated platform settings — ${reason}`, { action: "update_settings", patch, reason });
        return NextResponse.json({ ok: true, action: "update_settings" });
      }

      case "write_wiki": {
        const page = body.page as Record<string, unknown> | undefined;
        if (!page || !page.title || !page.content) {
          return NextResponse.json({ error: "page.title + page.content required" }, { status: 400 });
        }
        const result = await writeToWiki({
          slug: page.slug as string | undefined,
          title: page.title as string,
          content: page.content as string,
          folderPath: (page.folderPath as string) ?? "agent-memory",
          confidence: Math.max(0, Math.min(100, Number(page.confidence ?? 70))),
        });
        await logModify(`Agent wrote wiki page "${page.title}" — ${reason}`, {
          action: "write_wiki", pageId: result.id, slug: result.slug, reason,
        });
        return NextResponse.json({ ok: true, action: "write_wiki", id: result.id, slug: result.slug });
      }

      default:
        return NextResponse.json({ error: `unknown action: ${body.action}` }, { status: 400 });
    }
  } catch (err) {
    console.error("[platform-modify] error:", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

/** GET — capability discovery for agents */
export async function GET() {
  return NextResponse.json({
    actions: [
      { name: "create_skill",    body: { action: "create_skill",    skill: { name: "string", description: "string", prompt: "string" } } },
      { name: "update_skill",    body: { action: "update_skill",    id: "uuid", patch: { name: "?", prompt: "?" } } },
      { name: "delete_skill",    body: { action: "delete_skill",    id: "uuid" } },
      { name: "update_settings", body: { action: "update_settings", patch: { tipsEnabled: "?", chatModel: "?" } } },
      { name: "write_wiki",      body: { action: "write_wiki",      page: { slug: "?", title: "string", content: "string", folderPath: "?", confidence: "?" } } },
    ],
    notes: [
      "Every successful action writes a wiki_log entry of type=platform_modify.",
      "Reason field is optional but strongly encouraged for audit clarity.",
      "Auth: gated by app middleware. Future MCP-key path may be added.",
    ],
  });
}
