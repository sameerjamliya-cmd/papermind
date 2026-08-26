"use client";

import { useState } from "react";
import { useModal, Modal, ModalBody, ModalContent, ModalFooter } from "@/components/ui/animated-modal";
import { Button as MovingBorder } from "@/components/ui/moving-border";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCreateCollection, useUpdateCollection } from "@/hooks/use-sidebar";
import { cn } from "@/lib/utils";
import type { Collection } from "@/lib/types";

const EMOJI_OPTIONS = [
  "📁", "📚", "📖", "🗂️", "📌", "⭐", "🎯", "🧠",
  "💡", "🚀", "🎓", "🔬", "📊", "🎨", "💻", "🔥",
];

function TriggerButton({ children }: { children: React.ReactNode }) {
  const { setOpen } = useModal();
  return <span onClick={() => setOpen(true)}>{children}</span>;
}

function CancelButton({ children }: { children: React.ReactNode }) {
  const { setOpen } = useModal();
  return (
    <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
      {children}
    </Button>
  );
}

function CollectionIconPicker({
  icon,
  onChange,
}: {
  icon: string;
  onChange: (icon: string) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
        Choose an icon
      </p>
      <div className="flex flex-wrap gap-1.5">
        {EMOJI_OPTIONS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => onChange(emoji)}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-lg text-lg transition-colors",
              icon === emoji
                ? "bg-zinc-200 ring-1 ring-zinc-300 dark:bg-zinc-700 dark:ring-zinc-600"
                : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
            )}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}

interface CreateCollectionDialogProps {
  children: React.ReactNode;
}

export function CreateCollectionDialog({ children }: CreateCollectionDialogProps) {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("");
  const { mutate, isPending } = useCreateCollection();

  return (
    <Modal>
      <TriggerButton>{children}</TriggerButton>

      <ModalBody>
        <ModalContent className="gap-6">
          <h2 className="font-heading text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            New Collection
          </h2>

          <form
            id="create-collection-form"
            onSubmit={(e) => {
              e.preventDefault();
              if (!name.trim()) return;
              mutate(
                {
                  name: name.trim(),
                  icon: icon || undefined,
                },
                {
                  onSuccess: () => {
                    setName("");
                    setIcon("");
                  },
                }
              );
            }}
            className="space-y-4"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-zinc-200 text-xl dark:border-zinc-700">
                {icon || "📁"}
              </div>
              <Input
                placeholder="Collection name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={255}
                autoFocus
                className="flex-1"
              />
            </div>

            <CollectionIconPicker icon={icon} onChange={setIcon} />
          </form>
        </ModalContent>

        <ModalFooter className="gap-3">
          <CancelButton>Cancel</CancelButton>
          <MovingBorder
            borderRadius="0.75rem"
            duration={4000}
            containerClassName="h-10"
            className="border-zinc-300 bg-white text-sm font-medium text-zinc-700 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200"
            type="submit"
            form="create-collection-form"
            disabled={!name.trim() || isPending}
          >
            {isPending ? "Creating..." : "Create collection"}
          </MovingBorder>
        </ModalFooter>
      </ModalBody>
    </Modal>
  );
}

interface RenameCollectionDialogProps {
  collection: Collection;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RenameCollectionDialog({
  collection,
  open,
  onOpenChange,
}: RenameCollectionDialogProps) {
  const update = useUpdateCollection();
  const [name, setName] = useState(collection.name);
  const [icon, setIcon] = useState(collection.icon ?? "");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Rename collection</DialogTitle>
          <DialogDescription>
            Update the name or icon of this collection.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-zinc-200 text-xl dark:border-zinc-700">
            {icon || collection.icon || "📁"}
          </div>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={255}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter" && name.trim()) {
                update.mutate(
                  { id: collection.id, name: name.trim(), icon: icon || undefined },
                  { onSuccess: () => onOpenChange(false) }
                );
              }
            }}
          />
        </div>
        <CollectionIconPicker icon={icon} onChange={setIcon} />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={!name.trim() || update.isPending}
            onClick={() =>
              update.mutate(
                { id: collection.id, name: name.trim(), icon: icon || undefined },
                { onSuccess: () => onOpenChange(false) }
              )
            }
          >
            {update.isPending ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}