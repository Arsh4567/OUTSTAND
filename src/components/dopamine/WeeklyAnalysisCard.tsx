import { useState } from "react";
import { BrainCircuit, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function WeeklyAnalysisCard({ onAnalyze }: { onAnalyze: () => Promise<string> }) {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const analyze = async () => {
    setLoading(true);
    try {
      setAnalysis(await onAnalyze());
    } catch (error) {
      setAnalysis(error instanceof Error ? error.message : "Analysis could not be completed right now.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="rounded-[2rem] border border-indigo-400/15 bg-[#0a0c1c]/80 p-6 shadow-2xl backdrop-blur-3xl sm:p-8">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-indigo-400/20 bg-indigo-500/10"><BrainCircuit className="h-5 w-5 text-indigo-300" /></div>
          <div><div className="mb-1 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] text-indigo-300"><Sparkles className="h-3.5 w-3.5" /> Intelligence</div><h2 className="text-2xl font-black tracking-tight text-white">Why did my momentum change?</h2><p className="mt-1 text-sm text-slate-400">OUTSTAND compares your recent momentum, friction, and daily actions.</p></div>
        </div>
        <Button onClick={analyze} disabled={loading} className="rounded-xl bg-indigo-500 px-5 hover:bg-indigo-400"><span>{loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}</span>{loading ? "Analyzing" : "Analyze my week"}</Button>
      </div>
      {analysis && <div className="mt-6 rounded-2xl border border-white/7 bg-black/25 p-5"><p className="whitespace-pre-wrap text-sm leading-7 text-slate-200">{analysis}</p></div>}
    </section>
  );
}
