"use client";

import { useState, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import { useSources, useBulkDeleteSources } from "@/hooks/use-sources";
import { useSourceStore } from "@/stores/source-store";
import { SourceCard } from "./source-card";
import { AddSourceDialog } from "./add-source-dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
} from "@/components/ui/pagination";
import { cn } from "@/lib/utils";
import type { SourceType, SourceStatus } from "@/lib/types";
import {
  PlusIcon,
  TrashIcon,
  SearchIcon,
  InboxIcon,
  XIcon,
  LoaderIcon,
  AlertTriangleIcon,
  FilterIcon,
} from "lucide-react";

const TYPE_OPTIONS: { value: SourceType | "all"; label: string }[] = [
  { value: "all", label: "All types" },
  { value: "pdf", label: "PDF" },
  { value: "website", label: "Website" },
  { value: "youtube", label: "YouTube" },
  { value: "text", label: "Text" },
  { value: "markdown", label: "Markdown" },
  { value: "websearch", label: "Web Search" },
];

const STATUS_OPTIONS: { value: SourceStatus | "all"; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "processing", label: "Processing" },
  { value: "ready", label: "Ready" },
  { value: "error", label: "Error" },
];

export function SourceList() {
  const { id: workspaceId } = useParams<{ id: string }>();

  const {
    selectedIds,
    clearSelection,
    filterType,
    setFilterType,
    filterStatus,
    setFilterStatus,
    searchQuery,
    setSearchQuery,
  } = useSourceStore();

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState(searchQuery);

  const filters = useMemo(
    () => ({
      type: filterType,
      status: filterStatus,
      search: searchQuery,
    }),
    [filterType, filterStatus, searchQuery]
  );

  const { data, isLoading, isError, refetch } = useSources(workspaceId, page, filters);
  const bulkDelete = useBulkDeleteSources(workspaceId);

  const handleSearch = useCallback(() => {
    setSearchQuery(searchInput);
    setPage(1);
  }, [searchInput, setSearchQuery]);

  const handleClearSearch = useCallback(() => {
    setSearchInput("");
    setSearchQuery("");
    setFilterType("all");
    setFilterStatus("all");
    setPage(1);
  }, [setSearchQuery, setFilterType, setFilterStatus]);

  const handleBulkDelete = useCallback(() => {
    if (selectedIds.size === 0) return;
    bulkDelete.mutate(
      { sourceIds: Array.from(selectedIds) },
      { onSuccess: () => clearSelection() }
    );
  }, [selectedIds, bulkDelete, clearSelection]);

  const sources = data?.data ?? [];
  const pagination = data?.pagination;
  const hasSelection = selectedIds.size > 0;
  const hasFilters = searchQuery || filterType !== "all" || filterStatus !== "all";

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold tracking-tight text-foreground">Sources</h2>
          {pagination && (
            <p className="text-xs text-muted-foreground">
              {pagination.total} document{pagination.total === 1 ? "" : "s"}
            </p>
          )}
        </div>

        {hasSelection ? (
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">{selectedIds.size} selected</span>
            <Button variant="ghost" size="icon-xs" onClick={clearSelection} className="text-muted-foreground">
              <XIcon className="size-3.5" />
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDelete}
              disabled={bulkDelete.isPending}
            >
              <TrashIcon className="size-3.5" />
              Delete
            </Button>
          </div>
        ) : (
          <AddSourceDialog>
            <Button size="sm">
              <PlusIcon className="size-3.5" />
              Add source
            </Button>
          </AddSourceDialog>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <div className="relative">
          <SearchIcon className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search sources..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="h-8 bg-muted/40 pl-8 pr-8 text-xs placeholder:text-muted-foreground/60"
          />
          {searchInput && (
            <button
              onClick={() => setSearchInput("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <XIcon className="size-3.5" />
            </button>
          )}
        </div>

        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <FilterIcon className="size-3 text-muted-foreground" />
          <Select
            value={filterType}
            onValueChange={(v) => {
              setFilterType(v as SourceType | "all");
              setPage(1);
            }}
          >
            <SelectTrigger size="sm" className="h-7 w-full bg-muted/40 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TYPE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filterStatus}
            onValueChange={(v) => {
              setFilterStatus(v as SourceStatus | "all");
              setPage(1);
            }}
          >
            <SelectTrigger size="sm" className="h-7 w-full bg-muted/40 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {hasFilters && (
          <button
            onClick={handleClearSearch}
            className="self-start text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <LoaderIcon className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center gap-2 py-16">
          <AlertTriangleIcon className="size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Failed to load sources</p>
          <Button variant="ghost" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      ) : sources.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-card/30 py-14">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
            <InboxIcon className="size-5 text-muted-foreground" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-foreground">
              {hasFilters ? "No matches found" : "No sources yet"}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {hasFilters
                ? "Try adjusting your search or filters"
                : "Add your first source to start researching"}
            </p>
          </div>
          {!hasFilters && (
            <AddSourceDialog>
              <Button size="sm">
                <PlusIcon className="size-3.5" />
                Add source
              </Button>
            </AddSourceDialog>
          )}
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-2">
            {sources.map((source) => (
              <SourceCard key={source.id} source={source} />
            ))}
          </div>

          {pagination && pagination.totalPages > 1 && (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className={cn(page <= 1 && "pointer-events-none opacity-50")}
                  />
                </PaginationItem>
                <PaginationItem>
                  <span className="px-3 text-xs text-muted-foreground">
                    {pagination.page} / {pagination.totalPages}
                  </span>
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext
                    onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                    className={cn(
                      page >= pagination.totalPages && "pointer-events-none opacity-50"
                    )}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </>
      )}
    </div>
  );
}
