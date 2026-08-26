"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useWorkspace } from "@/hooks/use-workspaces";
import { SourceList } from "@/components/sources/source-list";
import { ChatPanel } from "@/components/chat/chat-panel";
import { AudioOverviewPanel } from "@/components/audio/audio-overview-panel";
import { QuizPanel } from "@/components/quiz/quiz-panel";
import { FlashcardsPanel } from "@/components/flashcards/flashcards-panel";
import { InfographicPanel } from "@/components/infographic/infographic-panel";
import { Button } from "@/components/ui/button";
import {
  MessageSquare,
  Headphones,
  HelpCircle,
  Layers,
  BarChart3,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { value: "chat", label: "Chat", icon: MessageSquare },
  { value: "audio", label: "Audio", icon: Headphones },
  { value: "quiz", label: "Quiz", icon: HelpCircle },
  { value: "flashcards", label: "Flashcards", icon: Layers },
  { value: "infographic", label: "Infographic", icon: BarChart3 },
] as const;

type TabValue = (typeof TABS)[number]["value"];

export default function WorkspacePage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading } = useWorkspace(id);
  const [activeTab, setActiveTab] = useState<TabValue>("chat");
  const [mobileShowSources, setMobileShowSources] = useState(false);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">Workspace not found</p>
      </div>
    );
  }

  const workspace = data.data;

  const renderActiveTab = () => {
    if (activeTab === "chat") return <ChatPanel />;
    if (activeTab === "audio") return <AudioOverviewPanel />;
    if (activeTab === "quiz") return <QuizPanel />;
    if (activeTab === "flashcards") return <FlashcardsPanel />;
    return <InfographicPanel />;
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-3 md:px-6 md:py-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {workspace.icon && (
              <span className="text-lg">{workspace.icon}</span>
            )}
            <h1 className="truncate text-base font-semibold tracking-tight text-foreground md:text-lg">
              {workspace.title}
            </h1>
          </div>
          {workspace.description ? (
            <p className="mt-0.5 truncate text-[10px] text-muted-foreground md:text-xs">
              {workspace.description}
            </p>
          ) : (
            <p className="mt-0.5 text-[10px] text-muted-foreground md:text-xs">
              Research workspace
            </p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant="ghost"
            size="icon-xs"
            className="md:hidden"
            onClick={() => setMobileShowSources((v) => !v)}
            aria-label="Toggle sources"
          >
            {mobileShowSources ? (
              <PanelLeftClose className="size-4" />
            ) : (
              <PanelLeft className="size-4" />
            )}
          </Button>

          <nav className="hidden items-center gap-1 rounded-lg bg-muted p-1 sm:flex">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.value;
              return (
                <button
                  key={tab.value}
                  onClick={() => setActiveTab(tab.value)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-all",
                    isActive
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="size-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </nav>

          <nav className="flex items-center gap-1 rounded-lg bg-muted p-1 sm:hidden">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.value;
              return (
                <button
                  key={tab.value}
                  onClick={() => setActiveTab(tab.value)}
                  className={cn(
                    "flex items-center justify-center rounded-md p-1.5 text-xs font-medium transition-all",
                    isActive
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  aria-label={tab.label}
                >
                  <Icon className="size-4" />
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      <div className="relative min-h-0 flex-1 overflow-hidden">
        {/* Desktop layout */}
        <div className="hidden h-full min-h-0 grid-cols-[320px_minmax(0,1fr)] md:grid">
          <div className="h-full min-h-0 min-w-0 overflow-auto border-r border-border px-5 py-5">
            <SourceList />
          </div>
          <div className="h-full min-h-0 min-w-0 overflow-hidden">
            {renderActiveTab()}
          </div>
        </div>

        {/* Mobile layout */}
        <div className="flex h-full min-h-0 flex-col md:hidden">
          {mobileShowSources ? (
            <div className="flex h-full min-h-0 flex-col border-b border-border">
              <div className="flex items-center justify-between border-b border-border px-4 py-2">
                <span className="text-xs font-medium text-foreground">
                  Sources
                </span>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => setMobileShowSources(false)}
                >
                  <PanelLeftClose className="size-4" />
                </Button>
              </div>
              <div className="min-h-0 flex-1 overflow-auto px-4 py-4">
                <SourceList />
              </div>
            </div>
          ) : (
            <div className="h-full min-h-0 overflow-hidden px-4 py-4">
              {renderActiveTab()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
