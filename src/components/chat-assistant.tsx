"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useChat, type UIMessage } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Bot, Trash2, X } from "lucide-react";
import { toast } from "sonner";

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
      <DrawerHeader className="flex shrink-0 items-start justify-between border-b border-border/60 pb-4">
        <div className="text-left">
          <DrawerTitle className="flex items-center gap-2 text-base">
            <div className="grid h-6 w-6 place-items-center rounded-lg bg-gradient-to-br from-primary to-accent">
              <Bot className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
            Outstand Assistant
          </DrawerTitle>
          <DrawerDescription className="text-xs">
            Ask for focus tips, habit coaching, or a daily reset.
          </DrawerDescription>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon-sm" onClick={handleClear} title="Clear chat">
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={onClose} title="Close">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </DrawerHeader>

      <Conversation className="flex-1 px-4 py-3">
        <ConversationContent>
          {messages.length === 0 ? (
            <ConversationEmptyState
              icon={<Bot className="h-8 w-8 text-primary" />}
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
                <Shimmer className="text-sm text-muted-foreground">Thinking...</Shimmer>
              </MessageContent>
            </Message>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="shrink-0 border-t border-border/60 p-4">
        <PromptInput onSubmit={handleSubmit}>
          <PromptInputTextarea
            placeholder="Ask your coach anything..."
            value={input}
            onChange={(e) => setInput(e.currentTarget.value)}
            disabled={isLoading}
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
      <Button
        onClick={() => setOpen(true)}
        className={cn(
          "fixed bottom-4 right-4 z-50 h-14 w-14 rounded-full p-0 shadow-2xl",
          "btn-primary animate-in fade-in slide-in-from-bottom-4 duration-500",
        )}
        aria-label="Open AI assistant"
      >
        <Bot className="h-6 w-6" />
      </Button>

      <Drawer open={open} onOpenChange={setOpen} direction="bottom">
        <DrawerContent className="h-[88dvh] rounded-t-2xl border-border/60 bg-background/95 backdrop-blur-xl">
          {loadingHistory ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
              <Bot className="h-8 w-8 animate-pulse text-primary" />
              <p className="text-sm text-muted-foreground">Loading your conversation...</p>
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
