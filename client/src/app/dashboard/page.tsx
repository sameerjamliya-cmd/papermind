"use client";

import { motion } from "motion/react";
import { useWorkspaces } from "@/hooks/use-workspaces";
import { CreateWorkspaceDialog } from "@/components/create-workspace-dialog";
import { BentoGrid } from "@/components/ui/bento-grid";
import { WorkspaceCard } from "@/components/workspace-card";
import { Button as MovingButton } from "@/components/ui/moving-border";
import { Button } from "@/components/ui/button";
import { Plus, FolderOpen } from "lucide-react";

export default function DashboardPage() {
  const { data, isLoading } = useWorkspaces();
  const workspaces = data?.data ?? [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-600" />
      </div>
    );
  }

  if (workspaces.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-4"
        >
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-800">
            <FolderOpen className="h-10 w-10 text-zinc-400" />
          </div>
          <h2 className="font-heading text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            No workspaces
          </h2>
          <p className="max-w-sm text-sm text-zinc-500 dark:text-zinc-400">
            Create your first workspace to upload sources, chat with documents, and generate insights.
          </p>
          <CreateWorkspaceDialog>
            <MovingButton
              borderRadius="0.75rem"
              duration={4000}
              containerClassName="mx-auto"
              className="border-zinc-300 bg-white text-sm font-medium text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Create your first workspace
            </MovingButton>
          </CreateWorkspaceDialog>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 pt-5 pb-3">
        <div>
          <h2 className="font-heading text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Workspaces
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {workspaces.length} workspace{workspaces.length !== 1 ? "s" : ""}
          </p>
        </div>
        <CreateWorkspaceDialog>
          <Button size="sm">
            <Plus className="mr-1.5 h-4 w-4" />
            New
          </Button>
        </CreateWorkspaceDialog>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-6">
        <BentoGrid className="grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {workspaces.map((ws, idx) => (
            <motion.div
              key={ws.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: idx * 0.05 }}
            >
              <WorkspaceCard workspace={ws} />
            </motion.div>
          ))}
        </BentoGrid>
      </div>
    </div>
  );
}
