import { describe, expect, test } from "bun:test";
import {
  currentProvider,
  currentProviderScore,
  currentScore,
  history,
  methodology,
  providerLabel,
  providerSourceCoverage,
  providers,
  scoreProvider
} from "../src/data";

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

describe("provider scores", () => {
  test("covers the ten requested providers in order", () => {
    expect(providers.map((provider) => provider.name)).toEqual([
      "Google",
      "Microsoft",
      "Meta",
      "Amazon",
      "OpenAI",
      "Anthropic",
      "Mistral AI",
      "xAI",
      "DeepSeek",
      "Kimi"
    ]);
    expect(new Set(providers.map((provider) => provider.id)).size).toBe(10);
  });

  test("every factor is bounded and the weighted score is reproducible", () => {
    for (const provider of providers) {
      for (const factor of methodology.factors) {
        const value = provider.factors[factor.key];
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(100);
      }
      const weighted = methodology.factors.reduce((sum, factor) => sum + provider.factors[factor.key] * factor.weight, 0) / 100;
      expect(scoreProvider(provider)).toBe(Math.round(weighted));
      expect(scoreProvider(provider)).toBeGreaterThanOrEqual(0);
      expect(scoreProvider(provider)).toBeLessThanOrEqual(100);
    }
  });

  test("every provider has primary and independent HTTPS sources", () => {
    for (const provider of providers) {
      expect(provider.sources.some((source) => (source.type ?? "primary") === "primary")).toBe(true);
      expect(provider.sources.some((source) => source.type === "independent")).toBe(true);
      expect(provider.lastReviewed).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      for (const source of provider.sources) {
        expect(source.url.startsWith("https://")).toBe(true);
        expect(source.publisher.length).toBeGreaterThan(0);
        expect(source.title.length).toBeGreaterThan(0);
      }
    }
    expect(providerSourceCoverage).toEqual({ total: 10, primary: 10, independent: 10 });
  });

  test("Anthropic is the main gauge and the GAP history stays separate", () => {
    expect(currentProvider.id).toBe("anthropic");
    expect(currentProviderScore).toBe(scoreProvider(currentProvider));
    expect(currentScore).toBe(history.at(-1)?.score);
    expect(methodology.direction).toContain("GAP vs. OpenAI");
  });

  test("provider labels follow the published thresholds", () => {
    expect(providerLabel(80)).toBe("Category leader");
    expect(providerLabel(79)).toBe("Strong position");
    expect(providerLabel(70)).toBe("Strong position");
    expect(providerLabel(69)).toBe("Competitive");
    expect(providerLabel(60)).toBe("Competitive");
    expect(providerLabel(59)).toBe("Developing");
    expect(providerLabel(50)).toBe("Developing");
    expect(providerLabel(49)).toBe("Niche");
  });
});
