import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      `Supabase environment variables not configured. ` +
        `NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? "✓" : "✗"}, ` +
        `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY: ${supabaseKey ? "✓" : "✗"}. ` +
        `Please check your Vercel environment variables.`,
    );
  }

  return createBrowserClient(
    supabaseUrl,
    supabaseKey,
  );
}
