import { useState } from "react";
import { ExternalLink, LockKeyhole, RefreshCw, Smartphone, Target, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDuration, frictionLevel, type DigitalFrictionSnapshot } from "@/lib/digital-friction";

export function DigitalFrictionCard({ snapshot, connected, loading, onRefresh, onSaveManual }: {
  snapshot: DigitalFrictionSnapshot | null;
  connected: boolean;
  loading: boolean;
  onRefresh: () => void;
  onSaveManual: (screenMinutes: number, distractionMinutes: number) => void;
}) {
  const [screen, setScreen] = useState(snapshot?.screenMinutes ? String(snapshot.screenMinutes) : "");
  const [distraction, setDistraction] = useState(snapshot?.distractionMinutes ? String(snapshot.distractionMinutes) : "");
  const level = snapshot ? frictionLevel(snapshot.distractionMinutes) : null;

  return (
    <section className="rounded-[2rem] border border-violet-400/15 bg-[#0a0a18]/80 p-6 shadow-2xl backdrop-blur-3xl sm:p-8">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] text-violet-300"><Smartphone className="h-4 w-4" /> Digital friction</div>
          <h2 className="text-2xl font-black tracking-tight text-white">Find what steals your attention.</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">OUTSTAND can use Android usage data when the app is running with a native usage bridge. The web app never gets direct access to Digital Wellbeing by itself.</p>
        </div>
        <Button onClick={onRefresh} variant="outline" className="rounded-xl border-white/10 bg-white/5" disabled={loading}>
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
        <div className="mt-7 rounded-2xl border border-violet-400/15 bg-violet-500/5 p-5">
          <div className="flex gap-4"><LockKeyhole className="mt-1 h-5 w-5 shrink-0 text-violet-300" /><div><p className="font-bold text-white">Connect usage data when available</p><p className="mt-1 text-sm leading-6 text-slate-400">Android exposes app usage through UsageStatsManager only after the user grants Usage Access. OUTSTAND is prepared for that native bridge; until then, you can enter today's totals below.</p></div></div>
        </div>
      )}

      {snapshot?.topApp && (
        <div className="mt-4 flex items-center justify-between rounded-2xl border border-rose-400/10 bg-rose-500/5 p-4"><div className="flex items-center gap-3"><Target className="h-4 w-4 text-rose-300" /><div><p className="text-xs font-bold uppercase tracking-widest text-rose-300">Biggest attention leak</p><p className="mt-1 font-black text-white">{snapshot.topApp.appName}</p></div></div><span className="font-black text-rose-200">{formatDuration(snapshot.topApp.minutes)}</span></div>
      )}

      {!connected && (
        <div className="mt-5 rounded-2xl border border-white/7 bg-black/20 p-5">
          <div className="mb-4 flex items-center gap-2"><TrendingUp className="h-4 w-4 text-cyan-300" /><p className="text-sm font-bold text-white">Manual fallback</p><span className="ml-auto text-[10px] font-bold uppercase tracking-widest text-slate-500">Private on this device</span></div>
          <div className="grid gap-3 sm:grid-cols-2">
            <input aria-label="Today's screen time in minutes" inputMode="numeric" value={screen} onChange={(e) => setScreen(e.target.value.replace(/\D/g, ""))} placeholder="Screen time, minutes" className="h-11 rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white outline-none placeholder:text-slate-600 focus:border-violet-400/40" />
            <input aria-label="Today's distracting minutes" inputMode="numeric" value={distraction} onChange={(e) => setDistraction(e.target.value.replace(/\D/g, ""))} placeholder="Distracting minutes" className="h-11 rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white outline-none placeholder:text-slate-600 focus:border-violet-400/40" />
          </div>
          <Button onClick={() => onSaveManual(Number(screen) || 0, Number(distraction) || 0)} className="mt-3 rounded-xl bg-violet-500 hover:bg-violet-400">Save today's friction</Button>
          <p className="mt-3 text-xs text-slate-500">Native Android integration is intentionally optional. No device-wide data is requested by the website.</p>
        </div>
      )}

      <div className="mt-5 flex items-center gap-2 text-xs text-slate-500"><ExternalLink className="h-3.5 w-3.5" /> Android Usage Access is a system setting, not a browser permission.</div>
    </section>
  );
}
