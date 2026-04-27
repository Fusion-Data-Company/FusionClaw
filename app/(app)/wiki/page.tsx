"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import {
  BookOpen,
  ChevronRight,
  ChevronDown,
  FileText,
  FolderOpen,
  Folder,
  Plus,
  Search,
  Network,
  X,
  Sparkles,
  Loader2,
  Link2,
  Trash2,
  Upload,
  ScrollText,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { GlassCard } from "@/components/primitives";

// react-force-graph is canvas-based — must be SSR-disabled.
const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full text-text-muted text-xs">
      <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading graph engine…
    </div>
  ),
});

// ─── Types ──────────────────────────────────────────────────────────────────

interface WikiPage {
  id: string;
  title: string;
  slug: string;
  folderPath: string;
  confidence: number;
  linkCount: number;
  createdAt: string;
  updatedAt: string;
}

interface PageDetail {
  id: string;
  title: string;
  slug: string;
  content: string;
  folderPath: string;
  confidence: number;
}

interface GraphNode {
  id: string;
  title: string;
  slug: string;
  group: string;
  size: number;
  degree: number;
}

interface GraphEdge {
  source: string;
  target: string;
}

interface Stats {
  totalPages: number;
  totalLinks: number;
  avgConfidence: number;
}

// ─── File Tree ──────────────────────────────────────────────────────────────

interface TreeNode {
  name: string;
  path: string;
  children: Map<string, TreeNode>;
  pages: WikiPage[];
}

function buildTree(pages: WikiPage[]): TreeNode {
  const root: TreeNode = { name: "_root", path: "", children: new Map(), pages: [] };
  for (const page of pages) {
    if (!page.folderPath) {
      root.pages.push(page);
      continue;
    }
    const segments = page.folderPath.split("/").filter(Boolean);
    let cursor = root;
    let path = "";
    for (const seg of segments) {
      path = path ? `${path}/${seg}` : seg;
      if (!cursor.children.has(seg)) {
        cursor.children.set(seg, { name: seg, path, children: new Map(), pages: [] });
      }
      cursor = cursor.children.get(seg)!;
    }
    cursor.pages.push(page);
  }
  return root;
}

function FolderRow({
  node,
  depth,
  collapsed,
  onToggle,
  onSelectPage,
  selectedId,
}: {
  node: TreeNode;
  depth: number;
  collapsed: Set<string>;
  onToggle: (path: string) => void;
  onSelectPage: (page: WikiPage) => void;
  selectedId: string | null;
}) {
  const isCollapsed = collapsed.has(node.path);
  const totalPages =
    node.pages.length +
    Array.from(node.children.values()).reduce((sum, c) => sum + countPages(c), 0);

  return (
    <div>
      <button
        onClick={() => onToggle(node.path)}
        className="w-full flex items-center gap-1.5 py-1 px-2 text-xs hover:bg-white/[0.03] rounded transition-colors group"
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
      >
        {isCollapsed ? (
          <ChevronRight className="w-3 h-3 text-text-muted shrink-0" />
        ) : (
          <ChevronDown className="w-3 h-3 text-text-muted shrink-0" />
        )}
        {isCollapsed ? (
          <Folder className="w-3.5 h-3.5 text-amber-400/70 shrink-0" />
        ) : (
          <FolderOpen className="w-3.5 h-3.5 text-amber-400/70 shrink-0" />
        )}
        <span className="font-mono text-text-secondary group-hover:text-text-primary truncate">
          {node.name}
        </span>
        <span className="ml-auto text-[10px] text-text-disabled font-mono">{totalPages}</span>
      </button>
      {!isCollapsed && (
        <div>
          {Array.from(node.children.values())
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((child) => (
              <FolderRow
                key={child.path}
                node={child}
                depth={depth + 1}
                collapsed={collapsed}
                onToggle={onToggle}
                onSelectPage={onSelectPage}
                selectedId={selectedId}
              />
            ))}
          {node.pages
            .sort((a, b) => a.title.localeCompare(b.title))
            .map((page) => (
              <button
                key={page.id}
                onClick={() => onSelectPage(page)}
                className={`w-full flex items-center gap-1.5 py-1 text-xs rounded transition-colors group ${
                  selectedId === page.id
                    ? "bg-cyan-500/10 text-cyan-300"
                    : "hover:bg-white/[0.03] text-text-secondary"
                }`}
                style={{ paddingLeft: `${(depth + 1) * 12 + 14}px`, paddingRight: "8px" }}
              >
                <FileText className="w-3 h-3 text-text-disabled shrink-0" />
                <span className="truncate flex-1 text-left">{page.title}</span>
                {page.linkCount > 0 && (
                  <span className="text-[9px] text-cyan-400/80 font-mono">↗{page.linkCount}</span>
                )}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}

function countPages(node: TreeNode): number {
  return (
    node.pages.length +
    Array.from(node.children.values()).reduce((sum, c) => sum + countPages(c), 0)
  );
}

// ─── Page Detail ────────────────────────────────────────────────────────────

function PageDetailView({
  pageId,
  onClose,
  onDelete,
}: {
  pageId: string;
  onClose: () => void;
  onDelete: (id: string) => void;
}) {
  const [detail, setDetail] = useState<PageDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/wiki/pages/${pageId}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) {
          setDetail(data.page ?? null);
          setLoading(false);
        }
      })
      .catch(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [pageId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-text-muted text-xs">
        <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading page…
      </div>
    );
  }
  if (!detail) {
    return <div className="p-8 text-text-muted text-xs">Page not found.</div>;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-start justify-between p-4 border-b border-white/5">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-[10px] text-text-disabled font-mono uppercase tracking-wider mb-1">
            {detail.folderPath || "_root"}
          </div>
          <h2 className="text-lg font-bold text-text-primary truncate">{detail.title}</h2>
          <div className="flex items-center gap-3 mt-1 text-[10px] text-text-muted">
            <span className="font-mono">/{detail.slug}</span>
            <span>•</span>
            <span>Confidence: <span className="text-emerald-400">{detail.confidence}%</span></span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => onDelete(detail.id)}
            className="p-1.5 rounded-md hover:bg-red-500/10 text-text-disabled hover:text-red-400 transition-colors"
            title="Delete page"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-white/5 text-text-disabled hover:text-text-primary transition-colors"
            title="Close"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {detail.content ? (
          <pre className="text-xs text-text-secondary whitespace-pre-wrap font-sans leading-relaxed">
            {detail.content}
          </pre>
        ) : (
          <div className="text-xs text-text-muted italic">This page is empty.</div>
        )}
      </div>
    </div>
  );
}

// ─── Graph View ─────────────────────────────────────────────────────────────

function GraphView({
  nodes,
  edges,
  onNodeClick,
}: {
  nodes: GraphNode[];
  edges: GraphEdge[];
  onNodeClick: (id: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ width: 0, height: 0 });
  const [linkDistance, setLinkDistance] = useState(80);
  const [chargeStrength, setChargeStrength] = useState(-50);
  const [centerStrength, setCenterStrength] = useState(0.5);
  const fgRef = useRef<any>(null);
  const [hideOrphans, setHideOrphans] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const update = () => setDims({ width: el.clientWidth, height: el.clientHeight });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Re-tune force parameters when sliders change.
  useEffect(() => {
    if (!fgRef.current) return;
    const linkForce = fgRef.current.d3Force("link");
    const chargeForce = fgRef.current.d3Force("charge");
    const centerForce = fgRef.current.d3Force("center");
    if (linkForce) linkForce.distance(linkDistance);
    if (chargeForce) chargeForce.strength(chargeStrength);
    if (centerForce && typeof centerForce.strength === "function") {
      centerForce.strength(centerStrength);
    }
    fgRef.current.d3ReheatSimulation();
  }, [linkDistance, chargeStrength, centerStrength]);

  const visibleNodes = useMemo(
    () => (hideOrphans ? nodes.filter((n) => n.degree > 0) : nodes),
    [nodes, hideOrphans]
  );
  const visibleNodeIds = useMemo(() => new Set(visibleNodes.map((n) => n.id)), [visibleNodes]);
  const visibleEdges = useMemo(
    () =>
      edges.filter(
        (e) => visibleNodeIds.has(e.source as string) && visibleNodeIds.has(e.target as string)
      ),
    [edges, visibleNodeIds]
  );

  const graphData = useMemo(
    () => ({ nodes: visibleNodes.map((n) => ({ ...n })), links: visibleEdges }),
    [visibleNodes, visibleEdges]
  );

  return (
    <div ref={containerRef} className="relative w-full h-full bg-[#050505] rounded-xl overflow-hidden border border-white/5">
      {/* Stats overlay */}
      <div className="absolute top-3 right-3 z-10 text-[10px] text-text-muted font-mono space-y-0.5 text-right">
        <div>{visibleNodes.length} nodes</div>
        <div>{visibleEdges.length} edges</div>
        <div className="text-text-disabled">
          {nodes.filter((n) => n.degree === 0).length} orphans
        </div>
      </div>

      {/* Controls panel */}
      <div className="absolute top-3 left-3 z-10 bg-[#0a0a0a]/80 backdrop-blur-md border border-white/10 rounded-lg p-3 space-y-2 min-w-[200px]">
        <div className="text-[10px] uppercase tracking-wider text-text-muted font-bold mb-1">
          Force Controls
        </div>
        <SliderRow
          label="center"
          value={centerStrength}
          min={0}
          max={1}
          step={0.05}
          onChange={setCenterStrength}
        />
        <SliderRow
          label="repel"
          value={chargeStrength}
          min={-300}
          max={0}
          step={5}
          onChange={setChargeStrength}
        />
        <SliderRow
          label="dist"
          value={linkDistance}
          min={20}
          max={300}
          step={5}
          onChange={setLinkDistance}
          unit="px"
        />
        <button
          onClick={() => setHideOrphans((v) => !v)}
          className={`w-full mt-2 px-2 py-1 rounded text-[10px] font-mono transition-colors ${
            hideOrphans
              ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
              : "bg-white/[0.03] text-text-muted border border-white/10 hover:bg-white/[0.05]"
          }`}
        >
          {hideOrphans ? "show orphans" : "hide orphans"}
        </button>
      </div>

      {dims.width > 0 && dims.height > 0 ? (
        nodes.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center px-8">
            <div>
              <Network className="w-10 h-10 text-text-disabled mx-auto mb-3" />
              <div className="text-sm text-text-secondary mb-1">No pages yet.</div>
              <div className="text-xs text-text-muted">
                Create pages and link them with <code className="text-cyan-400">[[slug]]</code> to see the graph.
              </div>
            </div>
          </div>
        ) : (
          <ForceGraph2D
            ref={fgRef}
            graphData={graphData}
            width={dims.width}
            height={dims.height}
            backgroundColor="#050505"
            nodeRelSize={1}
            nodeVal={(n: any) => n.size}
            nodeLabel={(n: any) => n.title}
            nodeColor={(n: any) => (n.degree === 0 ? "rgba(150,150,150,0.5)" : "#e8e8e8")}
            linkColor={() => "rgba(255,255,255,0.12)"}
            linkWidth={0.5}
            onNodeClick={(n: any) => onNodeClick(n.id)}
            cooldownTicks={120}
            warmupTicks={30}
            nodeCanvasObjectMode={() => "after"}
            nodeCanvasObject={(node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
              const label = node.title;
              const fontSize = Math.max(10, 12 / Math.sqrt(globalScale));
              ctx.font = `${fontSize}px Inter, sans-serif`;
              ctx.textAlign = "left";
              ctx.textBaseline = "middle";
              ctx.fillStyle = "rgba(232,232,232,0.85)";
              ctx.fillText(label, node.x + node.size + 3, node.y);
            }}
          />
        )
      ) : null}
    </div>
  );
}

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  onChange,
  unit,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  unit?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="text-[10px] text-text-muted font-mono w-10 shrink-0">{label}</div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="flex-1 h-1 accent-cyan-400"
      />
      <div className="text-[10px] text-text-muted font-mono w-10 text-right">
        {Math.round(value * 100) / 100}
        {unit}
      </div>
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function WikiPage() {
  const [pages, setPages] = useState<WikiPage[]>([]);
  const [stats, setStats] = useState<Stats>({ totalPages: 0, totalLinks: 0, avgConfidence: 0 });
  const [graph, setGraph] = useState<{ nodes: GraphNode[]; edges: GraphEdge[] }>({
    nodes: [],
    edges: [],
  });
  const [mode, setMode] = useState<"wiki" | "graph">("wiki");
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [pagesRes, graphRes] = await Promise.all([
        fetch("/api/wiki/pages").then((r) => r.json()),
        fetch("/api/wiki/graph").then((r) => r.json()),
      ]);
      setPages(pagesRes.pages ?? []);
      setStats(pagesRes.stats ?? { totalPages: 0, totalLinks: 0, avgConfidence: 0 });
      setGraph({ nodes: graphRes.nodes ?? [], edges: graphRes.edges ?? [] });
    } catch (err) {
      console.error("Wiki fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const filteredPages = useMemo(() => {
    if (!search.trim()) return pages;
    const q = search.toLowerCase();
    return pages.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q) ||
        p.folderPath.toLowerCase().includes(q)
    );
  }, [pages, search]);

  const tree = useMemo(() => buildTree(filteredPages), [filteredPages]);

  const toggleFolder = (path: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this page? This cannot be undone.")) return;
    await fetch(`/api/wiki/pages/${id}`, { method: "DELETE" });
    setSelectedId(null);
    fetchAll();
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1
            className="text-2xl sm:text-3xl font-extrabold text-text-primary"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Wiki Brain
          </h1>
          <p className="text-sm text-text-muted mt-1">
            File tree + graph view of your team&apos;s knowledge. Link pages with{" "}
            <code className="text-cyan-400 text-xs">[[slug]]</code> to see them connect.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNew(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> New Page
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <GlassCard padding="sm" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <div className="text-xs text-text-muted">Total Pages</div>
            <div className="text-xl font-bold text-text-primary">{stats.totalPages}</div>
          </div>
        </GlassCard>
        <GlassCard padding="sm" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <div className="text-xs text-text-muted">Avg Confidence</div>
            <div className="text-xl font-bold text-text-primary">{stats.avgConfidence}%</div>
          </div>
        </GlassCard>
        <GlassCard padding="sm" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-cyan-500/10 flex items-center justify-center">
            <Link2 className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <div className="text-xs text-text-muted">Total Links</div>
            <div className="text-xl font-bold text-text-primary">{stats.totalLinks}</div>
          </div>
        </GlassCard>
      </div>

      {/* RAW drop zone + Query bar */}
      <RawDropZone onIngested={fetchAll} />

      {/* Mode toggle */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setMode("wiki")}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
            mode === "wiki"
              ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
              : "bg-white/[0.03] text-text-muted border border-white/10 hover:bg-white/[0.05]"
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" /> Wiki
        </button>
        <button
          onClick={() => setMode("graph")}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
            mode === "graph"
              ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
              : "bg-white/[0.03] text-text-muted border border-white/10 hover:bg-white/[0.05]"
          }`}
        >
          <Network className="w-3.5 h-3.5" /> Graph View
        </button>
        <Link
          href="/wiki/log"
          className="px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 bg-white/[0.03] text-text-muted border border-white/10 hover:bg-white/[0.05]"
        >
          <ScrollText className="w-3.5 h-3.5" /> Log
        </Link>
        <button
          onClick={async () => {
            const res = await fetch("/api/wiki/lint", { method: "POST" });
            const data = await res.json();
            alert(`Lint complete: ${data.orphans?.length ?? 0} orphans, ${data.broken?.length ?? 0} broken links, ${data.stale?.length ?? 0} stale.`);
          }}
          className="px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 bg-white/[0.03] text-text-muted border border-white/10 hover:bg-white/[0.05]"
        >
          <AlertCircle className="w-3.5 h-3.5" /> Lint
        </button>
      </div>

      {/* Body */}
      {mode === "wiki" ? (
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4 min-h-[60vh]">
          {/* Tree */}
          <GlassCard padding="none" className="flex flex-col overflow-hidden">
            <div className="p-3 border-b border-white/5 flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-text-muted shrink-0" />
              <input
                type="text"
                placeholder="Search pages…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 bg-transparent outline-none text-xs text-text-primary placeholder:text-text-disabled"
              />
            </div>
            <div className="flex-1 overflow-y-auto py-2">
              {loading ? (
                <div className="flex items-center justify-center py-8 text-text-muted text-xs">
                  <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading…
                </div>
              ) : pages.length === 0 ? (
                <div className="text-center px-4 py-8">
                  <FileText className="w-8 h-8 text-text-disabled mx-auto mb-2" />
                  <div className="text-xs text-text-muted">
                    No pages yet. Click <span className="text-cyan-400 font-bold">+ New Page</span> to start.
                  </div>
                </div>
              ) : (
                <>
                  {Array.from(tree.children.values())
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map((child) => (
                      <FolderRow
                        key={child.path}
                        node={child}
                        depth={0}
                        collapsed={collapsed}
                        onToggle={toggleFolder}
                        onSelectPage={(p) => setSelectedId(p.id)}
                        selectedId={selectedId}
                      />
                    ))}
                  {tree.pages.length > 0 && (
                    <div className="mt-2">
                      <div className="px-2 py-1 text-[9px] uppercase tracking-wider text-text-disabled font-bold">
                        Root
                      </div>
                      {tree.pages
                        .sort((a, b) => a.title.localeCompare(b.title))
                        .map((p) => (
                          <button
                            key={p.id}
                            onClick={() => setSelectedId(p.id)}
                            className={`w-full flex items-center gap-1.5 py-1 px-3 text-xs rounded transition-colors ${
                              selectedId === p.id
                                ? "bg-cyan-500/10 text-cyan-300"
                                : "hover:bg-white/[0.03] text-text-secondary"
                            }`}
                          >
                            <FileText className="w-3 h-3 text-text-disabled shrink-0" />
                            <span className="truncate flex-1 text-left">{p.title}</span>
                            {p.linkCount > 0 && (
                              <span className="text-[9px] text-cyan-400/80 font-mono">
                                ↗{p.linkCount}
                              </span>
                            )}
                          </button>
                        ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </GlassCard>

          {/* Page detail */}
          <GlassCard padding="none" className="flex flex-col overflow-hidden">
            {selectedId ? (
              <PageDetailView
                pageId={selectedId}
                onClose={() => setSelectedId(null)}
                onDelete={handleDelete}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-8 min-h-[400px]">
                <BookOpen className="w-10 h-10 text-text-disabled mb-3" />
                <div className="text-sm text-text-secondary mb-1">
                  Select a page from the tree
                </div>
                <div className="text-xs text-text-muted max-w-sm">
                  Pages support <code className="text-cyan-400">[[wikilinks]]</code> — anything in
                  double brackets that matches another page&apos;s slug becomes an edge in the
                  graph view.
                </div>
              </div>
            )}
          </GlassCard>
        </div>
      ) : (
        <div className="min-h-[70vh] h-[calc(100vh-280px)]">
          <GraphView
            nodes={graph.nodes}
            edges={graph.edges}
            onNodeClick={(id) => {
              setSelectedId(id);
              setMode("wiki");
            }}
          />
        </div>
      )}

      {/* New Page modal */}
      {showNew && (
        <NewPageModal
          onClose={() => setShowNew(false)}
          onCreated={() => {
            setShowNew(false);
            fetchAll();
          }}
        />
      )}
    </div>
  );
}

// ─── New Page Modal ─────────────────────────────────────────────────────────

function NewPageModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [title, setTitle] = useState("");
  const [folderPath, setFolderPath] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/wiki/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, folderPath, content, confidence: 50 }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Create failed");
        return;
      }
      onCreated();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#0D0D0D] border border-white/10 rounded-xl p-6 w-full max-w-lg space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-text-primary">New Page</h3>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div>
          <label className="block text-[10px] uppercase tracking-wider text-text-muted font-bold mb-1.5">
            Title *
          </label>
          <input
            autoFocus
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full h-10 px-3 rounded-lg bg-[#050505] border border-white/10 text-sm text-text-primary outline-none focus:border-cyan-500/40"
            placeholder="Lead Pipeline Process"
          />
        </div>
        <div>
          <label className="block text-[10px] uppercase tracking-wider text-text-muted font-bold mb-1.5">
            Folder path (optional)
          </label>
          <input
            type="text"
            value={folderPath}
            onChange={(e) => setFolderPath(e.target.value)}
            className="w-full h-10 px-3 rounded-lg bg-[#050505] border border-white/10 text-sm text-text-primary outline-none focus:border-cyan-500/40 font-mono"
            placeholder="content/agents"
          />
        </div>
        <div>
          <label className="block text-[10px] uppercase tracking-wider text-text-muted font-bold mb-1.5">
            Content
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={6}
            className="w-full px-3 py-2 rounded-lg bg-[#050505] border border-white/10 text-sm text-text-secondary outline-none focus:border-cyan-500/40 font-mono"
            placeholder="Free text. Mention [[other-page]] to create a link."
          />
        </div>
        {error && (
          <div className="text-xs text-red-400 bg-red-500/5 border border-red-500/20 rounded-md px-3 py-2">
            {error}
          </div>
        )}
        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg text-xs font-bold text-text-muted hover:text-text-primary"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={submitting || !title.trim()}
            className="px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:bg-cyan-500/40 disabled:cursor-not-allowed text-black text-xs font-bold transition-colors flex items-center gap-1.5"
          >
            {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
            Create Page
          </button>
        </div>
      </div>
    </div>
  );
}


// ─── RAW Drop Zone ──────────────────────────────────────────────────────────

function RawDropZone({ onIngested }: { onIngested: () => void }) {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [recent, setRecent] = useState<Array<{ filename: string; status: string; kind: string; warnings?: string[] }>>([]);

  async function uploadFiles(files: File[]) {
    if (files.length === 0) return;
    setUploading(true);
    try {
      const form = new FormData();
      for (const f of files) form.append('file', f);
      const res = await fetch('/api/wiki/ingest', { method: 'POST', body: form });
      const data = await res.json();
      const records = data.records ?? [];
      setRecent((prev) => [...records.slice(0, 8), ...prev].slice(0, 8));
      // Trigger processing for the newly ingested rows so they become wiki pages immediately.
      try {
        await fetch('/api/wiki/process', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ max: 20 }) });
      } catch { /* non-fatal */ }
      onIngested();
    } catch (err) {
      setRecent((prev) => [{ filename: '(upload failed)', status: 'failed', kind: 'binary', warnings: [(err as Error).message] }, ...prev].slice(0, 8));
    } finally {
      setUploading(false);
    }
  }

  return (
    <GlassCard padding="none" className="overflow-hidden">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const files = Array.from(e.dataTransfer.files ?? []);
          if (files.length > 0) uploadFiles(files);
        }}
        className={`relative px-4 py-4 transition-all ${dragOver ? 'bg-blue-500/5 border-blue-500/40' : ''}`}
        style={{ borderBottom: recent.length > 0 ? '1px solid rgba(255,255,255,0.05)' : undefined }}
      >
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${dragOver ? 'bg-blue-500/20' : 'bg-blue-500/10'}`}>
              {uploading ? <Loader2 className="w-4 h-4 text-blue-300 animate-spin" /> : <Upload className="w-4 h-4 text-blue-300" />}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-text-primary">RAW — drop ANY file to ingest into Wiki Brain</div>
              <div className="text-[10px] text-text-muted">md / pdf / docx / txt / json / csv / code / images / audio / video / archives / spreadsheets — agent processes after upload</div>
            </div>
          </div>
          <label className="px-3 py-1.5 rounded-lg bg-blue-500 hover:bg-blue-400 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5">
            <Upload className="w-3.5 h-3.5" /> Browse files
            <input
              type="file"
              multiple
              className="hidden"
              onChange={(e) => {
                const files = Array.from(e.target.files ?? []);
                e.target.value = '';
                uploadFiles(files);
              }}
            />
          </label>
        </div>
      </div>
      {recent.length > 0 && (
        <div className="px-4 py-2 max-h-32 overflow-y-auto">
          {recent.map((r, i) => (
            <div key={i} className="flex items-center gap-2 text-[10px] py-0.5">
              {r.status === 'failed'
                ? <AlertCircle className="w-3 h-3 text-red-400 shrink-0" />
                : <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />}
              <span className="font-mono text-text-secondary truncate">{r.filename}</span>
              <span className="text-text-muted">·</span>
              <span className="text-text-muted">{r.kind}</span>
              <span className="text-text-muted">·</span>
              <span className={r.status === 'failed' ? 'text-red-400' : r.status === 'skipped' ? 'text-yellow-400' : 'text-emerald-400'}>{r.status}</span>
            </div>
          ))}
        </div>
      )}
    </GlassCard>
  );
}

