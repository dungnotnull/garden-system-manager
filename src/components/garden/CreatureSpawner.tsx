import { useMemo, useRef, useState, useCallback } from "react";
import { useGardenStore } from "../../stores/gardenStore";
import { GardenCreature } from "./GardenCreature";
import { PoofEffect } from "../effects/PoofEffect";
import type { CreatureData } from "../../types/process";
function getHomePosition(name: string): [number, number, number] {
  let hash1 = 0;
  let hash2 = 0;
  for (let i = 0; i < name.length; i++) {
    hash1 = (hash1 * 31 + name.charCodeAt(i)) % 10000;
    hash2 = (hash2 * 37 + name.charCodeAt(i)) % 10000;
  }
  const r = 2 + (hash1 / 10000) * 10; // radius 2 to 12
  const angle = (hash2 / 10000) * Math.PI * 2;
  return [Math.cos(angle) * r, 0, Math.sin(angle) * r];
}

interface CachedGroup {
  data: CreatureData;
  position: [number, number, number];
}

export function CreatureSpawner() {
  const processGroups = useGardenStore((s) => s.processGroups);
  const selectedCreatureKey = useGardenStore((s) => s.selectedCreatureKey);
  const selectCreature = useGardenStore((s) => s.selectCreature);
  const dyingEffects = useGardenStore((s) => s.dyingEffects);
  const removeDyingEffect = useGardenStore((s) => s.removeDyingEffect);



  // Cache group data for exit animations
  const cacheRef = useRef<Map<string, CachedGroup>>(new Map());
  const prevKeysRef = useRef<Set<string>>(new Set());
  const [exitingKeys, setExitingKeys] = useState<Set<string>>(new Set());

  const currentKeySet = useMemo(() => {
    return new Set(processGroups.map((g) => g.name));
  }, [processGroups]);

  // Detect exits when groups change
  useMemo(() => {
    const prevKeys = prevKeysRef.current;
    const departed: string[] = [];

    for (const key of prevKeys) {
      if (!currentKeySet.has(key)) {
        departed.push(key);
      }
    }

    if (departed.length > 0) {
      setExitingKeys((prev) => {
        const next = new Set(prev);
        for (const key of departed) {
          if (cacheRef.current.has(key)) {
            next.add(key);
          }
        }
        return next;
      });
    }

    // Update cache
    processGroups.forEach((g) => {
      cacheRef.current.set(g.name, {
        data: g,
        position: getHomePosition(g.name),
      });
    });

    prevKeysRef.current = currentKeySet;
  }, [processGroups, currentKeySet]);

  const handleExitComplete = useCallback((key: string) => {
    setExitingKeys((prev) => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
    cacheRef.current.delete(key);
  }, []);

  return (
    <>
      {processGroups.map((g) => {
        const pos = getHomePosition(g.name);
        return (
          <GardenCreature
            key={g.name}
            data={g}
            position={pos}
            isSelected={selectedCreatureKey === g.name}
            onSelect={selectCreature}
          />
        );
      })}

      {Array.from(exitingKeys).map((key) => {
        const cached = cacheRef.current.get(key);
        if (!cached) return null;
        return (
          <GardenCreature
            key={key}
            data={cached.data}
            position={cached.position}
            isSelected={false}
            isExiting
            onSelect={() => {}}
            onExitComplete={() => handleExitComplete(key)}
          />
        );
      })}

      {dyingEffects.map((effect) => (
        <PoofEffect
          key={effect.id}
          id={effect.id}
          position={effect.position}
          color={effect.color}
          onDone={removeDyingEffect}
        />
      ))}
    </>
  );
}
