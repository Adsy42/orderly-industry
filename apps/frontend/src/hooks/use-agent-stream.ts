"use client";

import { useStream } from "@langchain/langgraph-sdk/react";
import { Message } from "@langchain/langgraph-sdk";
import { useAuth } from "@/providers/AuthProvider";
import { useMemo } from "react";
import { getApiUrl, getAssistantId } from "@/lib/env";

interface UseAgentStreamOptions {
  threadId?: string;
  onThreadId?: (threadId: string) => void;
}

/**
 * Custom hook for streaming agent responses with authentication.
 *
 * This hook wraps the LangGraph useStream hook and automatically
 * includes the user's JWT token in the request headers.
 */
export function useAgentStream(options?: UseAgentStreamOptions) {
  const { session } = useAuth();

  const defaultHeaders = useMemo(() => {
    if (!session?.access_token) {
      return undefined;
    }
    return {
      Authorization: `Bearer ${session.access_token}`,
    };
  }, [session?.access_token]);

  const stream = useStream<{ messages: Message[] }>({
    apiUrl: getApiUrl(),
    assistantId: getAssistantId(),
    threadId: options?.threadId ?? null,
    onThreadId: options?.onThreadId,
    defaultHeaders,
  });

  return {
    ...stream,
    isAuthenticated: !!session?.access_token,
  };
}
