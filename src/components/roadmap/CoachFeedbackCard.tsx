import { ArrowRight, Lightbulb, RotateCcw, Sparkles } from "lucide-react";
import type { CoachAnalysis } from "@/hooks/useStockfishCoach";
import { MoveAccuracyBadge } from "./MoveAccuracyBadge";

export function CoachFeedbackCard({ analysis, onShowBest, onRetry, canRetry = false }: { analysis: CoachAnalysis | null; onShowBest: () => void; onRetry: () => void; canRetry?: boolean }) {
  if (!analysis) return <div className="rounded-2xl border border-white/[0.07] bg-black/20 p-5 text-sm text-slate-500">Make a move and your local Stockfish coach will explain it here.</div>;
  const label = analysis.delta == null ? "Move reviewed" : analysis.classification === "best" || analysis.classification === "excellent" ? "Excellent decision" : analysis.classification === "good" ? "Solid move" : analysis.classification === "inaccuracy" ? "Small inaccuracy" : analysis.classification === "mistake" ? "This move can be improved" : "This move needs attention";
  const delta = analysis.delta == null ? "" : ` (${(analysis.delta / 100).toFixed(2)} pawn${analysis.delta >= 200 ? "s" : ""}} of evaluation)`.replace("pawnss", "pawns");
  return <div className="rounded-2xl border border-white/[0.07] bg-black/20 p-5 shadow-[0_20px_60px_-45px_rgba(34,211,238,.7)]">
    <div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-cyan-200"/><span className="text-[10px] font-black uppercase tracking-[.16em] text-slate-500">AI coach</span></div><MoveAccuracyBadge classification={analysis.classification}/></div>
    <h4 className="mt-3 text-xl font-black text-white">{label}</h4>
    <p className="mt-2 text-sm leading-6 text-slate-400">{analysis.classification === "blunder" ? "Blunder! Look for the tactical consequence and compare it with the engine's top continuation." : analysis.classification === "mistake" ? "Mistake. There was a significantly stronger choice available in this position." : analysis.classification === "inaccuracy" ? "Inaccuracy. The move is playable, but it gives away some of the position's value." : "The engine found this move broadly consistent with the strongest plan."}{delta}</p>
    <div className="mt-4 rounded-xl border border-cyan-300/10 bg-cyan-300/[0.04] p-3"><div className="flex items-center gap-2 text-xs font-bold text-cyan-100"><Lightbulb className="h-4 w-4"/>Best move</div><div className="mt-1 flex items-center gap-2 text-sm font-black text-white">{analysis.bestMove || "Unavailable"}<ArrowRight className="h-4 w-4 text-slate-600"/> {analysis.pv.slice(0, 4).join(" ") || "Engine line unavailable"}</div></div>
    <div className="mt-4 flex flex-wrap gap-2"><button type="button" onClick={onShowBest} disabled={!analysis.bestMove} className="rounded-xl border border-cyan-300/20 bg-cyan-300/[0.08] px-3 py-2 text-xs font-black text-cyan-100 disabled:opacity-40">Show Best Move</button><button type="button" onClick={onRetry} disabled={!canRetry} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-black text-slate-200 disabled:opacity-40"><RotateCcw className="h-3.5 w-3.5"/>Retry Move</button></div>
  </div>;
}
