"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { ExternalLink, Save, Trash2 } from "lucide-react";

/**
 * One social-link icon: clicking opens a tiny popover with an input. If a value
 * is set, the popover also offers "Open" (new tab) and "Clear". The popover
 * is portaled to <body> so it escapes the table cell's `overflow:hidden` and
 * doesn't get clipped — fixes the z-index/clipping bug on tag dropdowns too.
 */

interface Props {
  icon: React.ComponentType<{ className?: string }>;
  url: string | null | undefined;
  brandColor: string;          // Tailwind text class for the icon (active state)
  placeholder: string;
  label: string;
  onSave: (url: string | null) => void;
}

export function SocialLinkCell({ icon: Icon, url, brandColor, placeholder, label, onSave }: Props) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(url ?? "");
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setValue(url ?? ""); }, [url]);

  useEffect(() => {
    if (!open) return;
    const computePos = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;
      // Anchor below the icon, slightly indented
      setPos({ top: rect.bottom + 6, left: Math.max(8, rect.left - 50) });
    };
    computePos();
    const handler = (e: MouseEvent) => {
      if (popRef.current?.contains(e.target as Node)) return;
      if (triggerRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    const onScroll = () => setOpen(false);
    document.addEventListener("mousedown", handler);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", computePos);
    return () => {
      document.removeEventListener("mousedown", handler);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", computePos);
    };
  }, [open]);

  const save = () => {
    const v = value.trim();
    onSave(v || null);
    setOpen(false);
  };
  const clear = () => {
    onSave(null);
    setValue("");
    setOpen(false);
  };

  const hasValue = !!url;

  return (
    <>
      <button
        ref={triggerRef}
        onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
        title={url || `Add ${label} URL`}
        className={`${brandColor} shrink-0 transition-all hover:scale-110 ${hasValue ? "opacity-100" : "opacity-25 hover:opacity-60"}`}
      >
        <Icon className="h-4 w-4" />
      </button>

      {open && pos && typeof document !== "undefined" && createPortal(
        <div
          ref={popRef}
          onClick={(e) => e.stopPropagation()}
          className="fixed z-[100] w-72 bg-surface border border-border-med rounded-lg shadow-[0_12px_36px_rgba(0,0,0,0.6)] backdrop-blur-md p-3"
          style={{ top: pos.top, left: pos.left }}
        >
          <div className="flex items-center gap-1.5 mb-2">
            <Icon className={`h-3.5 w-3.5 ${hasValue ? brandColor : "text-text-muted"}`} />
            <span className="text-[10px] uppercase tracking-wider font-bold text-text-secondary">{label}</span>
          </div>
          <input
            autoFocus
            type="url"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") { e.preventDefault(); save(); }
              if (e.key === "Escape") setOpen(false);
            }}
            placeholder={placeholder}
            className="w-full px-2 py-1.5 rounded text-[12px] bg-surface-2 border border-border text-text-primary placeholder:text-text-disabled outline-none focus:border-amber-500/40 font-mono"
          />
          <div className="flex items-center gap-1.5 mt-2">
            <button
              onClick={save}
              className="flex-1 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 cursor-pointer flex items-center justify-center gap-1"
            >
              <Save className="w-3 h-3" /> Save
            </button>
            {hasValue && (
              <>
                <a
                  href={url ?? "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setOpen(false)}
                  className="px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/25 cursor-pointer flex items-center gap-1"
                  title="Open in new tab"
                >
                  <ExternalLink className="w-3 h-3" />
                </a>
                <button
                  onClick={clear}
                  className="px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-rose-500/10 text-rose-300 border border-rose-500/30 hover:bg-rose-500/20 cursor-pointer flex items-center gap-1"
                  title="Remove link"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </>
            )}
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
