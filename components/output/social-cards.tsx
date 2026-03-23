"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { PLATFORM_LIMITS } from "@/lib/content/parser";

const PLATFORM_META: Record<
  string,
  { name: string; icon: string; color: string }
> = {
  facebook: { name: "Facebook", icon: "f", color: "#1877F2" },
  linkedin: { name: "LinkedIn", icon: "in", color: "#0A66C2" },
  instagram: { name: "Instagram", icon: "📷", color: "#E1306C" },
  twitter: { name: "X / Twitter", icon: "𝕏", color: "#000000" },
  threads: { name: "Threads", icon: "@", color: "#FFFFFF" },
  pinterest: { name: "Pinterest", icon: "P", color: "#E60023" },
  reddit: { name: "Reddit", icon: "r/", color: "#FF4500" },
};

interface SocialCardsProps {
  sections: Record<string, string>;
}

export function SocialCards({ sections }: SocialCardsProps) {
  return (
    <div className="space-y-3">
      {Object.entries(sections)
        .filter(([key]) => key !== "blog" && PLATFORM_META[key])
        .map(([key, content]) => (
          <SocialCard key={key} platform={key} content={content} />
        ))}
    </div>
  );
}

function SocialCard({
  platform,
  content,
}: {
  platform: string;
  content: string;
}) {
  const [copied, setCopied] = useState(false);
  const meta = PLATFORM_META[platform];
  const limit = PLATFORM_LIMITS[platform] || 0;
  const isOver = content.length > limit;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl border border-border bg-bg overflow-hidden">
      {/* Card header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold text-white"
            style={{ backgroundColor: meta.color }}
          >
            {meta.icon}
          </div>
          <span className="text-xs font-medium text-text-primary">
            {meta.name}
          </span>
        </div>
        <button
          onClick={handleCopy}
          className="p-1 rounded text-text-muted hover:text-accent transition-colors"
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
        </button>
      </div>

      {/* Content */}
      <div className="px-3 py-2.5 max-h-32 overflow-y-auto">
        <p className="text-xs text-text-dim whitespace-pre-wrap leading-relaxed">
          {content}
        </p>
      </div>

      {/* Footer */}
      <div className="px-3 py-1.5 border-t border-border">
        <span
          className={`text-[10px] ${isOver ? "text-danger" : "text-text-muted"}`}
        >
          {content.length.toLocaleString()} / {limit.toLocaleString()}
        </span>
      </div>
    </div>
  );
}
