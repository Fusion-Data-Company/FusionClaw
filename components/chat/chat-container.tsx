"use client";

import { useChat } from "@/hooks/use-chat";
import type { ChatMessage, GeneratedContent, GeneratedImage as DBGeneratedImage } from "@/hooks/use-chat";
import { MessageList } from "./message-list";
import { ChatInput } from "./chat-input";
import { SuggestionChips } from "./suggestion-chips";
import { OutputPanel } from "@/components/output/output-panel";
import { PanelResizer } from "@/components/layout/panel-resizer";
import {
  hasSectionMarkers,
  parseAllSections,
  hasImagePrompts,
  extractImagePrompts,
  extractSection,
} from "@/lib/content/parser";
import { useEffect, useState, useRef, useCallback } from "react";
import Image from "next/image";
import { PanelRight, PanelRightClose } from "lucide-react";

export interface GeneratedImage {
  url: string;
  width: number;
  height: number;
  type: string;
  prompt: string;
}

interface ChatContainerProps {
  projectId: string;
  initialMessages: ChatMessage[];
  projectTitle: string;
  initialContent?: GeneratedContent | null;
  initialImages?: DBGeneratedImage[];
}

export function ChatContainer({
  projectId,
  initialMessages,
  projectTitle,
  initialContent,
  initialImages,
}: ChatContainerProps) {
  const chat = useChat({ projectId, initialMessages });
  const [outputVisible, setOutputVisible] = useState(
    !!(initialContent || (initialImages && initialImages.length > 0))
  );
  const [outputWidth, setOutputWidth] = useState(440);
  const [parsedSections, setParsedSections] = useState<Record<string, string>>(
    () => {
      // Initialize from saved content + messages
      const sections: Record<string, string> = {};

      // First try to restore from the last assistant message (has all section markers)
      const lastAssistant = initialMessages
        .filter((m) => m.role === "assistant")
        .pop();
      if (lastAssistant && hasSectionMarkers(lastAssistant.content)) {
        Object.assign(sections, parseAllSections(lastAssistant.content));
      }

      // If we have saved content but no parsed blog section, use the saved one
      if (!sections.blog && initialContent?.contentMarkdown) {
        sections.blog = initialContent.contentMarkdown;
      } else if (!sections.blog && initialContent?.contentHtml) {
        sections.blog = initialContent.contentHtml;
      }

      return sections;
    }
  );
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>(
    () => {
      // Initialize from saved images
      if (initialImages && initialImages.length > 0) {
        return initialImages.map((img) => ({
          url: img.imageUrl,
          width: img.dimensions ? parseInt(img.dimensions.split("x")[0]) || 1024 : 1024,
          height: img.dimensions ? parseInt(img.dimensions.split("x")[1]) || 1024 : 1024,
          type: img.imageType || "custom",
          prompt: img.generationPrompt || "",
        }));
      }
      return [];
    }
  );
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);
  const [infographicImage, setInfographicImage] = useState<GeneratedImage | null>(
    () => {
      if (initialImages) {
        const inf = initialImages.find((img) => img.imageType === "infographic");
        if (inf) {
          return {
            url: inf.imageUrl,
            width: inf.dimensions ? parseInt(inf.dimensions.split("x")[0]) || 1024 : 1024,
            height: inf.dimensions ? parseInt(inf.dimensions.split("x")[1]) || 1024 : 1024,
            type: "infographic",
            prompt: inf.generationPrompt || "",
          };
        }
      }
      return null;
    }
  );
  const [autoGenerateImages, setAutoGenerateImages] = useState(true);
  const [autoGenerateInfographic, setAutoGenerateInfographic] = useState(true);
  const [isGeneratingInfographic, setIsGeneratingInfographic] = useState(false);
  const [isHumanizing, setIsHumanizing] = useState(false);
  const lastContentRef = useRef(
    initialMessages.filter((m) => m.role === "assistant").pop()?.content || ""
  );
  const imagePromptsProcessedRef = useRef<Set<string>>(
    new Set(initialImages?.map((img) => img.generationPrompt || "").filter(Boolean))
  );
  const infographicProcessedRef = useRef<Set<string>>(
    (() => {
      const set = new Set<string>();
      if (initialImages?.some((img) => img.imageType === "infographic")) {
        const lastAssistant = initialMessages
          .filter((m) => m.role === "assistant")
          .pop();
        if (lastAssistant) {
          const blogContent = extractSection(lastAssistant.content, "blog");
          if (blogContent) set.add(blogContent.slice(0, 100));
        }
      }
      return set;
    })()
  );
  const humanizeProcessedRef = useRef<Set<string>>(
    (() => {
      const set = new Set<string>();
      if (initialContent?.isNaturalized) {
        const lastAssistant = initialMessages
          .filter((m) => m.role === "assistant")
          .pop();
        if (lastAssistant) {
          const blogContent = extractSection(lastAssistant.content, "blog");
          if (blogContent) set.add(blogContent.slice(0, 100));
        }
      }
      return set;
    })()
  );
  const contentSavedRef = useRef<string>(
    initialContent?.contentHtml?.slice(0, 100) || ""
  );

  // ── Load settings to gate auto-generation ──────────────
  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data.settings) {
          setAutoGenerateImages(data.settings.autoGenerateImages);
          setAutoGenerateInfographic(data.settings.autoGenerateInfographic);
        }
      })
      .catch(() => {});
  }, []);

  // ── Save content to DB ──────────────────────────────────
  const saveContentToDB = useCallback(
    async (sections: Record<string, string>) => {
      const blogContent = sections.blog;
      if (!blogContent || blogContent.length < 50) return;

      const contentKey = blogContent.slice(0, 100);
      if (contentSavedRef.current === contentKey) return;
      contentSavedRef.current = contentKey;

      try {
        await fetch(`/api/projects/${projectId}/content`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contentHtml: blogContent,
            contentMarkdown: blogContent,
          }),
        });
      } catch (err) {
        console.error("Failed to save content:", err);
      }
    },
    [projectId]
  );

  // ── Save images to DB ───────────────────────────────────
  const saveImagesToDB = useCallback(
    async (images: GeneratedImage[]) => {
      if (images.length === 0) return;

      try {
        await fetch(`/api/projects/${projectId}/images`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            images: images.map((img) => ({
              url: img.url,
              type: img.type,
              prompt: img.prompt,
              width: img.width,
              height: img.height,
            })),
          }),
        });
      } catch (err) {
        console.error("Failed to save images:", err);
      }
    },
    [projectId]
  );

  // Generate images from prompts
  const generateImagesFromPrompts = useCallback(
    async (content: string) => {
      const prompts = extractImagePrompts(content);
      if (prompts.length === 0) return;

      // Deduplicate - don't regenerate for the same prompts
      const newPrompts = prompts.filter(
        (p) => !imagePromptsProcessedRef.current.has(p.description)
      );
      if (newPrompts.length === 0) return;

      setIsGeneratingImages(true);
      setOutputVisible(true);

      const allNewImages: GeneratedImage[] = [];

      for (const prompt of newPrompts) {
        imagePromptsProcessedRef.current.add(prompt.description);

        try {
          const res = await fetch("/api/images/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              prompt: `${prompt.style}. ${prompt.description}`,
              aspectRatio: prompt.aspectRatio,
              resolution: "1K",
            }),
          });

          if (res.ok) {
            const data = await res.json();
            if (data.images && data.images.length > 0) {
              const newImages: GeneratedImage[] = data.images.map(
                (img: { url: string; width: number; height: number }) => ({
                  url: img.url,
                  width: img.width,
                  height: img.height,
                  type: prompt.type,
                  prompt: prompt.description,
                })
              );
              allNewImages.push(...newImages);
              setGeneratedImages((prev) => [...prev, ...newImages]);
            }
          }
        } catch (err) {
          console.error("Image generation failed:", err);
        }
      }

      // Persist all new images to DB
      if (allNewImages.length > 0) {
        saveImagesToDB(allNewImages);
      }

      setIsGeneratingImages(false);
    },
    [saveImagesToDB]
  );

  // Parse sections from the latest assistant message or streaming content
  useEffect(() => {
    const contentToCheck = chat.isStreaming
      ? chat.streamingContent
      : chat.messages.filter((m) => m.role === "assistant").pop()?.content ||
        "";

    if (contentToCheck && contentToCheck !== lastContentRef.current) {
      lastContentRef.current = contentToCheck;
      if (hasSectionMarkers(contentToCheck)) {
        const sections = parseAllSections(contentToCheck);
        setParsedSections(sections);
        if (!outputVisible && Object.keys(sections).length > 0) {
          setOutputVisible(true);
        }

        // Save to DB when streaming finishes (not during streaming)
        if (!chat.isStreaming && sections.blog) {
          saveContentToDB(sections);
        }
      }
    }
  }, [chat.messages, chat.streamingContent, chat.isStreaming, outputVisible, saveContentToDB]);

  // Auto-trigger image generation when streaming completes and content has image prompts
  useEffect(() => {
    if (!autoGenerateImages) return; // Respect settings toggle
    if (chat.isStreaming) return; // Wait for streaming to finish

    const lastAssistant = chat.messages
      .filter((m) => m.role === "assistant")
      .pop();
    if (!lastAssistant) return;

    if (hasImagePrompts(lastAssistant.content)) {
      generateImagesFromPrompts(lastAssistant.content);
    }
  }, [chat.isStreaming, chat.messages, generateImagesFromPrompts, autoGenerateImages]);

  // Phase 2: Auto-generate infographic by analyzing completed blog content
  useEffect(() => {
    if (!autoGenerateInfographic) return; // Respect settings toggle
    if (chat.isStreaming) return;

    const lastAssistant = chat.messages
      .filter((m) => m.role === "assistant")
      .pop();
    if (!lastAssistant) return;

    const blogContent = extractSection(lastAssistant.content, "blog");
    if (!blogContent || blogContent.length < 200) return;

    // Deduplicate using a hash of the first 100 chars
    const contentKey = blogContent.slice(0, 100);
    if (infographicProcessedRef.current.has(contentKey)) return;
    infographicProcessedRef.current.add(contentKey);

    const generateInfographic = async () => {
      setIsGeneratingInfographic(true);
      setOutputVisible(true);

      try {
        const res = await fetch("/api/infographic/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ blogContent }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.images?.length > 0) {
            const img = data.images[0];
            const infographic: GeneratedImage = {
              url: img.url,
              width: img.width,
              height: img.height,
              type: "infographic",
              prompt: data.analysis?.prompt || "Auto-generated infographic",
            };
            setInfographicImage(infographic);
            setGeneratedImages((prev) => [...prev, infographic]);

            // Persist infographic to DB
            saveImagesToDB([infographic]);
          }
        }
      } catch (err) {
        console.error("Infographic generation failed:", err);
      } finally {
        setIsGeneratingInfographic(false);
      }
    };

    generateInfographic();
  }, [chat.isStreaming, chat.messages, saveImagesToDB, autoGenerateInfographic]);

  // Phase 3: Auto-humanize content after blog is generated
  useEffect(() => {
    if (chat.isStreaming) return;
    if (isGeneratingImages || isGeneratingInfographic) return;

    const lastAssistant = chat.messages
      .filter((m) => m.role === "assistant")
      .pop();
    if (!lastAssistant) return;

    const blogContent = extractSection(lastAssistant.content, "blog");
    if (!blogContent || blogContent.length < 200) return;

    const contentKey = blogContent.slice(0, 100);
    if (humanizeProcessedRef.current.has(contentKey)) return;
    humanizeProcessedRef.current.add(contentKey);

    const humanize = async () => {
      setIsHumanizing(true);

      try {
        const res = await fetch("/api/humanize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ projectId, blogContent }),
        });

        if (!res.ok) throw new Error("Humanization request failed");

        const reader = res.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let accumulated = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6).trim();
            if (data === "[DONE]") continue;

            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                accumulated += parsed.content;
              }
            } catch {
              /* skip */
            }
          }
        }

        // Replace blog section with humanized content
        if (accumulated && accumulated.length > 50) {
          setParsedSections((prev) => ({ ...prev, blog: accumulated }));
        }
      } catch (err) {
        console.error("Humanization failed:", err);
      } finally {
        setIsHumanizing(false);
      }
    };

    humanize();
  }, [chat.isStreaming, chat.messages, isGeneratingImages, isGeneratingInfographic, projectId]);

  // Manual image generation trigger
  const handleGenerateImage = useCallback(async (prompt: string) => {
    setIsGeneratingImages(true);
    setOutputVisible(true);

    try {
      const res = await fetch("/api/images/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          aspectRatio: "16:9",
          resolution: "1K",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.images?.length > 0) {
          const newImages: GeneratedImage[] = data.images.map(
            (img: { url: string; width: number; height: number }) => ({
              url: img.url,
              width: img.width,
              height: img.height,
              type: "custom",
              prompt,
            })
          );
          setGeneratedImages((prev) => [...prev, ...newImages]);

          // Persist to DB
          saveImagesToDB(newImages);
        }
      }
    } catch (err) {
      console.error("Image generation failed:", err);
    } finally {
      setIsGeneratingImages(false);
    }
  }, [saveImagesToDB]);

  // Regenerate infographic on user request
  const handleRegenerateInfographic = useCallback(async () => {
    const lastAssistant = chat.messages
      .filter((m) => m.role === "assistant")
      .pop();
    if (!lastAssistant) return;

    const blogContent = extractSection(lastAssistant.content, "blog");
    if (!blogContent || blogContent.length < 200) return;

    setIsGeneratingInfographic(true);
    setOutputVisible(true);

    try {
      const res = await fetch("/api/infographic/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blogContent }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.images?.length > 0) {
          const img = data.images[0];
          const infographic: GeneratedImage = {
            url: img.url,
            width: img.width,
            height: img.height,
            type: "infographic",
            prompt: data.analysis?.prompt || "Regenerated infographic",
          };
          setInfographicImage(infographic);
          setGeneratedImages((prev) => [...prev, infographic]);
          saveImagesToDB([infographic]);
        }
      }
    } catch (err) {
      console.error("Infographic regeneration failed:", err);
    } finally {
      setIsGeneratingInfographic(false);
    }
  }, [chat.messages, saveImagesToDB]);

  const isEmpty = chat.messages.length === 0;

  return (
    <div className="h-full flex">
      {/* Chat Area */}
      <div className="flex-1 min-w-0 flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-border">
          <div>
            <h1 className="font-heading text-base font-semibold text-text-primary">
              {projectTitle}
            </h1>
            {(chat.isStreaming || isGeneratingImages || isGeneratingInfographic || isHumanizing) && (
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce [animation-delay:0ms]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce [animation-delay:150ms]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce [animation-delay:300ms]" />
                </div>
                <span className="text-xs text-accent">
                  {isHumanizing
                    ? "Humanizing content..."
                    : isGeneratingInfographic
                      ? "Analyzing content & generating infographic..."
                      : isGeneratingImages
                        ? "Generating images..."
                        : "Generating..."}
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {generatedImages.length > 0 && (
              <span className="text-xs text-accent bg-accent/10 px-2 py-1 rounded-md">
                {generatedImages.length} image
                {generatedImages.length !== 1 ? "s" : ""}
              </span>
            )}
            <button
              onClick={() => setOutputVisible(!outputVisible)}
              className="p-2 rounded-lg hover:bg-surface-2 text-text-dim hover:text-text-primary transition-colors"
              title={outputVisible ? "Hide output" : "Show output"}
            >
              {outputVisible ? (
                <PanelRightClose size={18} />
              ) : (
                <PanelRight size={18} />
              )}
            </button>
          </div>
        </div>

        {/* Messages or Empty State */}
        {isEmpty ? (
          <div className="flex-1 flex items-center justify-center px-6">
            <div className="text-center max-w-lg">
              <div className="rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-5 px-5 py-4">
                <Image
                  src="/logo.png"
                  alt="Marketing Strategy"
                  width={160}
                  height={46}
                  className="object-contain"
                />
              </div>
              <h2 className="font-heading text-2xl font-bold text-text-primary mb-2">
                What would you like to create?
              </h2>
              <p className="text-text-dim text-sm mb-6 leading-relaxed">
                Describe the content you need and I&apos;ll guide you through a
                strategic intake process, then generate publication-ready content
                with SEO optimization and custom images.
              </p>
              <SuggestionChips onSelect={chat.sendMessage} />
            </div>
          </div>
        ) : (
          <MessageList
            messages={chat.messages}
            isStreaming={chat.isStreaming}
            streamingContent={chat.streamingContent}
          />
        )}

        {/* Input */}
        <ChatInput
          onSend={chat.sendMessage}
          onStop={chat.stopStreaming}
          isStreaming={chat.isStreaming}
          attachments={chat.attachments}
          onAttach={chat.addAttachment}
          onRemoveAttachment={chat.removeAttachment}
        />
      </div>

      {/* Output Panel */}
      {outputVisible && (
        <>
          <PanelResizer
            onResize={(delta) =>
              setOutputWidth((w) => Math.max(320, Math.min(700, w - delta)))
            }
          />
          <div
            style={{ width: outputWidth }}
            className="flex-shrink-0 border-l border-border h-full overflow-hidden"
          >
            <OutputPanel
              sections={parsedSections}
              isStreaming={chat.isStreaming}
              isHumanizing={isHumanizing}
              images={generatedImages}
              isGeneratingImages={isGeneratingImages}
              onGenerateImage={handleGenerateImage}
              infographicImage={infographicImage}
              isGeneratingInfographic={isGeneratingInfographic}
              onRegenerateInfographic={handleRegenerateInfographic}
              onClose={() => setOutputVisible(false)}
            />
          </div>
        </>
      )}
    </div>
  );
}
