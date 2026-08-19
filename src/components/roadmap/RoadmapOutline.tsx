import { motion } from "framer-motion";
import { Lock } from "lucide-react";
import { ROADMAP_MODULES } from "@/lib/roadmap";

/**
 * Placeholder outline for the roadmap curriculum. Content architecture only —
 * each module will later hold specific, evidence-informed steps.
 */
export function RoadmapOutline({ revealed }: { revealed: boolean }) {
  return (
    <section
      aria-label="Roadmap modules"
      className="relative border-t border-white/5 px-4 py-16 sm:px-8 sm:py-24"
    >
      <div className="mx-auto max-w-3xl">
        <div className="mb-10 space-y-3 text-center">
          <div className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">
            The path
          </div>
          <h2 className="font-display text-2xl font-black tracking-tight text-white sm:text-3xl">
            Nine areas. One direction.
          </h2>
          <p className="mx-auto max-w-md text-sm leading-relaxed text-slate-400">
            Each module will hold short, specific steps — not generic advice.
          </p>
        </div>

        <ul className="grid gap-3 sm:grid-cols-2">
          {ROADMAP_MODULES.map((m, i) => (
            <motion.li
              key={m.id}
              initial={{ opacity: 0, y: 12 }}
              animate={revealed ? { opacity: 1, y: 0 } : { opacity: 0.35, y: 0 }}
              transition={{ duration: 0.6, delay: revealed ? i * 0.05 : 0, ease: [0.16, 1, 0.3, 1] }}
              className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-sm"
            >
              <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-slate-900/80 font-mono text-xs font-bold text-sky-300">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-bold text-white">{m.title}</span>
                <span className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
                  <Lock className="h-3 w-3" aria-hidden />
                  {m.tagline}
                </span>
              </span>
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  );
}
