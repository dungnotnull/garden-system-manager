import { PALETTE_COLORS } from "./palette";

/**
 * Deterministic color assignment based on process name hash.
 * Same process name always maps to the same color across sessions.
 */
export function nameToColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  }
  const index = Math.abs(hash) % PALETTE_COLORS.length;
  return PALETTE_COLORS[index];
}
