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

export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  const supabaseUrl = getEnvVar("NEXT_PUBLIC_SUPABASE_URL");
  // Support both variable names for compatibility
  const supabaseKey =
    getEnvVar("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY") ||
    getEnvVar("NEXT_PUBLIC_SUPABASE_ANON_KEY");

  // Always log for debugging production issues
  console.log("[Supabase Server] Environment check:", {
    hasUrl: !!supabaseUrl,
    urlPrefix: supabaseUrl?.substring(0, 40),
    hasKey: !!supabaseKey,
    keyPrefix: supabaseKey?.substring(0, 15),
    rawEnvCheck: {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL
        ? `set (${process.env.NEXT_PUBLIC_SUPABASE_URL.length} chars)`
        : "NOT SET",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY: process.env
        .NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY
        ? `set (${process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY.length} chars)`
        : "NOT SET",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        ? `set (${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length} chars)`
        : "NOT SET",
    },
  });

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
