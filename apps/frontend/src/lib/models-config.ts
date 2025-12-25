/**
 * Model Configuration for Orderly Industry
 * 
 * Provides model branding, capabilities, and filtering utilities
 * for the AI model selector component.
 */

export interface ModelBranding {
  name: string;
  shortName: string;
  provider: string;
  logo?: string;
  fallbackIcon: string;
  color: string;
  bgColor: string;
  borderColor: string;
  description?: string;
  isStarred?: boolean;
  isFree?: boolean;
  isCodeModel?: boolean;
  isReasoningModel?: boolean;
  isVisionModel?: boolean;
  isImageModel?: boolean;
  isDeepResearchModel?: boolean;
}

export const MODEL_BRANDING: Record<string, ModelBranding> = {
  // =========================================================================
  // ANTHROPIC MODELS
  // =========================================================================
  "anthropic/claude-sonnet-4.5": {
    name: "Claude Sonnet 4.5",
    shortName: "Claude Sonnet 4.5",
    provider: "Anthropic",
    logo: "/assets/logos/Claude_AI_symbol.svg",
    fallbackIcon: "C",
    color: "#D97706",
    bgColor: "rgba(217, 119, 6, 0.08)",
    borderColor: "rgba(217, 119, 6, 0.2)",
    description: "Most advanced Sonnet - optimized for coding",
    isStarred: true,
    isVisionModel: true,
  },
  "anthropic/claude-opus-4.5": {
    name: "Claude Opus 4.5",
    shortName: "Claude Opus 4.5",
    provider: "Anthropic",
    logo: "/assets/logos/Claude_AI_symbol.svg",
    fallbackIcon: "C",
    color: "#D97706",
    bgColor: "rgba(217, 119, 6, 0.08)",
    borderColor: "rgba(217, 119, 6, 0.2)",
    description: "Most powerful Claude model",
    isStarred: true,
    isVisionModel: true,
  },
  "anthropic/claude-haiku-4.5": {
    name: "Claude Haiku 4.5",
    shortName: "Claude Haiku",
    provider: "Anthropic",
    logo: "/assets/logos/Claude_AI_symbol.svg",
    fallbackIcon: "C",
    color: "#D97706",
    bgColor: "rgba(217, 119, 6, 0.08)",
    borderColor: "rgba(217, 119, 6, 0.2)",
    description: "Fast and efficient Claude",
    isVisionModel: true,
  },
  "anthropic/claude-sonnet-4": {
    name: "Claude Sonnet 4",
    shortName: "Claude Sonnet 4",
    provider: "Anthropic",
    logo: "/assets/logos/Claude_AI_symbol.svg",
    fallbackIcon: "C",
    color: "#D97706",
    bgColor: "rgba(217, 119, 6, 0.08)",
    borderColor: "rgba(217, 119, 6, 0.2)",
    description: "Balanced Claude model",
    isVisionModel: true,
  },

  // =========================================================================
  // OPENAI MODELS
  // =========================================================================
  "openai/gpt-4o": {
    name: "GPT-4o",
    shortName: "GPT-4o",
    provider: "OpenAI",
    logo: "/assets/logos/ChatGPT-Logo.svg",
    fallbackIcon: "G",
    color: "#10A37F",
    bgColor: "rgba(16, 163, 127, 0.08)",
    borderColor: "rgba(16, 163, 127, 0.2)",
    description: "Flagship multimodal model",
    isVisionModel: true,
  },
  "openai/gpt-4o-mini": {
    name: "GPT-4o Mini",
    shortName: "GPT-4o Mini",
    provider: "OpenAI",
    logo: "/assets/logos/ChatGPT-Logo.svg",
    fallbackIcon: "G",
    color: "#10A37F",
    bgColor: "rgba(16, 163, 127, 0.08)",
    borderColor: "rgba(16, 163, 127, 0.2)",
    description: "Smaller, faster GPT-4o",
    isVisionModel: true,
  },
  "openai/gpt-5.1": {
    name: "GPT-5.1",
    shortName: "GPT-5.1",
    provider: "OpenAI",
    logo: "/assets/logos/ChatGPT-Logo.svg",
    fallbackIcon: "G",
    color: "#10A37F",
    bgColor: "rgba(16, 163, 127, 0.08)",
    borderColor: "rgba(16, 163, 127, 0.2)",
    description: "Latest GPT-5 series",
    isStarred: true,
    isVisionModel: true,
  },
  "openai/o3-deep-research": {
    name: "O3 Deep Research",
    shortName: "O3 Research",
    provider: "OpenAI",
    logo: "/assets/logos/ChatGPT-Logo.svg",
    fallbackIcon: "🧠",
    color: "#10A37F",
    bgColor: "rgba(16, 163, 127, 0.08)",
    borderColor: "rgba(16, 163, 127, 0.2)",
    description: "Advanced deep research with extended reasoning",
    isDeepResearchModel: true,
  },

  // =========================================================================
  // GOOGLE MODELS
  // =========================================================================
  "google/gemini-3-pro-preview": {
    name: "Gemini 3 Pro",
    shortName: "Gemini 3 Pro",
    provider: "Google",
    logo: "/assets/logos/Google_Favicon_2025.svg",
    fallbackIcon: "G",
    color: "#4285F4",
    bgColor: "rgba(66, 133, 244, 0.08)",
    borderColor: "rgba(66, 133, 244, 0.2)",
    description: "Latest Gemini 3 model",
    isStarred: true,
    isVisionModel: true,
  },
  "google/gemini-2.5-pro": {
    name: "Gemini 2.5 Pro",
    shortName: "Gemini 2.5 Pro",
    provider: "Google",
    logo: "/assets/logos/Google_Favicon_2025.svg",
    fallbackIcon: "G",
    color: "#4285F4",
    bgColor: "rgba(66, 133, 244, 0.08)",
    borderColor: "rgba(66, 133, 244, 0.2)",
    description: "Advanced reasoning model",
    isVisionModel: true,
  },
  "google/gemini-2.5-flash": {
    name: "Gemini 2.5 Flash",
    shortName: "Gemini Flash",
    provider: "Google",
    logo: "/assets/logos/Google_Favicon_2025.svg",
    fallbackIcon: "G",
    color: "#4285F4",
    bgColor: "rgba(66, 133, 244, 0.08)",
    borderColor: "rgba(66, 133, 244, 0.2)",
    description: "Fast and efficient",
    isVisionModel: true,
  },

  // =========================================================================
  // DEEPSEEK MODELS
  // =========================================================================
  "deepseek/deepseek-v3.2": {
    name: "DeepSeek V3.2",
    shortName: "DeepSeek V3.2",
    provider: "DeepSeek",
    logo: "/assets/logos/DeepSeek-icon.svg",
    fallbackIcon: "D",
    color: "#4F46E5",
    bgColor: "rgba(79, 70, 229, 0.08)",
    borderColor: "rgba(79, 70, 229, 0.2)",
    description: "Latest DeepSeek model",
    isStarred: true,
  },
  "deepseek/deepseek-chat": {
    name: "DeepSeek Chat",
    shortName: "DeepSeek Chat",
    provider: "DeepSeek",
    logo: "/assets/logos/DeepSeek-icon.svg",
    fallbackIcon: "D",
    color: "#4F46E5",
    bgColor: "rgba(79, 70, 229, 0.08)",
    borderColor: "rgba(79, 70, 229, 0.2)",
    description: "Chat-optimized DeepSeek",
  },
  "deepseek/deepseek-reasoner": {
    name: "DeepSeek Reasoner",
    shortName: "DeepSeek R1",
    provider: "DeepSeek",
    logo: "/assets/logos/DeepSeek-icon.svg",
    fallbackIcon: "D",
    color: "#4F46E5",
    bgColor: "rgba(79, 70, 229, 0.08)",
    borderColor: "rgba(79, 70, 229, 0.2)",
    description: "Extended reasoning capabilities",
    isReasoningModel: true,
  },

  // =========================================================================
  // XAI MODELS
  // =========================================================================
  "x-ai/grok-4": {
    name: "Grok 4",
    shortName: "Grok 4",
    provider: "xAI",
    logo: "/assets/logos/XAI-Logo.svg",
    fallbackIcon: "X",
    color: "#1D9BF0",
    bgColor: "rgba(29, 155, 240, 0.08)",
    borderColor: "rgba(29, 155, 240, 0.2)",
    description: "Latest Grok model",
    isStarred: true,
    isVisionModel: true,
  },
  "x-ai/grok-4-fast": {
    name: "Grok 4 Fast",
    shortName: "Grok Fast",
    provider: "xAI",
    logo: "/assets/logos/XAI-Logo.svg",
    fallbackIcon: "X",
    color: "#1D9BF0",
    bgColor: "rgba(29, 155, 240, 0.08)",
    borderColor: "rgba(29, 155, 240, 0.2)",
    description: "Faster Grok variant",
    isVisionModel: true,
  },

  // =========================================================================
  // META LLAMA MODELS
  // =========================================================================
  "meta-llama/llama-4-maverick": {
    name: "Llama 4 Maverick",
    shortName: "Llama 4",
    provider: "Meta",
    logo: "/assets/logos/meta-color.svg",
    fallbackIcon: "M",
    color: "#0668E1",
    bgColor: "rgba(6, 104, 225, 0.08)",
    borderColor: "rgba(6, 104, 225, 0.2)",
    description: "Latest Llama flagship",
  },
  "meta-llama/llama-3.3-70b": {
    name: "Llama 3.3 70B",
    shortName: "Llama 70B",
    provider: "Meta",
    logo: "/assets/logos/meta-color.svg",
    fallbackIcon: "M",
    color: "#0668E1",
    bgColor: "rgba(6, 104, 225, 0.08)",
    borderColor: "rgba(6, 104, 225, 0.2)",
    description: "Large Llama model",
  },

  // =========================================================================
  // MISTRAL MODELS
  // =========================================================================
  "mistralai/mistral-large-2512": {
    name: "Mistral Large",
    shortName: "Mistral Large",
    provider: "Mistral",
    logo: "/assets/logos/mistral-color.svg",
    fallbackIcon: "M",
    color: "#F97316",
    bgColor: "rgba(249, 115, 22, 0.08)",
    borderColor: "rgba(249, 115, 22, 0.2)",
    description: "Most capable Mistral",
  },
  "mistralai/ministral-8b-2512": {
    name: "Ministral 8B",
    shortName: "Ministral 8B",
    provider: "Mistral",
    logo: "/assets/logos/mistral-color.svg",
    fallbackIcon: "M",
    color: "#F97316",
    bgColor: "rgba(249, 115, 22, 0.08)",
    borderColor: "rgba(249, 115, 22, 0.2)",
    description: "Small efficient model",
    isFree: true,
  },

  // =========================================================================
  // PERPLEXITY MODELS
  // =========================================================================
  "perplexity/sonar-pro": {
    name: "Sonar Pro",
    shortName: "Sonar Pro",
    provider: "Perplexity",
    logo: "/assets/logos/perplexity-color.svg",
    fallbackIcon: "🔍",
    color: "#22B8CD",
    bgColor: "rgba(34, 184, 205, 0.08)",
    borderColor: "rgba(34, 184, 205, 0.2)",
    description: "Advanced web-powered AI",
  },
  "perplexity/sonar-deep-research": {
    name: "Sonar Deep Research",
    shortName: "Sonar Research",
    provider: "Perplexity",
    logo: "/assets/logos/perplexity-color.svg",
    fallbackIcon: "🔍",
    color: "#22B8CD",
    bgColor: "rgba(34, 184, 205, 0.08)",
    borderColor: "rgba(34, 184, 205, 0.2)",
    description: "Deep research with citations",
    isDeepResearchModel: true,
  },

  // =========================================================================
  // QWEN MODELS
  // =========================================================================
  "qwen/qwen3-235b-a22b:free": {
    name: "Qwen3 235B",
    shortName: "Qwen3 235B",
    provider: "Qwen",
    logo: "/assets/logos/qwen-color.svg",
    fallbackIcon: "Q",
    color: "#6366F1",
    bgColor: "rgba(99, 102, 241, 0.08)",
    borderColor: "rgba(99, 102, 241, 0.2)",
    description: "Large Qwen model - free tier",
    isFree: true,
  },
  "qwen/qwen3-coder:free": {
    name: "Qwen3 Coder",
    shortName: "Qwen Coder",
    provider: "Qwen",
    logo: "/assets/logos/qwen-color.svg",
    fallbackIcon: "Q",
    color: "#6366F1",
    bgColor: "rgba(99, 102, 241, 0.08)",
    borderColor: "rgba(99, 102, 241, 0.2)",
    description: "Coding assistant - free tier",
    isCodeModel: true,
    isFree: true,
  },
};

// Default featured models
export const DEFAULT_FEATURED_MODELS = [
  "anthropic/claude-sonnet-4.5",
  "anthropic/claude-opus-4.5",
  "openai/gpt-5.1",
  "deepseek/deepseek-v3.2",
  "google/gemini-3-pro-preview",
  "x-ai/grok-4",
];

/**
 * Get branding for a model ID
 */
export function getModelBranding(modelId: string): ModelBranding {
  return (
    MODEL_BRANDING[modelId] || {
      name: modelId?.split("/")[1] || modelId || "Unknown",
      shortName: modelId?.split("/")[1] || modelId || "Unknown",
      provider: modelId?.split("/")[0] || "Unknown",
      fallbackIcon: "🤖",
      color: "#6B7280",
      bgColor: "rgba(107, 114, 128, 0.1)",
      borderColor: "rgba(107, 114, 128, 0.3)",
      description: "AI Model",
    }
  );
}

/**
 * Get starred/featured models
 */
export function getStarredModels() {
  return DEFAULT_FEATURED_MODELS
    .filter(
      (id) =>
        MODEL_BRANDING[id] &&
        !MODEL_BRANDING[id].isImageModel &&
        !MODEL_BRANDING[id].isDeepResearchModel
    )
    .map((id) => ({ id, ...MODEL_BRANDING[id] }));
}

/**
 * Get main chat models (excluding image and deep research)
 */
export function getMainModels() {
  return Object.entries(MODEL_BRANDING)
    .filter(
      ([_, config]) => !config.isImageModel && !config.isDeepResearchModel
    )
    .map(([id, config]) => ({ id, ...config }));
}

/**
 * Get all unique providers
 */
export function getAllProviders(): string[] {
  const providers = new Set<string>();
  Object.values(MODEL_BRANDING).forEach((config) => {
    if (!config.isImageModel && !config.isDeepResearchModel) {
      providers.add(config.provider);
    }
  });
  return Array.from(providers).sort();
}

/**
 * Get models by provider
 */
export function getModelsByProvider(provider: string) {
  return Object.entries(MODEL_BRANDING)
    .filter(
      ([_, config]) =>
        config.provider === provider &&
        !config.isImageModel &&
        !config.isDeepResearchModel
    )
    .map(([id, config]) => ({ id, ...config }));
}

/**
 * Search models by query
 */
export function searchModels(query: string) {
  if (!query || query.trim() === "") {
    return getMainModels();
  }
  const lowerQuery = query.toLowerCase().trim();
  return Object.entries(MODEL_BRANDING)
    .filter(([id, config]) => {
      if (config.isImageModel || config.isDeepResearchModel) return false;
      return (
        config.name.toLowerCase().includes(lowerQuery) ||
        config.shortName.toLowerCase().includes(lowerQuery) ||
        config.provider.toLowerCase().includes(lowerQuery) ||
        config.description?.toLowerCase().includes(lowerQuery) ||
        id.toLowerCase().includes(lowerQuery)
      );
    })
    .map(([id, config]) => ({ id, ...config }));
}

/**
 * Get tags/badges for a model
 */
export function getModelTags(modelId: string) {
  const config = MODEL_BRANDING[modelId];
  if (!config) return [];

  const tags: { label: string; color: string; bgColor: string }[] = [];
  if (config.isFree)
    tags.push({
      label: "Free",
      color: "#10B981",
      bgColor: "rgba(16, 185, 129, 0.15)",
    });
  if (config.isCodeModel)
    tags.push({
      label: "Code",
      color: "#3B82F6",
      bgColor: "rgba(59, 130, 246, 0.15)",
    });
  if (config.isReasoningModel)
    tags.push({
      label: "Reason",
      color: "#8B5CF6",
      bgColor: "rgba(139, 92, 246, 0.15)",
    });
  return tags;
}

/**
 * Filter models for Industry view (exclude coding, deep research, image models)
 */
export function getIndustryModels() {
  return Object.entries(MODEL_BRANDING)
    .filter(([_, config]) => {
      return (
        !config.isCodeModel &&
        !config.isDeepResearchModel &&
        !config.isImageModel
      );
    })
    .map(([id, config]) => ({ id, ...config }));
}

