"use client";

import { useEffect, useMemo, useState } from "react";
import type { UIMessage } from "@ai-sdk/react";
import { Bot } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useAppState } from "@/hooks/use-app-state";
import { useAuth, displayNameOf } from "@/hooks/use-auth";
import { useDailyLog } from "@/hooks/use-dopamine";
import { todayISO } from "@/lib/habits";
import { formatAiError } from "@/lib/ai-assistant";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { OutstandChatPanel, type OutstandChatContext } from "@/components/ai/OutstandChatPanel";

const id = () => typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;

export function OutstandChatShell() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [historyKey, setHistoryKey] = useState(0);
  const { user, profile } = useAuth();
  const { habits, sessions, outstand, xp, bestStreak } = useAppState();
  const { log } = useDailyLog();
  const today = todayISO();

  const context = useMemo<OutstandChatContext>(() => ({
    name: displayNameOf(user, profile),
    habits: habits.map((habit) => ({ id: habit.id, name: habit.name, emoji: habit.emoji })),
    completedToday: habits.filter((habit) => habit.history.includes(today)).map((habit) => habit.id),
    sessions,
    outstand,
    xp,
    bestStreak,
    dopamineScore: log?.score ?? 50,
  }), [user, profile, habits, sessions, outstand, xp, bestStreak, log, today]);

  useEffect(() => {
    if (!open || !user) return;
    let cancelled = false;

    const load = async () => {
      try {
        const { data: conversation, error: conversationError } = await supabase.from("chat_conversations").select("id").eq("user_id", user.id).maybeSingle();
        if (conversationError) throw new Error(`${conversationError.message}${conversationError.code ? ` (${conversationError.code})` : ""}`);
        if (!conversation?.id) { if (!cancelled) setMessages([]); return; }

        const { data, error } = await supabase.from("chat_messages").select("role, content").eq("conversation_id", conversation.id).order("created_at", { ascending: true });
        if (error) throw new Error(`${error.message}${error.code ? ` (${error.code})` : ""}`);

        const loaded = (data ?? []).filter((message) => message.role === "user" || message.role === "assistant").map((message) => ({ id: id(), role: message.role as "user" | "assistant", parts: [{ type: "text", text: message.content }] }));
        if (!cancelled) setMessages(loaded);
      } catch (error) {
        if (!cancelled) {
          setMessages([]);
          toast.error(`Could not load AI memory: ${formatAiError(error)}`);
        }
      }
    };

    void load();
    return () => { cancelled = true; };
  }, [open, user, historyKey]);

  if (!user) return null;

  return <>
    <motion.div className="fixed bottom-24 right-4 z-[80] md:bottom-8 md:right-8" animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}>
      <Button onClick={() => setOpen(true)} aria-label="Open Outstand Intelligence" className="relative h-16 w-16 rounded-full border border-indigo-300/70 bg-slate-950 p-0 shadow-[0_0_35px_rgba(99,102,241,0.55)]"><span className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-500 via-blue-600 to-purple-600 opacity-95" /><Bot className="relative z-10 h-7 w-7 text-white" /></Button>
    </motion.div>

    <Drawer open={open} onOpenChange={setOpen} direction="right">
      <DrawerContent className="h-[100dvh] w-full border-l border-white/10 bg-slate-950 text-white sm:max-w-xl">
        {open && <OutstandChatPanel initialMessages={messages} context={context} onClose={() => setOpen(false)} onClear={() => { setMessages([]); setHistoryKey((value) => value + 1); }} />}
      </DrawerContent>
    </Drawer>
  </>;
}
