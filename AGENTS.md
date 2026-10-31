# AGENTS.md — AI-Gap-Index

Guide for coding agents and contributors. Read before editing.

## What it is

An editorial index scoring ten AI providers (Anthropic, OpenAI, Google, Microsoft, Meta, Amazon, Mistral AI, xAI, DeepSeek, Kimi) on a shared 0–100 scale, plus a separate monthly Anthropic vs OpenAI GAP history: subscription value, model capability, coding/agent workflows, and ecosystem reach.

- Score 0–100: above 50 = relative Anthropic edge; below 50 = relative OpenAI edge; 50 = parity.
- Retrospective editorial assessment, not audience sentiment, market-share statistics, or investment advice.
- "Source coverage" describes whether editorial entries have citations — not a claim of 100% accuracy.

## Quick start

```sh
bun install
cp .env.example .env
bun run dev      # bun --watch server.ts (http://localhost:3000)
bun run start    # production
bun test         # bun test
bun build server.ts --target=bun --outfile=/tmp/gap-index-server.js
npx wrangler dev --port 8787   # Cloudflare Worker (after local D1 migrations)
```

## Structure

```
server.ts          # Bun entry: routes, RSS, SQLite, static assets
worker.ts          # Cloudflare Workers entry: routes, D1, assets, signal ingest
src/data.ts        # history[], methodology, fallbackNews, currentScore
src/content.ts     # pure response builders shared by both entries
src/live.ts        # effective-score math and signal state types
src/render.ts      # server-side HTML rendering (home, provider pages)
templates/         # index.html, about.html, privacy.html, unsubscribe.html
public/            # styles.css, app.js, svgs (static assets only)
migrations/        # D1 schema (0001_init.sql)
test/              # data.test.ts, gauge.test.ts, server.test.ts, live.test.ts
wrangler.jsonc     # Cloudflare Workers + D1 + assets config
.github/workflows/ # CI (tests + build + HTTP smoke)
```

`data/` (sqlite) is local-only and gitignored.

## Architecture

- **Cloudflare Workers is the production deployment** (`worker.ts`, `wrangler.jsonc`): Workers Assets serve `public/`, D1 stores newsletter signups and live signals, and HTML templates are imported as text modules via the Wrangler `rules` entry.
- The Bun server (`server.ts`) remains for local development and as the Vercel fallback. Both entries share pure builders in `src/content.ts`; news caching stays runtime-specific.
- First viewport is server-rendered (gauge, current reading, latest news without JS).
- HTML pages are rendered from `templates/`; `public/` only holds static assets (CSS, JS, SVGs). Static serving never leaves `public/`.
- `POST /api/subscribe` and `/api/unsubscribe` require a `Content-Type` starting with `application/json` (415 otherwise) to block simple cross-site form posts. Bodies are capped at 8 KB on Workers and 16 KB on Bun.
- Newsletter rate limiting is an in-memory Map per Worker isolate (10k cap, keyed by `cf-connecting-ip`); it resets on deploy/cold start.
- D1 schema lives in `migrations/0001_init.sql` (`subscribers`, `provider_signals`, `provider_state`, `seen_posts`). Apply with `wrangler d1 migrations apply ai-gap-index --remote` (or `--local` for dev).
- Live provider score: `clamp(round(base + tweetDelta + newsDelta + blogDelta), 0, 100)`. The historical GAP series and `/api/history.*` never change with signals.
- News cache: 15-min TTL, max 8 items, background refresh (does not block responses).
- Vercel fallback (`vercel.json`, bun framework): SQLite lands in `/tmp/gap-index.sqlite` (ephemeral). Only `public/**`, `src/**`, and `templates/**` are bundled into the function; `data/**` is never shipped.

## Editorial data model (src/data.ts)

- `history`: one point per month, chronological. Each point has score (0–100), summary, anthropicSignal, openaiSignal, sources (HTTPS URLs).
- `methodology.weights`: 4 factors summing to 100 (subscription/value 30, capability 30, coding/agent 25, ecosystem 15).
- `sourceCoverage.cited` and `total` must equal `history.length` (test). `percentage` = 100.
- `currentScore = history.at(-1).score` (derived — do not edit by hand).
- Every score change requires a short explanation + citations. Update `sourceCoverage` when adding/removing months.

## Environment variables

| Var | Purpose |
|---|---|
| `SITE_URL` | Canonical origin (SEO, sitemap, llms.txt). Worker uses `request.url` origin when unset. |
| `PORT` | Bun server port (default 3000). |
| `DB_PATH` | Bun SQLite path (default ./data/gap-index.sqlite). |
| `RESEND_API_KEY` | Optional — newsletter delivery. |
| `RESEND_AUDIENCE_ID` | Optional — Resend audience. |
| `INGEST_TOKEN` | Worker secret; required by `POST /api/signals`. |
| `DB` | Worker D1 binding (configured in `wrangler.jsonc`). |
| `ASSETS` | Worker Assets binding (configured in `wrangler.jsonc`). |

Without Resend, signups are stored in SQLite/D1 only and no email is sent.

## Development workflow

- `bun test` must pass before a PR (data.test.ts, gauge.test.ts, server.test.ts, live.test.ts).
- CI runs tests + build + HTTP smoke (routes, subscribe/unsubscribe, template-token and content-type guards). Keep `/healthz` returning `{ ok: true }`.
- Route changes must be validated manually (curl) per the CI smoke test.

## Deploy

- **Cloudflare Workers (production):**
  ```sh
  npx wrangler d1 create ai-gap-index   # first time; copy database_id into wrangler.jsonc
  npx wrangler d1 migrations apply ai-gap-index --remote
  npx wrangler deploy
  printf '%s' "$(openssl rand -hex 32)" | npx wrangler secret put INGEST_TOKEN
  ```
  The deploy token needs Workers Scripts:Edit and D1:Edit. Set `SITE_URL` as a Worker variable if the canonical origin differs from the workers.dev URL.
- **Ingest token file:** `/home/ubuntu/.config/ai-gap-index/ingest.env` (mode 600, outside the repo) holds `INGEST_URL`, `STATE_URL`, and `INGEST_TOKEN` for the VPS cron scripts. Never commit or print the token.
- **Signal jobs:** scripts/grok-daily.ts scores all ten providers once daily; scripts/blog-watcher.ts polls official-source RSS searches every 15 minutes and deduplicates through D1 plus a mode-600 cache outside the repo. Cron serializes both with flock and logs through logger.
- **Local Worker:** `npx wrangler d1 migrations apply ai-gap-index --local`, then `npx wrangler dev --port 8787`. Put local secrets in `.dev.vars` (gitignored).
- **Signal API:** `POST /api/signals` with `Authorization: Bearer $INGEST_TOKEN`, JSON body `{ providerId, source: "tweets"|"news"|"blog", delta: -5..5, summary?, items?, dedupe? }`. The delta replaces that source's value in `provider_state`; `dedupe: true` records URLs in `seen_posts` and skips a fully-seen batch. `GET /api/state.json` exposes base/effective scores for all providers; `GET /api/signals.json?providerId=&limit=` lists recent rows.
- **Vercel fallback:** `vercel.json` with bun framework. SQLite in `/tmp` is ephemeral — use a persistent volume in production. Only `public/**`, `src/**`, and `templates/**` are bundled; `data/**` (sqlite/PII) is not shipped.
- Set `SITE_URL` to the canonical public URL.
- Without a configured mailing provider, addresses stay local; the UI explains this.

## Contributing

- Branches: `feat/...`, `fix/...`, `docs/...`, `chore/...`.
- Commits: prefixes `feat:`, `fix:`, `docs:`, `chore:`, `test:`, `ci:`.
- PRs require `bun test` passing and green CI.
- Editorial changes (scores) require a short explanation + citations.
- Keep the existing style; do not add dependencies for a few lines.

## Do not

- Commit `.env`, `.dev.vars`, `.wrangler/`, `data/`, `node_modules/`, `.vercel/`.
- Commit or print `INGEST_TOKEN`, Cloudflare tokens, or the contents of `/home/ubuntu/.config/ai-gap-index/ingest.env`.
- Edit `index-backup.html` (legacy backup).
- Change gauge orientation/colors (Anthropic on the left orange #d97757; OpenAI on the right black #171912) — tests enforce this.
- Add telemetry/outbound calls without an opt-in gate.
- Add new dependencies for a few lines; use Bun/stdlib.

## Project memory

History and context: git log, `research/`, `.github/workflows/ci.yml`. This file is the source of truth for agents.