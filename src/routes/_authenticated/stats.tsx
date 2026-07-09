import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { Flame, Target, Timer, Trophy, Zap } from "lucide-react";
import { useAppState } from "@/hooks/use-app-state";
import { lastNDays, levelFromXP } from "@/lib/habits";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/stats")({
  head: () => ({
    meta: [
      { title: "Stats — Your progress" },
      { name: "description", content: "Streaks, XP, completion rate, and focus totals." },
      { property: "og:title", content: "Stats — Your progress" },
      { property: "og:description", content: "Track your consistency over time." },
    ],
  }),
  component: StatsPage,
});

function StatsPage() {
  const { habits, sessions, outstand, xp, bestStreak, streaks } = useAppState();
  const { level, into, need } = levelFromXP(xp);
  const pct = Math.min(100, Math.round((into / need) * 100));

  const days = useMemo(() => lastNDays(30), []);
  const dayStats = days.map((d) => {
    const done = habits.filter((h) => h.history.includes(d)).length;
    const total = habits.length;
    return { d, done, total, ratio: total ? done / total : 0 };
  });

  const totalCompletions = habits.reduce((s, h) => s + h.history.length, 0);
  const focusCompleted = sessions.filter((s) => s.completed).length;
  const focusMinutes = sessions.filter((s) => s.completed).reduce((s, x) => s + x.durationMin, 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold md:text-4xl">Your progress</h1>
        <p className="mt-2 text-sm text-muted-foreground">Consistency, focus, and momentum — measured.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <BigStat icon={<Zap className="h-5 w-5" />} label="Total XP" value={String(xp)} accent="primary" />
        <BigStat icon={<Trophy className="h-5 w-5" />} label="Level" value={String(level)} accent="accent" />
        <BigStat icon={<Flame className="h-5 w-5" />} label="Best streak" value={`${bestStreak}d`} accent="warning" />
        <BigStat icon={<Target className="h-5 w-5" />} label="Habits completed" value={String(totalCompletions)} accent="success" />
      </div>

      <div className="glass-card p-6">
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
      </div>

      <div className="glass-card p-6">
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
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="glass-card p-6">
          <h2 className="font-display text-lg font-semibold">Habit streaks</h2>
          <ul className="mt-4 space-y-3">
            {habits.length === 0 && <li className="text-sm text-muted-foreground">No habits yet.</li>}
            {habits.map((h) => {
              const streak = streaks.find((s) => s.id === h.id)?.streak ?? 0;
              return (
                <li key={h.id} className="flex items-center justify-between gap-3">
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="text-lg">{h.emoji}</span>
                    <span className="truncate">{h.name}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-1 rounded-full bg-secondary/60 px-2.5 py-1 text-xs">
                    <Flame className="h-3 w-3 text-warning" />
                    {streak}d
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="glass-card p-6">
          <h2 className="font-display text-lg font-semibold">Focus & Outstand</h2>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <MiniStat icon={<Timer className="h-4 w-4" />} label="Focus sessions" value={String(focusCompleted)} />
            <MiniStat icon={<Timer className="h-4 w-4" />} label="Focus minutes" value={String(focusMinutes)} />
            <MiniStat icon={<Zap className="h-4 w-4" />} label="Challenges done" value={String(outstand.length)} />
            <MiniStat icon={<Trophy className="h-4 w-4" />} label="Active habits" value={String(habits.length)} />
          </div>
        </div>
      </div>
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

function MiniStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
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
