import { validate } from "uuid";
import { getApiKey } from "@/lib/api-key";
import { Thread, Client } from "@langchain/langgraph-sdk";
import { useQueryState } from "nuqs";
import {
  createContext,
  useContext,
  ReactNode,
  useCallback,
  useState,
  useEffect,
  Dispatch,
  SetStateAction,
} from "react";
import { createClient as createSupabaseClient } from "@/lib/supabase/client";
import type { Session } from "@supabase/supabase-js";

interface Conversation {
  id: string;
  user_id: string;
  title: string | null;
  thread_id: string;
  created_at: string;
  updated_at: string;
}

interface ThreadContextType {
  getThreads: () => Promise<Thread[]>;
  getConversations: () => Promise<Conversation[]>;
  threads: Thread[];
  conversations: Conversation[];
  setThreads: Dispatch<SetStateAction<Thread[]>>;
  setConversations: Dispatch<SetStateAction<Conversation[]>>;
  threadsLoading: boolean;
  conversationsLoading: boolean;
  setThreadsLoading: Dispatch<SetStateAction<boolean>>;
  setConversationsLoading: Dispatch<SetStateAction<boolean>>;
}

const ThreadContext = createContext<ThreadContextType | undefined>(undefined);

function getThreadSearchMetadata(
  assistantId: string,
): { graph_id: string } | { assistant_id: string } {
  if (validate(assistantId)) {
    return { assistant_id: assistantId };
  } else {
    return { graph_id: assistantId };
  }
}

export function ThreadProvider({ children }: { children: ReactNode }) {
  const [apiUrl] = useQueryState("apiUrl");
  const [assistantId] = useQueryState("assistantId");
  const [threads, setThreads] = useState<Thread[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [threadsLoading, setThreadsLoading] = useState(false);
  const [conversationsLoading, setConversationsLoading] = useState(false);
  const [session, setSession] = useState<Session | null>(null);

  // Get session from Supabase client for JWT auth
  useEffect(() => {
    const supabase = createSupabaseClient();

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

  const getThreads = useCallback(async (): Promise<Thread[]> => {
    if (!apiUrl || !assistantId) return [];

    // Create client with auth - use Supabase JWT for local dev, or LangSmith API key for production
    const headers: Record<string, string> = {};
    if (session?.access_token) {
      headers["Authorization"] = `Bearer ${session.access_token}`;
    }

    const client = new Client({
      apiUrl,
      apiKey: getApiKey() || undefined,
      defaultHeaders: Object.keys(headers).length > 0 ? headers : undefined,
    });

    const threads = await client.threads.search({
      metadata: {
        ...getThreadSearchMetadata(assistantId),
      },
      limit: 100,
    });

    return threads;
  }, [apiUrl, assistantId, session?.access_token]);

  const getConversations = useCallback(async (): Promise<Conversation[]> => {
    if (!session?.user?.id) return [];

    try {
      const supabase = createSupabaseClient();
      const { data, error } = await supabase
        .from("conversations")
        .select("*")
        .eq("user_id", session.user.id)
        .order("updated_at", { ascending: false })
        .limit(100);

      if (error) {
        console.error("Failed to fetch conversations:", error);
        return [];
      }

      return (data || []) as Conversation[];
    } catch (error) {
      console.error("Error fetching conversations:", error);
      return [];
    }
  }, [session?.user?.id]);

  const value = {
    getThreads,
    getConversations,
    threads,
    conversations,
    setThreads,
    setConversations,
    threadsLoading,
    conversationsLoading,
    setThreadsLoading,
    setConversationsLoading,
  };

  return (
    <ThreadContext.Provider value={value}>{children}</ThreadContext.Provider>
  );
}

export function useThreads() {
  const context = useContext(ThreadContext);
  if (context === undefined) {
    throw new Error("useThreads must be used within a ThreadProvider");
  }
  return context;
}
