import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

const page = readFileSync(new URL("../public/index.html", import.meta.url), "utf8");
const styles = readFileSync(new URL("../public/styles.css", import.meta.url), "utf8");

function gaugeText(label: string) {
  return page.match(new RegExp(`<text x="(?:29|271)" y="169"[^>]*>${label}<\\/text>`))?.[0];
}

describe("GAP gauge orientation and colors", () => {
  test("places Anthropic left and OpenAI right", () => {
    expect(gaugeText("ANTHROPIC")).toContain('x="29"');
    expect(gaugeText("OPENAI")).toContain('x="271"');
  });

  test("uses orange on Anthropic's half and black on OpenAI's half of the gauge only", () => {
    expect(page).toContain('<stop offset="0%" stop-color="#d97757"/>');
    expect(page).toContain('<stop offset="49%" stop-color="#d97757"/>');
    expect(page).toContain('<stop offset="51%" stop-color="#171912"/>');
    expect(page).toContain('<stop offset="100%" stop-color="#171912"/>');
    expect(styles).toContain(".tag-anthropic { color: #6a5740; background: #f0e1cc; }");
    expect(styles).toContain(".tag-openai { color: #4e6252; background: #dfe8dc; }");
  });
});
