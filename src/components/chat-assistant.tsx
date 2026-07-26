"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useChat, type UIMessage } from "@ai-sdk/react";
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
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageActions,
  MessageAction,
  MessageContent,
  MessageResponse,
  MessageToolbar,
} from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";

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

function ChatPanel({ initialMessages, appContext, onClose, onClear }: ChatPanelProps) {
  const [input, setInput] = useState("");
  const { addHabit } = useAppState(); 
  
  const appContextRef = useRef(appContext);
  useEffect(() => {
    appContextRef.current = appContext;
  }, [appContext]);

  const { messages, isLoading, append, stop, error } = useChat({
    id: "outstand-assistant",
    api: "/api/chat",
    initialMessages,
    onError: (err) => {
      console.error("AI SDK Error:", err);
      toast.error(`Error: ${err.message}`);
    },
    fetch: async (url, options) => {
      const { data: { session } } = await supabase.auth.getSession();
      const headers = new Headers(options?.headers);
      
      if (session?.access_token) {
        headers.set("Authorization", `Bearer ${session.access_token}`);
      }
      
      let reqBody: Record<string, any> = {};
      if (typeof options?.body === "string") {
        try {
          reqBody = JSON.parse(options.body);
        } catch (e) {
          reqBody = {};
        }
      }
      
      reqBody.appContext = appContextRef.current;

      return fetch(url, {
        ...options,
        headers,
        body: JSON.stringify(reqBody),
      });
    },
  });

  const handleSubmit = async (e?: React.FormEvent | React.MouseEvent | React.KeyboardEvent | any) => {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }
    
    if (!input.trim() || isLoading) return;
    const userText = input.trim();
    setInput("");
    
    try {
      await append({ role: "user", content: userText });
    } catch (err) {
      console.error("AI SDK append error:", err);
      toast.error("Failed to send message.");
    }
  };

  const handleClear = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const res = await fetch("/api/chat", {
      method: "DELETE",
      headers: { Authorization: `Bearer ${session.access_token}` },
    });

    if (res.ok) {
      onClear();
      toast.success("Memory wiped. Fresh start.");
    } else {
      toast.error("Failed to clear chat history.");
    }
  };

  return (
    <div className="flex h-full flex-col">
      <DrawerHeader className="flex shrink-0 items-start justify-between border-b border-white/5 pb-4 bg-slate-950/80">
        <div className="text-left">
          <DrawerTitle className="flex items-center gap-2 text-base text-white">
            <div className="grid h-6 w-6 place-items-center rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 shadow-[0_0_15px_rgba(99,102,241,0.5)]">
              <Bot className="h-3.5 w-3.5 text-white" />
            </div>
            Outstand Intelligence
          </DrawerTitle>
          <DrawerDescription className="text-xs text-slate-400 mt-1">
            Real-time focus coaching and habit optimization.
          </DrawerDescription>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon-sm" onClick={handleClear} className="text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors">
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={onClose} className="text-slate-500 hover:text-white hover:bg-white/10 transition-colors">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </DrawerHeader>

      <Conversation className="flex-1 px-4 py-6 bg-slate-950/50">
        <ConversationContent>
          {messages.length === 0 ? (
            <ConversationEmptyState
              icon={<Bot className="h-10 w-10 text-indigo-400 drop-shadow-[0_0_15px_rgba(129,140,248,0.5)]" />}
              title="Systems Online"
              description="I'm analyzing your dopamine baseline. Ask me to design a new habit for you, or how to recover from a focus slump."
            />
          ) : (
            messages.map((message) => (
              <Message key={message.id} from={message.role}>
                <MessageContent>
                  {message.content && (
                    <div className={cn(
                      "whitespace-pre-wrap leading-relaxed",
                      message.role === "assistant" ? "text-slate-200" : "text-white"
                    )}>
                      {message.content}
                    </div>
                  )}

                  {message.toolInvocations?.map((tool: any) => {
                    if (tool.toolName === "createHabit") {
                      return (
                        <motion.div 
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          key={tool.toolCallId} 
                          className="mt-4 mb-2 overflow-hidden rounded-2xl border border-indigo-500/40 bg-gradient-to-br from-indigo-900/40 to-slate-900/80 p-5 shadow-[0_8px_30px_rgb(0,0,0,0.12)] backdrop-blur-xl relative group"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                          
                          <div className="relative z-10">
                            <div className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-indigo-400">
                              <Bot className="h-3 w-3" /> Recommended Protocol
                            </div>
                            
                            <div className="mb-3 flex items-center gap-4">
                              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-500/20 text-2xl shadow-inner border border-indigo-500/30">
                                {tool.args.emoji}
                              </div>
                              <div>
                                <h4 className="text-lg font-black text-white tracking-tight">
                                  {tool.args.name}
                                </h4>
                                <p className="text-xs text-slate-400 line-clamp-2 mt-0.5">
                                  {tool.args.reason || "Strategic baseline adjustment."}
                                </p>
                              </div>
                            </div>

                            <Button 
                              onClick={() => {
                                addHabit({
                                  name: tool.args.name,
                                  emoji: tool.args.emoji,
                                  color: tool.args.color || "primary",
                                });
                                toast.success(`${tool.args.name} loaded into your dashboard.`, {
                                  icon: <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                                });
                              }}
                              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_30px_rgba(79,70,229,0.5)] transition-all duration-300 group-hover:-translate-y-0.5"
                            >
                              <PlusCircle className="mr-2 h-4 w-4" /> Integrate Habit
                            </Button>
                          </div>
                        </motion.div>
                      );
                    }
                    return null;
                  })}
                </MessageContent>
                
                {message.role === "assistant" && !message.toolInvocations && (
                  <MessageToolbar>
                    <MessageActions>
                      <MessageAction
                        tooltip="Copy response"
                        label="Copy"
                        onClick={() => {
                          navigator.clipboard.writeText(message.content);
                          toast.success("Copied to clipboard");
                        }}
                      >
                        <span className="text-xs text-slate-500 hover:text-white transition-colors">Copy</span>
                      </MessageAction>
                    </MessageActions>
                  </MessageToolbar>
                )}
              </Message>
            ))
          )}
          
          <AnimatePresence>
            {isLoading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Message from="assistant">
                  <MessageContent>
                    <Shimmer className="text-sm font-medium text-indigo-400 drop-shadow-[0_0_8px_rgba(129,140,248,0.5)]">
                      Synthesizing response...
                    </Shimmer>
                  </MessageContent>
                </Message>
              </motion.div>
            )}
          </AnimatePresence>
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="shrink-0 border-t border-white/5 p-4 bg-slate-950 flex flex-col gap-2">
        {error && (
          <div className="rounded-lg border border-rose-500/50 bg-rose-500/10 p-3 text-sm text-rose-400">
            <strong>Connection Failed:</strong> {error.message}
          </div>
        )}
        
        <PromptInput onSubmit={handleSubmit}>
          <PromptInputTextarea
            placeholder="Initialize command..."
            value={input}
            onChange={(e) => setInput(e.currentTarget.value)}
            disabled={isLoading}
            onSubmit={handleSubmit}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            className="bg-slate-900/50 border-white/10 text-white placeholder:text-slate-600 focus:border-indigo-500/50 transition-colors resize-none"
          />
          <PromptInputFooter className="justify-end pt-2">
            <PromptInputSubmit
              status={isLoading ? "streaming" : "idle"}
              onStop={stop}
              onClick={(e: any) => {
                if (!isLoading) {
                  handleSubmit(e);
                }
              }}
              disabled={(!input.trim() && !isLoading)}
            />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  );
          }
       export function ChatAssistant() {
  const [open, setOpen] = useState(false);
  const [initialMessages, setInitialMessages] = useState<UIMessage[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyKey, setHistoryKey] = useState(0);
  
  const { user, profile } = useAuth();
  const { habits, sessions, outstand, xp, bestStreak } = useAppState();
  const { log } = useDailyLog();
  const today = todayISO();

  const appContext: AppContext = useMemo(() => {
    const completedToday = habits.filter((h) => h.history.includes(today)).map((h) => h.id);
    return {
      name: displayNameOf(user, profile),
      habits: habits.map((h) => ({ id: h.id, name: h.name, emoji: h.emoji })),
      completedToday,
      sessions,
      outstand,
      xp,
      bestStreak,
      dopamineScore: log?.score ?? 50,
    };
  }, [habits, sessions, outstand, xp, bestStreak, log, user, profile, today]);

  useEffect(() => {
    if (!open || !user) return;

    setLoadingHistory(true);
    const load = async () => {
      try {
        const { data: conversation } = await supabase
          .from("chat_conversations")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (conversation?.id) {
          const { data: messages } = await supabase
            .from("chat_messages")
            .select("role, content, created_at")
            .eq("conversation_id", conversation.id)
            .order("created_at", { ascending: true });

          const uiMessages: UIMessage[] = (messages ?? [])
            .filter((m) => m.role === "user" || m.role === "assistant")
            .map((m) => ({
              id: crypto.randomUUID(),
              role: m.role as "user" | "assistant",
              content: m.content,
            }));
          setInitialMessages(uiMessages);
        } else {
          setInitialMessages([]);
        }
      } catch (err) {
        console.error("Failed to load chat history", err);
        setInitialMessages([]);
      } finally {
        setLoadingHistory(false);
      }
    };

    load();
  }, [open, user, historyKey]);

  const handleClear = () => {
    setHistoryKey((k) => k + 1);
  };

  return (
    <>
      <motion.div
        className="fixed bottom-24 right-4 md:bottom-8 md:right-8 z-50"
        animate={{ y: [0, -8, 0] }}
        transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
      >
        <Button
          onClick={() => setOpen(true)}
          className={cn(
            "relative h-14 w-14 rounded-full p-0 border border-indigo-400/50",
            "bg-slate-950 before:absolute before:inset-0 before:rounded-full before:bg-gradient-to-br before:from-indigo-500 before:to-purple-600 before:opacity-80",
            "shadow-[0_0_30px_rgba(99,102,241,0.5)] hover:shadow-[0_0_50px_rgba(168,85,247,0.7)] hover:border-purple-400/80",
            "transition-all duration-500 hover:scale-110 active:scale-95 group overflow-hidden"
          )}
          aria-label="Initialize Intelligence"
        >
          <div className="absolute inset-[-50%] bg-[conic-gradient(from_0deg,transparent_0_340deg,rgba(255,255,255,0.8)_360deg)] animate-[spin_3s_linear_infinite] opacity-50" />
          <div className="absolute inset-[2px] rounded-full bg-slate-950 z-10 flex items-center justify-center">
            <Bot className="h-6 w-6 text-indigo-400 group-hover:text-purple-300 transition-colors drop-shadow-[0_0_10px_rgba(129,140,248,0.8)]" />
          </div>
        </Button>
      </motion.div>

      <Drawer open={open} onOpenChange={setOpen} direction="bottom">
        <DrawerContent className="h-[90dvh] md:h-[85dvh] rounded-t-3xl border-t border-white/10 bg-slate-950/95 backdrop-blur-2xl shadow-[0_-20px_50px_rgba(0,0,0,0.5)]">
          <div className="sr-only">
            <DrawerTitle>Outstand Intelligence Assistant</DrawerTitle>
            <DrawerDescription>Real-time coaching chat interface</DrawerDescription>
          </div>

          {loadingHistory ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
              <div className="relative">
                <Bot className="h-10 w-10 text-indigo-500 drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]" />
                <motion.div 
                  className="absolute inset-0 border-2 border-indigo-500 rounded-full"
                  animate={{ scale: [1, 1.5, 2], opacity: [1, 0.5, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                />
              </div>
              <p className="text-sm font-medium tracking-widest text-slate-400 uppercase">Decrypting Archives...</p>
            </div>
          ) : (
            <ChatPanel
              key={historyKey}
              initialMessages={initialMessages}
              appContext={appContext}
              onClose={() => setOpen(false)}
              onClear={handleClear}
            />
          )}
        </DrawerContent>
      </Drawer>
    </>
  );
       }
      
