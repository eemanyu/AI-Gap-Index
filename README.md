# GAP Index — AI Provider Scores

An editorial, source-linked index scoring ten AI providers on a shared 0–100 scale, plus a separate monthly Anthropic vs OpenAI GAP history.

## Providers scored
Google, Microsoft, Meta, Amazon, OpenAI, Anthropic, Mistral AI, xAI, DeepSeek, and Kimi. Anthropic is the headline provider (73/100); the relative Anthropic vs OpenAI GAP is 52/100.

## Principles
- The first viewport is server-rendered HTML: the Anthropic gauge, the ten-provider field, and the latest curated stories remain visible without JavaScript.
- Provider scores are absolute editorial attractiveness (0 = weak, 50 = mid-field, 80–100 = category leader). The GAP vs. OpenAI is a separate relative scale (50 = parity).
- Monthly history is a **retrospective editorial assessment**, not survey data, a live market-share statistic, or investment advice. Each entry links to a primary source where available.
- "Source coverage" describes whether editorial entries have citations. It is not a claim that every statement is 100% accurate.
- Every provider has at least one primary source and at least one independent source.
- Public JSON, CSV, RSS, and Markdown endpoints make the index readable by search engines, research tools, and AI agents.

## Run locally (Bun)
```sh
bun install
cp .env.example .env
bun run dev
```

Open http://localhost:3000.

## Production (Cloudflare Workers + D1)

The production deployment is `worker.ts` on Cloudflare Workers with D1. Configuration lives in `wrangler.jsonc` (Worker `ai-gap-index`, assets binding `ASSETS`, D1 binding `DB`, HTML imported as text modules). Vercel remains a fallback with ephemeral SQLite (see below).

### First deploy

```sh
npx wrangler d1 create ai-gap-index
# copy the returned database_id into wrangler.jsonc (d1_databases[0].database_id)
npx wrangler d1 migrations apply ai-gap-index --remote
npx wrangler deploy
```

Set `SITE_URL` as a Worker variable if the canonical origin differs from the workers.dev URL. Store the ingest token as a Worker secret (never commit it):

```sh
printf '%s' "$(openssl rand -hex 32)" | npx wrangler secret put INGEST_TOKEN
```

The deploy host keeps `INGEST_URL`, `STATE_URL`, and `INGEST_TOKEN` in `/home/ubuntu/.config/ai-gap-index/ingest.env` (mode 600, outside the repo). The VPS cron scripts read that file; the token is never printed or committed.

### Automated signal jobs

On the VPS, bun run score:daily asks Grok to score recent official X posts and AI news for all ten providers. bun run watch:blogs polls official company domains through Google News RSS every 15 minutes, asks Grok to score new articles, and submits them with URL deduplication. Cron runs daily at 12:00 UTC (09:00 Sao Paulo) and polls blogs every 15 minutes; both jobs share a lock to avoid overlapping Grok runs.

Optional Resend delivery uses `RESEND_API_KEY` and `RESEND_AUDIENCE_ID` (Worker secrets or vars). Without them, signups are stored in D1 only and the UI says so.

### D1 schema

`migrations/0001_init.sql` creates `subscribers`, `provider_signals`, `provider_state`, and `seen_posts`. Apply migrations locally before `wrangler dev`:

```sh
npx wrangler d1 migrations apply ai-gap-index --local
npx wrangler dev --port 8787
```

### Live signal scores

The historical GAP series (`history[]`, `/api/history.json`, `/api/history.csv`, `/feed.xml`, the home GAP gauge) is editorial and never changes with signals. Provider scores shown on the home rows, the main Anthropic gauge, provider pages, `/api/index.json`, and `/api/providers.json` use:

```
effective = clamp(round(base + tweetDelta + newsDelta + blogDelta), 0, 100)
```

`base` is `scoreProvider(provider)` from `src/data.ts`; each source delta is stored in `provider_state` and is in `-5..5`. Signals replace that source's delta; they do not accumulate.

### Signal ingest API

`POST /api/signals` requires `Authorization: Bearer $INGEST_TOKEN`, `Content-Type: application/json`, and a body under 8 KB:

```json
{
  "providerId": "anthropic",
  "source": "tweets",
  "delta": 2,
  "summary": "Optional <=500 char note",
  "items": [{ "title": "Post", "url": "https://example.com/post", "publishedAt": "2026-10-30" }],
  "dedupe": true
}
```

- `source` is `tweets`, `news`, or `blog`; `delta` is an integer from -5 to 5.
- The new delta replaces that source's delta in `provider_state` and appends a row to `provider_signals`.
- `dedupe: true` records item URLs in `seen_posts`. If every URL was already seen for that provider, the delta is not applied and the response is `{ "ok": true, "applied": false, "reason": "duplicate", "effectiveScore": ... }`.
- Success: `{ "ok": true, "applied": true, "providerId", "source", "delta", "effectiveScore" }`.
- `GET /api/state.json` — public live state for all ten providers.
- `GET /api/signals.json?providerId=anthropic&limit=20` — recent signal rows (limit <= 100).

### Vercel fallback

`vercel.json` still builds the Bun server. SQLite lands in `/tmp/gap-index.sqlite` and is ephemeral; only `public/**`, `src/**`, and `templates/**` are bundled. Do not use the Vercel deployment for durable newsletter storage.

## Bun server (local/fallback)

```sh
bun run start
```

Set `SITE_URL` to the canonical public URL. The process renders HTML from `templates/` (tokens like `__SITE_URL__` are replaced server-side) and serves static assets from `public/`; SQLite stores newsletter signups in `data/gap-index.sqlite`; use a persistent volume in production. `data/` is not shipped to Vercel. Without a configured mailing provider, addresses are stored locally only and no newsletter email is sent. The UI explains this and includes a working unsubscribe route. Read `/privacy/` and see `.env.example`.

`POST /api/subscribe` and `POST /api/unsubscribe` require `Content-Type: application/json` (otherwise 415) and a body under 8 KB on Workers (16 KB on Bun).

## Endpoints
- `/` — server-rendered homepage (Anthropic gauge, ten-provider field, GAP history)
- `/providers/<id>/` — provider detail page with factor breakdown and sources
- `/about/` — methodology, source policy, corrections, changelog
- `/api/index.json` — current provider scores, methodology, and source-linked history
- `/api/providers.json` — all ten provider factor breakdowns and sources
- `/api/history.json` — monthly GAP history
- `/api/history.csv` — flat monthly history export
- `/feed.xml` — RSS feed of monthly GAP updates
- `/api/news.json` — recent AI headlines (cached RSS refresh with curated fallback)
- `POST /api/subscribe` and `POST /api/unsubscribe` — JSON-only newsletter endpoints (`Content-Type: application/json`, max 8 KB on Workers / 16 KB on Bun)
- `/api/state.json` — public live provider state (base score, three deltas, effective score)
- `POST /api/signals` — authenticated signal ingest (`Authorization: Bearer $INGEST_TOKEN`)
- `/api/signals.json` — recent signal rows for debugging
- `/history/<yyyy-mm>/` — monthly GAP archive page
- `/healthz` — `ok: true` health check
- `/api/overview.md` — concise Markdown summary
- `/llms.txt` — agent-facing site map and usage notes
- `/llms-full.txt` — expanded methodology, provider breakdowns, and history
- `/robots.txt` and `/sitemap.xml` — generated from `SITE_URL`, including provider and archive pages

## Methodology
Editorial baseline weights: subscription/value (30%), model capability (30%), coding and agent workflows (25%), and ecosystem/distribution (15%). Provider scores and the monthly GAP values are interpretive, directional snapshots informed by dated product launches, plan/usage changes, partnerships and credible industry reporting—not the output of a representative survey. Every scoring change should be accompanied by a short explanation and citations. Methodology version 2026-10-v2, last reviewed 2026-10-25.

## License
Project code: MIT. Third-party company names and linked news remain the property of their respective owners.