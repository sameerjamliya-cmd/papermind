"use client";

import Link from "next/link";
import { format } from "date-fns";
import { useDeleteWorkspace } from "@/hooks/use-workspaces";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { FolderOpen, MoreHorizontal, Trash2 } from "lucide-react";
import type { Workspace } from "@/lib/types";

interface WorkspaceCardProps {
  workspace: Workspace;
}

export function WorkspaceCard({ workspace }: WorkspaceCardProps) {
  const deleteMutation = useDeleteWorkspace();

  return (
    <div className="group/card relative">
      <Link href={`/dashboard/workspace/${workspace.id}`}>
        <BentoGridItem
          title={workspace.title}
          description={workspace.description ?? undefined}
          icon={
            workspace.icon ? (
              <span className="text-2xl">{workspace.icon}</span>
            ) : (
              <FolderOpen className="h-5 w-5 text-zinc-400" />
            )
          }
          header={
            <div className="flex items-center justify-between">
              <span className="text-3xl">
                {workspace.icon || <FolderOpen className="h-7 w-7 text-zinc-300" />}
              </span>
              <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
                {format(new Date(workspace.updatedAt), "MMM d")}
              </span>
            </div>
          }
          className="cursor-pointer hover:border-zinc-300 hover:shadow-md dark:hover:border-zinc-700 dark:hover:shadow-zinc-900/50"
        />
      </Link>

      <AlertDialog>
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
              <AlertDialogTrigger
                render={(props) => (
                  <DropdownMenuItem
                    {...props}
                    className="text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
                    onSelect={(e) => e.preventDefault()}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                )}
              />
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete workspace?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes{" "}
              <span className="font-medium text-foreground">
                &ldquo;{workspace.title}&rdquo;
              </span>{" "}
              and all its sources. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <MovingBorder
              borderRadius="0.75rem"
              duration={3000}
              containerClassName="h-10"
              className="border-red-500 bg-red-600 text-sm font-medium text-white hover:bg-red-700"
              onClick={() => deleteMutation.mutate(workspace.id)}
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
