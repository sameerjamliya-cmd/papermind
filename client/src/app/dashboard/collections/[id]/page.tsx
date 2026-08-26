"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  useCollection,
  useDeleteCollection,
  useAddSourceToCollection,
  useRemoveSourceFromCollection,
} from "@/hooks/use-sidebar";
import { useAllWorkspaces } from "@/hooks/use-workspaces";
import { useAllSources } from "@/hooks/use-sidebar";
import { RenameCollectionDialog } from "@/components/create-collection-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  FolderOpen,
  Plus,
  Pencil,
  Trash2,
  X,
  ArrowLeft,
  ExternalLink,
} from "lucide-react";

export default function CollectionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data, isLoading } = useCollection(id);
  const { data: workspacesData } = useAllWorkspaces();
  const { data: allSources } = useAllSources();
  const deleteMutation = useDeleteCollection();
  const addSource = useAddSourceToCollection();
  const removeSource = useRemoveSourceFromCollection();

  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [pickedWorkspaceId, setPickedWorkspaceId] = useState("");
  const [pickedSourceId, setPickedSourceId] = useState("");

  const collection = data?.data;
  const workspaces = workspacesData?.data ?? [];
  const allSourcesList = allSources?.data ?? [];

  const candidates = pickedWorkspaceId
    ? allSourcesList.filter((s) => s.workspaceId === pickedWorkspaceId)
    : [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-600" />
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
        <FolderOpen className="h-10 w-10 text-zinc-300" />
        <h2 className="font-heading text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Collection not found
        </h2>
        <Link href="/dashboard/collections">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Back to collections
          </Button>
        </Link>
      </div>
    );
  }

  const entries = collection.sources;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 pt-5 pb-3">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/dashboard/collections"
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
            aria-label="Back to collections"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <span className="text-2xl">{collection.icon ?? "📁"}</span>
          <div className="min-w-0">
            <h2 className="truncate font-heading text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              {collection.name}
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {entries.length} source{entries.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setRenameOpen(true)}>
            <Pencil className="mr-1.5 h-4 w-4" />
            Rename
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-red-600 hover:text-red-700 dark:text-red-400"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="mr-1.5 h-4 w-4" />
            Delete
          </Button>
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            Add source
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
            <FolderOpen className="h-10 w-10 text-zinc-300" />
            <h3 className="font-heading text-base font-semibold text-zinc-900 dark:text-zinc-100">
              This collection is empty
            </h3>
            <p className="max-w-sm text-sm text-zinc-500 dark:text-zinc-400">
              Add sources from any of your workspaces to group related research
              together.
            </p>
            <Button size="sm" onClick={() => setAddOpen(true)}>
              <Plus className="mr-1.5 h-4 w-4" />
              Add source
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {entries.map(({ source }) => (
              <div
                key={source.id}
                className="group flex items-center gap-3 rounded-lg border border-zinc-200 p-3 transition-colors hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800">
                  <FolderOpen className="size-4 text-zinc-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {source.title}
                  </p>
                  <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                    {source.workspace.title} ·{" "}
                    {format(new Date(source.createdAt), "MMM d, yyyy")}
                  </p>
                </div>
                <Link
                  href={`/dashboard/workspace/${source.workspaceId}`}
                  className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                  aria-label="Open source workspace"
                >
                  <ExternalLink className="h-4 w-4" />
                </Link>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="text-zinc-400 hover:text-red-600 dark:hover:text-red-400"
                  onClick={() => removeSource.mutate({ collectionId: id, sourceId: source.id })}
                  aria-label="Remove source from collection"
                >
                  <X className="size-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <RenameCollectionDialog
        key={`rename-${String(renameOpen)}`}
        collection={collection}
        open={renameOpen}
        onOpenChange={setRenameOpen}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete collection?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes{" "}
              <span className="font-medium text-foreground">
                &ldquo;{collection.name}&rdquo;
              </span>
              . The sources themselves are not deleted. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={() =>
                deleteMutation.mutate(collection.id, {
                  onSuccess: () => router.push("/dashboard/collections"),
                })
              }
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add source to collection</DialogTitle>
            <DialogDescription>
              Pick a workspace, then a source from it to add to{" "}
              {collection.name}.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3">
            <select
              value={pickedWorkspaceId}
              onChange={(e) => {
                setPickedWorkspaceId(e.target.value);
                setPickedSourceId("");
              }}
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

            {pickedWorkspaceId && (
              <select
                value={pickedSourceId}
                onChange={(e) => setPickedSourceId(e.target.value)}
                className="h-9 rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              >
                <option value="" disabled>
                  {candidates.length === 0
                    ? "No sources in this workspace"
                    : "Select a source"}
                </option>
                {candidates.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title}
                  </option>
                ))}
              </select>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={!pickedSourceId || addSource.isPending}
              onClick={() =>
                addSource.mutate(
                  { collectionId: id, sourceId: pickedSourceId },
                  {
                    onSuccess: () => {
                      setPickedWorkspaceId("");
                      setPickedSourceId("");
                      setAddOpen(false);
                    },
                  }
                )
              }
            >
              {addSource.isPending ? "Adding..." : "Add source"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}