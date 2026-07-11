import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import { Flame, Target, Timer, Trophy, Zap, Activity, TrendingUp, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppState } from "@/hooks/use-app-state";
import { useAuth, displayNameOf } from "@/hooks/use-auth";
import { useWeeklyLogs } from "@/hooks/use-dopamine";
import { lastNDays, levelFromXP, todayISO } from "@/lib/habits";
import { scoreColor } from "@/lib/dopamine";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Profile — Outstand" },
      { name: "description", content: "Your XP, level, streaks, focus, challenges, and progress." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { habits, sessions, outstand, xp, bestStreak, streaks } = useAppState();
  const { user, profile } = useAuth();
  const { logs } = useWeeklyLogs(7);
  const { logs: monthLogs } = useWeeklyLogs(30);
  const navigate = useNavigate();

  const { level, into, need } = levelFromXP(xp);
  const pct = Math.min(100, Math.round((into / need) * 100));
  const name = displayNameOf(user, profile);

  const days = useMemo(() => lastNDays(30), []);
  const dayStats = days.map((d) => {
    const done = habits.filter((h) => h.history.includes(d)).length;
    const total = habits.length;
    return { d, done, total, ratio: total ? done / total : 0 };
  });

  const totalCompletions = habits.reduce((s, h) => s + h.history.length, 0);
  const focusCompleted = sessions.filter((s) => s.completed).length;
  const focusMinutes = sessions.filter((s) => s.completed).reduce((s, x) => s + x.durationMin, 0);

  const avg = logs.length ? Math.round(logs.reduce((a, b) => a + b.score, 0) / logs.length) : 0;
  const best = logs.reduce((a, b) => (b.score > a.score ? b : a), logs[0] ?? { log_date: "-", score: 0 });
  const worst = logs.reduce((a, b) => (b.score < a.score ? b : a), logs[0] ?? { log_date: "-", score: 100 });

  let streak = 0;
  let longest = 0;
  for (const l of monthLogs) {
    if (l.score >= 70) {
      streak++;
      longest = Math.max(longest, streak);
    } else streak = 0;
  }

  const today = todayISO();
  const focusMinToday = sessions
    .filter((s) => s.completed && s.startedAt.slice(0, 10) === today)
    .reduce((a, s) => a + s.durationMin, 0);
  const habitPct = habits.length
    ? Math.round((habits.filter((h) => h.history.includes(today)).length / habits.length) * 100)
    : 0;
  const focusHoursWeek =
    sessions
      .filter((s) => s.completed && new Date(s.startedAt) >= new Date(Date.now() - 7 * 86400000))
      .reduce((a, s) => a + s.durationMin, 0) / 60;
  const productivity = Math.min(
    100,
    Math.round(habitPct * 0.4 + Math.min(100, focusHoursWeek * 10) * 0.6),
  );

  const signOut = async () => {
    await supabase.auth.signOut();
    toast("Signed out");
    navigate({ to: "/auth", replace: true });
  };

  return (
    <div className="space-y-8">
      <header className="glass-card relative overflow-hidden p-6 md:p-8">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[image:var(--gradient-primary)] opacity-20 blur-3xl" />
        <div className="relative flex flex-wrap items-center gap-5">
          <div className="grid h-20 w-20 place-items-center rounded-full border border-border/60 bg-secondary/60 text-2xl font-bold shadow-[var(--shadow-glow)]">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="h-full w-full rounded-full object-cover" />
            ) : (
              <span>{name.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-secondary/40 px-3 py-1 text-xs text-muted-foreground">
              <User className="h-3.5 w-3.5" /> Profile
            </div>
            <h1 className="mt-2 font-display text-2xl font-bold md:text-4xl">
              {name}
            </h1>
            <div className="truncate text-sm text-muted-foreground">{user?.email}</div>
          </div>
          <Button variant="outline" className="gap-2" onClick={signOut}>
            <LogOut className="h-4 w-4" /> Sign out
          </Button>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <BigStat icon={<Zap className="h-5 w-5" />} label="Total XP" value={String(xp)} accent="primary" />
        <BigStat icon={<Trophy className="h-5 w-5" />} label="Level" value={String(level)} accent="accent" />
        <BigStat icon={<Flame className="h-5 w-5" />} label="Best streak" value={`${bestStreak}d`} accent="warning" />
        <BigStat icon={<Target className="h-5 w-5" />} label="Habits completed" value={String(totalCompletions)} accent="success" />
      </section>

      <section className="glass-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-widest text-muted-foreground">Level {level}</div>
            <div className="font-display text-xl font-semibold">{into} / {need} XP to level {level + 1}</div>
          </div>
          <div className="text-sm text-muted-foreground">{pct}%</div>
        </div>
        <div className="mt-4 h-3 overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-[image:var(--gradient-primary)] transition-[width] duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MiniCard icon={<Activity className="h-4 w-4" />} label="Avg dopamine" value={String(avg)} sub="last 7 days" />
        <MiniCard icon={<TrendingUp className="h-4 w-4" />} label="Best day" value={String(best?.score ?? 0)} sub={best?.log_date ?? "—"} />
        <MiniCard icon={<TrendingUp className="h-4 w-4 rotate-180" />} label="Worst day" value={String(worst?.score ?? 0)} sub={worst?.log_date ?? "—"} />
        <MiniCard icon={<Flame className="h-4 w-4" />} label="Longest recovery" value={`${longest}d`} sub="≥ 70 score" />
      </section>

      <section className="glass-card p-6 md:p-8">
        <h2 className="font-display text-xl font-semibold">Dopamine trend</h2>
        <p className="text-xs text-muted-foreground">Last 7 days</p>
        <div className="mt-6 h-56">
          <TrendChart logs={logs} />
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <MiniCard label="Productivity" value={`${productivity}%`} sub="weighted" />
        <MiniCard label="Focus this week" value={`${focusHoursWeek.toFixed(1)}h`} sub={`${focusMinToday}m today`} />
        <MiniCard label="Habits today" value={`${habitPct}%`} sub={`${habits.length} total`} />
      </section>

      <section className="glass-card p-6">
        <h2 className="font-display text-lg font-semibold">Last 30 days</h2>
        <p className="text-xs text-muted-foreground">Daily habit completion rate</p>
        <div className="mt-5 flex items-end gap-1">
          {dayStats.map((s) => (
            <div key={s.d} className="group relative flex-1">
              <div
                className={cn(
                  "w-full rounded-t-md transition-colors",
                  s.ratio === 0 ? "bg-secondary/50" : s.ratio < 0.5 ? "bg-warning/70" : s.ratio < 1 ? "bg-primary/70" : "bg-success",
                )}
                style={{ height: `${Math.max(8, s.ratio * 100)}px` }}
              />
              <div className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 rounded-md bg-popover px-2 py-1 text-[10px] opacity-0 shadow-[var(--shadow-soft)] transition-opacity group-hover:opacity-100">
                {s.d} · {s.done}/{s.total}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="glass-card p-6">
          <h2 className="font-display text-lg font-semibold">Habit streaks</h2>
          <ul className="mt-4 space-y-3">
            {habits.length === 0 && <li className="text-sm text-muted-foreground">No habits yet.</li>}
            {habits.map((h) => {
              const streakVal = streaks.find((s) => s.id === h.id)?.streak ?? 0;
              return (
                <li key={h.id} className="flex items-center justify-between gap-3">
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="text-lg">{h.emoji}</span>
                    <span className="truncate">{h.name}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-1 rounded-full bg-secondary/60 px-2.5 py-1 text-xs">
                    <Flame className="h-3 w-3 text-warning" />
                    {streakVal}d
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="glass-card p-6">
          <h2 className="font-display text-lg font-semibold">Focus & Outstand</h2>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <SmallStat icon={<Timer className="h-4 w-4" />} label="Focus sessions" value={String(focusCompleted)} />
            <SmallStat icon={<Timer className="h-4 w-4" />} label="Focus minutes" value={String(focusMinutes)} />
            <SmallStat icon={<Zap className="h-4 w-4" />} label="Challenges done" value={String(outstand.length)} />
            <SmallStat icon={<Trophy className="h-4 w-4" />} label="Active habits" value={String(habits.length)} />
          </div>
        </div>
      </section>
    </div>
  );
}

function BigStat({
  icon, label, value, accent,
}: { icon: React.ReactNode; label: string; value: string; accent: "primary" | "accent" | "warning" | "success" }) {
  const map = {
    primary: "text-primary",
    accent: "text-accent",
    warning: "text-warning",
    success: "text-success",
  } as const;
  return (
    <div className="glass-card p-5">
      <div className={cn("flex items-center gap-2 text-xs", map[accent])}>
        {icon}
        <span className="uppercase tracking-widest">{label}</span>
      </div>
      <div className="mt-2 font-display text-3xl font-bold">{value}</div>
    </div>
  );
}

function MiniCard({ icon, label, value, sub }: { icon?: React.ReactNode; label: string; value: string; sub: string }) {
  return (
    <div className="glass-card p-4">
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="mt-1 font-display text-3xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground">{sub}</div>
    </div>
  );
}

function SmallStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/60 bg-secondary/30 p-3">
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="mt-1 font-display text-xl font-semibold">{value}</div>
    </div>
  );
}

function TrendChart({ logs }: { logs: { log_date: string; score: number }[] }) {
  if (logs.length === 0) return <div className="text-sm text-muted-foreground">No data yet.</div>;
  const w = 700;
  const h = 200;
  const step = w / Math.max(1, logs.length - 1);
  const points = logs.map((l, i) => [i * step, h - (l.score / 100) * h]);
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"}${p[0]},${p[1]}`).join(" ");
  const area = `${path} L${(logs.length - 1) * step},${h} L0,${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-full w-full">
      <defs>
        <linearGradient id="trendFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="oklch(0.72 0.16 245)" stopOpacity="0.5" />
          <stop offset="100%" stopColor="oklch(0.72 0.16 245)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 40, 70, 100].map((v) => (
        <line
          key={v}
          x1={0}
          x2={w}
          y1={h - (v / 100) * h}
          y2={h - (v / 100) * h}
          stroke="oklch(0.3 0.03 258 / 0.5)"
          strokeDasharray="4 6"
        />
      ))}
      <path d={area} fill="url(#trendFill)" />
      <path d={path} fill="none" stroke="oklch(0.82 0.14 235)" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => {
        const c = scoreColor(logs[i].score).hex;
        return <circle key={i} cx={p[0]} cy={p[1]} r={5} fill={c} stroke="oklch(0.14 0.03 258)" strokeWidth={2} />;
      })}
    </svg>
  );
}
