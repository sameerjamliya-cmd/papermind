"use client";

import { useState } from "react";
import Link from "next/link";
import { useDeleteCollection } from "@/hooks/use-sidebar";
import { RenameCollectionDialog } from "@/components/create-collection-dialog";
import { BentoGridItem } from "@/components/ui/bento-grid";
import { Button as MovingBorder } from "@/components/ui/moving-border";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { FolderOpen, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import type { Collection } from "@/lib/types";

interface CollectionCardProps {
  collection: Collection;
}

export function CollectionCard({ collection }: CollectionCardProps) {
  const deleteMutation = useDeleteCollection();
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const count = collection.sources.length;

  return (
    <div className="group/card relative">
      <Link href={`/dashboard/collections/${collection.id}`}>
        <BentoGridItem
          title={collection.name}
          description={
            count === 0
              ? "No sources yet"
              : `${count} source${count === 1 ? "" : "s"}`
          }
          icon={
            collection.icon ? (
              <span className="text-2xl">{collection.icon}</span>
            ) : (
              <FolderOpen className="h-5 w-5 text-zinc-400" />
            )
          }
          header={
            <div className="flex items-center justify-between">
              <span className="text-3xl">
                {collection.icon || <FolderOpen className="h-7 w-7 text-zinc-300" />}
              </span>
              <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                {count}
              </span>
            </div>
          }
          className="cursor-pointer hover:border-zinc-300 hover:shadow-md dark:hover:border-zinc-700 dark:hover:shadow-zinc-900/50"
        />
      </Link>

      <div className="absolute top-3 right-3 z-10 opacity-0 transition-opacity group-hover/card:opacity-100">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={(props) => (
              <Button
                {...props}
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
              />
            )}
          >
            <MoreHorizontal className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onClick={() => setRenameOpen(true)}>
              <Pencil className="mr-2 h-4 w-4" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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
            <MovingBorder
              borderRadius="0.75rem"
              duration={3000}
              containerClassName="h-10"
              className="border-red-500 bg-red-600 text-sm font-medium text-white hover:bg-red-700"
              onClick={() => deleteMutation.mutate(collection.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </MovingBorder>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}