export type SourceType = "primary" | "independent";
export type Source = { publisher: string; title: string; date: string; url: string; type?: SourceType };
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

export type FactorKey = "subscription" | "capability" | "coding" | "ecosystem";
export type FactorDefinition = { key: FactorKey; label: string; weight: number };

export type Provider = {
  id: string;
  name: string;
  shortName: string;
  color: string;
  headline: string;
  summary: string;
  factors: Record<FactorKey, number>;
  sources: Source[];
  lastReviewed: string;
};

export const methodology = {
  name: "GAP Index editorial framework",
  version: "2026-10-v2",
  lastReviewed: "2026-10-25",
  direction: "Provider scores: 0 = weak relative attractiveness; 50 = mid-field; 100 = category-leading. GAP vs. OpenAI: 0 = OpenAI edge; 50 = parity; 100 = Anthropic edge.",
  weights: [
    { factor: "Subscription value and usage limits", weight: 30 },
    { factor: "Model capability and reliability", weight: 30 },
    { factor: "Coding and agent workflows", weight: 25 },
    { factor: "Ecosystem, distribution, and integrations", weight: 15 }
  ] satisfies { factor: string; weight: number }[],
  factors: [
    { key: "subscription", label: "Subscription value and usage limits", weight: 30 },
    { key: "capability", label: "Model capability and reliability", weight: 30 },
    { key: "coding", label: "Coding and agent workflows", weight: 25 },
    { key: "ecosystem", label: "Ecosystem, distribution, and integrations", weight: 15 }
  ] satisfies FactorDefinition[],
  caveat: "Editorial reconstruction based on dated announcements and linked reporting. Provider scores are absolute editorial attractiveness, not market share; the GAP vs. OpenAI is relative. Not a representative sentiment poll, audited market-share metric, price guarantee, or investment advice. Scores are directional and should be revised when evidence changes.",
  sourceCoverage: {
    label: "Monthly entries with citations",
    cited: 11,
    total: 11,
    percentage: 100
  }
};

export const providers: Provider[] = [
  {
    id: "google",
    name: "Google",
    shortName: "Gemini",
    color: "#4a7ae0",
    headline: "Distribution and multimodal reach, still behind on coding agents.",
    summary: "Gemini benefits from Google's distribution, Workspace integration, and multimodal stack. The gap is in production coding workflows and agent tooling, where Claude and ChatGPT still have deeper pull.",
    factors: { subscription: 70, capability: 74, coding: 58, ecosystem: 86 },
    lastReviewed: "2026-10-25",
    sources: [
      { publisher: "Google", title: "Gemini plans and pricing", date: "2026-10", url: "https://gemini.google.com/", type: "primary" },
      { publisher: "Google AI", title: "Gemini API pricing", date: "2026-10", url: "https://ai.google.dev/gemini-api/docs/pricing", type: "primary" },
      { publisher: "LMArena", title: "Chatbot Arena leaderboard", date: "2026-10", url: "https://lmarena.ai/leaderboard", type: "independent" },
      { publisher: "Artificial Analysis", title: "Model and provider comparisons", date: "2026-10", url: "https://artificialanalysis.ai/", type: "independent" }
    ]
  },
  {
    id: "microsoft",
    name: "Microsoft",
    shortName: "Copilot",
    color: "#0078d4",
    headline: "Enterprise distribution is the moat; the model layer is borrowed.",
    summary: "Microsoft pairs OpenAI models with Azure, Microsoft 365, and GitHub distribution. That makes Copilot easy to buy inside enterprises, but the subscription story is less distinctive when the underlying models are available elsewhere.",
    factors: { subscription: 68, capability: 68, coding: 64, ecosystem: 88 },
    lastReviewed: "2026-10-25",
    sources: [
      { publisher: "Microsoft", title: "Microsoft 365 Copilot plans", date: "2026-10", url: "https://www.microsoft.com/en-us/microsoft-365/copilot", type: "primary" },
      { publisher: "Microsoft Azure", title: "Azure OpenAI Service pricing", date: "2026-10", url: "https://azure.microsoft.com/en-us/pricing/details/cognitive-services/openai-service/", type: "primary" },
      { publisher: "GitHub", title: "Octoverse: state of open source", date: "2026-10", url: "https://github.blog/news-insights/octoverse/", type: "independent" },
      { publisher: "Stack Overflow", title: "Developer survey: AI tools", date: "2026-10", url: "https://survey.stackoverflow.co/2025/ai", type: "independent" }
    ]
  },
  {
    id: "meta",
    name: "Meta",
    shortName: "Llama",
    color: "#8b6ad4",
    headline: "Open weights and reach, thinner commercial agent stack.",
    summary: "Llama remains important for open-weight experimentation and cost control. Meta's consumer distribution is huge, but the paid subscription and production agent ecosystem are thinner than the leaders.",
    factors: { subscription: 60, capability: 66, coding: 52, ecosystem: 78 },
    lastReviewed: "2026-10-25",
    sources: [
      { publisher: "Meta", title: "Llama models", date: "2026-10", url: "https://www.llama.com/", type: "primary" },
      { publisher: "Meta AI", title: "Llama research and releases", date: "2026-10", url: "https://ai.meta.com/llama/", type: "primary" },
      { publisher: "Hugging Face", title: "Meta Llama model hub", date: "2026-10", url: "https://huggingface.co/meta-llama", type: "independent" },
      { publisher: "Artificial Analysis", title: "Open-weight model comparisons", date: "2026-10", url: "https://artificialanalysis.ai/", type: "independent" }
    ]
  },
  {
    id: "amazon",
    name: "Amazon",
    shortName: "Bedrock / Nova",
    color: "#e87a3a",
    headline: "Cloud plumbing and model choice, not a consumer destination.",
    summary: "Amazon's advantage is enterprise infrastructure: Bedrock gives teams access to multiple model families, and Nova adds first-party options. The consumer subscription and developer mindshare remain secondary.",
    factors: { subscription: 64, capability: 62, coding: 60, ecosystem: 80 },
    lastReviewed: "2026-10-25",
    sources: [
      { publisher: "AWS", title: "Amazon Bedrock", date: "2026-10", url: "https://aws.amazon.com/bedrock/", type: "primary" },
      { publisher: "AWS", title: "Amazon Nova", date: "2026-10", url: "https://aws.amazon.com/nova/", type: "primary" },
      { publisher: "Artificial Analysis", title: "Provider and model comparisons", date: "2026-10", url: "https://artificialanalysis.ai/", type: "independent" },
      { publisher: "Similarweb", title: "AI platform traffic benchmarks", date: "2026-10", url: "https://www.similarweb.com/", type: "independent" }
    ]
  },
  {
    id: "openai",
    name: "OpenAI",
    shortName: "ChatGPT",
    color: "#171912",
    headline: "Consumer reach and distribution remain the counterweight.",
    summary: "ChatGPT still has the broadest consumer pull, the strongest default distribution, and a deep product surface. The relative gap has narrowed as Anthropic improved coding and agent workflows, but OpenAI's ecosystem reach is hard to match.",
    factors: { subscription: 68, capability: 72, coding: 64, ecosystem: 90 },
    lastReviewed: "2026-10-25",
    sources: [
      { publisher: "OpenAI", title: "ChatGPT plans and pricing", date: "2026-10", url: "https://openai.com/chatgpt/pricing", type: "primary" },
      { publisher: "OpenAI", title: "Product releases", date: "2026-10", url: "https://openai.com/news/product-releases/", type: "primary" },
      { publisher: "LMArena", title: "Chatbot Arena leaderboard", date: "2026-10", url: "https://lmarena.ai/leaderboard", type: "independent" },
      { publisher: "Similarweb", title: "AI platform traffic benchmarks", date: "2026-10", url: "https://www.similarweb.com/", type: "independent" }
    ]
  },
  {
    id: "anthropic",
    name: "Anthropic",
    shortName: "Claude",
    color: "#d97757",
    headline: "Anthropic leads on coding and agent workflows.",
    summary: "Claude Code, Opus 4.7, and Haiku 5.5 give Anthropic the strongest developer-workflow story in this index. OpenAI still leads on consumer reach and distribution, so the GAP vs. OpenAI remains close to parity even as Anthropic's absolute provider score leads the field.",
    factors: { subscription: 72, capability: 78, coding: 82, ecosystem: 52 },
    lastReviewed: "2026-10-25",
    sources: [
      { publisher: "Anthropic", title: "Claude plans and pricing", date: "2026-10", url: "https://claude.com/pricing", type: "primary" },
      { publisher: "Anthropic", title: "Anthropic newsroom", date: "2026-10", url: "https://www.anthropic.com/news", type: "primary" },
      { publisher: "Artificial Analysis", title: "Model and provider comparisons", date: "2026-10", url: "https://artificialanalysis.ai/", type: "independent" },
      { publisher: "LMArena", title: "Chatbot Arena leaderboard", date: "2026-10", url: "https://lmarena.ai/leaderboard", type: "independent" },
      { publisher: "GitHub", title: "Octoverse: state of open source", date: "2026-10", url: "https://github.blog/news-insights/octoverse/", type: "independent" }
    ]
  },
  {
    id: "mistral",
    name: "Mistral AI",
    shortName: "Mistral",
    color: "#f7a600",
    headline: "European open-weight option with a narrower commercial surface.",
    summary: "Mistral is competitive on cost and open-weight deployment, especially for European data-residency needs. Its consumer and agent ecosystem is still catching up to the US leaders.",
    factors: { subscription: 62, capability: 62, coding: 56, ecosystem: 62 },
    lastReviewed: "2026-10-25",
    sources: [
      { publisher: "Mistral AI", title: "Plans and pricing", date: "2026-10", url: "https://mistral.ai/pricing", type: "primary" },
      { publisher: "Mistral AI", title: "News and model releases", date: "2026-10", url: "https://mistral.ai/news/", type: "primary" },
      { publisher: "Hugging Face", title: "Mistral model hub", date: "2026-10", url: "https://huggingface.co/mistralai", type: "independent" },
      { publisher: "Artificial Analysis", title: "Model and provider comparisons", date: "2026-10", url: "https://artificialanalysis.ai/", type: "independent" }
    ]
  },
  {
    id: "xai",
    name: "xAI",
    shortName: "Grok",
    color: "#111111",
    headline: "Fast consumer distribution through X; uneven enterprise depth.",
    summary: "Grok benefits from X distribution and a fast release cadence. Enterprise controls, coding workflows, and a durable developer ecosystem are less mature than the leaders.",
    factors: { subscription: 58, capability: 64, coding: 58, ecosystem: 60 },
    lastReviewed: "2026-10-25",
    sources: [
      { publisher: "xAI", title: "Grok", date: "2026-10", url: "https://x.ai/grok", type: "primary" },
      { publisher: "xAI", title: "API documentation", date: "2026-10", url: "https://x.ai/api", type: "primary" },
      { publisher: "LMArena", title: "Chatbot Arena leaderboard", date: "2026-10", url: "https://lmarena.ai/leaderboard", type: "independent" },
      { publisher: "Artificial Analysis", title: "Model and provider comparisons", date: "2026-10", url: "https://artificialanalysis.ai/", type: "independent" }
    ]
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    shortName: "DeepSeek",
    color: "#c93030",
    headline: "Strong price-performance, thin commercial ecosystem.",
    summary: "DeepSeek's open-weight and low-cost models are a strong value option for cost-sensitive teams. The commercial subscription and agent tooling story is much thinner than Claude or ChatGPT.",
    factors: { subscription: 64, capability: 60, coding: 62, ecosystem: 44 },
    lastReviewed: "2026-10-25",
    sources: [
      { publisher: "DeepSeek", title: "DeepSeek", date: "2026-10", url: "https://www.deepseek.com/", type: "primary" },
      { publisher: "DeepSeek", title: "API pricing", date: "2026-10", url: "https://api-docs.deepseek.com/quick_start/pricing", type: "primary" },
      { publisher: "Hugging Face", title: "DeepSeek model hub", date: "2026-10", url: "https://huggingface.co/deepseek-ai", type: "independent" },
      { publisher: "Artificial Analysis", title: "Model and provider comparisons", date: "2026-10", url: "https://artificialanalysis.ai/", type: "independent" }
    ]
  },
  {
    id: "kimi",
    name: "Kimi",
    shortName: "Moonshot",
    color: "#6b5bd2",
    headline: "Long-context specialist with a regional ecosystem.",
    summary: "Kimi is known for long-context work and a strong Chinese-language product. Its global enterprise distribution, integrations, and developer tooling remain limited compared with the leaders.",
    factors: { subscription: 58, capability: 58, coding: 54, ecosystem: 40 },
    lastReviewed: "2026-10-25",
    sources: [
      { publisher: "Moonshot AI", title: "Kimi", date: "2026-10", url: "https://kimi.moonshot.cn/", type: "primary" },
      { publisher: "Moonshot AI", title: "Platform and API", date: "2026-10", url: "https://platform.moonshot.ai/", type: "primary" },
      { publisher: "Hugging Face", title: "Moonshot model hub", date: "2026-10", url: "https://huggingface.co/moonshotai", type: "independent" },
      { publisher: "LMArena", title: "Chatbot Arena leaderboard", date: "2026-10", url: "https://lmarena.ai/leaderboard", type: "independent" }
    ]
  }
];

export function scoreProvider(provider: Provider): number {
  const weighted = methodology.factors.reduce((sum, factor) => sum + provider.factors[factor.key] * factor.weight, 0);
  return Math.round(weighted / 100);
}

export function providerLabel(score: number): string {
  if (score >= 80) return "Category leader";
  if (score >= 70) return "Strong position";
  if (score >= 60) return "Competitive";
  if (score >= 50) return "Developing";
  return "Niche";
}

export const currentProvider = providers.find((provider) => provider.id === "anthropic")!;
export const currentProviderScore = scoreProvider(currentProvider);
export const providerSourceCoverage = {
  total: providers.length,
  primary: providers.filter((provider) => provider.sources.some((source) => (source.type ?? "primary") === "primary")).length,
  independent: providers.filter((provider) => provider.sources.some((source) => source.type === "independent")).length
};

export const currentScore = history[history.length - 1]!.score;
export const currentScoreDelta = currentScore - (history[history.length - 2]?.score ?? currentScore);
