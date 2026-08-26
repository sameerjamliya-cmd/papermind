"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "@/lib/auth-client";
import {
  useAllWorkspaces,
  useDeleteWorkspace,
  useUpdateWorkspace,
} from "@/hooks/use-workspaces";
import {
  useAllSources,
  useCollections,
  useFavoriteWorkspaces,
  useRecentWorkspaces,
  useSharedWorkspaces,
  useToggleFavorite,
} from "@/hooks/use-sidebar";
import { ThemeToggle } from "./theme-toggle";
import { CreateWorkspaceDialog } from "./create-workspace-dialog";
import { CreateCollectionDialog } from "./create-collection-dialog";
import { AddSourceDialog } from "./sources/add-source-dialog";
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
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Plus,
  LogOut,
  Search,
  Upload,
  Settings,
  Star,
  MoreHorizontal,
  Layers,
  Share2,
  X,
  FolderOpen,
  Pencil,
  Trash2,
  Clock3,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Collection, Source, Workspace } from "@/lib/types";

function workspaceHref(id: string) {
  return `/dashboard/workspace/${id}`;
}

function isWorkspaceActive(pathname: string, id: string) {
  const href = workspaceHref(id);
  return pathname === href || pathname.startsWith(href + "/");
}

function CollapseButton({ className }: { className?: string }) {
  const { state, toggleSidebar } = useSidebar();
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={toggleSidebar}
      aria-label={state === "expanded" ? "Collapse sidebar" : "Expand sidebar"}
      className={cn(
        "rounded-md text-sidebar-foreground/50 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground",
        className
      )}
    >
      {state === "expanded" ? (
        <PanelLeftClose className="size-4" />
      ) : (
        <PanelLeft className="size-4" />
      )}
      <span className="sr-only">Toggle sidebar</span>
    </Button>
  );
}

function RenameWorkspaceDialog({
  workspace,
  open,
  onOpenChange,
}: {
  workspace: Workspace;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const update = useUpdateWorkspace();
  const [name, setName] = useState(workspace.title);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Rename workspace</DialogTitle>
          <DialogDescription>
            Give this workspace a new name.
          </DialogDescription>
        </DialogHeader>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={255}
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter" && name.trim()) {
              update.mutate(
                { id: workspace.id, title: name.trim() },
                { onSuccess: () => onOpenChange(false) }
              );
            }
          }}
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={!name.trim() || update.isPending}
            onClick={() =>
              update.mutate(
                { id: workspace.id, title: name.trim() },
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

function WorkspaceRow({
  workspace,
  onNavigate,
}: {
  workspace: Workspace;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();
  const toggleFavorite = useToggleFavorite();
  const deleteMutation = useDeleteWorkspace();
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const active = isWorkspaceActive(pathname, workspace.id);
  const href = workspaceHref(workspace.id);

  const closeMobile = () => {
    onNavigate?.();
    if (isMobile) setOpenMobile(false);
  };

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        render={<Link href={href} onClick={closeMobile} />}
        isActive={active}
        tooltip={workspace.title}
      >
        <span className="text-sm leading-none">
          {workspace.icon ?? (
            <Layers className="size-4 text-sidebar-foreground/50" />
          )}
        </span>
        <span className="truncate">{workspace.title}</span>
      </SidebarMenuButton>

      <SidebarMenuAction
        showOnHover
        className="right-7"
        onClick={() => toggleFavorite.mutate(workspace.id)}
        aria-label={
          workspace.isFavorite ? "Remove from favorites" : "Add to favorites"
        }
      >
        <Star
          className={cn(
            "size-4",
            workspace.isFavorite
              ? "fill-[#e4f7c9] text-[#e4f7c9]"
              : "text-sidebar-foreground/50"
          )}
        />
      </SidebarMenuAction>

      <div className="absolute top-2 right-7 hidden group-data-[collapsible=icon]:hidden group-hover/menu-item:flex">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={(props) => (
              <button
                {...props}
                className="flex aspect-square w-5 items-center justify-center rounded-md text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                aria-label="Workspace actions"
              >
                <MoreHorizontal className="size-4" />
              </button>
            )}
          >
            <span className="sr-only">More</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onClick={() => setRenameOpen(true)}>
              <Pencil className="mr-2 size-3.5" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive focus:text-destructive dark:text-red-400 dark:focus:text-red-400"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="mr-2 size-3.5" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <RenameWorkspaceDialog
        key={`rename-${String(renameOpen)}`}
        workspace={workspace}
        open={renameOpen}
        onOpenChange={setRenameOpen}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
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
            <Button
              variant="destructive"
              onClick={() => deleteMutation.mutate(workspace.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarMenuItem>
  );
}

function RecentRow({
  workspace,
  onNavigate,
}: {
  workspace: Workspace;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        render={
          <Link
            href={workspaceHref(workspace.id)}
            onClick={() => {
              onNavigate?.();
              if (isMobile) setOpenMobile(false);
            }}
          />
        }
        isActive={isWorkspaceActive(pathname, workspace.id)}
        tooltip={workspace.title}
      >
        <Clock3 className="size-4 text-sidebar-foreground/45" />
        <span className="truncate">{workspace.title}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

function CollectionRow({
  collection,
  onNavigate,
}: {
  collection: Collection;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();
  const href = `/dashboard/collections/${collection.id}`;
  const active = pathname === href || pathname.startsWith(href + "/");

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        render={
          <Link
            href={href}
            onClick={() => {
              onNavigate?.();
              if (isMobile) setOpenMobile(false);
            }}
          />
        }
        isActive={active}
        tooltip={collection.name}
      >
        <span className="text-sm leading-none">{collection.icon ?? "📁"}</span>
        <span className="truncate">{collection.name}</span>
      </SidebarMenuButton>
      <SidebarMenuBadge>{collection.sources.length}</SidebarMenuBadge>
    </SidebarMenuItem>
  );
}

function SourceRow({
  source,
  onNavigate,
}: {
  source: Source;
  onNavigate?: () => void;
}) {
  const { isMobile, setOpenMobile } = useSidebar();
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        render={
          <Link
            href={workspaceHref(source.workspaceId)}
            onClick={() => {
              onNavigate?.();
              if (isMobile) setOpenMobile(false);
            }}
          />
        }
        tooltip={source.title}
      >
        <FolderOpen className="size-4 text-sidebar-foreground/50" />
        <span className="truncate">{source.title}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

function SharedRow({
  workspaceId,
  title,
  onNavigate,
}: {
  workspaceId: string;
  title: string;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        render={
          <Link
            href={workspaceHref(workspaceId)}
            onClick={() => {
              onNavigate?.();
              if (isMobile) setOpenMobile(false);
            }}
          />
        }
        isActive={isWorkspaceActive(pathname, workspaceId)}
        tooltip={title}
      >
        <Share2 className="size-4 text-sidebar-foreground/50" />
        <span className="truncate">{title}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

function EmptyHint({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-2 py-1.5 text-[11px] leading-relaxed text-sidebar-foreground/40">
      {children}
    </p>
  );
}

export function AppSidebar({
  onNavigate,
}: { onNavigate?: () => void } = {}) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { data: workspacesData } = useAllWorkspaces();
  const { data: collectionsData } = useCollections();
  const { data: shared } = useSharedWorkspaces();
  const { data: favoritesData } = useFavoriteWorkspaces();
  const { data: recentData } = useRecentWorkspaces();

  const searchRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const { data: allSources } = useAllSources(debouncedQuery.trim());

  const workspaces = workspacesData?.data ?? [];
  const sources = allSources?.data ?? [];
  const collections = collectionsData?.data ?? [];
  const favorites = favoritesData?.data ?? [];
  const recents = (recentData?.data ?? []).slice(0, 5);
  const user = session?.user;

  const q = debouncedQuery.trim().toLowerCase();
  const searching = q.length > 0;
  const filteredWorkspaces = searching
    ? workspaces.filter((w) => w.title.toLowerCase().includes(q))
    : [];
  const filteredSources = searching ? sources : [];
  const filteredCollections = searching
    ? collections.filter((c) => c.name.toLowerCase().includes(q))
    : [];
  const resultsCount =
    filteredWorkspaces.length +
    filteredSources.length +
    filteredCollections.length;

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-1 pt-1 pb-1">
          <Link
            href="/dashboard"
            onClick={onNavigate}
            className="flex min-w-0 flex-1 items-center gap-2.5"
          >
            <Image
              src="/logo.png"
              alt="Papermind"
              width={24}
              height={24}
              className="shrink-0"
            />
            <span className="truncate font-heading text-sm font-semibold tracking-tight text-sidebar-foreground group-data-[collapsible=icon]:hidden">
              Papermind
            </span>
          </Link>
          <CollapseButton className="group-data-[collapsible=icon]:hidden" />
        </div>

        <CollapseButton className="mx-auto group-data-[collapsible=icon]:flex" />

        <div className="relative mt-1 group-data-[collapsible=icon]:hidden">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-sidebar-foreground/40" />
          <input
            ref={searchRef}
            type="text"
            placeholder="Search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setQuery("");
            }}
            className="h-9 w-full rounded-full border border-sidebar-border bg-white/[0.04] pr-14 pl-9 text-xs text-sidebar-foreground outline-hidden transition-colors placeholder:text-sidebar-foreground/40 hover:border-white/15 focus:border-sidebar-ring/70 focus:bg-white/[0.06]"
          />
          {query ? (
            <button
              onClick={() => setQuery("")}
              className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded-md p-1 text-sidebar-foreground/40 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
              aria-label="Clear search"
            >
              <X className="size-3" />
            </button>
          ) : (
            <kbd className="absolute top-1/2 right-2.5 hidden -translate-y-1/2 rounded-md border border-sidebar-border bg-white/[0.04] px-1.5 py-0.5 font-sans text-[10px] font-medium text-sidebar-foreground/35 select-none md:block">
              ⌘K
            </kbd>
          )}
        </div>

        <div className="mt-1.5 flex gap-2 group-data-[collapsible=icon]:hidden">
          <CreateWorkspaceDialog>
            <Button
              size="sm"
              className="h-8 flex-1 justify-start gap-2 rounded-lg bg-sidebar-primary text-xs font-medium text-sidebar-primary-foreground transition-colors hover:bg-sidebar-primary/85"
            >
              <Plus className="size-3.5" />
              New research
            </Button>
          </CreateWorkspaceDialog>

          <AddSourceDialog>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 rounded-lg border border-sidebar-border p-0 text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
              aria-label="Add source"
            >
              <Upload className="size-3.5" />
            </Button>
          </AddSourceDialog>
        </div>
      </SidebarHeader>

      <SidebarContent className="gap-1 py-1">
        {searching ? (
          <SidebarGroup>
            <SidebarGroupContent>
              {resultsCount === 0 ? (
                <EmptyHint>
                  No matches for &ldquo;{debouncedQuery.trim()}&rdquo;.
                  <br />
                  Try a different keyword.
                </EmptyHint>
              ) : (
                <div className="flex flex-col gap-3">
                  {filteredWorkspaces.length > 0 && (
                    <div>
                      <SidebarGroupLabel>Workspaces</SidebarGroupLabel>
                      <SidebarMenu>
                        {filteredWorkspaces.map((ws) => (
                          <WorkspaceRow
                            key={`ws-${ws.id}`}
                            workspace={ws}
                            onNavigate={onNavigate}
                          />
                        ))}
                      </SidebarMenu>
                    </div>
                  )}

                  {filteredSources.length > 0 && (
                    <div>
                      <SidebarGroupLabel>Documents</SidebarGroupLabel>
                      <SidebarMenu>
                        {filteredSources.map((s) => (
                          <SourceRow
                            key={`src-${s.id}`}
                            source={s}
                            onNavigate={onNavigate}
                          />
                        ))}
                      </SidebarMenu>
                    </div>
                  )}

                  {filteredCollections.length > 0 && (
                    <div>
                      <SidebarGroupLabel>Collections</SidebarGroupLabel>
                      <SidebarMenu>
                        {filteredCollections.map((c) => (
                          <CollectionRow
                            key={`col-${c.id}`}
                            collection={c}
                            onNavigate={onNavigate}
                          />
                        ))}
                      </SidebarMenu>
                    </div>
                  )}
                </div>
              )}
            </SidebarGroupContent>
          </SidebarGroup>
        ) : (
          <>
            {favorites.length > 0 && (
              <SidebarGroup>
                <SidebarGroupLabel>Favorites</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {favorites.map((ws) => (
                      <WorkspaceRow
                        key={`fav-${ws.id}`}
                        workspace={ws}
                        onNavigate={onNavigate}
                      />
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}

            {recents.length > 0 && (
              <SidebarGroup>
                <SidebarGroupLabel>Recents</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {recents.map((ws) =>
                      favorites.some((f) => f.id === ws.id) ? null : (
                        <RecentRow
                          key={`recent-${ws.id}`}
                          workspace={ws}
                          onNavigate={onNavigate}
                        />
                      )
                    )}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}

            <SidebarGroup>
              <SidebarGroupLabel className="pr-8">
                Workspaces
              </SidebarGroupLabel>
              <CreateWorkspaceDialog>
                <SidebarGroupAction aria-label="New research">
                  <Plus />
                </SidebarGroupAction>
              </CreateWorkspaceDialog>
              <SidebarGroupContent>
                <SidebarMenu>
                  {workspaces.length === 0 ? (
                    <EmptyHint>
                      No workspaces yet — create your first research to get
                      started.
                    </EmptyHint>
                  ) : (
                    workspaces.map((ws) => (
                      <WorkspaceRow
                        key={ws.id}
                        workspace={ws}
                        onNavigate={onNavigate}
                      />
                    ))
                  )}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel className="pr-8">
                Collections
              </SidebarGroupLabel>
              <CreateCollectionDialog>
                <SidebarGroupAction aria-label="New collection">
                  <Plus />
                </SidebarGroupAction>
              </CreateCollectionDialog>
              <SidebarGroupContent>
                <SidebarMenu>
                  {collections.length === 0 ? (
                    <EmptyHint>Group related sources into collections.</EmptyHint>
                  ) : (
                    collections.map((c) => (
                      <CollectionRow
                        key={c.id}
                        collection={c}
                        onNavigate={onNavigate}
                      />
                    ))
                  )}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {shared && shared.data.length > 0 && (
              <SidebarGroup>
                <SidebarGroupLabel>Shared with me</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {shared.data.map((s) => (
                      <SharedRow
                        key={s.id}
                        workspaceId={s.workspaceId}
                        title={s.workspace.title}
                        onNavigate={onNavigate}
                      />
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}
          </>
        )}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              render={
                <Link href="/dashboard/settings" onClick={onNavigate} />
              }
              isActive={pathname === "/dashboard/settings"}
              tooltip="Settings"
            >
              <Settings className="size-4" />
              <span>Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        <SidebarSeparator />

        <div className="group/user-chip relative flex items-center justify-between gap-2 rounded-lg p-1.5 transition-colors hover:bg-sidebar-accent/70">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sidebar-primary/20 text-xs font-semibold text-[#e4f7c9] ring-1 ring-sidebar-primary/30">
              {user?.name?.charAt(0) ?? "?"}
            </div>
            <div className="min-w-0 group-data-[collapsible=icon]:hidden">
              <p className="truncate text-xs font-medium text-sidebar-foreground">
                {user?.name ?? "User"}
              </p>
              <p className="truncate text-[10px] text-sidebar-foreground/45">
                {user?.email ?? ""}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-0.5 group-data-[collapsible=icon]:hidden">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon-xs"
              className="rounded-md text-sidebar-foreground/50 transition-colors hover:text-sidebar-foreground"
              onClick={() => signOut()}
              aria-label="Sign out"
            >
              <LogOut className="size-3.5" />
            </Button>
          </div>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
