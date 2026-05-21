import { useState } from "react";
import { useGardenStore } from "../../stores/gardenStore";
import { StatBar } from "./StatBar";
import { ActionBar } from "./ActionBar";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / 1024 / 1024).toFixed(0)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
}

export function OverlayHUD() {
  const processes = useGardenStore((s) => s.processes);
  const processGroups = useGardenStore((s) => s.processGroups);
  const selectedKey = useGardenStore((s) => s.selectedCreatureKey);
  const selectCreature = useGardenStore((s) => s.selectCreature);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  const selectedGroup = selectedKey
    ? processGroups.find((g) => g.name === selectedKey)
    : null;

  const groupProcesses = selectedKey
    ? processes.filter((p) => p.name === selectedKey)
    : [];

  const totalCpu = processGroups.reduce((s, g) => s + g.maxCpu, 0);
  const totalMemory = processGroups.reduce((s, g) => s + g.totalMemory, 0);
  const creatureCount = processGroups.length;

  return (
    <div className="absolute top-4 right-4 w-80 pointer-events-auto max-h-[calc(100vh-2rem)] overflow-y-auto">
      <div className="rounded-2xl bg-black/40 backdrop-blur-xl border border-white/15 shadow-2xl p-5 text-white">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-base tracking-wide">
            System Garden
          </h2>
          <span className="text-xs text-white/50">
            {creatureCount} creature{creatureCount !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Summary Stats */}
        <StatBar
          label="Total CPU"
          value={totalCpu}
          max={200}
          displayText={`${totalCpu.toFixed(1)}%`}
        />
        <StatBar
          label="Total RAM"
          value={totalMemory}
          max={8 * 1024 * 1024 * 1024}
          displayText={formatBytes(totalMemory)}
        />

        {/* Selected Group Detail */}
        {selectedGroup && (
          <>
            <div className="border-t border-white/10 my-4" />

            <div className="flex items-center justify-between mb-1">
              <h3 className="font-medium text-sm truncate mr-2">
                {selectedGroup.name}
                {selectedGroup.count > 1 && (
                  <span className="ml-2 text-xs text-white/40">
                    x{selectedGroup.count} processes
                  </span>
                )}
              </h3>
              <button
                onClick={() => selectCreature(null)}
                className="text-white/40 hover:text-white/80 transition-colors text-sm leading-none shrink-0"
                title="Deselect"
              >
                &times;
              </button>
            </div>

            <StatBar
              label="CPU"
              value={selectedGroup.maxCpu}
              max={100}
              displayText={`${selectedGroup.maxCpu.toFixed(1)}%`}
            />
            <StatBar
              label="RAM"
              value={selectedGroup.totalMemory}
              max={4 * 1024 * 1024 * 1024}
              displayText={formatBytes(selectedGroup.totalMemory)}
            />

            {/* Individual processes list */}
            {selectedGroup.count > 1 && (
              <div className="mt-3">
                <button
                  onClick={() =>
                    setExpandedGroup(
                      expandedGroup === selectedGroup.name
                        ? null
                        : selectedGroup.name,
                    )
                  }
                  className="text-xs text-white/50 hover:text-white/80 transition-colors"
                >
                  {expandedGroup === selectedGroup.name
                    ? "Hide processes"
                    : "Show individual processes"}
                </button>

                {expandedGroup === selectedGroup.name && (
                  <div className="mt-2 space-y-1.5 max-h-40 overflow-y-auto">
                    {groupProcesses.map((p) => (
                      <div
                        key={p.pid}
                        className="flex items-center justify-between text-xs bg-white/5 rounded-lg px-2.5 py-1.5"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="text-white/70">
                            PID {p.pid}
                          </div>
                          <div className="text-white/40">
                            {p.cpu_usage.toFixed(1)}% CPU |{" "}
                            {(p.memory_usage / 1024 / 1024).toFixed(0)} MB
                          </div>
                        </div>
                        <ActionBar
                          pid={p.pid}
                          name={p.name}
                          isKillable={p.is_killable}
                          compact
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Single process: show kill button directly */}
            {selectedGroup.count === 1 && groupProcesses[0] && (
              <ActionBar
                pid={groupProcesses[0].pid}
                name={groupProcesses[0].name}
                isKillable={groupProcesses[0].is_killable}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
