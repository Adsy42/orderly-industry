/**
 * Legal Answer Tool - calls Supabase Edge Function
 *
 * Extractive QA: embed → search → rerank → extract
 * Returns exact character positions for document highlighting.
 */

import { createClient } from "@/lib/supabase/server";

interface LegalAnswerParams {
  matter_id: string;
  question: string;
  document_ids?: string[];
}

export async function executeLegalAnswer(params: LegalAnswerParams) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

  const response = await fetch(`${supabaseUrl}/functions/v1/legal-answer`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session?.access_token || ""}`,
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Legal answer failed: ${response.status} ${errorText}`);
  }

  return response.json();
}
