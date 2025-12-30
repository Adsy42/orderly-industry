import React, {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
  useMemo,
} from "react";
import { useStream } from "@langchain/langgraph-sdk/react";
import {
  uiMessageReducer,
  isUIMessage,
  isRemoveUIMessage,
  type UIMessage,
  type RemoveUIMessage,
} from "@langchain/langgraph-sdk/react-ui";
import { useQueryState } from "nuqs";
import { getApiKey } from "@/lib/api-key";
import { useThreads } from "./Thread";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import type { Session } from "@supabase/supabase-js";
import { getContentString } from "@/components/thread/utils";
import type { Message } from "@langchain/langgraph-sdk";
import { getApiUrl, getAssistantId } from "@/lib/env";

export type StateType = { messages: Message[]; ui?: UIMessage[] };

const useTypedStream = useStream<
  StateType,
  {
    UpdateType: {
      messages?: Message[] | Message | string;
      ui?: (UIMessage | RemoveUIMessage)[] | UIMessage | RemoveUIMessage;
      context?: Record<string, unknown>;
    };
    CustomEventType: UIMessage | RemoveUIMessage;
  }
>;

type StreamContextType = ReturnType<typeof useTypedStream>;
const StreamContext = createContext<StreamContextType | undefined>(undefined);

async function sleep(ms = 4000) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function checkGraphStatus(
  apiUrl: string,
  apiKey: string | null,
  authToken: string | null,
): Promise<boolean> {
  try {
    const headers: Record<string, string> = {};
    if (apiKey) {
      headers["X-Api-Key"] = apiKey;
    }
    if (authToken) {
      headers["Authorization"] = `Bearer ${authToken}`;
    }

    const res = await fetch(`${apiUrl}/info`, {
      headers: Object.keys(headers).length > 0 ? headers : undefined,
    });

    return res.ok;
  } catch (e) {
    console.error(e);
    return false;
  }
}

const StreamSession = ({
  children,
  apiKey,
  apiUrl,
  assistantId,
}: {
  children: ReactNode;
  apiKey: string | null;
  apiUrl: string;
  assistantId: string;
}) => {
  // #region agent log
  fetch("http://127.0.0.1:7243/ingest/b05c2d04-a0a4-474b-97d6-e4c51366f6f1", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      location: "Stream.tsx:StreamSession",
      message: "H4: Props received by StreamSession",
      data: { apiKey: apiKey ? "[REDACTED]" : null, apiUrl, assistantId },
      timestamp: Date.now(),
      sessionId: "debug-session",
      hypothesisId: "H4",
    }),
  }).catch(() => {});
  // #endregion
  const [threadId, setThreadId] = useQueryState("threadId");
  const { getThreads, setThreads, getConversations, setConversations } =
    useThreads();
  const [session, setSession] = useState<Session | null>(null);

  // Get session from Supabase client
  useEffect(() => {
    const supabase = createClient();

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Build default headers with JWT token for authentication
  const defaultHeaders = useMemo(() => {
    const h: Record<string, string> = {};
    if (session?.access_token) {
      h["Authorization"] = `Bearer ${session.access_token}`;
    }
    return Object.keys(h).length > 0 ? h : undefined;
  }, [session?.access_token]);

  // #region agent log
  fetch("http://127.0.0.1:7243/ingest/b05c2d04-a0a4-474b-97d6-e4c51366f6f1", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      location: "Stream.tsx:useTypedStream",
      message: "H5: Params passed to useTypedStream hook",
      data: {
        apiUrl,
        assistantId,
        threadId,
        hasDefaultHeaders: !!defaultHeaders,
      },
      timestamp: Date.now(),
      sessionId: "debug-session",
      hypothesisId: "H5",
    }),
  }).catch(() => {});
  // #endregion
  const streamValue = useTypedStream({
    apiUrl,
    apiKey: apiKey || undefined, // Use || to treat empty string as undefined
    assistantId,
    threadId: threadId ?? null,
    fetchStateHistory: true,
    defaultHeaders,
    onCustomEvent: (event, options) => {
      if (isUIMessage(event) || isRemoveUIMessage(event)) {
        options.mutate((prev) => {
          const ui = uiMessageReducer(prev.ui ?? [], event);
          return { ...prev, ui };
        });
      }
    },
    onThreadId: async (id) => {
      setThreadId(id);

      // Save conversation to Supabase when a new thread is created
      if (id && session?.user?.id) {
        try {
          const supabase = createClient();

          // Check if conversation already exists
          const { data: existing } = await supabase
            .from("conversations")
            .select("id")
            .eq("thread_id", id)
            .eq("user_id", session.user.id)
            .single();

          if (!existing) {
            // Create new conversation with default title (will be updated when first message arrives)
            await supabase.from("conversations").insert({
              user_id: session.user.id,
              thread_id: id,
              title: "New conversation",
            });
          }
        } catch (error) {
          console.error("Failed to save conversation:", error);
          // Don't show error to user - this is a background operation
        }
      }

      // Refetch threads list and conversations when thread ID changes.
      // Wait for some seconds before fetching so we're able to get the new thread that was created.
      sleep().then(() => {
        getThreads().then(setThreads).catch(console.error);
        getConversations().then(setConversations).catch(console.error);
      });
    },
  });

  // Update conversation title when first human message arrives
  useEffect(() => {
    if (!threadId || !session?.user?.id || !streamValue.values?.messages)
      return;

    const messages = streamValue.values.messages;
    const firstHumanMessage = messages.find((m: Message) => m.type === "human");

    if (firstHumanMessage) {
      const contentString = getContentString(firstHumanMessage.content);
      const title = contentString.trim().slice(0, 100) || "New conversation";

      // Update conversation title if we have a meaningful title
      if (title && title !== "New conversation") {
        const supabase = createClient();
        supabase
          .from("conversations")
          .update({ title, updated_at: new Date().toISOString() })
          .eq("thread_id", threadId)
          .eq("user_id", session.user.id)
          .then(({ error }) => {
            if (error) {
              console.error("Failed to update conversation title:", error);
            } else {
              // Refresh conversations list after updating title
              getConversations().then(setConversations).catch(console.error);
            }
          });
      }
    }
  }, [
    threadId,
    session?.user?.id,
    streamValue.values?.messages,
    getConversations,
    setConversations,
  ]);

  useEffect(() => {
    // Only check status once we have a session (or after a delay if no auth required)
    if (!session?.access_token) return;

    checkGraphStatus(apiUrl, apiKey, session.access_token).then((ok) => {
      if (!ok) {
        toast.error("Failed to connect to Orderly server", {
          description: () => (
            <p>
              Please ensure your graph is running at <code>{apiUrl}</code> and
              your API key is correctly set (if connecting to a deployed graph).
            </p>
          ),
          duration: 10000,
          richColors: true,
          closeButton: true,
        });
      }
    });
  }, [apiKey, apiUrl, session?.access_token]);

  return (
    <StreamContext.Provider value={streamValue}>
      {children}
    </StreamContext.Provider>
  );
};

// Default assistant ID when not configured - must match registered graph name in langgraph.json
const DEFAULT_ASSISTANT_ID = "deep_research";

/**
 * Get the API URL for LangGraph requests.
 * The LangGraph SDK requires a full URL (not relative path) for the URL constructor.
 * In production, requests go through /api/* passthrough route.
 */
// Note: getApiUrl() handles environment variable resolution
// Client-side: Uses NEXT_PUBLIC_API_URL (defaults to '/api' for Next.js proxy)
// Server-side: Uses LANGGRAPH_API_URL (required in production)

export const StreamProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  // Get environment variables with validation
  // In browser, getApiUrl() uses NEXT_PUBLIC_API_URL (defaults to '/api' for Next.js proxy)
  // Assistant ID defaults to 'deep_research' if not set
  const envApiUrl: string = getApiUrl();
  const envAssistantId: string = getAssistantId();
  // #region agent log
  fetch("http://127.0.0.1:7243/ingest/b05c2d04-a0a4-474b-97d6-e4c51366f6f1", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      location: "Stream.tsx:StreamProvider",
      message: "H1/H2: Checking env vars and defaults",
      data: {
        NEXT_PUBLIC_ASSISTANT_ID: process.env.NEXT_PUBLIC_ASSISTANT_ID,
        DEFAULT_ASSISTANT_ID,
        envAssistantId,
        envApiUrl,
      },
      timestamp: Date.now(),
      sessionId: "debug-session",
      hypothesisId: "H1-H2",
    }),
  }).catch(() => {});
  // #endregion

  // Use URL params with env var fallbacks (allows override via query string if needed)
  const [apiUrl] = useQueryState("apiUrl", {
    defaultValue: envApiUrl,
  });
  const [assistantId] = useQueryState("assistantId", {
    defaultValue: envAssistantId,
  });

  // For API key, use localStorage (only needed for direct LangSmith connections, not passthrough)
  const [apiKey] = useState(() => {
    const storedKey = getApiKey();
    return storedKey || "";
  });

  // Resolve API URL - ensure it's a full URL for the LangGraph SDK
  const resolvedApiUrl = useMemo(() => {
    const url = apiUrl || envApiUrl;
    // If it's already a full URL, use it as-is
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }
    // Otherwise, make it a full URL using the current origin
    if (typeof window !== "undefined") {
      return `${window.location.origin}${url.startsWith("/") ? "" : "/"}${url}`;
    }
    return url;
  }, [apiUrl, envApiUrl]);

  const finalAssistantId = assistantId || envAssistantId;
  // #region agent log
  fetch("http://127.0.0.1:7243/ingest/b05c2d04-a0a4-474b-97d6-e4c51366f6f1", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      location: "Stream.tsx:StreamProvider:render",
      message: "H3: Final values passed to StreamSession",
      data: { assistantId, envAssistantId, finalAssistantId, resolvedApiUrl },
      timestamp: Date.now(),
      sessionId: "debug-session",
      hypothesisId: "H3",
    }),
  }).catch(() => {});
  // #endregion

  return (
    <StreamSession
      apiKey={apiKey || null}
      apiUrl={resolvedApiUrl}
      assistantId={finalAssistantId}
    >
      {children}
    </StreamSession>
  );
};

// Create a custom hook to use the context
export const useStreamContext = (): StreamContextType => {
  const context = useContext(StreamContext);
  if (context === undefined) {
    throw new Error("useStreamContext must be used within a StreamProvider");
  }
  return context;
};

export default StreamContext;
