import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useGardenStore } from "../../stores/gardenStore";

interface ActionBarProps {
  pid: number;
  name: string;
  isKillable: boolean;
  compact?: boolean;
}

export function ActionBar({ pid, name, isKillable, compact }: ActionBarProps) {
  const [killing, setKilling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const removeCreatureLocally = useGardenStore((s) => s.removeCreatureLocally);

  const handleSendHome = async () => {
    const confirmed = window.confirm(
      `Send "${name}" (PID ${pid}) home? This will terminate the process.`,
    );
    if (!confirmed) return;

    setKilling(true);
    setError(null);

    removeCreatureLocally(pid);

    try {
      await invoke<boolean>("send_creature_home", { pid });
    } catch (err) {
      setError(String(err));
    } finally {
      setKilling(false);
    }
  };

  if (compact) {
    return (
      <button
        onClick={handleSendHome}
        disabled={!isKillable || killing}
        className={`shrink-0 px-2 py-1 rounded text-[10px] font-medium transition-all ${
          !isKillable
            ? "text-white/20 cursor-not-allowed"
            : killing
              ? "text-white/40 cursor-wait"
              : "text-white/60 hover:text-red-200 hover:bg-red-400/20"
        }`}
        title={
          !isKillable
            ? "System process"
            : `Terminate PID ${pid}`
        }
      >
        {killing ? "..." : isKillable ? "Kill" : "Sys"}
      </button>
    );
  }

  return (
    <div className="mt-4">
      <button
        onClick={handleSendHome}
        disabled={!isKillable || killing}
        className={`w-full py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
          !isKillable
            ? "bg-white/10 text-white/30 cursor-not-allowed"
            : killing
              ? "bg-white/20 text-white/50 cursor-wait"
              : "bg-white/20 text-white hover:bg-red-400/30 hover:text-red-100 active:scale-95"
        }`}
        title={
          !isKillable
            ? "System process -- cannot be terminated"
            : `Terminate ${name} (PID ${pid})`
        }
      >
        {killing ? "Sending home..." : isKillable ? "Send Home" : "System Process"}
      </button>

      {!isKillable && (
        <p className="text-xs text-white/30 mt-1 text-center">
          This process is critical and cannot be terminated.
        </p>
      )}

      {error && (
        <p className="text-xs text-red-300/80 mt-2 text-center">{error}</p>
      )}
    </div>
  );
}
