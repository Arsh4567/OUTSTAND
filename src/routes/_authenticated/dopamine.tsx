import { useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Activity, ArrowRight, Brain, Share, Sparkles, TrendingUp } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useDailyLog, useWeeklyLogs } from "@/hooks/use-dopamine";
import { useDigitalFriction } from "@/hooks/use-digital-friction";
import { computeBrainState } from "@/lib/digital-friction";
import { POSITIVES, NEGATIVES, scoreColor, generateInsights } from "@/lib/dopamine";
import { Button } from "@/components/ui/button";
import { ActionCard } from "@/components/dopamine/ActionCard";
import { CoreReactor } from "@/components/dopamine/CoreReactor";
import { NeuralChart } from "@/components/dopamine/NeuralChart";
import { BrainStateCard } from "@/components/dopamine/BrainStateCard";
import { DigitalFrictionCard } from "@/components/dopamine/DigitalFrictionCard";
import { WeeklyAnalysisCard } from "@/components/dopamine/WeeklyAnalysisCard";

export const Route = createFileRoute("/_authenticated/dopamine")({ component: MomentumPage });

const smoothEase = [0.16, 1, 0.3, 1] as const;

function MomentumPage() {
  const { log, loading, togglePositive, toggleNegative } = useDailyLog();
  const { logs } = useWeeklyLogs(7);
  const { snapshot, connected, loading: frictionLoading, refresh, saveManual } = useDigitalFriction();
  const score = log?.score ?? 50;
  const color = scoreColor(score);
  const positives = log?.positives ?? [];
  const negatives = log?.negatives ?? [];
  const brainState = useMemo(() => computeBrainState(score, snapshot), [score, snapshot]);
  const insights = useMemo(() => generateInsights(positives, negatives, score), [positives, negatives, score]);

  const analyzeWeek = async () => {
    const { data: session } = await supabase.auth.getSession();
    const token = session.session?.access_token;
    if (!token) throw new Error("Please sign in again to run your analysis.");

    const response = await fetch("/api/dopamine-analysis", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        logs: logs.map((item) => ({ log_date: item.log_date, score: item.score, positives: item.positives, negatives: item.negatives })),
        friction: snapshot ? { screenMinutes: snapshot.screenMinutes, distractionMinutes: snapshot.distractionMinutes, topApp: snapshot.topApp?.appName } : null,
      }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || "Analysis could not be completed.");
    return payload.analysis as string;
  };

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-[#02040a] text-xs font-black uppercase tracking-[0.3em] text-cyan-300">Calibrating your momentum state...</div>;
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#02040a] pb-24 font-sans text-white selection:bg-indigo-500/30">
      <motion.div className="fixed inset-0 -z-20 opacity-30 blur-[150px]" animate={{ background: `radial-gradient(circle 800px at 50% -20%, ${color.hex}40, transparent 80%)` }} transition={{ duration: 2, ease: smoothEase }} />
      <div className="fixed inset-0 -z-10 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.12] mix-blend-overlay" />

      <div className="mx-auto max-w-7xl p-4 pt-10 sm:p-6 lg:p-8">
        <header className="mb-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-[10px] font-black uppercase tracking-[0.25em] text-slate-400"><Activity className="h-3.5 w-3.5 text-cyan-400" /> Attention & recovery OS</div>
            <h1 className="text-5xl font-black tracking-tighter md:text-7xl">Momentum <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-cyan-300 to-indigo-400">Matrix.</span></h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-400">OUTSTAND now connects your daily actions, digital friction, and execution patterns instead of treating this as a simple habit checklist.</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => navigator.clipboard.writeText(`My OUTSTAND momentum state is ${brainState.overall}/100.`)} className="h-11 rounded-xl border-white/10 bg-white/5"><Share className="mr-2 h-4 w-4" /> Share state</Button>
            <Button asChild variant="outline" className="h-11 rounded-xl border-white/10 bg-white/5"><Link to="/profile">Timeline <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
          </div>
        </header>

        <div className="space-y-6">
          <BrainStateCard state={brainState} />
          <DigitalFrictionCard snapshot={snapshot} connected={connected} loading={frictionLoading} onRefresh={refresh} onSaveManual={saveManual} />
          <WeeklyAnalysisCard onAnalyze={analyzeWeek} />

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <section className="relative flex flex-col items-center justify-center overflow-hidden rounded-[2rem] border border-white/7 bg-[#0a0f1a]/70 p-7 shadow-2xl lg:col-span-4">
              <div className="mb-5 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] text-indigo-300"><Sparkles className="h-4 w-4" /> Current momentum</div>
              <CoreReactor score={score} color={color.hex} label={color.label} />
            </section>

            <section className="rounded-[2rem] border border-white/7 bg-[#0a0f1a]/70 p-6 shadow-2xl sm:p-8 lg:col-span-8">
              <div className="mb-6 flex items-center gap-3"><div className="rounded-xl border border-indigo-400/20 bg-indigo-500/10 p-2.5"><TrendingUp className="h-4 w-4 text-indigo-300" /></div><div><h2 className="text-xl font-black">Trajectory & signals</h2><p className="text-sm text-slate-500">Your recent behavior signals</p></div></div>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="rounded-2xl border border-white/7 bg-black/25 p-5"><div className="mb-4 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-500"><Brain className="h-3.5 w-3.5" /> What stands out</div><div className="space-y-4">{insights.slice(0, 4).map((insight, index) => <div key={index} className="flex gap-3 text-sm leading-6 text-slate-300"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-300" />{insight}</div>)}</div></div>
                <div className="min-h-[230px] rounded-2xl border border-white/7 bg-black/20 p-5"><h4 className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-500">Past 7 days</h4><NeuralChart color={color.hex} /></div>
              </div>
            </section>

            <section className="rounded-[2rem] border border-emerald-500/15 bg-emerald-950/10 p-6 shadow-2xl lg:col-span-6 sm:p-8">
              <h3 className="mb-6 text-xs font-black uppercase tracking-[0.2em] text-emerald-300">Accelerators</h3>
              <div className="grid gap-3 sm:grid-cols-2">{POSITIVES.slice(0, 8).map((item) => <ActionCard key={item.key} active={positives.includes(item.key)} emoji={item.emoji} label={item.label} description={item.description} points={item.points} tone="good" onClick={() => togglePositive(item.key)} />)}</div>
            </section>

            <section className="rounded-[2rem] border border-rose-500/15 bg-rose-950/10 p-6 shadow-2xl lg:col-span-6 sm:p-8">
              <h3 className="mb-6 text-xs font-black uppercase tracking-[0.2em] text-rose-300">Friction signals</h3>
              <div className="grid gap-3 sm:grid-cols-2">{NEGATIVES.map((item) => <ActionCard key={item.key} active={negatives.includes(item.key)} emoji={item.emoji} label={item.label} description={item.description} points={item.points} tone="bad" onClick={() => toggleNegative(item.key)} />)}</div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
