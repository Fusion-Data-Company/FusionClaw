"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { GlassCard } from "@/components/primitives";
import { Send, Square, Bot, User, Copy, Check, Sparkles } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
}

const SUGGESTIONS = [
  { label: "Blog Post", prompt: "I need a comprehensive blog post. Let's start the intake process.", desc: "Full SEO-optimized article" },
  { label: "Content Suite", prompt: "I want a complete content suite — blog post plus all social media variants.", desc: "Blog + all social platforms" },
  { label: "Social Campaign", prompt: "I need a social media campaign across multiple platforms. Help me plan it.", desc: "Multi-platform social content" },
  { label: "SEO Analysis", prompt: "I have a topic I want to rank for. Help me research keywords and plan content strategy.", desc: "Keywords & strategy planning" },
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamingContent]);

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isStreaming) return;

    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: trimmed, createdAt: new Date() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setIsStreaming(true);
    setStreamingContent("");

    if (textareaRef.current) textareaRef.current.style.height = "auto";

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
        signal: controller.signal,
      });

      if (!res.ok) throw new Error("Chat request failed");

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
            // API returns { content: delta } directly
            const delta = parsed.content;
            if (delta) {
              accumulated += delta;
              setStreamingContent(accumulated);
            }
          } catch {
            /* skip malformed chunks */
          }
        }
      }

      if (accumulated) {
        setMessages((prev) => [
          ...prev,
          { id: crypto.randomUUID(), role: "assistant", content: accumulated, createdAt: new Date() },
        ]);
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setMessages((prev) => [
          ...prev,
          { id: crypto.randomUUID(), role: "assistant", content: "Something went wrong. Please try again.", createdAt: new Date() },
        ]);
      }
    } finally {
      setIsStreaming(false);
      setStreamingContent("");
      abortRef.current = null;
    }
  }, [messages, isStreaming]);

  const stopStreaming = () => {
    abortRef.current?.abort();
    if (streamingContent) {
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "assistant", content: streamingContent, createdAt: new Date() },
      ]);
    }
    setIsStreaming(false);
    setStreamingContent("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const handleInput = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 200) + "px";
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
        {isEmpty ? (
          <div className="flex-1 flex items-center justify-center min-h-[60vh]">
            <div className="text-center max-w-lg">
              <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-5">
                <Sparkles className="w-8 h-8 text-accent" />
              </div>
              <h2 className="text-2xl font-bold text-text-primary mb-2" style={{ fontFamily: "var(--font-display)" }}>
                What would you like to create?
              </h2>
              <p className="text-sm text-text-muted mb-6 leading-relaxed">
                Describe the content you need and I&apos;ll generate publication-ready content with SEO optimization.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s.label}
                    onClick={() => sendMessage(s.prompt)}
                    className="flex flex-col items-start gap-1 p-4 rounded-xl bg-surface border border-border text-left hover:border-accent/40 hover:bg-accent/5 transition-all cursor-pointer"
                  >
                    <span className="text-sm font-medium text-text-primary">{s.label}</span>
                    <span className="text-[11px] text-text-muted">{s.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            {isStreaming && streamingContent && (
              <MessageBubble
                message={{ id: "streaming", role: "assistant", content: streamingContent, createdAt: new Date() }}
                isStreaming
              />
            )}
          </>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-border px-6 py-4">
        <div className="flex items-end gap-3 bg-surface border border-border rounded-2xl px-4 py-3 focus-within:border-accent/30 transition-colors">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onInput={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Describe the content you want to create..."
            rows={1}
            className="flex-1 bg-transparent text-text-primary placeholder:text-text-muted resize-none outline-none text-sm leading-relaxed max-h-[200px]"
          />
          {isStreaming ? (
            <button
              onClick={stopStreaming}
              className="p-2 rounded-lg bg-error/20 text-error hover:bg-error/30 transition-colors shrink-0 cursor-pointer"
            >
              <Square className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim()}
              className="p-2 rounded-lg bg-accent text-bg hover:bg-accent/90 transition-colors disabled:opacity-30 disabled:cursor-not-allowed shrink-0 cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          )}
        </div>
        <p className="text-text-muted text-[11px] mt-2 text-center">
          Enter to send &middot; Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}

function MessageBubble({ message, isStreaming }: { message: Message; isStreaming?: boolean }) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="shrink-0 w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center mr-3 mt-1">
          <Bot className="w-4 h-4 text-accent" />
        </div>
      )}
      <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${isUser ? "bg-accent/10 border border-accent/20" : "bg-glass border border-border"}`}>
        <p className="text-sm leading-relaxed text-text-primary whitespace-pre-wrap">{message.content}</p>
        {isStreaming && <span className="inline-block w-2 h-4 bg-accent ml-0.5 animate-pulse" />}
        <div className="flex items-center justify-between mt-2 pt-1.5">
          <span className="text-[10px] text-text-muted">
            {message.createdAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
          {!isUser && !isStreaming && message.content && (
            <button onClick={handleCopy} className="p-1 rounded text-text-muted hover:text-accent transition-colors cursor-pointer">
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            </button>
          )}
        </div>
      </div>
      {isUser && (
        <div className="shrink-0 w-8 h-8 rounded-lg bg-surface border border-border flex items-center justify-center ml-3 mt-1">
          <User className="w-4 h-4 text-text-muted" />
        </div>
      )}
    </div>
  );
}
