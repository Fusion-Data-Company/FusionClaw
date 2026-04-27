import { NextResponse } from "next/server";
import { TEMPLATES } from "@/lib/marketplace/templates";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    templates: TEMPLATES.map(({ tests, prompt, ...meta }) => ({ ...meta, testCount: tests.length, promptPreview: prompt.slice(0, 200) })),
    total: TEMPLATES.length,
  });
}
