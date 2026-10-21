# GAP Index — AI provider landscape

A source-linked directory of major AI model makers, assistants, and platforms, with an editorial history comparing Anthropic/Claude and OpenAI/ChatGPT.

## Principles
- The homepage server-renders its provider directory, current pairwise reading, and curated headlines before JavaScript runs.
- The provider list is a selected, non-exhaustive directory, not a ranking by popularity, usage, market share, or model quality.
- The monthly 0–100 score applies only to Anthropic and OpenAI: 50 indicates editorial parity, below 50 tilts toward OpenAI, and above 50 tilts toward Anthropic.
- Monthly history is a retrospective editorial assessment, not survey data, live market share, or investment advice. Each entry links to sources.
- Model catalogs, product names, pricing, and availability change. Provider cards link to official catalogs or product pages; check those sources for current details.
- Cloud and inference platforms may offer third-party models. The directory distinguishes these platforms from model developers to avoid double-counting ownership.
- Public JSON and Markdown endpoints make the directory and historical data readable by search engines, research tools, and AI agents.

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

## SEO and agent endpoints
- `/` — server-rendered provider directory, headlines, and the Anthropic vs OpenAI historical comparison
- `/api/providers.json` — selected AI companies and platforms with model families, products, and official source links
- `/api/index.json` — current Anthropic vs OpenAI reading, methodology, history, and provider directory link
- `/history/YYYY-MM/` — permanent server-rendered monthly Anthropic vs OpenAI archive pages with cited sources
- `/api/history.json` — pairwise monthly history
- `/api/news.json` — recent AI headlines from cached RSS searches with curated fallback
- `/api/overview.md` — concise Markdown summary and scope notes
- `/llms.txt` — agent-facing site map and usage notes
- `/llms-full.txt` — expanded methodology and history
- `/robots.txt` and `/sitemap.xml` — generated from `SITE_URL`, including monthly archives
- `/privacy/` — newsletter data handling and retention policy
- `/unsubscribe/` and `POST /api/unsubscribe` — remove local signup and mark Resend contact unsubscribed when configured
- `.github/workflows/ci.yml` — data checks, Bun build, and HTTP smoke tests

## Methodology
The historical Anthropic vs OpenAI score uses subscription/value (30%), model capability (30%), coding and agent workflows (25%), and ecosystem/distribution (15%). Monthly values are informed by dated product launches, plan/usage changes, partnerships, and credible reporting. They are interpretive snapshots, not a representative survey or a score for the broader provider directory. Every score change should include a short explanation and citations.

## License
Project code: MIT. Third-party company names and linked news remain the property of their respective owners.
