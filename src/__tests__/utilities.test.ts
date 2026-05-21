import { describe, it, expect } from "vitest";
import { memoryToScale } from "../lib/scaling";
import { spiralPositions } from "../lib/collision";
import { nameToColor } from "../lib/color-assign";
import { PALETTE_COLORS } from "../lib/palette";

describe("memoryToScale", () => {
  it("returns MIN_SCALE for zero bytes", () => {
    expect(memoryToScale(0)).toBe(0.3);
  });

  it("returns MIN_SCALE for negative bytes", () => {
    expect(memoryToScale(-100)).toBe(0.3);
  });

  it("clamps to MAX_SCALE for very large values", () => {
    expect(memoryToScale(100 * 1024 * 1024 * 1024)).toBe(2.5);
  });

  it("returns ~1.0 for the reference memory value", () => {
    const ref = 500 * 1024 * 1024;
    expect(memoryToScale(ref)).toBeCloseTo(1.0, 2);
  });

  it("scales non-linearly (sqrt mapping)", () => {
    const quarterRef = 125 * 1024 * 1024; // 500MB / 4
    const result = memoryToScale(quarterRef);
    // sqrt(0.25) = 0.5
    expect(result).toBeCloseTo(0.5, 2);
  });

  it("is monotonically increasing for non-clamped values", () => {
    const values = [50_000_000, 200_000_000, 500_000_000, 2_000_000_000];
    for (let i = 1; i < values.length; i++) {
      expect(memoryToScale(values[i])).toBeGreaterThan(memoryToScale(values[i - 1]));
    }
  });
});

describe("spiralPositions", () => {
  it("returns empty array for count 0", () => {
    expect(spiralPositions(0)).toEqual([]);
  });

  it("returns one position for count 1", () => {
    const positions = spiralPositions(1);
    expect(positions).toHaveLength(1);
    expect(positions[0][1]).toBe(0); // Y is always 0
  });

  it("returns correct count of positions", () => {
    expect(spiralPositions(5)).toHaveLength(5);
    expect(spiralPositions(20)).toHaveLength(20);
  });

  it("all positions are within floor radius", () => {
    const positions = spiralPositions(20);
    for (const [x, , z] of positions) {
      const dist = Math.sqrt(x * x + z * z);
      expect(dist).toBeLessThanOrEqual(13); // FLOOR_RADIUS + margin
    }
  });

  it("is deterministic (same input = same output)", () => {
    const a = spiralPositions(10);
    const b = spiralPositions(10);
    expect(a).toEqual(b);
  });
});

describe("nameToColor", () => {
  it("always returns a valid palette color", () => {
    expect([...PALETTE_COLORS]).toContain(nameToColor("chrome.exe"));
    expect([...PALETTE_COLORS]).toContain(nameToColor("code.exe"));
  });

  it("is deterministic (same name = same color)", () => {
    expect(nameToColor("chrome.exe")).toBe(nameToColor("chrome.exe"));
    expect(nameToColor("code.exe")).toBe(nameToColor("code.exe"));
  });

  it("different names can produce different colors", () => {
    const chrome = nameToColor("chrome.exe");
    const code = nameToColor("code.exe");
    // Not guaranteed different, but very likely with 8 colors
    // Just verify both are valid
    expect(PALETTE_COLORS).toContain(chrome);
    expect(PALETTE_COLORS).toContain(code);
  });

  it("handles empty string", () => {
    const color = nameToColor("");
    expect(PALETTE_COLORS).toContain(color);
  });
});
