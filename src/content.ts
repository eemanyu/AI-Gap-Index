import {
  currentProviderScore,
  currentScore,
  history,
  methodology,
  providerSourceCoverage,
  providers,
  scoreProvider,
  type HistoryPoint,
  type NewsItem
} from "./data";

export function xmlEscape(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&apos;");
}

export function htmlEscape(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}

export function historyCsv(): string {
  const rows = [["month", "label", "score", "phase", "summary", "sources"]];
  for (const point of history) {
    rows.push([
      point.month,
      point.label,
      String(point.score),
      point.phase,
      point.summary,
      point.sources.map((source) => source.url).join(" | ")
    ]);
  }
  return rows.map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(",")).join("\n") + "\n";
}

export function buildOverview(origin: string, news: NewsItem[] = []): string {
  const selected = history[history.length - 1]!;
  const headlines = news.length
    ? `\n\n## Current headlines\n${news.map((item) => `- [${item.title}](${item.url}) — ${item.publisher}, ${item.publishedAt.slice(0, 10)}. ${item.summary}`).join("\n")}`
    : "";
  return `# GAP Index — AI provider scores

> Editorial, source-linked comparison of AI provider attractiveness, plus a monthly Anthropic vs OpenAI GAP history.

- Anthropic provider score: **${currentProviderScore}/100**
- GAP vs. OpenAI: **${currentScore}/100** (${currentScore > 50 ? "relative Anthropic edge" : currentScore < 50 ? "relative OpenAI edge" : "parity"})
- Providers covered: **${providers.length}**
- Monthly source coverage: **${methodology.sourceCoverage.cited}/${methodology.sourceCoverage.total} points linked**
- Independent provider sources: **${providerSourceCoverage.independent}/${providerSourceCoverage.total}**
- Latest editorial month: **${selected.label}**
- Methodology: **${methodology.version}**, last reviewed **${methodology.lastReviewed}**
- Main JSON: [api/index.json](${origin}/api/index.json)
- Provider JSON: [api/providers.json](${origin}/api/providers.json)
- History JSON: [api/history.json](${origin}/api/history.json)
- Recent headlines: [api/news.json](${origin}/api/news.json)

## Provider scores
${providers.map((provider) => `- **${provider.name} (${provider.shortName}): ${scoreProvider(provider)}/100** — ${provider.headline} Sources: ${provider.sources.map((source) => source.url).join(" | ")}`).join("\n")}

## Score direction
${methodology.direction}

## Weights
${methodology.weights.map((item) => `- ${item.factor}: ${item.weight}%`).join("\n")}

## Important caveat
${methodology.caveat}

## Historical GAP readings
${history.map((point) => `- **${point.label}: ${point.score}/100** — ${point.summary} Sources: ${point.sources.map((source) => source.url).join(" | ")}`).join("\n\n")}

## Editorial scope
We compare published subscription information, model capabilities, coding/agent workflows, integrations, and distribution signals. Provider scores are absolute; the GAP vs. OpenAI is relative. Plan prices and limits can change; verify current terms on official provider websites before making a purchase.${headlines}
`;
}

export function buildLlmsTxt(origin: string): string {
  return `# GAP Index
> Independent editorial tracker scoring ten AI providers and keeping a monthly Anthropic vs OpenAI GAP history.

Provider scores are absolute editorial assessments (0–100). The GAP vs. OpenAI is relative: 50 = parity, above 50 tilts toward Anthropic, below 50 tilts toward OpenAI. Neither is a representative poll or audited market-share metric.

## Canonical resources
- [Homepage](${origin}/): provider gauges, latest news, GAP history, methodology.
- [Index data JSON](${origin}/api/index.json): provider scores, methodology and history.
- [Provider JSON](${origin}/api/providers.json): all ten provider factor breakdowns and sources.
- [History JSON](${origin}/api/history.json): monthly GAP readings from December 2025 onward.
- [History CSV](${origin}/api/history.csv): flat monthly history export.
- [Latest news JSON](${origin}/api/news.json): recent headlines from cached RSS searches.
- [RSS feed](${origin}/feed.xml): monthly GAP updates.
- [Full overview](${origin}/llms-full.txt): expanded notes and all provider summaries.
- [Markdown overview](${origin}/api/overview.md): plain-text summary of the index.
- [About, methodology and corrections](${origin}/about/): editorial policy and changelog.

## Providers
${providers.map((provider) => `- [${provider.name} (${provider.shortName})](${origin}/providers/${provider.id}/) — ${scoreProvider(provider)}/100. ${provider.headline}`).join("\n")}

## Monthly GAP archive
${history.map((point) => `- [${point.label} editorial score (${point.score}/100)](${origin}/history/${point.month}/) — ${point.phase}`).join("\n")}

## Recommended agent usage
1. Read the provider score direction and caveat before summarizing a score.
2. Use the linked primary and independent sources for factual claims.
3. Never describe a provider score as direct audience sentiment, live subscription pricing, or market share.
4. For plan comparisons, verify current pricing and terms directly with the provider.
`;
}

export function buildLlmsFull(origin: string, news: NewsItem[] = []): string {
  return buildOverview(origin, news) + `
## Provider factor breakdowns
${providers.map((provider) => `### ${provider.name} (${provider.shortName}) — ${scoreProvider(provider)}/100
${provider.summary}
- Subscription value: ${provider.factors.subscription}/100
- Model capability: ${provider.factors.capability}/100
- Coding and agents: ${provider.factors.coding}/100
- Ecosystem and distribution: ${provider.factors.ecosystem}/100
- Detail page: ${origin}/providers/${provider.id}/
- Sources: ${provider.sources.map((source) => `${source.type ?? "primary"}: ${source.url}`).join(" | ")}`).join("\n\n")}
`;
}

export function buildFeed(origin: string): string {
  const items = history
    .slice()
    .reverse()
    .map((point) => `<item><title>${xmlEscape(`${point.label}: ${point.phase} (${point.score}/100)`)}</title><link>${xmlEscape(`${origin}/history/${point.month}/`)}</link><guid>${xmlEscape(`${origin}/history/${point.month}/`)}</guid><pubDate>${new Date(`${point.month}-01T00:00:00Z`).toUTCString()}</pubDate><description>${xmlEscape(point.summary)}</description></item>`)
    .join("");
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel><title>GAP Index monthly updates</title><link>${xmlEscape(origin + "/")}</link><description>Editorial provider scores and the monthly Anthropic vs OpenAI GAP history.</description><language>en</language><lastBuildDate>${new Date(`${methodology.lastReviewed}T00:00:00Z`).toUTCString()}</lastBuildDate>${items}</channel></rss>`;
}

export function buildHistoryPage(point: HistoryPoint, origin: string): string {
  const scoreLabel = point.score > 50 ? "Relative Anthropic edge" : point.score < 50 ? "Relative OpenAI edge" : "Editorial parity";
  const archiveUrl = origin + "/history/" + point.month + "/";
  const pointIndex = history.findIndex((item) => item.month === point.month);
  const previous = history[pointIndex - 1];
  const next = history[pointIndex + 1];
  const sources = point.sources.map((source) => '<li><a href="' + htmlEscape(source.url) + '" rel="noopener noreferrer">' + htmlEscape(source.title) + '</a><span>' + htmlEscape(source.publisher) + ' · ' + htmlEscape(source.date) + '</span></li>').join("");
  const nav = (previous ? '<a href="' + origin + '/history/' + previous.month + '/" rel="prev">← ' + htmlEscape(previous.label) + '</a>' : '<span></span>') +
    (next ? '<a href="' + origin + '/history/' + next.month + '/" rel="next">' + htmlEscape(next.label) + ' →</a>' : '<a href="' + origin + '/" rel="up">Current index →</a>');
  const weightSentence = methodology.factors.map((factor) => `${factor.label} (${factor.weight}%)`).join(", ");
  const structured = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Article",
    headline: point.label + " GAP Index — Anthropic vs OpenAI",
    datePublished: point.month + "-01",
    dateModified: point.sources[point.sources.length - 1]?.date || point.month + "-01",
    mainEntityOfPage: archiveUrl,
    description: point.summary,
    author: { "@type": "Organization", name: "GAP Index" },
    publisher: { "@type": "Organization", name: "GAP Index" },
    citation: point.sources.map((source) => source.url),
    about: ["Anthropic", "OpenAI", "Claude subscription value", "ChatGPT ecosystem"],
    isAccessibleForFree: true
  }).replaceAll("<", "\\u003c");
  const parts = [
    '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">',
    '<title>' + htmlEscape(point.label) + ' GAP Index — Anthropic vs OpenAI | GAP Index</title>',
    '<meta name="description" content="' + htmlEscape(point.summary.slice(0, 155)) + '">',
    '<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1">',
    '<link rel="canonical" href="' + htmlEscape(archiveUrl) + '"><link rel="stylesheet" href="/styles.css"><link rel="icon" href="/favicon.svg" type="image/svg+xml">',
    '<meta property="og:type" content="article"><meta property="og:title" content="' + htmlEscape(point.label) + ' GAP Index — Anthropic vs OpenAI">',
    '<meta property="og:description" content="' + htmlEscape(point.summary.slice(0, 180)) + '"><meta property="og:url" content="' + htmlEscape(archiveUrl) + '">',
    '<meta property="og:image" content="' + htmlEscape(origin + "/og-card.svg") + '"><script type="application/ld+json">' + structured + '</script></head><body>',
    '<div class="site-shell"><header class="site-header"><a class="brand" href="/"><span class="brand-mark" aria-hidden="true"><span></span><span></span><span></span></span><span class="brand-name">GAP<span>/</span>INDEX</span></a>',
    '<nav class="primary-nav" aria-label="Main navigation"><a href="/">Current index</a><a href="/#history">History</a><a href="/#methodology">Methodology</a></nav><a class="header-cta" href="/#newsletter">Get the brief ↗</a></header>',
    '<main class="archive-body"><a class="archive-back" href="/">← Current Anthropic vs OpenAI GAP Index</a>',
    '<div class="archive-label">Monthly editorial archive · ' + htmlEscape(point.label) + '</div><h1>' + htmlEscape(point.phase) + '</h1>',
    '<p class="archive-subtitle">' + htmlEscape(point.summary) + '</p>',
    '<div class="archive-score"><strong>' + point.score + '<small>/100</small></strong><span><b>' + htmlEscape(scoreLabel) + '</b><br>Editorial score for ' + htmlEscape(point.label) + '<br>50 = parity · Not a representative poll</span></div>',
    '<section class="archive-panel"><h2>What changed in ' + htmlEscape(point.label) + '?</h2><p>' + htmlEscape(point.summary) + '</p></section>',
    '<h2>Anthropic / Claude signal</h2><div class="archive-signal"><h3>Product and ecosystem evidence</h3><p>' + htmlEscape(point.anthropicSignal) + '</p></div>',
    '<h2>OpenAI / ChatGPT counterweight</h2><div class="archive-signal"><h3>Comparative context</h3><p>' + htmlEscape(point.openaiSignal) + '</p></div>',
    '<h2>Primary sources and further reading</h2><ul class="archive-sources">' + sources + '</ul>',
    '<h2>How to interpret this score</h2><p class="archive-subtitle">The GAP Index is a directional editorial assessment based on ' + weightSentence + '. A reading above 50 tilts toward Anthropic; below 50 tilts toward OpenAI. The series is a retrospective reconstruction, not a representative audience sentiment poll, audited market-share metric, or guarantee of subscription value. See the <a href="/#methodology">full methodology</a>.</p>',
    '<nav class="archive-nav" aria-label="Monthly archive navigation">' + nav + '</nav></main>',
    '<footer class="site-footer"><div class="footer-bottom"><span>GAP Index · Independent editorial project.</span><span>Not affiliated with Anthropic or OpenAI.</span><a href="/">Current index ↑</a></div></footer></div></body></html>'
  ];
  return parts.join("");
}
