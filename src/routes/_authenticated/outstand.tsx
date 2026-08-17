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
  validateSearch: (search: Record<string, unknown>): OutstandSearch => ({
    challengeId: typeof search.challengeId === "string" ? search.challengeId : undefined,
  }),
  component: OutstandPage,
});

const CATEGORY_ICONS = {
  Mindset: Brain,
  Social: Users,
  Fitness: Dumbbell,
  Knowledge: Lightbulb,
  Focus,
  Discipline: ShieldCheck,
  Productivity: Target,
} as const;

export function OutstandPage() {
  const searchParams = useSearch({ strict: false }) as OutstandSearch;
  const challengeId = searchParams?.challengeId;
  const { challenge, running, setRunning, setRemaining, completionStage, generate, complete, mins, secs, loadChallenge } = useOutstand();
  const [isOnline, setIsOnline] = useState(() => typeof navigator === "undefined" ? true : navigator.onLine);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (!challengeId) return;
    loadChallenge(challengeId);
  }, [challengeId, loadChallenge]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotion = () => setReducedMotion(media.matches);
    const online = () => setIsOnline(true);
    const offline = () => setIsOnline(false);
    updateMotion();
    window.addEventListener("online", online);
    window.addEventListener("offline", offline);
    media.addEventListener?.("change", updateMotion);
    return () => {
      window.removeEventListener("online", online);
      window.removeEventListener("offline", offline);
      media.removeEventListener?.("change", updateMotion);
    };
  }, []);

  const categoryCount = useMemo(() => OUTSTAND_10M_CATEGORIES.length, []);
  const accent = challenge?.theme.particleColors[0] ?? "#67e8f9";

  return (
    <div className="relative min-h-[calc(100vh-72px)] overflow-x-clip bg-[#03050b] text-white selection:bg-cyan-300/20">
      <OfflineBanner isOnline={isOnline} />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(34,211,238,0.09),transparent_35%),radial-gradient(circle_at_100%_45%,rgba(99,102,241,0.07),transparent_28%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/35 to-transparent" />

      <main className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-20 pt-7 sm:px-6 lg:px-8 lg:pt-10">
        <section className="relative overflow-hidden rounded-[32px] border border-white/[0.08] bg-white/[0.025]">
          <OutstandCanvas accent={accent} active={Boolean(challenge)} reducedMotion={reducedMotion} />
          <div className="relative z-10 grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.15fr_0.85fr] lg:p-10">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/15 bg-cyan-300/[0.06] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.24em] text-cyan-200/80">
                <Sparkles className="h-3.5 w-3.5" /> Outstand · 10 minute challenges
              </div>
              <h1 className="mt-5 max-w-3xl text-5xl font-black tracking-[-0.065em] text-white sm:text-6xl lg:text-7xl">
                Ten minutes.
                <span className="block bg-gradient-to-r from-white via-cyan-100 to-indigo-300 bg-clip-text text-transparent">A better next hour.</span>
              </h1>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-400 sm:text-base">
                Outstand is no longer another endless task page. It gives you one deliberately small challenge that improves a real part of your day — mood, confidence, physical energy, thinking, focus, or discipline.
              </p>
              <div className="mt-6 flex flex-wrap gap-2 text-[9px] font-bold uppercase tracking-[0.16em] text-slate-500">
                {[
                  ["One action", "No setup"],
                  ["10 minutes", "Always"],
                  ["Earn XP", "Real progress"],
                ].map(([label, sub]) => (
                  <div key={label} className="rounded-2xl border border-white/[0.07] bg-black/20 px-3.5 py-2.5">
                    <div className="text-slate-300">{label}</div>
                    <div className="mt-0.5 text-slate-600">{sub}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-end justify-start lg:justify-end">
              <div className="w-full max-w-sm rounded-[26px] border border-white/[0.08] bg-[#050810]/75 p-5 backdrop-blur-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500">Why this page exists</div>
                    <div className="mt-2 text-xl font-black tracking-tight text-white">Small wins, on purpose.</div>
                  </div>
                  <div className="grid h-10 w-10 place-items-center rounded-xl border border-cyan-300/15 bg-cyan-300/10 text-cyan-200"><Zap className="h-4 w-4" /></div>
                </div>
                <div className="mt-5 space-y-3">
                  {["Lower the activation energy", "Give the brain a clear finish line", "Turn completion into momentum"].map((item) => (
                    <div key={item} className="flex items-center gap-2.5 text-xs text-slate-400"><Check className="h-3.5 w-3.5 shrink-0 text-cyan-300" />{item}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat icon={<Gauge />} value="10 min" label="Every challenge" />
          <Stat icon={<Target />} value={String(categoryCount)} label="Growth areas" />
          <Stat icon={<Activity />} value="1" label="Mission at a time" />
          <Stat icon={<ShieldCheck />} value="XP" label="For finished work" />
        </section>

        <section className="mt-10">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.24em] text-cyan-300/70">Choose your outcome</div>
              <h2 className="mt-2 text-3xl font-black tracking-[-0.045em] text-white sm:text-4xl">What do you need right now?</h2>
            </div>
            <p className="max-w-md text-xs leading-5 text-slate-500">You can start randomly, or tell Outstand exactly what you want the next ten minutes to improve.</p>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {OUTSTAND_10M_CATEGORIES.map((category) => {
              const Icon = CATEGORY_ICONS[category.key];
              const active = challenge?.category === category.key;
              return (
                <button
                  key={category.key}
                  type="button"
                  onClick={() => generate(category.key)}
                  className={`group relative overflow-hidden rounded-[22px] border p-5 text-left transition-[transform,border-color,background-color] duration-200 hover:-translate-y-0.5 ${active ? "border-cyan-300/30 bg-cyan-300/[0.08]" : "border-white/[0.07] bg-white/[0.025] hover:border-white/[0.14] hover:bg-white/[0.045]"}`}
                >
                  <div className="flex items-center justify-between">
                    <div className={`grid h-10 w-10 place-items-center rounded-xl border ${active ? "border-cyan-300/20 bg-cyan-300/10 text-cyan-200" : "border-white/[0.07] bg-white/[0.03] text-slate-400 group-hover:text-white"}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-700 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-slate-400" />
                  </div>
                  <h3 className="mt-5 text-base font-bold text-white">{category.label}</h3>
                  <p className="mt-2 text-xs leading-5 text-slate-500">{category.description}</p>
                  <div className="mt-4 text-[9px] font-black uppercase tracking-[0.16em] text-slate-600">Start 10 min</div>
                </button>
              );
            })}
          </div>
        </section>

        <section className="mt-10 scroll-mt-24" aria-label="Challenge station">
          <div className="mb-4 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/[0.06]" />
            <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.22em] text-slate-600"><Focus className="h-3.5 w-3.5" /> Challenge station</div>
            <div className="h-px flex-1 bg-white/[0.06]" />
          </div>
          <div className="rounded-[30px] border border-white/[0.08] bg-white/[0.02] p-3 sm:p-5">
            <FocusEngine
              challenge={challenge}
              isShuffling={false}
              shuffleDisplay={{ emoji: "⚡", title: "Your next move" }}
              completionStage={completionStage}
              running={running}
              mins={mins}
              secs={secs}
              setRunning={setRunning}
              setRemaining={setRemaining}
              generate={() => generate()}
              complete={complete}
            />
          </div>
        </section>

        <footer className="mt-10 flex flex-col gap-3 border-t border-white/[0.06] pt-6 text-[10px] uppercase tracking-[0.18em] text-slate-600 sm:flex-row sm:items-center sm:justify-between">
          <span>OUTSTAND / 10M PROTOCOL</span>
          <span>Do one useful thing. Then decide what is next.</span>
        </footer>
      </main>
    </div>
  );
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] px-4 py-3">
      <div className="flex items-center gap-2 text-cyan-300/70">{icon}<span className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-600">{label}</span></div>
      <div className="mt-1 text-lg font-black tracking-tight text-white">{value}</div>
    </div>
  );
}
