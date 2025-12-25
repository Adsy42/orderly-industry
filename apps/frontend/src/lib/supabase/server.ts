import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Helper to safely get and validate env vars
 * Returns null if invalid, the trimmed value if valid
 */
function getEnvVar(name: string): string | null {
  const value = process.env[name];
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

/**
 * If using Fluid compute: Don't put this client in a global variable. Always create a new client within each
 * function when using it.
 */
export async function createClient() {
  const cookieStore = await cookies();

  const supabaseUrl = getEnvVar("NEXT_PUBLIC_SUPABASE_URL");
  const supabaseKey =
    getEnvVar("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY") ||
    getEnvVar("NEXT_PUBLIC_SUPABASE_ANON_KEY");

  if (!supabaseUrl || !supabaseKey) {
    const errorMsg =
      `Supabase environment variables not configured or invalid. ` +
      `NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? "✓" : "✗ MISSING"}, ` +
      `NEXT_PUBLIC_SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY: ${supabaseKey ? "✓" : "✗ MISSING"}. ` +
      `Please set these in Vercel Project Settings > Environment Variables and redeploy.`;
    console.error("[Supabase Server] " + errorMsg);
    throw new Error(errorMsg);
  }

  // Validate URL format
  if (
    !supabaseUrl.startsWith("https://") ||
    !supabaseUrl.includes(".supabase.")
  ) {
    const errorMsg = `Invalid NEXT_PUBLIC_SUPABASE_URL format: "${supabaseUrl.substring(0, 50)}...". Expected format: https://xxxxx.supabase.co`;
    console.error("[Supabase Server] " + errorMsg);
    throw new Error(errorMsg);
  }

  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  });
}
