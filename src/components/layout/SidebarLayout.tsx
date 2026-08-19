import React, { useEffect, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { motion, AnimatePresence, MotionConfig } from "framer-motion";
import { Menu, X, Home, Trophy, ShieldAlert, Timer, Zap, Brain, BookOpen, Sparkles, ChevronRight, Bot } from "lucide-react";
import { useAuth, displayNameOf } from "@/hooks/use-auth";
import { useAppState } from "@/hooks/use-app-state";
import { levelFromXP } from "@/lib/habits";
import { cn } from "@/lib/utils";
import { AppSettingsSheet } from "@/components/app-settings-sheet";
import { ChatAssistant } from "@/components/chat-assistant";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: Home },
  { to: "/study", label: "Study Hub", icon: BookOpen },
  { to: "/focus", label: "Focus", icon: Timer },
  { to: "/dopamine", label: "Dopamine", icon: Brain },
  { to: "/outstand", label: "Outstand", icon: Zap },
  { to: "/intelligence", label: "Intelligence", icon: Bot, action: "ai" as const },
  { to: "/league", label: "Leaderboard", icon: Trophy },
] as const;

const customEase = [0.22, 1, 0.36, 1] as const;

export default function SidebarLayout({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user, profile } = useAuth();
  const { xp } = useAppState();
  const safeXp = xp || 0;
  const { level } = levelFromXP(safeXp);
  const safeName = displayNameOf(user, profile) || "Student";
  const initial = safeName.trim().charAt(0).toUpperCase() || "S";

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  useEffect(() => { setIsOpen(false); }, [pathname]);

  const openAssistant = () => { setIsOpen(false); setAiOpen(true); };

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen bg-[#050508] font-sans text-slate-100 selection:bg-cyan-400/20 selection:text-cyan-100">
        <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#030508]/75 backdrop-blur-2xl supports-[backdrop-filter]:bg-[#030508]/60">
          <div className="mx-auto flex h-[72px] w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <motion.button type="button" whileTap={{ scale: 0.94 }} whileHover={{ scale: 1.03 }} onClick={() => setIsOpen(true)} aria-label="Open navigation" aria-expanded={isOpen} className="group grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-white/[0.04] text-slate-300 shadow-lg shadow-black/10 transition hover:border-cyan-400/20 hover:bg-white/[0.07] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70">
                <Menu className="h-5 w-5 transition-transform duration-300 group-hover:scale-105" />
              </motion.button>
              <Link to="/dashboard" className="group hidden items-center gap-3 sm:flex" aria-label="Go to dashboard">
                <div className="relative grid h-9 w-9 place-items-center overflow-hidden rounded-xl border border-cyan-300/20 bg-gradient-to-br from-cyan-400/20 via-blue-500/20 to-fuchsia-500/20 shadow-[0_0_24px_rgba(34,211,238,0.12)]"><Sparkles className="relative z-10 h-4 w-4 text-cyan-200 transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110" /><div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-70" /></div>
                <div className="leading-none"><div className="text-[11px] font-black uppercase tracking-[0.34em] text-slate-500">Outstand</div><div className="mt-1 text-[10px] font-semibold tracking-[0.16em] text-slate-400">PERSONAL OS</div></div>
              </Link>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={openAssistant} aria-label="Open Outstand Intelligence" className="hidden items-center gap-2 rounded-2xl border border-cyan-300/20 bg-cyan-400/[0.06] px-3 py-2 text-xs font-bold text-cyan-100 shadow-[0_0_22px_rgba(34,211,238,0.12)] transition hover:border-cyan-300/35 hover:bg-cyan-400/[0.10] md:flex focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70"><Bot className="h-4 w-4 text-cyan-300" /> Intelligence</button>
              <Link to="/profile" className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.035] px-2.5 py-1.5 transition hover:border-cyan-300/20 hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70" aria-label="Open profile">
                <div className="relative h-9 w-9 overflow-hidden rounded-xl border border-cyan-300/20 bg-cyan-950/40">{profile?.avatar_url ? <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" /> : <div className="grid h-full w-full place-items-center text-xs font-black text-cyan-200">{initial}</div>}<span className="absolute bottom-0.5 right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#030508] bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" /></div>
                <div className="hidden text-right md:block"><div className="max-w-32 truncate text-xs font-bold text-white">{safeName}</div><div className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">Level {level}</div></div>
              </Link>
            </div>
          </div>
        </header>

        <main className="relative mx-auto w-full max-w-7xl flex-1"><div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-cyan-950/[0.06] via-transparent to-fuchsia-950/[0.04]" /><div className="relative z-10">{children}</div></main>

        <AnimatePresence>
          {isOpen && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} onClick={() => setIsOpen(false)} className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md" />
              <motion.aside initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ ease: customEase, duration: 0.48 }} className="fixed inset-y-0 left-0 z-[60] flex w-[86vw] max-w-[360px] flex-col overflow-hidden border-r border-white/10 bg-[#060911]/95 shadow-[30px_0_80px_rgba(0,0,0,0.55)] backdrop-blur-2xl sm:max-w-[390px]" aria-label="Primary navigation">
                <div className="pointer-events-none absolute inset-0 opacity-60"><div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" /><div className="absolute -bottom-24 -right-20 h-72 w-72 rounded-full bg-fuchsia-500/10 blur-3xl" /><div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.018)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.018)_1px,transparent_1px)] bg-[size:28px_28px]" /></div>
                <div className="relative z-10 flex items-center justify-between border-b border-white/7 px-5 py-4"><div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-2xl border border-cyan-300/20 bg-cyan-400/10 shadow-[0_0_20px_rgba(34,211,238,0.12)]"><Sparkles className="h-4 w-4 text-cyan-200" /></div><div><div className="text-xs font-black uppercase tracking-[0.28em] text-white">Outstand</div><div className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.18em] text-slate-500">Command menu</div></div></div><button type="button" onClick={() => setIsOpen(false)} aria-label="Close navigation" className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-400 transition hover:bg-white/[0.08] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70"><X className="h-5 w-5" /></button></div>
                <Link to="/profile" className="group relative z-10 mx-4 mt-4 flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.035] p-3 transition hover:border-cyan-300/20 hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70"><div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-2xl border border-cyan-300/20 bg-cyan-950/50">{profile?.avatar_url ? <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" /> : <div className="grid h-full w-full place-items-center text-sm font-black text-cyan-200">{initial}</div>}<span className="absolute bottom-1 right-1 h-2.5 w-2.5 rounded-full border-2 border-[#07101a] bg-emerald-400 shadow-[0_0_9px_rgba(52,211,153,0.8)]" /></div><div className="min-w-0 flex-1"><div className="truncate text-base font-black text-white group-hover:text-cyan-200">{safeName}</div><div className="mt-1 flex items-center gap-2"><span className="rounded-full border border-cyan-300/15 bg-cyan-300/8 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.16em] text-cyan-200">Level {level}</span><span className="text-[10px] font-medium text-slate-500">Personal space</span></div></div><ChevronRight className="h-4 w-4 text-slate-600 transition group-hover:translate-x-0.5 group-hover:text-slate-300" /></Link>
                <nav className="relative z-10 flex-1 overflow-y-auto px-4 py-6" aria-label="Main navigation"><div className="mb-3 px-3 text-[10px] font-black uppercase tracking-[0.24em] text-slate-600">Workspace</div><div className="space-y-1.5">
                  {NAV_ITEMS.map((item, index) => {
                    const isActive = pathname === item.to || (item.to !== "/dashboard" && pathname.startsWith(item.to));
                    if (item.action === "ai") {
                      return <motion.div key={item.to} initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.04 + index * 0.035, duration: 0.28, ease: customEase }}><button type="button" onClick={openAssistant} className={cn("group relative flex w-full items-center gap-3 overflow-hidden rounded-2xl border px-3 py-3 text-left transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70", isActive ? "border-cyan-300/15 bg-gradient-to-r from-cyan-400/10 via-blue-500/[0.06] to-transparent" : "border-transparent hover:border-white/8 hover:bg-white/[0.045]")}><div className={cn("grid h-10 w-10 place-items-center rounded-xl border transition-all", isActive ? "border-cyan-300/15 bg-cyan-300/10 text-cyan-200" : "border-white/7 bg-white/[0.025] text-slate-500 group-hover:border-white/10 group-hover:bg-white/[0.05] group-hover:text-slate-200")}><Bot className="h-[18px] w-[18px]" /></div><div className="min-w-0 flex-1"><div className={cn("text-sm font-bold", isActive ? "text-white" : "text-slate-300 group-hover:text-white")}>Intelligence</div><div className={cn("mt-0.5 text-[10px] font-medium", isActive ? "text-cyan-200/70" : "text-slate-600 group-hover:text-slate-500")}>Open AI assistant</div></div><ChevronRight className={cn("h-4 w-4 transition-all", isActive ? "text-cyan-200/70" : "text-slate-700 group-hover:translate-x-0.5 group-hover:text-slate-500")} /></button></motion.div>;
                    }
                    return <motion.div key={item.to} initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.04 + index * 0.035, duration: 0.28, ease: customEase }}><Link to={item.to} className={cn("group relative flex items-center gap-3 overflow-hidden rounded-2xl border px-3 py-3 text-left transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70", isActive ? "border-cyan-300/15 bg-gradient-to-r from-cyan-400/10 via-blue-500/[0.06] to-transparent shadow-[inset_0_0_24px_rgba(34,211,238,0.04)]" : "border-transparent hover:border-white/8 hover:bg-white/[0.045]")}>
                      {isActive && <motion.span layoutId="nav-active" className="absolute inset-y-2 left-0 w-1 rounded-r-full bg-gradient-to-b from-cyan-300 to-blue-500 shadow-[0_0_14px_rgba(34,211,238,0.65)]" />}
                      <div className={cn("grid h-10 w-10 place-items-center rounded-xl border transition-all", isActive ? "border-cyan-300/15 bg-cyan-300/10 text-cyan-200" : "border-white/7 bg-white/[0.025] text-slate-500 group-hover:border-white/10 group-hover:bg-white/[0.05] group-hover:text-slate-200")}><item.icon className="h-[18px] w-[18px]" /></div>
                      <div className="min-w-0 flex-1"><div className={cn("text-sm font-bold", isActive ? "text-white" : "text-slate-300 group-hover:text-white")}>{item.label}</div><div className="mt-0.5 text-[10px] font-medium text-slate-600">{isActive ? "Currently active" : "Open section"}</div></div><ChevronRight className="h-4 w-4 text-slate-700" />
                    </Link></motion.div>;
                  })}
                </div></nav>
                <div className="relative z-10 space-y-2 border-t border-white/7 bg-[#060911]/80 p-4 backdrop-blur-xl">
                  <button type="button" onClick={openAssistant} className="group relative flex w-full items-center gap-3 overflow-hidden rounded-2xl border border-cyan-300/15 bg-cyan-500/[0.06] px-4 py-3 text-left transition hover:border-cyan-300/30 hover:bg-cyan-500/[0.1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70"><div className="grid h-10 w-10 place-items-center rounded-xl border border-cyan-300/15 bg-cyan-400/10 text-cyan-200"><Bot className="h-[18px] w-[18px]" /></div><div className="min-w-0 flex-1"><div className="text-sm font-bold text-cyan-100">Outstand Intelligence</div><div className="mt-0.5 text-[10px] font-medium text-cyan-300/55">Open the AI assistant</div></div><ChevronRight className="h-4 w-4 text-cyan-300/45" /></button>
                  <Link to="/regain" className="group relative flex items-center gap-3 overflow-hidden rounded-2xl border border-red-400/15 bg-red-500/[0.05] px-4 py-3 text-left transition hover:border-red-300/25 hover:bg-red-500/[0.09] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300/60"><div className="grid h-10 w-10 place-items-center rounded-xl border border-red-400/15 bg-red-400/10 text-red-300"><ShieldAlert className="h-[18px] w-[18px]" /></div><div className="min-w-0 flex-1"><div className="text-sm font-bold text-red-200">Regain Protocol</div><div className="mt-0.5 text-[10px] font-medium text-red-300/50">Reset and recover momentum</div></div><ChevronRight className="h-4 w-4 text-red-300/40" /></Link>
                  <div className="rounded-2xl border border-white/7 bg-white/[0.025] p-1"><AppSettingsSheet /></div>
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>
      </div>
    </MotionConfig>
  );
}
