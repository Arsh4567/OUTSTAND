import { RefreshCw, Smartphone, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDuration, frictionLevel, type DigitalFrictionSnapshot } from "@/lib/digital-friction";

export function DigitalFrictionCard({ snapshot, connected, loading, onRefresh }: {
  snapshot: DigitalFrictionSnapshot | null;
  connected: boolean;
  loading: boolean;
  onRefresh: () => void;
}) {
  const level = snapshot ? frictionLevel(snapshot.distractionMinutes) : null;

  return (
    <section className="rounded-[2rem] border border-violet-400/15 bg-[#0a0a18]/80 p-6 shadow-2xl backdrop-blur-3xl sm:p-8">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] text-violet-300"><Smartphone className="h-4 w-4" /> Digital friction</div>
          <h2 className="text-2xl font-black tracking-tight text-white">Find what steals your attention.</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">Connect your device usage once, then OUTSTAND can turn real app-usage patterns into attention insights.</p>
        </div>
        <Button onClick={onRefresh} variant="outline" className="rounded-xl border-white/10 bg-white/5" disabled={loading || !connected}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      {snapshot ? (
        <div className="mt-7 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/7 bg-black/25 p-5"><p className="text-xs font-bold uppercase tracking-widest text-slate-500">Screen time</p><p className="mt-2 text-3xl font-black text-white">{formatDuration(snapshot.screenMinutes)}</p></div>
          <div className="rounded-2xl border border-white/7 bg-black/25 p-5"><p className="text-xs font-bold uppercase tracking-widest text-slate-500">Attention leak</p><p className="mt-2 text-3xl font-black text-white">{formatDuration(snapshot.distractionMinutes)}</p></div>
          <div className="rounded-2xl border border-white/7 bg-black/25 p-5"><p className="text-xs font-bold uppercase tracking-widest text-slate-500">State</p><p className={`mt-2 text-xl font-black ${level?.tone === "danger" ? "text-rose-300" : level?.tone === "warn" ? "text-amber-300" : "text-emerald-300"}`}>{level?.label}</p></div>
        </div>
      ) : (
        <div className="mt-7 rounded-2xl border border-violet-400/15 bg-violet-500/5 p-6">
          <div className="flex gap-4"><Smartphone className="mt-1 h-5 w-5 shrink-0 text-violet-300" /><div><p className="font-bold text-white">Usage access isn't connected yet</p><p className="mt-1 text-sm leading-6 text-slate-400">Open Settings → Usage access to connect your device. Once permission is enabled, return here and refresh.</p></div></div>
        </div>
      )}

      {snapshot?.topApp && (
        <div className="mt-4 flex items-center justify-between rounded-2xl border border-rose-400/10 bg-rose-500/5 p-4"><div className="flex items-center gap-3"><Target className="h-4 w-4 text-rose-300" /><div><p className="text-xs font-bold uppercase tracking-widest text-rose-300">Biggest attention leak</p><p className="mt-1 font-black text-white">{snapshot.topApp.appName}</p></div></div><span className="font-black text-rose-200">{formatDuration(snapshot.topApp.minutes)}</span></div>
      )}

      {!connected && !snapshot && (
        <p className="mt-5 text-xs text-slate-600">No usage data is being invented or estimated. Connect usage access to populate this section.</p>
      )}
    </section>
  );
}
