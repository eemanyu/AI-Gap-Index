import { Database } from "bun:sqlite";
import { mkdir } from "node:fs/promises";
import { dirname, extname, resolve } from "node:path";
import {
  currentProvider,
  currentProviderScore,
  currentScore,
  currentScoreDelta,
  fallbackNews,
  history,
  methodology,
  providerSourceCoverage,
  providers,
  scoreProvider,
  type NewsItem
} from "./src/data";
import { renderHome, renderProviderPage } from "./src/render";
import {
  buildFeed,
  buildHistoryPage,
  buildLlmsFull,
  buildLlmsTxt,
  buildOverview,
  historyCsv,
  htmlEscape,
  xmlEscape
} from "./src/content";

const PORT = Number(Bun.env.PORT ?? 3000);
const PUBLIC_DIR = resolve(import.meta.dir, "public");
const TEMPLATES_DIR = resolve(import.meta.dir, "templates");
const isVercel = Boolean(process.env.VERCEL);
const DB_PATH = Bun.env.DB_PATH
  ? resolve(import.meta.dir, Bun.env.DB_PATH)
  : isVercel
    ? "/tmp/gap-index.sqlite"
    : resolve(import.meta.dir, "./data/gap-index.sqlite");
const SITE_URL = (
  Bun.env.SITE_URL
  || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "")
  || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "")
).replace(/\/$/, "");
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
  "cache-control": "public, max-age=60, stale-while-revalidate=300",
  "access-control-allow-origin": "*"
};

let newsCache: NewsItem[] = fallbackNews;
let newsCacheAt = 0;
let newsSource: "rss" | "fallback" = "fallback";
let refreshInFlight: Promise<void> | null = null;
const NEWS_TTL_MS = 15 * 60 * 1000;
const MAX_NEWS = 8;
const MAX_RATE_LIMIT_ENTRIES = 10_000;
const rateLimits = new Map<string, { count: number; resetAt: number }>();
const pageRoutes: Record<string, string> = {
  "/": "index.html",
  "/index.html": "index.html",
  "/about": "about.html",
  "/about/": "about.html",
  "/privacy": "privacy.html",
  "/privacy/": "privacy.html",
  "/unsubscribe": "unsubscribe.html",
  "/unsubscribe/": "unsubscribe.html"
};

function siteOrigin(request: Request): string {
  return SITE_URL || new URL(request.url).origin;
}

function json(data: unknown, headers: HeadersInit = jsonHeaders, status = 200): Response {
  return new Response(JSON.stringify(data, null, 2), { status, headers });
}

function providerPayload(origin: string) {
  return providers.map((provider) => ({
    ...provider,
    score: scoreProvider(provider),
    url: `${origin}/providers/${provider.id}/`
  }));
}

function htmlHeaders(cache = "public, max-age=300"): HeadersInit {
  return {
    "content-type": "text/html; charset=utf-8",
    "cache-control": cache,
    "x-content-type-options": "nosniff",
    "referrer-policy": "strict-origin-when-cross-origin",
    "permissions-policy": "camera=(), microphone=(), geolocation=()",
    "content-security-policy": "default-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; connect-src 'self'; font-src 'self'"
  };
}

async function renderTemplate(name: string, origin: string, request: Request): Promise<Response> {
  let html = await Bun.file(resolve(TEMPLATES_DIR, name)).text();
  if (name === "index.html") {
    html = renderHome(html, origin);
  } else {
    html = html
      .replaceAll("__SITE_URL__", htmlEscape(origin))
      .replaceAll("__TODAY__", new Date().toISOString().slice(0, 10))
      .replaceAll("__YEAR__", String(new Date().getUTCFullYear()))
      .replaceAll("__LAST_REVIEWED__", methodology.lastReviewed)
      .replaceAll("__UPDATED_DATE__", methodology.lastReviewed)
      .replaceAll("__METHODOLOGY_VERSION__", methodology.version)
      .replaceAll("__COVERAGE_CITED__", String(methodology.sourceCoverage.cited))
      .replaceAll("__COVERAGE_TOTAL__", String(methodology.sourceCoverage.total))
      .replaceAll("__INDEPENDENT_SOURCES__", String(providerSourceCoverage.independent))
      .replaceAll("__PROVIDER_COUNT__", String(providers.length));
  }
  return new Response(request.method === "HEAD" ? null : html, { headers: htmlHeaders() });
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
      if (merged.length >= 3) {
        newsCache = merged;
        newsSource = "rss";
      } else {
        newsSource = "fallback";
      }
      newsCacheAt = Date.now();
    } finally {
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
}

function notFound(): Response {
  return new Response("Not found", { status: 404, headers: { "content-type": "text/plain; charset=utf-8" } });
}

type ServerLike = { requestIP?(request: Request): { address?: string } | null };

function clientIp(request: Request, server?: ServerLike): string {
  const address = server?.requestIP?.(request)?.address;
  return address || request.headers.get("cf-connecting-ip") || request.headers.get("x-real-ip") || "unknown";
}

function rateLimit(request: Request, server?: ServerLike): boolean {
  const ip = clientIp(request, server);
  const now = Date.now();
  for (const [key, value] of rateLimits) {
    if (value.resetAt <= now) rateLimits.delete(key);
  }
  if (rateLimits.size >= MAX_RATE_LIMIT_ENTRIES) {
    const oldest = rateLimits.keys().next().value;
    if (oldest !== undefined) rateLimits.delete(oldest);
  }
  const current = rateLimits.get(ip);
  if (!current || current.resetAt <= now) {
    rateLimits.set(ip, { count: 1, resetAt: now + 10 * 60_000 });
    return false;
  }
  current.count += 1;
  return current.count > 5;
}

function isJsonRequest(request: Request): boolean {
  return (request.headers.get("content-type") ?? "").trim().toLowerCase().startsWith("application/json");
}

async function subscribe(request: Request, server?: ServerLike): Promise<Response> {
  if (!isJsonRequest(request)) return json({ ok: false, message: "Content-Type must be application/json." }, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }, 415);
  if (rateLimit(request, server)) return json({ ok: false, message: "Too many attempts. Please try again in a few minutes." }, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }, 429);
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

async function unsubscribe(request: Request, server?: ServerLike): Promise<Response> {
  if (!isJsonRequest(request)) return json({ ok: false, message: "Content-Type must be application/json." }, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }, 415);
  if (rateLimit(request, server)) return json({ ok: false, message: "Too many attempts. Please try again in a few minutes." }, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }, 429);
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 8192) return json({ ok: false, message: "Request is too large." }, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }, 413);
  let body: { email?: string; company?: string };
  try {
    body = await request.json() as typeof body;
  } catch {
    return json({ ok: false, message: "Please enter the email address used to subscribe." }, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }, 400);
  }
  if (body.company) return json({ ok: true, message: "If the address was subscribed, it has been removed." }, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
  const email = String(body.email ?? "").trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return json({ ok: false, message: "Enter a valid email address." }, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }, 400);
  }

  if (RESEND_API_KEY && RESEND_AUDIENCE_ID) {
    try {
      const response = await fetch("https://api.resend.com/audiences/" + encodeURIComponent(RESEND_AUDIENCE_ID) + "/contacts/" + encodeURIComponent(email), {
        method: "PATCH",
        headers: { authorization: "Bearer " + RESEND_API_KEY, "content-type": "application/json" },
        body: JSON.stringify({ unsubscribed: true }),
        signal: AbortSignal.timeout(4500)
      });
      if (!response.ok && response.status !== 404) {
        return json({ ok: false, message: "The mailing provider could not update this subscription. Please retry shortly." }, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }, 502);
      }
    } catch {
      return json({ ok: false, message: "The mailing provider is temporarily unavailable. Please retry shortly." }, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }, 502);
    }
  }

  db.query("DELETE FROM subscribers WHERE email = ?").run(email);
  return json({
    ok: true,
    message: RESEND_API_KEY && RESEND_AUDIENCE_ID
      ? "Your address has been unsubscribed from future Resend broadcasts and removed from the local list."
      : "Your address has been removed from the local list. Email delivery is not active unless the site owner configures a mailing provider."
  }, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
}

console.info(`GAP Index server starting on :${PORT}`);
void refreshNews();

async function handle(request: Request, server?: ServerLike): Promise<Response> {
    const url = new URL(request.url);
    let pathname: string;
    try {
      pathname = decodeURIComponent(url.pathname);
    } catch {
      return notFound();
    }
    const origin = siteOrigin(request);

    if (request.method === "GET" && pathname === "/healthz") {
      return json({ ok: true, service: "gap-index", score: currentScore, anthropicScore: currentProviderScore });
    }

    if ((request.method === "GET" || request.method === "HEAD") && pageRoutes[pathname]) {
      return renderTemplate(pageRoutes[pathname]!, origin, request);
    }

    if (request.method === "GET" && pathname === "/api/index.json") {
      return json({
        schemaVersion: "2026-10-v2",
        name: "GAP Index — AI provider scores",
        updatedAt: methodology.lastReviewed,
        anthropicScore: currentProviderScore,
        providerHeadline: currentProvider.headline,
        providerSummary: currentProvider.summary,
        score: currentScore,
        scoreDelta: currentScoreDelta,
        scoreLabel: currentScore > 50 ? "Relative Anthropic edge" : currentScore < 50 ? "Relative OpenAI edge" : "Parity",
        latestMonth: history[history.length - 1]?.label,
        scoreDirection: methodology.direction,
        methodology,
        providerSourceCoverage,
        providers: providerPayload(origin),
        history: history.map((point) => ({ ...point, url: `${origin}/history/${point.month}/` })),
        newsUrl: `${origin}/api/news.json`,
        providersUrl: `${origin}/api/providers.json`,
        feedUrl: `${origin}/feed.xml`,
        caveat: methodology.caveat
      });
    }

    if (request.method === "GET" && pathname === "/api/providers.json") {
      return json({
        schemaVersion: "2026-10-v2",
        updatedAt: methodology.lastReviewed,
        methodology,
        sourceCoverage: providerSourceCoverage,
        providers: providerPayload(origin)
      });
    }

    if (request.method === "GET" && pathname === "/api/history.json") {
      return json({
        schemaVersion: "2026-10-v2",
        updatedAt: methodology.lastReviewed,
        scoreDirection: methodology.direction,
        history: history.map((point) => ({ ...point, url: `${origin}/history/${point.month}/` }))
      });
    }

    if (request.method === "GET" && pathname === "/api/history.csv") {
      return new Response(historyCsv(), {
        headers: {
          "content-type": "text/csv; charset=utf-8",
          "content-disposition": 'attachment; filename="gap-index-history.csv"',
          "cache-control": "public, max-age=300",
          "access-control-allow-origin": "*"
        }
      });
    }

    if (request.method === "GET" && pathname === "/api/news.json") {
      void refreshNews();
      return json({
        updatedAt: newsCacheAt ? new Date(newsCacheAt).toISOString() : null,
        staleAfterSeconds: NEWS_TTL_MS / 1000,
        source: newsSource,
        stale: newsSource !== "rss" || Date.now() - newsCacheAt > NEWS_TTL_MS,
        items: newsCache
      });
    }

    if (request.method === "GET" && pathname === "/api/overview.md") {
      return new Response(buildOverview(origin, newsCache), { headers: { "content-type": "text/markdown; charset=utf-8", "cache-control": "public, max-age=60" } });
    }

    if (request.method === "GET" && pathname === "/llms.txt") {
      return new Response(buildLlmsTxt(origin), { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=300" } });
    }

    if (request.method === "GET" && pathname === "/llms-full.txt") {
      void refreshNews();
      return new Response(buildLlmsFull(origin, newsCache), { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=300" } });
    }

    if (request.method === "GET" && pathname === "/feed.xml") {
      return new Response(buildFeed(origin), { headers: { "content-type": "application/rss+xml; charset=utf-8", "cache-control": "public, max-age=300" } });
    }

    if (request.method === "GET" && pathname === "/robots.txt") {
      const body = `User-agent: *\nAllow: /\nDisallow: /api/subscribe\n\nSitemap: ${origin}/sitemap.xml\n`;
      return new Response(body, { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=3600" } });
    }

    if (request.method === "GET" && pathname === "/sitemap.xml") {
      const lastmod = methodology.lastReviewed;
      const archiveUrls = history.map((point) => `  <url><loc>${xmlEscape(origin + "/history/" + point.month + "/")}</loc><lastmod>${xmlEscape(lastmod)}</lastmod><changefreq>monthly</changefreq><priority>0.7</priority></url>`).join("\n");
      const providerUrls = providers.map((provider) => `  <url><loc>${xmlEscape(origin + "/providers/" + provider.id + "/")}</loc><lastmod>${xmlEscape(provider.lastReviewed)}</lastmod><changefreq>monthly</changefreq><priority>0.8</priority></url>`).join("\n");
      const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${xmlEscape(origin + "/")}</loc><lastmod>${xmlEscape(lastmod)}</lastmod><changefreq>weekly</changefreq><priority>1.0</priority></url>\n  <url><loc>${xmlEscape(origin + "/about/")}</loc><lastmod>${xmlEscape(lastmod)}</lastmod><changefreq>monthly</changefreq><priority>0.5</priority></url>\n${providerUrls}\n${archiveUrls}\n</urlset>`;
      return new Response(body, { headers: { "content-type": "application/xml; charset=utf-8", "cache-control": "public, max-age=3600" } });
    }

    if ((request.method === "GET" || request.method === "HEAD") && pathname.startsWith("/providers/")) {
      const providerMatch = pathname.match(/^\/providers\/([a-z0-9-]+)\/?$/);
      const provider = providerMatch ? providers.find((item) => item.id === providerMatch[1]) : undefined;
      if (!provider) return notFound();
      return new Response(request.method === "HEAD" ? null : renderProviderPage(provider, origin), { headers: htmlHeaders("public, max-age=300") });
    }

    if (request.method === "GET" || request.method === "HEAD") {
      const match = pathname.match(/^\/history\/(\d{4}-\d{2})\/?$/);
      if (match) {
        const point = history.find((item) => item.month === match[1]);
        if (!point) return notFound();
        return new Response(request.method === "HEAD" ? null : buildHistoryPage(point, origin), { headers: htmlHeaders("public, max-age=300") });
      }
    }

    if (request.method === "POST" && pathname === "/api/unsubscribe") return unsubscribe(request, server);
    if (request.method === "POST" && pathname === "/api/subscribe") return subscribe(request, server);

    if (request.method !== "GET" && request.method !== "HEAD") return new Response("Method not allowed", { status: 405, headers: { allow: "GET, HEAD, POST" } });

    const relativePath = pathname.endsWith("/") ? pathname.slice(1) + "index.html" : pathname.replace(/^\/+/, "");
    const filepath = resolve(PUBLIC_DIR, relativePath);
    if (!filepath.startsWith(PUBLIC_DIR + "/")) return notFound();
    const file = Bun.file(filepath);
    if (!(await file.exists())) return notFound();

    const headers = new Headers();
    const extension = extname(filepath).toLowerCase();
    const contentTypes: Record<string, string> = {
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
    headers.set("cache-control", extension === ".svg" ? "public, max-age=86400" : "public, max-age=3600, stale-while-revalidate=86400");
    return new Response(request.method === "HEAD" ? null : file, { headers });
  }

export default { fetch: handle, maxRequestBodySize: 16 * 1024 };
