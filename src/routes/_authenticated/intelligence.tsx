import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import type { UIMessage } from "@ai-sdk/react";
import { motion, MotionConfig } from "framer-motion";
import { Activity, Brain, CheckCircle2, Flame, Gauge, Sparkles, Target, Zap } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useAppState } from "@/hooks/use-app-state";
import { displayNameOf, useAuth } from "@/hooks/use-auth";
import { useDailyLog } from "@/hooks/use-dopamine";
import { todayISO } from "@/lib/habits";
import { OutstandChatPanel, type OutstandChatContext } from "@/components/ai/OutstandChatPanel";
import { OutstandRobotAvatar } from "@/components/ai/OutstandRobotAvatar";
import { OutstandMotionCore } from "@/components/outstand/OutstandMotionCore";

export const Route = createFileRoute("/_authenticated/intelligence")({ component: IntelligencePage });

const ease = [0.16, 1, 0.3, 1] as const;
const messageId = () => typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;

function IntelligencePage() {
  const { user, profile } = useAuth();
  const { habits, sessions, outstand, xp, bestStreak } = useAppState();
  const { log } = useDailyLog();
  const today = todayISO();
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyKey, setHistoryKey] = useState(0);

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
    if (!user) return;
    let cancelled = false;
    const load = async () => {
      setHistoryLoading(true);
      try {
        const { data: conversation, error: conversationError } = await supabase.from("chat_conversations").select("id").eq("user_id", user.id).order("updated_at", { ascending: false }).limit(1).maybeSingle();
        if (conversationError) throw conversationError;
        if (!conversation?.id) {
          if (!cancelled) setMessages([]);
          return;
        }
        const { data, error } = await supabase.from("chat_messages").select("id, role, content, created_at").eq("conversation_id", conversation.id).eq("user_id", user.id).in("role", ["user", "assistant"]).order("created_at", { ascending: true }).limit(200);
        if (error) throw error;
        const loaded: UIMessage[] = (data ?? []).map((message) => ({ id: message.id || messageId(), role: message.role as "user" | "assistant", parts: [{ type: "text", text: message.content }] }));
        if (!cancelled) setMessages(loaded);
      } catch {
        if (!cancelled) setMessages([]);
      } finally {
        if (!cancelled) setHistoryLoading(false);
      }
    };
    void load();
    return () => { cancelled = true; };
  }, [user, historyKey]);

  const completed = context.completedToday.length;
  const habitCount = context.habits.length;
  const completion = habitCount ? Math.round((completed / habitCount) * 100) : 0;
  const sessionCount = context.sessions.length;
  const firstName = context.name.split(" ")[0] || "there";

  return (
    <MotionConfig reducedMotion="user">
      <div className="relative min-h-[calc(100vh-72px)] overflow-hidden bg-[#030713] text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_8%,rgba(37,99,235,0.16),transparent_30%),radial-gradient(circle_at_82%_18%,rgba(14,165,233,0.11),transparent_28%),radial-gradient(circle_at_50%_100%,rgba(59,130,246,0.08),transparent_35%)]" />
        <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(148,163,184,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.025)_1px,transparent_1px)] [background-size:44px_44px]" />
        <div className="pointer-events-none absolute right-[6%] top-20 hidden opacity-70 2xl:block"><OutstandMotionCore size="md" accent="#7dd3fc" /></div>

        <main className="relative z-10 mx-auto w-full max-w-[1500px] px-3 pb-6 pt-4 sm:px-5 lg:px-7 lg:pb-8 lg:pt-6">
          <motion.header initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease }} className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.28em] text-cyan-300/70"><span className="h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(103,232,249,.9)]" /> Outstand Intelligence</div>
              <h1 className="text-3xl font-black tracking-[-0.045em] sm:text-4xl">Think less about productivity.<br /><span className="bg-gradient-to-r from-white via-cyan-100 to-blue-300 bg-clip-text text-transparent">Execute better.</span></h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">A context-aware command center built around your habits, focus, missions and momentum.</p>
            </div>
            <div className="flex items-center gap-2 self-start rounded-2xl border border-emerald-400/15 bg-emerald-400/[0.05] px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-200/80 lg:self-auto"><span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,.8)]" /> Intelligence online</div>
          </motion.header>

          <div className="grid gap-4 xl:grid-cols-[260px_minmax(0,1fr)_270px]">
            <aside className="hidden space-y-4 xl:block">
              <section className="relative overflow-hidden rounded-[1.75rem] border border-cyan-300/10 bg-white/[0.025] p-4 shadow-[0_30px_90px_rgba(0,0,0,.28)] backdrop-blur-xl">
                <div className="absolute -right-14 -top-14 h-40 w-40 rounded-full bg-cyan-400/10 blur-3xl" />
                <div className="relative flex justify-center py-2"><OutstandRobotAvatar size="xl" pulse /></div>
                <div className="mt-3 text-center"><div className="text-lg font-black">Your intelligence layer</div><p className="mt-1 text-xs leading-5 text-slate-500">Built to understand your actual Outstand activity, not just answer prompts.</p></div>
                <div className="mt-5 grid grid-cols-2 gap-2"><MiniStat icon={<Zap />} value={String(context.xp)} label="XP" /><MiniStat icon={<Flame />} value={String(context.bestStreak)} label="best streak" /><MiniStat icon={<Target />} value={`${completion}%`} label="habits today" /><MiniStat icon={<Activity />} value={String(sessionCount)} label="sessions" /></div>
              </section>
              <section className="rounded-[1.75rem] border border-white/[0.07] bg-white/[0.02] p-4"><div className="flex items-center gap-2 text-xs font-black text-white"><Brain className="h-4 w-4 text-cyan-300" /> What I can help with</div><div className="mt-3 space-y-2 text-xs text-slate-500">{['Plan the next few hours', 'Fix a habit that keeps slipping', 'Choose your highest-impact task', 'Review your momentum'].map((item) => <div key={item} className="rounded-xl border border-white/[0.05] bg-white/[0.025] px-3 py-2.5">{item}</div>)}</div></section>
            </aside>

            <section className="min-h-[680px] overflow-hidden rounded-[1.9rem] border border-cyan-300/10 bg-[#050a17]/90 shadow-[0_35px_120px_rgba(0,0,0,.42)] backdrop-blur-2xl lg:min-h-[calc(100vh-190px)]">
              <OutstandChatPanel initialMessages={messages} context={context} onClose={() => undefined} onClear={() => { setMessages([]); setHistoryKey((value) => value + 1); }} historyLoading={historyLoading} />
            </section>

            <aside className="hidden space-y-4 xl:block">
              <section className="rounded-[1.75rem] border border-white/[0.07] bg-white/[0.02] p-4"><div className="flex items-center justify-between"><div className="flex items-center gap-2 text-xs font-black"><Gauge className="h-4 w-4 text-cyan-300" /> Today</div><span className="text-[9px] font-black uppercase tracking-[.18em] text-slate-600">Live context</span></div><div className="mt-4 space-y-3"><ContextRow label="Habits completed" value={`${completed}/${habitCount || 0}`} progress={completion} /><ContextRow label="Dopamine score" value={String(context.dopamineScore)} progress={Math.max(0, Math.min(100, context.dopamineScore))} /><ContextRow label="XP" value={String(context.xp)} progress={Math.min(100, context.xp % 100)} /></div></section>
              <section className="overflow-hidden rounded-[1.75rem] border border-blue-300/10 bg-gradient-to-br from-blue-500/[0.08] via-cyan-400/[0.03] to-transparent p-4"><div className="flex items-center gap-2 text-xs font-black"><Sparkles className="h-4 w-4 text-cyan-300" /> Intelligence note</div><p className="mt-3 text-sm leading-6 text-slate-300">Hey {firstName}. The useful question isn't “what should I do?” — it's “what is the smallest action that creates momentum right now?”</p></section>
              <div className="rounded-[1.75rem] border border-white/[0.06] bg-black/20 p-4 text-center"><OutstandRobotAvatar size="md" pulse /><div className="mt-3 flex items-center justify-center gap-2 text-[10px] font-bold text-emerald-200/70"><CheckCircle2 className="h-3.5 w-3.5" /> Context synced</div></div>
            </aside>
          </div>
        </main>
      </div>
    </MotionConfig>
  );
}

function MiniStat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) { return <div className="rounded-xl border border-white/[0.06] bg-black/20 p-2.5"><div className="text-cyan-300/70">{icon}</div><div className="mt-1 text-sm font-black text-white">{value}</div><div className="text-[8px] font-black uppercase tracking-[.14em] text-slate-600">{label}</div></div>; }
function ContextRow({ label, value, progress }: { label: string; value: string; progress: number }) { return <div><div className="mb-1.5 flex items-center justify-between text-[10px]"><span className="text-slate-500">{label}</span><span className="font-bold text-slate-300">{value}</span></div><div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]"><motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: .8, ease }} className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500" /></div></div>; }
