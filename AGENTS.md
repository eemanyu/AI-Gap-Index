# AGENTS.md — AI-Gap-Index

Guide for coding agents and contributors. Read before editing.

## What it is

An editorial index comparing the relative attractiveness of the Anthropic/Claude and OpenAI/ChatGPT ecosystems: subscription value, model capability, coding/agent workflows, and ecosystem reach.

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
```

## Structure

```
server.ts          # routes, RSS, SQLite, monthly page rendering
src/data.ts        # history[], methodology, fallbackNews, currentScore
public/            # index.html, styles.css, app.js, static pages
scripts/           # scrape-twitter.ts (requires xurl auth)
test/              # data.test.ts, gauge.test.ts
data/              # sqlite (gitignored)
research/          # research notes
.github/workflows/ # CI (tests + build + HTTP smoke)
```

## Architecture

- Bun runtime (>=1.2), TypeScript ESM.
- Single server in `server.ts` (Bun.serve). First viewport is server-rendered (gauge, current reading, latest news without JS).
- Persistence in SQLite (`bun:sqlite`), path via `DB_PATH`. Use a persistent volume in production.
- News cache: 15-min TTL, max 8 items, background refresh (does not block responses).
- Vercel deploy (`vercel.json`, bun framework); on Vercel the DB lands in `/tmp/gap-index.sqlite` (ephemeral).

## Editorial data model (src/data.ts)

- `history`: one point per month, chronological. Each point has score (0–100), summary, anthropicSignal, openaiSignal, sources (HTTPS URLs).
- `methodology.weights`: 4 factors summing to 100 (subscription/value 30, capability 30, coding/agent 25, ecosystem 15).
- `sourceCoverage.cited` and `total` must equal `history.length` (test). `percentage` = 100.
- `currentScore = history.at(-1).score` (derived — do not edit by hand).
- Every score change requires a short explanation + citations. Update `sourceCoverage` when adding/removing months.

## Environment variables

| Var | Purpose |
|---|---|
| `SITE_URL` | Canonical origin (SEO, sitemap, llms.txt). |
| `PORT` | Server port (default 3000). |
| `DB_PATH` | SQLite path (default ./data/gap-index.sqlite). |
| `RESEND_API_KEY` | Optional — newsletter delivery. |
| `RESEND_AUDIENCE_ID` | Optional — Resend audience. |

Without Resend, signups are stored locally only and no email is sent.

## Development workflow

- `bun test` must pass before a PR (data.test.ts, gauge.test.ts).
- CI runs tests + build + HTTP smoke (routes, subscribe/unsubscribe). Keep `/healthz` returning `{ ok: true }`.
- Route changes must be validated manually (curl) per the CI smoke test.

## Deploy

- Vercel: `vercel.json` with bun framework. SQLite in `/tmp` is ephemeral — use a persistent volume in production.
- Set `SITE_URL` to the canonical public URL.
- Without a configured mailing provider, addresses stay local; the UI explains this.

## Contributing

- Branches: `feat/...`, `fix/...`, `docs/...`, `chore/...`.
- Commits: prefixes `feat:`, `fix:`, `docs:`, `chore:`, `test:`, `ci:`.
- PRs require `bun test` passing and green CI.
- Editorial changes (scores) require a short explanation + citations.
- Keep the existing style; do not add dependencies for a few lines.

## Do not

- Commit `.env`, `data/`, `node_modules/`, `.vercel/`.
- Edit `index-backup.html` (legacy backup).
- Change gauge orientation/colors (Anthropic on the left orange #d97757; OpenAI on the right black #171912) — tests enforce this.
- Add telemetry/outbound calls without an opt-in gate.
- Add new dependencies for a few lines; use Bun/stdlib.

## Project memory

History and context: git log, `research/`, `.github/workflows/ci.yml`. This file is the source of truth for agents.