"use client";

import { useParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSourceStore } from "@/stores/source-store";
import { useDeleteSource } from "@/hooks/use-sources";
import type { Source, SourceType, SourceStatus } from "@/lib/types";
import { formatDistanceToNow } from "date-fns";
import {
  MoreHorizontalIcon,
  GlobeIcon,
  FileTextIcon,
  FileVideoIcon,
  SearchIcon,
  CodeXmlIcon,
  FileIcon,
  PencilIcon,
  TrashIcon,
  HeadphonesIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const TYPE_ICONS: Record<SourceType, React.ComponentType<{ className?: string }>> = {
  pdf: FileIcon,
  website: GlobeIcon,
  youtube: FileVideoIcon,
  text: FileTextIcon,
  markdown: CodeXmlIcon,
  websearch: SearchIcon,
};

const TYPE_LABELS: Record<SourceType, string> = {
  pdf: "PDF",
  website: "Website",
  youtube: "YouTube",
  text: "Text",
  markdown: "Markdown",
  websearch: "Web Search",
};

const TYPE_STYLES: Record<SourceType, string> = {
  pdf: "bg-red-500/10 text-red-400 border-red-500/20",
  website: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  youtube: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  text: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  markdown: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  websearch: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

const STATUS_STYLES: Record<SourceStatus, string> = {
  pending: "bg-amber-400",
  processing: "bg-blue-400",
  ready: "bg-emerald-400",
  error: "bg-red-400",
};

const STATUS_LABELS: Record<SourceStatus, string> = {
  pending: "Pending",
  processing: "Processing",
  ready: "Ready",
  error: "Error",
};

interface SourceCardProps {
  source: Source;
  onEdit?: (source: Source) => void;
}

export function SourceCard({ source, onEdit }: SourceCardProps) {
  const { id: workspaceId } = useParams<{ id: string }>();
  const { toggleSelect, isSelected, clearSelection, activeSourceId, setActiveSourceId } = useSourceStore();
  const deleteSource = useDeleteSource(workspaceId);
  const selected = isSelected(source.id);
  const isActive = activeSourceId === source.id;
  const cardRef = useRef<HTMLDivElement>(null);
  const TypeIcon = TYPE_ICONS[source.type as SourceType];

  useEffect(() => {
    if (isActive && cardRef.current) {
      cardRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      const timeout = setTimeout(() => setActiveSourceId(null), 4000);
      return () => clearTimeout(timeout);
    }
  }, [isActive, setActiveSourceId]);

  return (
    <div
      ref={cardRef}
      className={cn(
        "group relative flex items-center gap-3 rounded-lg border border-transparent bg-card p-2.5 transition-all duration-200 hover:-translate-y-px hover:bg-muted/60 hover:shadow-sm",
        selected && "border-border bg-muted",
        isActive && "border-l-2 border-l-primary border-border bg-primary/5 pl-[calc(0.625rem-2px)]"
      )}
    >
      {isActive && (
        <div className="absolute -top-2 right-2 flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-medium text-primary-foreground shadow-sm">
          <HeadphonesIcon className="size-2.5" />
          Discussed
        </div>
      )}

      <Checkbox
        checked={selected}
        onCheckedChange={() => toggleSelect(source.id)}
        aria-label={`Select ${source.title}`}
        className="shrink-0"
      />

      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
        <TypeIcon className="size-4 text-muted-foreground" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium text-foreground">{source.title}</p>
        <div className="mt-0.5 flex items-center gap-2 text-[10px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <span className={cn("size-1.5 rounded-full", STATUS_STYLES[source.status as SourceStatus])} />
            {STATUS_LABELS[source.status as SourceStatus]}
          </span>
          <span>·</span>
          <span>{formatDistanceToNow(new Date(source.createdAt), { addSuffix: true })}</span>
          {source.chunkCount != null && (
            <>
              <span>·</span>
              <span>{source.chunkCount} chunks</span>
            </>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        <Badge
          variant="outline"
          className={cn("h-5 px-1.5 text-[10px] font-normal", TYPE_STYLES[source.type as SourceType])}
        >
          {TYPE_LABELS[source.type as SourceType]}
        </Badge>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant="ghost" size="icon-xs" className="text-muted-foreground hover:text-foreground" />}
          >
            <MoreHorizontalIcon className="size-3.5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => {
                clearSelection();
                onEdit?.(source);
              }}
              className="cursor-pointer"
            >
              <PencilIcon className="size-3.5" />
              Edit title
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={() => deleteSource.mutate(source.id)}
              disabled={deleteSource.isPending}
              className="cursor-pointer"
            >
              <TrashIcon className="size-3.5" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
