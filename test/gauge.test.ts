import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { renderHome } from "../src/render";
import { currentProviderScore, currentScore, providers, scoreProvider } from "../src/data";

const template = readFileSync(new URL("../public/index.html", import.meta.url), "utf8");
const page = renderHome(template, "https://example.test");
const styles = readFileSync(new URL("../public/styles.css", import.meta.url), "utf8");

describe("main Anthropic gauge", () => {
  test("renders the Anthropic provider score, not the relative GAP score", () => {
    expect(page).toContain(`<title id="gauge-svg-title">Anthropic score: ${currentProviderScore} out of 100</title>`);
    expect(page).toContain(`<span id="score-number">${currentProviderScore}</span>`);
    expect(page).toContain(`transform:rotate(${(currentProviderScore * 1.8 - 180).toFixed(1)}deg)`);
    expect(page).toContain(`<b>${currentScore}/100</b><span>GAP vs. OpenAI (`);
    expect(page).toContain('<span class="mini-status">Slight Anthropic edge</span>');
  });

  test("uses an absolute 0-100 scale with a single orange gradient", () => {
    expect(page).toContain('<text x="29" y="169" class="gauge-end-label" text-anchor="start">0</text>');
    expect(page).toContain('<text x="150" y="15" class="gauge-mid-label" text-anchor="middle">50</text>');
    expect(page).toContain('<text x="271" y="169" class="gauge-end-label" text-anchor="end">100</text>');
    expect(page).toContain('<stop offset="0%" stop-color="#8d9084"/>');
    expect(page).toContain('<stop offset="100%" stop-color="#d97757"/>');
    expect(styles).toContain(".tag-anthropic { color: #6a5740; background: #f0e1cc; }");
    expect(styles).toContain(".tag-openai { color: #4e6252; background: #dfe8dc; }");
  });

  test("has no unrendered placeholders left", () => {
    expect(page).not.toMatch(/__[A-Z_]+__/);
  });
});

describe("provider field", () => {
  test("renders ten provider rows in the requested order", () => {
    const ids = [...page.matchAll(/class="provider-row" href="\/providers\/([a-z0-9-]+)\/"/g)].map((match) => match[1]);
    expect(ids).toEqual(providers.map((provider) => provider.id));
    expect(ids).toHaveLength(10);
    expect(ids).toEqual(["google", "microsoft", "meta", "amazon", "openai", "anthropic", "mistral", "xai", "deepseek", "kimi"]);
  });

  test("puts the gauge before the company name in every row", () => {
    const rows = [...page.matchAll(/<a class="provider-row"[\s\S]*?<\/a>/g)].map((match) => match[0]);
    expect(rows).toHaveLength(10);
    for (const row of rows) {
      expect(row.indexOf('class="provider-gauge"')).toBeLessThan(row.indexOf('class="provider-name"'));
    }
    expect(styles).toContain("grid-template-columns: 104px minmax(0, 1fr) auto 128px");
  });

  test("shows each computed provider score", () => {
    for (const provider of providers) {
      expect(page).toContain(`${provider.name}<small>${provider.shortName}</small>`);
      expect(page).toContain(`data-provider="${provider.id}" aria-label="${provider.name}: ${scoreProvider(provider)} out of 100`);
    }
  });

  test("renders the field list inside main", () => {
    const main = page.slice(page.indexOf("<main"), page.indexOf("</main>"));
    expect(main).toContain('id="provider-list"');
    expect(main).toContain('id="field"');
  });
});
