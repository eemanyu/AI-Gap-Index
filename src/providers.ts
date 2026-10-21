export type ProviderGroup = "model-maker" | "assistant" | "platform";

export type AIProvider = {
  id: string;
  name: string;
  group: ProviderGroup;
  kind: string;
  families: string;
  products: string;
  description: string;
  sourceUrl: string;
  sourceLabel: string;
};

export const providerCatalogUpdatedAt = "2026-10-21";

// A curated directory of major AI model makers, assistants, and infrastructure
// platforms. It is intentionally not a popularity ranking or a complete census.
export const providers: AIProvider[] = [
  {
    id: "openai", name: "OpenAI", group: "model-maker", kind: "Model maker + assistant",
    families: "GPT", products: "ChatGPT · Codex · OpenAI API",
    description: "Consumer and developer products built around OpenAI's model families.",
    sourceUrl: "https://developers.openai.com/api/docs/models/all", sourceLabel: "Model catalog"
  },
  {
    id: "anthropic", name: "Anthropic", group: "model-maker", kind: "Model maker + assistant",
    families: "Claude", products: "Claude · Claude Code · Claude API",
    description: "Claude models, the Claude assistant, and tools for developers and teams.",
    sourceUrl: "https://docs.anthropic.com/en/docs/about-claude/models/overview", sourceLabel: "Claude models"
  },
  {
    id: "google", name: "Google DeepMind", group: "model-maker", kind: "Model maker + cloud platform",
    families: "Gemini · Gemma", products: "Gemini · AI Studio · Vertex AI",
    description: "Google's Gemini and Gemma families; Vertex AI also offers models from other developers.",
    sourceUrl: "https://ai.google.dev/gemini-api/docs/models", sourceLabel: "Gemini model catalog"
  },
  {
    id: "meta", name: "Meta", group: "model-maker", kind: "Open-weight model maker",
    families: "Llama", products: "Llama · Meta AI",
    description: "Llama model families and Meta AI products. Availability and license terms vary by model.",
    sourceUrl: "https://ai.meta.com/llama/get-started/", sourceLabel: "Llama models"
  },
  {
    id: "microsoft", name: "Microsoft", group: "model-maker", kind: "Model maker + cloud platform",
    families: "Phi · MAI", products: "Copilot · Azure AI Foundry",
    description: "Microsoft's Phi and MAI model lines alongside Copilot; Foundry also lists partner models.",
    sourceUrl: "https://azure.microsoft.com/en-us/products/ai-foundry/models/", sourceLabel: "AI Foundry models"
  },
  {
    id: "xai", name: "xAI", group: "model-maker", kind: "Model maker + assistant",
    families: "Grok", products: "Grok · xAI API",
    description: "Grok models available through xAI's consumer products and developer API.",
    sourceUrl: "https://docs.x.ai/developers/models", sourceLabel: "Grok model catalog"
  },
  {
    id: "deepseek", name: "DeepSeek", group: "model-maker", kind: "Model maker + API",
    families: "DeepSeek", products: "DeepSeek app · DeepSeek API",
    description: "DeepSeek's model family and direct developer API.",
    sourceUrl: "https://api-docs.deepseek.com/api/list-models/", sourceLabel: "API model list"
  },
  {
    id: "alibaba", name: "Alibaba Cloud", group: "model-maker", kind: "Model maker + cloud platform",
    families: "Qwen", products: "Qwen · Model Studio",
    description: "Alibaba's Qwen models. Model Studio also makes third-party models available.",
    sourceUrl: "https://www.alibabacloud.com/help/en/model-studio/get-started-with-models", sourceLabel: "Model Studio catalog"
  },
  {
    id: "mistral", name: "Mistral AI", group: "model-maker", kind: "Model maker + assistant",
    families: "Mistral", products: "Le Chat · Mistral API",
    description: "Mistral's commercial and open-weight models, assistant, and developer platform.",
    sourceUrl: "https://docs.mistral.ai/models/", sourceLabel: "Model catalog"
  },
  {
    id: "amazon", name: "Amazon", group: "model-maker", kind: "Model maker + cloud platform",
    families: "Nova", products: "Amazon Nova · Bedrock · Amazon Q",
    description: "Amazon's Nova models. Bedrock also serves models created by other companies.",
    sourceUrl: "https://aws.amazon.com/nova/", sourceLabel: "Amazon Nova"
  },
  {
    id: "cohere", name: "Cohere", group: "model-maker", kind: "Enterprise model maker",
    families: "Command · Aya · Embed · Rerank", products: "Cohere Platform · North",
    description: "Models and retrieval tools for enterprise language, search, and agent applications.",
    sourceUrl: "https://docs.cohere.com/docs/models", sourceLabel: "Model documentation"
  },
  {
    id: "moonshot", name: "Moonshot AI", group: "model-maker", kind: "Model maker + assistant",
    families: "Kimi", products: "Kimi · Moonshot API",
    description: "The company behind Kimi assistants and Moonshot's model API.",
    sourceUrl: "https://www.kimi.ai/help/kimi-api/api-overview", sourceLabel: "Kimi API overview"
  },
  {
    id: "zai", name: "Z.ai", group: "model-maker", kind: "Model maker + assistant",
    families: "GLM", products: "GLM · Z.ai API",
    description: "GLM models and developer access from Z.ai, also known as Zhipu AI.",
    sourceUrl: "https://z.ai/model-api", sourceLabel: "GLM model API"
  },
  {
    id: "minimax", name: "MiniMax", group: "model-maker", kind: "Model maker",
    families: "MiniMax", products: "MiniMax assistant · MiniMax API",
    description: "Multimodal model and assistant products from MiniMax.",
    sourceUrl: "https://www.minimax.io/", sourceLabel: "Official site"
  },
  {
    id: "bytedance", name: "ByteDance", group: "model-maker", kind: "Model maker + assistant",
    families: "Seed · Doubao", products: "Seed models · Doubao",
    description: "ByteDance's Seed model portfolio and Doubao AI products.",
    sourceUrl: "https://seed.bytedance.com/en/seed_model_portfolio", sourceLabel: "Seed model portfolio"
  },
  {
    id: "baidu", name: "Baidu", group: "model-maker", kind: "Model maker + cloud platform",
    families: "ERNIE", products: "ERNIE · Qianfan",
    description: "Baidu's ERNIE models. Qianfan also provides access to third-party models.",
    sourceUrl: "https://intl.cloud.baidu.com/en/doc/qianfan/s/7m95lyy43-intl-en", sourceLabel: "Qianfan model catalog"
  },
  {
    id: "tencent", name: "Tencent", group: "model-maker", kind: "Model maker",
    families: "Hunyuan", products: "Tencent Hunyuan · Hunyuan API",
    description: "Tencent's Hunyuan model family and developer services.",
    sourceUrl: "https://cloud.tencent.com/document/product/1729/105701", sourceLabel: "Hunyuan API docs"
  },
  {
    id: "nvidia", name: "NVIDIA", group: "model-maker", kind: "Model maker + AI platform",
    families: "Nemotron", products: "Nemotron · NVIDIA NIM",
    description: "NVIDIA's Nemotron models and AI deployment software. NIM also serves partner models.",
    sourceUrl: "https://build.nvidia.com/models", sourceLabel: "NVIDIA model catalog"
  },
  {
    id: "stability-ai", name: "Stability AI", group: "model-maker", kind: "Generative model maker",
    families: "Stable Diffusion", products: "Image generation · Stable Assistant",
    description: "Image-generation models and creative tools, including Stable Diffusion.",
    sourceUrl: "https://stability.ai/stable-image", sourceLabel: "Stable Image"
  },
  {
    id: "perplexity", name: "Perplexity", group: "assistant", kind: "AI answer + search platform",
    families: "Sonar", products: "Perplexity assistant · Sonar API",
    description: "A search-oriented answer product and API. Some experiences can route to third-party models.",
    sourceUrl: "https://www.perplexity.ai/api-platform", sourceLabel: "Perplexity API"
  },
  {
    id: "hugging-face", name: "Hugging Face", group: "platform", kind: "Model hub + inference platform",
    families: "Community model catalog", products: "Hub · Inference Providers",
    description: "A discovery and hosting platform for models built by many different organizations.",
    sourceUrl: "https://huggingface.co/models", sourceLabel: "Browse models"
  },
  {
    id: "openrouter", name: "OpenRouter", group: "platform", kind: "Multi-provider model platform",
    families: "Third-party model catalog", products: "Unified model API · model directory",
    description: "A single API for models from multiple developers; listed here as a platform, not a model owner.",
    sourceUrl: "https://openrouter.ai/docs/api/api-reference/models/get-models", sourceLabel: "Model API"
  },
  {
    id: "groq", name: "Groq", group: "platform", kind: "Inference platform",
    families: "Hosted third-party models", products: "GroqCloud · Groq API",
    description: "An inference service for models from multiple developers; model ownership remains with each developer.",
    sourceUrl: "https://console.groq.com/docs/models", sourceLabel: "Supported models"
  }
].sort((left, right) => left.name.localeCompare(right.name));
