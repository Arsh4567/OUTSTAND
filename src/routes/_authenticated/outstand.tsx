import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Pause, Play, RotateCcw, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CHALLENGES, randomChallenge, type OutstandChallenge } from "@/lib/challenges";
import { useAppState } from "@/hooks/use-app-state";
import { useDailyLog } from "@/hooks/use-dopamine";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/outstand")({
  head: () => ({
    meta: [
      { title: "Outstand — 10 minute self-improvement challenge" },
      { name: "description", content: "Get a random 10-minute self-improvement challenge and outstand today." },
      { property: "og:title", content: "Outstand — 10 minute challenge" },
      { property: "og:description", content: "One button. Ten minutes. A better you." },
    ],
  }),
  component: OutstandPage,
});

function OutstandPage() {
  const { outstand, recordOutstand } = useAppState();
  const { addPositive } = useDailyLog();
  const [challenge, setChallenge] = useState<OutstandChallenge | null>(null);
  const [remaining, setRemaining] = useState(600);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<number | null>(null);

  const generate = () => {
    const next = randomChallenge(challenge?.title);
    setChallenge(next);
    setRemaining(next.minutes * 60);
    setRunning(false);
  };

  useEffect(() => {
    if (!running) return;
    intervalRef.current = window.setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          window.clearInterval(intervalRef.current!);
          setRunning(false);
          toast.success("Time's up!", { description: "Mark it complete to lock in your XP." });
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
  }, [running]);

  const complete = () => {
    if (!challenge) return;
    recordOutstand(challenge.title);
    addPositive("outstand");
    toast.success("Outstanding.", { description: `+15 dopamine · +20 XP · ${challenge.title}` });
    setChallenge(null);
    setRemaining(600);
    setRunning(false);
  };

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;

  return (
    <div className="space-y-10">
      <div className="text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-secondary/40 px-3 py-1 text-xs">
          <Sparkles className="h-3.5 w-3.5 text-accent" />
          One button. Ten minutes. A better you.
        </div>
        <h1 className="mt-4 font-display text-4xl font-bold md:text-5xl">
          <span className="gradient-text">Outstand</span> today.
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground md:text-base">
          Feeling stuck? Tap the button. You'll get a random, doable 10-minute challenge to shake off the drift and reclaim momentum.
        </p>
      </div>

      {!challenge ? (
        <div className="fade-up mx-auto grid max-w-2xl place-items-center">
          <button
            onClick={generate}
            className="btn-outstand pulse-ring group relative grid h-56 w-56 place-items-center rounded-full font-display text-xl font-bold md:h-64 md:w-64 md:text-2xl"
          >
            <div className="text-center">
              <Zap className="mx-auto mb-2 h-8 w-8" />
              Give me a<br />challenge
            </div>
          </button>
          <p className="mt-6 text-xs uppercase tracking-widest text-muted-foreground">
            {CHALLENGES.length} unique challenges · always 10 minutes
          </p>
        </div>
      ) : (
        <div className="fade-up glass-card mx-auto max-w-3xl overflow-hidden p-8 md:p-10">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
            <div className="min-w-0">
              <div className="text-[11px] uppercase tracking-widest text-accent">Your challenge</div>
              <h2 className="mt-2 flex items-center gap-3 font-display text-2xl font-bold md:text-3xl">
                <span className="text-3xl">{challenge.emoji}</span>
                <span className="truncate">{challenge.title}</span>
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground md:text-base">
                {challenge.description}
              </p>
            </div>
            <div className="shrink-0 rounded-2xl border border-border/60 bg-secondary/40 px-4 py-3 text-center">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Duration</div>
              <div className="font-display text-2xl font-bold">{challenge.minutes} min</div>
            </div>
          </div>

          <div className="mt-8 flex flex-col items-center gap-4">
            <div className={cn("grid h-40 w-40 place-items-center rounded-full bg-secondary/50 backdrop-blur", running && "pulse-ring")}>
              <div className="text-center">
                <div className="font-mono text-4xl font-bold">
                  {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
                </div>
                <div className="mt-1 text-[10px] uppercase tracking-widest text-muted-foreground">remaining</div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2">
              <Button className="btn-primary gap-2" onClick={() => setRunning((r) => !r)}>
                {running ? <><Pause className="h-4 w-4" /> Pause</> : <><Play className="h-4 w-4" /> Start timer</>}
              </Button>
              <Button variant="secondary" className="gap-2" onClick={() => { setRemaining(challenge.minutes * 60); setRunning(false); }}>
                <RotateCcw className="h-4 w-4" /> Reset
              </Button>
              <Button variant="ghost" onClick={generate}>Skip · new one</Button>
              <Button className="gap-2 bg-success text-success-foreground hover:bg-success/90" onClick={complete}>
                <CheckCircle2 className="h-4 w-4" /> Mark complete
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="glass-card p-6">
        <h3 className="font-display text-lg font-semibold">Recently outstood</h3>
        {outstand.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            No completed challenges yet. Your first one is one tap away.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-border/50">
            {outstand.slice(0, 8).map((o) => (
              <li key={o.id} className="flex items-center justify-between py-2.5 text-sm">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  {o.title}
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(o.completedAt).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
