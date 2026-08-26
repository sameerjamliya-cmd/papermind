"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { MessageBubble } from "./message-bubble";
import {
  type ChatEvent,
  type ChatMessage,
  stageStatusMap,
} from "@/lib/chat-types";
import { useChatMessages, useInvalidateChatMessages } from "@/hooks/use-chat";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Send, Sparkles, LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

const SUGGESTED_PROMPTS = [
  "Explain this simply",
  "Summarize the key concepts",
  "What are the main findings?",
  "Create study questions",
];

function parseEvent(line: string): ChatEvent | null {
  const trimmed = line.trim();
  if (!trimmed) return null;
  try {
    return JSON.parse(trimmed) as ChatEvent;
  } catch {
    return { type: "token", delta: trimmed };
  }
}

export function ChatPanel() {
  const { id: workspaceId } = useParams<{ id: string }>();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const { data: chatData } = useChatMessages(workspaceId);
  const invalidateChatMessages = useInvalidateChatMessages();

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (streaming || messages.length === 0) {
      scrollToBottom();
    }
  }, [messages, streaming, scrollToBottom]);

  useEffect(() => {
    if (chatData?.data && !hydrated) {
      setMessages(
        chatData.data.map((m) => ({
          id: m.id,
          role: m.role as "user" | "assistant",
          content: m.content,
        }))
      );
      setHydrated(true);
    }
  }, [chatData, hydrated]);

  const resizeTextarea = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, []);

  const handleSend = useCallback(
    async (text: string) => {
      const content = text.trim();
      if (!content || streaming) return;

      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        role: "user",
        content,
      };

      const assistantId = (Date.now() + 1).toString();
      const assistantMessage: ChatMessage = {
        id: assistantId,
        role: "assistant",
        content: "",
        status: stageStatusMap.memory,
        isStreaming: true,
      };

      setMessages((prev) => [...prev, userMessage, assistantMessage]);
      setInput("");
      setStreaming(true);
      resizeTextarea();

      try {
        const res = await fetch(
          `${API_URL}/api/workspaces/${workspaceId}/chat`,
          {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: userMessage.content }),
          }
        );

        if (!res.ok) throw new Error("Failed to send message");

        const reader = res.body?.getReader();
        if (!reader) throw new Error("No response body");

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            const event = parseEvent(line);
            if (!event) continue;

            setMessages((prev) => {
              const assistant = prev.find((m) => m.id === assistantId);
              if (!assistant) return prev;

              const others = prev.filter((m) => m.id !== assistantId);

              if (event.type === "token") {
                return [
                  ...others,
                  {
                    ...assistant,
                    content: assistant.content + event.delta,
                    status: undefined,
                  },
                ];
              }

              if (event.type === "progress" && event.status === "started") {
                return [
                  ...others,
                  {
                    ...assistant,
                    status: stageStatusMap[event.stage],
                  },
                ];
              }

              if (event.type === "progress" && event.status === "completed") {
                return [
                  ...others,
                  {
                    ...assistant,
                    status:
                      event.stage === "streaming"
                        ? undefined
                        : assistant.status,
                  },
                ];
              }

              if (event.type === "error") {
                return [
                  ...others,
                  {
                    ...assistant,
                    content: "Sorry, something went wrong. Please try again.",
                    status: undefined,
                    isStreaming: false,
                  },
                ];
              }

              if (event.type === "sources") {
                return [
                  ...others,
                  {
                    ...assistant,
                    sources: event.sources,
                  },
                ];
              }

              return prev;
            });
          }
        }
      } catch (error) {
        console.error("Chat error:", error);
        setMessages((prev) => {
          const assistant = prev.find((m) => m.id === assistantId);
          if (!assistant) {
            return [
              ...prev,
              {
                id: Date.now().toString(),
                role: "assistant",
                content: "Sorry, something went wrong. Please try again.",
              },
            ];
          }
          return prev.map((m) =>
            m.id === assistantId
              ? {
                  ...m,
                  content: "Sorry, something went wrong. Please try again.",
                  status: undefined,
                  isStreaming: false,
                }
              : m
          );
        });
      } finally {
        setStreaming(false);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, isStreaming: false, status: undefined } : m
          )
        );
        invalidateChatMessages(workspaceId);
      }
    },
    [streaming, workspaceId, resizeTextarea, invalidateChatMessages]
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      handleSend(input);
    },
    [input, handleSend]
  );

  const isEmpty = messages.length === 0;

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col">
      <div className="min-h-0 min-w-0 flex-1 overflow-y-auto px-6 py-6">
        {isEmpty ? (
          <div className="flex h-full flex-col items-center justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
              <Sparkles className="size-5 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-sm font-medium text-foreground">
              Ask anything about your sources
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              PaperMind will search your documents and answer with citations.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {SUGGESTED_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => handleSend(prompt)}
                  className="rounded-full border border-border bg-card px-3 py-1.5 text-xs text-foreground/80 transition-colors hover:bg-muted hover:text-foreground"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <div className="shrink-0 border-t border-border bg-background/80 px-6 py-4 backdrop-blur">
        {isEmpty && (
          <p className="mb-2 text-center text-[10px] text-muted-foreground">
            PaperMind may make mistakes. Verify important information.
          </p>
        )}
        <form onSubmit={handleSubmit} className="relative">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              resizeTextarea();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder="Ask about your sources..."
            disabled={streaming}
            rows={1}
            className="min-h-10 resize-none pr-12 py-3"
          />
          <Button
            type="submit"
            size="icon-xs"
            disabled={!input.trim() || streaming}
            className={cn(
              "absolute right-2 bottom-2 transition-opacity",
              !input.trim() && "opacity-50"
            )}
          >
            {streaming ? (
              <LoaderCircle className="size-3.5 animate-spin" />
            ) : (
              <Send className="size-3.5" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
