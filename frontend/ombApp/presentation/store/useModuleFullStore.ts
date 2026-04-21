import { create } from 'zustand';

interface ModuleFullStore {
  moduleDetails: Record<number, any>;
  setModuleDetail: (id: number, detail: any) => void;
  setManyModuleDetails: (details: Record<number, any>) => void;
  clearModuleDetails: () => void;
}

export const useModuleFullStore = create<ModuleFullStore>((set) => ({
  moduleDetails: {},
  setModuleDetail: (id, detail) => set((state) => ({
    moduleDetails: { ...state.moduleDetails, [id]: detail },
  })),
  setManyModuleDetails: (details) => set((state) => ({
    moduleDetails: { ...state.moduleDetails, ...details },
  })),
  clearModuleDetails: () => set({ moduleDetails: {} }),
}));
