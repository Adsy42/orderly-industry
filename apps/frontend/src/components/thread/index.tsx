import { v4 as uuidv4 } from "uuid";
import { ReactNode, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useStreamContext } from "@/providers/Stream";
import { useState, FormEvent } from "react";
import { Button } from "../ui/button";
import { Checkpoint, Message } from "@langchain/langgraph-sdk";
import { AssistantMessage, AssistantMessageLoading } from "./messages/ai";
import { HumanMessage } from "./messages/human";
import {
  DO_NOT_RENDER_ID_PREFIX,
  ensureToolCallsHaveResponses,
} from "@/lib/ensure-tool-responses";
import { TooltipIconButton } from "./tooltip-icon-button";
import {
  ArrowDown,
  LoaderCircle,
  PanelRightOpen,
  PanelRightClose,
  SquarePen,
  XIcon,
  Briefcase,
  FolderOpen,
  Scale,
  Sparkles,
  FileText,
  Search,
  ArrowRight,
  Users,
  Settings2,
  MessageSquare,
  ChevronDown,
  Check,
  Zap,
  BookOpen,
} from "lucide-react";
import { useQueryState, parseAsBoolean, parseAsString } from "nuqs";
import { StickToBottom, useStickToBottomContext } from "use-stick-to-bottom";
import ThreadHistory from "./history";
import { toast } from "sonner";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";
import { useFileUpload } from "@/hooks/use-file-upload";
import { ContentBlocksPreview } from "./ContentBlocksPreview";
import {
  useArtifactOpen,
  ArtifactContent,
  ArtifactTitle,
  useArtifactContext,
} from "./artifact";
import { useMatters } from "@/hooks/use-matters";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { createClient } from "@/lib/supabase/client";
import { ModelSelector } from "../model-selector";
import { MODEL_BRANDING } from "@/lib/models-config";
import Link from "next/link";

// Chat modes
type ChatMode = "chat" | "council";

// Quick suggestions for empty state
const QUICK_SUGGESTIONS = [
  {
    id: "research",
    label: "Research a legal question",
    icon: Search,
    prompt: "Research the legal requirements for...",
  },
  {
    id: "draft",
    label: "Draft a document",
    icon: FileText,
    prompt: "Draft a letter to...",
  },
  {
    id: "analyze",
    label: "Analyze a contract",
    icon: Scale,
    prompt: "Analyze this contract for...",
  },
  {
    id: "council",
    label: "Council deliberation",
    icon: Users,
    prompt: "Let multiple AI models deliberate on...",
  },
];

// Council models for deliberation
const COUNCIL_MODELS = [
  "anthropic/claude-sonnet-4.5",
  "openai/gpt-4o",
  "google/gemini-2.0-flash",
  "meta-llama/llama-3.3-70b-instruct",
];

function StickyToBottomContent(props: {
  content: ReactNode;
  footer?: ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  const context = useStickToBottomContext();
  return (
    <div
      ref={context.scrollRef}
      style={{ width: "100%", height: "100%" }}
      className={props.className}
    >
      <div
        ref={context.contentRef}
        className={props.contentClassName}
      >
        {props.content}
      </div>

      {props.footer}
    </div>
  );
}

function ScrollToBottom(props: { className?: string }) {
  const { isAtBottom, scrollToBottom } = useStickToBottomContext();

  if (isAtBottom) return null;
  return (
    <Button
      variant="outline"
      className={props.className}
      onClick={() => scrollToBottom()}
    >
      <ArrowDown className="h-4 w-4" />
      <span>Scroll to bottom</span>
    </Button>
  );
}

export function Thread() {
  const [artifactContext, setArtifactContext] = useArtifactContext();
  const [artifactOpen, closeArtifact] = useArtifactOpen();

  const [threadId, _setThreadId] = useQueryState("threadId");
  const [chatHistoryOpen, setChatHistoryOpen] = useQueryState(
    "chatHistoryOpen",
    parseAsBoolean.withDefault(false),
  );
  const [hideToolCalls, setHideToolCalls] = useQueryState(
    "hideToolCalls",
    parseAsBoolean.withDefault(false),
  );
  const [selectedMatterId, setSelectedMatterId] = useQueryState(
    "matterId",
    parseAsString.withDefault(""),
  );
  const [selectedDocumentId, setSelectedDocumentId] = useQueryState(
    "documentId",
    parseAsString.withDefault(""),
  );
  const { matters } = useMatters();
  const [documentName, setDocumentName] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [selectedModel, setSelectedModel] = useState("anthropic/claude-sonnet-4.5");
  const [chatMode, setChatMode] = useState<ChatMode>("chat");
  const [councilModels, setCouncilModels] = useState<string[]>(COUNCIL_MODELS);
  const [chairmanModel, setChairmanModel] = useState("anthropic/claude-sonnet-4.5");
  const [showCouncilSettings, setShowCouncilSettings] = useState(false);
  const {
    contentBlocks,
    setContentBlocks,
    handleFileUpload,
    dropRef,
    removeBlock,
    resetBlocks: _resetBlocks,
    dragOver,
    handlePaste,
  } = useFileUpload();
  const [firstTokenReceived, setFirstTokenReceived] = useState(false);
  const isLargeScreen = useMediaQuery("(min-width: 1024px)");

  const stream = useStreamContext();
  const messages = stream.messages;
  const isLoading = stream.isLoading;

  const lastError = useRef<string | undefined>(undefined);

  const setThreadId = (id: string | null) => {
    _setThreadId(id);

    // close artifact and reset artifact context
    closeArtifact();
    setArtifactContext({});
  };

  useEffect(() => {
    if (!stream.error) {
      lastError.current = undefined;
      return;
    }
    try {
      const message = (stream.error as any).message;
      if (!message || lastError.current === message) {
        // Message has already been logged. do not modify ref, return early.
        return;
      }

      // Message is defined, and it has not been logged yet. Save it, and send the error
      lastError.current = message;
      toast.error("An error occurred. Please try again.", {
        description: (
          <p>
            <strong>Error:</strong> <code>{message}</code>
          </p>
        ),
        richColors: true,
        closeButton: true,
      });
    } catch {
      // no-op
    }
  }, [stream.error]);

  // TODO: this should be part of the useStream hook
  const prevMessageLength = useRef(0);
  useEffect(() => {
    if (
      messages.length !== prevMessageLength.current &&
      messages?.length &&
      messages[messages.length - 1].type === "ai"
    ) {
      setFirstTokenReceived(true);
    }

    prevMessageLength.current = messages.length;
  }, [messages]);

  // Fetch document name when documentId is available
  useEffect(() => {
    async function fetchDocumentName() {
      if (!selectedDocumentId) {
        setDocumentName(null);
        return;
      }

      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("documents")
          .select("filename")
          .eq("id", selectedDocumentId)
          .single();

        if (error || !data) {
          console.error("Error fetching document:", error);
          setDocumentName(null);
        } else {
          setDocumentName(data.filename);
        }
      } catch (err) {
        console.error("Error fetching document name:", err);
        setDocumentName(null);
      }
    }

    fetchDocumentName();
  }, [selectedDocumentId]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if ((input.trim().length === 0 && contentBlocks.length === 0) || isLoading)
      return;
    setFirstTokenReceived(false);

    const newHumanMessage: Message = {
      id: uuidv4(),
      type: "human",
      content: [
        ...(input.trim().length > 0 ? [{ type: "text", text: input }] : []),
        ...contentBlocks,
      ] as Message["content"],
    };

    const toolMessages = ensureToolCallsHaveResponses(stream.messages);

    // Build context including matter_id if selected
    const matterContext = selectedMatterId
      ? { matter_id: selectedMatterId }
      : {};
    const context =
      Object.keys(artifactContext).length > 0 || selectedMatterId
        ? { ...artifactContext, ...matterContext }
        : undefined;

    // Build context message so LLM can see the matter_id UUID and optional document_id
    const contextMessages: Message[] = [];
    const selectedMatter = matters.find((m) => m.id === selectedMatterId);
    if (selectedMatter) {
      let contextContent = `[CONTEXT] The user has selected matter "${selectedMatter.title}" (matter_id: ${selectedMatter.id}).`;

      // Add document context if viewing a specific document
      if (selectedDocumentId && documentName) {
        contextContent += `\nThe user is currently viewing document "${documentName}" (document_id: ${selectedDocumentId}).`;
      }

      contextMessages.push({
        id: `${DO_NOT_RENDER_ID_PREFIX}context-${uuidv4()}`,
        type: "system",
        content: contextContent,
      } as Message);
    }

    stream.submit(
      {
        messages: [...toolMessages, ...contextMessages, newHumanMessage],
        context,
      },
      {
        streamMode: ["values"],
        streamSubgraphs: true,
        streamResumable: true,
        optimisticValues: (prev) => ({
          ...prev,
          context,
          messages: [
            ...(prev.messages ?? []),
            ...toolMessages,
            ...contextMessages,
            newHumanMessage,
          ],
        }),
      },
    );

    setInput("");
    setContentBlocks([]);
  };

  const handleRegenerate = (
    parentCheckpoint: Checkpoint | null | undefined,
  ) => {
    // Do this so the loading state is correct
    prevMessageLength.current = prevMessageLength.current - 1;
    setFirstTokenReceived(false);
    stream.submit(undefined, {
      checkpoint: parentCheckpoint,
      streamMode: ["values"],
      streamSubgraphs: true,
      streamResumable: true,
    });
  };

  const chatStarted = !!threadId || !!messages.length;
  const hasNoAIOrToolMessages = !messages.find(
    (m) => m.type === "ai" || m.type === "tool",
  );

  return (
    <div className="flex h-[calc(100vh-3.5rem)] w-full overflow-hidden">
      <div className="relative hidden lg:flex">
        <motion.div
          className="absolute z-20 h-full overflow-hidden border-r bg-white"
          style={{ width: 300 }}
          animate={
            isLargeScreen
              ? { x: chatHistoryOpen ? 0 : -300 }
              : { x: chatHistoryOpen ? 0 : -300 }
          }
          initial={{ x: -300 }}
          transition={
            isLargeScreen
              ? { type: "spring", stiffness: 300, damping: 30 }
              : { duration: 0 }
          }
        >
          <div
            className="relative h-full"
            style={{ width: 300 }}
          >
            <ThreadHistory />
          </div>
        </motion.div>
      </div>

      <div
        className={cn(
          "grid w-full grid-cols-[1fr_0fr] transition-all duration-500",
          artifactOpen && "grid-cols-[3fr_2fr]",
        )}
      >
        <motion.div
          className={cn(
            "relative flex min-w-0 flex-1 flex-col overflow-hidden",
            !chatStarted && "grid-rows-[1fr]",
          )}
          layout={isLargeScreen}
          animate={{
            marginLeft: chatHistoryOpen ? (isLargeScreen ? 300 : 0) : 0,
            width: chatHistoryOpen
              ? isLargeScreen
                ? "calc(100% - 300px)"
                : "100%"
              : "100%",
          }}
          transition={
            isLargeScreen
              ? { type: "spring", stiffness: 300, damping: 30 }
              : { duration: 0 }
          }
        >
          {!chatStarted && (
            <div className="absolute top-0 left-0 z-10 flex w-full items-center justify-between gap-3 p-2 pl-4">
              <div>
                {(!chatHistoryOpen || !isLargeScreen) && (
                  <Button
                    className="hover:bg-gray-100"
                    variant="ghost"
                    onClick={() => setChatHistoryOpen((p) => !p)}
                  >
                    {chatHistoryOpen ? (
                      <PanelRightOpen className="size-5" />
                    ) : (
                      <PanelRightClose className="size-5" />
                    )}
                  </Button>
                )}
              </div>
            </div>
          )}
          {chatStarted && (
            <div className="relative z-10 flex items-center justify-between gap-3 p-2">
              <div className="flex items-center gap-2">
                {(!chatHistoryOpen || !isLargeScreen) && (
                  <Button
                    className="hover:bg-gray-100"
                    variant="ghost"
                    onClick={() => setChatHistoryOpen((p) => !p)}
                  >
                    {chatHistoryOpen ? (
                      <PanelRightOpen className="size-5" />
                    ) : (
                      <PanelRightClose className="size-5" />
                    )}
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-4">
                <TooltipIconButton
                  size="lg"
                  className="p-4"
                  tooltip="New thread"
                  variant="ghost"
                  onClick={() => setThreadId(null)}
                >
                  <SquarePen className="size-5" />
                </TooltipIconButton>
              </div>

              <div className="from-background to-background/0 absolute inset-x-0 top-full h-5 bg-gradient-to-b" />
            </div>
          )}

          <StickToBottom className="relative flex-1 overflow-hidden">
            <StickyToBottomContent
              className={cn(
                "absolute inset-0 overflow-y-scroll px-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-track]:bg-transparent",
                !chatStarted && "flex flex-col items-center pt-8 pb-32",
                chatStarted && "grid grid-rows-[1fr_auto]",
              )}
              contentClassName={cn(
                "flex flex-col gap-4 w-full",
                chatStarted ? "pt-8 pb-16 max-w-3xl mx-auto" : "max-w-3xl mx-auto"
              )}
              content={
                <>
                  {/* Quick Suggestions - shown when no messages */}
                  {!chatStarted && (
                    <div className="flex flex-col items-center justify-center gap-8 px-4">
                      <div className="text-center">
                        <motion.div 
                          className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 shadow-lg shadow-primary/10"
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: 0.1 }}
                        >
                          <Sparkles className="h-10 w-10 text-primary" />
                        </motion.div>
                        <motion.h2 
                          className="text-3xl font-bold text-gray-900"
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.2 }}
                        >
                          How can I help you today?
                        </motion.h2>
                        <motion.p 
                          className="mx-auto mt-3 max-w-md text-gray-500"
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.3 }}
                        >
                          Ask me to draft documents, analyze cases, research legal questions, or let the AI council deliberate.
                        </motion.p>
                      </div>

                      <motion.div 
                        className="grid w-full max-w-2xl gap-3 sm:grid-cols-2"
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.4 }}
                      >
                        {QUICK_SUGGESTIONS.map((suggestion, index) => (
                          <motion.button
                            key={suggestion.id}
                            className={cn(
                              "group flex items-center gap-4 rounded-xl border bg-white p-4 text-left shadow-sm transition-all hover:shadow-md",
                              suggestion.id === "council" 
                                ? "border-indigo-200 hover:border-indigo-300" 
                                : "border-gray-200 hover:border-primary/30"
                            )}
                            onClick={() => {
                              if (suggestion.id === "council") {
                                setChatMode("council");
                              }
                              setInput(suggestion.prompt);
                            }}
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 + index * 0.1 }}
                          >
                            <div className={cn(
                              "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors",
                              suggestion.id === "council"
                                ? "bg-gradient-to-br from-indigo-100 to-purple-100 group-hover:from-indigo-200 group-hover:to-purple-200"
                                : "bg-primary/10 group-hover:bg-primary/20"
                            )}>
                              <suggestion.icon className={cn(
                                "h-5 w-5",
                                suggestion.id === "council" ? "text-indigo-600" : "text-primary"
                              )} />
                            </div>
                            <div className="flex-1 overflow-hidden">
                              <div className="font-medium text-gray-900">{suggestion.label}</div>
                              <div className="truncate text-sm text-gray-500">{suggestion.prompt}</div>
                            </div>
                            <ArrowRight className="h-4 w-4 text-gray-400 opacity-0 transition-opacity group-hover:opacity-100" />
                          </motion.button>
                        ))}
                      </motion.div>

                      {/* Quick Links */}
                      <motion.div 
                        className="flex flex-wrap items-center justify-center gap-3"
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.8 }}
                      >
                        <span className="text-sm text-gray-400">Quick access:</span>
                        <Link href="/protected/discovery" className="flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-600 transition-colors hover:bg-indigo-100">
                          <FolderOpen className="h-4 w-4" />
                          eDiscovery
                        </Link>
                        <Link href="/protected/court-orders" className="flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-600 transition-colors hover:bg-amber-100">
                          <Scale className="h-4 w-4" />
                          Court Orders
                        </Link>
                        <Link href="/protected/legal-research" className="flex items-center gap-1.5 rounded-full bg-purple-50 px-3 py-1.5 text-sm font-medium text-purple-600 transition-colors hover:bg-purple-100">
                          <BookOpen className="h-4 w-4" />
                          Research
                        </Link>
                        <Link href="/protected/workflows" className="flex items-center gap-1.5 rounded-full bg-pink-50 px-3 py-1.5 text-sm font-medium text-pink-600 transition-colors hover:bg-pink-100">
                          <Zap className="h-4 w-4" />
                          Workflows
                        </Link>
                      </motion.div>
                    </div>
                  )}
                  {messages
                    .filter((m) => !m.id?.startsWith(DO_NOT_RENDER_ID_PREFIX))
                    .map((message, index) =>
                      message.type === "human" ? (
                        <HumanMessage
                          key={message.id || `${message.type}-${index}`}
                          message={message}
                          isLoading={isLoading}
                        />
                      ) : (
                        <AssistantMessage
                          key={message.id || `${message.type}-${index}`}
                          message={message}
                          isLoading={isLoading}
                          handleRegenerate={handleRegenerate}
                        />
                      ),
                    )}
                  {/* Special rendering case where there are no AI/tool messages, but there is an interrupt.
                    We need to render it outside of the messages list, since there are no messages to render */}
                  {hasNoAIOrToolMessages && !!stream.interrupt && (
                    <AssistantMessage
                      key="interrupt-msg"
                      message={undefined}
                      isLoading={isLoading}
                      handleRegenerate={handleRegenerate}
                    />
                  )}
                  {isLoading && !firstTokenReceived && (
                    <AssistantMessageLoading />
                  )}
                </>
              }
              footer={
                <div className="sticky bottom-0 flex flex-col items-center gap-4 bg-white px-4 pb-6">
                  <ScrollToBottom className="animate-in fade-in-0 zoom-in-95 absolute bottom-full left-1/2 mb-4 -translate-x-1/2" />

                  {/* Mode Toggle */}
                  <div className="flex items-center gap-2 rounded-full bg-gray-100 p-1">
                    <button
                      type="button"
                      onClick={() => setChatMode("chat")}
                      className={cn(
                        "flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition-all",
                        chatMode === "chat"
                          ? "bg-white text-gray-900 shadow-sm"
                          : "text-gray-600 hover:text-gray-900"
                      )}
                    >
                      <MessageSquare className="h-4 w-4" />
                      Chat
                    </button>
                    <button
                      type="button"
                      onClick={() => setChatMode("council")}
                      className={cn(
                        "flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition-all",
                        chatMode === "council"
                          ? "bg-white text-gray-900 shadow-sm"
                          : "text-gray-600 hover:text-gray-900"
                      )}
                    >
                      <Users className="h-4 w-4" />
                      Council
                    </button>
                  </div>

                  {/* Council Info Bar */}
                  <AnimatePresence>
                    {chatMode === "council" && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="w-full max-w-3xl overflow-hidden"
                      >
                        <div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex -space-x-2">
                              {councilModels.slice(0, 4).map((modelId) => {
                                const branding = MODEL_BRANDING[modelId];
                                return (
                                  <div
                                    key={modelId}
                                    className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-white shadow-sm"
                                    title={branding?.name || modelId}
                                  >
                                    {branding?.logo ? (
                                      <img src={branding.logo} alt="" className="h-5 w-5 rounded-full object-contain" />
                                    ) : (
                                      <span className="text-xs font-medium">{branding?.fallbackIcon || "?"}</span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                LLM Council Deliberation
                              </div>
                              <div className="text-xs text-gray-500">
                                {councilModels.length} models • Chairman: {MODEL_BRANDING[chairmanModel]?.shortName || chairmanModel}
                              </div>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowCouncilSettings(true)}
                            className="gap-1.5 text-gray-600"
                          >
                            <Settings2 className="h-4 w-4" />
                            Configure
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Main Input Box */}
                  <div
                    ref={dropRef}
                    className={cn(
                      "bg-white relative z-10 w-full max-w-3xl rounded-2xl shadow-lg transition-all",
                      dragOver
                        ? "border-primary border-2 border-dotted"
                        : "border border-gray-200",
                    )}
                  >
                    <form
                      onSubmit={handleSubmit}
                      className="grid grid-rows-[1fr_auto]"
                    >
                      <ContentBlocksPreview
                        blocks={contentBlocks}
                        onRemove={removeBlock}
                      />
                      <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onPaste={handlePaste}
                        onKeyDown={(e) => {
                          if (
                            e.key === "Enter" &&
                            !e.shiftKey &&
                            !e.metaKey &&
                            !e.nativeEvent.isComposing
                          ) {
                            e.preventDefault();
                            const el = e.target as HTMLElement | undefined;
                            const form = el?.closest("form");
                            form?.requestSubmit();
                          }
                        }}
                        placeholder={chatMode === "council" ? "Ask the council to deliberate on..." : "Type your message..."}
                        className="field-sizing-content min-h-[60px] resize-none border-none bg-transparent p-4 pb-2 text-base shadow-none ring-0 outline-none focus:ring-0 focus:outline-none"
                      />

                      <div className="flex flex-wrap items-center gap-3 border-t border-gray-100 p-3">
                        {/* Matter Selector */}
                        <div className="flex items-center gap-2">
                          <Briefcase className="size-4 text-gray-400" />
                          <Select
                            value={selectedMatterId || "none"}
                            onValueChange={(value) =>
                              setSelectedMatterId(value === "none" ? "" : value)
                            }
                          >
                            <SelectTrigger className="h-8 w-[140px] border-0 bg-gray-50 text-xs">
                              <SelectValue placeholder="Matter..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">
                                <span className="text-gray-500">No matter</span>
                              </SelectItem>
                              {matters.map((matter) => (
                                <SelectItem key={matter.id} value={matter.id}>
                                  {matter.title}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Model Selector - only show in chat mode */}
                        {chatMode === "chat" && (
                          <ModelSelector
                            selectedModel={selectedModel}
                            onModelChange={setSelectedModel}
                            disabled={isLoading}
                            compact
                          />
                        )}

                        {/* Quick Links */}
                        <div className="hidden items-center gap-1 border-l border-gray-200 pl-3 sm:flex">
                          <Link href="/protected/legal-research">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-7 gap-1 px-2 text-xs text-gray-500 hover:text-primary"
                            >
                              <BookOpen className="h-3.5 w-3.5" />
                              Research
                            </Button>
                          </Link>
                          <Link href="/protected/workflows">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-7 gap-1 px-2 text-xs text-gray-500 hover:text-primary"
                            >
                              <Zap className="h-3.5 w-3.5" />
                              Workflows
                            </Button>
                          </Link>
                        </div>

                        <div className="ml-auto flex items-center gap-2">
                          <div className="hidden items-center space-x-2 sm:flex">
                            <Switch
                              id="render-tool-calls"
                              checked={hideToolCalls ?? false}
                              onCheckedChange={setHideToolCalls}
                            />
                            <Label htmlFor="render-tool-calls" className="text-xs text-gray-500">
                              Hide Tools
                            </Label>
                          </div>

                          {stream.isLoading ? (
                            <Button
                              key="stop"
                              onClick={() => stream.stop()}
                              variant="outline"
                            >
                              <LoaderCircle className="h-4 w-4 animate-spin" />
                              Cancel
                            </Button>
                          ) : (
                            <Button
                              type="submit"
                              className={cn(
                                "shadow-md transition-all",
                                chatMode === "council" && "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                              )}
                              disabled={
                                isLoading ||
                                (!input.trim() && contentBlocks.length === 0)
                              }
                            >
                              {chatMode === "council" ? (
                                <>
                                  <Users className="mr-1.5 h-4 w-4" />
                                  Deliberate
                                </>
                              ) : (
                                "Send"
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    </form>
                  </div>
                </div>
              }
            />
          </StickToBottom>
        </motion.div>
        <div className="relative flex flex-col border-l">
          <div className="absolute inset-0 flex min-w-[30vw] flex-col">
            <div className="grid grid-cols-[1fr_auto] border-b p-4">
              <ArtifactTitle className="truncate overflow-hidden" />
              <button
                onClick={closeArtifact}
                className="cursor-pointer"
              >
                <XIcon className="size-5" />
              </button>
            </div>
            <ArtifactContent className="relative flex-grow" />
          </div>
        </div>
      </div>

      {/* Council Settings Modal */}
      <AnimatePresence>
        {showCouncilSettings && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowCouncilSettings(false)}
          >
            <motion.div
              className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Council Settings</h2>
                    <p className="text-sm text-gray-500">Configure the LLM Council deliberation</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCouncilSettings(false)}
                  className="rounded-lg p-2 text-gray-400 hover:bg-gray-100"
                >
                  <XIcon className="h-5 w-5" />
                </button>
              </div>

              {/* Council Models Selection */}
              <div className="mb-6">
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Council Models (select 2-6)
                </label>
                <div className="grid gap-2 sm:grid-cols-2">
                  {Object.entries(MODEL_BRANDING).slice(0, 12).map(([modelId, branding]) => {
                    const isSelected = councilModels.includes(modelId);
                    return (
                      <button
                        key={modelId}
                        onClick={() => {
                          if (isSelected) {
                            setCouncilModels(prev => prev.filter(m => m !== modelId));
                          } else if (councilModels.length < 6) {
                            setCouncilModels(prev => [...prev, modelId]);
                          }
                        }}
                        className={cn(
                          "flex items-center gap-3 rounded-xl border-2 p-3 text-left transition-all",
                          isSelected
                            ? "border-indigo-500 bg-indigo-50"
                            : "border-gray-200 hover:border-gray-300"
                        )}
                      >
                        <div
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-white"
                          style={{ background: branding.bgColor }}
                        >
                          {branding.logo ? (
                            <img src={branding.logo} alt="" className="h-5 w-5 rounded object-contain" />
                          ) : (
                            <span className="text-xs font-bold">{branding.fallbackIcon}</span>
                          )}
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <div className="font-medium text-gray-900">{branding.shortName}</div>
                          <div className="truncate text-xs text-gray-500">{branding.provider}</div>
                        </div>
                        {isSelected && (
                          <Check className="h-4 w-4 text-indigo-600" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Chairman Model Selection */}
              <div className="mb-6">
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Chairman Model (synthesizes final answer)
                </label>
                <Select
                  value={chairmanModel}
                  onValueChange={setChairmanModel}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select chairman..." />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(MODEL_BRANDING).slice(0, 8).map(([modelId, branding]) => (
                      <SelectItem key={modelId} value={modelId}>
                        <div className="flex items-center gap-2">
                          <span>{branding.shortName}</span>
                          <span className="text-xs text-gray-400">({branding.provider})</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Info Box */}
              <div className="mb-6 rounded-xl bg-indigo-50 p-4">
                <h4 className="mb-2 font-medium text-indigo-900">How Council Deliberation Works</h4>
                <ul className="space-y-1 text-sm text-indigo-700">
                  <li>• <strong>Stage 1:</strong> All council models answer independently</li>
                  <li>• <strong>Stage 2:</strong> Models rank and evaluate each other&apos;s responses</li>
                  <li>• <strong>Stage 3:</strong> Chairman synthesizes the final answer</li>
                </ul>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowCouncilSettings(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => setShowCouncilSettings(false)}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                >
                  <Check className="mr-1.5 h-4 w-4" />
                  Apply Settings
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
