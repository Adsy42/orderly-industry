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
  getConversations: () => Promise<Conversation[]>;
  conversations: Conversation[];
  setConversations: Dispatch<SetStateAction<Conversation[]>>;
  conversationsLoading: boolean;
  setConversationsLoading: Dispatch<SetStateAction<boolean>>;
}

const ThreadContext = createContext<ThreadContextType | undefined>(undefined);

export function ThreadProvider({ children }: { children: ReactNode }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [conversationsLoading, setConversationsLoading] = useState(false);
  const [session, setSession] = useState<Session | null>(null);

  // Get session from Supabase client for JWT auth
  useEffect(() => {
    const supabase = createSupabaseClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

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
    getConversations,
    conversations,
    setConversations,
    conversationsLoading,
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
