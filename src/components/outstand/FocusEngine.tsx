import { memo } from "react";
import { Check, Play, Sparkles, Target } from "lucide-react";
import { ChallengeCard } from "@/components/ChallengeCard";
import type { OutstandChallenge } from "@/lib/challenges.types";

interface FocusEngineProps {
  challenge: OutstandChallenge | null;
  isShuffling: boolean;
  shuffleDisplay: { emoji: string; title: string };
  completionStage: number;
  running: boolean;
  mins: string;
  secs: string;
  setRunning: (state: boolean) => void;
  setRemaining: (time: number) => void;
  generate: () => void;
  complete: () => void;
}

export const FocusEngine = memo(function FocusEngine({
  challenge,
  running,
  mins,
  secs,
  setRunning,
  setRemaining,
  generate,
  complete,
  completionStage,
}: FocusEngineProps) {
  if (!challenge) return <IdleState generate={generate} />;

  return (
    <section className="relative w-full" aria-label="Active ten minute challenge">
      <div className="mb-4 flex items-center justify-between gap-4 px-1">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-200/70">
          <Target className="h-3.5 w-3.5" /> Mission ready
        </div>
        <button type="button" onClick={generate} className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 transition-colors hover:text-white">
          New challenge
        </button>
      </div>
      <ChallengeCard
        challenge={challenge}
        completionStage={completionStage}
        running={running}
        mins={mins}
        secs={secs}
        setRunning={setRunning}
        setRemaining={setRemaining}
        generate={generate}
        complete={complete}
      />
    </section>
  );
});
FocusEngine.displayName = "FocusEngine";

function IdleState({ generate }: { generate: () => void }) {
  return (
    <div className="relative mx-auto flex w-full max-w-4xl flex-col items-center justify-center px-4 py-8 text-center sm:py-12">
      <div className="absolute inset-0 rounded-[2rem] bg-[radial-gradient(circle_at_50%_45%,rgba(34,211,238,0.10),transparent_46%)]" />
      <div className="relative z-10 inline-flex items-center gap-2 rounded-full border border-cyan-300/15 bg-cyan-300/[0.06] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-cyan-200/80">
        <Sparkles className="h-3.5 w-3.5" /> 10-minute reset
      </div>
      <h2 className="relative z-10 mt-5 max-w-3xl text-4xl font-black tracking-[-0.05em] text-white sm:text-6xl">
        Ten minutes can change the next hour.
      </h2>
      <p className="relative z-10 mt-4 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">
        Pick one small action for your mood, confidence, physical energy, thinking, focus, or self-control. Finish it. Leave with momentum.
      </p>
      <button
        type="button"
        onClick={generate}
        className="relative z-10 mt-8 inline-flex min-h-14 items-center gap-3 rounded-2xl bg-white px-7 text-sm font-black text-[#05070d] shadow-[0_16px_45px_rgba(255,255,255,0.12)] transition-transform duration-200 hover:-translate-y-0.5 hover:bg-cyan-50 active:translate-y-0"
      >
        <Play className="h-4 w-4 fill-current" />
        Give me a challenge
      </button>
      <div className="relative z-10 mt-8 flex flex-wrap justify-center gap-2 text-[9px] font-bold uppercase tracking-[0.16em] text-slate-500">
        {["Mood", "Confidence", "Physical", "Thinking", "Focus", "Discipline"].map((label) => (
          <span key={label} className="rounded-full border border-white/[0.07] bg-white/[0.025] px-3 py-1.5">{label}</span>
        ))}
      </div>
      <div className="relative z-10 mt-8 flex items-center gap-2 text-xs text-slate-600">
        <Check className="h-3.5 w-3.5 text-cyan-300/60" /> No feeds. No endless setup. Just one useful ten-minute action.
      </div>
    </div>
  );
}
