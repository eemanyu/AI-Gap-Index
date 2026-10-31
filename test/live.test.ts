import { describe, expect, test } from "bun:test";
import { providerLabel } from "../src/data";
import { clampScore, deltasFromRow, effectiveScore, type ProviderStateRow } from "../src/live";

describe("live scores", () => {
  test("clamps to 0..100 and rounds", () => {
    expect(clampScore(-10)).toBe(0);
    expect(clampScore(150)).toBe(100);
    expect(clampScore(49.4)).toBe(49);
    expect(clampScore(49.5)).toBe(50);
  });

  test("sums the three signal deltas", () => {
    expect(effectiveScore(72, { tweetDelta: 2, newsDelta: -1, blogDelta: 3 })).toBe(76);
    expect(effectiveScore(72, { tweetDelta: -5, newsDelta: -5, blogDelta: -5 })).toBe(57);
  });

  test("clamps the effective score at both bounds", () => {
    expect(effectiveScore(99, { tweetDelta: 5, newsDelta: 5, blogDelta: 5 })).toBe(100);
    expect(effectiveScore(1, { tweetDelta: -5, newsDelta: -5, blogDelta: -5 })).toBe(0);
  });

  test("missing state returns the base score", () => {
    expect(effectiveScore(72)).toBe(72);
    expect(effectiveScore(72, null)).toBe(72);
    expect(deltasFromRow(null)).toBeNull();
  });

  test("maps a D1 row to camelCase deltas", () => {
    const row: ProviderStateRow = {
      provider_id: "anthropic",
      tweet_delta: 2,
      news_delta: -1,
      blog_delta: 0,
      summary: "test",
      updated_at: "2026-10-30T00:00:00.000Z"
    };
    expect(deltasFromRow(row)).toEqual({
      tweetDelta: 2,
      newsDelta: -1,
      blogDelta: 0,
      summary: "test",
      updatedAt: "2026-10-30T00:00:00.000Z"
    });
  });

  test("provider labels keep their boundaries", () => {
    expect(providerLabel(79)).toBe("Strong position");
    expect(providerLabel(80)).toBe("Category leader");
    expect(providerLabel(69)).toBe("Competitive");
    expect(providerLabel(70)).toBe("Strong position");
    expect(providerLabel(59)).toBe("Developing");
    expect(providerLabel(60)).toBe("Competitive");
    expect(providerLabel(49)).toBe("Niche");
    expect(providerLabel(50)).toBe("Developing");
  });
});
