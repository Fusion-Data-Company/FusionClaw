"use client";

const SUGGESTIONS = [
  {
    label: "Blog Post",
    prompt:
      "I need to create a comprehensive blog post. Let's start the intake process.",
    icon: "📝",
    desc: "Full SEO-optimized article",
  },
  {
    label: "Content Suite",
    prompt:
      "I want a complete content suite — blog post plus all social media variants. Let's begin.",
    icon: "📦",
    desc: "Blog + all social platforms",
  },
  {
    label: "Social Campaign",
    prompt:
      "I need a social media campaign across multiple platforms. Help me plan it.",
    icon: "📣",
    desc: "Multi-platform social content",
  },
  {
    label: "SEO Analysis",
    prompt:
      "I have a topic I want to rank for. Help me research keywords and plan content strategy.",
    icon: "🔍",
    desc: "Keywords & strategy planning",
  },
  {
    label: "Blog + Infographic",
    prompt:
      "I want a blog post with a bright, modern infographic and hero image auto-generated. Let's start the intake.",
    icon: "🎨",
    desc: "Article with AI-generated visuals",
  },
  {
    label: "Generate Image",
    prompt:
      "I need a custom image or infographic generated. Let me describe what I need and the style I want.",
    icon: "🖼️",
    desc: "Custom AI image generation",
  },
];

interface SuggestionChipsProps {
  onSelect: (prompt: string) => void;
}

export function SuggestionChips({ onSelect }: SuggestionChipsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 max-w-lg mx-auto">
      {SUGGESTIONS.map((s) => (
        <button
          key={s.label}
          onClick={() => onSelect(s.prompt)}
          className="flex flex-col items-start gap-1 p-4 rounded-xl bg-surface border border-border text-left hover:border-accent/40 hover:bg-accent/5 transition-all duration-200 group"
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">{s.icon}</span>
            <span className="text-sm font-medium text-text-primary group-hover:text-accent transition-colors">
              {s.label}
            </span>
          </div>
          <span className="text-[11px] text-text-muted">{s.desc}</span>
        </button>
      ))}
    </div>
  );
}
