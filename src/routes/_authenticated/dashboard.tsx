import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion, MotionConfig } from "framer-motion";
import { Loader2, RefreshCw } from "lucide-react";
import { useDashboard } from "@/hooks/useDashboard";
import { useAuth, displayNameOf } from "@/hooks/use-auth";
import { DashboardHero, DashboardStats, DashboardProgress, DashboardMissions, DashboardNextMission } from "@/components/dashboard/DashboardSections";

export const Route = createFileRoute("/_authenticated/dashboard")({ component: DashboardPage });

function DashboardPage() {
  const navigate = useNavigate();
  const { snapshot, isLoading, loadError, completeMission } = useDashboard();
  const { user, profile } = useAuth();

  if (isLoading) return <div className="grid min-h-screen place-items-center bg-[#050816] text-white"><div className="flex flex-col items-center gap-4"><div className="grid h-14 w-14 place-items-center rounded-2xl border border-white/10 bg-white/5"><Loader2 className="h-6 w-6 animate-spin text-cyan-300" /></div><p className="text-[10px] font-bold uppercase tracking-[0.28em] text-slate-500">Preparing your dashboard</p></div></div>;
  if (loadError) return <div className="grid min-h-screen place-items-center bg-[#050816] px-4 text-white"><div className="max-w-md rounded-3xl border border-red-400/15 bg-white/[0.04] p-7 text-center backdrop-blur-xl"><p className="text-xs font-bold uppercase tracking-[0.2em] text-red-300">Dashboard unavailable</p><p className="mt-3 text-sm leading-6 text-slate-300">{loadError}</p><button type="button" onClick={() => window.location.reload()} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-slate-950"><RefreshCw className="h-4 w-4" /> Reload</button></div></div>;

  const nextMission = snapshot.missions.find((mission) => !mission.completed);
  const name = displayNameOf(user, profile);
  return <MotionConfig reducedMotion="user">
    <div className="relative min-h-screen overflow-x-hidden bg-[#050816] text-slate-100">
      <div className="pointer-events-none fixed inset-0 overflow-hidden"><div className="absolute left-1/2 top-[-22%] h-[50rem] w-[50rem] -translate-x-1/2 rounded-full bg-cyan-500/[0.045] blur-[120px]" /><div className="absolute right-[-12%] top-[20%] h-[28rem] w-[28rem] rounded-full bg-fuchsia-500/[0.04] blur-[110px]" /><div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.016)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.016)_1px,transparent_1px)] bg-[size:42px_42px] [mask-image:linear-gradient(to_bottom,black,transparent_82%)]" /></div>
      <main className="relative z-10 mx-auto max-w-7xl space-y-4 px-4 pb-16 pt-5 sm:px-6 lg:px-8 lg:pt-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .55 }} className="flex items-center justify-between gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-3"><div><p className="text-[9px] font-black uppercase tracking-[.28em] text-slate-600">Welcome back</p><p className="mt-1 text-lg font-black tracking-tight text-white sm:text-xl">{name}</p></div><button type="button" onClick={() => navigate({ to: "/outstand" })} className="rounded-xl border border-cyan-300/15 bg-cyan-300/[0.06] px-3 py-2 text-[10px] font-black uppercase tracking-[.18em] text-cyan-200 transition hover:bg-cyan-300/[0.1]">Open Focus</button></motion.div>
        <DashboardHero snapshot={snapshot} />
        <DashboardStats snapshot={snapshot} />
        <DashboardProgress snapshot={snapshot} />
        <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]"><DashboardMissions snapshot={snapshot} onComplete={completeMission} onFocus={() => navigate({ to: "/outstand" })} /><DashboardNextMission mission={nextMission} /></section>
      </main>
    </div>
  </MotionConfig>;
}
