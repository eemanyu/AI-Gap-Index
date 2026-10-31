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
import {
  deltasFromRow,
  effectiveScore,
  type ProviderState,
  type ProviderStateRow,
} from "./src/live";
import indexHtml from "./templates/index.html";
import aboutHtml from "./templates/about.html";
import privacyHtml from "./templates/privacy.html";
import unsubscribeHtml from "./templates/unsubscribe.html";

type D1RunResult = { success?: boolean; meta?: { changes?: number } };
type D1Result<T> = { results?: T[]; success?: boolean };
type D1Statement = {
  bind(...values: unknown[]): D1Statement;
  first<T = unknown>(): Promise<T | null>;
  all<T = unknown>(): Promise<D1Result<T>>;
  run(): Promise<D1RunResult>;
};
type D1Database = {
  prepare(query: string): D1Statement;
  batch(statements: D1Statement[]): Promise<unknown[]>;
};
type Assets = { fetch(request: Request): Promise<Response> };
type ExecutionContext = { waitUntil(promise: Promise<unknown>): void };

export type Env = {
  DB: D1Database;
  ASSETS: Assets;
  SITE_URL?: string;
  INGEST_TOKEN?: string;
  RESEND_API_KEY?: string;
  RESEND_AUDIENCE_ID?: string;
};

const NEWS_TTL_MS = 15 * 60 * 1000;
const MAX_NEWS = 8;
const MAX_RATE_LIMIT_ENTRIES = 10_000;
const MAX_BODY_BYTES = 8192;

const rateLimits = new Map<string, { count: number; resetAt: number }>();
let newsCache: NewsItem[] = fallbackNews;
let newsCacheAt = 0;
let newsSource: "rss" | "fallback" = "fallback";
let refreshInFlight: Promise<void> | null = null;

const jsonHeaders = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "public, max-age=60, stale-while-revalidate=300",
  "access-control-allow-origin": "*"
};
const noStoreJson = { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" };

const templates: Record<string, string> = {
  "/": indexHtml,
  "/index.html": indexHtml,
  "/about": aboutHtml,
  "/about/": aboutHtml,
  "/privacy": privacyHtml,
  "/privacy/": privacyHtml,
  "/unsubscribe": unsubscribeHtml,
  "/unsubscribe/": unsubscribeHtml
};

const feeds = [
  { query: "site:openai.com/news GPT ChatGPT Codex when:7d", fallbackPublisher: "OpenAI" },
  { query: "site:anthropic.com/news Claude Anthropic when:7d", fallbackPublisher: "Anthropic" },
  { query: "AI models agents AI industry when:7d", fallbackPublisher: "AI industry" }
];

function siteOrigin(request: Request, env: Env): string {
  return (env.SITE_URL ?? "").replace(/\/$/, "") || new URL(request.url).origin;
}

function json(data: unknown, headers: HeadersInit = jsonHeaders, status = 200): Response {
  return new Response(JSON.stringify(data, null, 2), { status, headers });
}

function notFound(): Response {
  return new Response("Not found", { status: 404, headers: { "content-type": "text/plain; charset=utf-8" } });
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

async function loadStates(env: Env): Promise<Map<string, ProviderState>> {
  try {
    const { results } = await env.DB
      .prepare("SELECT provider_id, tweet_delta, news_delta, blog_delta, summary, updated_at FROM provider_state")
      .all<ProviderStateRow>();
    const states = new Map<string, ProviderState>();
    for (const row of results ?? []) {
      const state = deltasFromRow(row);
      if (state) states.set(row.provider_id, state);
    }
    return states;
  } catch {
    return new Map();
  }
}

function scoresFromStates(states: Map<string, ProviderState>): Record<string, number> {
  const scores: Record<string, number> = {};
  for (const provider of providers) {
    scores[provider.id] = effectiveScore(scoreProvider(provider), states.get(provider.id));
  }
  return scores;
}

function providerPayload(origin: string, scores: Record<string, number>) {
  return providers.map((provider) => ({
    ...provider,
    score: scores[provider.id] ?? scoreProvider(provider),
    url: `${origin}/providers/${provider.id}/`
  }));
}

function renderPage(pathname: string, origin: string, request: Request, scores: Record<string, number>): Response {
  let html = templates[pathname]!;
  if (pathname === "/" || pathname === "/index.html") {
    html = renderHome(html, origin, scores);
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

function isJsonRequest(request: Request): boolean {
  return (request.headers.get("content-type") ?? "").trim().toLowerCase().startsWith("application/json");
}

async function readJsonBody(request: Request, invalidMessage: string): Promise<Record<string, unknown> | Response> {
  const contentLength = request.headers.get("content-length");
  if (contentLength && Number(contentLength) > MAX_BODY_BYTES) {
    return json({ ok: false, message: "Request is too large." }, noStoreJson, 413);
  }

  const reader = request.body?.getReader();
  if (!reader) return json({ ok: false, message: invalidMessage }, noStoreJson, 400);
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BODY_BYTES) {
        try { await reader.cancel(); } catch {}
        return json({ ok: false, message: "Request is too large." }, noStoreJson, 413);
      }
      chunks.push(value);
    }
  } catch {
    return json({ ok: false, message: invalidMessage }, noStoreJson, 400);
  }

  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    const body: unknown = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error("Expected a JSON object");
    return body as Record<string, unknown>;
  } catch {
    return json({ ok: false, message: invalidMessage }, noStoreJson, 400);
  }
}

function rateLimit(request: Request): boolean {
  const ip = request.headers.get("cf-connecting-ip") || "unknown";
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
    // shortcut: in-memory per isolate, so limits reset on deploy/cold start; move to D1 or KV if abuse appears.
    rateLimits.set(ip, { count: 1, resetAt: now + 10 * 60_000 });
    return false;
  }
  current.count += 1;
  return current.count > 5;
}

async function subscribe(request: Request, env: Env): Promise<Response> {
  if (!isJsonRequest(request)) return json({ ok: false, message: "Content-Type must be application/json." }, noStoreJson, 415);
  if (rateLimit(request)) return json({ ok: false, message: "Too many attempts. Please try again in a few minutes." }, noStoreJson, 429);
  const body = await readJsonBody(request, "Please submit a valid email address.");
  if (body instanceof Response) return body;
  if (body.company) return json({ ok: true, message: "Thanks." }, noStoreJson);
  const email = String(body.email ?? "").trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return json({ ok: false, message: "Enter a valid email address." }, noStoreJson, 400);
  }
  if (body.consent !== true) {
    return json({ ok: false, message: "Please confirm that you agree to receive the newsletter." }, noStoreJson, 400);
  }

  let delivery: "resend" | "local-only" = "local-only";
  if (env.RESEND_API_KEY && env.RESEND_AUDIENCE_ID) {
    try {
      const response = await fetch(`https://api.resend.com/audiences/${encodeURIComponent(env.RESEND_AUDIENCE_ID)}/contacts`, {
        method: "POST",
        headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, "content-type": "application/json" },
        body: JSON.stringify({ email, unsubscribed: false }),
        signal: AbortSignal.timeout(4500)
      });
      if (!response.ok && response.status !== 409) {
        return json({ ok: false, message: "The newsletter provider could not accept this signup. Please try again later." }, noStoreJson, 502);
      }
      delivery = "resend";
    } catch {
      return json({ ok: false, message: "The newsletter provider is temporarily unavailable. Please try again later." }, noStoreJson, 502);
    }
  }

  const createdAt = new Date().toISOString();
  try {
    await env.DB
      .prepare("INSERT OR IGNORE INTO subscribers(email, consent, created_at, source) VALUES (?, 1, ?, 'homepage')")
      .bind(email, createdAt)
      .run();
  } catch {
    return json({ ok: false, message: "Storage is temporarily unavailable. Please try again later." }, noStoreJson, 503);
  }
  return json({
    ok: true,
    delivery,
    message: delivery === "resend"
      ? "You're on the list. Watch your inbox for the next GAP Index briefing."
      : "Your address was saved on this server, but newsletter delivery is not configured yet. The site owner must connect a mailing provider before emails can be sent."
  }, noStoreJson);
}

async function unsubscribe(request: Request, env: Env): Promise<Response> {
  if (!isJsonRequest(request)) return json({ ok: false, message: "Content-Type must be application/json." }, noStoreJson, 415);
  if (rateLimit(request)) return json({ ok: false, message: "Too many attempts. Please try again in a few minutes." }, noStoreJson, 429);
  const body = await readJsonBody(request, "Please enter the email address used to subscribe.");
  if (body instanceof Response) return body;
  if (body.company) return json({ ok: true, message: "If the address was subscribed, it has been removed." }, noStoreJson);
  const email = String(body.email ?? "").trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return json({ ok: false, message: "Enter a valid email address." }, noStoreJson, 400);
  }

  if (env.RESEND_API_KEY && env.RESEND_AUDIENCE_ID) {
    try {
      const response = await fetch("https://api.resend.com/audiences/" + encodeURIComponent(env.RESEND_AUDIENCE_ID) + "/contacts/" + encodeURIComponent(email), {
        method: "PATCH",
        headers: { authorization: "Bearer " + env.RESEND_API_KEY, "content-type": "application/json" },
        body: JSON.stringify({ unsubscribed: true }),
        signal: AbortSignal.timeout(4500)
      });
      if (!response.ok && response.status !== 404) {
        return json({ ok: false, message: "The mailing provider could not update this subscription. Please retry shortly." }, noStoreJson, 502);
      }
    } catch {
      return json({ ok: false, message: "The mailing provider is temporarily unavailable. Please retry shortly." }, noStoreJson, 502);
    }
  }

  try {
    await env.DB.prepare("DELETE FROM subscribers WHERE email = ?").bind(email).run();
  } catch {
    return json({ ok: false, message: "Storage is temporarily unavailable. Please try again later." }, noStoreJson, 503);
  }
  return json({
    ok: true,
    message: env.RESEND_API_KEY && env.RESEND_AUDIENCE_ID
      ? "Your address has been unsubscribed from future Resend broadcasts and removed from the local list."
      : "Your address has been removed from the local list. Email delivery is not active unless the site owner configures a mailing provider."
  }, noStoreJson);
}

function safeEqual(a: string, b: string): boolean {
  const length = Math.max(a.length, b.length);
  let diff = a.length ^ b.length;
  for (let index = 0; index < length; index += 1) {
    diff |= (a.charCodeAt(index) || 0) ^ (b.charCodeAt(index) || 0);
  }
  return diff === 0;
}

function authorized(request: Request, env: Env): boolean {
  if (!env.INGEST_TOKEN) return false;
  const header = request.headers.get("authorization") ?? "";
  if (!header.startsWith("Bearer ")) return false;
  return safeEqual(header.slice(7), env.INGEST_TOKEN);
}

type SignalItem = { title: string; url: string; publishedAt: string };

function parseSignalItems(raw: unknown): SignalItem[] | null {
  if (raw === undefined) return [];
  if (!Array.isArray(raw) || raw.length > 20) return null;
  const items: SignalItem[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== "object") return null;
    const item = entry as { title?: unknown; url?: unknown; publishedAt?: unknown };
    const url = typeof item.url === "string" ? cleanUrl(item.url) : null;
    if (!url) return null;
    items.push({
      title: typeof item.title === "string" ? item.title.slice(0, 300) : "",
      url,
      publishedAt: typeof item.publishedAt === "string" ? item.publishedAt : ""
    });
  }
  return items;
}

async function stateFor(env: Env, providerId: string): Promise<ProviderState | null> {
  return deltasFromRow(await env.DB
    .prepare("SELECT provider_id, tweet_delta, news_delta, blog_delta, summary, updated_at FROM provider_state WHERE provider_id = ?")
    .bind(providerId)
    .first<ProviderStateRow>());
}

async function ingestSignal(request: Request, env: Env): Promise<Response> {
  if (!authorized(request, env)) return json({ ok: false, message: "Unauthorized." }, noStoreJson, 401);
  if (!isJsonRequest(request)) return json({ ok: false, message: "Content-Type must be application/json." }, noStoreJson, 415);
  const body = await readJsonBody(request, "Invalid JSON.");
  if (body instanceof Response) return body;

  const providerId = typeof body.providerId === "string" ? body.providerId : "";
  const provider = providers.find((item) => item.id === providerId);
  if (!provider) return json({ ok: false, message: "Unknown providerId." }, noStoreJson, 400);
  const source = body.source;
  if (source !== "tweets" && source !== "news" && source !== "blog") {
    return json({ ok: false, message: "source must be tweets, news or blog." }, noStoreJson, 400);
  }
  const delta = body.delta;
  if (!Number.isInteger(delta) || (delta as number) < -5 || (delta as number) > 5) {
    return json({ ok: false, message: "delta must be an integer from -5 to 5." }, noStoreJson, 400);
  }
  const summary = body.summary === undefined ? "" : body.summary;
  if (typeof summary !== "string" || summary.length > 500) {
    return json({ ok: false, message: "summary must be a string of at most 500 characters." }, noStoreJson, 400);
  }
  const items = parseSignalItems(body.items);
  if (!items) return json({ ok: false, message: "items must be at most 20 entries with http(s) URLs." }, noStoreJson, 400);

  const now = new Date().toISOString();
  try {
    let freshItems = items;
    if (body.dedupe === true && items.length > 0) {
      const existing = await env.DB
        .prepare(`SELECT url FROM seen_posts WHERE provider_id = ? AND url IN (${items.map(() => "?").join(",")})`)
        .bind(provider.id, ...items.map((item) => item.url))
        .all<{ url: string }>();
      const seen = new Set((existing.results ?? []).map((row) => row.url));
      freshItems = items.filter((item) => {
        if (seen.has(item.url)) return false;
        seen.add(item.url);
        return true;
      });
      if (freshItems.length === 0) {
        return json({
          ok: true,
          applied: false,
          reason: "duplicate",
          effectiveScore: effectiveScore(scoreProvider(provider), await stateFor(env, provider.id))
        });
      }
    }

    const stateColumn = source === "tweets" ? "tweet_delta" : source === "news" ? "news_delta" : "blog_delta";
    const deltas = source === "tweets" ? [delta, 0, 0] : source === "news" ? [0, delta, 0] : [0, 0, delta];
    const statements = [
      env.DB
        .prepare("INSERT INTO provider_signals(provider_id, source, delta, summary, items, created_at) VALUES (?, ?, ?, ?, ?, ?)")
        .bind(provider.id, source, delta, summary, JSON.stringify(items), now),
      env.DB
        .prepare(`INSERT INTO provider_state(provider_id, tweet_delta, news_delta, blog_delta, summary, updated_at)
          VALUES (?, ?, ?, ?, ?, ?)
          ON CONFLICT(provider_id) DO UPDATE SET
            ${stateColumn} = excluded.${stateColumn},
            summary = COALESCE(NULLIF(excluded.summary, ''), provider_state.summary),
            updated_at = excluded.updated_at`)
        .bind(provider.id, ...deltas, summary, now),
      ...(body.dedupe === true ? freshItems.map((item) => env.DB
        .prepare("INSERT OR IGNORE INTO seen_posts(provider_id, url, title, published_at, first_seen_at) VALUES (?, ?, ?, ?, ?)")
        .bind(provider.id, item.url, item.title, item.publishedAt, now)) : [])
    ];
    await env.DB.batch(statements);

    return json({
      ok: true,
      applied: true,
      providerId: provider.id,
      source,
      delta,
      effectiveScore: effectiveScore(scoreProvider(provider), await stateFor(env, provider.id))
    });
  } catch {
    return json({ ok: false, message: "Storage is temporarily unavailable. Please try again later." }, noStoreJson, 503);
  }
}

type SignalRow = {
  id: number;
  provider_id: string;
  source: string;
  delta: number;
  summary: string;
  items: string;
  created_at: string;
};

function storedItems(value: string): unknown[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function signalsJson(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const providerId = url.searchParams.get("providerId") ?? "";
  if (providerId && !providers.some((provider) => provider.id === providerId)) {
    return json({ ok: false, message: "Unknown providerId." }, jsonHeaders, 400);
  }
  const requestedLimit = Number(url.searchParams.get("limit") ?? "20");
  const limit = Number.isInteger(requestedLimit) && requestedLimit > 0 ? Math.min(requestedLimit, 100) : 20;
  const base = "SELECT id, provider_id, source, delta, summary, items, created_at FROM provider_signals";
  try {
    const statement = providerId
      ? env.DB.prepare(base + " WHERE provider_id = ? ORDER BY created_at DESC, id DESC LIMIT ?").bind(providerId, limit)
      : env.DB.prepare(base + " ORDER BY created_at DESC, id DESC LIMIT ?").bind(limit);
    const { results } = await statement.all<SignalRow>();
    return json({
      providerId: providerId || null,
      limit,
      signals: (results ?? []).map((row) => ({
        id: row.id,
        providerId: row.provider_id,
        source: row.source,
        delta: row.delta,
        summary: row.summary,
        items: storedItems(row.items),
        createdAt: row.created_at
      }))
    });
  } catch {
    return json({ ok: false, message: "Storage is temporarily unavailable. Please try again later." }, jsonHeaders, 503);
  }
}

async function stateJson(env: Env): Promise<Response> {
  const states = await loadStates(env);
  const updatedAt = [...states.values()].map((state) => state.updatedAt).sort().at(-1) ?? methodology.lastReviewed;
  return json({
    updatedAt,
    providers: providers.map((provider) => {
      const baseScore = scoreProvider(provider);
      const state = states.get(provider.id);
      return {
        id: provider.id,
        baseScore,
        tweetDelta: state?.tweetDelta ?? 0,
        newsDelta: state?.newsDelta ?? 0,
        blogDelta: state?.blogDelta ?? 0,
        effectiveScore: effectiveScore(baseScore, state),
        summary: state?.summary ?? "",
        updatedAt: state?.updatedAt ?? null
      };
    })
  });
}

async function handle(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  const url = new URL(request.url);
  let pathname: string;
  try {
    pathname = decodeURIComponent(url.pathname);
  } catch {
    return notFound();
  }
  if (pathname.includes("..") || pathname.includes("\0")) return notFound();
  const origin = siteOrigin(request, env);
  const method = request.method;

  if (method === "GET" && pathname === "/healthz") {
    return json({ ok: true, service: "gap-index", score: currentScore, anthropicScore: currentProviderScore });
  }

  if ((method === "GET" || method === "HEAD") && templates[pathname]) {
    const scores = pathname === "/" || pathname === "/index.html"
      ? scoresFromStates(await loadStates(env))
      : {};
    return renderPage(pathname, origin, request, scores);
  }

  if (method === "GET" && pathname === "/api/index.json") {
    const scores = scoresFromStates(await loadStates(env));
    return json({
      schemaVersion: "2026-10-v2",
      name: "GAP Index — AI provider scores",
      updatedAt: methodology.lastReviewed,
      anthropicScore: scores.anthropic ?? currentProviderScore,
      providerHeadline: currentProvider.headline,
      providerSummary: currentProvider.summary,
      score: currentScore,
      scoreDelta: currentScoreDelta,
      scoreLabel: currentScore > 50 ? "Relative Anthropic edge" : currentScore < 50 ? "Relative OpenAI edge" : "Parity",
      latestMonth: history[history.length - 1]?.label,
      scoreDirection: methodology.direction,
      methodology,
      providerSourceCoverage,
      providers: providerPayload(origin, scores),
      history: history.map((point) => ({ ...point, url: `${origin}/history/${point.month}/` })),
      newsUrl: `${origin}/api/news.json`,
      providersUrl: `${origin}/api/providers.json`,
      feedUrl: `${origin}/feed.xml`,
      caveat: methodology.caveat
    });
  }

  if (method === "GET" && pathname === "/api/providers.json") {
    const scores = scoresFromStates(await loadStates(env));
    return json({
      schemaVersion: "2026-10-v2",
      updatedAt: methodology.lastReviewed,
      methodology,
      sourceCoverage: providerSourceCoverage,
      providers: providerPayload(origin, scores)
    });
  }

  if (method === "GET" && pathname === "/api/history.json") {
    return json({
      schemaVersion: "2026-10-v2",
      updatedAt: methodology.lastReviewed,
      scoreDirection: methodology.direction,
      history: history.map((point) => ({ ...point, url: `${origin}/history/${point.month}/` }))
    });
  }

  if (method === "GET" && pathname === "/api/history.csv") {
    return new Response(historyCsv(), {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": 'attachment; filename="gap-index-history.csv"',
        "cache-control": "public, max-age=300",
        "access-control-allow-origin": "*"
      }
    });
  }

  if (method === "GET" && pathname === "/api/news.json") {
    ctx.waitUntil(refreshNews());
    return json({
      updatedAt: newsCacheAt ? new Date(newsCacheAt).toISOString() : null,
      staleAfterSeconds: NEWS_TTL_MS / 1000,
      source: newsSource,
      stale: newsSource !== "rss" || Date.now() - newsCacheAt > NEWS_TTL_MS,
      items: newsCache
    });
  }

  if (method === "GET" && pathname === "/api/state.json") return stateJson(env);
  if (method === "GET" && pathname === "/api/signals.json") return signalsJson(request, env);

  if (method === "GET" && pathname === "/api/overview.md") {
    return new Response(buildOverview(origin, newsCache), { headers: { "content-type": "text/markdown; charset=utf-8", "cache-control": "public, max-age=60" } });
  }

  if (method === "GET" && pathname === "/llms.txt") {
    return new Response(buildLlmsTxt(origin), { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=300" } });
  }

  if (method === "GET" && pathname === "/llms-full.txt") {
    ctx.waitUntil(refreshNews());
    return new Response(buildLlmsFull(origin, newsCache), { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=300" } });
  }

  if (method === "GET" && pathname === "/feed.xml") {
    return new Response(buildFeed(origin), { headers: { "content-type": "application/rss+xml; charset=utf-8", "cache-control": "public, max-age=300" } });
  }

  if (method === "GET" && pathname === "/robots.txt") {
    const body = `User-agent: *\nAllow: /\nDisallow: /api/subscribe\n\nSitemap: ${origin}/sitemap.xml\n`;
    return new Response(body, { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=3600" } });
  }

  if (method === "GET" && pathname === "/sitemap.xml") {
    const lastmod = methodology.lastReviewed;
    const archiveUrls = history.map((point) => `  <url><loc>${xmlEscape(origin + "/history/" + point.month + "/")}</loc><lastmod>${xmlEscape(lastmod)}</lastmod><changefreq>monthly</changefreq><priority>0.7</priority></url>`).join("\n");
    const providerUrls = providers.map((provider) => `  <url><loc>${xmlEscape(origin + "/providers/" + provider.id + "/")}</loc><lastmod>${xmlEscape(provider.lastReviewed)}</lastmod><changefreq>monthly</changefreq><priority>0.8</priority></url>`).join("\n");
    const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${xmlEscape(origin + "/")}</loc><lastmod>${xmlEscape(lastmod)}</lastmod><changefreq>weekly</changefreq><priority>1.0</priority></url>\n  <url><loc>${xmlEscape(origin + "/about/")}</loc><lastmod>${xmlEscape(lastmod)}</lastmod><changefreq>monthly</changefreq><priority>0.5</priority></url>\n${providerUrls}\n${archiveUrls}\n</urlset>`;
    return new Response(body, { headers: { "content-type": "application/xml; charset=utf-8", "cache-control": "public, max-age=3600" } });
  }

  if ((method === "GET" || method === "HEAD") && pathname.startsWith("/providers/")) {
    const providerMatch = pathname.match(/^\/providers\/([a-z0-9-]+)\/?$/);
    const provider = providerMatch ? providers.find((item) => item.id === providerMatch[1]) : undefined;
    if (!provider) return notFound();
    const scores = scoresFromStates(await loadStates(env));
    return new Response(method === "HEAD" ? null : renderProviderPage(provider, origin, scores[provider.id]), { headers: htmlHeaders("public, max-age=300") });
  }

  if (method === "GET" || method === "HEAD") {
    const match = pathname.match(/^\/history\/(\d{4}-\d{2})\/?$/);
    if (match) {
      const point = history.find((item) => item.month === match[1]);
      if (!point) return notFound();
      return new Response(method === "HEAD" ? null : buildHistoryPage(point, origin), { headers: htmlHeaders("public, max-age=300") });
    }
  }

  if (method === "POST" && pathname === "/api/signals") return ingestSignal(request, env);
  if (method === "POST" && pathname === "/api/unsubscribe") return unsubscribe(request, env);
  if (method === "POST" && pathname === "/api/subscribe") return subscribe(request, env);

  if (method !== "GET" && method !== "HEAD") return new Response("Method not allowed", { status: 405, headers: { allow: "GET, HEAD, POST" } });

  const asset = await env.ASSETS.fetch(request);
  return asset.status === 404 ? notFound() : asset;
}

export default {
  fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    return handle(request, env, ctx);
  }
};
