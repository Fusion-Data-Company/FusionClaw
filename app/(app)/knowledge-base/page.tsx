"use client";

import { useState, useEffect } from "react";
import { GlassCard } from "@/components/primitives";
import { BookOpen, Plus, Search, FileText, ChevronRight, Loader2, Trash2, X } from "lucide-react";

interface Article {
  id: string;
  title: string;
  content: string;
  updatedAt: string;
  createdAt: string;
}

export default function KnowledgeBasePage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newArticle, setNewArticle] = useState({ title: "", content: "" });
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      const res = await fetch("/api/knowledge-base");
      const data = await res.json();
      setArticles(data.articles || []);
    } catch (err) {
      console.error("Failed to fetch articles:", err);
    } finally {
      setLoading(false);
    }
  };

  const createArticle = async () => {
    if (!newArticle.title.trim() || !newArticle.content.trim()) return;

    setCreating(true);
    try {
      const res = await fetch("/api/knowledge-base", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newArticle),
      });
      const data = await res.json();
      if (data.article) {
        setArticles((prev) => [{
          ...data.article,
          updatedAt: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        }, ...prev]);
        setNewArticle({ title: "", content: "" });
        setShowModal(false);
      }
    } catch (err) {
      console.error("Failed to create article:", err);
    } finally {
      setCreating(false);
    }
  };

  const deleteArticle = async (id: string) => {
    try {
      await fetch(`/api/knowledge-base/${id}`, { method: "DELETE" });
      setArticles((prev) => prev.filter((a) => a.id !== id));
      setSelectedArticle(null);
    } catch (err) {
      console.error("Failed to delete article:", err);
    }
  };

  const filtered = articles.filter((a) =>
    a.title.toLowerCase().includes(search.toLowerCase()) ||
    a.content.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary" style={{ fontFamily: "var(--font-display)" }}>Knowledge Base</h1>
          <p className="text-sm text-text-muted">Loading articles...</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary" style={{ fontFamily: "var(--font-display)" }}>Knowledge Base</h1>
          <p className="text-sm text-text-muted">{articles.length} article{articles.length !== 1 ? "s" : ""}</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-3 py-2 rounded-lg text-xs font-medium bg-accent/20 text-accent border border-accent/30 hover:bg-accent/30 cursor-pointer flex items-center gap-1"
        >
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
          className="w-full h-9 pl-9 pr-4 rounded-lg text-sm bg-surface border border-border text-text-primary placeholder:text-text-muted focus:border-accent/30 outline-none"
        />
      </div>

      {articles.length === 0 ? (
        <GlassCard padding="lg" className="text-center">
          <BookOpen className="w-12 h-12 text-text-muted mx-auto mb-4" />
          <h2 className="text-lg font-bold text-text-primary mb-2">No Articles Yet</h2>
          <p className="text-sm text-text-muted mb-4">
            Build your knowledge base by adding articles about your products, services, and processes.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 rounded-lg text-sm font-bold bg-accent/20 text-accent border border-accent/30 hover:bg-accent/30 cursor-pointer inline-flex items-center gap-2 transition-all hover:shadow-[0_0_15px_rgba(59,130,246,0.3)]"
          >
            <Plus className="w-4 h-4" /> Add Your First Article
          </button>
        </GlassCard>
      ) : filtered.length === 0 ? (
        <GlassCard padding="lg" className="text-center">
          <Search className="w-12 h-12 text-text-muted mx-auto mb-4" />
          <h2 className="text-lg font-bold text-text-primary mb-2">No Results Found</h2>
          <p className="text-sm text-text-muted">
            Try adjusting your search terms.
          </p>
        </GlassCard>
      ) : (
        <GlassCard padding="none">
          <div className="divide-y divide-border">
            {filtered.map((article) => (
              <div
                key={article.id}
                onClick={() => setSelectedArticle(article)}
                className="flex items-center justify-between px-5 py-4 hover:bg-elevated/50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <FileText className="w-5 h-5 text-accent shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-text-primary truncate">{article.title}</div>
                    <div className="text-xs text-text-muted mt-0.5 line-clamp-1">{article.content}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] text-text-muted">{article.updatedAt}</span>
                  <ChevronRight className="w-4 h-4 text-text-muted" />
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <GlassCard padding="lg" className="w-full max-w-2xl" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-text-primary mb-4">New Article</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-text-secondary block mb-1">Title</label>
                <input
                  type="text"
                  value={newArticle.title}
                  onChange={(e) => setNewArticle((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Article title..."
                  className="w-full h-9 px-3 rounded-lg text-sm bg-surface border border-border text-text-primary placeholder:text-text-muted focus:border-accent/30 outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-text-secondary block mb-1">Content</label>
                <textarea
                  value={newArticle.content}
                  onChange={(e) => setNewArticle((prev) => ({ ...prev, content: e.target.value }))}
                  placeholder="Write your article content here..."
                  rows={10}
                  className="w-full px-3 py-2 rounded-lg text-sm bg-surface border border-border text-text-primary placeholder:text-text-muted focus:border-accent/30 outline-none resize-none"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 h-9 rounded-lg text-sm font-medium bg-surface text-text-secondary border border-border hover:bg-elevated cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={createArticle}
                  disabled={creating || !newArticle.title.trim() || !newArticle.content.trim()}
                  className="flex-1 h-9 rounded-lg text-sm font-medium bg-accent/20 text-accent border border-accent/30 hover:bg-accent/30 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Create Article
                </button>
              </div>
            </div>
          </GlassCard>
        </div>
      )}

      {/* View Article Modal */}
      {selectedArticle && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setSelectedArticle(null)}>
          <GlassCard padding="lg" className="w-full max-w-2xl max-h-[80vh] overflow-auto" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-text-primary">{selectedArticle.title}</h2>
                <p className="text-xs text-text-muted mt-1">Last updated: {selectedArticle.updatedAt}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => deleteArticle(selectedArticle.id)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-error/10 border border-error/30 text-error hover:bg-error/20 cursor-pointer"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setSelectedArticle(null)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-surface border border-border text-text-muted hover:text-text-primary cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="prose prose-invert max-w-none">
              <div className="text-sm text-text-secondary whitespace-pre-wrap">
                {selectedArticle.content}
              </div>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
