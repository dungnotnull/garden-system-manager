import { create } from "zustand";
import type { ProcessData, CreatureData } from "../types/process";

interface DyingEffect {
  id: string;
  position: [number, number, number];
  color: string;
}

interface GardenState {
  processes: ProcessData[];
  processGroups: CreatureData[];
  selectedCreatureKey: string | null;
  isInitialLoad: boolean;
  dyingEffects: DyingEffect[];
  setProcesses: (processes: ProcessData[]) => void;
  selectCreature: (key: string | null) => void;
  removeCreatureLocally: (pid: number) => void;
  removeDyingEffect: (id: string) => void;
}

function computeGroups(processes: ProcessData[]): CreatureData[] {
  const groupMap = new Map<string, ProcessData[]>();
  for (const p of processes) {
    const list = groupMap.get(p.name) ?? [];
    list.push(p);
    groupMap.set(p.name, list);
  }

  const groups = Array.from(groupMap.entries()).map(([name, procs]) => ({
    name,
    totalMemory: procs.reduce((s, p) => s + p.memory_usage, 0),
    maxCpu: Math.max(...procs.map((p) => p.cpu_usage)),
    isResponding: procs.every((p) => p.is_responding),
    isAnyKillable: procs.some((p) => p.is_killable),
    count: procs.length,
  }));

  groups.sort((a, b) => {
    if (b.maxCpu !== a.maxCpu) return b.maxCpu - a.maxCpu;
    return b.totalMemory - a.totalMemory;
  });

  return groups.slice(0, 20);
}

export const useGardenStore = create<GardenState>()((set) => ({
  processes: [],
  processGroups: [],
  selectedCreatureKey: null,
  isInitialLoad: true,
  dyingEffects: [],

  setProcesses: (processes) =>
    set({
      processes,
      processGroups: computeGroups(processes),
      isInitialLoad: false,
    }),

  selectCreature: (key) => set({ selectedCreatureKey: key }),

  removeCreatureLocally: (pid) =>
    set((state) => {
      const processes = state.processes.filter((p) => p.pid !== pid);
      return {
        processes,
        processGroups: computeGroups(processes),
        selectedCreatureKey:
          state.selectedCreatureKey ===
          state.processes.find((p) => p.pid === pid)?.name
            ? null
            : state.selectedCreatureKey,
      };
    }),

  removeDyingEffect: (id) =>
    set((state) => ({
      dyingEffects: state.dyingEffects.filter((e) => e.id !== id),
    })),
}));
