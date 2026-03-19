import React, {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { useChat, type UIMessage } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useQueryState } from "nuqs";
import { useThreads } from "./Thread";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import type { Session } from "@supabase/supabase-js";

/**
 * Unified message type used across the app.
 * Maps Vercel AI SDK messages to a shape compatible with the existing components.
 */
export interface AppMessage {
  id: string;
  type: "human" | "ai" | "tool" | "system";
  content: string | ContentBlock[];
  tool_calls?: ToolCall[];
  tool_call_id?: string;
  name?: string;
}

export interface ContentBlock {
  type: string;
  text?: string;
  [key: string]: unknown;
}

export interface ToolCall {
  id: string;
  name: string;
  args: Record<string, unknown>;
  type?: string;
}

export interface StreamContextType {
  messages: AppMessage[];
  isLoading: boolean;
  error: Error | undefined;
  submit: (input: string, contentBlocks?: ContentBlock[]) => void;
  stop: () => void;
  threadId: string | null;
}

const StreamContext = createContext<StreamContextType | undefined>(undefined);

function uiMessageToAppMessage(msg: UIMessage): AppMessage {
  const roleMap: Record<string, AppMessage["type"]> = {
    user: "human",
    assistant: "ai",
    tool: "tool",
    system: "system",
  };

  const appMsg: AppMessage = {
    id: msg.id,
    type: roleMap[msg.role] || "ai",
    content: "",
  };

  // Extract text content from parts
  if (msg.parts) {
    const textParts = msg.parts
      .filter(
        (p): p is Extract<(typeof msg.parts)[number], { type: "text" }> =>
          p.type === "text",
      )
      .map((p) => p.text);

    if (textParts.length > 0) {
      appMsg.content = textParts.join("");
    }

    // Extract tool calls
    const toolCallParts = msg.parts.filter((p) => p.type === "tool-invocation");
    if (toolCallParts.length > 0) {
      appMsg.tool_calls = toolCallParts.map((p) => {
        const tc = p as unknown as {
          toolInvocationId: string;
          toolName: string;
          args: Record<string, unknown>;
        };
        return {
          id: tc.toolInvocationId || "",
          name: tc.toolName || "",
          args: tc.args || {},
          type: "tool_call",
        };
      });
    }
  }

  return appMsg;
}

const StreamSession = ({ children }: { children: ReactNode }) => {
  const [threadId, setThreadId] = useQueryState("threadId");
  const { getConversations, setConversations } = useThreads();
  const [session, setSession] = useState<Session | null>(null);

  // Get session from Supabase client
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Create transport with auth headers
  const transport = useMemo(() => {
    const authHeaders: Record<string, string> = {};
    if (session?.access_token) {
      authHeaders["Authorization"] = `Bearer ${session.access_token}`;
    }
    return new DefaultChatTransport({
      api: "/api/chat",
      headers: authHeaders,
      body: { conversationId: threadId },
    });
  }, [session?.access_token, threadId]);

  const chatHelpers = useChat({
    id: threadId || undefined,
    transport,
    onError: (err: Error) => {
      toast.error("An error occurred. Please try again.", {
        description: (
          <p>
            <strong>Error:</strong> <code>{err.message}</code>
          </p>
        ),
        richColors: true,
        closeButton: true,
      });
    },
  });

  const isLoading =
    chatHelpers.status === "streaming" || chatHelpers.status === "submitted";

  // Convert AI SDK messages to app messages
  const messages = useMemo(
    () => chatHelpers.messages.map(uiMessageToAppMessage),
    [chatHelpers.messages],
  );

  // Create a new conversation in Supabase when first message is sent
  const ensureConversation = useCallback(
    async (inputText: string) => {
      if (!session?.user?.id) return;

      if (!threadId) {
        const supabase = createClient();
        const title = inputText.trim().slice(0, 100) || "New conversation";
        const newThreadId = crypto.randomUUID();

        const { error } = await supabase.from("conversations").insert({
          user_id: session.user.id,
          thread_id: newThreadId,
          title,
        });

        if (!error) {
          setThreadId(newThreadId);
          getConversations().then(setConversations).catch(console.error);
        }
      }
    },
    [
      session?.user?.id,
      threadId,
      setThreadId,
      getConversations,
      setConversations,
    ],
  );

  const submit = useCallback(
    (input: string, _contentBlocks?: ContentBlock[]) => {
      ensureConversation(input);
      chatHelpers.sendMessage({ text: input });
    },
    [chatHelpers, ensureConversation],
  );

  // Reset messages when thread changes
  useEffect(() => {
    chatHelpers.setMessages([]);
  }, [threadId]); // eslint-disable-line react-hooks/exhaustive-deps

  const contextValue = useMemo<StreamContextType>(
    () => ({
      messages,
      isLoading,
      error: chatHelpers.error,
      submit,
      stop: chatHelpers.stop,
      threadId,
    }),
    [
      messages,
      isLoading,
      chatHelpers.error,
      submit,
      chatHelpers.stop,
      threadId,
    ],
  );

  return (
    <StreamContext.Provider value={contextValue}>
      {children}
    </StreamContext.Provider>
  );
};

export const StreamProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  return <StreamSession>{children}</StreamSession>;
};

export const useStreamContext = (): StreamContextType => {
  const context = useContext(StreamContext);
  if (context === undefined) {
    throw new Error("useStreamContext must be used within a StreamProvider");
  }
  return context;
};

export default StreamContext;
