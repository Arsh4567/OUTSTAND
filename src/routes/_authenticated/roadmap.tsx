import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Brain, Dumbbell, Gauge, GraduationCap, ShieldCheck, Sparkles } from "lucide-react";
import { RoadmapCinematic } from "@/components/roadmap/RoadmapCinematic";

export const Route = createFileRoute("/_authenticated/roadmap")({ component: RoadmapPage });

const pillars = [
  { icon: Gauge, label: "Energy", text: "Build routines around sleep, movement, recovery and sustainable daily energy." },
  { icon: GraduationCap, label: "Performance", text: "Turn evidence-based learning science into clear actions that improve study quality." },
  { icon: Dumbbell, label: "Physical", text: "Develop strength, mobility, fitness and confidence without extreme or reckless routines." },
  { icon: Brain, label: "Mind", text: "Train focus, emotional regulation, consistency and the ability to restart after a bad day." },
];

function RoadmapPage() {
  const scrollToMasterpiece = () => document.getElementById("roadmap-masterpiece")?.scrollIntoView({ behavior: "smooth" });

  return (
    <div className="min-h-screen bg-[#05070d] text-slate-100">
      <RoadmapCinematic onEnter={scrollToMasterpiece} />

      <main id="roadmap-masterpiece" className="relative overflow-hidden px-5 py-24 sm:px-8 sm:py-32">
        <div className="pointer-events-none absolute left-1/2 top-0 h-[34rem] w-[55rem] -translate-x-1/2 rounded-full bg-cyan-500/[0.045] blur-[130px]" />
        <div className="relative mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/10 bg-cyan-300/[0.045] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.24em] text-cyan-200/80"><Sparkles className="h-3.5 w-3.5" /> The Masterpiece</div>
            <h2 className="mt-6 text-4xl font-black tracking-[-0.04em] text-white sm:text-6xl">A roadmap that earns the name.</h2>
            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-400">Not a pile of generic habits. Outstand is being built around high-quality evidence, practical behavior design and an assistant that tells you exactly what to do next — without turning your life into a checklist.</p>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {pillars.map((pillar, index) => (
              <motion.article key={pillar.label} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.25 }} transition={{ delay: index * 0.06, duration: 0.5 }} className="rounded-[26px] border border-white/[0.07] bg-white/[0.03] p-5 backdrop-blur-xl">
                <div className="grid h-11 w-11 place-items-center rounded-2xl border border-cyan-300/10 bg-cyan-300/[0.06] text-cyan-200"><pillar.icon className="h-5 w-5" /></div>
                <h3 className="mt-5 text-lg font-black text-white">{pillar.label}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">{pillar.text}</p>
              </motion.article>
            ))}
          </div>

          <div className="mt-8 rounded-[30px] border border-white/[0.07] bg-white/[0.025] p-6 sm:p-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-4"><div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-emerald-300/10 bg-emerald-300/[0.05] text-emerald-200"><ShieldCheck className="h-5 w-5" /></div><div><p className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-300/70">Design principle</p><h3 className="mt-1 text-lg font-black text-white">Evidence first. Human second. Interface third.</h3><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Every recommendation should have a reason, a realistic dose, a clear next action and a way to adapt when real life gets messy.</p></div></div>
              <span className="shrink-0 rounded-full border border-white/8 bg-black/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.16em] text-slate-600">Building the engine</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
