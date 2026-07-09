import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Sparkles, Zap, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDailyLog, useWeeklyLogs } from "@/hooks/use-dopamine";
import {
  POSITIVES,
  NEGATIVES,
  scoreColor,
  generateInsights,
  type PositiveKey,
  type NegativeKey,
} from "@/lib/dopamine";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dopamine")({
  head: () => ({
    meta: [
      { title: "Dopamine Recovery — Ember" },
      { name: "description", content: "Track your daily dopamine recovery score and rebuild focus." },
    ],
  }),
  component: DopaminePage,
});

function DopaminePage() {
  const { log, togglePositive, toggleNegative } = useDailyLog();
  const score = log?.score ?? 50;
  const color = scoreColor(score);
  const insights = useMemo(
    () => (log ? generateInsights(log.positives, log.negatives, score) : []),
    [log, score],
  );

  return (
    <div className="space-y-8">
      <header className="fade-up">
        <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-secondary/40 px-3 py-1 text-xs text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5" />
          Dopamine Recovery
        </div>
        <h1 className="mt-3 font-display text-3xl font-bold md:text-5xl">
          Rebuild your <span className="gradient-text">baseline.</span>
        </h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground md:text-base">
          Log the actions that heal your focus and the ones that drain it. Your score updates instantly.
        </p>
      </header>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_1.2fr]">
        <div className="glass-card fade-up p-6 md:p-8">
          <ScoreRing score={score} color={color.hex} />
          <div className="mt-4 text-center">
            <div
              className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium"
              style={{ borderColor: color.hex, color: color.hex }}
            >
              <span
                className="inline-block h-1.5 w-1.5 rounded-full"
                style={{ background: color.hex }}
              />
              {color.label}
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              {log ? `${log.positives.length} positives · ${log.negatives.length} drains today` : "Loading…"}
            </p>
          </div>
        </div>

        <div className="glass-card fade-up p-6 md:p-8">
          <h2 className="font-display text-xl font-semibold">Recovery analysis</h2>
          <p className="mt-1 text-sm text-muted-foreground">Personalized reads on your day.</p>
          <ul className="mt-5 space-y-3">
            {insights.length === 0 ? (
              <li className="text-sm text-muted-foreground">Log an action to unlock insights.</li>
            ) : (
              insights.map((i, idx) => (
                <li
                  key={idx}
                  className="fade-up flex gap-3 rounded-xl border border-border/60 bg-secondary/30 p-3 text-sm"
                  style={{ animationDelay: `${idx * 60}ms` }}
                >
                  <Zap className="mt-0.5 h-4 w-4 shrink-0 text-primary-glow" />
                  <span>{i}</span>
                </li>
              ))
            )}
          </ul>
        </div>
      </section>

      <section>
        <Tabs defaultValue="positives">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="positives">Positive actions</TabsTrigger>
            <TabsTrigger value="negatives">Drains</TabsTrigger>
          </TabsList>

          <TabsContent value="positives" className="mt-6">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {POSITIVES.map((p) => {
                const active = log?.positives.includes(p.key) ?? false;
                return (
                  <ActionCard
                    key={p.key}
                    active={active}
                    emoji={p.emoji}
                    label={p.label}
                    description={p.description}
                    points={p.points}
                    tone="good"
                    onClick={() => togglePositive(p.key as PositiveKey)}
                  />
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="negatives" className="mt-6">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {NEGATIVES.map((n) => {
                const active = log?.negatives.includes(n.key) ?? false;
                return (
                  <ActionCard
                    key={n.key}
                    active={active}
                    emoji={n.emoji}
                    label={n.label}
                    description={n.description}
                    points={n.points}
                    tone="bad"
                    onClick={() => toggleNegative(n.key as NegativeKey)}
                  />
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </section>

      <WeeklySection />

      <div className="flex justify-end">
        <Button asChild variant="ghost" className="gap-2">
          <Link to="/analytics">
            See full weekly analytics <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

function ScoreRing({ score, color }: { score: number; color: string }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const start = display;
    const delta = score - start;
    const duration = 700;
    const t0 = performance.now();
    let raf = 0;
    const step = (t: number) => {
      const p = Math.min(1, (t - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(start + delta * eased));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [score]);

  const size = 220;
  const stroke = 16;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (display / 100) * c;

  return (
    <div className="mx-auto grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="oklch(0.28 0.04 258)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 700ms cubic-bezier(0.2, 0.8, 0.2, 1), stroke 300ms ease" }}
        />
      </svg>
      <div className="pointer-events-none absolute grid place-items-center text-center">
        <div className="font-display text-6xl font-bold tabular-nums" style={{ color }}>
          {display}
        </div>
        <div className="mt-1 text-[11px] uppercase tracking-widest text-muted-foreground">out of 100</div>
      </div>
    </div>
  );
}

function ActionCard({
  active,
  emoji,
  label,
  description,
  points,
  tone,
  onClick,
}: {
  active: boolean;
  emoji: string;
  label: string;
  description: string;
  points: number;
  tone: "good" | "bad";
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group text-left glass-card p-4 transition-all hover:-translate-y-0.5",
        active && tone === "good" && "ring-2 ring-[oklch(0.74_0.17_155)]/70",
        active && tone === "bad" && "ring-2 ring-destructive/70",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="text-2xl">{emoji}</div>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[11px] font-semibold",
            tone === "good" ? "bg-[oklch(0.74_0.17_155)]/15 text-[oklch(0.82_0.15_155)]" : "bg-destructive/15 text-destructive",
          )}
        >
          {points > 0 ? `+${points}` : points}
        </span>
      </div>
      <div className="mt-3 font-semibold">{label}</div>
      <div className="mt-1 text-xs text-muted-foreground">{description}</div>
      <div className="mt-3 text-[11px] uppercase tracking-widest text-muted-foreground">
        {active ? "Logged" : "Tap to log"}
      </div>
    </button>
  );
}

function WeeklySection() {
  const { logs } = useWeeklyLogs(7);
  const max = 100;
  return (
    <section className="glass-card p-6 md:p-8">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="font-display text-xl font-semibold">This week</h2>
        <span className="text-xs text-muted-foreground">
          Avg {logs.length ? Math.round(logs.reduce((a, b) => a + b.score, 0) / logs.length) : 0}
        </span>
      </div>
      <div className="mt-5 grid grid-cols-7 items-end gap-2 h-40">
        {logs.map((l) => {
          const color = scoreColor(l.score);
          const h = Math.max(6, (l.score / max) * 100);
          const d = new Date(l.log_date + "T00:00");
          return (
            <div key={l.log_date} className="flex flex-col items-center gap-2">
              <div
                className="w-full rounded-t-md"
                style={{ height: `${h}%`, background: `linear-gradient(180deg, ${color.hex}, ${color.hex}55)` }}
                title={`${l.log_date}: ${l.score}`}
              />
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                {d.toLocaleDateString(undefined, { weekday: "short" }).slice(0, 2)}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
