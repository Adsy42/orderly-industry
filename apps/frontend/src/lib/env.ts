/**
 * Environment Variable Helpers
 *
 * NO FALLBACKS - All environment variables are REQUIRED.
 * Missing variables will throw errors immediately, preventing hidden configuration issues.
 */

/**
 * Get required environment variable or throw error
 *
 * NO FALLBACKS - Throws an error immediately if the variable is missing or empty.
 * This ensures all configuration issues are caught early and never hidden.
 *
 * CI builds should set dummy values for build validation.
 * Production deployments must set all required variables.
 */
function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === "") {
    const errorMsg = `Missing required environment variable: ${name}`;
    console.error(`[ENV ERROR] ${errorMsg}`);
    console.error(
      `Please set ${name} in your .env.local file (or environment)`,
    );
    throw new Error(errorMsg);
  }
  return value.trim();
}

/**
 * API URL Configuration
 *
 * Client-side: NEXT_PUBLIC_API_URL is REQUIRED (typically '/api' for Next.js proxy)
 * Server-side: LANGGRAPH_API_URL is REQUIRED (LangSmith deployment URL or localhost:2024)
 *
 * The API route proxy (/api/[...path]) handles forwarding to the actual agent.
 */
export function getApiUrl(): string {
  // In browser/client-side code, use NEXT_PUBLIC_API_URL (REQUIRED)
  if (typeof window !== "undefined") {
    const clientUrl = getRequiredEnv("NEXT_PUBLIC_API_URL");

    // If it's a relative URL, make it absolute based on current origin
    if (clientUrl.startsWith("/")) {
      return `${window.location.origin}${clientUrl}`;
    }
    return clientUrl;
  }

  // Server-side: LANGGRAPH_API_URL is REQUIRED
  return getRequiredEnv("LANGGRAPH_API_URL");
}

/**
 * LangGraph API URL for server-side API routes
 * This is used by Next.js API routes to connect to the LangGraph agent
 *
 * REQUIRED: LANGGRAPH_API_URL must be set (e.g., http://localhost:2024 or LangSmith URL)
 */
export function getLangGraphApiUrl(): string {
  return getRequiredEnv("LANGGRAPH_API_URL");
}

/**
 * LangSmith API Key for authenticated requests
 *
 * REQUIRED: LANGSMITH_API_KEY must be set for LangSmith deployments
 */
export function getLangSmithApiKey(): string {
  return getRequiredEnv("LANGSMITH_API_KEY");
}

/**
 * Assistant ID (graph name)
 *
 * REQUIRED: NEXT_PUBLIC_ASSISTANT_ID must be set (e.g., 'deep_research')
 */
export function getAssistantId(): string {
  return getRequiredEnv("NEXT_PUBLIC_ASSISTANT_ID");
}

/**
 * Supabase Configuration
 *
 * REQUIRED: Both NEXT_PUBLIC_SUPABASE_URL and either:
 * - NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY, OR
 * - NEXT_PUBLIC_SUPABASE_ANON_KEY
 */
export function getSupabaseConfig() {
  const url = getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL");

  // Try publishable key first, then fall back to anon key (both are valid)
  let anonKey: string;
  try {
    anonKey = getRequiredEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY");
  } catch {
    anonKey = getRequiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  return { url, anonKey };
}

/**
 * Validate all required environment variables are set
 * Call this at app startup to fail fast if config is missing
 *
 * Validates ALL required environment variables (no exceptions)
 */
export function validateEnv() {
  const errors: string[] = [];

  try {
    getSupabaseConfig();
  } catch (error) {
    errors.push(
      error instanceof Error ? error.message : "Supabase configuration invalid",
    );
  }

  try {
    getApiUrl();
  } catch (error) {
    errors.push(
      error instanceof Error ? error.message : "API URL configuration invalid",
    );
  }

  try {
    getLangGraphApiUrl();
  } catch (error) {
    errors.push(
      error instanceof Error
        ? error.message
        : "LangGraph API URL configuration invalid",
    );
  }

  try {
    getAssistantId();
  } catch (error) {
    errors.push(
      error instanceof Error
        ? error.message
        : "Assistant ID configuration invalid",
    );
  }

  try {
    getLangSmithApiKey();
  } catch (error) {
    errors.push(
      error instanceof Error
        ? error.message
        : "LangSmith API Key configuration invalid",
    );
  }

  if (errors.length > 0) {
    throw new Error(`Environment validation failed:\n${errors.join("\n")}`);
  }
}
