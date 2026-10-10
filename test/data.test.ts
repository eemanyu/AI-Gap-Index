import { describe, expect, test } from "bun:test";
import { currentScore, history, methodology } from "../src/data";

describe("GAP Index editorial data", () => {
  test("contains one chronological point per month from December 2025 through October 2026", () => {
    expect(history).toHaveLength(11);
    expect(history[0]?.month).toBe("2025-12");
    expect(history.at(-1)?.month).toBe("2026-10");
    expect(history.map((point) => point.month)).toEqual([...history.map((point) => point.month)].sort());
  });

  test("each monthly point has a bounded score, rationale, and HTTPS source links", () => {
    for (const point of history) {
      expect(point.score).toBeGreaterThanOrEqual(0);
      expect(point.score).toBeLessThanOrEqual(100);
      expect(point.summary.length).toBeGreaterThan(40);
      expect(point.sources.length).toBeGreaterThan(0);
      for (const source of point.sources) {
        expect(source.url.startsWith("https://")).toBe(true);
        expect(source.publisher.length).toBeGreaterThan(0);
        expect(source.title.length).toBeGreaterThan(0);
      }
    }
  });

  test("methodology weights sum to 100 percent", () => {
    expect(methodology.weights.reduce((sum, factor) => sum + factor.weight, 0)).toBe(100);
  });

  test("current reading points to the final month and describes the direction honestly", () => {
    expect(currentScore).toBe(history.at(-1)?.score);
    expect(methodology.direction).toContain("50 = parity");
    expect(methodology.caveat).toContain("Not a representative sentiment poll");
  });

  test("citation coverage only describes link coverage", () => {
    expect(methodology.sourceCoverage.cited).toBe(history.length);
    expect(methodology.sourceCoverage.total).toBe(history.length);
    expect(methodology.sourceCoverage.percentage).toBe(100);
    expect(methodology.sourceCoverage.label).toContain("citations");
  });
});
