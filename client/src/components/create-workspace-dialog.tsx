"use client";

import { useState } from "react";
import { useModal, Modal, ModalBody, ModalContent, ModalFooter } from "@/components/ui/animated-modal";
import { Button as MovingBorder } from "@/components/ui/moving-border";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCreateWorkspace } from "@/hooks/use-workspaces";
import { cn } from "@/lib/utils";

const EMOJI_OPTIONS = [
  "📚", "📝", "💡", "🚀", "🎯", "📊", "🧪", "🎨", "💻", "🔬",
  "📖", "✏️", "🗂️", "🌟", "🔥", "📌", "🎓", "💼", "🏗️", "🧠",
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

interface CreateWorkspaceDialogProps {
  children: React.ReactNode;
}

export function CreateWorkspaceDialog({ children }: CreateWorkspaceDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("");
  const { mutate, isPending } = useCreateWorkspace();

  return (
    <Modal>
      <TriggerButton>{children}</TriggerButton>

      <ModalBody>
        <ModalContent className="gap-6">
          <h2 className="font-heading text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            New Workspace
          </h2>

          <form
            id="create-workspace-form"
            onSubmit={(e) => {
              e.preventDefault();
              if (!title.trim()) return;
              mutate(
                {
                  title: title.trim(),
                  description: description.trim() || undefined,
                  icon: icon || undefined,
                },
                {
                  onSuccess: () => {
                    setTitle("");
                    setDescription("");
                    setIcon("");
                  },
                }
              );
            }}
            className="space-y-4"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-zinc-200 text-xl dark:border-zinc-700">
                {icon || "📄"}
              </div>
              <Input
                placeholder="Workspace name"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={255}
                autoFocus
                className="flex-1"
              />
            </div>

            <div>
              <p className="mb-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                Choose an icon
              </p>
              <div className="flex flex-wrap gap-1.5">
                {EMOJI_OPTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setIcon(emoji)}
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

            <Textarea
              placeholder="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={1000}
              rows={2}
            />
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
            form="create-workspace-form"
            disabled={!title.trim() || isPending}
          >
            {isPending ? "Creating..." : "Create workspace"}
          </MovingBorder>
        </ModalFooter>
      </ModalBody>
    </Modal>
  );
}
