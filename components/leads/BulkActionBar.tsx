"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Tag, Trash2, ChevronDown, Loader2, AlertTriangle, Users } from "lucide-react";
import { fc } from "@/lib/toast";

interface Props {
  selectedIds: (string | number)[];
  onClearSelection: () => void;
  onAfterAction: () => void;
  onCouncil?: (id: string) => void;
}

const STATUSES = [
  { value: "new", label: "New", color: "text-blue-400" },
  { value: "contacted", label: "Contacted", color: "text-cyan-400" },
  { value: "qualified", label: "Qualified", color: "text-violet-400" },
  { value: "proposal", label: "Proposal", color: "text-amber-400" },
  { value: "negotiation", label: "Negotiation", color: "text-orange-400" },
  { value: "won", label: "Won", color: "text-emerald-400" },
  { value: "lost", label: "Lost", color: "text-rose-400" },
];

const PRIORITIES = [
  { value: "low",    label: "Low",    color: "text-slate-400" },
  { value: "medium", label: "Medium", color: "text-cyan-400" },
  { value: "high",   label: "High",   color: "text-amber-400" },
  { value: "urgent", label: "Urgent", color: "text-rose-400" },
];

export function BulkActionBar({ selectedIds, onClearSelection, onAfterAction, onCouncil }: Props) {
  const [working, setWorking] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [openMenu, setOpenMenu] = useState<"status" | "priority" | "tag" | null>(null);
  const [tag, setTag] = useState("");

  if (selectedIds.length === 0) return null;

  const run = async (body: Record<string, unknown>) => {
    setWorking(true);
    try {
      const res = await fetch("/api/leads/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds.map(String), ...body }),
      });
      const data = await res.json();
      if (!res.ok) {
        fc.error(typeof data.error === "string" ? data.error : "Bulk action failed");
      } else {
        fc.win(`Updated ${data.affected} contact${data.affected === 1 ? "" : "s"}`);
        onAfterAction();
        setOpenMenu(null);
        setConfirmDelete(false);
        setTag("");
      }
    } catch {
      fc.error("Bulk action failed");
    } finally {
      setWorking(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 bg-surface border border-border-med rounded-xl shadow-[0_12px_40px_rgba(0,0,0,0.5)] px-3 py-2 max-w-[calc(100vw-2rem)]"
      >
        <span className="text-[12px] font-bold text-text-primary px-1">
          {selectedIds.length} selected
        </span>
        <div className="w-px h-5 bg-border" />

        {/* Council button — only when exactly 1 lead selected */}
        {selectedIds.length === 1 && onCouncil && (
          <>
            <button
              onClick={() => onCouncil(String(selectedIds[0]))}
              disabled={working}
              className="px-2.5 py-1.5 rounded-lg text-[11px] font-medium bg-gradient-to-r from-amber-500/15 via-cyan-500/15 to-rose-500/15 text-text-primary border border-amber-500/30 hover:border-amber-500/50 cursor-pointer flex items-center gap-1 disabled:opacity-50"
              title="3 agents debate the next move on this lead"
            >
              <Users className="w-3 h-3 text-amber-400" /> Council
            </button>
            <div className="w-px h-5 bg-border" />
          </>
        )}

        {/* Status menu */}
        <div className="relative">
          <button
            onClick={() => setOpenMenu(openMenu === "status" ? null : "status")}
            disabled={working}
            className="px-2.5 py-1.5 rounded-lg text-[11px] font-medium bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/20 cursor-pointer flex items-center gap-1 disabled:opacity-50"
          >
            Status <ChevronDown className="w-3 h-3" />
          </button>
          {openMenu === "status" && (
            <div className="absolute bottom-full mb-1 left-0 w-44 bg-surface border border-border-med rounded-lg overflow-hidden shadow-xl">
              {STATUSES.map((s) => (
                <button
                  key={s.value}
                  onClick={() => run({ action: "status", value: s.value })}
                  className="w-full text-left px-3 py-1.5 text-[11px] hover:bg-elevated cursor-pointer flex items-center gap-2"
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${s.color.replace("text-", "bg-")}`} />
                  <span className="text-text-secondary">{s.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Priority menu */}
        <div className="relative">
          <button
            onClick={() => setOpenMenu(openMenu === "priority" ? null : "priority")}
            disabled={working}
            className="px-2.5 py-1.5 rounded-lg text-[11px] font-medium bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20 cursor-pointer flex items-center gap-1 disabled:opacity-50"
          >
            Priority <ChevronDown className="w-3 h-3" />
          </button>
          {openMenu === "priority" && (
            <div className="absolute bottom-full mb-1 left-0 w-36 bg-surface border border-border-med rounded-lg overflow-hidden shadow-xl">
              {PRIORITIES.map((p) => (
                <button
                  key={p.value}
                  onClick={() => run({ action: "priority", value: p.value })}
                  className={`w-full text-left px-3 py-1.5 text-[11px] hover:bg-elevated cursor-pointer ${p.color}`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Tag menu */}
        <div className="relative">
          <button
            onClick={() => setOpenMenu(openMenu === "tag" ? null : "tag")}
            disabled={working}
            className="px-2.5 py-1.5 rounded-lg text-[11px] font-medium bg-violet-500/10 text-violet-300 border border-violet-500/30 hover:bg-violet-500/20 cursor-pointer flex items-center gap-1 disabled:opacity-50"
          >
            <Tag className="w-3 h-3" /> Tag
          </button>
          {openMenu === "tag" && (
            <div className="absolute bottom-full mb-1 left-0 w-56 p-2 bg-surface border border-border-med rounded-lg shadow-xl">
              <input
                autoFocus
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                placeholder="Tag to add or remove"
                className="w-full px-2 py-1.5 rounded text-[11px] bg-surface-2 border border-border text-text-primary outline-none focus:border-violet-500/40"
              />
              <div className="flex gap-1 mt-1.5">
                <button
                  onClick={() => tag.trim() && run({ action: "tag-add", tag: tag.trim() })}
                  disabled={!tag.trim()}
                  className="flex-1 px-2 py-1 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25 disabled:opacity-40 cursor-pointer"
                >
                  Add
                </button>
                <button
                  onClick={() => tag.trim() && run({ action: "tag-remove", tag: tag.trim() })}
                  disabled={!tag.trim()}
                  className="flex-1 px-2 py-1 rounded text-[10px] font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30 hover:bg-rose-500/25 disabled:opacity-40 cursor-pointer"
                >
                  Remove
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Delete */}
        {!confirmDelete ? (
          <button
            onClick={() => setConfirmDelete(true)}
            disabled={working}
            className="px-2.5 py-1.5 rounded-lg text-[11px] font-medium bg-rose-500/10 text-rose-300 border border-rose-500/30 hover:bg-rose-500/20 cursor-pointer flex items-center gap-1 disabled:opacity-50"
          >
            <Trash2 className="w-3 h-3" /> Delete
          </button>
        ) : (
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-rose-500/15 border border-rose-500/40">
            <AlertTriangle className="w-3 h-3 text-rose-300" />
            <span className="text-[10px] text-rose-200">Delete {selectedIds.length}?</span>
            <button
              onClick={() => run({ action: "delete" })}
              disabled={working}
              className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/30 text-rose-100 hover:bg-rose-500/50 cursor-pointer flex items-center gap-0.5 disabled:opacity-50"
            >
              {working ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Check className="w-2.5 h-2.5" />}
              Yes
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="px-1.5 py-0.5 rounded text-[10px] text-text-muted hover:text-text-primary cursor-pointer"
            >
              No
            </button>
          </div>
        )}

        <div className="w-px h-5 bg-border ml-1" />
        <button
          onClick={onClearSelection}
          className="w-7 h-7 rounded-lg hover:bg-elevated flex items-center justify-center cursor-pointer"
          title="Clear selection"
        >
          <X className="w-3.5 h-3.5 text-text-muted" />
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
