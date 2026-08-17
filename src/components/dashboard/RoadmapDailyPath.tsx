import { motion } from "framer-motion";
import { Check, ChevronRight, ListChecks, Sparkles, Zap } from "lucide-react";
import type { DashboardMission } from "@/hooks/useDashboard";

const ease = [0.22, 1, 0.36, 1] as const;
const panel = "rounded-[28px] border border-white/[0.08] bg-white/[0.035] shadow-[0_24px_80px_-56px_rgba(34,211,238,.45)] backdrop-blur-xl";

export function RoadmapDailyPath({ missions, nextMission, onCompleteMission }: {
  missions: DashboardMission[];
  nextMission?: DashboardMission;
  onCompleteMission: (id: string) => void;
}) {
  const completed = missions.filter((mission) => mission.completed).length;
  const remaining = missions.length - completed;
  const visibleMissions = missions.slice(0, 6);

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease }}
      className={`${panel} relative overflow-hidden p-5 sm:p-6`}
    >
      <div className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full bg-cyan-400/[0.055] blur-3xl" />

      <div className="relative flex items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-cyan-300">
            <span className="grid h-7 w-7 place-items-center rounded-lg border border-cyan-300/15 bg-cyan-300/[0.07]">
              <ListChecks className="h-3.5 w-3.5" />
            </span>
            Today's roadmap
          </div>
          <h2 className="mt-3 text-xl font-black tracking-tight text-white">Your daily path</h2>
          <p className="mt-1 text-sm text-slate-500">Real actions from your active AI roadmap.</p>
        </div>
        <div className="shrink-0 rounded-2xl border border-white/[0.07] bg-black/10 px-3 py-2 text-right">
          <p className="text-lg font-black text-white">{completed}/{missions.length}</p>
          <p className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-600">complete</p>
        </div>
      </div>

      {missions.length === 0 ? (
        <div className="relative mt-5 rounded-2xl border border-dashed border-cyan-300/15 bg-cyan-300/[0.025] p-5">
          <div className="grid h-10 w-10 place-items-center rounded-xl border border-cyan-300/15 bg-cyan-300/[0.06] text-cyan-200">
            <Sparkles className="h-4 w-4" />
          </div>
          <h3 className="mt-4 text-base font-black text-white">Your path is being prepared.</h3>
          <p className="mt-2 text-sm leading-6 text-slate-500">Create or activate an AI roadmap and its actions will appear here automatically.</p>
        </div>
      ) : (
        <>
          <div className="relative mt-5 space-y-2">
            {visibleMissions.map((mission, index) => (
              <motion.div
                key={mission.id}
                layout
                className={`group flex items-center gap-3 rounded-2xl border p-3 transition ${mission.completed ? "border-emerald-300/10 bg-emerald-300/[0.025]" : "border-white/[0.07] bg-black/10 hover:border-cyan-300/15 hover:bg-white/[0.025]"}`}
              >
                <button
                  type="button"
                  onClick={() => onCompleteMission(mission.id)}
                  disabled={mission.completed || mission.mutating}
                  aria-label={mission.completed ? `${mission.title} completed` : `Complete ${mission.title}`}
                  className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl border transition ${mission.completed ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-300" : "border-white/10 text-slate-600 hover:border-cyan-300/20 hover:text-cyan-300"}`}
                >
                  {mission.completed ? <Check className="h-4 w-4" /> : <span className="text-[10px] font-black">{index + 1}</span>}
                </button>

                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-bold ${mission.completed ? "text-slate-500 line-through" : "text-white"}`}>{mission.title}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-[9px] font-black uppercase tracking-[0.15em] text-slate-600">
                    <span>{mission.category}</span>
                    <span>·</span>
                    <span>{mission.difficulty}</span>
                    <span>·</span>
                    <span className="text-cyan-300/70">+{mission.xpReward} XP</span>
                  </div>
                </div>

                {mission.mutating ? (
                  <span className="shrink-0 text-[9px] font-bold text-cyan-300">Saving</span>
                ) : !mission.completed ? (
                  <ChevronRight className="h-4 w-4 shrink-0 text-slate-700 transition group-hover:text-cyan-300" />
                ) : null}
              </motion.div>
            ))}
          </div>

          <div className="relative mt-5 grid gap-2 sm:grid-cols-2">
            <div className="rounded-2xl border border-violet-300/10 bg-violet-300/[0.035] p-4">
              <div className="flex items-start gap-3">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-violet-300/15 bg-violet-300/[0.07] text-violet-200">
                  <Zap className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.16em] text-violet-200/70">Next move</p>
                  <p className="mt-1 text-xs font-bold leading-5 text-white">{nextMission?.title || "You cleared today's path."}</p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-white/[0.07] bg-black/10 p-4">
              <p className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-600">Daily workload</p>
              <p className="mt-1 text-xs font-bold text-slate-300">{remaining === 0 ? "Everything planned for today is complete." : `${remaining} mission${remaining === 1 ? "" : "s"} remaining today.`}</p>
            </div>
          </div>

          {missions.length > visibleMissions.length && (
            <p className="relative mt-4 text-center text-[9px] font-black uppercase tracking-[0.16em] text-slate-600">Showing the first {visibleMissions.length} of {missions.length} missions</p>
          )}
        </>
      )}
    </motion.section>
  );
}
