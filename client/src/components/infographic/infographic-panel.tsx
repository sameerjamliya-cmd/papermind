"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import {
  Noto_Sans,
  Noto_Sans_Devanagari,
  Noto_Sans_Tamil,
  Noto_Sans_Telugu,
  Noto_Sans_Kannada,
  Noto_Sans_Malayalam,
  Noto_Sans_Gujarati,
  Noto_Sans_Bengali,
  Noto_Sans_Gurmukhi,
} from "next/font/google";
import {
  useDeleteInfographic,
  useGenerateInfographic,
  useInfographics,
  usePollInfographic,
} from "@/hooks/use-infographic";
import { getLanguageMeta, INFOGRAPHIC_LANGUAGES } from "@/lib/infographic-languages";
import { StyleSelector } from "./style-selector";
import { InfographicRenderer } from "./infographic-renderer";
import { InfographicActions } from "./infographic-actions";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  BarChart3,
  Loader2,
  Trash2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  GenerateInfographicInput,
  Infographic,
  InfographicLanguage,
  InfographicStyleId,
} from "@/lib/types";

const notoLatin = Noto_Sans({ weight: ["400", "500", "600", "700"], subsets: ["latin"] });
const notoDevanagari = Noto_Sans_Devanagari({ weight: ["400", "500", "600", "700"], subsets: ["devanagari"] });
const notoTamil = Noto_Sans_Tamil({ weight: ["400", "500", "600", "700"], subsets: ["tamil"] });
const notoTelugu = Noto_Sans_Telugu({ weight: ["400", "500", "600", "700"], subsets: ["telugu"] });
const notoKannada = Noto_Sans_Kannada({ weight: ["400", "500", "600", "700"], subsets: ["kannada"] });
const notoMalayalam = Noto_Sans_Malayalam({ weight: ["400", "500", "600", "700"], subsets: ["malayalam"] });
const notoGujarati = Noto_Sans_Gujarati({ weight: ["400", "500", "600", "700"], subsets: ["gujarati"] });
const notoBengali = Noto_Sans_Bengali({ weight: ["400", "500", "600", "700"], subsets: ["bengali"] });
const notoGurmukhi = Noto_Sans_Gurmukhi({ weight: ["400", "500", "600", "700"], subsets: ["gurmukhi"] });

const noto = {
  latin: notoLatin,
  devanagari: notoDevanagari,
  tamil: notoTamil,
  telugu: notoTelugu,
  kannada: notoKannada,
  malayalam: notoMalayalam,
  gujarati: notoGujarati,
  bengali: notoBengali,
  gurmukhi: notoGurmukhi,
} as const;

const GENERATION_STAGES = [
  "Retrieving from your sources...",
  "Planning the layout...",
  "Designing visuals...",
  "Rendering content...",
  "Finalizing...",
];

export function InfographicPanel() {
  const { id: workspaceId } = useParams<{ id: string }>();
  const { data: listData, isLoading: listsLoading } =
    useInfographics(workspaceId);
  const generateMutation = useGenerateInfographic(workspaceId);
  const deleteMutation = useDeleteInfographic(workspaceId);

  const [language, setLanguage] = useState<InfographicLanguage>("en");
  const [styleId, setStyleId] = useState<InfographicStyleId>("modern");
  const [prompt, setPrompt] = useState("");
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [activeInfographic, setActiveInfographic] = useState<Infographic | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSources, setShowSources] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [stageIndex, setStageIndex] = useState(0);

  const rendererRef = useRef<HTMLDivElement>(null);

  const pollData = usePollInfographic(workspaceId, generatingId);
  const polled = pollData.data?.data;

  const pollReady = polled?.status === "ready";
  const pollFailed = polled?.status === "failed";
  const current = pollReady && polled ? polled : activeInfographic;
  const displayContent = current?.content ?? null;
  const isGenerating = !!generatingId && !pollReady && !pollFailed;
  const failedMessage = pollFailed
    ? polled?.errorMessage || "Failed to generate the infographic"
    : error;

  useEffect(() => {
    if (!generatingId) return;
    const timer = setInterval(() => {
      setStageIndex((i) => (i + 1) % GENERATION_STAGES.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [generatingId]);

  const runGeneration = (input: GenerateInfographicInput) => {
    setError(null);
    generateMutation.mutate(input, {
      onSuccess: (data) => {
        setStageIndex(0);
        setGeneratingId(data.data.id);
      },
      onError: (err: Error) => {
        setError(err.message || "Failed to start generation");
      },
    });
  };

  const handleGenerate = () => {
    runGeneration({ styleId, language, prompt: prompt.trim() || undefined });
  };

  const handleRegenerate = () => {
    if (!activeInfographic) return;
    const config = activeInfographic.config;
    runGeneration({
      styleId: config.styleId,
      language: config.language as InfographicLanguage,
      prompt: config.prompt || undefined,
      regenerate: true,
    });
  };

  const handleView = (infographic: Infographic) => {
    setError(null);
    setActiveInfographic(infographic);
    setGeneratingId(null);
  };

  const handleDelete = (infographic: Infographic) => {
    deleteMutation.mutate(infographic.id);
  };

  const fontClass = current
    ? noto[
        getLanguageMeta(
          current.config.language as InfographicLanguage
        ).fontScript as keyof typeof noto
      ].className
    : noto.latin.className;

  if (isGenerating && !displayContent) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-col items-center gap-4 rounded-xl border border-border bg-card p-8">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
        <div className="text-center">
          <p className="text-sm font-medium text-foreground">
            Generating your infographic
          </p>
          <p className="mt-1 animate-pulse text-xs text-muted-foreground">
            {GENERATION_STAGES[stageIndex]}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-1">
      {failedMessage && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          <AlertCircle className="size-3.5 shrink-0" />
          {failedMessage}
        </div>
      )}

      {displayContent && current ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                <BarChart3 className="size-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {getLanguageMeta(
                    current.config.language as InfographicLanguage
                  ).label}{" "}
                  infographic
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {current.content?.sections.length ?? 0} sections ·{" "}
                  {new Date(current.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setActiveInfographic(null);
                setGeneratingId(null);
              }}
            >
              <X className="mr-1.5 size-3.5" />
              Close
            </Button>
          </div>

          <InfographicActions
            title={current.content?.title ?? "infographic"}
            getNode={() => rendererRef.current}
            onFullscreen={() => setFullscreen(true)}
            onViewSources={() => setShowSources(true)}
            onRegenerate={handleRegenerate}
            isRegenerating={isGenerating}
          />

          <div
            ref={rendererRef}
            className="overflow-hidden rounded-xl border border-border"
          >
            <InfographicRenderer
              content={current.content!}
              styleId={current.config.styleId}
              fontClass={fontClass}
            />
          </div>
        </>
      ) : (
        <>
          <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-foreground">
                Language
              </label>
              <select
                value={language}
                onChange={(e) =>
                  setLanguage(e.target.value as InfographicLanguage)
                }
                disabled={isGenerating}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                {INFOGRAPHIC_LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.nativeName} · {lang.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-foreground">
                Visual style
              </label>
              <StyleSelector value={styleId} onChange={setStyleId} disabled={isGenerating} />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-foreground">
                Focus{" "}
                <span className="text-muted-foreground">(optional)</span>
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value.slice(0, 500))}
                disabled={isGenerating}
                placeholder="Tell PaperMind what you want to visualize... e.g. Focus on the memory hierarchy"
                rows={2}
                className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>

            <Button onClick={handleGenerate} disabled={isGenerating}>
              {isGenerating ? (
                <Loader2 className="mr-1.5 size-4 animate-spin" />
              ) : (
                <BarChart3 className="mr-1.5 size-4" />
              )}
              Generate infographic
            </Button>
          </div>

          {listsLoading ? (
            <div className="flex items-center justify-center rounded-xl border border-border bg-card p-8">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : (listData?.data?.length ?? 0) > 0 ? (
            <div className="flex flex-col gap-3">
              <p className="text-xs font-medium text-foreground">Previous</p>
              {listData!.data.map((infographic) => (
                <div
                  key={infographic.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-4"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {infographic.content?.title ??
                        getLanguageMeta(
                          infographic.config.language as InfographicLanguage
                        ).label}
                    </p>
                    <p className="mt-0.5 text-[10px] text-muted-foreground">
                      {infographic.status === "ready"
                        ? `Ready · ${new Date(infographic.createdAt).toLocaleDateString()}`
                        : infographic.status === "failed"
                          ? "Failed"
                          : "Generating..."}
                    </p>
                    {infographic.status === "failed" && infographic.errorMessage && (
                      <p className="mt-0.5 line-clamp-1 text-[10px] text-destructive">
                        {infographic.errorMessage}
                      </p>
                    )}
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    {infographic.status === "ready" && infographic.content ? (
                      <Button size="sm" onClick={() => handleView(infographic)}>
                        View
                      </Button>
                    ) : infographic.status === "failed" ? (
                      <span className="flex items-center text-destructive">
                        <AlertCircle className="size-4" />
                      </span>
                    ) : (
                      <Loader2 className="size-4 animate-spin text-muted-foreground" />
                    )}
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      aria-label="Delete infographic"
                      onClick={() => handleDelete(infographic)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="size-3.5 text-muted-foreground" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-card/30 py-10">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <BarChart3 className="size-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">
                No infographics yet
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Pick a language and style above to get started.
              </p>
            </div>
          )}
        </>
      )}

      {showSources && current?.content && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowSources(false)}
        >
          <div
            className="flex max-h-[80vh] w-full max-w-lg flex-col gap-3 overflow-hidden rounded-xl border border-border bg-background p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-foreground">Sources</p>
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label="Close"
                onClick={() => setShowSources(false)}
              >
                <X className="size-4" />
              </Button>
            </div>
            <div className="min-h-0 flex-1 space-y-4 overflow-auto">
              {current.content.sections.map((section) => (
                <div key={section.id} className="space-y-1.5">
                  <p className="text-xs font-semibold text-foreground">
                    {section.title}
                  </p>
                  {section.sourceRefs.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No direct refs</p>
                  ) : (
                    section.sourceRefs.map((ref, i) => (
                      <div
                        key={i}
                        className="rounded-md bg-muted/60 px-3 py-2"
                      >
                        <p className="text-[10px] font-medium text-muted-foreground">
                          {ref.sourceTitle} · {ref.chunkId}
                        </p>
                        <p className="mt-0.5 line-clamp-2 text-xs text-foreground">
                          “{ref.snippet}”
                        </p>
                      </div>
                    ))
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {fullscreen && current?.content && (
        <div className="fixed inset-0 z-50 overflow-auto bg-black/60 p-4 sm:p-8">
          <div className="mx-auto flex max-w-4xl flex-col gap-3">
            <div className="flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFullscreen(false)}
                className="text-white hover:bg-white/10 hover:text-white"
              >
                <X className="mr-1.5 size-4" />
                Exit
              </Button>
            </div>
            <div
              className={cn(
                "overflow-hidden rounded-xl border border-border",
                fontClass
              )}
            >
              <InfographicRenderer
                content={current.content}
                styleId={current.config.styleId}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}