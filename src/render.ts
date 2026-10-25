import {
  currentProvider,
  currentProviderScore,
  currentScore,
  currentScoreDelta,
  fallbackNews,
  history,
  methodology,
  providerLabel,
  providerSourceCoverage,
  providers,
  scoreProvider,
  type HistoryPoint,
  type NewsItem,
  type Provider,
  type Source
} from "./data";

export function esc(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function providerPath(id: string): string {
  return `/providers/${id}/`;
}

function monthParts(label: string): { month: string; year: string } {
  const [month = "", year = ""] = label.split(" ");
  return { month: month.slice(0, 3).toUpperCase(), year: year.slice(-2) };
}

function longDate(date: string): string {
  const parsed = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return date;
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }).format(parsed);
}

function newsDate(date: string): string {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "2-digit", year: "numeric", timeZone: "UTC" }).format(parsed).toUpperCase();
}

function scoreLabel(score: number): string {
  return providerLabel(score);
}

function gapLabel(score: number): string {
  if (score >= 70) return "Clear Anthropic edge";
  if (score > 50) return "Slight Anthropic edge";
  if (score === 50) return "Editorial parity";
  if (score >= 30) return "Slight OpenAI edge";
  return "Clear OpenAI edge";
}

function sourceLinks(sources: Source[]): string {
  return sources
    .map((source) => `<a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">${esc(source.title)} <span aria-hidden="true">↗</span></a>`)
    .join("");
}

function smallGauge(provider: Provider, score: number): string {
  const angle = (score * 1.8 - 180).toFixed(1);
  const dash = ((score / 100) * Math.PI * 50).toFixed(2);
  return `<svg viewBox="0 0 120 70" aria-hidden="true" focusable="false">
    <path d="M 10 60 A 50 50 0 0 1 110 60" fill="none" stroke="#e7e6df" stroke-width="8" stroke-linecap="round"/>
    <path d="M 10 60 A 50 50 0 0 1 110 60" fill="none" stroke="${esc(provider.color)}" stroke-width="8" stroke-linecap="round" stroke-dasharray="${dash} 157.08"/>
    <g transform="rotate(${angle} 60 60)"><path d="M60 60 L99 60" stroke="#171912" stroke-width="2.4" stroke-linecap="round"/></g>
    <circle cx="60" cy="60" r="4.5" fill="#171912"/><circle cx="60" cy="60" r="1.8" fill="#f4f3ee"/>
  </svg>`;
}

export function renderProviderRows(): string {
  return providers
    .map((provider) => {
      const score = scoreProvider(provider);
      return `<a class="provider-row" href="${esc(providerPath(provider.id))}" data-provider="${esc(provider.id)}" aria-label="${esc(provider.name)}: ${score} out of 100, ${esc(scoreLabel(score))}">
        <span class="provider-gauge" aria-hidden="true">${smallGauge(provider, score)}</span>
        <span class="provider-name">${esc(provider.name)}<small>${esc(provider.shortName)}</small></span>
        <span class="provider-score">${score}<small>/100</small></span>
        <span class="provider-status">${esc(scoreLabel(score))}</span>
      </a>`;
    })
    .join("");
}

export function renderHistoryBars(): string {
  const currentMonth = history.at(-1)?.month;
  return history
    .map((point) => {
      const { month, year } = monthParts(point.label);
      const selected = point.month === currentMonth;
      return `<button class="history-bar${selected ? " is-selected" : ""}" type="button" data-month="${esc(point.month)}" aria-label="${esc(point.label)}, score ${point.score}" aria-pressed="${selected}"><span class="bar-value">${point.score}</span><span class="bar-track"><i style="height:${point.score}%"></i></span><span class="bar-month">${esc(month)}</span><span class="bar-year">${esc(year)}</span></button>`;
    })
    .join("");
}

export function renderTimeline(): string {
  const currentMonth = history.at(-1)?.month;
  return history
    .map((point) => {
      const { month, year } = monthParts(point.label);
      const current = point.month === currentMonth;
      return `<article class="timeline-entry${current ? " is-current" : ""}" id="history-${esc(point.month)}">
        <details${current ? " open" : ""}>
          <summary><span class="timeline-date">${esc(month)} <b>20${esc(year)}</b></span><span class="timeline-score">${point.score}<span>/100</span></span><span class="timeline-title">${esc(point.phase)}</span><span class="timeline-phase">${esc(current ? "Current reading" : gapLabel(point.score))}</span></summary>
          <div class="timeline-content"><p>${esc(point.summary)}</p><h4>Anthropic / Claude signal</h4><p>${esc(point.anthropicSignal)}</p><h4>OpenAI / ChatGPT counterweight</h4><p>${esc(point.openaiSignal)}</p><h4>Sources</h4>${sourceLinks(point.sources)}</div>
        </details>
      </article>`;
    })
    .join("");
}

export function renderSelectedMonth(point: HistoryPoint = history.at(-1)!): string {
  return `<div class="selected-month-main">
      <span class="selected-kicker">SELECTED MONTH · ${esc(point.label).toUpperCase()}</span>
      <h3>${esc(point.phase)}</h3>
      <p>${esc(point.summary)}</p>
    </div>
    <div class="selected-month-score"><span>GAP SCORE</span><strong>${point.score}<small>/100</small></strong><span class="mini-status">${esc(gapLabel(point.score))}</span></div>
    <div class="selected-month-sources"><span class="selected-kicker">KEY SOURCES</span>${sourceLinks(point.sources.slice(0, 3))}</div>`;
}

export function renderNewsCards(items: NewsItem[] = fallbackNews): string {
  return items
    .slice(0, 3)
    .map((item, index) => {
      const url = /^https?:\/\//i.test(item.url) ? item.url : "#";
      const tagClass = /anthropic|claude/i.test(`${item.publisher} ${item.title}`) ? "tag-anthropic" : "tag-openai";
      return `<article class="news-card${index === 0 ? " news-featured" : ""}">
        <div class="news-card-top"><span class="news-tag ${tagClass}">${esc(item.publisher).toUpperCase()}</span><time datetime="${esc(item.publishedAt)}">${esc(newsDate(item.publishedAt))}</time></div>
        <h3><a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(item.title)}</a></h3>
        <p>${esc(item.summary)}</p>
        <div class="news-card-bottom"><span>${esc(item.category).toUpperCase()}</span><a href="${esc(url)}" target="_blank" rel="noopener noreferrer">READ STORY <span aria-hidden="true">↗</span></a></div>
      </article>`;
    })
    .join("");
}

function siteHeader(): string {
  return `<header class="site-header"><a class="brand" href="/" aria-label="GAP Index home"><span class="brand-mark" aria-hidden="true"><span></span><span></span><span></span></span><span class="brand-name">GAP<span>/</span>INDEX</span></a><nav class="primary-nav" aria-label="Main navigation"><a href="/">Current index</a><a href="/#field">The field</a><a href="/#methodology">Methodology</a></nav><a class="header-cta" href="/about/">About <span aria-hidden="true">↗</span></a></header>`;
}

function siteFooter(): string {
  return `<footer class="site-footer"><div class="footer-bottom"><span>GAP Index · Independent editorial project.</span><span>Not affiliated with Anthropic or OpenAI.</span><a href="/about/">About &amp; corrections</a></div></footer>`;
}

export function renderProviderPage(provider: Provider, origin: string): string {
  const score = scoreProvider(provider);
  const url = `${origin}${providerPath(provider.id)}`;
  const factors = methodology.factors
    .map((factor) => {
      const value = provider.factors[factor.key];
      const contribution = ((value * factor.weight) / 100).toFixed(1);
      return `<tr><th scope="row">${esc(factor.label)}</th><td>${value}/100</td><td>${factor.weight}%</td><td>${contribution}</td></tr>`;
    })
    .join("");
  const sources = provider.sources
    .map((source) => `<li><a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">${esc(source.title)}</a><span>${esc(source.publisher)} · ${esc(source.date)} · ${esc(source.type ?? "primary")}</span></li>`)
    .join("");
  const structured = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `${provider.name} — GAP Index provider score`,
    description: provider.summary,
    url,
    isPartOf: { "@type": "WebSite", name: "GAP Index", url: `${origin}/` },
    about: provider.name,
    dateModified: provider.lastReviewed
  }).replaceAll("<", "\\u003c");

  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
    <title>${esc(provider.name)} provider score — GAP Index</title>
    <meta name="description" content="${esc(provider.summary.slice(0, 155))}">
    <meta name="robots" content="index,follow,max-image-preview:large">
    <link rel="canonical" href="${esc(url)}"><link rel="stylesheet" href="/styles.css"><link rel="icon" href="/favicon.svg" type="image/svg+xml">
    <meta property="og:type" content="article"><meta property="og:title" content="${esc(provider.name)} provider score — GAP Index"><meta property="og:description" content="${esc(provider.headline)}"><meta property="og:url" content="${esc(url)}">
    <script type="application/ld+json">${structured}</script></head><body>
    <div class="site-shell">${siteHeader()}<main class="archive-body">
      <a class="archive-back" href="/#field">← All providers</a>
      <div class="archive-label">Provider score · ${esc(provider.name)}</div>
      <h1>${esc(provider.headline)}</h1>
      <p class="archive-subtitle">${esc(provider.summary)}</p>
      <div class="archive-score"><strong>${score}<small>/100</small></strong><span><b>${esc(scoreLabel(score))}</b><br>Editorial provider score · ${esc(longDate(provider.lastReviewed))}<br>0 = weak · 50 = mid-field · 100 = category-leading</span></div>
      <section class="archive-panel"><h2>How the score is built</h2><p>Each factor is scored 0–100, then weighted. This is the same framework for every provider in the index.</p>
      <table class="factor-table"><thead><tr><th scope="col">Factor</th><th scope="col">Score</th><th scope="col">Weight</th><th scope="col">Contribution</th></tr></thead><tbody>${factors}</tbody></table>
      <p class="archive-subtitle">Weighted total: ${score}/100. See the <a href="/about/#methodology">methodology</a> for definitions and caveats.</p></section>
      <h2>Sources</h2><ul class="archive-sources">${sources}</ul>
      <p class="archive-subtitle">Primary sources are the provider's own pricing/news pages. Independent sources are third-party benchmarks, traffic estimates, or developer surveys. They are context, not a claim that every statement is audited.</p>
      <nav class="archive-nav" aria-label="Provider navigation"><a href="/#field">← All providers</a><a href="/">Current index →</a></nav>
    </main>${siteFooter()}</div></body></html>`;
}

export function renderHome(template: string, origin: string): string {
  const currentMonth = history.at(-1)!;
  const delta = currentScoreDelta;
  const deltaIcon = delta > 0 ? "↗" : delta < 0 ? "↘" : "→";
  const deltaText = `${delta > 0 ? "+" : ""}${delta}`;
  const replacements: Record<string, string> = {
    __SITE_URL__: origin,
    __TODAY__: new Date().toISOString().slice(0, 10),
    __YEAR__: String(new Date().getUTCFullYear()),
    __UPDATED_DATE__: longDate(methodology.lastReviewed),
    __LAST_REVIEWED__: methodology.lastReviewed,
    __METHODOLOGY_VERSION__: methodology.version,
    __MAIN_SCORE__: String(currentProviderScore),
    __MAIN_NAME__: currentProvider.name,
    __MAIN_SHORT__: currentProvider.shortName,
    __MAIN_HEADLINE__: currentProvider.headline,
    __MAIN_SUMMARY__: currentProvider.summary,
    __MAIN_STATUS__: scoreLabel(currentProviderScore),
    __MAIN_NEEDLE__: (currentProviderScore * 1.8 - 180).toFixed(1),
    __GAP_SCORE__: String(currentScore),
    __GAP_DELTA__: deltaText,
    __GAP_DELTA_ICON__: deltaIcon,
    __COVERAGE_CITED__: String(methodology.sourceCoverage.cited),
    __COVERAGE_TOTAL__: String(methodology.sourceCoverage.total),
    __MONTH_COUNT__: String(history.length),
    __MONTH_RANGE__: `${history[0]?.label} — ${currentMonth.label}`,
    __LATEST_MONTH__: currentMonth.label,
    __PROVIDER_COUNT__: String(providers.length),
    __INDEPENDENT_SOURCES__: String(providerSourceCoverage.independent),
    __PROVIDER_ROWS__: renderProviderRows(),
    __HISTORY_BARS__: renderHistoryBars(),
    __SELECTED_MONTH__: renderSelectedMonth(),
    __TIMELINE__: renderTimeline(),
    __NEWS_CARDS__: renderNewsCards()
  };
  let html = template;
  for (const [token, value] of Object.entries(replacements)) html = html.replaceAll(token, value);
  return html;
}
