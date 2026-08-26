"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { FileText, Video, Link, Globe, Copy, Check, Sparkles } from "lucide-react";
import { TypingIndicator } from "./typing-indicator";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { ChatMessage, ChatSourceItem } from "@/lib/chat-types";
import { cn } from "@/lib/utils";

const sourceIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  pdf: FileText,
  text: FileText,
  youtube: Video,
  url: Link,
  website: Globe,
};

const defaultSourceIcon = FileText;

function sourceLabel(title?: string) {
  if (title && title.trim()) return title;
  return "Source unavailable";
}

function SourceBadge({ source }: { source: ChatSourceItem }) {
  const Icon = sourceIcons[source.sourceType] || defaultSourceIcon;
  const label = sourceLabel(source.sourceTitle);
  return (
    <Popover>
      <PopoverTrigger
        render={
          <button className="inline-flex max-w-[180px] items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-[10px] text-[#A1A1AA] transition-colors hover:bg-white/[0.07] hover:text-[#D4D4D8]">
            <Icon className="size-3 shrink-0 text-[#71717A]" />
            <span className="truncate">{label}</span>
          </button>
        }
      />
      <PopoverContent className="w-64 rounded-lg border border-white/[0.08] bg-[#17191D] p-3" align="start">
        <div className="flex items-start gap-2.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white/[0.05]">
            <Icon className="size-3.5 text-[#9CA3AF]" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-[#E5E7EB]">{label}</p>
            <p className="mt-0.5 text-[10px] capitalize text-[#9CA3AF]">{source.sourceType}</p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function CodeBlock({ children, className }: { children: React.ReactNode; className?: string }) {
  const [copied, setCopied] = useState(false);
  const raw = String(children).replace(/\n$/, "");
  const language = /language-(\w+)/.exec(className || "")?.[1];

  return (
    <div className="my-4 overflow-hidden rounded-xl border border-white/[0.07] bg-[#111316]">
      <div className="flex items-center justify-between border-b border-white/[0.07] px-3 py-1.5">
        <span className="text-[10px] font-medium uppercase tracking-wider text-[#71717A]">
          {language || "code"}
        </span>
        <button
          onClick={() => {
            navigator.clipboard.writeText(raw);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
          className="inline-flex items-center gap-1 text-[10px] text-[#9CA3AF] transition-colors hover:text-[#D4D4D8]"
        >
          {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto p-3 text-xs leading-relaxed">
        <code className={className}>{children}</code>
      </pre>
    </div>
  );
}

export function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);

  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      {isUser ? (
        <div className="max-w-[80%] rounded-[14px] border border-white/[0.06] bg-[#17191D] px-[18px] py-[12px] text-sm text-[#E5E7EB] shadow-none transition-colors hover:bg-[#181A1F]">
          <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
        </div>
      ) : (
        <div className="w-full max-w-[800px]">
          <div className="flex items-center gap-1.5 pb-2 text-xs text-[#9CA3AF]">
            <Sparkles className="size-3" />
            <span>PaperMind</span>
          </div>

          <div className="prose-ai">
            {message.content ? (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code: (props: { inline?: boolean; className?: string; children?: React.ReactNode }) =>
                    props.inline ? <code>{props.children}</code> : <CodeBlock className={props.className}>{props.children}</CodeBlock>,
                }}
              >
                {message.content}
              </ReactMarkdown>
            ) : null}
            {message.isStreaming && !message.content ? <TypingIndicator /> : null}
          </div>

          {(message.sources && message.sources.length > 0) || message.status ? (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {message.sources?.map((s) => <SourceBadge key={s.sourceId} source={s} />)}
              {message.status && (
                <span className="inline-flex items-center gap-1.5 text-xs text-[#9CA3AF] animate-pulse">
                  <span className="size-1.5 rounded-full bg-[#71717A]" />
                  {message.status}
                </span>
              )}
            </div>
          ) : null}

          {message.content && !message.isStreaming && (
            <div className="mt-3">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(message.content);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                }}
                className="inline-flex items-center gap-1 text-[10px] text-[#71717A] transition-colors hover:text-[#9CA3AF]"
              >
                {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
                {copied ? "Copied" : "Copy response"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
