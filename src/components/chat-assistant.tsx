"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useChat, type UIMessage } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Bot, Trash2, X, PlusCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

import { supabase } from "@/integrations/supabase/client";
import { useAppState } from "@/hooks/use-app-state";
import { useAuth, displayNameOf } from "@/hooks/use-auth";
import { useDailyLog } from "@/hooks/use-dopamine";
import { todayISO } from "@/lib/habits";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Conversation, ConversationContent, ConversationEmptyState, ConversationScrollButton } from "@/components/ai-elements/conversation";
import { Message, MessageActions, MessageAction, MessageContent, MessageToolbar } from "@/components/ai-elements/message";
import { PromptInput, PromptInputFooter, PromptInputSubmit, PromptInputTextarea } from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";

const generateSafeId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return `id-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`;
};

type AppContext = {
  name: string;
  habits: { id: string; name: string; emoji: string }[];
  completedToday: string[];
  sessions: unknown[];
  outstand: unknown[];
  xp: number;
  bestStreak: number;
  dopamineScore: number;
};

type ChatPanelProps = {
  initialMessages: UIMessage[];
  appContext: AppContext;
  onClose: () => void;
  onClear: () => void;
};

type ApiErrorPayload = { error?: string; details?: string; code?: string };

async function describeResponseError(response: Response) {
  const raw = await response.text().catch(() => "");
  let payload: ApiErrorPayload | null = null;
  try {
    payload = raw ? (JSON.parse(raw) as ApiErrorPayload) : null;
  } catch {
    payload = null;
  }

  const base = payload?.error || raw || `${response.status} ${response.statusText}`;
  const extra = [payload?.details, payload?.code].filter(Boolean).join(" · ");
  return `${base}${extra ? ` — ${extra}` : ""}`;
}

function describeClientError(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "An unexpected AI error occurred.";
}

function ChatPanel({ initialMessages, appContext, onClose, onClear }: ChatPanelProps) {
  const [input, setInput] = useState("");
  const { addHabit } = useAppState();
  const appContextRef = useRef(appContext);
  const [serverAvailable, setServerAvailable] = useState<boolean | null>(null);
  const [serverMessage, setServerMessage] = useState<string | null>(null);

  useEffect(() => {
    appContextRef.current = appContext;
  }, [appContext]);

  useEffect(() => {
    let active = true;
    const checkServer = async () => {
      try {
        const response = await fetch("/api/chat", { method: "GET", cache: "no-store" });
        const message = response.ok ? null : await describeResponseError(response);
        if (active) {
          setServerAvailable(response.ok);
          setServerMessage(message);
        }
      } catch (error) {
        if (active) {
          setServerAvailable(false);
          setServerMessage(describeClientError(error));
        }
      }
    };

    void checkServer();
    return () => {
      active = false;
    };
  }, []);

  const { messages, status, sendMessage, stop, error } = useChat({
    id: "outstand-assistant",
    initialMessages,
    generateId: generateSafeId,
    transport: new DefaultChatTransport({
      api: "/api/chat",
      credentials: "same-origin",
    }),
    onError: (err) => {
      console.error("AI SDK Error:", err);
      toast.error(describeClientError(err));
    },
  });

  const isStreaming = status === "submitted" || status === "streaming";

  const handleSubmit = async (event?: React.FormEvent) => {
    event?.preventDefault();
    const text = input.trim();
    if (!text || isStreaming || serverAvailable === false) return;

    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      toast.error(`Could not read your session: ${sessionError.message}`);
      return;
    }
    if (!session?.access_token) {
      toast.error("Your session has expired. Please sign in again.");
      return;
    }

    setInput("");
    try {
      await sendMessage(
        { text },
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
          body: { appContext: appContextRef.current },
        },
      );
    } catch (err) {
      const message = describeClientError(err);
      console.error("AI message error:", err);
      toast.error(message);
      setInput(text);
    }
  };

  const handleClear = async () => {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      toast.error(`Could not read your session: ${sessionError.message}`);
      return;
    }
    if (!session?.access_token) {
      toast.error("Please sign in again.");
      return;
    }

    try {
      const response = await fetch("/api/chat", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!response.ok) throw new Error(await describeResponseError(response));
      onClear();
      toast.success("Memory wiped. Fresh start.");
    } catch (err) {
      toast.error(describeClientError(err));
    }
  };

  return (
    <div className="flex h-full flex-col">
      <DrawerHeader className="flex shrink-0 items-start justify-between border-b border-white/5 bg-slate-950/80 pb-4">
        <div className="text-left">
          <DrawerTitle className="flex items-center gap-2 text-base text-white">
            <span className="grid h-6 w-6 place-items-center rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 shadow-[0_0_15px_rgba(99,102,241,0.5)]">
              <Bot className="h-3.5 w-3.5 text-white" />
            </span>
            Outstand Intelligence
          </DrawerTitle>
          <DrawerDescription className="mt-1 text-xs text-slate-400">Real-time focus coaching and habit optimization.</DrawerDescription>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon-sm" onClick={handleClear} aria-label="Clear assistant memory" className="text-slate-500 hover:bg-rose-500/10 hover:text-rose-400"><Trash2 className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close assistant" className="text-slate-500 hover:bg-white/10 hover:text-white"><X className="h-4 w-4" /></Button>
        </div>
      </DrawerHeader>

      <Conversation className="flex-1 bg-slate-950/50 px-4 py-6">
        <ConversationContent>
          {messages.length === 0 ? (
            <ConversationEmptyState icon={<Bot className="h-10 w-10 text-indigo-400" />} title="Systems Online" description="Ask for a habit idea, a focus plan, or help recovering from a productivity slump." />
          ) : (
            messages.map((message) => (
              <Message key={message.id} from={message.role}>
                <MessageContent>
                  {message.parts?.map((part, index) => part.type === "text" ? (
                    <div key={`${message.id}-${index}`} className={cn("whitespace-pre-wrap leading-relaxed", message.role === "assistant" ? "text-slate-200" : "text-white")}>
                      {part.text}
                    </div>
                  ) : null)}

                  {message.role === "assistant" && message.parts?.some((part) => part.type === "tool-createHabit") && (
                    <div className="mt-4 rounded-2xl border border-indigo-500/30 bg-indigo-900/20 p-4">
                      <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-indigo-300"><Bot className="h-3 w-3" /> Recommended habit</div>
                      {message.parts.map((part, index) => {
                        if (part.type !== "tool-createHabit") return null;
                        const toolInput = part.input as { name?: string; emoji?: string; color?: string; reason?: string } | undefined;
                        if (!toolInput?.name) return null;
                        return (
                          <motion.div key={`${message.id}-habit-${index}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                            <div className="flex items-center gap-3">
                              <div className="grid h-11 w-11 place-items-center rounded-xl bg-indigo-500/15 text-xl">{toolInput.emoji || "✨"}</div>
                              <div className="min-w-0"><h4 className="font-bold text-white">{toolInput.name}</h4><p className="text-xs text-slate-400">{toolInput.reason || "A simple habit to strengthen consistency."}</p></div>
                            </div>
                            <Button onClick={() => { addHabit({ name: toolInput.name!, emoji: toolInput.emoji || "✨", color: toolInput.color || "primary" }); toast.success(`${toolInput.name} added to your habits.`, { icon: <CheckCircle2 className="h-4 w-4 text-emerald-400" /> }); }} className="w-full bg-indigo-600 text-white hover:bg-indigo-500"><PlusCircle className="mr-2 h-4 w-4" /> Add habit</Button>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </MessageContent>

                {message.role === "assistant" && (
                  <MessageToolbar>
                    <MessageActions>
                      <MessageAction tooltip="Copy response" label="Copy" onClick={() => { const text = message.parts?.filter((part) => part.type === "text").map((part) => part.text).join("") || ""; void navigator.clipboard.writeText(text); toast.success("Copied to clipboard"); }}>
                        <span className="text-xs text-slate-500 hover:text-white">Copy</span>
                      </MessageAction>
                    </MessageActions>
                  </MessageToolbar>
                )}
              </Message>
            ))
          )}

          <AnimatePresence>
            {isStreaming && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><Message from="assistant"><MessageContent><Shimmer className="text-sm font-medium text-indigo-400">Synthesizing response...</Shimmer></MessageContent></Message></motion.div>}
          </AnimatePresence>
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="shrink-0 border-t border-white/5 bg-slate-950 p-4">
        {serverAvailable === false && (
          <div className="mb-2 rounded-lg border border-amber-500/50 bg-amber-500/10 p-3 text-sm text-amber-200" role="status">
            <div className="font-semibold">AI service unavailable</div>
            <div className="mt-1 break-words text-xs text-amber-200/80">{serverMessage || "The chat endpoint could not be reached."}</div>
          </div>
        )}
        {error && <div className="mb-2 rounded-lg border border-rose-500/50 bg-rose-500/10 p-3 text-sm text-rose-300" role="alert"><strong>Connection failed:</strong> {describeClientError(error)}</div>}
        <PromptInput onSubmit={handleSubmit}>
          <PromptInputTextarea
            placeholder="Ask Outstand anything..."
            value={input}
            onChange={(event) => setInput(event.currentTarget.value)}
            disabled={isStreaming || serverAvailable === false}
            aria-label="Message Outstand Intelligence"
            onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void handleSubmit(); } }}
            className="resize-none border-white/10 bg-slate-900/50 text-white placeholder:text-slate-600 focus:border-indigo-500/50"
          />
          <PromptInputFooter className="justify-end pt-2">
            <PromptInputSubmit status={isStreaming ? "streaming" : "idle"} onStop={() => stop()} disabled={(!input.trim() && !isStreaming) || serverAvailable === false} aria-label={isStreaming ? "Stop response" : "Send message"} />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  );
}

export function ChatAssistant() {
  const [open, setOpen] = useState(false);
  const [initialMessages, setInitialMessages] = useState<UIMessage[]>([]);
  const [historyKey, setHistoryKey] = useState(0);
  const { user, profile } = useAuth();
  const { habits, sessions, outstand, xp, bestStreak } = useAppState();
  const { log } = useDailyLog();
  const today = todayISO();

  const appContext: AppContext = useMemo(() => ({
    name: displayNameOf(user, profile),
    habits: habits.map((habit) => ({ id: habit.id, name: habit.name, emoji: habit.emoji })),
    completedToday: habits.filter((habit) => habit.history.includes(today)).map((habit) => habit.id),
    sessions,
    outstand,
    xp,
    bestStreak,
    dopamineScore: log?.score ?? 50,
  }), [habits, sessions, outstand, xp, bestStreak, log, user, profile, today]);

  useEffect(() => {
    if (!open || !user) return;
    let cancelled = false;

    const loadHistory = async () => {
      try {
        const { data: conversation, error: conversationError } = await supabase.from("chat_conversations").select("id").eq("user_id", user.id).maybeSingle();
        if (conversationError) throw new Error(`${conversationError.message}${conversationError.code ? ` (${conversationError.code})` : ""}`);

        if (!conversation?.id) {
          if (!cancelled) setInitialMessages([]);
          return;
        }

        const { data: storedMessages, error: messageError } = await supabase.from("chat_messages").select("role, content, created_at").eq("conversation_id", conversation.id).order("created_at", { ascending: true });
        if (messageError) throw new Error(`${messageError.message}${messageError.code ? ` (${messageError.code})` : ""}`);

        const uiMessages: UIMessage[] = (storedMessages ?? [])
          .filter((message) => message.role === "user" || message.role === "assistant")
          .map((message) => ({ id: generateSafeId(), role: message.role as "user" | "assistant", parts: [{ type: "text", text: message.content }] }));

        if (!cancelled) setInitialMessages(uiMessages);
      } catch (error) {
        console.error("Failed to load chat history", error);
        if (!cancelled) {
          setInitialMessages([]);
          toast.error(`Could not load assistant history: ${describeClientError(error)}`);
        }
      }
    };

    void loadHistory();
    return () => { cancelled = true; };
  }, [open, user, historyKey]);

  if (!user) return null;

  return (
    <>
      <motion.div className="fixed bottom-24 right-4 z-[80] md:bottom-8 md:right-8" animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}>
        <Button onClick={() => setOpen(true)} aria-label="Open Outstand Intelligence" className="relative h-16 w-16 rounded-full border border-indigo-300/70 bg-slate-950 p-0 shadow-[0_0_35px_rgba(99,102,241,0.55)] hover:shadow-[0_0_50px_rgba(99,102,241,0.8)]">
          <span className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-500 via-blue-600 to-purple-600 opacity-95" />
          <span className="absolute inset-[2px] rounded-full bg-slate-950/30" />
          <Bot className="relative z-10 h-7 w-7 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.55)]" />
          <span className="absolute right-0 top-0 h-3.5 w-3.5 rounded-full border-2 border-slate-950 bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.9)]" aria-label="AI online" />
        </Button>
        <span className="pointer-events-none absolute right-0 top-full mt-2 whitespace-nowrap rounded-full border border-white/10 bg-slate-950/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-200 opacity-90 shadow-xl backdrop-blur-xl">
          AI Assistant
        </span>
      </motion.div>

      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent className="z-[90] h-[88vh] border-white/10 bg-slate-950/95 p-0 text-white backdrop-blur-2xl">
          <ChatPanel key={historyKey} initialMessages={initialMessages} appContext={appContext} onClose={() => setOpen(false)} onClear={() => { setInitialMessages([]); setHistoryKey((key) => key + 1); }} />
        </DrawerContent>
      </Drawer>
    </>
  );
}
