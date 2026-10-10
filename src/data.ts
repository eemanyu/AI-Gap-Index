export type Source = { publisher: string; title: string; date: string; url: string };
export type HistoryPoint = {
  month: string;
  label: string;
  score: number;
  phase: string;
  summary: string;
  anthropicSignal: string;
  openaiSignal: string;
  sources: Source[];
};

export const history: HistoryPoint[] = [
  {
    month: "2025-12", label: "Dec 2025", score: 61, phase: "Claude Code momentum",
    summary: "Claude Code's reported $1B run-rate milestone and new enterprise distribution partnerships strengthened Anthropic's developer and enterprise story. OpenAI remained the broader consumer ecosystem, so the month is a relative tilt—not a runaway lead.",
    anthropicSignal: "Claude Code reached a reported $1B run-rate milestone; Anthropic announced an acquisition of Bun and expanded enterprise partnerships.",
    openaiSignal: "OpenAI's consumer reach and ChatGPT ecosystem remained a major counterweight; this score does not treat product-launch count as market share.",
    sources: [
      { publisher: "Anthropic", title: "Anthropic acquires Bun as Claude Code reaches $1B milestone", date: "2025-12-03", url: "https://www.anthropic.com/news/anthropic-acquires-bun-as-claude-code-reaches-usd1b-milestone" },
      { publisher: "Anthropic", title: "Snowflake and Anthropic announce $200M partnership", date: "2025-12-03", url: "https://www.anthropic.com/news/snowflake-anthropic-expanded-partnership" }
    ]
  },
  {
    month: "2026-01", label: "Jan 2026", score: 65, phase: "Agents leave the chat window",
    summary: "Anthropic's Labs and Cowork direction expanded Claude's appeal from answering prompts to carrying out desktop work. Publishing Claude's constitution also placed behavior and trust visibly into the product narrative.",
    anthropicSignal: "Claude Cowork and the Labs model highlighted experimental agent workflows beyond a traditional chat subscription.",
    openaiSignal: "The comparison still includes ChatGPT breadth, multimodal features, and distribution; this month's editorial tilt reflects the agent-workflow signal.",
    sources: [
      { publisher: "Anthropic", title: "Introducing Labs", date: "2026-01-13", url: "https://www.anthropic.com/news/introducing-anthropic-labs" },
      { publisher: "Anthropic", title: "Claude's new constitution", date: "2026-01-22", url: "https://www.anthropic.com/news/claude-new-constitution" }
    ]
  },
  {
    month: "2026-02", label: "Feb 2026", score: 68, phase: "Coding and long-context",
    summary: "Opus 4.6 and Sonnet 4.6 brought improvements in coding, computer use, agent planning, and long context. Keeping Sonnet pricing level while moving stronger capabilities into default plans improved the value story.",
    anthropicSignal: "Opus 4.6 emphasized longer agentic tasks; Sonnet 4.6 became the default on Claude Free and Pro with the same stated API pricing as its predecessor.",
    openaiSignal: "OpenAI's wider product footprint remains important, but the selected primary-source evidence this month favored Claude's focused coding and agent narrative.",
    sources: [
      { publisher: "Anthropic", title: "Introducing Claude Opus 4.6", date: "2026-02-05", url: "https://www.anthropic.com/news/claude-opus-4-6" },
      { publisher: "Anthropic", title: "Introducing Claude Sonnet 4.6", date: "2026-02-17", url: "https://www.anthropic.com/news/claude-sonnet-4-6" }
    ]
  },
  {
    month: "2026-03", label: "Mar 2026", score: 70, phase: "Enterprise distribution",
    summary: "Anthropic committed an initial $100M to a Claude Partner Network, improving training, support, and deployment capacity. Enterprise adoption and cloud availability matter to ecosystem attractiveness—not just the model leaderboard.",
    anthropicSignal: "A $100M partner initiative gave consultants and implementation partners more support for deploying Claude.",
    openaiSignal: "OpenAI continues to compete through broad product distribution and platform access; the score reflects relative editorial signals, not enterprise market-share data.",
    sources: [
      { publisher: "Anthropic", title: "Anthropic invests $100 million into the Claude Partner Network", date: "2026-03-12", url: "https://www.anthropic.com/news/claude-partner-network" }
    ]
  },
  {
    month: "2026-04", label: "Apr 2026", score: 72, phase: "Harder engineering tasks",
    summary: "Claude Opus 4.7 targeted difficult software engineering, instruction-following, and sustained work. The story supported Claude's developer positioning, while the GAP score remains a synthesis of value and ecosystem factors.",
    anthropicSignal: "Opus 4.7 was announced as generally available, with a focus on advanced software engineering and long-running work.",
    openaiSignal: "ChatGPT's mainstream reach and OpenAI's broader ecosystem stay in the comparison; this month’s score is a directional editorial call.",
    sources: [
      { publisher: "Anthropic", title: "Introducing Claude Opus 4.7", date: "2026-04-16", url: "https://www.anthropic.com/news/claude-opus-4-7" }
    ]
  },
  {
    month: "2026-05", label: "May 2026", score: 74, phase: "More room for heavy users",
    summary: "Anthropic raised Claude Code usage limits for paid plans and announced a compute partnership. Higher practical usage within the same subscription can improve perceived value, although limits and policies should always be checked against the current plan pages.",
    anthropicSignal: "Claude Code five-hour limits doubled for Pro, Max, Team, and seat-based Enterprise plans; Anthropic also announced additional compute capacity.",
    openaiSignal: "Subscription value is not just rate limits: included features, model access, and usage rules change frequently across both ecosystems.",
    sources: [
      { publisher: "Anthropic", title: "Higher usage limits for Claude and a compute deal with SpaceX", date: "2026-05-06", url: "https://www.anthropic.com/news/higher-limits-spacex" },
      { publisher: "Anthropic", title: "Anthropic raises $65B Series H funding at $965B post-money valuation", date: "2026-05-28", url: "https://www.anthropic.com/news/series-h" }
    ]
  },
  {
    month: "2026-06", label: "Jun 2026", score: 71, phase: "Agentic capability—and access friction",
    summary: "Claude Sonnet 5 was positioned for more autonomous planning and tool use at lower cost than larger models. At the same time, temporary access restrictions around other frontier models showed that availability and policy are part of the real subscription experience.",
    anthropicSignal: "Sonnet 5 focused on agentic planning, terminal/browser tools, coding, and knowledge work.",
    openaiSignal: "The fairest comparison also asks how consistently a subscriber can access useful capabilities, not just which release sounds strongest.",
    sources: [
      { publisher: "Anthropic", title: "Introducing Claude Sonnet 5", date: "2026-06-30", url: "https://www.anthropic.com/news/claude-sonnet-5" },
      { publisher: "Anthropic", title: "Claude Fable 5 and Claude Mythos 5", date: "2026-06-09", url: "https://www.anthropic.com/news/claude-fable-5-mythos-5" }
    ]
  },
  {
    month: "2026-07", label: "Jul 2026", score: 68, phase: "Competition resets on price",
    summary: "Claude Opus 5 emphasized frontier-level work with a lower-cost positioning relative to its predecessor. The editorial advantage narrows as pricing efficiency—not only peak capability—becomes central to subscription comparisons.",
    anthropicSignal: "Opus 5 launched with an emphasis on coding and knowledge work, and was positioned as more efficient for everyday use.",
    openaiSignal: "The index continues to weigh breadth and distribution against coding depth and the amount of useful work included in a plan.",
    sources: [
      { publisher: "Anthropic", title: "Introducing Claude Opus 5", date: "2026-07-24", url: "https://www.anthropic.com/news/claude-opus-5" }
    ]
  },
  {
    month: "2026-08", label: "Aug 2026", score: 64, phase: "Trust and provenance",
    summary: "Anthropic described a text-watermarking approach for future Claude models and improved safety fallbacks on biology-related requests. Provenance and guardrails can affect user trust, but their value depends on implementation and user needs.",
    anthropicSignal: "Anthropic published details on text watermarking and described a reduction in unnecessary biology-related fallbacks for Fable 5.",
    openaiSignal: "Trust, privacy, tool reliability, and policy friction are cross-provider dimensions; one policy announcement does not establish a universal preference.",
    sources: [
      { publisher: "Anthropic", title: "How Claude's text watermark works", date: "2026-08-14", url: "https://www.anthropic.com/news/claude-text-watermark" },
      { publisher: "Anthropic", title: "Improving Fable 5's safeguards", date: "2026-08-07", url: "https://www.anthropic.com/news/improving-fable-5-s-biology-safeguards" }
    ]
  },
  {
    month: "2026-09", label: "Sep 2026", score: 56, phase: "OpenAI closes the gap",
    summary: "OpenAI's GPT-6 family and tooling announcements met a cluster of Claude upgrades. Both ecosystems were competing more directly on capability per dollar, integrated tools, and professional workflows, pulling the index closer to parity.",
    anthropicSignal: "Anthropic announced further Opus and Sonnet improvements focused on coding and knowledge work.",
    openaiSignal: "OpenAI's GPT-6 Sol/Luna and GPT-6.1 Sol announcements emphasized capability, coding, and lower token pricing for selected work.",
    sources: [
      { publisher: "OpenAI", title: "OpenAI product releases", date: "2026-09", url: "https://openai.com/news/product-releases/" },
      { publisher: "Anthropic", title: "Anthropic newsroom", date: "2026-09", url: "https://www.anthropic.com/news" }
    ]
  },
  {
    month: "2026-10", label: "Oct 2026", score: 52, phase: "Near parity",
    summary: "GPT-6 and Intelligent UI arrived alongside Claude Haiku 5.5. Recent releases from both providers show why a single winner can be misleading: the best subscription depends on the work, usage constraints, toolchain, and price.",
    anthropicSignal: "Claude Haiku 5.5 was announced as a fast, lower-cost model for high-volume work.",
    openaiSignal: "GPT-6 rolled out in ChatGPT with an interactive UI emphasis; OpenAI's product and safety announcements remained active through the same week.",
    sources: [
      { publisher: "OpenAI", title: "OpenAI product releases", date: "2026-10-07", url: "https://openai.com/news/product-releases/" },
      { publisher: "Anthropic", title: "Anthropic newsroom", date: "2026-10-07", url: "https://www.anthropic.com/news" }
    ]
  }
];

export type NewsItem = {
  id: string;
  title: string;
  publisher: string;
  publishedAt: string;
  url: string;
  category: string;
  summary: string;
};

export const fallbackNews: NewsItem[] = [
  {
    id: "openai-safety-researchers",
    title: "OpenAI dismisses three researchers after internal policy investigation",
    publisher: "Reuters",
    publishedAt: "2026-10-09",
    url: "https://www.reuters.com/business/openai-says-it-has-fired-three-researchers-violating-sensitive-information-2026-10-09/",
    category: "People & Safety",
    summary: "The company and the dismissed researchers offered differing accounts of the dispute, renewing scrutiny of safety culture and internal governance."
  },
  {
    id: "openai-investor-revenue",
    title: "OpenAI's annualized revenue figure draws renewed scrutiny",
    publisher: "Reuters",
    publishedAt: "2026-10-08",
    url: "https://www.reuters.com/business/openais-annualized-revenue-20-billion-less-than-previously-signaled-ft-reports-2026-10-08/",
    category: "Business",
    summary: "A report highlighted differences in how OpenAI and Anthropic count revenue routed through cloud partners, complicating direct comparisons."
  },
  {
    id: "openai-gpt-6-ui",
    title: "GPT-6 and Intelligent UI for everyone",
    publisher: "OpenAI",
    publishedAt: "2026-10-07",
    url: "https://openai.com/news/product-releases/",
    category: "Product",
    summary: "OpenAI announced a global ChatGPT rollout centered on faster responses and interactive visual experiences."
  },
  {
    id: "anthropic-haiku-55",
    title: "Introducing Claude Haiku 5.5",
    publisher: "Anthropic",
    publishedAt: "2026-10-07",
    url: "https://www.anthropic.com/news",
    category: "Models",
    summary: "Anthropic positioned its newest small model for fast, cost-sensitive, high-volume work."
  },
  {
    id: "anthropic-cyber-program",
    title: "Anthropic expands its Cyber Verification Program",
    publisher: "Anthropic",
    publishedAt: "2026-10-06",
    url: "https://www.anthropic.com/news",
    category: "Safety",
    summary: "Anthropic expanded a program for qualifying security professionals working with advanced cyber capabilities."
  }
];

export const methodology = {
  name: "GAP Index editorial framework",
  direction: "0 = relative OpenAI edge; 50 = parity; 100 = relative Anthropic edge.",
  weights: [
    { factor: "Subscription value and usage limits", weight: 30 },
    { factor: "Model capability and reliability", weight: 30 },
    { factor: "Coding and agent workflows", weight: 25 },
    { factor: "Ecosystem, distribution, and integrations", weight: 15 }
  ],
  caveat: "Editorial reconstruction based on dated announcements and linked reporting. Not a representative sentiment poll, audited market-share metric, price guarantee, or investment advice. Scores are directional and should be revised when evidence changes.",
  sourceCoverage: {
    label: "Monthly entries with citations",
    cited: 11,
    total: 11,
    percentage: 100
  }
};

export const currentScore = history[history.length - 1]!.score;
