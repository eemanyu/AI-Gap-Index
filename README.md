# GAP Index — Anthropic vs OpenAI

An editorial, source-linked index comparing the relative attractiveness of the Anthropic/Claude and OpenAI/ChatGPT ecosystems: subscription value, model capability, coding/agent workflows, and ecosystem reach.

## Principles
- The first viewport is server-rendered HTML: gauge, current reading, and the latest curated stories remain visible without JavaScript.
- A score above 50 indicates a relative Anthropic edge; below 50 indicates a relative OpenAI edge; 50 is parity.
- Monthly history is a **retrospective editorial assessment**, not survey data, a live market-share statistic, or investment advice. Each entry links to a primary source where available.
- "Source coverage" describes whether editorial entries have citations. It is not a claim that every statement is 100% accurate.
- Public JSON and Markdown endpoints make the index readable by search engines, research tools, and AI agents.

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

Set `SITE_URL` to the canonical public URL. The process serves the static-first site and JSON/Markdown endpoints. SQLite stores newsletter signups in `data/gap-index.sqlite`; use a persistent volume in production. Without a configured mailing provider, addresses are stored locally only and no newsletter email is sent. See `.env.example`.

## SEO and agent endpoints
- `/` — server-rendered homepage
- `/api/index.json` — current reading, methodology, and source-linked history
- `/api/history.json` — monthly history
- `/api/news.json` — recent AI headlines (cached RSS refresh with curated fallback)
- `/api/overview.md` — concise Markdown summary
- `/llms.txt` — agent-facing site map and usage notes
- `/llms-full.txt` — expanded methodology and history
- `/robots.txt` and `/sitemap.xml` — generated from `SITE_URL`

## Methodology
Editorial baseline weights: subscription/value (30%), model capability (30%), coding and agent workflows (25%), and ecosystem/distribution (15%). Monthly values are informed by dated product launches, plan/usage changes, partnerships and credible industry reporting. They are interpretive, directional snapshots—not the output of a representative survey. Every scoring change should be accompanied by a short explanation and citations.

## License
Project code: MIT. Third-party company names and linked news remain the property of their respective owners.
