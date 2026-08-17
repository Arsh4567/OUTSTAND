"use client";

import { useEffect, useMemo, useState } from "react";
import type { UIMessage } from "@ai-sdk/react";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, displayNameOf } from "@/hooks/use-auth";
import { useAppState } from "@/hooks/use-app-state";
import { useDailyLog } from "@/hooks/use-dopamine";
import { todayISO } from "@/lib/habits";
import { OutstandChatPanel, type OutstandChatContext } from "@/components/ai/OutstandChatPanel";

const safeId = () =>
  typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `chat-${Date.now()}-${Math.random().toString(36).slice(2)}`;

export type ChatAssistantProps = {
  openSignal?: boolean;
  onOpenSignalHandled?: () => void;
};

export function ChatAssistant({ openSignal = false, onOpenSignalHandled }: ChatAssistantProps) {
  const { user, profile } = useAuth();
  const { habits, sessions, outstand, xp, bestStreak } = useAppState();
  const { log } = useDailyLog();
  const today = todayISO();

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyKey, setHistoryKey] = useState(0);

  const context = useMemo<OutstandChatContext>(() => ({
    name: displayNameOf(user, profile),
    habits: habits.map((habit) => ({ id: habit.id, name: habit.name, emoji: habit.emoji })),
    completedToday: habits
      .filter((habit) => habit.history.includes(today))
      .map((habit) => habit.id),
    sessions,
    outstand,
    xp,
    bestStreak,
    dopamineScore: log?.score ?? 50,
  }), [user, profile, habits, sessions, outstand, xp, bestStreak, log, today]);

  useEffect(() => {
    if (!openSignal) return;
    setOpen(true);
    onOpenSignalHandled?.();
  }, [openSignal, onOpenSignalHandled]);

  useEffect(() => {
    if (!open || !user) return;

    let cancelled = false;
    const loadHistory = async () => {
      setHistoryLoading(true);
      try {
        const { data: conversation, error: conversationError } = await supabase
          .from("chat_conversations")
          .select("id")
          .eq("user_id", user.id)
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (conversationError) throw conversationError;

        if (!conversation?.id) {
          if (!cancelled) setMessages([]);
          return;
        }

        const { data, error } = await supabase
          .from("chat_messages")
          .select("id, role, content, created_at")
          .eq("conversation_id", conversation.id)
          .eq("user_id", user.id)
          .in("role", ["user", "assistant"])
          .order("created_at", { ascending: true })
          .limit(100);

        if (error) throw error;

        const loaded: UIMessage[] = (data ?? []).map((message) => ({
          id: message.id || safeId(),
          role: message.role as "user" | "assistant",
          parts: [{ type: "text", text: message.content }],
        }));

        if (!cancelled) setMessages(loaded);
      } catch (error) {
        console.error("AI history load failed", error);
        if (!cancelled) setMessages([]);
      } finally {
        if (!cancelled) setHistoryLoading(false);
      }
    };

    void loadHistory();
    return () => {
      cancelled = true;
    };
  }, [open, user, historyKey]);

  if (!user) return null;

  const clearLocalHistory = () => {
    setMessages([]);
    setHistoryKey((value) => value + 1);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open Outstand Intelligence"
        className="fixed bottom-5 right-5 z-[80] hidden h-12 w-12 place-items-center rounded-2xl border border-cyan-300/20 bg-[#050812]/95 text-cyan-200 shadow-[0_0_30px_rgba(34,211,238,.16)] backdrop-blur-xl transition hover:scale-105 hover:border-cyan-300/35 hover:bg-cyan-300/10 md:grid"
      >
        <span className="relative grid place-items-center">
          <span className="absolute h-3 w-3 animate-ping rounded-full bg-cyan-300/30" />
          <span className="relative h-2.5 w-2.5 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(103,232,249,.9)]" />
        </span>
      </button>

      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent className="z-[90] h-[92vh] max-h-[920px] border-white/10 bg-[#050812]/98 p-0 text-white shadow-[0_-30px_100px_rgba(0,0,0,.55)] backdrop-blur-2xl">
          <div className="h-full min-h-0">
            <OutstandChatPanel
              initialMessages={messages}
              context={context}
              onClose={() => setOpen(false)}
              onClear={clearLocalHistory}
              historyLoading={historyLoading}
            />
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
