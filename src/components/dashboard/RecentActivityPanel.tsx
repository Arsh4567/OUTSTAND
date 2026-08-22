import { Activity, CheckCircle2, Clock3, Flame, ListChecks, Trophy } from "lucide-react";
import type { FocusSession, Habit, OutstandCompletion } from "@/lib/habits";
import { todayISO } from "@/lib/habits";

type Props = { habits: Habit[]; sessions: FocusSession[]; outstand: OutstandCompletion[]; dailyScore: number | null };
type EventItem = { id: string; at: number; title: string; detail: string; icon: "focus" | "habit" | "xp" };

function startOfDay(timestamp: number) {
  const date = new Date(timestamp); date.setHours(0, 0, 0, 0); return date.getTime();
}
function formatWhen(timestamp: number) {
  const day = startOfDay(timestamp); const today = startOfDay(Date.now());
  if (day === today) return new Date(timestamp).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  if (day === today - 86400000) return "Yesterday";
  return new Date(timestamp).toLocaleDateString([], { month: "short", day: "numeric" });
}

export function RecentActivityPanel({ habits, sessions, outstand, dailyScore }: Props) {
  const today = todayISO();
  const todayStart = startOfDay(Date.now());
  const weekStart = todayStart - 6 * 86400000;
  const completedSessions = sessions.filter((session) => session.completed && Number(session.durationMin) > 0);
  const todaySessions = completedSessions.filter((session) => Date.parse(session.startedAt) >= todayStart);
  const weekSessions = completedSessions.filter((session) => Date.parse(session.startedAt) >= weekStart);
  const focusToday = todaySessions.reduce((sum, session) => sum + Math.max(0, session.durationMin), 0);
  const focusWeek = weekSessions.reduce((sum, session) => sum + Math.max(0, session.durationMin), 0);
  const completedHabits = habits.filter((habit) => Array.isArray(habit.history) && habit.history.includes(today)).length;
  const totalXp = outstand.reduce((sum, item) => sum + Math.max(0, Number(item.xp) || 0), 0);
  const recentEvents: EventItem[] = [
    ...completedSessions.map((session) => ({ id: `focus-${session.id}`, at: Date.parse(session.startedAt), title: `Focused for ${session.durationMin} min`, detail: `${formatWhen(Date.parse(session.startedAt))} · completed session`, icon: "focus" as const })),
    ...outstand.map((item) => ({ id: `xp-${item.id}`, at: Date.parse(item.completedAt), title: item.title, detail: `${formatWhen(Date.parse(item.completedAt))} · +${item.xp} XP`, icon: "xp" as const })),
  ].filter((event) => Number.isFinite(event.at)).sort((a, b) => b.at - a.at).slice(0, 5);

  return <section className="rounded-[28px] border border-white/[0.08] bg-white/[0.035] p-5 shadow-[0_24px_80px_-56px_rgba(34,211,238,.45)] backdrop-blur-xl sm:p-6">
    <div className="flex items-end justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-600">Recent activity</p><h2 className="mt-1 text-xl font-black text-white">What you actually did.</h2><p className="mt-1 text-xs text-slate-500">Live from your completed focus sessions, habits and XP history.</p></div><Activity className="h-5 w-5 text-cyan-300" /></div>

    <div className="mt-5 grid gap-2 sm:grid-cols-4">
      <Stat icon={<Clock3 />} label="Today focus" value={`${focusToday}m`} detail={`${todaySessions.length} session${todaySessions.length === 1 ? "" : "s"}`} />
      <Stat icon={<Flame />} label="7 day focus" value={`${focusWeek}m`} detail={`${weekSessions.length} sessions`} />
      <Stat icon={<ListChecks />} label="Habits today" value={`${completedHabits}/${habits.length}`} detail="completed" />
      <Stat icon={<Trophy />} label="Daily score" value={dailyScore == null ? "—" : `${dailyScore}`} detail={`${totalXp.toLocaleString()} XP earned locally`} />
    </div>

    <div className="mt-5 border-t border-white/[0.07] pt-5">
      <div className="flex items-center justify-between"><p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-600">Latest</p><span className="text-[9px] font-bold text-slate-700">{recentEvents.length} shown</span></div>
      {recentEvents.length === 0 ? <div className="mt-3 rounded-2xl border border-dashed border-white/10 p-5 text-center"><CheckCircle2 className="mx-auto h-5 w-5 text-slate-700" /><p className="mt-2 text-sm font-bold text-slate-500">No completed activity yet.</p><p className="mt-1 text-xs leading-5 text-slate-700">Your first completed focus block or XP action will appear here.</p></div> : <div className="mt-3 space-y-2">{recentEvents.map((event) => <div key={event.id} className="flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-black/10 p-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-cyan-300/10 bg-cyan-300/[0.05] text-cyan-200">{event.icon === "focus" ? <Clock3 className="h-4 w-4" /> : event.icon === "xp" ? <Trophy className="h-4 w-4" /> : <ListChecks className="h-4 w-4" />}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-white">{event.title}</p><p className="mt-0.5 truncate text-[10px] text-slate-600">{event.detail}</p></div></div>)}</div>}
    </div>
  </section>;
}

function Stat({ icon, label, value, detail }: { icon: React.ReactNode; label: string; value: string; detail: string }) {
  return <div className="rounded-2xl border border-white/[0.06] bg-black/10 p-3"><div className="flex items-center gap-2 text-slate-500">{icon}<span className="text-[8px] font-black uppercase tracking-[0.14em]">{label}</span></div><p className="mt-2 text-lg font-black text-white">{value}</p><p className="mt-0.5 text-[9px] text-slate-600">{detail}</p></div>;
}
