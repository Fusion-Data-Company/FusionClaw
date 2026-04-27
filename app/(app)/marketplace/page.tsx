"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { GlassCard } from "@/components/primitives";
import { SpotlightCard } from "@/components/effects/EliteEffects";
import {
  Store, Download, Star, Loader2, Search, Tag, Sparkles, FlaskConical,
  Cpu, Mail, Target, FileText, Globe, Zap, LifeBuoy, CheckCircle2,
} from "lucide-react";
import { fc } from "@/lib/toast";

interface Template {
  id: string;
  authorHandle: string;
  authorName: string;
  name: string;
  description: string;
  category: "outreach" | "qualification" | "content" | "research" | "ops" | "support";
  agentModel: string;
  tags: string[];
  installs: number;
  rating: number;
  version: string;
  testCount: number;
  promptPreview: string;
}

const CAT_ICON = {
  outreach: Mail, qualification: Target, content: FileText,
  research: Search, ops: Zap, support: LifeBuoy,
};

const CAT_TINT: Record<string, string> = {
  outreach: "text-blue-400 bg-blue-500/10 border-blue-500/30",
  qualification: "text-violet-400 bg-violet-500/10 border-violet-500/30",
  content: "text-fuchsia-400 bg-fuchsia-500/10 border-fuchsia-500/30",
  research: "text-cyan-400 bg-cyan-500/10 border-cyan-500/30",
  ops: "text-amber-400 bg-amber-500/10 border-amber-500/30",
  support: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
};

export default function MarketplacePage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [installing, setInstalling] = useState<string | null>(null);
  const [installed, setInstalled] = useState<Set<string>>(new Set());
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string | "all">("all");

  useEffect(() => {
    fetch("/api/marketplace")
      .then((r) => r.json())
      .then((d) => setTemplates(d.templates ?? []))
      .catch(() => fc.error("Failed to load templates"))
      .finally(() => setLoading(false));
  }, []);

  const install = async (t: Template) => {
    setInstalling(t.id);
    try {
      const res = await fetch("/api/marketplace/install", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId: t.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        fc.error(data.error ?? "Install failed");
        return;
      }
      setInstalled((prev) => new Set([...prev, t.id]));
      fc.win(`Installed "${t.name}"`, `+${data.testsInstalled} test${data.testsInstalled === 1 ? "" : "s"} → Idea column`);
    } catch {
      fc.error("Install failed");
    }
    setInstalling(null);
  };

  const categories = ["all", "outreach", "qualification", "content", "research", "ops", "support"];

  const filtered = templates.filter((t) => {
    if (cat !== "all" && t.category !== cat) return false;
    if (q.trim()) {
      const ql = q.toLowerCase();
      return t.name.toLowerCase().includes(ql) ||
             t.description.toLowerCase().includes(ql) ||
             t.tags.some((tag) => tag.toLowerCase().includes(ql)) ||
             t.authorHandle.toLowerCase().includes(ql);
    }
    return true;
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 via-cyan-500 to-violet-500 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.4)]">
            <Store className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-primary" style={{ fontFamily: "var(--font-display)" }}>
              Skill Marketplace
            </h1>
            <p className="text-xs text-text-muted">Curated skills with seed tests. One click to install — they land in your Idea column.</p>
          </div>
        </div>
      </div>

      {/* Filter + search */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
          <input
            value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="Search templates…"
            className="w-full h-9 pl-9 pr-3 rounded-lg text-sm bg-surface border border-border text-text-primary placeholder:text-text-muted outline-none focus:border-emerald-500/40"
          />
        </div>
        <div className="flex flex-wrap gap-1">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border cursor-pointer transition-colors ${
                cat === c ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-200" : "bg-surface border-border text-text-muted hover:border-border-med"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Featured: top by installs */}
      {!loading && filtered.length > 0 && cat === "all" && !q && (
        <div>
          <div className="text-[10px] uppercase tracking-wider font-bold text-amber-400 mb-2">⭐ Featured</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[...filtered].sort((a, b) => b.installs - a.installs).slice(0, 3).map((t) => (
              <SpotlightCard key={`f-${t.id}`} className="p-4">
                <Tile t={t} installing={installing === t.id} installed={installed.has(t.id)} onInstall={() => install(t)} />
              </SpotlightCard>
            ))}
          </div>
        </div>
      )}

      {/* All */}
      <div>
        {cat === "all" && !q && <div className="text-[10px] uppercase tracking-wider font-bold text-text-muted mb-2">All templates</div>}
        {loading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-emerald-400" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-[12px] text-text-muted">No templates match.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map((t) => (
              <GlassCard key={t.id} padding="none" className="p-4">
                <Tile t={t} installing={installing === t.id} installed={installed.has(t.id)} onInstall={() => install(t)} />
              </GlassCard>
            ))}
          </div>
        )}
      </div>

      <div className="text-center text-[10px] text-text-muted font-mono pt-4 border-t border-border">
        Templates ship with the platform. Want to publish your own? Drop a JSON file in <code className="text-emerald-300">lib/marketplace/templates.ts</code> and PR.
      </div>

      <div className="flex justify-center pt-2">
        <button
          onClick={() => router.push("/skills")}
          className="px-3 py-1.5 rounded-lg text-[11px] text-text-muted hover:text-text-primary cursor-pointer"
        >
          ← Back to Skills
        </button>
      </div>
    </div>
  );
}

function Tile({
  t, installing, installed, onInstall,
}: {
  t: Template; installing: boolean; installed: boolean; onInstall: () => void;
}) {
  const Icon = CAT_ICON[t.category] ?? Sparkles;
  return (
    <div className="space-y-2.5">
      <div className="flex items-start gap-2">
        <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${CAT_TINT[t.category]}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-bold text-text-primary truncate">{t.name}</div>
          <div className="text-[10px] text-text-muted font-mono truncate">{t.authorHandle} · v{t.version}</div>
        </div>
      </div>

      <p className="text-[11px] text-text-secondary leading-snug line-clamp-2">{t.description}</p>

      <div className="flex flex-wrap gap-1">
        {t.tags.slice(0, 3).map((tag) => (
          <span key={tag} className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-surface-2 border border-border text-text-muted">{tag}</span>
        ))}
      </div>

      <div className="flex items-center justify-between text-[10px] text-text-muted font-mono pt-2 border-t border-border">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-0.5"><Download className="w-2.5 h-2.5" />{t.installs.toLocaleString()}</span>
          <span className="flex items-center gap-0.5"><Star className="w-2.5 h-2.5 text-amber-400" />{t.rating.toFixed(1)}</span>
          <span className="flex items-center gap-0.5"><FlaskConical className="w-2.5 h-2.5" />{t.testCount}</span>
        </div>
        <span className="flex items-center gap-0.5"><Cpu className="w-2.5 h-2.5" />{t.agentModel.split("/").pop()}</span>
      </div>

      <button
        onClick={onInstall}
        disabled={installing || installed}
        className={`w-full px-3 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer flex items-center justify-center gap-1 transition-all ${
          installed ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/40" :
          "bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 hover:shadow-[0_0_15px_rgba(251,191,36,0.3)]"
        } disabled:opacity-50`}
      >
        {installed ? (
          <><CheckCircle2 className="w-3 h-3" /> Installed</>
        ) : installing ? (
          <><Loader2 className="w-3 h-3 animate-spin" /> Installing…</>
        ) : (
          <><Download className="w-3 h-3" /> Install</>
        )}
      </button>
    </div>
  );
}

void Tag;
