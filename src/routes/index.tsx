import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import {
  ArrowRight,
  Bell,
  BrainCircuit,
  Check,
  ChevronDown,
  CirclePlay,
  Clock3,
  Flame,
  Gauge,
  MessageCircle,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
  UserRound,
  Users,
  Zap,
} from "lucide-react";
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { CinematicScene } from "@/components/landing/CinematicScene";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "OUTSTAND — AI-powered personal growth system" },
      {
        name: "description",
        content:
          "OUTSTAND combines AI guidance, adaptive roadmaps, focus sessions, habits, XP, streaks, friends, chat and notifications in one personal growth system.",
      },
      { name: "robots", content: "index, follow" },
      { property: "og:title", content: "OUTSTAND — Your personal growth system" },
      {
        property: "og:description",
        content: "AI guidance, roadmaps, focus, habits, gamification and friends — built into one system.",
      },
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
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" } },
};

const productFeatures = [
  { icon: BrainCircuit, title: "AI Assistant", text: "Ask questions, get guidance, and let the assistant use your real OUTSTAND progress as context." },
  { icon: Target, title: "AI Roadmaps", text: "Turn a goal into milestones, daily actions and an adaptive path instead of a static checklist." },
  { icon: Clock3, title: "Focus Timer", text: "Work in focused sessions, track real time and earn 2 XP for every focused minute." },
  { icon: Check, title: "Habits & Tasks", text: "Build repeatable routines, complete actions and keep your day moving with less friction." },
  { icon: Trophy, title: "XP & Levels", text: "Turn meaningful actions into measurable progress with a persistent gamification system." },
  { icon: Flame, title: "Streaks & Momentum", text: "Keep consistency visible and make showing up feel rewarding without overwhelming the interface." },
  { icon: Users, title: "Friends", text: "Find people by name or UID, send requests, accept or decline them and build your network." },
  { icon: MessageCircle, title: "Messaging", text: "Chat with friends in a dedicated conversation experience designed for quick communication." },
  { icon: Bell, title: "Notifications", text: "Get useful reminders and social updates so important actions do not disappear into the noise." },
  { icon: UserRound, title: "Your Profile", text: "Customize your name, avatar and bio while showing your progress, status and social identity." },
  { icon: Search, title: "People Search", text: "Search the OUTSTAND community by display name or user ID and open profiles directly." },
  { icon: Gauge, title: "Progress System", text: "Bring activity, focus, habits, roadmaps and gamification together so progress has a single home." },
];

function Wordmark() {
  return (
    <Link to="/" className="group flex items-center gap-3" aria-label="OUTSTAND home">
      <span aria-hidden="true" className="grid h-10 w-10 place-items-center rounded-xl border border-cyan-300/30 bg-cyan-300/10 shadow-[0_0_28px_rgba(34,211,238,0.18)] transition-transform duration-500 group-hover:rotate-12">
        <span className="h-3.5 w-3.5 rounded-full bg-cyan-200 shadow-[0_0_18px_rgba(103,232,249,0.95)]" />
      </span>
      <span className="text-[15px] font-black tracking-[0.28em] text-white">OUTSTAND</span>
    </Link>
  );
}

function CTA({ children, secondary = false }: { children: React.ReactNode; secondary?: boolean }) {
  return (
    <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }} transition={{ type: "spring", stiffness: 350, damping: 24 }}>
      <Button
        asChild
        size="lg"
        className={
          secondary
            ? "h-[52px] rounded-full border border-white/10 bg-white/[0.045] px-7 text-white backdrop-blur-xl hover:bg-white/[0.09] focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#02040b]"
            : "h-[52px] rounded-full bg-white px-8 text-[#05070d] shadow-[0_0_55px_rgba(125,240,255,0.28)] hover:bg-cyan-50 focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#02040b]"
        }
      >
        {children}
      </Button>
    </motion.div>
  );
}

function FeatureCard({ icon: Icon, title, text }: { icon: typeof Target; title: string; text: string }) {
  return (
    <motion.article
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.15 }}
      whileHover={{ y: -4 }}
      className="group rounded-[24px] border border-white/[0.08] bg-white/[0.035] p-5 backdrop-blur-xl transition-colors hover:border-cyan-300/20 hover:bg-white/[0.055] focus-within:border-cyan-300/20"
    >
      <div className="grid h-10 w-10 place-items-center rounded-xl border border-cyan-300/15 bg-cyan-300/10 text-cyan-200" aria-hidden="true">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-5 text-base font-bold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-400">{text}</p>
    </motion.article>
  );
}

function ProductPreview() {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.12 }}
      aria-label="Illustrative OUTSTAND dashboard preview"
      className="relative mt-14 overflow-hidden rounded-[30px] border border-white/10 bg-[#080c15]/95 shadow-[0_50px_140px_rgba(0,0,0,0.55)] backdrop-blur-2xl"
    >
      <div className="flex h-12 items-center gap-2 border-b border-white/[0.07] px-5">
        <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-white/15" />
        <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-white/15" />
        <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-white/15" />
        <span className="ml-3 text-[10px] font-medium tracking-[0.2em] text-slate-500">OUTSTAND / TODAY · EXAMPLE</span>
      </div>
      <div className="grid lg:grid-cols-[1.15fr_0.85fr]">
        <div className="p-6 sm:p-9">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-300">Today</p>
              <h3 className="mt-2 text-2xl font-black tracking-tight text-white">Know what to do next.</h3>
            </div>
            <div className="hidden rounded-2xl border border-cyan-300/15 bg-cyan-300/10 px-4 py-3 text-right sm:block">
              <div className="text-[9px] uppercase tracking-widest text-cyan-200/70">Example XP</div>
              <div className="mt-1 text-lg font-black text-cyan-100">+50 XP</div>
            </div>
          </div>
          <div className="mt-7 space-y-3">
            {["Roadmap · Chemical Reactions", "Focus · 25 minute session", "Habit · Review today's weak concept"].map((item, index) => (
              <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
                <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${index === 0 ? "bg-cyan-300 text-[#061018]" : "bg-white/[0.06] text-slate-400"}`} aria-hidden="true">
                  {index === 0 ? <Zap className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                </div>
                <span className="text-sm font-medium text-slate-200">{item}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="border-t border-white/[0.07] bg-white/[0.018] p-6 lg:border-l lg:border-t-0 lg:p-9">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-indigo-200">
            <BrainCircuit className="h-4 w-4" aria-hidden="true" /> AI guidance
          </div>
          <div className="mt-5 rounded-3xl border border-indigo-300/10 bg-indigo-400/[0.06] p-5">
            <p className="text-sm leading-6 text-slate-300">Example: your recent focus is consistent. Keep today's session short and targeted, then review the weak concept before moving on.</p>
          </div>
          <div className="mt-6 flex items-center justify-between text-xs text-slate-500">
            <span>Example roadmap progress</span>
            <span className="font-bold text-slate-300">34%</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/[0.06]" role="progressbar" aria-label="Example roadmap progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={34}><div className="h-full w-[34%] rounded-full bg-gradient-to-r from-cyan-300 to-indigo-400" /></div>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4"><Flame className="h-4 w-4 text-orange-300" aria-hidden="true" /><p className="mt-2 text-xs text-slate-500">Example streak</p><p className="mt-1 font-black text-white">7 days</p></div>
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4"><Bell className="h-4 w-4 text-cyan-300" aria-hidden="true" /><p className="mt-2 text-xs text-slate-500">Example alerts</p><p className="mt-1 font-black text-white">2 new</p></div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function LandingPage() {
  const reduceMotion = useReducedMotion();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });
  const heroY = useTransform(scrollYProgress, [0, 0.2], [0, reduceMotion ? 0 : -60]);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen]);

  const closeMobile = () => setMobileOpen(false);

  return (
    <div className="min-h-screen overflow-x-clip bg-[#02040b] font-sans text-white selection:bg-cyan-300/20">
      <a href="#main-content" className="sr-only z-[200] rounded-md bg-white px-4 py-2 text-black focus:not-sr-only focus:fixed focus:left-4 focus:top-4">Skip to content</a>
      <motion.div aria-hidden="true" style={{ scaleX: progress }} className="fixed inset-x-0 top-0 z-[100] h-[2px] origin-left bg-gradient-to-r from-cyan-300 via-sky-400 to-indigo-400" />
      {!reduceMotion && <CinematicScene />}

      <nav className="fixed left-1/2 top-4 z-50 w-[calc(100%-1.5rem)] max-w-6xl -translate-x-1/2 rounded-2xl border border-white/[0.09] bg-[#050810]/70 px-4 py-3 shadow-2xl backdrop-blur-2xl sm:px-6" aria-label="Main navigation">
        <div className="flex items-center justify-between">
          <Wordmark />
          <div className="hidden items-center gap-7 text-xs font-medium text-slate-400 md:flex">
            <a href="#features" className="rounded-md transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300">Features</a>
            <a href="#how-it-works" className="rounded-md transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300">How it works</a>
            <a href="#social" className="rounded-md transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300">Social</a>
            <a href="#cta" className="rounded-md transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300">Get started</a>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild className="hidden h-9 rounded-full bg-white/[0.08] px-5 text-xs font-bold text-white ring-1 ring-white/10 hover:bg-white hover:text-black sm:inline-flex"><Link to="/auth">Get started</Link></Button>
            <button type="button" onClick={() => setMobileOpen((v) => !v)} aria-expanded={mobileOpen} aria-controls="mobile-navigation" aria-label={mobileOpen ? "Close navigation" : "Open navigation"} className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 md:hidden">
              <ChevronDown className={`h-4 w-4 transition-transform ${mobileOpen ? "rotate-180" : ""}`} aria-hidden="true" />
            </button>
          </div>
        </div>
        {mobileOpen && (
          <div id="mobile-navigation" className="mt-3 grid gap-1 border-t border-white/[0.07] pt-3 md:hidden">
            {["features", "how-it-works", "social", "cta"].map((id) => <a key={id} href={`#${id}`} onClick={closeMobile} className="rounded-xl px-3 py-3 text-sm font-semibold capitalize text-slate-300 hover:bg-white/[0.05] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300">{id.replace(/-/g, " ")}</a>)}
            <Button asChild className="mt-1 h-10 rounded-xl bg-white text-xs font-black text-black"><Link to="/auth">Get started</Link></Button>
          </div>
        )}
      </nav>

      <main id="main-content" tabIndex={-1}>
        <section className="relative flex min-h-screen items-center px-5 pb-20 pt-32 sm:px-8" aria-labelledby="hero-heading">
          <motion.div style={{ y: heroY }} className="mx-auto w-full max-w-6xl text-center">
            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="mx-auto mb-7 inline-flex items-center gap-2 rounded-full border border-cyan-200/15 bg-cyan-300/[0.06] px-4 py-2 text-[10px] font-bold uppercase tracking-[0.22em] text-cyan-200/90 backdrop-blur-xl"><Sparkles className="h-3.5 w-3.5" aria-hidden="true" /> One system for your next level</motion.div>
            <motion.h1 id="hero-heading" initial="hidden" animate="visible" className="mx-auto max-w-5xl text-[clamp(3.4rem,8.5vw,8.4rem)] font-black leading-[0.88] tracking-[-0.07em]">
              <motion.span variants={fadeUp} className="block">Your goals.</motion.span>
              <motion.span variants={fadeUp} className="block bg-gradient-to-r from-white via-cyan-100 to-cyan-300 bg-clip-text text-transparent">Your system.</motion.span>
              <motion.span variants={fadeUp} className="mt-3 block text-white/35">Your momentum.</motion.span>
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.65 }} className="mx-auto mt-8 max-w-3xl text-base leading-7 text-slate-300 sm:text-lg">
              OUTSTAND combines <strong className="font-semibold text-white">AI guidance, personalized roadmaps, focus, habits, XP, streaks, friends, chat and notifications</strong> into one place built to help you actually follow through.
            </motion.p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <CTA><Link to="/auth" className="flex items-center gap-2">Build my system <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link></CTA>
              <CTA secondary><a href="#features" className="flex items-center gap-2"><CirclePlay className="h-4 w-4" aria-hidden="true" /> Explore everything</a></CTA>
            </div>
            <div className="mx-auto mt-9 grid max-w-2xl grid-cols-2 gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500 sm:grid-cols-4" aria-label="Key capabilities">
              {["AI-powered", "Goal → roadmap", "Focus → XP", "Friends + chat"].map((item) => <span key={item} className="rounded-full border border-white/[0.07] bg-white/[0.025] px-3 py-2">{item}</span>)}
            </div>
          </motion.div>
        </section>

        <section id="how-it-works" className="relative px-5 py-24 sm:px-8 sm:py-32" aria-labelledby="loop-heading">
          <div className="mx-auto max-w-6xl">
            <div className="max-w-3xl">
              <div className="mb-4 text-[10px] font-bold uppercase tracking-[0.25em] text-cyan-300/70">The core loop</div>
              <h2 id="loop-heading" className="text-4xl font-black tracking-[-0.05em] sm:text-6xl">From “I should” to “I did.”</h2>
              <p className="mt-5 text-base leading-7 text-slate-400">OUTSTAND connects planning and execution. You don't just collect productivity tools — each part feeds the next action.</p>
            </div>
            <div className="mt-12 grid gap-4 md:grid-cols-4">
              {[["01", "Tell the AI", "Give the assistant your goal, constraints and current situation."], ["02", "Get your roadmap", "Turn the goal into milestones, tasks and a clear next step."], ["03", "Do the work", "Use focus sessions, habits and daily actions to execute."], ["04", "See momentum", "XP, streaks, activity and AI feedback show what to improve next."]].map(([number, title, text]) => (
                <motion.article key={number} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} className="rounded-[24px] border border-white/[0.08] bg-white/[0.03] p-6">
                  <span className="text-[10px] font-black tracking-[0.2em] text-cyan-300">{number}</span>
                  <h3 className="mt-5 text-lg font-bold text-white">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{text}</p>
                </motion.article>
              ))}
            </div>
            <ProductPreview />
          </div>
        </section>

        <section id="features" className="border-y border-white/[0.06] bg-white/[0.018] px-5 py-24 sm:px-8 sm:py-32" aria-labelledby="features-heading">
          <div className="mx-auto max-w-6xl">
            <div className="max-w-3xl">
              <div className="mb-4 text-[10px] font-bold uppercase tracking-[0.25em] text-cyan-300/70">Everything in OUTSTAND</div>
              <h2 id="features-heading" className="text-4xl font-black tracking-[-0.05em] sm:text-6xl">More than a to-do list.</h2>
              <p className="mt-5 text-base leading-7 text-slate-400">Every major part of the app has a job. Together they create one connected system for planning, action, progress and people.</p>
            </div>
            <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {productFeatures.map((feature) => <FeatureCard key={feature.title} {...feature} />)}
            </div>
          </div>
        </section>

        <section id="intelligence" className="px-5 py-24 sm:px-8 sm:py-32" aria-labelledby="ai-heading">
          <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[0.85fr_1.15fr]">
            <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
              <div className="mb-4 text-[10px] font-bold uppercase tracking-[0.25em] text-cyan-300/70">The intelligence layer</div>
              <h2 id="ai-heading" className="text-4xl font-black tracking-[-0.05em] sm:text-6xl">AI that knows the system around you.</h2>
              <p className="mt-5 text-base leading-7 text-slate-400">The goal isn't to put a generic chatbot beside your productivity tools. OUTSTAND is designed so the assistant can use your roadmap, tasks, focus history and progress to give more useful guidance.</p>
              <div className="mt-7 space-y-3">
                {["Ask what to work on next", "Get help with your current roadmap", "Turn setbacks into a revised plan", "Use your real progress as context"].map((item) => <div key={item} className="flex items-center gap-3 text-sm font-semibold text-slate-200"><ShieldCheck className="h-4 w-4 shrink-0 text-cyan-300" aria-hidden="true" />{item}</div>)}
              </div>
            </motion.div>
            <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="rounded-[30px] border border-white/10 bg-white/[0.035] p-5 shadow-2xl backdrop-blur-xl sm:p-7">
              <div className="flex items-center gap-3 border-b border-white/[0.07] pb-5"><div className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-400/10 text-indigo-200"><BrainCircuit className="h-4 w-4" aria-hidden="true" /></div><div><p className="text-sm font-bold text-white">OUTSTAND AI</p><p className="text-[10px] text-slate-500">Illustrative context-aware guidance</p></div></div>
              <div className="mt-5 space-y-4 text-sm leading-6">
                <div className="ml-auto max-w-[82%] rounded-2xl rounded-br-md border border-white/[0.07] bg-white/[0.04] p-4 text-slate-300">I only have 30 minutes today. What should I do?</div>
                <div className="max-w-[88%] rounded-2xl rounded-bl-md border border-cyan-300/10 bg-cyan-300/[0.05] p-4 text-slate-300">Based on your roadmap and recent focus sessions, use 25 minutes for your highest-priority task. Finish with a 5-minute review so tomorrow starts with a clear next step.</div>
              </div>
            </motion.div>
          </div>
        </section>

        <section id="social" className="border-y border-white/[0.06] bg-white/[0.018] px-5 py-24 sm:px-8 sm:py-32" aria-labelledby="social-heading">
          <div className="mx-auto max-w-6xl">
            <div className="max-w-3xl">
              <div className="mb-4 text-[10px] font-bold uppercase tracking-[0.25em] text-cyan-300/70">Don't grow alone</div>
              <h2 id="social-heading" className="text-4xl font-black tracking-[-0.05em] sm:text-6xl">Your progress has a social side.</h2>
              <p className="mt-5 text-base leading-7 text-slate-400">Find people, view profiles, connect with friends, respond to requests and keep conversations in one place — without turning the whole app into a noisy social feed.</p>
            </div>
            <div className="mt-10 grid gap-3 md:grid-cols-3">
              {[{ icon: Search, title: "Find people", text: "Search by name or UID and open a user's profile." }, { icon: Users, title: "Build your circle", text: "Send, receive, accept and decline friend requests." }, { icon: MessageCircle, title: "Stay connected", text: "Message your friends when you want to talk." }].map(({ icon: Icon, title, text }) => <FeatureCard key={title} icon={Icon} title={title} text={text} />)}
            </div>
          </div>
        </section>

        <section id="momentum" className="px-5 py-24 sm:px-8 sm:py-32" aria-labelledby="momentum-heading">
          <div className="mx-auto max-w-6xl rounded-[32px] border border-cyan-300/10 bg-gradient-to-br from-cyan-300/[0.07] via-white/[0.025] to-indigo-400/[0.07] p-7 sm:p-10 lg:p-14">
            <div className="grid gap-10 lg:grid-cols-[1fr_0.8fr] lg:items-center">
              <div>
                <div className="mb-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-cyan-300"><Zap className="h-3.5 w-3.5" aria-hidden="true" /> Momentum engine</div>
                <h2 id="momentum-heading" className="text-4xl font-black tracking-[-0.05em] sm:text-5xl">Small actions become visible progress.</h2>
                <p className="mt-5 max-w-2xl text-base leading-7 text-slate-400">Focus earns XP. Habits build consistency. Streaks make momentum visible. Roadmaps show direction. Notifications keep important actions from being forgotten.</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[{ icon: Zap, label: "Focus", value: "2 XP / min" }, { icon: Flame, label: "Streaks", value: "Keep going" }, { icon: Trophy, label: "Levels", value: "Track growth" }, { icon: Bell, label: "Alerts", value: "Stay on time" }].map(({ icon: Icon, label, value }) => <div key={label} className="rounded-2xl border border-white/[0.08] bg-black/20 p-5"><Icon className="h-4 w-4 text-cyan-300" aria-hidden="true" /><p className="mt-4 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-600">{label}</p><p className="mt-1 text-sm font-black text-white">{value}</p></div>)}
              </div>
            </div>
          </div>
        </section>

        <section id="cta" className="relative px-5 pb-24 pt-10 sm:px-8 sm:pb-36" aria-labelledby="cta-heading">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-200" aria-hidden="true"><Sparkles className="h-5 w-5" /></div>
            <h2 id="cta-heading" className="mt-7 text-4xl font-black tracking-[-0.05em] sm:text-6xl">Stop collecting plans.<br /><span className="text-white/35">Start building momentum.</span></h2>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-400">Bring your goals, daily actions, focus sessions, progress and people into one system.</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3"><CTA><Link to="/auth" className="flex items-center gap-2">Create my OUTSTAND system <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link></CTA></div>
            <p className="mt-4 text-[11px] text-slate-600">AI • Roadmaps • Focus • Habits • XP • Streaks • Friends • Chat • Notifications</p>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/[0.06] px-5 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
          <Wordmark />
          <p className="text-xs text-slate-600">A connected system for turning intentions into action.</p>
        </div>
      </footer>
    </div>
  );
}
