"use client";

import { useState, useRef, useCallback } from "react";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
}

export interface GeneratedContent {
  contentHtml: string | null;
  contentMarkdown: string | null;
  isNaturalized: boolean;
}

export interface GeneratedImage {
  id: string;
  imageUrl: string;
  imageType: string | null;
  generationPrompt: string | null;
  dimensions: string | null;
}

interface UseChatOptions {
  projectId: string;
  initialMessages?: ChatMessage[];
}

interface UseChatReturn {
  messages: ChatMessage[];
  isStreaming: boolean;
  streamingContent: string;
  sendMessage: (content: string) => void;
  stopStreaming: () => void;
  attachments: File[];
  addAttachment: (file: File) => void;
  removeAttachment: (index: number) => void;
}

export function useChat({ projectId, initialMessages = [] }: UseChatOptions): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (content: string) => {
      const userMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        role: "user",
        content,
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsStreaming(true);
      setStreamingContent("");

      const abortController = new AbortController();
      abortRef.current = abortController;

      try {
        const history = [...messages, userMessage].map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ projectId, messages: history }),
          signal: abortController.signal,
        });

        if (!res.ok) {
          throw new Error(`Chat API error: ${res.status}`);
        }

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
                setStreamingContent(accumulated);
              }
            } catch {
              /* skip unparseable chunks */
            }
          }
        }

        // Add completed assistant message
        const assistantMessage: ChatMessage = {
          id: `msg-${Date.now()}`,
          role: "assistant",
          content: accumulated,
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, assistantMessage]);

        // Persist messages to project
        try {
          await fetch(`/api/projects/${projectId}/messages`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userMessage: content,
              assistantMessage: accumulated,
            }),
          });
        } catch {
          /* non-critical — don't fail the chat */
        }
      } catch (err: any) {
        if (err.name === "AbortError") {
          // User stopped streaming — save partial content
          if (streamingContent) {
            const partialMessage: ChatMessage = {
              id: `msg-${Date.now()}`,
              role: "assistant",
              content: streamingContent,
              createdAt: new Date().toISOString(),
            };
            setMessages((prev) => [...prev, partialMessage]);
          }
        } else {
          console.error("Chat error:", err);
          const errorMessage: ChatMessage = {
            id: `msg-${Date.now()}`,
            role: "assistant",
            content: "Sorry, there was an error processing your request. Please try again.",
            createdAt: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, errorMessage]);
        }
      } finally {
        setIsStreaming(false);
        setStreamingContent("");
        abortRef.current = null;
      }
    },
    [messages, projectId, streamingContent]
  );

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const addAttachment = useCallback((file: File) => {
    setAttachments((prev) => [...prev, file]);
  }, []);

  const removeAttachment = useCallback((index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  }, []);

  return {
    messages,
    isStreaming,
    streamingContent,
    sendMessage,
    stopStreaming,
    attachments,
    addAttachment,
    removeAttachment,
  };
}
