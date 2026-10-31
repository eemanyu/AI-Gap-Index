import { describe, expect, test } from "bun:test";
import { providers } from "../src/data";
import { officialDomains, isGrokCooldownActive, parseGrokJson, validateDailyReport, validateBlogReport } from "../scripts/signals";
import { parseGoogleNewsFeed } from "../scripts/blog-watcher";

describe("signal automation", () => {
  test("keeps the official-source map aligned with all ten providers", () => {
    expect(Object.keys(officialDomains).sort()).toEqual(providers.map((provider) => provider.id).sort());
  });

  test("activates the Grok cooldown only until its expiry", () => {
    expect(isGrokCooldownActive(2000, 1000)).toBe(true);
    expect(isGrokCooldownActive(1000, 1000)).toBe(false);
    expect(isGrokCooldownActive(Number.NaN, 1000)).toBe(false);
  });

  test("parses Grok's JSON envelope", () => {
    const payload = { providers: [] };
    expect(parseGrokJson(JSON.stringify({ text: JSON.stringify(payload) }))).toEqual(payload);
  });

  test("validates complete daily reports and rejects malformed tweet URLs", () => {
    const report = {
      providers: providers.map((provider) => ({
        providerId: provider.id,
        tweets: { delta: 0, summary: "No material change.", items: [{ title: "Update", url: "https://x.com/example/status/123", publishedAt: "2026-10-31T12:00:00Z" }] },
        news: { delta: 0, summary: "No material change.", items: [] }
      }))
    };
    expect(validateDailyReport(report)).toHaveLength(10);
    (report.providers[0]!.tweets.items[0] as { url: string }).url = "https://x.com/example/not-a-post";
    expect(() => validateDailyReport(report)).toThrow();
    (report.providers[0]!.tweets.items[0] as { url: string }).url = "https://x.com/example/status/123";
    (report.providers[0]!.tweets.items[0] as { publishedAt: string }).publishedAt = "not-a-date";
    expect(() => validateDailyReport(report)).toThrow();
  });

  test("rejects missing providers and invalid blog scores", () => {
    expect(() => validateDailyReport({ providers: [] })).toThrow();
    expect(() => validateBlogReport({ providers: [{ providerId: "google", delta: 9, summary: "bad" }] }, ["google"])).toThrow();
  });

  test("blog parser filters non-official and stale articles", () => {
    const now = Date.parse("2026-10-31T12:00:00Z");
    const source = { id: "anthropic", name: "Anthropic", domains: officialDomains.anthropic! };
    const xml = [
      "<rss><channel>",
      "<item><title>New Claude model</title><link>https://news.google.com/rss/articles/one</link><pubDate>Sat, 31 Oct 2026 11:00:00 GMT</pubDate><source url=\"https://www.anthropic.com/news\">Anthropic</source><description>Release details</description></item>",
      "<item><title>Impersonator</title><link>https://news.google.com/rss/articles/two</link><pubDate>Sat, 31 Oct 2026 11:00:00 GMT</pubDate><source url=\"https://anthropic.com.attacker.example/news\">Anthropic</source></item>",
      "<item><title>Old story</title><link>https://news.google.com/rss/articles/three</link><pubDate>Mon, 01 Jan 2024 00:00:00 GMT</pubDate><source url=\"https://anthropic.com/news\">Anthropic</source></item>",
      "<item><title>Bad link</title><link>https://attacker.example/post</link><pubDate>Sat, 31 Oct 2026 11:00:00 GMT</pubDate><source url=\"https://anthropic.com/news\">Anthropic</source></item>",
      "</channel></rss>"
    ].join("");
    expect(parseGoogleNewsFeed(xml, source, now).map((item) => item.title)).toEqual(["New Claude model"]);
  });
});