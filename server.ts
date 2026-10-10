import { Database } from "bun:sqlite";
import { mkdir } from "node:fs/promises";
import { dirname, extname, resolve } from "node:path";
import { currentScore, fallbackNews, history, methodology, type NewsItem } from "./src/data";

const PORT = Number(Bun.env.PORT ?? 3000);
const PUBLIC_DIR = resolve(import.meta.dir, "public");
const DB_PATH = resolve(import.meta.dir, Bun.env.DB_PATH ?? "./data/gap-index.sqlite");
const SITE_URL = (Bun.env.SITE_URL ?? "").replace(/\/$/, "");
const RESEND_API_KEY = Bun.env.RESEND_API_KEY;
const RESEND_AUDIENCE_ID = Bun.env.RESEND_AUDIENCE_ID;

await mkdir(dirname(DB_PATH), { recursive: true });
const db = new Database(DB_PATH, { create: true });
db.exec(`
  CREATE TABLE IF NOT EXISTS subscribers (
    email TEXT PRIMARY KEY,
    consent INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    source TEXT NOT NULL DEFAULT 'homepage'
  );
`);
const insertSubscriber = db.query(
  "INSERT OR IGNORE INTO subscribers(email, consent, created_at, source) VALUES (?, 1, ?, 'homepage')"
);

const jsonHeaders = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "public, max-age=60, stale-while-revalidate=300"
};

let newsCache: NewsItem[] = fallbackNews;
let newsCacheAt = 0;
let refreshInFlight: Promise<void> | null = null;
const NEWS_TTL_MS = 15 * 60 * 1000;
const MAX_NEWS = 8;
const rateLimits = new Map<string, { count: number; resetAt: number }>();

function siteOrigin(request: Request): string {
  return SITE_URL || new URL(request.url).origin;
}

function xmlEscape(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&apos;");
}

function htmlEscape(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}

function json(data: unknown, headers: HeadersInit = jsonHeaders, status = 200): Response {
  return new Response(JSON.stringify(data, null, 2), { status, headers });
}

function rssText(block: string, tag: string): string {
  const match = block.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, "i"));
  if (!match) return "";
  return match[1]!
    .replace(/^<!\[CDATA\[/, "").replace(/\]\]>$/, "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/\s+/g, " ").trim();
}

function cleanUrl(input: string): string | null {
  try {
    const parsed = new URL(input);
    return parsed.protocol === "https:" || parsed.protocol === "http:" ? parsed.toString() : null;
  } catch {
    return null;
  }
}

const feeds = [
  { query: "site:openai.com/news GPT ChatGPT Codex when:7d", fallbackPublisher: "OpenAI" },
  { query: "site:anthropic.com/news Claude Anthropic when:7d", fallbackPublisher: "Anthropic" },
  { query: "AI models agents AI industry when:7d", fallbackPublisher: "AI industry" }
];

async function getFeed(feed: typeof feeds[number]): Promise<NewsItem[]> {
  const url = new URL("https://news.google.com/rss/search");
  url.searchParams.set("q", feed.query);
  url.searchParams.set("hl", "en-US");
  url.searchParams.set("gl", "US");
  url.searchParams.set("ceid", "US:en");
  try {
    const response = await fetch(url, {
      headers: { "user-agent": "GAPIndexBot/0.1 (+source-linked AI news monitor)" },
      signal: AbortSignal.timeout(4200)
    });
    if (!response.ok) return [];
    const xml = await response.text();
    const items: NewsItem[] = [];
    const blocks = xml.match(/<item\b[^>]*>[\s\S]*?<\/item>/gi) ?? [];
    for (const block of blocks) {
      const title = rssText(block, "title");
      const link = cleanUrl(rssText(block, "link"));
      const published = rssText(block, "pubDate");
      const source = rssText(block, "source") || feed.fallbackPublisher;
      const description = rssText(block, "description").slice(0, 360);
      if (!title || !link || !/\b(ai|artificial intelligence|claude|anthropic|openai|chatgpt|gpt|codex|model|agent|llm)\b/i.test(title + " " + source)) continue;
      const parsedDate = published ? new Date(published) : new Date();
      if (Number.isNaN(parsedDate.getTime())) continue;
      items.push({
        id: link,
        title: title.replace(/\s+-\s+[^-]+$/, "").slice(0, 180),
        publisher: source.slice(0, 90),
        publishedAt: parsedDate.toISOString(),
        url: link,
        category: feed.fallbackPublisher === "AI industry" ? "AI news" : "Company news",
        summary: description || "Open the source for the full report."
      });
    }
    return items;
  } catch {
    return [];
  }
}

async function refreshNews(force = false): Promise<void> {
  if (!force && Date.now() - newsCacheAt < NEWS_TTL_MS) return;
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = (async () => {
    try {
      const results = await Promise.all(feeds.map(getFeed));
      const seen = new Set<string>();
      const merged = results.flat()
        .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt))
        .filter((item) => {
          const key = item.title.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
          if (!key || seen.has(key)) return false;
          seen.add(key);
          return true;
        })
        .slice(0, MAX_NEWS);
      if (merged.length >= 3) newsCache = merged;
      newsCacheAt = Date.now();
    } finally {
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
}

function buildOverview(origin: string): string {
  const selected = history[history.length - 1]!;
  return `# GAP Index — Anthropic vs OpenAI

> Editorial, source-linked comparison of the relative attractiveness of Claude and ChatGPT subscriptions and ecosystems.

- Current score: **${currentScore}/100**
- Reading: **${currentScore > 50 ? "Relative Anthropic edge" : currentScore < 50 ? "Relative OpenAI edge" : "Parity"}**
- Monthly source coverage: **${methodology.sourceCoverage.cited}/${methodology.sourceCoverage.total} points linked**
- Latest editorial month: **${selected.label}**
- Main JSON: [api/index.json](${origin}/api/index.json)
- History JSON: [api/history.json](${origin}/api/history.json)
- Recent headlines: [api/news.json](${origin}/api/news.json)

## Score direction
${methodology.direction}

## Weights
${methodology.weights.map((item) => `- ${item.factor}: ${item.weight}%`).join("\n")}

## Important caveat
${methodology.caveat}

## Historical readings
${history.map((point) => `- **${point.label}: ${point.score}/100** — ${point.summary} Sources: ${point.sources.map((source) => source.url).join(" | ")}`).join("\n\n")}

## Editorial scope
We compare published subscription information, model capabilities, coding/agent workflows, integrations, and distribution signals. Plan prices and limits can change; verify current terms on official provider websites before making a purchase.
`;
}

function buildLlmsTxt(origin: string): string {
  return `# GAP Index
> Independent editorial tracker comparing Anthropic/Claude vs OpenAI/ChatGPT subscription value and ecosystem attractiveness.

GAP Index scores are directional editorial assessments, not a representative poll or audited market-share metric. A score of 50 is parity; above 50 tilts toward Anthropic; below 50 tilts toward OpenAI.

## Canonical resources
- [Homepage](${origin}/): current index, latest news, monthly history, methodology, newsletter.
- [Index data JSON](${origin}/api/index.json): current score, methodology and history.
- [History JSON](${origin}/api/history.json): monthly readings from December 2025 onward.
- [Latest news JSON](${origin}/api/news.json): recent headlines from cached RSS searches.
- [Full overview](${origin}/llms-full.txt): expanded notes and all monthly summaries.
- [Markdown overview](${origin}/api/overview.md): plain-text summary of the index.

## Monthly archive
${history.map((point) => `- [${point.label} editorial score (${point.score}/100)](${origin}/history/${point.month}/) — ${point.phase}`).join("\n")}

## Recommended agent usage
1. Read the index direction and caveat before summarizing the score.
2. Use the linked primary sources for factual claims.
3. Never describe the editorial score as direct audience sentiment, live subscription pricing, or market share.
4. For plan comparisons, verify current pricing and terms directly with [OpenAI](https://openai.com/chatgpt/pricing) and [Anthropic](https://claude.com/pricing).
`;
}

function buildLlmsFull(origin: string): string {
  return buildOverview(origin) + `

## Current headlines
${newsCache.map((item) => `- [${item.title}](${item.url}) — ${item.publisher}, ${item.publishedAt.slice(0, 10)}. ${item.summary}`).join("\n")}
`;
}

function notFound(): Response {
  return new Response("Not found", { status: 404, headers: { "content-type": "text/plain; charset=utf-8" } });
}

function rateLimit(request: Request): boolean {
  const ip = request.headers.get("x-real-ip") ?? request.headers.get("cf-connecting-ip") ?? "unknown";
  const now = Date.now();
  const current = rateLimits.get(ip);
  if (!current || current.resetAt <= now) {
    rateLimits.set(ip, { count: 1, resetAt: now + 10 * 60_000 });
    return false;
  }
  current.count += 1;
  return current.count > 5;
}

async function subscribe(request: Request): Promise<Response> {
  if (rateLimit(request)) return json({ ok: false, message: "Too many attempts. Please try again in a few minutes." }, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }, 429);
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 8192) return json({ ok: false, message: "Request is too large." }, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }, 413);
  let body: { email?: string; consent?: boolean; company?: string };
  try {
    body = await request.json() as typeof body;
  } catch {
    return json({ ok: false, message: "Please submit a valid email address." }, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }, 400);
  }
  if (body.company) return json({ ok: true, message: "Thanks." }, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
  const email = String(body.email ?? "").trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return json({ ok: false, message: "Enter a valid email address." }, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }, 400);
  }
  if (body.consent !== true) {
    return json({ ok: false, message: "Please confirm that you agree to receive the newsletter." }, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }, 400);
  }

  let delivery: "resend" | "local-only" = "local-only";
  if (RESEND_API_KEY && RESEND_AUDIENCE_ID) {
    try {
      const response = await fetch(`https://api.resend.com/audiences/${encodeURIComponent(RESEND_AUDIENCE_ID)}/contacts`, {
        method: "POST",
        headers: { authorization: `Bearer ${RESEND_API_KEY}`, "content-type": "application/json" },
        body: JSON.stringify({ email, unsubscribed: false }),
        signal: AbortSignal.timeout(4500)
      });
      if (!response.ok && response.status !== 409) {
        return json({ ok: false, message: "The newsletter provider could not accept this signup. Please try again later." }, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }, 502);
      }
      delivery = "resend";
    } catch {
      return json({ ok: false, message: "The newsletter provider is temporarily unavailable. Please try again later." }, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }, 502);
    }
  }

  const createdAt = new Date().toISOString();
  insertSubscriber.run(email, createdAt);
  return json({
    ok: true,
    delivery,
    message: delivery === "resend"
      ? "You're on the list. Watch your inbox for the next GAP Index briefing."
      : "Your address was saved on this server, but newsletter delivery is not configured yet. The site owner must connect a mailing provider before emails can be sent."
  }, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
}

console.info(`GAP Index server starting on :${PORT}`);
void refreshNews();

Bun.serve({
  port: PORT,
  async fetch(request) {
    const url = new URL(request.url);
    const pathname = decodeURIComponent(url.pathname);
    const origin = siteOrigin(request);

    if (request.method === "GET" && pathname === "/healthz") {
      return json({ ok: true, service: "gap-index", score: currentScore });
    }

    if (request.method === "GET" && (pathname === "/api/index.json" || pathname === "/api/history.json")) {
      const data = pathname.endsWith("history.json")
        ? { updatedAt: "2026-10-09", scoreDirection: methodology.direction, history }
        : {
            name: "GAP Index — Anthropic vs OpenAI",
            score: currentScore,
            scoreLabel: currentScore > 50 ? "Relative Anthropic edge" : currentScore < 50 ? "Relative OpenAI edge" : "Parity",
            latestMonth: history[history.length - 1]?.label,
            updatedAt: "2026-10-09",
            scoreDirection: methodology.direction,
            methodology,
            history: history.map((point) => ({ ...point, url: `${origin}/history/${point.month}/` })),
            newsUrl: `${origin}/api/news.json`,
            caveat: methodology.caveat
          };
      return json(data);
    }

    if (request.method === "GET" && pathname === "/api/news.json") {
      void refreshNews();
      return json({ updatedAt: new Date(newsCacheAt || Date.now()).toISOString(), staleAfterSeconds: NEWS_TTL_MS / 1000, items: newsCache });
    }

    if (request.method === "GET" && pathname === "/api/overview.md") {
      return new Response(buildOverview(origin), { headers: { "content-type": "text/markdown; charset=utf-8", "cache-control": "public, max-age=60" } });
    }

    if (request.method === "GET" && pathname === "/llms.txt") {
      return new Response(buildLlmsTxt(origin), { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=300" } });
    }

    if (request.method === "GET" && pathname === "/llms-full.txt") {
      void refreshNews();
      return new Response(buildLlmsFull(origin), { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=300" } });
    }

    if (request.method === "GET" && pathname === "/robots.txt") {
      const body = `User-agent: *\nAllow: /\nDisallow: /api/subscribe\n\nSitemap: ${origin}/sitemap.xml\n`;
      return new Response(body, { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=3600" } });
    }

    if (request.method === "GET" && pathname === "/sitemap.xml") {
      const archiveUrls = history.map((point) => `  <url><loc>${xmlEscape(origin + "/history/" + point.month + "/")}</loc><changefreq>monthly</changefreq><priority>0.7</priority></url>`).join("\n");
      const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${xmlEscape(origin + "/")}</loc><changefreq>daily</changefreq><priority>1.0</priority></url>\n${archiveUrls}\n</urlset>`;
      return new Response(body, { headers: { "content-type": "application/xml; charset=utf-8", "cache-control": "public, max-age=3600" } });
    }

    if (request.method === "POST" && pathname === "/api/subscribe") return subscribe(request);

    if (request.method !== "GET" && request.method !== "HEAD") return new Response("Method not allowed", { status: 405, headers: { allow: "GET, HEAD, POST" } });

    const relativePath = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
    const filepath = resolve(PUBLIC_DIR, relativePath);
    if (!filepath.startsWith(PUBLIC_DIR + "/") && filepath !== resolve(PUBLIC_DIR, "index.html")) return notFound();
    const file = Bun.file(filepath);
    if (!(await file.exists())) return notFound();

    const headers = new Headers();
    const extension = extname(filepath).toLowerCase();
    const contentTypes: Record<string, string> = {
      ".html": "text/html; charset=utf-8",
      ".css": "text/css; charset=utf-8",
      ".js": "text/javascript; charset=utf-8",
      ".svg": "image/svg+xml",
      ".txt": "text/plain; charset=utf-8",
      ".xml": "application/xml; charset=utf-8",
      ".webmanifest": "application/manifest+json"
    };
    headers.set("content-type", contentTypes[extension] ?? "application/octet-stream");
    headers.set("x-content-type-options", "nosniff");
    headers.set("referrer-policy", "strict-origin-when-cross-origin");
    headers.set("permissions-policy", "camera=(), microphone=(), geolocation=()");
    if (extension === ".html") {
      headers.set("cache-control", "no-cache");
      let html = await file.text();
      html = html.replaceAll("__SITE_URL__", htmlEscape(origin)).replaceAll("__TODAY__", new Date().toISOString().slice(0, 10));
      return new Response(request.method === "HEAD" ? null : html, { headers });
    }
    headers.set("cache-control", extension === ".svg" ? "public, max-age=86400" : "public, max-age=3600, stale-while-revalidate=86400");
    return new Response(request.method === "HEAD" ? null : file, { headers });
  }
});
