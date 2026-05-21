const FLOOR_RADIUS = 12;
const MIN_ANGLE_STEP = 0.8; // Radians between consecutive positions

/**
 * Generates N positions arranged in a spiral on the XZ plane.
 * Deterministic: same count always produces the same layout.
 * Positions are clamped to stay within the floor radius.
 */
export function spiralPositions(count: number): Array<[number, number, number]> {
  if (count === 0) return [];

  const positions: Array<[number, number, number]> = [];

  for (let i = 0; i < count; i++) {
    const t = i / Math.max(count - 1, 1);
    const angle = i * MIN_ANGLE_STEP;
    const radius = 1.5 + t * (FLOOR_RADIUS - 3);
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    positions.push([x, 0, z]);
  }

  return positions;
}
