import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Sparkles, TrendingUp, Timer, Zap, Brain, ArrowRight, Play, RefreshCcw, User } from "lucide-react";
import { AddHabitDialog, HabitCard } from "@/components/habit-card";
import { Button } from "@/components/ui/button";
import { useAppState } from "@/hooks/use-app-state";
import { useAuth, displayNameOf } from "@/hooks/use-auth";
import { useDailyLog } from "@/hooks/use-dopamine";
import { QUOTES, quoteOfTheDay } from "@/lib/quotes";
import { todayISO } from "@/lib/habits";
import { dailyChallenge } from "@/lib/challenges";
import { scoreColor } from "@/lib/dopamine";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/")({
  component: Dashboard,
});

function Dashboard() {
  const { habits, toggleToday, addHabit, updateHabit, deleteHabit, xp, bestStreak } = useAppState();
  const [quoteIdx, setQuoteIdx] = useState<number | null>(null);
  const { user, profile } = useAuth();
  const { log } = useDailyLog();
  const navigate = useNavigate();

  const today = todayISO();
  const completedToday = habits.filter((h) => h.history.includes(today)).length;
  const total = habits.length;
  const pct = total ? Math.round((completedToday / total) * 100) : 0;
  const q = quoteIdx === null ? quoteOfTheDay() : QUOTES[quoteIdx % QUOTES.length];
  const challenge = dailyChallenge(today);
  const score = log?.score ?? 50;
  const color = scoreColor(score);
  const name = displayNameOf(user, profile);
  const dateLabel = new Date(today + "T00:00").toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-8">
      <section className="fade-up glass-card relative overflow-hidden p-6 md:p-10">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[image:var(--gradient-primary)] opacity-20 blur-3xl" />
        <div className="relative grid gap-6 md:grid-cols-[1.4fr_1fr] md:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-secondary/40 px-3 py-1 text-xs text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5" />
              {dateLabel}
            </div>
            <h1 className="mt-3 font-display text-3xl font-bold leading-tight md:text-5xl">
              Welcome back, <span className="gradient-text">{name}.</span>
            </h1>
            <blockquote className="mt-3 max-w-xl text-sm text-muted-foreground md:text-base">
              "{q.text}" <span className="opacity-70">— {q.author}</span>
            </blockquote>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button asChild className="btn-primary gap-2">
                <Link to="/focus">
                  <Play className="h-4 w-4" /> Quick Pomodoro
                </Link>
              </Button>
              <Button asChild variant="outline" className="gap-2">
                <Link to="/dopamine">
                  <Brain className="h-4 w-4" /> Log dopamine
                </Link>
              </Button>
            </div>
          </div>

          <DopamineTile score={score} color={color.hex} label={color.label} />
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MiniStat label="Today" value={`${completedToday}/${total}`} sub={`${pct}% habits`} />
        <MiniStat label="Streak" value={String(bestStreak)} sub="best active" />
        <MiniStat label="XP" value={String(xp)} sub="all-time" />
        <MiniStat label="Dopamine" value={String(score)} sub={color.label} accent={color.hex} />
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
            <div className="min-w-0">
              <h2 className="truncate font-display text-xl font-semibold md:text-2xl">Today's habits</h2>
              <p className="text-sm text-muted-foreground">
                <TrendingUp className="mr-1 inline h-3.5 w-3.5" />
                Tap to complete. Consistency compounds.
              </p>
            </div>
            <AddHabitDialog
              onAdd={(d) => {
                addHabit(d);
                toast.success("Habit added", { description: d.name });
              }}
              trigger={
                <Button className="btn-primary shrink-0 gap-2">
                  <Plus className="h-4 w-4" /> New habit
                </Button>
              }
            />
          </div>
          {habits.length === 0 ? (
            <div className="glass-card mt-6 grid place-items-center p-12 text-center">
              <div className="text-4xl">🌱</div>
              <p className="mt-3 font-medium">No habits yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Create your first daily habit to start a streak.
              </p>
            </div>
          ) : (
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {habits.map((h) => (
                <HabitCard
                  key={h.id}
                  habit={h}
                  onToggle={() => toggleToday(h.id)}
                  onEdit={(data) => {
                    updateHabit(h.id, data);
                    toast.success("Habit updated");
                  }}
                  onDelete={() => {
                    deleteHabit(h.id);
                    toast("Habit removed");
                  }}
                />
              ))}
            </div>
          )}
        </div>

        <aside className="space-y-6">
          <div className="glass-card overflow-hidden">
            <div
              className="h-1"
              style={{ background: "var(--gradient-outstand)" }}
            />
            <div className="p-6">
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-muted-foreground">
                <Zap className="h-3.5 w-3.5" />
                Today's Outstand
              </div>
              <div className="mt-3 flex items-start gap-3">
                <div className="text-3xl">{challenge.emoji}</div>
                <div>
                  <div className="font-display text-lg font-semibold">{challenge.title}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{challenge.minutes} minutes</div>
                </div>
              </div>
              <p className="mt-3 text-sm text-muted-foreground line-clamp-3">{challenge.description}</p>
              <Button asChild className="btn-outstand mt-5 w-full gap-2">
                <Link to="/outstand">
                  Start challenge <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>

          <div className="glass-card p-6">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5" /> Quiet moment
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1 px-2 text-xs"
                onClick={() =>
                  setQuoteIdx((n) =>
                    ((n ?? 0) + 1 + Math.floor(Math.random() * (QUOTES.length - 1))) % QUOTES.length,
                  )
                }
              >
                <RefreshCcw className="h-3 w-3" /> New
              </Button>
            </div>
            <p className="mt-3 font-display text-base leading-snug">"{q.text}"</p>
            <p className="mt-1 text-xs text-muted-foreground">— {q.author}</p>
          </div>

          <div className="glass-card p-6">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-muted-foreground">
              <Timer className="h-3.5 w-3.5" /> Quick actions
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" onClick={() => navigate({ to: "/focus" })}>
                Start Pomodoro
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate({ to: "/dopamine" })}>
                Log dopamine
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate({ to: "/outstand" })}>
                Today's challenge
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate({ to: "/profile" })}>
                <User className="mr-1 h-3.5 w-3.5" /> My stats
              </Button>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}

function DopamineTile({ score, color, label }: { score: number; color: string; label: string }) {
  const c = 2 * Math.PI * 42;
  const offset = c - (score / 100) * c;
  return (
    <Link
      to="/dopamine"
      className="glass-card group grid gap-4 p-5 transition-transform hover:-translate-y-0.5 md:grid-cols-[auto_1fr] md:items-center"
    >
      <div className="relative mx-auto grid h-24 w-24 place-items-center">
        <svg viewBox="0 0 100 100" className="h-24 w-24 -rotate-90">
          <circle cx="50" cy="50" r="42" fill="none" stroke="oklch(0.28 0.04 258)" strokeWidth="8" />
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 500ms ease" }}
          />
        </svg>
        <div className="absolute font-display text-2xl font-bold tabular-nums" style={{ color }}>
          {score}
        </div>
      </div>
      <div>
        <div className="text-[11px] uppercase tracking-widest text-muted-foreground">Dopamine Recovery</div>
        <div className="mt-1 font-display text-lg font-semibold" style={{ color }}>
          {label}
        </div>
        <div className="mt-1 text-xs text-muted-foreground">Tap to log today's actions →</div>
      </div>
    </Link>
  );
}

function MiniStat({ label, value, sub, accent }: { label: string; value: string; sub: string; accent?: string }) {
  return (
    <div className="glass-card p-4">
      <div className="text-[11px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-1 font-display text-2xl font-bold" style={accent ? { color: accent } : undefined}>
        {value}
      </div>
      <div className="text-xs text-muted-foreground">{sub}</div>
    </div>
  );
}
