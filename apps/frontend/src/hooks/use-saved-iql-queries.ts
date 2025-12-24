"use client";

import * as React from "react";

export interface SavedIQLQuery {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  query_string: string;
  matter_id: string | null;
  created_at: string;
  updated_at: string;
}

interface UseSavedIQLQueriesOptions {
  matterId?: string;
}

interface UseSavedIQLQueriesReturn {
  queries: SavedIQLQuery[];
  isLoading: boolean;
  error: Error | null;
  createQuery: (
    name: string,
    queryString: string,
    description?: string,
    matterId?: string,
  ) => Promise<SavedIQLQuery | null>;
  updateQuery: (
    id: string,
    updates: Partial<
      Pick<SavedIQLQuery, "name" | "description" | "query_string" | "matter_id">
    >,
  ) => Promise<SavedIQLQuery | null>;
  deleteQuery: (id: string) => Promise<boolean>;
  refetch: () => Promise<void>;
}

export function useSavedIQLQueries({
  matterId,
}: UseSavedIQLQueriesOptions = {}): UseSavedIQLQueriesReturn {
  const [queries, setQueries] = React.useState<SavedIQLQuery[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  const fetchQueries = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const url = matterId
        ? `/api/iql/saved?matter_id=${matterId}`
        : "/api/iql/saved";
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch saved queries");
      }
      const data = await response.json();
      setQueries(data.queries || []);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"));
    } finally {
      setIsLoading(false);
    }
  }, [matterId]);

  React.useEffect(() => {
    fetchQueries();
  }, [fetchQueries]);

  const createQuery = React.useCallback(
    async (
      name: string,
      queryString: string,
      description?: string,
      matterId?: string,
    ): Promise<SavedIQLQuery | null> => {
      try {
        const response = await fetch("/api/iql/saved", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            query_string: queryString,
            description,
            matter_id: matterId,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to create saved query");
        }

        const data = await response.json();
        await fetchQueries();
        return data.query;
      } catch (err) {
        console.error("Error creating saved query:", err);
        return null;
      }
    },
    [fetchQueries],
  );

  const updateQuery = React.useCallback(
    async (
      id: string,
      updates: Partial<
        Pick<
          SavedIQLQuery,
          "name" | "description" | "query_string" | "matter_id"
        >
      >,
    ): Promise<SavedIQLQuery | null> => {
      try {
        const response = await fetch(`/api/iql/saved/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates),
        });

        if (!response.ok) {
          throw new Error("Failed to update saved query");
        }

        const data = await response.json();
        await fetchQueries();
        return data.query;
      } catch (err) {
        console.error("Error updating saved query:", err);
        return null;
      }
    },
    [fetchQueries],
  );

  const deleteQuery = React.useCallback(
    async (id: string): Promise<boolean> => {
      try {
        const response = await fetch(`/api/iql/saved/${id}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          throw new Error("Failed to delete saved query");
        }

        await fetchQueries();
        return true;
      } catch (err) {
        console.error("Error deleting saved query:", err);
        return false;
      }
    },
    [fetchQueries],
  );

  return {
    queries,
    isLoading,
    error,
    createQuery,
    updateQuery,
    deleteQuery,
    refetch: fetchQueries,
  };
}
