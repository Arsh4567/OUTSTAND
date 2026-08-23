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
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_8%,rgba(34,211,238,0.13),transparent_28%),radial-gradient(circle_at_88%_18%,rgba(79,70,229,0.12),transparent_30%),radial-gradient(circle_at_50%_100%,rgba(14,165,233,0.07),transparent_36%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(148,163,184,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.02)_1px,transparent_1px)] [background-size:48px_48px]" />
      <main className="relative z-10 mx-auto w-full max-w-[1520px] px-3 pb-8 pt-4 sm:px-5 lg:px-8 lg:pt-6">
        <motion.header initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .55, ease }} className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="min-w-0"><div className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[.28em] text-cyan-300/75"><span className="grid h-6 w-6 place-items-center rounded-lg border border-cyan-300/15 bg-cyan-300/[.06]"><Sparkles className="h-3 w-3" /></span> Outstand Intelligence</div><h1 className="max-w-3xl text-3xl font-black tracking-[-.045em] sm:text-4xl lg:text-[2.75rem]">Think less about productivity.<br/><span className="bg-gradient-to-r from-white via-cyan-100 to-blue-300 bg-clip-text text-transparent">Execute better.</span></h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">A context-aware command center for your habits, focus, progress and next action.</p></div>
          <div className="grid w-full grid-cols-2 gap-2 sm:grid-cols-4 xl:w-auto"><ContextBadge icon={<CheckCircle2 />} label="Habits" value={`${completed}/${habitCount || 0}`} /><ContextBadge icon={<Zap />} label="XP" value={xp.toLocaleString()} /><ContextBadge icon={<Flame />} label="Streak" value={`${bestStreak}d`} /><ContextBadge icon={<Activity />} label="Focus" value={`${focusMinutes}m`} /></div>
        </motion.header>

        <div className="grid gap-4 xl:grid-cols-[250px_minmax(0,1fr)_260px]">
          <aside className="hidden space-y-4 xl:block">
            <section className="relative overflow-hidden rounded-[1.75rem] border border-cyan-300/10 bg-white/[.025] p-4 shadow-[0_30px_90px_rgba(0,0,0,.25)] backdrop-blur-xl"><div className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-cyan-400/10 blur-3xl"/><div className="relative flex justify-center py-2"><OutstandRobotAvatar size="xl" pulse /></div><div className="mt-3 text-center"><p className="text-lg font-black">Your intelligence layer</p><p className="mt-1 text-xs leading-5 text-slate-500">Grounded in your actual activity, not generic advice.</p></div><div className="mt-4 grid grid-cols-2 gap-2"><MiniStat icon={<Target />} value={`${completion}%`} label="habits today"/><MiniStat icon={<Activity />} value={String(sessionCount)} label="sessions"/><MiniStat icon={<Zap />} value={xp.toLocaleString()} label="xp"/><MiniStat icon={<Flame />} value={`${bestStreak}d`} label="streak"/></div></section>
            <section className="rounded-[1.75rem] border border-white/[.07] bg-white/[.02] p-4"><div className="flex items-center gap-2 text-xs font-black text-white"><Brain className="h-4 w-4 text-cyan-300"/> What I can help with</div><div className="mt-3 grid gap-2 text-xs text-slate-500">{['Plan the next few hours','Fix a habit that keeps slipping','Choose your highest-impact task','Review your momentum'].map((item)=><div key={item} className="rounded-xl border border-white/[.05] bg-white/[.025] px-3 py-2.5 transition hover:border-cyan-300/15 hover:text-slate-300">{item}</div>)}</div></section>
          </aside>

          <section className="min-h-[min(760px,calc(100vh-205px))] overflow-hidden rounded-[1.9rem] border border-cyan-300/10 bg-[#040912]/95 shadow-[0_35px_120px_rgba(0,0,0,.42)] backdrop-blur-2xl">
            <div className="flex items-center justify-between border-b border-white/[.07] bg-white/[.02] px-4 py-3 sm:px-5"><div className="flex min-w-0 items-center gap-3"><div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-cyan-300/15 bg-cyan-300/[.06]"><OutstandRobotAvatar size="sm" pulse /></div><div className="min-w-0"><p className="truncate text-sm font-black">Outstand AI</p><p className="truncate text-[10px] text-slate-600">Context synced for {firstName}</p></div></div><div className="rounded-full border border-emerald-400/15 bg-emerald-400/[.05] px-2.5 py-1 text-[9px] font-black uppercase tracking-[.16em] text-emerald-200/80">Live</div></div>
            <div className="h-[calc(100%-55px)] min-h-0"><OutstandChatPanel initialMessages={messages} context={context} onClose={() => undefined} onClear={() => { setMessages([]); setHistoryKey((value) => value + 1); }} historyLoading={historyLoading} /></div>
          </section>

          <aside className="space-y-4">
            <section className="rounded-[1.75rem] border border-white/[.07] bg-white/[.02] p-4"><div className="flex items-center justify-between"><div className="flex items-center gap-2 text-xs font-black"><Gauge className="h-4 w-4 text-cyan-300"/> Today</div><span className="text-[9px] font-black uppercase tracking-[.16em] text-slate-600">Live context</span></div><div className="mt-4 space-y-3"><ContextRow label="Habits completed" value={`${completed}/${habitCount || 0}`} progress={completion}/><ContextRow label="Daily score" value={String(context.dopamineScore)} progress={Math.max(0,Math.min(100,context.dopamineScore))}/><ContextRow label="XP this cycle" value={String(xp)} progress={Math.min(100,xp % 100)}/></div></section>
            <section className="rounded-[1.75rem] border border-cyan-300/10 bg-gradient-to-br from-cyan-400/[.07] via-blue-500/[.03] to-transparent p-4"><div className="flex items-center gap-2 text-xs font-black"><Sparkles className="h-4 w-4 text-cyan-300"/> Intelligence note</div><p className="mt-3 text-sm leading-6 text-slate-300">Hey {firstName}. The best next move is usually the smallest useful action you can complete right now.</p></section>
            <section className="rounded-[1.75rem] border border-white/[.06] bg-black/20 p-4 text-center"><OutstandRobotAvatar size="md" pulse/><div className="mt-3 flex items-center justify-center gap-2 text-[10px] font-bold text-emerald-200/70"><CheckCircle2 className="h-3.5 w-3.5"/> Context synced</div></section>
          </aside>
        </div>
      </main>
    </div>
  </MotionConfig>;
}
function ContextBadge({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) { return <div className="rounded-2xl border border-white/[.07] bg-white/[.025] px-3 py-2.5"><div className="flex items-center gap-2 text-slate-500">{icon}<span className="text-[9px] font-black uppercase tracking-[.15em]">{label}</span></div><p className="mt-1 text-base font-black text-white">{value}</p></div>; }
function MiniStat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) { return <div className="rounded-xl border border-white/[.06] bg-black/20 p-2.5"><div className="text-cyan-300/70">{icon}</div><div className="mt-1 text-sm font-black text-white">{value}</div><div className="text-[8px] font-black uppercase tracking-[.14em] text-slate-600">{label}</div></div>; }
function ContextRow({ label, value, progress }: { label: string; value: string; progress: number }) { return <div><div className="mb-1.5 flex items-center justify-between gap-2 text-[10px]"><span className="text-slate-500">{label}</span><span className="font-bold text-slate-300">{value}</span></div><div className="h-1.5 overflow-hidden rounded-full bg-white/[.06]"><motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: .8, ease }} className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500"/></div></div>; }
