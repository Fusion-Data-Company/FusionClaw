"use client";

import { useState } from "react";
import { Copy, Check, Brain } from "lucide-react";
import { marked } from "marked";
import DOMPurify from "dompurify";
import type { ChatMessage } from "@/hooks/use-chat";
import { formatDate } from "@/lib/utils";

interface MessageBubbleProps {
  message: ChatMessage;
  isStreaming?: boolean;
  index: number;
}

export function MessageBubble({
  message,
  isStreaming,
  index,
}: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderedHtml = !isUser
    ? DOMPurify.sanitize(marked.parse(message.content, { async: false }) as string)
    : "";

  return (
    <div
      className={`flex ${isUser ? "justify-end" : "justify-start"} animate-slide-up`}
      style={{ animationDelay: `${Math.min(index * 30, 150)}ms` }}
    >
      {/* Avatar for assistant */}
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center mr-3 mt-1">
          <Brain size={16} className="text-accent" />
        </div>
      )}

      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
          isUser
            ? "bg-accent/10 border border-accent/20"
            : "glass"
        }`}
      >
        {isUser ? (
          <p className="text-sm leading-relaxed text-text-primary whitespace-pre-wrap">
            {message.content}
          </p>
        ) : (
          <div
            className="markdown-output text-sm leading-relaxed"
            dangerouslySetInnerHTML={{ __html: renderedHtml }}
          />
        )}

        {/* Streaming cursor */}
        {isStreaming && (
          <span className="inline-block w-2 h-4 bg-accent ml-0.5 animate-pulse" />
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-2 pt-1.5">
          <span className="text-[10px] text-text-muted">
            {formatDate(message.createdAt)}
          </span>
          {!isUser && !isStreaming && message.content && (
            <button
              onClick={handleCopy}
              className="p-1 rounded text-text-muted hover:text-accent transition-colors"
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
