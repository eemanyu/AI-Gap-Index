import { mkdir, readFile, writeFile } from "node:fs/promises";
import { providers } from "../src/data";

export const officialDomains: Record<string, string[]> = {
  google: ["blog.google", "deepmind.google", "ai.google"],
  microsoft: ["blogs.microsoft.com", "news.microsoft.com", "azure.microsoft.com"],
  meta: ["about.fb.com", "ai.meta.com"],
  amazon: ["aws.amazon.com", "amazon.science"],
  openai: ["openai.com"],
  anthropic: ["anthropic.com"],
  mistral: ["mistral.ai"],
  xai: ["x.ai"],
  deepseek: ["deepseek.com", "api-docs.deepseek.com"],
  kimi: ["kimi.moonshot.cn", "moonshot.ai", "platform.moonshot.ai"]
};

export type SignalItem = { title: string; url: string; publishedAt: string };
export type ScoredSignal = { delta: number; summary: string; items: SignalItem[] };
export type DailyProvider = { providerId: string; tweets: ScoredSignal; news: ScoredSignal };
export type BlogScore = { providerId: string; delta: number; summary: string };

const grokLimitFile = "/home/ubuntu/.cache/ai-gap-index/grok-limit-until";

export function isGrokCooldownActive(until: number, now = Date.now()): boolean {
  return Number.isFinite(until) && until > now;
}

export function parseGrokJson(raw: string): unknown {
  let text = raw;
  try {
    const envelope: unknown = JSON.parse(raw);
    if (envelope && typeof envelope === "object" && typeof (envelope as { text?: unknown }).text === "string") {
      text = (envelope as { text: string }).text;
    }
  } catch {}
  const cleaned = text.trim().replace(/^\x60{3}(?:json)?\s*/i, "").replace(/\s*\x60{3}$/, "");
  return JSON.parse(cleaned);
}

function validSignal(raw: unknown, tweets: boolean): raw is ScoredSignal {
  if (!raw || typeof raw !== "object") return false;
  const signal = raw as Partial<ScoredSignal>;
  if (!Number.isInteger(signal.delta) || signal.delta! < -5 || signal.delta! > 5) return false;
  if (typeof signal.summary !== "string" || signal.summary.length > 500) return false;
  if (!Array.isArray(signal.items) || signal.items.length > 20) return false;
  return signal.items.every((item) => {
    if (!item || typeof item !== "object") return false;
    const candidate = item as Partial<SignalItem>;
    if (typeof candidate.title !== "string" || !candidate.title.trim() || candidate.title.length > 300) return false;
    if (typeof candidate.url !== "string" || typeof candidate.publishedAt !== "string" || !Number.isFinite(Date.parse(candidate.publishedAt))) return false;
    try {
      const url = new URL(candidate.url);
      if (url.protocol !== "https:") return false;
      return !tweets || (
        /^(?:www\.)?(?:x\.com|twitter\.com)$/.test(url.hostname) &&
        /^\/[^/]+\/status\/\d+\/?$/.test(url.pathname)
      );
    } catch {
      return false;
    }
  });
}

function expectedProviders(): string[] {
  return providers.map((provider) => provider.id);
}

export function validateDailyReport(raw: unknown): DailyProvider[] {
  if (!raw || typeof raw !== "object" || !Array.isArray((raw as { providers?: unknown }).providers)) {
    throw new Error("Grok report must contain a providers array.");
  }
  const rows = (raw as { providers: unknown[] }).providers;
  const ids = rows.map((row) => row && typeof row === "object" ? (row as { providerId?: unknown }).providerId : null);
  if (rows.length !== expectedProviders().length || new Set(ids).size !== rows.length ||
      !expectedProviders().every((id) => ids.includes(id))) {
    throw new Error("Grok report must contain each provider exactly once.");
  }
  return rows.map((row) => {
    const value = row as Partial<DailyProvider>;
    if (typeof value.providerId !== "string" || !validSignal(value.tweets, true) || !validSignal(value.news, false)) {
      throw new Error("Grok report contains an invalid tweets or news signal.");
    }
    return value as DailyProvider;
  });
}

export function validateBlogReport(raw: unknown, expectedIds: string[]): BlogScore[] {
  if (!raw || typeof raw !== "object" || !Array.isArray((raw as { providers?: unknown }).providers)) {
    throw new Error("Grok report must contain a providers array.");
  }
  const rows = (raw as { providers: unknown[] }).providers;
  const ids = rows.map((row) => row && typeof row === "object" ? (row as { providerId?: unknown }).providerId : null);
  if (rows.length !== expectedIds.length || new Set(ids).size !== rows.length ||
      !expectedIds.every((id) => ids.includes(id))) {
    throw new Error("Grok report must score each provider with new posts exactly once.");
  }
  return rows.map((row) => {
    const value = row as Partial<BlogScore>;
    if (typeof value.providerId !== "string" || !Number.isInteger(value.delta) ||
        value.delta! < -5 || value.delta! > 5 ||
        typeof value.summary !== "string" || value.summary.length > 500) {
      throw new Error("Grok report contains an invalid blog signal.");
    }
    return value as BlogScore;
  });
}

export function ingestConfig(): { url: string; token: string } {
  const url = Bun.env.INGEST_URL ?? "";
  const token = Bun.env.INGEST_TOKEN ?? "";
  if (!token) throw new Error("INGEST_TOKEN is not configured.");
  try {
    if (new URL(url).protocol !== "https:") throw new Error();
  } catch {
    throw new Error("INGEST_URL must be an HTTPS URL.");
  }
  return { url, token };
}

export async function runGrok(prompt: string): Promise<string> {
  let cooldownUntil = 0;
  try { cooldownUntil = Number(await readFile(grokLimitFile, "utf8")); } catch {}
  if (isGrokCooldownActive(cooldownUntil)) throw new Error("Grok usage-limit cooldown is active.");
  const child = Bun.spawn([
    "/home/ubuntu/.local/bin/grok", "-p", prompt, "--output-format", "json",
    "--permission-mode", "bypassPermissions", "--max-turns", "24", "--no-subagents"
  ], {
    cwd: "/home/ubuntu",
    env: {
      HOME: "/home/ubuntu",
      PATH: "/home/ubuntu/.local/bin:/home/ubuntu/.bun/bin:/usr/local/bin:/usr/bin:/bin",
      LANG: "C.UTF-8",
      TERM: "dumb",
      NO_COLOR: "1"
    },
    stdout: "pipe",
    stderr: "pipe"
  });
  const timeout = setTimeout(() => child.kill(), 12 * 60 * 1000);
  try {
    const [code, output, diagnostics] = await Promise.all([child.exited, new Response(child.stdout).text(), new Response(child.stderr).text()]);
    if (code !== 0) {
      if (/usage limit/i.test(diagnostics)) {
        try {
          await mkdir("/home/ubuntu/.cache/ai-gap-index", { recursive: true, mode: 0o700 });
          await writeFile(grokLimitFile, String(Date.now() + 24 * 60 * 60 * 1000), { mode: 0o600 });
        } catch {}
      }
      throw new Error("Grok CLI exited with code " + code + ": " + diagnostics.trim().slice(0, 800));
    }
    return output;
  } finally {
    clearTimeout(timeout);
  }
}

export async function sendSignal(
  config: { url: string; token: string },
  signal: Record<string, unknown>
): Promise<{ applied?: boolean }> {
  const response = await fetch(config.url, {
    method: "POST",
    headers: {
      authorization: "Bearer " + config.token,
      "content-type": "application/json"
    },
    body: JSON.stringify(signal),
    signal: AbortSignal.timeout(15000)
  });
  const result = await response.json().catch(() => null) as { ok?: boolean; applied?: boolean } | null;
  if (!response.ok || !result?.ok) throw new Error("Signal ingest failed with HTTP " + response.status + ".");
  return result;
}