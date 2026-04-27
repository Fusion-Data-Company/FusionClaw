import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { settings, onboardingState } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { writeToWiki } from "@/lib/wiki/memory";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/onboarding
 * Returns combined settings (tipsEnabled, onboardingEnabled, onboardingComplete)
 * + onboardingState (dismissedHints, completedSteps, interviewAnswers).
 */
async function loadOrCreateOnboarding() {
  const existing = await db.select().from(onboardingState).orderBy(desc(onboardingState.updatedAt)).limit(1);
  if (existing.length > 0) return existing[0];
  const inserted = await db.insert(onboardingState).values({
    step: "welcome",
    completedSteps: [],
    dismissedHints: [],
  }).returning();
  return inserted[0];
}
async function loadOrCreateSettings() {
  const existing = await db.select().from(settings).limit(1);
  if (existing.length > 0) return existing[0];
  const inserted = await db.insert(settings).values({}).returning();
  return inserted[0];
}

export async function GET() {
  try {
    const [s, o] = await Promise.all([loadOrCreateSettings(), loadOrCreateOnboarding()]);
    return NextResponse.json({
      tipsEnabled: s.tipsEnabled,
      onboardingEnabled: s.onboardingEnabled,
      onboardingComplete: s.onboardingComplete,
      bindingInterviewComplete: s.bindingInterviewComplete,
      step: o.step,
      completedSteps: o.completedSteps ?? [],
      dismissedHints: o.dismissedHints ?? [],
      interviewAnswers: o.interviewAnswers ?? null,
      companyProfile: o.companyProfile ?? null,
    });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

/**
 * PATCH /api/onboarding
 * Body shape (all optional):
 *  {
 *    dismissHint?: string,
 *    completeStep?: string,
 *    onboardingComplete?: boolean,
 *    bindingInterviewComplete?: boolean,
 *    interviewAnswers?: Record<string, string>,
 *    companyProfile?: Record<string, unknown>,
 *  }
 */
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const s = await loadOrCreateSettings();
    const o = await loadOrCreateOnboarding();

    // Settings flags
    const settingsUpdates: Partial<typeof settings.$inferInsert> = {};
    if (typeof body.onboardingComplete === "boolean") settingsUpdates.onboardingComplete = body.onboardingComplete;
    if (typeof body.bindingInterviewComplete === "boolean") settingsUpdates.bindingInterviewComplete = body.bindingInterviewComplete;
    if (Object.keys(settingsUpdates).length > 0) {
      settingsUpdates.updatedAt = new Date();
      await db.update(settings).set(settingsUpdates).where(eq(settings.id, s.id));
    }

    // Onboarding state updates
    const onboardingUpdates: Partial<typeof onboardingState.$inferInsert> = {};
    if (body.dismissHint) {
      const list = Array.isArray(o.dismissedHints) ? [...(o.dismissedHints as string[])] : [];
      if (!list.includes(body.dismissHint)) list.push(body.dismissHint);
      onboardingUpdates.dismissedHints = list as never;
    }
    if (body.completeStep) {
      const list = Array.isArray(o.completedSteps) ? [...(o.completedSteps as string[])] : [];
      if (!list.includes(body.completeStep)) list.push(body.completeStep);
      onboardingUpdates.completedSteps = list as never;
      onboardingUpdates.step = body.completeStep;
    }
    if (body.interviewAnswers) onboardingUpdates.interviewAnswers = body.interviewAnswers;
    if (body.companyProfile) onboardingUpdates.companyProfile = body.companyProfile;
    if (Object.keys(onboardingUpdates).length > 0) {
      onboardingUpdates.updatedAt = new Date();
      await db.update(onboardingState).set(onboardingUpdates).where(eq(onboardingState.id, o.id));
    }

    // If interview completed, append answers to wiki under /agent-memory/binding-interview
    if (body.bindingInterviewComplete && body.interviewAnswers) {
      const answers = body.interviewAnswers as Record<string, string>;
      const lines = Object.entries(answers).map(([q, a]) => `### ${q}\n\n${a}\n`).join("\n");
      const content = `# Binding Interview\n\n_The user's binding interview, captured during onboarding. The agent uses this to personalize every interaction._\n\n${lines}`;
      await writeToWiki({
        slug: "binding-interview",
        title: "Binding Interview",
        content,
        folderPath: "agent-memory",
        confidence: 95,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
