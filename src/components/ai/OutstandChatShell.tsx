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

const messageId = () => typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;

export function OutstandChatShell() {
  const [open, setOpen] = useState(false);
  const [prefill, setPrefill] = useState("");
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [historyKey, setHistoryKey] = useState(0);
  const [historyLoading, setHistoryLoading] = useState(false);
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
    const handleOperatorOpen = (event: Event) => {
      const prompt = (event as CustomEvent<{ prompt?: string }>).detail?.prompt?.trim();
      setPrefill(prompt || "");
      setOpen(true);
    };
    window.addEventListener("outstand:open-ai", handleOperatorOpen);
    return () => window.removeEventListener("outstand:open-ai", handleOperatorOpen);
  }, []);

  useEffect(() => {
    if (!open || !user) return;
    let cancelled = false;

    const load = async () => {
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
          .limit(200);
        if (error) throw error;

        const loaded: UIMessage[] = (data ?? []).map((message) => ({
          id: message.id || messageId(),
          role: message.role as "user" | "assistant",
          parts: [{ type: "text", text: message.content }],
        }));

        if (!cancelled) setMessages(loaded);
      } catch (error) {
        if (!cancelled) {
          setMessages([]);
          toast.error(`Could not restore AI history: ${formatAiError(error)}`);
        }
      } finally {
        if (!cancelled) setHistoryLoading(false);
      }
    };

    void load();
    return () => { cancelled = true; };
  }, [open, user, historyKey]);

  if (!user) return null;

  return <>
    <motion.div className="fixed bottom-24 right-4 z-[80] md:bottom-8 md:right-8" initial={{ opacity: 0, scale: 0.8, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}>
      <Button onClick={() => { setPrefill(""); setOpen(true); }} aria-label="Open Outstand Intelligence" className="group relative h-16 w-16 overflow-hidden rounded-full border border-cyan-200/20 bg-slate-950 p-0 shadow-[0_18px_60px_rgba(0,0,0,.45)]">
        <span className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(125,211,252,.75),transparent_32%),linear-gradient(135deg,#4f46e5,#0891b2_48%,#0f172a)]" />
        <span className="absolute inset-1 rounded-full border border-white/10" />
        <span className="relative z-10 flex flex-col items-center text-white"><Bot className="h-6 w-6 transition-transform duration-300 group-hover:scale-110" /><span className="mt-0.5 text-[7px] font-black uppercase tracking-[.22em] text-cyan-100/80">AI</span></span>
      </Button>
    </motion.div>

    <Drawer open={open} onOpenChange={(nextOpen) => { setOpen(nextOpen); if (!nextOpen) setPrefill(""); }} direction="right">
      <DrawerContent className="h-[100dvh] w-full border-l border-white/10 bg-[#050812] text-white sm:max-w-xl">
        {open && <OutstandChatPanel
          initialMessages={messages}
          context={context}
          initialPrompt={prefill}
          onClose={() => { setOpen(false); setPrefill(""); }}
          onClear={() => { setMessages([]); setHistoryKey((value) => value + 1); }}
          historyLoading={historyLoading}
        />}
      </DrawerContent>
    </Drawer>
  </>;
}
