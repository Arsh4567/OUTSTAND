import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import type { UIMessage } from "@ai-sdk/react";
import { motion, MotionConfig } from "framer-motion";
import { Activity, CheckCircle2, Flame, Gauge, Target, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAppState } from "@/hooks/use-app-state";
import { displayNameOf, useAuth } from "@/hooks/use-auth";
import { useDailyLog } from "@/hooks/use-dopamine";
import { todayISO } from "@/lib/habits";
import { OutstandChatPanel, type OutstandChatContext } from "@/components/ai/OutstandChatPanel";
import { OutstandRobotAvatar } from "@/components/ai/OutstandRobotAvatar";
import { QuickActions } from "@/components/global/QuickActions";

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
    name: displayNameOf(user, profile), habits: habits.map((habit) => ({ id: habit.id, name: habit.name, emoji: habit.emoji })), completedToday: habits.filter((habit) => habit.history.includes(today)).map((habit) => habit.id), sessions, outstand, xp, bestStreak, dopamineScore: log?.score ?? 50,
  }), [user, profile, habits, sessions, outstand, xp, bestStreak, log, today]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const load = async () => {
      setHistoryLoading(true);
      try {
        const { data: conversation, error: conversationError } = await supabase.from("chat_conversations").select("id").eq("user_id", user.id).order("updated_at", { ascending: false }).limit(1).maybeSingle();
        if (conversationError) throw conversationError;
        if (!conversation?.id) { if (!cancelled) setMessages([]); return; }
        const { data, error } = await supabase.from("chat_messages").select("id, role, content, created_at").eq("conversation_id", conversation.id).eq("user_id", user.id).in("role", ["user", "assistant"]).order("created_at", { ascending: true }).limit(200);
        if (error) throw error;
        const loaded: UIMessage[] = (data ?? []).map((message) => ({ id: message.id || messageId(), role: message.role as "user" | "assistant", parts: [{ type: "text", text: message.content }] }));
        if (!cancelled) setMessages(loaded);
      } catch {
        if (!cancelled) setMessages([]);
      } finally { if (!cancelled) setHistoryLoading(false); }
    };
    void load();
    return () => { cancelled = true; };
  }, [user, historyKey]);

  const completed = context.completedToday.length;
  const habitCount = context.habits.length;
  const completion = habitCount ? Math.round((completed / habitCount) * 100) : 0;
  const sessionCount = context.sessions.filter((session: any) => session?.completed).length;
  const focusMinutes = context.sessions.filter((session: any) => session?.completed).reduce((sum: number, session: any) => sum + Math.max(0, session?.durationMin || 0), 0);
  const firstName = context.name.split(" ")[0] || "there";

  return <MotionConfig reducedMotion="user">
    <div className="relative min-h-[calc(100vh-72px)] overflow-hidden bg-[#02050b] text-white">
      <main className="relative z-10 mx-auto w-full max-w-[1400px] px-3 pb-8 pt-4 sm:px-5 lg:px-8 lg:pt-6">
        <motion.header initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .45, ease }} className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="min-w-0"><div className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[.24em] text-slate-500"><span className="h-px w-6 bg-slate-700" />WORKSPACE</div><h1 className="max-w-3xl text-3xl font-black tracking-[-.04em] sm:text-4xl lg:text-[2.65rem]">Plan the work.<br/><span className="text-slate-400">Then get to it.</span></h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Use your activity, habits and progress to decide the next useful action.</p></div>
          <div className="grid w-full grid-cols-2 gap-2 sm:grid-cols-4 xl:w-auto"><ContextBadge icon={<CheckCircle2 />} label="Habits" value={`${completed}/${habitCount || 0}`} /><ContextBadge icon={<Zap />} label="XP" value={xp.toLocaleString()} /><ContextBadge icon={<Flame />} label="Streak" value={`${bestStreak}d`} /><ContextBadge icon={<Activity />} label="Focus" value={`${focusMinutes}m`} /></div>
        </motion.header>

        <div className="grid gap-4 xl:grid-cols-[230px_minmax(0,1fr)_240px]">
          <aside className="hidden space-y-4 xl:block">
            <section className="rounded-[1.5rem] border border-white/[.08] bg-white/[.025] p-4"><div className="flex items-center gap-3"><OutstandRobotAvatar size="md"/><div><p className="text-sm font-black">OUTSTAND</p><p className="text-xs text-slate-500">Personal workspace</p></div></div><p className="mt-4 text-xs leading-5 text-slate-500">Your context stays inside the product. Use this space to turn it into action.</p><div className="mt-4 grid grid-cols-2 gap-2"><MiniStat icon={<Target />} value={`${completion}%`} label="habits today"/><MiniStat icon={<Activity />} value={String(sessionCount)} label="sessions"/><MiniStat icon={<Zap />} value={xp.toLocaleString()} label="xp"/><MiniStat icon={<Flame />} value={`${bestStreak}d`} label="streak"/></div></section>
            <section className="rounded-[1.5rem] border border-white/[.07] bg-white/[.02] p-4"><div className="text-xs font-black text-white">Useful starting points</div><div className="mt-3 grid gap-2 text-xs text-slate-500">{['Plan the next few hours','Fix a habit that keeps slipping','Choose your highest-impact task','Review your momentum'].map((item)=><div key={item} className="rounded-xl border border-white/[.05] bg-white/[.025] px-3 py-2.5 transition hover:border-white/[.12] hover:text-slate-300">{item}</div>)}</div></section>
          </aside>

          <section className="min-h-[min(760px,calc(100vh-205px))] overflow-hidden rounded-[1.6rem] border border-white/[.09] bg-[#040912]/95 shadow-[0_35px_100px_rgba(0,0,0,.4)]">
            <div className="flex items-center justify-between border-b border-white/[.07] bg-white/[.02] px-4 py-3 sm:px-5"><div className="flex min-w-0 items-center gap-3"><OutstandRobotAvatar size="sm"/><div className="min-w-0"><p className="truncate text-sm font-black">Next action</p><p className="truncate text-[10px] text-slate-600">Context synced for {firstName}</p></div></div><div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[.14em] text-slate-600"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />Available</div></div>
            <div className="h-[calc(100%-55px)] min-h-0"><OutstandChatPanel initialMessages={messages} context={context} onClose={() => undefined} onClear={() => { setMessages([]); setHistoryKey((value) => value + 1); }} historyLoading={historyLoading} /></div>
          </section>

          <aside className="space-y-4">
            <section className="rounded-[1.5rem] border border-white/[.07] bg-white/[.02] p-4"><div className="flex items-center justify-between"><div className="flex items-center gap-2 text-xs font-black"><Gauge className="h-4 w-4 text-slate-400"/> Today</div><span className="text-[9px] font-black uppercase tracking-[.16em] text-slate-600">Current</span></div><div className="mt-4 space-y-3"><ContextRow label="Habits completed" value={`${completed}/${habitCount || 0}`} progress={completion}/><ContextRow label="Daily score" value={String(context.dopamineScore)} progress={Math.max(0,Math.min(100,context.dopamineScore))}/><ContextRow label="XP this cycle" value={String(xp)} progress={Math.min(100,xp % 100)}/></div></section>
            <section className="rounded-[1.5rem] border border-white/[.07] bg-white/[.02] p-4"><div className="text-xs font-black">One thing at a time</div><p className="mt-2 text-sm leading-6 text-slate-400">Good plans are useful only when they lead to a concrete next step.</p></section>
            <section className="rounded-[1.5rem] border border-white/[.06] bg-black/20 p-4 text-center"><OutstandRobotAvatar size="md"/><div className="mt-3 flex items-center justify-center gap-2 text-[10px] font-bold text-emerald-200/70"><CheckCircle2 className="h-3.5 w-3.5"/> Context synced</div></section>
          </aside>
        </div>
      </main>
      <QuickActions />
    </div>
  </MotionConfig>;
}
function ContextBadge({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) { return <div className="rounded-2xl border border-white/[.07] bg-white/[.025] px-3 py-2.5"><div className="flex items-center gap-2 text-slate-500">{icon}<span className="text-[9px] font-black uppercase tracking-[.15em]">{label}</span></div><p className="mt-1 text-base font-black text-white">{value}</p></div>; }
function MiniStat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) { return <div className="rounded-xl border border-white/[.06] bg-black/20 p-2.5"><div className="text-slate-400">{icon}</div><div className="mt-1 text-sm font-black text-white">{value}</div><div className="text-[8px] font-black uppercase tracking-[.14em] text-slate-600">{label}</div></div>; }
function ContextRow({ label, value, progress }: { label: string; value: string; progress: number }) { return <div><div className="mb-1.5 flex items-center justify-between gap-2 text-[10px]"><span className="text-slate-500">{label}</span><span className="font-bold text-slate-300">{value}</span></div><div className="h-1.5 overflow-hidden rounded-full bg-white/[.06]"><motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: .65, ease }} className="h-full rounded-full bg-slate-300"/></div></div>; }
