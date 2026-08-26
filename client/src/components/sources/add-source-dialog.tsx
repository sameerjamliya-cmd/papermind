"use client";

import { useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import {
  Modal,
  ModalBody,
  ModalContent,
  useModal,
} from "@/components/ui/animated-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCreateSource } from "@/hooks/use-sources";
import { useAllWorkspaces } from "@/hooks/use-workspaces";
import { cn } from "@/lib/utils";
import {
  GlobeIcon,
  FileTextIcon,
  FileVideoIcon,
  SearchIcon,
  CodeXmlIcon,
  FileIcon,
  UploadIcon,
} from "lucide-react";

function TriggerButton({ children }: { children: React.ReactNode }) {
  const { setOpen } = useModal();
  return <span onClick={() => setOpen(true)}>{children}</span>;
}

interface AddSourceDialogProps {
  children: React.ReactNode;
}

export function AddSourceDialog({ children }: AddSourceDialogProps) {
  return (
    <Modal>
      <TriggerButton>{children}</TriggerButton>
      <AddSourceModalBody />
    </Modal>
  );
}

function AddSourceModalBody() {
  const { id: paramWorkspaceId } = useParams<{ id: string }>();
  const { data: workspacesData } = useAllWorkspaces();
  const [pickedWorkspaceId, setPickedWorkspaceId] = useState("");

  const workspaces = workspacesData?.data ?? [];
  const workspaceId = paramWorkspaceId ?? pickedWorkspaceId;
  const { mutate } = useCreateSource(workspaceId);
  const { setOpen } = useModal();

  const [submittingType, setSubmittingType] = useState<string | null>(null);
  const [successType, setSuccessType] = useState<string | null>(null);

  const [websiteUrl, setWebsiteUrl] = useState("");
  const [websiteTitle, setWebsiteTitle] = useState("");

  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [youtubeTitle, setYoutubeTitle] = useState("");

  const [textTitle, setTextTitle] = useState("");
  const [textContent, setTextContent] = useState("");

  const [markdownTitle, setMarkdownTitle] = useState("");
  const [markdownContent, setMarkdownContent] = useState("");

  const [pdfTitle, setPdfTitle] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchDepth, setSearchDepth] = useState<"basic" | "advanced">("basic");
  const [searchMaxResults, setSearchMaxResults] = useState(5);

  const resetSection = useCallback((type: string) => {
    switch (type) {
      case "website":
        setWebsiteUrl("");
        setWebsiteTitle("");
        break;
      case "youtube":
        setYoutubeUrl("");
        setYoutubeTitle("");
        break;
      case "text":
        setTextTitle("");
        setTextContent("");
        break;
      case "markdown":
        setMarkdownTitle("");
        setMarkdownContent("");
        break;
      case "pdf":
        setPdfTitle("");
        setPdfFile(null);
        break;
      case "websearch":
        setSearchQuery("");
        setSearchDepth("basic");
        setSearchMaxResults(5);
        break;
    }
  }, []);

  const handleSuccess = useCallback(
    (type: string) => {
      resetSection(type);
      setSuccessType(type);
      setTimeout(() => {
        setSuccessType(null);
        setOpen(false);
      }, 600);
    },
    [resetSection, setOpen]
  );

  return (
    <ModalBody className="md:max-w-[640px]">
      <ModalContent className="gap-6 p-6 md:p-8">
        <div>
          <h2 className="font-heading text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            Add Source
          </h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Choose a source type and fill in the details below
          </p>
        </div>

        {!paramWorkspaceId && (
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Workspace
            </label>
            <select
              value={pickedWorkspaceId}
              onChange={(e) => setPickedWorkspaceId(e.target.value)}
              className="h-9 rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            >
              <option value="" disabled>
                Select a workspace
              </option>
              {workspaces.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.title}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* PDF */}
          <SectionCard
            icon={FileIcon}
            label="PDF Document"
            description="Upload a PDF file"
            success={successType === "pdf"}
          >
            <input
              ref={pdfInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0] ?? null;
                setPdfFile(f);
                if (f && !pdfTitle) {
                  setPdfTitle(f.name.replace(/\.pdf$/i, ""));
                }
              }}
            />
            <div
              onClick={() => pdfInputRef.current?.click()}
              className={cn(
                "flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-zinc-300 px-3 py-3 text-xs text-zinc-500 transition-colors hover:border-zinc-400 dark:border-zinc-700 dark:hover:border-zinc-600",
                pdfFile && "border-green-400 text-green-600 dark:border-green-700"
              )}
            >
              {pdfFile ? (
                <span className="truncate">{pdfFile.name}</span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <UploadIcon className="size-3.5" />
                  Choose PDF file
                </span>
              )}
            </div>
            <Input
              placeholder="Document title (optional)"
              value={pdfTitle}
              onChange={(e) => setPdfTitle(e.target.value)}
            />
            <Button
              size="sm"
              disabled={!pdfFile || !workspaceId || submittingType !== null}
              onClick={() => {
                if (!pdfFile) return;
                setSubmittingType("pdf");
                const fd = new FormData();
                fd.append("type", "pdf");
                fd.append("title", pdfTitle.trim() || pdfFile.name.replace(/\.pdf$/i, ""));
                fd.append("file", pdfFile);
                mutate({ formData: fd }, {
                  onSuccess: () => {
                    setSubmittingType(null);
                    handleSuccess("pdf");
                  },
                  onError: () => setSubmittingType(null),
                });
              }}
            >
              {submittingType === "pdf" ? "Adding..." : "Add PDF"}
            </Button>
          </SectionCard>

          {/* Website */}
          <SectionCard
            icon={GlobeIcon}
            label="Website"
            description="Scrape a web page"
            success={successType === "website"}
          >
            <Input
              placeholder="https://example.com"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
            />
            <Input
              placeholder="Title (optional)"
              value={websiteTitle}
              onChange={(e) => setWebsiteTitle(e.target.value)}
            />
            <Button
              size="sm"
              disabled={!websiteUrl.trim() || !workspaceId || submittingType !== null}
              onClick={() => {
                if (!websiteUrl.trim()) return;
                setSubmittingType("website");
                mutate(
                  {
                    type: "website",
                    url: websiteUrl.trim(),
                    title: websiteTitle.trim() || undefined,
                  },
                  {
                    onSuccess: () => {
                      setSubmittingType(null);
                      handleSuccess("website");
                    },
                    onError: () => setSubmittingType(null),
                  }
                );
              }}
            >
              {submittingType === "website" ? "Adding..." : "Add Website"}
            </Button>
          </SectionCard>

          {/* YouTube */}
          <SectionCard
            icon={FileVideoIcon}
            label="YouTube"
            description="Add a YouTube video"
            success={successType === "youtube"}
          >
            <Input
              placeholder="https://youtube.com/watch?v=..."
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
            />
            <Input
              placeholder="Title (optional)"
              value={youtubeTitle}
              onChange={(e) => setYoutubeTitle(e.target.value)}
            />
            <Button
              size="sm"
              disabled={!youtubeUrl.trim() || !workspaceId || submittingType !== null}
              onClick={() => {
                if (!youtubeUrl.trim()) return;
                setSubmittingType("youtube");
                mutate(
                  {
                    type: "youtube",
                    url: youtubeUrl.trim(),
                    title: youtubeTitle.trim() || undefined,
                  },
                  {
                    onSuccess: () => {
                      setSubmittingType(null);
                      handleSuccess("youtube");
                    },
                    onError: () => setSubmittingType(null),
                  }
                );
              }}
            >
              {submittingType === "youtube" ? "Adding..." : "Add YouTube"}
            </Button>
          </SectionCard>

          {/* Text */}
          <SectionCard
            icon={FileTextIcon}
            label="Plain Text"
            description="Paste or write text"
            success={successType === "text"}
          >
            <Input
              placeholder="Title"
              value={textTitle}
              onChange={(e) => setTextTitle(e.target.value)}
            />
            <Textarea
              placeholder="Content"
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              rows={3}
            />
            <Button
              size="sm"
              disabled={!textTitle.trim() || !textContent.trim() || !workspaceId || submittingType !== null}
              onClick={() => {
                if (!textTitle.trim() || !textContent.trim()) return;
                setSubmittingType("text");
                mutate(
                  {
                    type: "text",
                    title: textTitle.trim(),
                    content: textContent.trim(),
                  },
                  {
                    onSuccess: () => {
                      setSubmittingType(null);
                      handleSuccess("text");
                    },
                    onError: () => setSubmittingType(null),
                  }
                );
              }}
            >
              {submittingType === "text" ? "Adding..." : "Add Text"}
            </Button>
          </SectionCard>

          {/* Markdown */}
          <SectionCard
            icon={CodeXmlIcon}
            label="Markdown"
            description="Paste markdown content"
            success={successType === "markdown"}
          >
            <Input
              placeholder="Title"
              value={markdownTitle}
              onChange={(e) => setMarkdownTitle(e.target.value)}
            />
            <Textarea
              placeholder="Markdown content"
              value={markdownContent}
              onChange={(e) => setMarkdownContent(e.target.value)}
              rows={3}
            />
            <Button
              size="sm"
              disabled={!markdownTitle.trim() || !markdownContent.trim() || !workspaceId || submittingType !== null}
              onClick={() => {
                if (!markdownTitle.trim() || !markdownContent.trim()) return;
                setSubmittingType("markdown");
                mutate(
                  {
                    type: "markdown",
                    title: markdownTitle.trim(),
                    content: markdownContent.trim(),
                  },
                  {
                    onSuccess: () => {
                      setSubmittingType(null);
                      handleSuccess("markdown");
                    },
                    onError: () => setSubmittingType(null),
                  }
                );
              }}
            >
              {submittingType === "markdown" ? "Adding..." : "Add Markdown"}
            </Button>
          </SectionCard>

          {/* Web Search */}
          <SectionCard
            icon={SearchIcon}
            label="Web Search"
            description="Search the web for content"
            success={successType === "websearch"}
          >
            <Input
              placeholder="Search query"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setSearchDepth("basic")}
                  className={cn(
                    "rounded-md border px-2 py-1 text-[10px] font-medium transition-colors",
                    searchDepth === "basic"
                      ? "border-zinc-400 bg-zinc-100 text-zinc-900 dark:border-zinc-500 dark:bg-zinc-800 dark:text-zinc-100"
                      : "border-zinc-200 text-zinc-500 hover:border-zinc-300 dark:border-zinc-700 dark:hover:border-zinc-600"
                  )}
                >
                  Basic
                </button>
                <button
                  type="button"
                  onClick={() => setSearchDepth("advanced")}
                  className={cn(
                    "rounded-md border px-2 py-1 text-[10px] font-medium transition-colors",
                    searchDepth === "advanced"
                      ? "border-zinc-400 bg-zinc-100 text-zinc-900 dark:border-zinc-500 dark:bg-zinc-800 dark:text-zinc-100"
                      : "border-zinc-200 text-zinc-500 hover:border-zinc-300 dark:border-zinc-700 dark:hover:border-zinc-600"
                  )}
                >
                  Advanced
                </button>
              </div>
              <label className="flex items-center gap-1.5 text-xs text-zinc-500">
                Results:
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={searchMaxResults}
                  onChange={(e) => setSearchMaxResults(Number(e.target.value))}
                  className="w-14"
                />
              </label>
            </div>
            <Button
              size="sm"
              disabled={!searchQuery.trim() || !workspaceId || submittingType !== null}
              onClick={() => {
                if (!searchQuery.trim()) return;
                setSubmittingType("websearch");
                mutate(
                  {
                    type: "websearch",
                    query: searchQuery.trim(),
                    searchDepth,
                    maxResults: searchMaxResults,
                  },
                  {
                    onSuccess: () => {
                      setSubmittingType(null);
                      handleSuccess("websearch");
                    },
                    onError: () => setSubmittingType(null),
                  }
                );
              }}
            >
              {submittingType === "websearch" ? "Adding..." : "Search & Add"}
            </Button>
          </SectionCard>
        </div>
      </ModalContent>
    </ModalBody>
  );
}

interface SectionCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
  success?: boolean;
  children: React.ReactNode;
}

function SectionCard({
  icon: Icon,
  label,
  description,
  success,
  children,
}: SectionCardProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2.5 rounded-lg border border-zinc-200 p-4 transition-colors dark:border-zinc-700",
        success && "border-green-400 bg-green-50/50 dark:border-green-700 dark:bg-green-950/20"
      )}
    >
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-md border border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800">
          <Icon className="size-3.5 text-zinc-500" />
        </div>
        <div>
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {label}
          </p>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
            {description}
          </p>
        </div>
      </div>

      {success ? (
        <p className="text-xs font-medium text-green-600 dark:text-green-400">
          Added successfully
        </p>
      ) : (
        <>{children}</>
      )}
    </div>
  );
}
