import { NextResponse } from "next/server";
import { readdirSync, readFileSync, statSync } from "fs";
import { join } from "path";

export const dynamic = "force-dynamic";

interface RouteDoc {
  path: string;
  methods: string[];
  description: string | null;
  source: string;
}

function walk(dir: string, results: string[]): void {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      walk(full, results);
    } else if (entry === "route.ts" || entry === "route.js") {
      results.push(full);
    }
  }
}

function pathFromFile(file: string, base: string): string {
  const rel = file.slice(base.length).replace(/\/route\.[jt]s$/, "");
  return rel
    .replace(/\[\.\.\.([^\]]+)\]/g, "*$1")
    .replace(/\[([^\]]+)\]/g, ":$1") || "/";
}

function extractMethods(source: string): string[] {
  const pattern = /export\s+async\s+function\s+(GET|POST|PUT|PATCH|DELETE|OPTIONS|HEAD)\s*\(/g;
  const out = new Set<string>();
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(source)) !== null) out.add(match[1]);
  return Array.from(out);
}

function extractDescription(source: string): string | null {
  const m = source.match(/\/\*\*\s*\n([\s\S]*?)\*\//);
  if (!m) return null;
  return m[1]
    .split("\n")
    .map((l) => l.replace(/^\s*\*\s?/, "").trim())
    .filter((l) => l && !l.startsWith("@"))
    .join(" ")
    .trim()
    .slice(0, 500) || null;
}

export async function GET() {
  try {
    const apiDir = join(process.cwd(), "app", "api");
    const files: string[] = [];
    walk(apiDir, files);

    const routes: RouteDoc[] = [];
    for (const file of files) {
      const source = readFileSync(file, "utf8");
      const methods = extractMethods(source);
      if (methods.length === 0) continue;
      routes.push({
        path: "/api" + pathFromFile(file, apiDir),
        methods,
        description: extractDescription(source),
        source: file.slice(process.cwd().length),
      });
    }

    routes.sort((a, b) => a.path.localeCompare(b.path));

    return NextResponse.json({
      version: process.env.npm_package_version ?? "0.1.0",
      total: routes.length,
      routes,
    });
  } catch (err) {
    console.error("[api/docs]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
