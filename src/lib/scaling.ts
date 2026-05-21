const MIN_SCALE = 0.3;
const MAX_SCALE = 2.5;
const REFERENCE_MEMORY = 500 * 1024 * 1024; // 500 MB used as reference point

/**
 * Maps memory usage (bytes) to a creature scale using square-root mapping.
 * Non-linear so that giant processes don't visually dominate the scene.
 */
export function memoryToScale(memoryBytes: number): number {
  if (memoryBytes <= 0) return MIN_SCALE;
  const ratio = Math.sqrt(memoryBytes / REFERENCE_MEMORY);
  return Math.max(MIN_SCALE, Math.min(MAX_SCALE, ratio));
}
