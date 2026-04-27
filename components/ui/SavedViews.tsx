"use client";

import { useEffect, useState, useCallback } from "react";
import { Pin, Plus, Save, X, Trash2 } from "lucide-react";
import { fc } from "@/lib/toast";

interface SavedView {
  id: string;
  name: string;
  filters: Record<string, unknown>;
  pinned: boolean;
}

interface Props {
  scope: "leads" | "tasks" | "invoices" | "expenses" | "skills" | "campaigns";
  currentFilters: Record<string, unknown>;
  onApply: (filters: Record<string, unknown>) => void;
}

export function SavedViews({ scope, currentFilters, onApply }: Props) {
  const [views, setViews] = useState<SavedView[]>([]);
  const [showSave, setShowSave] = useState(false);
  const [name, setName] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);

  const fetchViews = useCallback(async () => {
    try {
      const res = await fetch(`/api/views?scope=${scope}`);
      if (res.ok) {
        const data = await res.json();
        setViews(data.views ?? []);
      }
    } catch {/* silent */}
  }, [scope]);

  useEffect(() => { fetchViews(); }, [fetchViews]);

  const saveView = async () => {
    if (!name.trim()) return;
    try {
      const res = await fetch("/api/views", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope, name: name.trim(), filters: currentFilters, pinned: true }),
      });
      if (!res.ok) throw new Error();
      const created = await res.json();
      setViews((prev) => [...prev, created]);
      setName("");
      setShowSave(false);
      fc.win(`Saved view "${created.name}"`);
    } catch {
      fc.error("Failed to save view");
    }
  };

  const deleteView = async (id: string) => {
    try {
      await fetch(`/api/views/${id}`, { method: "DELETE" });
      setViews((prev) => prev.filter((v) => v.id !== id));
      if (activeId === id) setActiveId(null);
      fc.log("View removed");
    } catch {
      fc.error("Failed to remove view");
    }
  };

  const apply = (v: SavedView) => {
    setActiveId(v.id);
    onApply(v.filters);
  };

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {views.length > 0 && (
        <span className="text-[9px] uppercase tracking-wider font-bold text-text-muted mr-1">Views:</span>
      )}
      {views.map((v) => {
        const active = v.id === activeId;
        return (
          <div
            key={v.id}
            className={`group inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] border transition-colors ${
              active ? "bg-amber-500/15 border-amber-500/40 text-amber-200" : "bg-surface-2 border-border text-text-secondary hover:border-border-med"
            }`}
          >
            <button onClick={() => apply(v)} className="flex items-center gap-1 cursor-pointer">
              <Pin className={`w-2.5 h-2.5 ${active ? "text-amber-400" : "text-text-muted"}`} />
              {v.name}
            </button>
            <button
              onClick={() => deleteView(v.id)}
              className="opacity-0 group-hover:opacity-100 ml-0.5 hover:text-rose-400 cursor-pointer"
              title="Remove view"
            >
              <Trash2 className="w-2.5 h-2.5" />
            </button>
          </div>
        );
      })}
      {!showSave ? (
        <button
          onClick={() => setShowSave(true)}
          className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] bg-surface border border-dashed border-border text-text-muted hover:text-text-primary hover:border-amber-500/40 cursor-pointer transition-colors"
        >
          <Plus className="w-2.5 h-2.5" /> Save view
        </button>
      ) : (
        <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-surface-2 border border-amber-500/40">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") saveView();
              if (e.key === "Escape") { setShowSave(false); setName(""); }
            }}
            placeholder="Name this view"
            className="bg-transparent text-[11px] text-text-primary placeholder:text-text-disabled outline-none w-32"
          />
          <button onClick={saveView} className="text-amber-400 hover:text-amber-300 cursor-pointer">
            <Save className="w-3 h-3" />
          </button>
          <button onClick={() => { setShowSave(false); setName(""); }} className="text-text-muted hover:text-text-secondary cursor-pointer">
            <X className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
}
