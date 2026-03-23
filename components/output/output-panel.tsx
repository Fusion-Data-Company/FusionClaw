"use client";

import { useState } from "react";
import { X, FileText, Share2, Eye, Code, Image, Loader2, Download, Check } from "lucide-react";
import { BlogPreview } from "./blog-preview";
import { SocialCards } from "./social-cards";
import { ImageGallery } from "./image-gallery";
import { InfographicBanner } from "./infographic-banner";
import { marked } from "marked";
import { wordCount, readTime } from "@/lib/utils";
import type { GeneratedImage } from "@/components/chat/chat-container";

interface OutputPanelProps {
  sections: Record<string, string>;
  isStreaming: boolean;
  isHumanizing?: boolean;
  images: GeneratedImage[];
  isGeneratingImages: boolean;
  onGenerateImage: (prompt: string) => void;
  infographicImage: GeneratedImage | null;
  isGeneratingInfographic: boolean;
  onRegenerateInfographic?: () => void;
  onClose: () => void;
}

type Tab = "blog" | "social" | "images";
type BlogView = "preview" | "markdown";

export function OutputPanel({
  sections,
  isStreaming,
  isHumanizing,
  images,
  isGeneratingImages,
  onGenerateImage,
  infographicImage,
  isGeneratingInfographic,
  onRegenerateInfographic,
  onClose,
}: OutputPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>("blog");
  const [blogView, setBlogView] = useState<BlogView>("preview");
  const [copiedFormat, setCopiedFormat] = useState<"html" | "markdown" | null>(null);

  const blogContent = sections.blog || "";
  const hasBlog = blogContent.length > 0;
  const hasSocial = Object.keys(sections).some((k) => k !== "blog");
  const hasImages = images.length > 0 || isGeneratingImages;

  const blogHtml = hasBlog
    ? (marked.parse(blogContent, { async: false }) as string)
    : "";
  const words = hasBlog ? wordCount(blogContent) : 0;
  const reading = hasBlog ? readTime(blogContent) : 0;

  const handleCopy = async (format: "html" | "markdown") => {
    try {
      const text = format === "html" ? blogHtml : blogContent;
      await navigator.clipboard.writeText(text);
      setCopiedFormat(format);
      setTimeout(() => setCopiedFormat(null), 2000);
    } catch {
      // Clipboard API may not be available in all contexts
    }
  };

  // Auto-switch to images tab when images start generating
  const effectiveTab =
    activeTab === "images" || (isGeneratingImages && images.length === 0 && !hasBlog)
      ? "images"
      : activeTab;

  return (
    <div className="h-full flex flex-col bg-surface">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab("blog")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              effectiveTab === "blog"
                ? "bg-accent/10 text-accent"
                : "text-text-dim hover:text-text-primary"
            }`}
          >
            <FileText size={14} className="inline mr-1.5" />
            Blog
          </button>
          <button
            onClick={() => setActiveTab("social")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              effectiveTab === "social"
                ? "bg-accent/10 text-accent"
                : "text-text-dim hover:text-text-primary"
            }`}
          >
            <Share2 size={14} className="inline mr-1.5" />
            Social
          </button>
          <button
            onClick={() => setActiveTab("images")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors relative ${
              effectiveTab === "images"
                ? "bg-accent/10 text-accent"
                : "text-text-dim hover:text-text-primary"
            }`}
          >
            <Image size={14} className="inline mr-1.5" />
            Images
            {(images.length > 0 || isGeneratingImages) && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-accent text-bg text-[10px] font-bold flex items-center justify-center">
                {isGeneratingImages ? (
                  <Loader2 size={10} className="animate-spin" />
                ) : (
                  images.length
                )}
              </span>
            )}
          </button>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-surface-2 text-text-muted hover:text-text-primary transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {effectiveTab === "blog" && (
          <div className="flex flex-col h-full">
            {/* Blog toolbar */}
            {hasBlog && (
              <div className="flex items-center justify-between px-4 py-2 border-b border-border text-xs">
                <div className="flex items-center gap-3 text-text-muted">
                  <span>{words.toLocaleString()} words</span>
                  <span>{reading} min read</span>
                  {isStreaming && (
                    <span className="text-accent">Streaming...</span>
                  )}
                  {isHumanizing && (
                    <span className="text-purple-400 flex items-center gap-1">
                      <Loader2 size={10} className="animate-spin" />
                      Humanizing...
                    </span>
                  )}
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => setBlogView("preview")}
                    className={`p-1.5 rounded ${
                      blogView === "preview"
                        ? "bg-accent/10 text-accent"
                        : "text-text-muted hover:text-text-primary"
                    }`}
                  >
                    <Eye size={14} />
                  </button>
                  <button
                    onClick={() => setBlogView("markdown")}
                    className={`p-1.5 rounded ${
                      blogView === "markdown"
                        ? "bg-accent/10 text-accent"
                        : "text-text-muted hover:text-text-primary"
                    }`}
                  >
                    <Code size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* Blog content */}
            {hasBlog ? (
              <>
                {blogView === "preview" ? (
                  <div className="flex-1 overflow-y-auto">
                    <InfographicBanner
                      image={infographicImage}
                      isGenerating={isGeneratingInfographic}
                      onRegenerate={onRegenerateInfographic}
                    />
                    <BlogPreview html={blogHtml} />
                  </div>
                ) : (
                  <pre className="p-4 text-xs text-text-dim font-mono whitespace-pre-wrap overflow-y-auto flex-1">
                    {blogContent}
                  </pre>
                )}

                {/* Copy bar */}
                <div className="flex gap-2 px-4 py-3 border-t border-border">
                  <button
                    onClick={() => handleCopy("html")}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-colors flex items-center justify-center gap-1.5 ${
                      copiedFormat === "html"
                        ? "bg-accent/10 border-accent/30 text-accent"
                        : "bg-surface-2 border-border text-text-dim hover:text-text-primary hover:border-border-hover"
                    }`}
                  >
                    {copiedFormat === "html" ? <><Check size={12} /> Copied!</> : "Copy HTML"}
                  </button>
                  <button
                    onClick={() => handleCopy("markdown")}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-colors flex items-center justify-center gap-1.5 ${
                      copiedFormat === "markdown"
                        ? "bg-accent/10 border-accent/30 text-accent"
                        : "bg-surface-2 border-border text-text-dim hover:text-text-primary hover:border-border-hover"
                    }`}
                  >
                    {copiedFormat === "markdown" ? <><Check size={12} /> Copied!</> : "Copy Markdown"}
                  </button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-center px-6">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-surface-2 flex items-center justify-center mx-auto mb-3">
                    <FileText size={20} className="text-text-muted" />
                  </div>
                  <p className="text-text-muted text-sm">
                    Blog content will appear here once the agent generates it.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {effectiveTab === "social" && (
          <div className="p-4">
            {hasSocial ? (
              <SocialCards sections={sections} />
            ) : (
              <div className="flex items-center justify-center text-center py-16">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-surface-2 flex items-center justify-center mx-auto mb-3">
                    <Share2 size={20} className="text-text-muted" />
                  </div>
                  <p className="text-text-muted text-sm">
                    Social posts will appear here after generation.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {effectiveTab === "images" && (
          <ImageGallery
            images={images}
            isGenerating={isGeneratingImages}
            onGenerateImage={onGenerateImage}
          />
        )}
      </div>
    </div>
  );
}
