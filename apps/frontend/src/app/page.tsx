import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) {
    // Not authenticated - redirect to login
    redirect("/auth/login");
  }

  // Authenticated users go to matters
  redirect("/protected/matters");
}
