/**
 * Legal Classify Tool - calls Supabase Edge Function
 *
 * Clause finding: embed → search → IQL classify
 * Returns exact character positions for document highlighting.
 */

import { createClient } from "@/lib/supabase/server";

interface LegalClassifyParams {
  matter_id: string;
  clause_type: string;
  document_ids?: string[];
}

export async function executeLegalClassify(params: LegalClassifyParams) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

  const response = await fetch(`${supabaseUrl}/functions/v1/legal-classify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session?.access_token || ""}`,
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Legal classify failed: ${response.status} ${errorText}`);
  }

  return response.json();
}
