import { createFileRoute } from "@tanstack/react-router";
import { Trophy, Activity, TrendingUp, Flame } from "lucide-react";
import { useWeeklyLogs } from "@/hooks/use-dopamine";
import { scoreColor } from "@/lib/dopamine";
import { useAppState } from "@/hooks/use-app-state";
import { todayISO } from "@/lib/habits";

export const Route = createFileRoute("/_authenticated/analytics")({
  head: () => ({
    meta: [
      { title: "Weekly Analytics — Ember" },
      { name: "description", content: "Weekly dopamine and productivity analytics." },
    ],
  }),
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const { logs } = useWeeklyLogs(7);
  const { logs: monthLogs } = useWeeklyLogs(30);
  const { habits, sessions } = useAppState();

  const avg = logs.length ? Math.round(logs.reduce((a, b) => a + b.score, 0) / logs.length) : 0;
  const best = logs.reduce((a, b) => (b.score > a.score ? b : a), logs[0] ?? { log_date: "-", score: 0 });
  const worst = logs.reduce((a, b) => (b.score < a.score ? b : a), logs[0] ?? { log_date: "-", score: 100 });

  // Longest recovery streak: consecutive days with score >= 70
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
    ? Math.round(
        (habits.filter((h) => h.history.includes(today)).length / habits.length) * 100,
      )
    : 0;
  const focusHoursWeek =
    sessions
      .filter((s) => s.completed && new Date(s.startedAt) >= new Date(Date.now() - 7 * 86400000))
      .reduce((a, s) => a + s.durationMin, 0) / 60;
  const productivity = Math.min(
    100,
    Math.round(habitPct * 0.4 + Math.min(100, focusHoursWeek * 10) * 0.6),
  );

  return (
    <div className="space-y-8">
      <header className="fade-up">
        <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-secondary/40 px-3 py-1 text-xs text-muted-foreground">
          <Trophy className="h-3.5 w-3.5" /> Weekly analytics
        </div>
        <h1 className="mt-3 font-display text-3xl font-bold md:text-5xl">
          Your recovery, <span className="gradient-text">in numbers.</span>
        </h1>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={<Activity className="h-4 w-4" />} label="Average score" value={String(avg)} sub="last 7 days" />
        <StatCard icon={<TrendingUp className="h-4 w-4" />} label="Best day" value={String(best?.score ?? 0)} sub={best?.log_date ?? "—"} />
        <StatCard icon={<TrendingUp className="h-4 w-4 rotate-180" />} label="Worst day" value={String(worst?.score ?? 0)} sub={worst?.log_date ?? "—"} />
        <StatCard icon={<Flame className="h-4 w-4" />} label="Longest recovery" value={`${longest}d`} sub="≥ 70 score" />
      </section>

      <section className="glass-card p-6 md:p-8">
        <h2 className="font-display text-xl font-semibold">Dopamine trend</h2>
        <div className="mt-6 h-56">
          <TrendChart logs={logs} />
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Productivity" value={`${productivity}%`} sub="weighted" />
        <StatCard label="Focus this week" value={`${focusHoursWeek.toFixed(1)}h`} sub={`${focusMinToday}m today`} />
        <StatCard label="Habits today" value={`${habitPct}%`} sub={`${habits.length} total`} />
      </section>
    </div>
  );
}

function StatCard({ icon, label, value, sub }: { icon?: React.ReactNode; label: string; value: string; sub: string }) {
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
