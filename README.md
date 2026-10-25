# GAP Index — AI Provider Scores

An editorial, source-linked index scoring ten AI providers on a shared 0–100 scale, plus a separate monthly Anthropic vs OpenAI GAP history.

## Providers scored
Google, Microsoft, Meta, Amazon, OpenAI, Anthropic, Mistral AI, xAI, DeepSeek, and Kimi. Anthropic is the headline provider (73/100); the relative Anthropic vs OpenAI GAP is 52/100.

## Principles
- The first viewport is server-rendered HTML: the Anthropic gauge, the ten-provider field, and the latest curated stories remain visible without JavaScript.
- Provider scores are absolute editorial attractiveness (0 = weak, 50 = mid-field, 100 = leading). The GAP vs. OpenAI is a separate relative scale (50 = parity).
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

## Production
```sh
bun run start
```

Set `SITE_URL` to the canonical public URL. The process serves the static-first site and JSON/Markdown endpoints. SQLite stores newsletter signups in `data/gap-index.sqlite`; use a persistent volume in production. Without a configured mailing provider, addresses are stored locally only and no newsletter email is sent. The UI explains this and includes a working unsubscribe route. Read `/privacy/` and see `.env.example`.

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
- `/api/overview.md` — concise Markdown summary
- `/llms.txt` — agent-facing site map and usage notes
- `/llms-full.txt` — expanded methodology, provider breakdowns, and history
- `/robots.txt` and `/sitemap.xml` — generated from `SITE_URL`, including provider and archive pages

## Methodology
Editorial baseline weights: subscription/value (30%), model capability (30%), coding and agent workflows (25%), and ecosystem/distribution (15%). Provider scores and the monthly GAP values are interpretive, directional snapshots informed by dated product launches, plan/usage changes, partnerships and credible industry reporting—not the output of a representative survey. Every scoring change should be accompanied by a short explanation and citations. Methodology version 2026-10-v2, last reviewed 2026-10-25.

## License
Project code: MIT. Third-party company names and linked news remain the property of their respective owners.