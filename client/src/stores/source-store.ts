import { create } from "zustand";
import type { SourceType, SourceStatus } from "@/lib/types";

interface SourceStore {
  selectedIds: Set<string>;
  toggleSelect: (id: string) => void;
  selectAll: (ids: string[]) => void;
  clearSelection: () => void;
  isSelected: (id: string) => boolean;

  filterType: SourceType | "all";
  setFilterType: (type: SourceType | "all") => void;

  filterStatus: SourceStatus | "all";
  setFilterStatus: (status: SourceStatus | "all") => void;

  searchQuery: string;
  setSearchQuery: (query: string) => void;

  addDialogOpen: boolean;
  setAddDialogOpen: (open: boolean) => void;

  activeSourceId: string | null;
  setActiveSourceId: (id: string | null) => void;
}

export const useSourceStore = create<SourceStore>((set, get) => ({
  selectedIds: new Set<string>(),

  toggleSelect: (id) =>
    set((state) => {
      const next = new Set(state.selectedIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { selectedIds: next };
    }),

  selectAll: (ids) => set({ selectedIds: new Set(ids) }),

  clearSelection: () => set({ selectedIds: new Set() }),

  isSelected: (id) => get().selectedIds.has(id),

  filterType: "all",
  setFilterType: (type) => set({ filterType: type }),

  filterStatus: "all",
  setFilterStatus: (status) => set({ filterStatus: status }),

  searchQuery: "",
  setSearchQuery: (query) => set({ searchQuery: query }),

  addDialogOpen: false,
  setAddDialogOpen: (open) => set({ addDialogOpen: open }),

  activeSourceId: null,
  setActiveSourceId: (id) => set({ activeSourceId: id }),
}));
