"use client";

import { useState } from "react";
import { GlassCard } from "@/components/primitives";
import { BookOpen, Plus, Search, FileText, ChevronRight } from "lucide-react";

const DEMO_ARTICLES = [
  { id: "1", title: "Company Overview & Services", content: "Fusion Data Company provides AI-powered business automation...", updatedAt: "Mar 18, 2026" },
  { id: "2", title: "Pricing & Packages", content: "Our pricing structure is designed for scalability...", updatedAt: "Mar 15, 2026" },
  { id: "3", title: "Sales Rebuttals", content: "Common objections and how to handle them...", updatedAt: "Mar 10, 2026" },
  { id: "4", title: "Onboarding Process", content: "Step-by-step guide for new client onboarding...", updatedAt: "Mar 8, 2026" },
  { id: "5", title: "Technical Stack FAQ", content: "Answers to common technical questions from prospects...", updatedAt: "Mar 5, 2026" },
];

export default function KnowledgeBasePage() {
  const [search, setSearch] = useState("");

  const filtered = DEMO_ARTICLES.filter((a) =>
    a.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary" style={{ fontFamily: "var(--font-display)" }}>Knowledge Base</h1>
          <p className="text-sm text-text-muted">{DEMO_ARTICLES.length} articles</p>
        </div>
        <button className="px-3 py-2 rounded-lg text-xs font-medium bg-amber/20 text-amber border border-amber/30 hover:bg-amber/30 cursor-pointer flex items-center gap-1">
          <Plus className="w-3.5 h-3.5" /> New Article
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
        <input
          type="text"
          placeholder="Search knowledge base..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-9 pl-9 pr-4 rounded-lg text-sm bg-surface border border-border text-text-primary placeholder:text-text-muted focus:border-amber/30 outline-none"
        />
      </div>

      <GlassCard padding="none">
        <div className="divide-y divide-border">
          {filtered.map((article) => (
            <div key={article.id} className="flex items-center justify-between px-5 py-4 hover:bg-elevated/50 transition-colors cursor-pointer">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-amber shrink-0" />
                <div>
                  <div className="text-sm font-semibold text-text-primary">{article.title}</div>
                  <div className="text-xs text-text-muted mt-0.5 line-clamp-1">{article.content}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-text-muted">{article.updatedAt}</span>
                <ChevronRight className="w-4 h-4 text-text-muted" />
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
