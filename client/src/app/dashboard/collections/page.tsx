"use client";

import { motion } from "motion/react";
import { useCollections } from "@/hooks/use-sidebar";
import { CreateCollectionDialog } from "@/components/create-collection-dialog";
import { BentoGrid } from "@/components/ui/bento-grid";
import { CollectionCard } from "@/components/collection-card";
import { Button as MovingButton } from "@/components/ui/moving-border";
import { Button } from "@/components/ui/button";
import { Plus, FolderOpen } from "lucide-react";

export default function CollectionsPage() {
  const { data, isLoading } = useCollections();
  const collections = data?.data ?? [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-600" />
      </div>
    );
  }

  if (collections.length === 0) {
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
            No collections
          </h2>
          <p className="max-w-sm text-sm text-zinc-500 dark:text-zinc-400">
            Group sources from different workspaces into collections to keep
            your research organized.
          </p>
          <CreateCollectionDialog>
            <MovingButton
              borderRadius="0.75rem"
              duration={4000}
              containerClassName="mx-auto"
              className="border-zinc-300 bg-white text-sm font-medium text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Create your first collection
            </MovingButton>
          </CreateCollectionDialog>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 pt-5 pb-3">
        <div>
          <h2 className="font-heading text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Collections
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {collections.length} collection
            {collections.length !== 1 ? "s" : ""}
          </p>
        </div>
        <CreateCollectionDialog>
          <Button size="sm">
            <Plus className="mr-1.5 h-4 w-4" />
            New
          </Button>
        </CreateCollectionDialog>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-6">
        <BentoGrid className="grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {collections.map((c, idx) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: idx * 0.05 }}
            >
              <CollectionCard collection={c} />
            </motion.div>
          ))}
        </BentoGrid>
      </div>
    </div>
  );
}