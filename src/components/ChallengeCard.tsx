import { CheckCircle2, Pause, Play, RotateCcw, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getChallengeStyles } from "@/lib/challenges.styles";
import type { OutstandChallenge } from "@/lib/challenges.types";
import { cn } from "@/lib/utils";

interface ChallengeCardProps {
  challenge: OutstandChallenge;
  completionStage: number;
  running: boolean;
  mins: number | string;
  secs: number | string;
  setRunning: (running: boolean) => void;
  setRemaining: (remaining: number) => void;
  generate: () => void;
  complete: () => void;
}

export function ChallengeCard({ challenge, completionStage, running, mins, secs, setRunning, setRemaining, generate, complete }: ChallengeCardProps) {
  const styles = getChallengeStyles(challenge);
  const accent = styles.particleColors[0] || "#67e8f9";
  const totalSeconds = Math.max(0, Number(mins) * 60 + Number(secs));
  const durationSeconds = Math.max(1, challenge.durationMinutes * 60);
  const progress = Math.min(100, Math.max(0, ((durationSeconds - totalSeconds) / durationSeconds) * 100));
  const isFinished = totalSeconds === 0;
  const timer = `${String(Math.floor(totalSeconds / 60)).padStart(2, "0")}:${String(totalSeconds % 60).padStart(2, "0")}`;

  return (
    <article className="relative mx-auto w-full max-w-3xl overflow-hidden rounded-[28px] border border-white/[0.09] bg-[#070b13]/95 shadow-[0_24px_70px_rgba(0,0,0,0.28)]">
      <div className="absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${accent}90, transparent)` }} />
      <div className="absolute -right-28 -top-28 h-64 w-64 rounded-full opacity-20 blur-3xl" style={{ backgroundColor: accent }} />

      <div className="relative z-10 p-5 sm:p-7 md:p-9">
        <div className="flex items-center justify-between gap-3">
          <span className="rounded-full border px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.18em]" style={{ color: accent, borderColor: `${accent}45`, backgroundColor: `${accent}0d` }}>
            {challenge.category}
          </span>
          <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-500">10 minutes · {challenge.rarity}</span>
        </div>

        <div className="mt-8 grid gap-8 md:grid-cols-[1fr_0.9fr] md:items-center">
          <div>
            <div className="text-5xl sm:text-6xl" aria-hidden="true">{challenge.emoji}</div>
            <h2 className="mt-4 text-3xl font-black tracking-[-0.045em] text-white sm:text-4xl">{challenge.title}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-400">{challenge.description}</p>
            <p className="mt-4 text-xs font-medium leading-5 text-slate-500">{challenge.psychologicalProfile.flavorText}</p>
          </div>

          <div className="rounded-[24px] border border-white/[0.07] bg-black/20 p-4 sm:p-5">
            <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-[0.18em] text-slate-500">
              <span>{running ? "In progress" : isFinished ? "Complete" : "Ready"}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
              <div className="h-full rounded-full transition-[width] duration-300" style={{ width: `${progress}%`, backgroundColor: accent }} />
            </div>
            <div className="mt-7 rounded-2xl border border-white/[0.06] bg-[#050810] px-4 py-5 text-center">
              <div className="font-mono text-6xl font-medium tracking-[-0.07em] tabular-nums text-white sm:text-7xl">{timer}</div>
              <div className="mt-2 text-[9px] font-bold uppercase tracking-[0.2em] text-slate-600">One focused block</div>
            </div>
            <div className="mt-4 flex items-center justify-center gap-2">
              <button type="button" onClick={() => { setRemaining(durationSeconds); setRunning(false); }} className="grid h-11 w-11 place-items-center rounded-xl border border-white/[0.07] bg-white/[0.03] text-slate-500 transition-colors hover:bg-white/[0.07] hover:text-white" aria-label="Reset challenge">
                <RotateCcw className="h-4 w-4" />
              </button>
              <button type="button" onClick={() => setRunning(!running)} disabled={isFinished || completionStage > 0} className="grid h-14 w-14 place-items-center rounded-2xl border text-white transition-transform duration-150 hover:-translate-y-0.5 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-40" style={{ borderColor: `${accent}55`, backgroundColor: `${accent}16`, color: accent }} aria-label={running ? "Pause challenge" : "Start challenge"}>
                {running ? <Pause className="h-5 w-5 fill-current" /> : <Play className="h-5 w-5 fill-current" />}
              </button>
              <button type="button" onClick={generate} className="grid h-11 w-11 place-items-center rounded-xl border border-white/[0.07] bg-white/[0.03] text-slate-500 transition-colors hover:bg-white/[0.07] hover:text-white" aria-label="Skip challenge">
                <SkipForward className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="mt-7 grid grid-cols-3 gap-2">
          <InfoTile label="Reward" value={`+${challenge.xpReward} XP`} accent={accent} />
          <InfoTile label="Difficulty" value={challenge.difficulty} />
          <InfoTile label="Load" value={`${challenge.psychologicalProfile.cognitiveLoad}/5`} />
        </div>

        <Button
          onClick={complete}
          disabled={!isFinished || completionStage > 0}
          className={cn(
            "mt-3 h-14 w-full rounded-2xl text-xs font-black uppercase tracking-[0.16em] transition-transform duration-200 sm:h-15",
            isFinished && completionStage === 0 ? "bg-white text-black hover:-translate-y-0.5 hover:bg-cyan-50" : "border border-white/[0.07] bg-white/[0.03] text-slate-600",
          )}
        >
          {completionStage > 0 ? <><CheckCircle2 className="mr-2 h-4 w-4" /> Mission logged</> : isFinished ? <><CheckCircle2 className="mr-2 h-4 w-4" /> Complete challenge</> : "Finish the 10 minutes to claim XP"}
        </Button>
      </div>
    </article>
  );
}

function InfoTile({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-black/15 px-3 py-3 text-center">
      <div className="text-[8px] font-bold uppercase tracking-[0.18em] text-slate-600">{label}</div>
      <div className="mt-1 truncate text-xs font-bold text-slate-200" style={accent ? { color: accent } : undefined}>{value}</div>
    </div>
  );
}
