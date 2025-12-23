"use client";

import * as React from "react";
import { createClient } from "@/lib/supabase/client";

export interface Matter {
  id: string;
  title: string;
  description: string | null;
  matter_number: string;
  status: "active" | "closed" | "archived";
  jurisdiction: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface MatterWithDocumentCount extends Matter {
  documents: [{ count: number }];
}

export interface CreateMatterInput {
  title: string;
  description?: string;
}

export interface UpdateMatterInput {
  title?: string;
  description?: string;
  status?: "active" | "closed" | "archived";
}

interface UseMattersReturn {
  matters: MatterWithDocumentCount[];
  isLoading: boolean;
  error: Error | null;
  createMatter: (input: CreateMatterInput) => Promise<Matter | null>;
  updateMatter: (
    id: string,
    input: UpdateMatterInput,
  ) => Promise<Matter | null>;
  deleteMatter: (id: string) => Promise<boolean>;
  getMatter: (id: string) => Promise<MatterWithDocumentCount | null>;
  refetch: () => Promise<void>;
}

export function useMatters(): UseMattersReturn {
  const [matters, setMatters] = React.useState<MatterWithDocumentCount[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  const fetchMatters = React.useCallback(async () => {
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from("matters")
        .select("*, documents(count)")
        .order("updated_at", { ascending: false });

      if (fetchError) throw new Error(fetchError.message);
      setMatters((data as MatterWithDocumentCount[]) || []);
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("Failed to fetch matters"),
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchMatters();
  }, [fetchMatters]);

  const createMatter = React.useCallback(
    async (input: CreateMatterInput): Promise<Matter | null> => {
      const supabase = createClient();
      setError(null);

      try {
        const { data, error: createError } = await supabase
          .from("matters")
          .insert({
            title: input.title,
            description: input.description || null,
          })
          .select()
          .single();

        if (createError) throw new Error(createError.message);

        // Refetch to get updated list with document counts
        await fetchMatters();
        return data as Matter;
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error("Failed to create matter"),
        );
        return null;
      }
    },
    [fetchMatters],
  );

  const updateMatter = React.useCallback(
    async (id: string, input: UpdateMatterInput): Promise<Matter | null> => {
      const supabase = createClient();
      setError(null);

      try {
        const { data, error: updateError } = await supabase
          .from("matters")
          .update(input)
          .eq("id", id)
          .select()
          .single();

        if (updateError) throw new Error(updateError.message);

        // Refetch to get updated list
        await fetchMatters();
        return data as Matter;
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error("Failed to update matter"),
        );
        return null;
      }
    },
    [fetchMatters],
  );

  const deleteMatter = React.useCallback(
    async (id: string): Promise<boolean> => {
      const supabase = createClient();
      setError(null);

      try {
        const { error: deleteError } = await supabase
          .from("matters")
          .delete()
          .eq("id", id);

        if (deleteError) throw new Error(deleteError.message);

        // Remove from local state
        setMatters((prev) => prev.filter((m) => m.id !== id));
        return true;
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error("Failed to delete matter"),
        );
        return false;
      }
    },
    [],
  );

  const getMatter = React.useCallback(
    async (id: string): Promise<MatterWithDocumentCount | null> => {
      const supabase = createClient();
      setError(null);

      try {
        const { data, error: fetchError } = await supabase
          .from("matters")
          .select("*, documents(count)")
          .eq("id", id)
          .single();

        if (fetchError) throw new Error(fetchError.message);
        return data as MatterWithDocumentCount;
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error("Failed to fetch matter"),
        );
        return null;
      }
    },
    [],
  );

  return {
    matters,
    isLoading,
    error,
    createMatter,
    updateMatter,
    deleteMatter,
    getMatter,
    refetch: fetchMatters,
  };
}

export type { UseMattersReturn };
