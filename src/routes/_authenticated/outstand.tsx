import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Activity, ArrowRight, Brain, Check, Dumbbell, Focus, Gauge, Lightbulb, ShieldCheck, Sparkles, Target, Users, Zap } from "lucide-react";
import { FocusEngine } from "@/components/outstand/FocusEngine";
import { OutstandCanvas } from "@/components/outstand/OutstandCanvas";
import { OfflineBanner } from "@/components/outstand/OfflineBanner";
import { useOutstand } from "@/hooks/use-outstand";
import { OUTSTAND_10M_CATEGORIES } from "@/lib/outstand-10m.data";

type OutstandSearch = { challengeId?: string };
export const Route = createFileRoute("/_authenticated/outstand")({
  validateSearch: (search: Record<string, unknown>): OutstandSearch => ({ challengeId: typeof search.challengeId === "string" ? search.challengeId : undefined }),
  component: OutstandPage,
});
const CATEGORY_ICONS = { Mindset: Brain, Social: Users, Fitness: Dumbbell, Knowledge: Lightbulb, Focus, Discipline: ShieldCheck, Productivity: Target } as const;

export function OutstandPage() {
  const searchParams = useSearch({ strict: false }) as OutstandSearch;
  const challengeId = searchParams?.challengeId;
  const { challenge, running, setRunning, setRemaining, completionStage, generate, complete, mins, secs, loadChallenge } = useOutstand();
  const [isOnline, setIsOnline] = useState(() => typeof navigator === "undefined" ? true : navigator.onLine);
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => { if (challengeId) loadChallenge(challengeId); }, [challengeId, loadChallenge]);
  useEffect(() => { const media = window.matchMedia("(prefers-reduced-motion: reduce)"); const update = () => setReducedMotion(media.matches); const online = () => setIsOnline(true); const offline = () => setIsOnline(false); update(); window.addEventListener("online", online); window.addEventListener("offline", offline); media.addEventListener?.("change", update); return () => { window.removeEventListener("online", online); window.removeEventListener("offline", offline); media.removeEventListener?.("change", update); }; }, []);
  const categoryCount = useMemo(() => OUTSTAND_10M_CATEGORIES.length, []);
  const accent = challenge?.theme.particleColors[0] ?? "#67e8f9";
  return <div className="relative min-h-[calc(100vh-72px)] overflow-x-clip bg-background text-foreground selection:bg-cyan-300/20">
    <OfflineBanner isOnline={isOnline} />
    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(34,211,238,0.09),transparent_35%),radial-gradient(circle_at_100%_45%,rgba(99,102,241,0.07),transparent_28%)]" />
    <main className="relative z-10 mx-auto w-full max-w-7xl px-3 pb-16 pt-4 sm:px-6 sm:pb-20 sm:pt-7 lg:px-8 lg:pt-10">
      <section className="relative overflow-hidden rounded-[28px] border border-border bg-card/70 shadow-soft sm:rounded-[32px]"><OutstandCanvas accent={accent} active={Boolean(challenge)} reducedMotion={reducedMotion} />
        <div className="relative z-10 grid gap-6 p-5 sm:gap-8 sm:p-8 lg:grid-cols-[1.15fr_0.85fr] lg:p-10">
          <div className="max-w-3xl"><div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/15 bg-cyan-300/[0.06] px-3 py-2 text-[9px] font-black uppercase tracking-[0.2em] text-cyan-200/80"><Sparkles className="h-3.5 w-3.5" /> Outstand · 10 minute challenges</div>
            <h1 className="mt-4 max-w-3xl text-[clamp(2.7rem,12vw,4.5rem)] font-black leading-[.94] tracking-[-0.065em] text-foreground">Ten minutes.<span className="block bg-gradient-to-r from-foreground via-cyan-100 to-indigo-300 bg-clip-text text-transparent">A better next hour.</span></h1>
            <p className="mt-5 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">Outstand is no longer another endless task page. It gives you one deliberately small challenge that improves a real part of your day — mood, confidence, physical energy, thinking, focus, or discipline.</p>
            <div className="mt-5 grid grid-cols-3 gap-2 text-[9px] font-bold uppercase tracking-[0.12em] text-muted-foreground sm:flex sm:flex-wrap sm:gap-2">{[["One action","No setup"],["10 minutes","Always"],["Earn XP","Real progress"]].map(([label,sub]) => <div key={label} className="rounded-2xl border border-border bg-muted/40 px-2.5 py-2.5 sm:px-3.5"><div className="text-foreground/80">{label}</div><div className="mt-0.5 text-muted-foreground/70">{sub}</div></div>)}</div>
          </div>
          <div className="flex items-end lg:justify-end"><div className="w-full max-w-sm rounded-[24px] border border-border bg-background/70 p-4 backdrop-blur-xl sm:rounded-[26px] sm:p-5"><div className="flex items-center justify-between gap-3"><div><div className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Why this page exists</div><div className="mt-2 text-xl font-black tracking-tight text-foreground">Small wins, on purpose.</div></div><div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-cyan-300/15 bg-cyan-300/10 text-cyan-200"><Zap className="h-4 w-4" /></div></div><div className="mt-5 space-y-3">{["Lower the activation energy","Give the brain a clear finish line","Turn completion into momentum"].map(item => <div key={item} className="flex items-center gap-2.5 text-xs text-muted-foreground"><Check className="h-3.5 w-3.5 shrink-0 text-cyan-300" />{item}</div>)}</div></div></div>
        </div>
      </section>
      <section className="mt-4 grid grid-cols-2 gap-2.5 sm:mt-6 sm:grid-cols-2 sm:gap-3 lg:grid-cols-4"><Stat icon={<Gauge />} value="10 min" label="Every challenge" /><Stat icon={<Target />} value={String(categoryCount)} label="Growth areas" /><Stat icon={<Activity />} value="1" label="Mission at a time" /><Stat icon={<ShieldCheck />} value="XP" label="For finished work" /></section>
      <section className="mt-8 sm:mt-10"><div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><div className="text-[10px] font-black uppercase tracking-[0.24em] text-cyan-300/70">Choose your outcome</div><h2 className="mt-2 text-2xl font-black tracking-[-0.045em] text-foreground sm:text-4xl">What do you need right now?</h2></div><p className="max-w-md text-xs leading-5 text-muted-foreground">You can start randomly, or tell Outstand exactly what you want the next ten minutes to improve.</p></div>
        <div className="mt-4 grid gap-2.5 sm:mt-5 sm:grid-cols-2 lg:grid-cols-4">{OUTSTAND_10M_CATEGORIES.map(category => { const Icon = CATEGORY_ICONS[category.key]; const active = challenge?.category === category.key; return <button key={category.key} type="button" onClick={() => generate(category.key)} className={`group relative min-h-[148px] overflow-hidden rounded-[20px] border p-4 text-left transition-[transform,border-color,background-color] duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60 sm:min-h-[170px] sm:rounded-[22px] sm:p-5 ${active ? "border-cyan-300/30 bg-cyan-300/[0.08]" : "border-border bg-card/70 hover:border-cyan-300/20 hover:bg-muted/60"}`}><div className="flex items-center justify-between"><div className={`grid h-10 w-10 place-items-center rounded-xl border ${active ? "border-cyan-300/20 bg-cyan-300/10 text-cyan-200" : "border-border bg-muted/40 text-muted-foreground group-hover:text-foreground"}`}><Icon className="h-4 w-4" /></div><ArrowRight className="h-4 w-4 text-muted-foreground/50 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-muted-foreground" /></div><h3 className="mt-4 text-base font-bold text-foreground sm:mt-5">{category.label}</h3><p className="mt-2 text-xs leading-5 text-muted-foreground">{category.description}</p><div className="mt-3 text-[9px] font-black uppercase tracking-[0.16em] text-muted-foreground/70">Start 10 min</div></button>; })}</div>
      </section>
      <section className="mt-8 scroll-mt-24 sm:mt-10" aria-label="Challenge station"><div className="mb-4 flex items-center gap-3"><div className="h-px flex-1 bg-border" /><div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.22em] text-muted-foreground"><Focus className="h-3.5 w-3.5" /> Challenge station</div><div className="h-px flex-1 bg-border" /></div><div className="rounded-[26px] border border-border bg-card/60 p-2.5 shadow-soft sm:rounded-[30px] sm:p-5"><FocusEngine challenge={challenge} isShuffling={false} shuffleDisplay={{ emoji: "⚡", title: "Your next move" }} completionStage={completionStage} running={running} mins={mins} secs={secs} setRunning={setRunning} setRemaining={setRemaining} generate={() => generate()} complete={complete} /></div></section>
      <footer className="mt-8 flex flex-col gap-2 border-t border-border pt-5 text-[9px] uppercase tracking-[0.16em] text-muted-foreground sm:mt-10 sm:flex-row sm:items-center sm:justify-between"><span>OUTSTAND / 10M PROTOCOL</span><span>Do one useful thing. Then decide what is next.</span></footer>
    </main>
  </div>;
}
function Stat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) { return <div className="rounded-2xl border border-border bg-card/70 px-3 py-3 shadow-soft sm:px-4"><div className="flex items-center gap-2 text-cyan-300/70">{icon}<span className="text-[9px] font-bold uppercase tracking-[0.13em] text-muted-foreground">{label}</span></div><div className="mt-1 text-lg font-black tracking-tight text-foreground">{value}</div></div>; }
