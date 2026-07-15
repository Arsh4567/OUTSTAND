"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useChat, type UIMessage } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Bot, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion"; // <-- Added for the floating effect

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
  const appContextRef = useRef(appContext);
  appContextRef.current = appContext;

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        prepareSendMessagesRequest: async ({ messages }) => {
          const {
            data: { session },
          } = await supabase.auth.getSession();
          const headers: Record<string, string> = {};
          if (session?.access_token) {
            headers.Authorization = `Bearer ${session.access_token}`;
          }
          return {
            body: { messages, appContext: appContextRef.current },
            headers,
          };
        },
      }),
    [],
  );

  const { messages, status, sendMessage, stop, error } = useChat({
    id: "outstand-assistant",
    messages: initialMessages,
    transport,
  });

  const isLoading = status === "submitted" || status === "streaming";

  useEffect(() => {
    if (error) {
      toast.error("Assistant failed to respond. Please try again.");
    }
  }, [error]);

  const handleSubmit = async ({ text }: { text: string }) => {
    if (!text.trim() || isLoading) return;
    setInput("");
    await sendMessage({ text: text.trim() });
  };

  const handleClear = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return;

    const res = await fetch("/api/chat", {
      method: "DELETE",
      headers: { Authorization: `Bearer ${session.access_token}` },
    });

    if (res.ok) {
      onClear();
      toast.success("Chat history cleared");
    } else {
      toast.error("Failed to clear chat history");
    }
  };

  return (
    <div className="flex h-full flex-col">
      <DrawerHeader className="flex shrink-0 items-start justify-between border-b border-white/10 pb-4">
        <div className="text-left">
          <DrawerTitle className="flex items-center gap-2 text-base text-white">
            <div className="grid h-6 w-6 place-items-center rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 shadow-lg">
              <Bot className="h-3.5 w-3.5 text-white" />
            </div>
            Outstand Assistant
          </DrawerTitle>
          <DrawerDescription className="text-xs text-slate-400">
            Ask for focus tips, habit coaching, or a daily reset.
          </DrawerDescription>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon-sm" onClick={handleClear} title="Clear chat" className="text-slate-400 hover:text-white">
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={onClose} title="Close" className="text-slate-400 hover:text-white">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </DrawerHeader>

      <Conversation className="flex-1 px-4 py-3">
        <ConversationContent>
          {messages.length === 0 ? (
            <ConversationEmptyState
              icon={<Bot className="h-8 w-8 text-indigo-400" />}
              title="Your Outstand coach is here"
              description="Ask how to improve your streak, what to focus on today, or how to boost your dopamine score."
            />
          ) : (
            messages.map((message) => (
              <Message key={message.id} from={message.role}>
                <MessageContent>
                  {message.role === "assistant" ? (
                    <MessageResponse>
                      {message.parts
                        .filter((p) => p.type === "text")
                        .map((p) => p.text)
                        .join("")}
                    </MessageResponse>
                  ) : (
                    <div className="whitespace-pre-wrap">
                      {message.parts
                        .filter((p) => p.type === "text")
                        .map((p) => p.text)
                        .join("")}
                    </div>
                  )}
                </MessageContent>
                {message.role === "assistant" && (
                  <MessageToolbar>
                    <MessageActions>
                      <MessageAction
                        tooltip="Copy response"
                        label="Copy"
                        onClick={() => {
                          const text = message.parts
                            .filter((p) => p.type === "text")
                            .map((p) => p.text)
                            .join("");
                          navigator.clipboard.writeText(text);
                          toast.success("Copied to clipboard");
                        }}
                      >
                        <span className="text-xs">Copy</span>
                      </MessageAction>
                    </MessageActions>
                  </MessageToolbar>
                )}
              </Message>
            ))
          )}
          {isLoading && (
            <Message from="assistant">
              <MessageContent>
                <Shimmer className="text-sm text-indigo-400">Thinking...</Shimmer>
              </MessageContent>
            </Message>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="shrink-0 border-t border-white/10 p-4 bg-slate-950">
        <PromptInput onSubmit={handleSubmit}>
          <PromptInputTextarea
            placeholder="Ask your coach anything..."
            value={input}
            onChange={(e) => setInput(e.currentTarget.value)}
            disabled={isLoading}
            className="bg-slate-900 border-white/10 text-white placeholder:text-slate-500"
          />
          <PromptInputFooter className="justify-end pt-2">
            <PromptInputSubmit
              status={status}
              onStop={stop}
              disabled={(!input.trim() && !isLoading) || false}
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
            parts: [{ type: "text" as const, text: m.content }],
          }));
        setInitialMessages(uiMessages);
      } else {
        setInitialMessages([]);
      }
      setLoadingHistory(false);
    };

    load();
  }, [open, user, historyKey]);

  const handleClear = () => {
    setHistoryKey((k) => k + 1);
  };

  return (
    <>
      {/* THE NEW FLOATING, GLOWING AI BUTTON */}
      <motion.div
        // Positioned perfectly to avoid the new nav bar
        className="fixed bottom-28 right-4 md:bottom-8 md:right-8 z-50"
        // Continuous, gentle floating animation
        animate={{ y: [0, -10, 0] }}
        transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
      >
        <Button
          onClick={() => setOpen(true)}
          className={cn(
            "relative h-14 w-14 rounded-full p-0 border border-indigo-400/30",
            "bg-gradient-to-br from-indigo-500 to-blue-600",
            // The massive, soft premium glow
            "shadow-[0_0_30px_rgba(99,102,241,0.5)] hover:shadow-[0_0_40px_rgba(99,102,241,0.8)]",
            "transition-all duration-300 hover:scale-110 active:scale-95"
          )}
          aria-label="Open AI assistant"
        >
          <Bot className="h-6 w-6 text-white drop-shadow-md" />
        </Button>
      </motion.div>

      <Drawer open={open} onOpenChange={setOpen} direction="bottom">
        <DrawerContent className="h-[88dvh] rounded-t-2xl border-white/10 bg-slate-950/95 backdrop-blur-xl">
          {loadingHistory ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
              <Bot className="h-8 w-8 animate-pulse text-indigo-500" />
              <p className="text-sm text-slate-400">Loading your conversation...</p>
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
      
