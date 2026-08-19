import React, { useEffect, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { motion, AnimatePresence, MotionConfig } from "framer-motion";
import { Menu, X, Home, Timer, Zap, Brain, Sparkles, ChevronRight, Map, Settings, Trophy } from "lucide-react";
import { useAuth, displayNameOf } from "@/hooks/use-auth";
import { useAppState } from "@/hooks/use-app-state";
import { levelFromXP } from "@/lib/habits";
import { cn } from "@/lib/utils";
import { AppSettingsSheet } from "@/components/app-settings-sheet";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: Home },
  { to: "/roadmap", label: "Roadmap", icon: Map },
  { to: "/outstand", label: "Outstand", icon: Zap },
  { to: "/focus", label: "Focus", icon: Timer },
  { to: "/dopamine", label: "Dopamine", icon: Brain },
] as const;

const customEase = [0.22, 1, 0.36, 1] as const;

export default function SidebarLayout({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user, profile } = useAuth();
  const { xp } = useAppState();
  const safeXp = xp || 0;
  const { level, progressPct } = levelFromXP(safeXp);
  const safeName = displayNameOf(user, profile) || "Student";
  const initial = safeName.trim().charAt(0).toUpperCase() || "S";

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  useEffect(() => { setIsOpen(false); }, [pathname]);

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen bg-[#050508] font-sans text-slate-100 selection:bg-cyan-400/20 selection:text-cyan-100">
        <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#030508]/80 backdrop-blur-2xl">
          <div className="mx-auto flex h-[72px] w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setIsOpen(true)} aria-label="Open navigation" aria-expanded={isOpen} className="grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-white/[0.04] text-slate-300 transition hover:border-cyan-400/20 hover:bg-white/[0.07] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70">
                <Menu className="h-5 w-5" />
              </button>
              <Link to="/dashboard" className="hidden items-center gap-3 sm:flex" aria-label="Go to dashboard">
                <div className="grid h-9 w-9 place-items-center rounded-xl border border-cyan-300/20 bg-gradient-to-br from-cyan-400/20 via-blue-500/20 to-fuchsia-500/20"><Sparkles className="h-4 w-4 text-cyan-200" /></div>
                <div className="leading-none"><div className="text-[11px] font-black uppercase tracking-[0.34em] text-slate-500">Outstand</div><div className="mt-1 text-[10px] font-semibold tracking-[0.16em] text-slate-400">PERSONAL OS</div></div>
              </Link>
            </div>

            <div className="flex items-center gap-2">
              <Link to="/league" aria-label="Open leaderboard" className="group hidden min-w-[190px] items-center gap-3 rounded-2xl border border-cyan-300/15 bg-white/[0.035] px-3 py-2 text-left transition hover:border-cyan-300/30 hover:bg-cyan-300/[0.06] md:flex">
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl border border-amber-300/15 bg-amber-300/[0.06] text-amber-200"><Trophy className="h-4 w-4" /></div>
                <div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><span className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-500">Level {level}</span><span className="text-[10px] font-black text-cyan-200">{safeXp.toLocaleString()} XP</span></div><div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/[0.06]"><motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, Math.max(0, progressPct))}%` }} transition={{ duration: 0.7, ease: "easeOut" }} className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-blue-400 to-violet-400" /></div><div className="mt-1 text-[8px] font-bold uppercase tracking-[0.12em] text-slate-600">Tap XP to view leaderboard</div></div>
              </Link>
              <Link to="/profile" className="group flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.035] px-2.5 py-1.5 transition hover:border-cyan-300/20 hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70" aria-label="Open profile">
                <div className="relative h-9 w-9 overflow-hidden rounded-xl border border-cyan-300/20 bg-cyan-950/40">{profile?.avatar_url ? <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" /> : <div className="grid h-full w-full place-items-center text-xs font-black text-cyan-200">{initial}</div>}<span className="absolute bottom-0.5 right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#030508] bg-emerald-400" /></div>
                <div className="hidden text-right md:block"><div className="max-w-32 truncate text-xs font-bold text-white">{safeName}</div><div className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">Level {level}</div></div>
              </Link>
            </div>
          </div>
        </header>

        <main className="relative mx-auto w-full max-w-7xl flex-1"><div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-cyan-950/[0.06] via-transparent to-fuchsia-950/[0.04]" /><div className="relative z-10">{children}</div></main>

        <AnimatePresence>
          {isOpen && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsOpen(false)} className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md" />
              <motion.aside initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ ease: customEase, duration: 0.42 }} className="fixed inset-y-0 left-0 z-[60] flex w-[86vw] max-w-[360px] flex-col overflow-hidden border-r border-white/10 bg-[#060911]/95 shadow-[30px_0_80px_rgba(0,0,0,0.55)] backdrop-blur-2xl" aria-label="Primary navigation">
                <div className="relative z-10 flex items-center justify-between border-b border-white/7 px-5 py-4"><div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-2xl border border-cyan-300/20 bg-cyan-400/10"><Sparkles className="h-4 w-4 text-cyan-200" /></div><div><div className="text-xs font-black uppercase tracking-[0.28em] text-white">Outstand</div><div className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.18em] text-slate-500">Command menu</div></div></div><button type="button" onClick={() => setIsOpen(false)} aria-label="Close navigation" className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-400"><X className="h-5 w-5" /></button></div>
                <div className="relative z-10 mx-4 mt-4 flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.035] p-3"><div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-2xl border border-cyan-300/20 bg-cyan-950/50">{profile?.avatar_url ? <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" /> : <div className="grid h-full w-full place-items-center text-sm font-black text-cyan-200">{initial}</div>}</div><div className="min-w-0 flex-1"><div className="truncate text-sm font-black text-white">{safeName}</div><div className="mt-1 text-[9px] font-black uppercase tracking-[0.16em] text-cyan-200">Level {level}</div></div></div>
                <nav className="relative z-10 flex-1 overflow-y-auto px-4 py-6" aria-label="Main navigation"><div className="mb-3 px-3 text-[10px] font-black uppercase tracking-[0.24em] text-slate-600">Workspace</div><div className="space-y-1.5">{NAV_ITEMS.map((item, index) => { const active = pathname === item.to || (item.to !== "/dashboard" && pathname.startsWith(item.to)); return <motion.div key={item.to} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.035, duration: 0.25 }}><Link to={item.to} className={cn("group relative flex items-center gap-3 rounded-2xl border px-3 py-3 transition", active ? "border-cyan-300/15 bg-cyan-400/[0.08] text-white" : "border-transparent text-slate-400 hover:border-white/8 hover:bg-white/[0.045] hover:text-white")}><div className={cn("grid h-10 w-10 place-items-center rounded-xl border", active ? "border-cyan-300/15 bg-cyan-300/10 text-cyan-200" : "border-white/7 bg-white/[0.025] text-slate-500 group-hover:text-slate-200")}><item.icon className="h-[18px] w-[18px]" /></div><div className="min-w-0 flex-1"><div className="text-sm font-bold">{item.label}</div><div className="mt-0.5 text-[10px] text-slate-600">{active ? "Currently active" : "Open section"}</div></div><ChevronRight className="h-4 w-4 text-slate-700" /></Link></motion.div>; })}</div></nav>
                <div className="relative z-10 flex items-center justify-between border-t border-white/7 bg-[#060911]/80 p-4 backdrop-blur-xl"><span className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-700">Settings</span><button type="button" onClick={() => { setIsOpen(false); setIsSettingsOpen(true); }} aria-label="Open settings" className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-slate-500 transition hover:border-cyan-300/20 hover:bg-cyan-300/[0.08] hover:text-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70"><Settings className="h-4 w-4" /></button></div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>
        <AppSettingsSheet isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} onNavigateProfile={() => window.location.assign("/profile")} />
      </div>
    </MotionConfig>
  );
}
