import { createBrowserClient } from "@supabase/ssr";

/**
 * Helper to safely get and validate env vars
 * Returns null if invalid, the trimmed value if valid
 */
function normalizeEnvVar(value: string | undefined): string | null {
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
  /**
   * IMPORTANT (Next.js): Client-side env vars must be accessed statically like
   * `process.env.NEXT_PUBLIC_*` so the bundler can inline them.
   * Dynamic access (e.g. `process.env[name]`) will be `undefined` in the browser.
   */
  const supabaseUrl = normalizeEnvVar(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const supabaseKey =
    normalizeEnvVar(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY) ||
    normalizeEnvVar(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      `Supabase environment variables not configured or invalid. ` +
        `NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? "✓" : "✗ MISSING"}, ` +
        `NEXT_PUBLIC_SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY: ${supabaseKey ? "✓" : "✗ MISSING"}. ` +
        `Please set these in your environment.`,
    );
  }

  return createBrowserClient(supabaseUrl, supabaseKey);
}
