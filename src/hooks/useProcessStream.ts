import { useEffect } from "react";
import { listen } from "@tauri-apps/api/event";
import { useGardenStore } from "../stores/gardenStore";
import type { ProcessData } from "../types/process";

export function useProcessStream() {
  const setProcesses = useGardenStore((s) => s.setProcesses);

  useEffect(() => {
    const unlisten = listen<ProcessData[]>("process-update", (event) => {
      setProcesses(event.payload);
    });

    return () => {
      unlisten.then((fn) => fn());
    };
  }, [setProcesses]);
}
