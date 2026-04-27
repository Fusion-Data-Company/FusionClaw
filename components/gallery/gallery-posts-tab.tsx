"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, FileText, ExternalLink, Copy } from "lucide-react";
import { marked } from "marked";
import DOMPurify from "dompurify";

interface GalleryContent {
  id: string;
  projectId: string;
  projectTitle: string | null;
  version: number;
  contentHtml: string;
  contentMarkdown: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  urlSlug: string | null;
  createdAt: string;
}

interface GalleryPostsTabProps {
  content: GalleryContent[];
}

// Group content by date (YYYY-MM-DD)
function groupByDate(items: GalleryContent[]) {
  const groups: Record<string, GalleryContent[]> = {};
  for (const item of items) {
    const date = new Date(item.createdAt).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    if (!groups[date]) groups[date] = [];
    groups[date].push(item);
  }
  return groups;
}

function getPostTitle(item: GalleryContent): string {
  if (item.metaTitle) return item.metaTitle;
  // Try to extract h1 from html
  const h1Match = item.contentHtml.match(/<h1[^>]*>(.*?)<\/h1>/i);
  if (h1Match) return h1Match[1].replace(/<[^>]*>/g, "");
  // Try first line of markdown
  if (item.contentMarkdown) {
    const firstLine = item.contentMarkdown.split("\n").find((l) => l.trim());
    if (firstLine) return firstLine.replace(/^#+\s*/, "").slice(0, 80);
  }
  return `Post v${item.version}`;
}

function getWordCount(html: string): number {
  const text = html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  return text.split(" ").filter(Boolean).length;
}

export function GalleryPostsTab({ content }: GalleryPostsTabProps) {
  const [expandedDates, setExpandedDates] = useState<Set<string>>(() => {
    // Auto-expand the first (most recent) date group
    const groups = groupByDate(content);
    const firstDate = Object.keys(groups)[0];
    return firstDate ? new Set([firstDate]) : new Set();
  });
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const groups = groupByDate(content);

  const toggleDate = (date: string) => {
    setExpandedDates((prev) => {
      const next = new Set(prev);
      if (next.has(date)) next.delete(date);
      else next.add(date);
      return next;
    });
  };

  const handleCopyHtml = async (item: GalleryContent) => {
    const html = item.contentMarkdown
      ? (marked.parse(item.contentMarkdown, { async: false }) as string)
      : item.contentHtml;
    await navigator.clipboard.writeText(html);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (content.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center px-6">
        <div className="w-16 h-16 rounded-2xl bg-surface-2 flex items-center justify-center mb-4">
          <FileText size={24} className="text-text-muted" />
        </div>
        <p className="text-text-primary text-sm font-medium mb-1">
          No posts yet
        </p>
        <p className="text-text-muted text-xs max-w-[300px]">
          Generated blog posts will appear here. Start a project and generate
          content to see it in your gallery.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-3">
      {Object.entries(groups).map(([date, items]) => {
        const isExpanded = expandedDates.has(date);
        return (
          <div
            key={date}
            className="rounded-xl border border-border overflow-hidden"
          >
            {/* Date header */}
            <button
              onClick={() => toggleDate(date)}
              className="w-full flex items-center justify-between px-4 py-3 bg-surface hover:bg-surface-2 transition-colors"
            >
              <div className="flex items-center gap-2">
                {isExpanded ? (
                  <ChevronDown size={16} className="text-accent" />
                ) : (
                  <ChevronRight size={16} className="text-text-muted" />
                )}
                <span className="text-sm font-medium text-text-primary">
                  {date}
                </span>
              </div>
              <span className="text-xs text-text-muted">
                {items.length} post{items.length !== 1 ? "s" : ""}
              </span>
            </button>

            {/* Posts list */}
            {isExpanded && (
              <div className="border-t border-border divide-y divide-border">
                {items.map((item) => {
                  const title = getPostTitle(item);
                  const words = getWordCount(item.contentHtml);
                  const isPostExpanded = expandedPost === item.id;

                  return (
                    <div key={item.id}>
                      {/* Post row */}
                      <button
                        onClick={() =>
                          setExpandedPost(isPostExpanded ? null : item.id)
                        }
                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-surface-2/50 transition-colors text-left"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-text-primary font-medium truncate">
                            {title}
                          </p>
                          <div className="flex items-center gap-3 mt-0.5">
                            {item.projectTitle && (
                              <span className="text-[10px] text-accent bg-accent/10 px-1.5 py-0.5 rounded">
                                {item.projectTitle}
                              </span>
                            )}
                            <span className="text-[10px] text-text-muted">
                              {words.toLocaleString()} words
                            </span>
                            <span className="text-[10px] text-text-muted">
                              v{item.version}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-3">
                          {isPostExpanded ? (
                            <ChevronDown size={14} className="text-text-muted" />
                          ) : (
                            <ChevronRight size={14} className="text-text-muted" />
                          )}
                        </div>
                      </button>

                      {/* Expanded content */}
                      {isPostExpanded && (
                        <div className="border-t border-border bg-bg">
                          {/* Toolbar */}
                          <div className="flex items-center gap-2 px-4 py-2 border-b border-border">
                            <button
                              onClick={() => handleCopyHtml(item)}
                              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-surface-2 border border-border text-text-dim hover:text-text-primary hover:border-border-hover transition-colors flex items-center gap-1.5"
                            >
                              <Copy size={12} />
                              {copiedId === item.id ? "Copied!" : "Copy HTML"}
                            </button>
                            <a
                              href={`/project/${item.projectId}`}
                              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-surface-2 border border-border text-text-dim hover:text-text-primary hover:border-border-hover transition-colors flex items-center gap-1.5"
                            >
                              <ExternalLink size={12} />
                              Open Project
                            </a>
                          </div>

                          {/* Preview */}
                          <div
                            className="prose prose-invert prose-sm max-w-none px-6 py-4 max-h-[500px] overflow-y-auto
                              prose-headings:font-heading prose-headings:text-text-primary
                              prose-p:text-text-dim prose-p:leading-relaxed
                              prose-a:text-accent prose-a:no-underline hover:prose-a:underline
                              prose-strong:text-text-primary
                              prose-li:text-text-dim"
                            dangerouslySetInnerHTML={{
                              // DOMPurify prevents XSS from AI-generated or user-supplied HTML
                              __html: DOMPurify.sanitize(
                                item.contentMarkdown
                                  ? (marked.parse(item.contentMarkdown, { async: false }) as string)
                                  : (item.contentHtml ?? "")
                              ),
                            }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
