import { createBrowserClient } from "@supabase/ssr";

/**
 * Helper to validate env var value
 * Returns null if invalid, the trimmed value if valid
 */
function validateEnvValue(value: string | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  // Check for common misconfigurations
  if (
    trimmed === "" ||
    trimmed === "undefined" ||
    trimmed === "null" ||
    trimmed === "your-supabase-url" ||
    trimmed === "your-anon-key"
  ) {
    return null;
  }
  return trimmed;
}

export function createClient() {
  // IMPORTANT: Use direct property access for NEXT_PUBLIC_* vars
  // Next.js inlines these at build time - dynamic access like process.env[name] won't work
  const supabaseUrl = validateEnvValue(process.env.NEXT_PUBLIC_SUPABASE_URL);
  // Support both variable names for compatibility
  const supabaseKey =
    validateEnvValue(
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY,
    ) || validateEnvValue(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      `Supabase environment variables not configured or invalid. ` +
        `NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? "✓" : "✗ MISSING"}, ` +
        `NEXT_PUBLIC_SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY: ${supabaseKey ? "✓" : "✗ MISSING"}. ` +
        `Please check your environment variables.`,
    );
  }

  return createBrowserClient(supabaseUrl, supabaseKey);
}

// Singleton client for use across the app
let supabaseClient: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabaseClient() {
  if (!supabaseClient) {
    supabaseClient = createClient();
  }
  return supabaseClient;
}
