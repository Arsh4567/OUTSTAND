import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { ArrowRight, BrainCircuit, Check, CirclePlay, Gauge, Sparkles, Target, Zap } from "lucide-react";
import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { CinematicScene } from "@/components/landing/CinematicScene";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "OUTSTAND — Build Your Edge" },
      { name: "description", content: "A personal AI system for turning ambitious goals into an adaptive daily plan." },
      { name: "robots", content: "index, follow" },
      { property: "og:title", content: "OUTSTAND — Build Your Edge" },
      { property: "og:description", content: "Turn goals into a plan. Turn the plan into momentum." },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "OUTSTAND" },
    ],
  }),
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session) throw redirect({ to: "/dashboard" });
  },
  component: LandingPage,
});

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: "easeOut" } },
};

function Wordmark() {
  return (
    <Link to="/" className="group flex items-center gap-3" aria-label="OUTSTAND home">
      <span className="grid h-10 w-10 place-items-center rounded-xl border border-cyan-300/30 bg-cyan-300/10 shadow-[0_0_28px_rgba(34,211,238,0.18)] transition-transform duration-500 group-hover:rotate-12">
        <span className="h-3.5 w-3.5 rounded-full bg-cyan-200 shadow-[0_0_18px_rgba(103,232,249,0.95)]" />
      </span>
      <span className="text-[15px] font-black tracking-[0.28em] text-white">OUTSTAND</span>
    </Link>
  );
}

function CTA({ children, secondary = false }: { children: React.ReactNode; secondary?: boolean }) {
  return (
    <motion.div whileHover={{ y: -3 }} whileTap={{ scale: 0.98 }} transition={{ type: "spring", stiffness: 350, damping: 24 }}>
      <Button asChild size="lg" className={secondary ? "h-13 rounded-full border border-white/10 bg-white/[0.045] px-7 text-white backdrop-blur-xl hover:bg-white/[0.09]" : "h-13 rounded-full bg-white px-8 text-[#05070d] shadow-[0_0_55px_rgba(125,240,255,0.28)] hover:bg-cyan-50"}>
        {children}
      </Button>
    </motion.div>
  );
}

function Feature({ icon: Icon, number, title, children }: { icon: typeof Target; number: string; title: string; children: React.ReactNode }) {
  return (
    <motion.article variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} whileHover={{ y: -7 }} className="group relative overflow-hidden rounded-[28px] border border-white/[0.08] bg-white/[0.035] p-7 backdrop-blur-xl hover:border-cyan-300/20 hover:bg-white/[0.055]">
      <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-cyan-400/10 blur-3xl" />
      <div className="relative">
        <div className="mb-7 flex items-center justify-between">
          <span className="grid h-11 w-11 place-items-center rounded-2xl border border-cyan-300/15 bg-cyan-300/10 text-cyan-200"><Icon className="h-5 w-5" /></span>
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-600">{number}</span>
        </div>
        <h3 className="text-xl font-semibold tracking-tight text-white">{title}</h3>
        <p className="mt-3 text-sm leading-7 text-slate-400">{children}</p>
      </div>
    </motion.article>
  );
}

function DashboardPreview() {
  const actions = ["Chemical Reactions · 20 targeted questions", "Maths · revise today's weak concept", "10-minute error log + recall"];
  return (
    <motion.div initial={{ opacity: 0, y: 60 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.15 }} transition={{ duration: 0.8, ease: "easeOut" }} className="relative mx-auto mt-20 max-w-6xl">
      <div className="absolute -inset-20 -z-10 rounded-full bg-cyan-400/10 blur-[100px]" />
      <div className="overflow-hidden rounded-[30px] border border-white/10 bg-[#080c15]/90 shadow-[0_50px_140px_rgba(0,0,0,0.55)] backdrop-blur-2xl">
        <div className="flex h-12 items-center gap-2 border-b border-white/[0.07] px-5">
          <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
          <span className="ml-4 text-[10px] font-medium tracking-[0.2em] text-slate-500">OUTSTAND / TODAY</span>
        </div>
        <div className="grid lg:grid-cols-[1.25fr_0.75fr]">
          <div className="p-7 sm:p-10">
            <div className="flex items-start justify-between gap-5">
              <div>
                <p className="text-xs font-medium text-cyan-300">YOUR NEXT MOVE</p>
                <h3 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">Make today's progress undeniable.</h3>
              </div>
              <div className="hidden rounded-2xl border border-cyan-300/15 bg-cyan-300/10 px-4 py-3 text-right sm:block">
                <div className="text-[10px] uppercase tracking-widest text-cyan-200/70">Momentum</div>
                <div className="mt-1 text-lg font-black text-cyan-100">+450 XP</div>
              </div>
            </div>
            <div className="mt-9 space-y-3">
              {actions.map((item, index) => (
                <div key={item} className="flex items-center gap-4 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
                  <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${index === 0 ? "bg-cyan-300 text-[#061018]" : "bg-white/[0.06] text-slate-400"}`}>
                    {index === 0 ? <Zap className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                  </div>
                  <span className="text-sm font-medium text-slate-200">{item}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="border-t border-white/[0.07] bg-white/[0.018] p-7 lg:border-l lg:border-t-0 lg:p-10">
            <div className="text-xs uppercase tracking-[0.2em] text-slate-500">AI checkpoint</div>
            <div className="mt-6 rounded-3xl border border-indigo-300/10 bg-indigo-400/[0.06] p-5">
              <BrainCircuit className="h-5 w-5 text-indigo-200" />
              <p className="mt-4 text-sm leading-6 text-slate-300">Your weak-topic practice is becoming consistent. OUTSTAND is shifting tomorrow's workload toward application questions.</p>
            </div>
            <div className="mt-6 flex items-center justify-between text-xs text-slate-500"><span>Roadmap progress</span><span className="text-slate-300">34%</span></div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/[0.06]"><div className="h-full w-[34%] rounded-full bg-gradient-to-r from-cyan-300 to-indigo-400" /></div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function LandingPage() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });
  const heroY = useTransform(scrollYProgress, [0, 0.28], [0, -90]);

  return (
    <div ref={ref} className="min-h-screen overflow-x-clip bg-[#02040b] font-sans text-white selection:bg-cyan-300/20">
      <motion.div style={{ scaleX: progress }} className="fixed inset-x-0 top-0 z-[100] h-[2px] origin-left bg-gradient-to-r from-cyan-300 via-sky-400 to-indigo-400" />
      <CinematicScene />
      <nav className="fixed left-1/2 top-5 z-50 w-[calc(100%-2rem)] max-w-6xl -translate-x-1/2 rounded-2xl border border-white/[0.09] bg-[#050810]/55 px-4 py-3 shadow-2xl backdrop-blur-2xl sm:px-6">
        <div className="flex items-center justify-between">
          <Wordmark />
          <div className="hidden items-center gap-8 text-xs font-medium text-slate-400 md:flex">
            <a href="#system" className="transition hover:text-white">System</a>
            <a href="#intelligence" className="transition hover:text-white">Intelligence</a>
            <a href="#momentum" className="transition hover:text-white">Momentum</a>
          </div>
          <Button asChild className="h-9 rounded-full bg-white/[0.08] px-5 text-xs font-bold text-white ring-1 ring-white/10 hover:bg-white hover:text-black"><Link to="/auth">Get started</Link></Button>
        </div>
      </nav>

      <main>
        <section className="relative flex min-h-screen items-center px-5 pb-20 pt-32 sm:px-8">
          <motion.div style={{ y: heroY }} className="mx-auto w-full max-w-6xl text-center">
            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="mx-auto mb-8 inline-flex items-center gap-2 rounded-full border border-cyan-200/15 bg-cyan-300/[0.06] px-4 py-2 text-[10px] font-bold uppercase tracking-[0.22em] text-cyan-200/90 backdrop-blur-xl"><Sparkles className="h-3.5 w-3.5" /> Personal intelligence, built around you</motion.div>
            <motion.h1 initial="hidden" animate="visible" className="mx-auto max-w-5xl text-[clamp(3.7rem,9vw,8.8rem)] font-black leading-[0.88] tracking-[-0.07em]">
              <motion.span variants={fadeUp} className="block">Don't just set</motion.span>
              <motion.span variants={fadeUp} className="block bg-gradient-to-r from-white via-cyan-100 to-cyan-300 bg-clip-text text-transparent">goals.</motion.span>
              <motion.span variants={fadeUp} className="mt-3 block text-white/35">Build your edge.</motion.span>
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.7 }} className="mx-auto mt-8 max-w-2xl text-base leading-7 text-slate-400 sm:text-lg">OUTSTAND turns your goal into an intelligent roadmap, your roadmap into today's actions, and your actions into momentum that compounds.</motion.p>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.7 }} className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <CTA><Link to="/auth" className="flex items-center gap-2">Build my system <ArrowRight className="h-4 w-4" /></Link></CTA>
              <CTA secondary><a href="#system" className="flex items-center gap-2"><CirclePlay className="h-4 w-4" /> See how it works</a></CTA>
            </motion.div>
            <div className="mt-10 flex items-center justify-center gap-6 text-[10px] uppercase tracking-[0.18em] text-slate-500"><span>AI-guided</span><span className="h-1 w-1 rounded-full bg-white/20" /><span>Adaptive</span><span className="h-1 w-1 rounded-full bg-white/20" /><span>Built for action</span></div>
          </motion.div>
        </section>

        <section id="system" className="relative px-5 py-28 sm:px-8 sm:py-40">
          <div className="mx-auto max-w-6xl">
            <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.25 }} className="max-w-2xl">
              <div className="mb-4 text-[10px] font-bold uppercase tracking-[0.25em] text-cyan-300/70">The system</div>
              <h2 className="text-4xl font-bold tracking-[-0.04em] sm:text-6xl">From intention to execution.</h2>
              <p className="mt-5 text-base leading-7 text-slate-400">No generic checklist pretending to be personalization. OUTSTAND learns what you're actually trying to accomplish and builds the path around your constraints.</p>
            </motion.div>
            <div className="mt-14 grid gap-4 md:grid-cols-3">
              <Feature icon={Target} number="01 / DEFINE" title="Understand the real goal">The AI asks the questions that change the plan — target, timeline, baseline, schedule, weaknesses and constraints.</Feature>
              <Feature icon={BrainCircuit} number="02 / BUILD" title="Generate your route">A complete roadmap, timetable, milestones and concrete first actions are built around the information you provide.</Feature>
              <Feature icon={Gauge} number="03 / ADAPT" title="Keep getting smarter">Progress feeds the system. Difficulty, workload and priorities can evolve instead of leaving you with a frozen plan.</Feature>
            </div>
            <DashboardPreview />
          </div>
        </section>

        <section id="intelligence" className="border-y border-white/[0.06] bg-white/[0.018] px-5 py-28 sm:px-8 sm:py-40">
          <div className="mx-auto grid max-w-6xl items-center gap-16 lg:grid-cols-[0.9fr_1.1fr]">
            <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
              <div className="mb-4 text-[10px] font-bold uppercase tracking-[0.25em] text-cyan-300/70">Intelligence layer</div>
              <h2 className="text-4xl font-bold tracking-[-0.04em] sm:text-6xl">Your data should change what happens next.</h2>
              <p className="mt-5 text-base leading-7 text-slate-400">Habits, focus sessions, missions and roadmap progress become context. The point isn't more analytics — it's better decisions.</p>
            </motion.div>
            <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid gap-3 sm:grid-cols-2">
              {["Context-aware AI coaching", "Adaptive roadmaps", "Focus missions + XP", "Habit momentum tracking"].map((item) => <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4 text-sm font-semibold text-slate-200"><Check className="h-4 w-4 text-cyan-300" />{item}</div>)}
            </motion.div>
          </div>
        </section>

        <section id="momentum" className="px-5 py-28 text-center sm:px-8 sm:py-40">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="mx-auto max-w-4xl">
            <div className="mx-auto mb-6 grid h-14 w-14 place-items-center rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.07] text-cyan-200"><Zap className="h-6 w-6" /></div>
            <h2 className="text-4xl font-black tracking-[-0.05em] sm:text-6xl">Stop collecting plans.<br /><span className="text-white/35">Start building momentum.</span></h2>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-slate-400">OUTSTAND is designed to help you decide what matters, do the work, and make tomorrow easier to execute.</p>
            <div className="mt-9 flex justify-center"><CTA><Link to="/auth" className="flex items-center gap-2">Enter OUTSTAND <ArrowRight className="h-4 w-4" /></Link></CTA></div>
          </motion.div>
        </section>
      </main>
    </div>
  );
}
