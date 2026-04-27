import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { wikiPages, wikiLinks } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

/**
 * GET /api/wiki/graph
 *
 * Returns the data needed to render the force-directed graph view.
 *
 *   nodes: [{ id, title, slug, size, group }]
 *     - size scales with the node's total degree (incoming + outgoing edges)
 *     - group is the folder path, used for color-coding clusters
 *
 *   edges: [{ source, target }]  (using ids — react-force-graph reads these)
 */
export async function GET() {
  try {
    const [pages, links] = await Promise.all([
      db.select().from(wikiPages),
      db.select().from(wikiLinks),
    ]);

    const degree = new Map<string, number>();
    for (const l of links) {
      degree.set(l.fromPageId, (degree.get(l.fromPageId) ?? 0) + 1);
      degree.set(l.toPageId, (degree.get(l.toPageId) ?? 0) + 1);
    }

    const nodes = pages.map((p) => {
      const d = degree.get(p.id) ?? 0;
      // size: 4 (orphan) → ~14 (heavily-linked hub), log scale
      const size = 4 + Math.min(10, Math.round(Math.log2(1 + d) * 2.5));
      return {
        id: p.id,
        title: p.title,
        slug: p.slug,
        group: p.folderPath || "_root",
        size,
        degree: d,
      };
    });

    const edges = links.map((l) => ({
      source: l.fromPageId,
      target: l.toPageId,
    }));

    return NextResponse.json({
      nodes,
      edges,
      stats: {
        nodeCount: nodes.length,
        edgeCount: edges.length,
        orphanCount: nodes.filter((n) => n.degree === 0).length,
      },
    });
  } catch (err) {
    console.error("Wiki graph fetch error:", err);
    return NextResponse.json({ error: "Failed to load graph" }, { status: 500 });
  }
}
