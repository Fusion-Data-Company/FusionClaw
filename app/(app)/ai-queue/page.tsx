"use client";

import { useState, useEffect } from "react";
import { GlassCard } from "@/components/primitives";
import { Sparkles, CheckCircle, XCircle, Clock, Eye, Loader2, Inbox } from "lucide-react";

interface QueueItem {
  id: string;
  type: string;
  title: string;
  content: string | null;
  status: "pending" | "approved" | "rejected" | "published";
  reviewNotes: string | null;
  generatedAt: string;
  reviewedAt: string | null;
}

const STATUS_CONFIG = {
  pending: { icon: Clock, color: "text-warning", bg: "bg-warning/10 border-warning/30" },
  approved: { icon: CheckCircle, color: "text-success", bg: "bg-success/10 border-success/30" },
  rejected: { icon: XCircle, color: "text-error", bg: "bg-error/10 border-error/30" },
  published: { icon: Sparkles, color: "text-accent", bg: "bg-accent/10 border-accent/30" },
};

export default function AIQueuePage() {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<QueueItem | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchQueueItems();
  }, []);

  const fetchQueueItems = async () => {
    try {
      const res = await fetch("/api/ai-queue");
      const data = await res.json();
      setItems(data.items || []);
    } catch (err) {
      console.error("Failed to fetch queue items:", err);
    } finally {
      setLoading(false);
    }
  };

  const updateItemStatus = async (id: string, status: "approved" | "rejected" | "published") => {
    setUpdating(id);
    try {
      const res = await fetch(`/api/ai-queue/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.item) {
        setItems((prev) =>
          prev.map((item) =>
            item.id === id ? { ...item, status, reviewedAt: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) } : item
          )
        );
        setSelectedItem(null);
      }
    } catch (err) {
      console.error("Failed to update item:", err);
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary" style={{ fontFamily: "var(--font-display)" }}>AI Content Queue</h1>
          <p className="text-sm text-text-muted">Loading queue...</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary" style={{ fontFamily: "var(--font-display)" }}>AI Content Queue</h1>
        <p className="text-sm text-text-muted">Review and approve AI-generated content</p>
      </div>

      {items.length === 0 ? (
        <GlassCard padding="lg" className="text-center">
          <Inbox className="w-12 h-12 text-text-muted mx-auto mb-4" />
          <h2 className="text-lg font-bold text-text-primary mb-2">Queue is Empty</h2>
          <p className="text-sm text-text-muted">
            AI-generated content will appear here for review.
          </p>
        </GlassCard>
      ) : (
        <GlassCard padding="none">
          <div className="divide-y divide-border">
            {items.map((item) => {
              const config = STATUS_CONFIG[item.status];
              const Icon = config.icon;
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between px-5 py-4 hover:bg-elevated/50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <Icon className={`w-5 h-5 ${config.color} shrink-0`} />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-text-primary truncate">{item.title}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] uppercase font-bold text-text-muted">{item.type}</span>
                        <span className="text-[10px] text-text-muted">{item.generatedAt}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${config.bg}`}>
                      {item.status}
                    </span>
                    <button
                      onClick={() => setSelectedItem(item)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg bg-surface border border-border text-text-muted hover:text-text-primary cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    {item.status === "pending" && (
                      <>
                        <button
                          onClick={() => updateItemStatus(item.id, "approved")}
                          disabled={updating === item.id}
                          className="w-7 h-7 flex items-center justify-center rounded-lg bg-success/10 border border-success/30 text-success hover:bg-success/20 cursor-pointer disabled:opacity-50"
                        >
                          {updating === item.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => updateItemStatus(item.id, "rejected")}
                          disabled={updating === item.id}
                          className="w-7 h-7 flex items-center justify-center rounded-lg bg-error/10 border border-error/30 text-error hover:bg-error/20 cursor-pointer disabled:opacity-50"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </GlassCard>
      )}

      {/* Preview Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setSelectedItem(null)}>
          <GlassCard padding="lg" className="w-full max-w-2xl max-h-[80vh] overflow-auto" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-text-primary">{selectedItem.title}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] uppercase font-bold text-text-muted">{selectedItem.type}</span>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${STATUS_CONFIG[selectedItem.status].bg}`}>
                    {selectedItem.status}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="text-text-muted hover:text-text-primary"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="prose prose-invert max-w-none">
              <div className="text-sm text-text-secondary whitespace-pre-wrap">
                {selectedItem.content || "No content available."}
              </div>
            </div>
            {selectedItem.status === "pending" && (
              <div className="flex gap-2 mt-6 pt-4 border-t border-border">
                <button
                  onClick={() => updateItemStatus(selectedItem.id, "approved")}
                  disabled={updating === selectedItem.id}
                  className="flex-1 h-9 rounded-lg text-sm font-medium bg-success/20 text-success border border-success/30 hover:bg-success/30 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {updating === selectedItem.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  Approve
                </button>
                <button
                  onClick={() => updateItemStatus(selectedItem.id, "rejected")}
                  disabled={updating === selectedItem.id}
                  className="flex-1 h-9 rounded-lg text-sm font-medium bg-error/20 text-error border border-error/30 hover:bg-error/30 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <XCircle className="w-4 h-4" />
                  Reject
                </button>
              </div>
            )}
          </GlassCard>
        </div>
      )}
    </div>
  );
}
