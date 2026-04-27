"use client";

import { useState, useRef, useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Check, X, DollarSign, Mail, Phone, ChevronDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast as sonner } from "sonner";

/**
 * Inline-editable cell. Click to edit, Enter to save, Esc to cancel,
 * blur saves (unless clicking the cancel button). Supports text, email,
 * tel, currency, number, date, select, multiselect.
 *
 * Persistence is the parent's job (via onSave) — this component only
 * surfaces the editing UX. Saves fire optimistically; failures bubble
 * up via the parent's catch.
 */

interface Option { value: string; label: string }

interface EditableCellProps {
  value: unknown;
  onSave: (value: unknown) => void | Promise<void>;
  type?: "text" | "email" | "tel" | "select" | "multiselect" | "currency" | "date" | "number";
  options?: Option[];
  className?: string;
  displayValue?: ReactNode;
  placeholder?: string;
  disabled?: boolean;
  /** Right-align contents (use for currency / dates / numeric columns) */
  align?: "left" | "right";
  /** Render children in view mode instead of the default value display (still click-to-edit) */
  children?: ReactNode;
}

export default function EditableCell({
  value,
  onSave,
  type = "text",
  options = [],
  className = "",
  displayValue,
  placeholder = "",
  disabled = false,
  align = "left",
  children,
}: EditableCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState<unknown>(value ?? "");
  const [open, setOpen] = useState(false);
  const [popPos, setPopPos] = useState<{ top: number; left: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const saving = useRef(false);

  useEffect(() => {
    if (!isEditing) setEditValue(value ?? "");
  }, [value, isEditing]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      try { inputRef.current.select(); } catch {/**/}
    }
  }, [isEditing]);

  // Position the portal popover below the trigger; close on scroll / outside click
  useEffect(() => {
    if (!open) return;
    const compute = () => {
      const rect = (triggerRef.current ?? containerRef.current)?.getBoundingClientRect();
      if (!rect) return;
      setPopPos({ top: rect.bottom + 4, left: rect.left });
    };
    compute();
    const handler = (e: MouseEvent) => {
      if (popoverRef.current?.contains(e.target as Node)) return;
      if (containerRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    const onScroll = () => setOpen(false);
    document.addEventListener("mousedown", handler);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", compute);
    return () => {
      document.removeEventListener("mousedown", handler);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", compute);
    };
  }, [open]);

  const commit = async (next: unknown) => {
    if (saving.current) return;
    let processed: unknown = next;
    if (type === "currency" || type === "number") {
      const n = parseFloat(String(next));
      processed = Number.isFinite(n) ? n : 0;
    }
    const sameStr = String(processed ?? "").trim() === String(value ?? "").trim();
    if (processed === value || sameStr) {
      setIsEditing(false);
      return;
    }
    saving.current = true;
    try {
      await Promise.resolve(onSave(processed));
    } catch (err) {
      sonner.error("Save failed", { description: String(err).slice(0, 120) });
    } finally {
      saving.current = false;
      setIsEditing(false);
    }
  };

  const cancel = () => {
    setEditValue(value ?? "");
    setIsEditing(false);
  };

  if (disabled) {
    return (
      <div className={cn("opacity-60 truncate", className)}>
        {children ?? displayValue ?? defaultDisplay(value, type)}
      </div>
    );
  }

  // ── SELECT ─────────────────────────────────────────────────────────────
  if (type === "select") {
    return (
      <div ref={containerRef} className="inline-flex" onClick={(e) => e.stopPropagation()}>
        <button
          ref={triggerRef}
          onClick={() => setOpen((o) => !o)}
          className={cn("group inline-flex items-center gap-1 cursor-pointer hover:brightness-125 transition-all", className)}
        >
          {displayValue ?? <span className="text-text-secondary">{String(value ?? placeholder)}</span>}
          <ChevronDown className="w-2.5 h-2.5 text-text-muted opacity-0 group-hover:opacity-100" />
        </button>
        {open && popPos && typeof document !== "undefined" && createPortal(
          <div
            ref={popoverRef}
            onClick={(e) => e.stopPropagation()}
            className="fixed z-[100] min-w-[160px] rounded-lg border border-border-med bg-surface shadow-[0_12px_36px_rgba(0,0,0,0.6)] backdrop-blur-md overflow-hidden"
            style={{ top: popPos.top, left: popPos.left }}
          >
            {options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => { setOpen(false); commit(opt.value); }}
                className={cn(
                  "w-full text-left px-3 py-1.5 text-xs cursor-pointer hover:bg-elevated transition-colors flex items-center justify-between",
                  String(value) === opt.value ? "text-amber-300 bg-amber-500/5" : "text-text-secondary"
                )}
              >
                <span>{opt.label}</span>
                {String(value) === opt.value && <Check className="w-3 h-3" />}
              </button>
            ))}
          </div>,
          document.body,
        )}
      </div>
    );
  }

  // ── MULTISELECT (tags) ─────────────────────────────────────────────────
  if (type === "multiselect") {
    const arr = Array.isArray(value) ? (value as string[]) : [];
    return (
      <div ref={containerRef} className="block w-full" onClick={(e) => e.stopPropagation()}>
        {/* Single-line, no flex-wrap — children render in their own fixed grid; the
            + button is positioned by the children's grid (caller controls placement). */}
        <div className="flex items-center gap-1 min-w-0 max-w-full whitespace-nowrap">
          <div className="flex-1 min-w-0">{children ?? displayValue}</div>
          <button
            ref={triggerRef}
            onClick={() => setOpen((o) => !o)}
            className="w-4 h-4 rounded-sm border border-dashed border-border text-text-muted hover:text-amber-400 hover:border-amber-500/40 transition-colors flex items-center justify-center cursor-pointer shrink-0"
            title="Edit tags"
          >
            <Plus className="w-2.5 h-2.5" />
          </button>
        </div>
        {open && popPos && typeof document !== "undefined" && createPortal(
          <div
            ref={popoverRef}
            onClick={(e) => e.stopPropagation()}
            className="fixed z-[100] min-w-[260px] p-2 rounded-lg border border-border-med bg-surface shadow-[0_12px_36px_rgba(0,0,0,0.6)] backdrop-blur-md"
            style={{ top: popPos.top, left: popPos.left }}
          >
            <div className="text-[9px] uppercase tracking-wider font-bold text-text-muted mb-1.5 px-1">Tags</div>
            {options.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {options.map((opt) => {
                  const on = arr.includes(opt.value);
                  return (
                    <button
                      key={opt.value}
                      onClick={() => {
                        const next = on ? arr.filter((v) => v !== opt.value) : [...arr, opt.value];
                        onSave(next);
                      }}
                      className={cn(
                        "px-1.5 py-0.5 rounded text-[10px] font-medium border cursor-pointer transition-colors",
                        on ? "bg-amber-500/15 border-amber-500/40 text-amber-300" : "bg-surface-2 border-border text-text-muted hover:border-border-med",
                      )}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            )}
            {arr.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {arr.filter((v) => !options.some((o) => o.value === v)).map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] bg-amber-500/15 text-amber-300 border border-amber-500/30">
                    {tag}
                    <button
                      onClick={() => onSave(arr.filter((v) => v !== tag))}
                      className="hover:text-rose-300 cursor-pointer"
                    >
                      <X className="w-2 h-2" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <input
              autoFocus
              type="text"
              placeholder="Add tag + Enter"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const v = (e.target as HTMLInputElement).value.trim();
                  if (v && !arr.includes(v)) onSave([...arr, v]);
                  (e.target as HTMLInputElement).value = "";
                }
                if (e.key === "Escape") setOpen(false);
              }}
              className="w-full px-2 py-1 rounded text-[11px] bg-surface-2 border border-border text-text-primary placeholder:text-text-disabled outline-none focus:border-amber-500/40"
            />
          </div>,
          document.body,
        )}
      </div>
    );
  }

  // ── EDIT MODE ─────────────────────────────────────────────────────────
  if (isEditing) {
    const inputType = type === "currency" || type === "number" ? "number" : type === "date" ? "date" : "text";
    return (
      <div className="flex items-center gap-1 w-full" onClick={(e) => e.stopPropagation()}>
        <input
          ref={inputRef}
          type={inputType}
          value={String(editValue ?? "")}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") { e.preventDefault(); commit(editValue); }
            if (e.key === "Escape") { e.preventDefault(); cancel(); }
          }}
          onBlur={(e) => {
            const related = e.relatedTarget as HTMLElement | null;
            if (related?.dataset.editAction === "cancel") { cancel(); return; }
            commit(editValue);
          }}
          step={type === "currency" ? "0.01" : type === "number" ? "1" : undefined}
          placeholder={placeholder}
          className="h-7 w-full min-w-0 px-2 rounded text-[12px] bg-surface-2 border border-amber-500/40 text-text-primary outline-none focus:border-amber-500/70 focus:shadow-[0_0_8px_rgba(251,191,36,0.25)]"
        />
        <button
          data-edit-action="save"
          onMouseDown={(e) => { e.preventDefault(); commit(editValue); }}
          className="w-5 h-5 rounded shrink-0 flex items-center justify-center text-emerald-400 hover:bg-emerald-500/10 cursor-pointer"
          title="Save (Enter)"
        >
          <Check className="w-3 h-3" />
        </button>
        <button
          data-edit-action="cancel"
          onMouseDown={(e) => { e.preventDefault(); cancel(); }}
          className="w-5 h-5 rounded shrink-0 flex items-center justify-center text-rose-400 hover:bg-rose-500/10 cursor-pointer"
          title="Cancel (Esc)"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    );
  }

  // ── VIEW MODE ─────────────────────────────────────────────────────────
  // CRITICAL: zero-displacement hover indicator. Headers, sub-labels, edit-mode
  // inputs, and non-editable cells all start at the same X (TD padding-left only).
  // We use box-shadow inset for hover so it doesn't push content sideways.
  const isRight = align === "right";
  return (
    <div
      onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
      className={cn(
        "group block w-full cursor-pointer rounded transition-colors truncate",
        isRight ? "text-right" : "",
        "hover:bg-elevated/40",
        // Inset box-shadow hover ring (2px on left for L-aligned, right for R-aligned).
        // Does NOT displace content. View mode, edit mode, header, sub-label all at same X.
        isRight
          ? "hover:shadow-[inset_-2px_0_0_rgba(251,191,36,0.45)]"
          : "hover:shadow-[inset_2px_0_0_rgba(251,191,36,0.45)]",
        className,
      )}
      title="Click to edit"
    >
      <span className={cn(
        "block min-w-0 max-w-full truncate",
        isRight && "text-right",
      )}>
        {/* No icon prefixes — column header carries the icon. This ensures
            every cell's content starts at exactly TD-padding-left (12px) so
            primary line, sub-label line, and adjacent columns all align. */}
        {children ?? displayValue ?? defaultDisplay(value, type)}
      </span>
    </div>
  );
}

function defaultDisplay(value: unknown, type: string): ReactNode {
  if (value === null || value === undefined || value === "") {
    return <span className="text-text-disabled italic">—</span>;
  }
  if (type === "currency") {
    const n = typeof value === "number" ? value : parseFloat(String(value));
    return <span className="font-mono tabular-nums text-emerald-300">{Number.isFinite(n) ? n.toLocaleString() : 0}</span>;
  }
  if (type === "date") {
    try {
      const d = new Date(String(value));
      const days = Math.floor((Date.now() - d.getTime()) / 86400000);
      const rel = days === 0 ? "today" : days === 1 ? "yesterday" : days < 7 ? `${days}d ago` : days < 30 ? `${Math.floor(days / 7)}w ago` : d.toLocaleDateString();
      return <span className="text-text-muted text-[11px] font-mono">{rel}</span>;
    } catch { return String(value); }
  }
  if (type === "email" && value) {
    return <span className="text-cyan-300">{String(value)}</span>;
  }
  if (type === "tel" && value) {
    return <span className="text-emerald-300">{String(value)}</span>;
  }
  return String(value);
}
