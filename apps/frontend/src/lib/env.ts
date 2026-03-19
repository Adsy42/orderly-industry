/**
 * Environment Variable Helpers
 *
 * NO FALLBACKS - All environment variables are REQUIRED.
 * Missing variables will throw errors immediately, preventing hidden configuration issues.
 */

/**
 * Get required environment variable or throw error
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
 * Client-side: NEXT_PUBLIC_API_URL is REQUIRED (typically '/api' for Next.js routes)
 * Server-side: Returns the same value
 */
export function getApiUrl(): string {
  if (typeof window !== "undefined") {
    const clientUrl = getRequiredEnv("NEXT_PUBLIC_API_URL");
    if (clientUrl.startsWith("/")) {
      return `${window.location.origin}${clientUrl}`;
    }
    return clientUrl;
  }
  return getRequiredEnv("NEXT_PUBLIC_API_URL");
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

  if (errors.length > 0) {
    throw new Error(`Environment validation failed:\n${errors.join("\n")}`);
  }
}
