import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Coffee, Pause, Play, RotateCcw, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppState } from "@/hooks/use-app-state";
import { useDailyLog } from "@/hooks/use-dopamine";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/focus")({
  head: () => ({
    meta: [
      { title: "Focus — Pomodoro sessions" },
      { name: "description", content: "Run focused 25-minute Pomodoro sessions with break tracking." },
      { property: "og:title", content: "Focus — Pomodoro sessions" },
      { property: "og:description", content: "Run focused 25-minute Pomodoro sessions." },
    ],
  }),
  component: FocusPage,
});

type Mode = "focus" | "short" | "long";
const DURATIONS: Record<Mode, number> = { focus: 25 * 60, short: 5 * 60, long: 15 * 60 };
const LABELS: Record<Mode, string> = { focus: "Focus", short: "Short break", long: "Long break" };

function FocusPage() {
  const { sessions, recordSession } = useAppState();
  const { addPositive, addNegative } = useDailyLog();
  const [mode, setMode] = useState<Mode>("focus");
  const [remaining, setRemaining] = useState(DURATIONS.focus);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<number | null>(null);
  const startedAtRef = useRef<number | null>(null);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = window.setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          window.clearInterval(intervalRef.current!);
          setRunning(false);
          if (mode === "focus") {
            recordSession(DURATIONS.focus / 60, true);
            addPositive("pomodoro");
            toast.success("Focus session complete", { description: "+20 dopamine · +25 XP" });
          } else {
            toast("Break over", { description: "Back to work." });
          }
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
  }, [running, mode, recordSession, addPositive]);

  const switchMode = (m: Mode) => {
    setMode(m);
    setRunning(false);
    setRemaining(DURATIONS[m]);
    startedAtRef.current = null;
  };

  const toggle = () => {
    if (!running && startedAtRef.current == null) startedAtRef.current = Date.now();
    setRunning((r) => !r);
  };

  const reset = () => {
    if (running && mode === "focus" && remaining < DURATIONS.focus) {
      recordSession(Math.round((DURATIONS.focus - remaining) / 60), false);
      addNegative("broke_focus");
    }
    setRunning(false);
    setRemaining(DURATIONS[mode]);
    startedAtRef.current = null;
  };

  const total = DURATIONS[mode];
  const progress = 1 - remaining / total;
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;

  const completedFocus = sessions.filter((s) => s.completed).length;
  const totalMinutes = sessions.filter((s) => s.completed).reduce((a, b) => a + b.durationMin, 0);

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="font-display text-3xl font-bold md:text-4xl">Focus</h1>
        <p className="mt-2 text-sm text-muted-foreground">Work in deep 25-minute sprints. Rest in between.</p>
      </div>

      <div className="glass-card mx-auto max-w-xl p-8">
        <div className="flex justify-center gap-2">
          {(["focus", "short", "long"] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => switchMode(m)}
              className={cn(
                "rounded-full px-4 py-1.5 text-xs font-medium transition-colors",
                mode === m ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {LABELS[m]}
            </button>
          ))}
        </div>

        <div className="relative mx-auto mt-8 grid h-64 w-64 place-items-center md:h-72 md:w-72">
          <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90">
            <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" className="text-secondary" strokeWidth="6" />
            <circle
              cx="50" cy="50" r="45" fill="none"
              stroke="url(#focusGrad)" strokeWidth="6" strokeLinecap="round"
              strokeDasharray={`${progress * 282.7} 282.7`}
              style={{ transition: "stroke-dasharray 700ms linear" }}
            />
            <defs>
              <linearGradient id="focusGrad" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0%" stopColor="oklch(0.82 0.14 235)" />
                <stop offset="100%" stopColor="oklch(0.72 0.18 285)" />
              </linearGradient>
            </defs>
          </svg>
          <div className={cn("z-10 grid h-40 w-40 place-items-center rounded-full bg-secondary/40 backdrop-blur", running && "pulse-ring")}>
            <div className="text-center">
              <div className="font-mono text-4xl font-bold md:text-5xl">
                {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
              </div>
              <div className="mt-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{LABELS[mode]}</div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-center gap-3">
          <Button onClick={toggle} className="btn-primary min-w-32 gap-2">
            {running ? <><Pause className="h-4 w-4" /> Pause</> : <><Play className="h-4 w-4" /> Start</>}
          </Button>
          <Button variant="secondary" onClick={reset} className="gap-2">
            <RotateCcw className="h-4 w-4" /> Reset
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatBig icon={<Timer />} label="Completed sessions" value={String(completedFocus)} />
        <StatBig icon={<Coffee />} label="Total focus time" value={`${totalMinutes} min`} />
        <StatBig icon={<Play />} label="This mode" value={LABELS[mode]} />
      </div>

      <div className="glass-card p-5">
        <h3 className="font-display text-lg font-semibold">Recent sessions</h3>
        {sessions.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">No sessions yet. Start your first focus block.</p>
        ) : (
          <ul className="mt-3 divide-y divide-border/50">
            {sessions.slice(0, 8).map((s) => (
              <li key={s.id} className="flex items-center justify-between py-2.5 text-sm">
                <span className="flex items-center gap-2">
                  <span className={cn("h-2 w-2 rounded-full", s.completed ? "bg-success" : "bg-warning")} />
                  {s.durationMin} min · {s.completed ? "completed" : "stopped early"}
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(s.startedAt).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function StatBig({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="glass-card flex items-center gap-4 p-4">
      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-secondary/60 text-primary">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="truncate font-display text-xl font-bold">{value}</div>
      </div>
    </div>
  );
}
