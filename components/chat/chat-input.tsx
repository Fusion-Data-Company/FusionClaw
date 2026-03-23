"use client";

import { useState, useRef, useCallback } from "react";
import { Send, Square, Paperclip, X } from "lucide-react";

interface ChatInputProps {
  onSend: (message: string) => void;
  onStop: () => void;
  isStreaming: boolean;
  attachments: File[];
  onAttach: (file: File) => void;
  onRemoveAttachment: (index: number) => void;
}

export function ChatInput({
  onSend,
  onStop,
  isStreaming,
  attachments,
  onAttach,
  onRemoveAttachment,
}: ChatInputProps) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;
    onSend(trimmed);
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [input, isStreaming, onSend]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInput = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 200) + "px";
  };

  return (
    <div className="border-t border-border px-6 py-4">
      {/* Attachments */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {attachments.map((file, i) => (
            <div
              key={i}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface border border-border text-xs"
            >
              <span className="text-text-dim truncate max-w-[150px]">
                {file.name}
              </span>
              <button
                onClick={() => onRemoveAttachment(i)}
                className="text-text-muted hover:text-danger transition-colors"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-end gap-3 bg-surface border border-border rounded-2xl px-4 py-3 focus-within:border-accent/50 transition-colors">
        {/* File upload */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="text-text-muted hover:text-accent transition-colors p-1 flex-shrink-0"
        >
          <Paperclip size={18} />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".pdf,.doc,.docx,.txt,.md,.csv,.png,.jpg,.jpeg,.webp,.svg"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onAttach(file);
            e.target.value = "";
          }}
        />

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          placeholder="Describe the content you want to create..."
          rows={1}
          className="flex-1 bg-transparent text-text-primary placeholder-text-muted resize-none outline-none text-sm leading-relaxed max-h-[200px]"
        />

        {/* Send / Stop */}
        {isStreaming ? (
          <button
            onClick={onStop}
            className="p-2 rounded-lg bg-danger/20 text-danger hover:bg-danger/30 transition-colors flex-shrink-0"
          >
            <Square size={16} />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={!input.trim()}
            className="p-2 rounded-lg bg-accent text-bg hover:bg-accent-hover transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0"
          >
            <Send size={16} />
          </button>
        )}
      </div>

      <p className="text-text-muted text-[11px] mt-2 text-center">
        Enter to send &middot; Shift+Enter for new line
      </p>
    </div>
  );
}
