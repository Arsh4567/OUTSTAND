import { useEffect, useState, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Menu, X, Home, Timer, Zap, Brain, Sparkles, ChevronRight, Settings, Trophy, Flame, Map } from "lucide-react";
import { AnimatePresence, motion, MotionConfig } from "framer-motion";
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

function UserAvatar({ avatarUrl, initial, size = "h-9 w-9", rounded = "rounded-xl" }: { avatarUrl?: string | null; initial: string; size?: string; rounded?: string }) {
  return (
    <div className={`relative ${size} shrink-0 overflow-hidden ${rounded} border border-cyan-300/20 bg-cyan-950/40`}>
      {avatarUrl ? <img src={avatarUrl} alt="" className="h-full w-full object-cover" loading="lazy" /> : <div className="grid h-full w-full place-items-center text-xs font-black text-cyan-200">{initial}</div>}
    </div>
  );
}

export default function SidebarLayout({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    if (typeof window === "undefined") return "dark";
    return window.localStorage.getItem("outstand-theme") === "light" ? "light" : "dark";
  });

  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const { user, profile } = useAuth();
  const { xp = 0, currentStreak = 0 } = useAppState();
  const { level, progressPct } = levelFromXP(xp);
  const safeName = displayNameOf(user, profile) || "Student";
  const initial = safeName.trim().charAt(0).toUpperCase() || "S";

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.style.colorScheme = theme;
    localStorage.setItem("outstand-theme", theme);
  }, [theme]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

  if (pathname === "/roadmap") return <>{children}</>;

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen bg-[#050508] font-sans text-slate-100 selection:bg-cyan-400/20 selection:text-cyan-100">
        <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#030508]/80 backdrop-blur-2xl supports-[padding:max(0px)]:pt-[env(safe-area-inset-top)]">
          <div className="mx-auto flex min-h-[64px] w-full max-w-7xl items-center justify-between gap-2 px-3 py-2 sm:h-[72px] sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-2">
              <button type="button" onClick={() => setIsOpen(true)} aria-label="Open navigation" aria-expanded={isOpen} className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/[0.04] text-slate-300 transition hover:border-cyan-400/20 hover:bg-white/[0.07] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60 active:scale-[0.98]">
                <Menu className="h-5 w-5" />
              </button>

              <Link to="/dashboard" className="hidden items-center gap-3 sm:flex" aria-label="Go to dashboard">
                <div className="grid h-9 w-9 place-items-center rounded-xl border border-cyan-300/20 bg-gradient-to-br from-cyan-400/20 via-blue-500/20 to-fuchsia-500/20"><Sparkles className="h-4 w-4 text-cyan-200" /></div>
                <div className="leading-none"><div className="text-[11px] font-black uppercase tracking-[0.34em] text-slate-500">Outstand</div><div className="mt-1 text-[10px] font-semibold tracking-[0.16em] text-slate-400">PERSONAL OS</div></div>
              </Link>

              <Link to="/dashboard" aria-label={`Current streak: ${currentStreak} days`} className="group ml-0 flex min-w-0 items-center gap-2 rounded-2xl border border-orange-300/15 bg-orange-300/[0.06] px-2.5 py-2 transition hover:border-orange-300/30 hover:bg-orange-300/[0.1] sm:ml-1 sm:px-3">
                <Flame className="h-5 w-5 shrink-0 text-orange-300 transition group-hover:scale-110" />
                <div className="min-w-0 leading-none"><div className="flex items-baseline gap-1"><span className="text-sm font-black text-orange-100">{currentStreak}</span><span className="hidden text-[9px] font-black uppercase tracking-[.12em] text-orange-200/60 xs:inline">day streak</span></div><div className="mt-1 hidden text-[8px] font-bold text-orange-200/45 sm:block">Keep it alive</div></div>
              </Link>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <Link to="/league" aria-label="Open leaderboard" className="group hidden min-w-[190px] items-center gap-3 rounded-2xl border border-cyan-300/15 bg-white/[0.035] px-3 py-2 text-left transition hover:border-cyan-300/30 hover:bg-cyan-300/[0.06] md:flex">
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl border border-amber-300/15 bg-amber-300/[0.06] text-amber-200"><Trophy className="h-4 w-4" /></div>
                <div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><span className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-500">Level {level}</span><span className="text-[10px] font-black text-cyan-200">{xp.toLocaleString()} XP</span></div><div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/[0.06]"><motion.div initial={false} animate={{ width: `${Math.min(100, Math.max(0, progressPct))}%` }} transition={{ duration: 0.45, ease: "easeOut" }} className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-blue-400 to-violet-400" /></div><div className="mt-1 text-[8px] font-bold uppercase tracking-[0.12em] text-slate-600">Tap XP to view leaderboard</div></div>
              </Link>

              <Link to="/profile" className="group flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.035] px-2 py-1.5 transition hover:border-cyan-300/20 hover:bg-white/[0.06] sm:px-2.5" aria-label="Open profile">
                <div className="relative"><UserAvatar avatarUrl={profile?.avatar_url} initial={initial} /><span className="absolute bottom-0.5 right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#030508] bg-emerald-400" /></div>
                <div className="hidden text-right md:block"><div className="max-w-32 truncate text-xs font-bold text-white">{safeName}</div><div className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">Level {level}</div></div>
              </Link>
            </div>
          </div>
        </header>

        <main className="relative mx-auto w-full max-w-7xl flex-1"><div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-cyan-950/[0.06] via-transparent to-fuchsia-950/[0.04]" /><div className="relative z-10">{children}</div></main>

        <AnimatePresence initial={false}>
          {isOpen ? (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsOpen(false)} className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md" />
              <motion.aside initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ ease: customEase, duration: 0.3 }} className="fixed inset-y-0 left-0 z-[60] flex w-[min(88vw,360px)] flex-col overflow-hidden border-r border-white/10 bg-[#060911]/95 pb-[env(safe-area-inset-bottom)] shadow-[30px_0_80px_rgba(0,0,0,.55)] backdrop-blur-2xl" aria-label="Primary navigation">
                <div className="relative z-10 flex items-center justify-between border-b border-white/7 px-4 py-4 sm:px-5">
                  <div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-2xl border border-cyan-300/20 bg-cyan-400/10"><Sparkles className="h-4 w-4 text-cyan-200" /></div><div><div className="text-xs font-black uppercase tracking-[.28em] text-white">Outstand</div><div className="mt-0.5 text-[10px] font-medium uppercase tracking-[.18em] text-slate-500">Command menu</div></div></div>
                  <button type="button" onClick={() => setIsOpen(false)} aria-label="Close navigation" className="grid h-11 w-11 place-items-center rounded-xl border border-white/10 bg-white/[.04] text-slate-400 transition hover:border-cyan-300/20 hover:bg-cyan-300/[.08] hover:text-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60 active:scale-[0.98]"><X className="h-5 w-5" /></button>
                </div>

                <div className="relative z-10 mx-4 mt-4 flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[.035] p-3"><UserAvatar avatarUrl={profile?.avatar_url} initial={initial} size="h-11 w-11" rounded="rounded-2xl" /><div className="min-w-0 flex-1"><div className="truncate text-sm font-black text-white">{safeName}</div><div className="mt-1 text-[9px] font-black uppercase tracking-[.16em] text-cyan-200">Level {level}</div></div><div className="rounded-xl border border-orange-300/15 bg-orange-300/[.06] px-2.5 py-2 text-center"><div className="flex items-center justify-center gap-1 text-orange-300"><Flame className="h-3.5 w-3.5" /><span className="text-sm font-black">{currentStreak}</span></div><div className="text-[7px] font-black uppercase tracking-wider text-orange-200/50">streak</div></div></div>

                <nav className="relative z-10 flex-1 overflow-y-auto overscroll-contain px-4 py-5 sm:py-6" aria-label="Main navigation">
                  <div className="mb-3 px-3 text-[10px] font-black uppercase tracking-[.24em] text-slate-500">Workspace</div>
                  <div className="space-y-1.5">
                    {NAV_ITEMS.map((item) => {
                      const active = pathname === item.to || (item.to !== "/dashboard" && pathname.startsWith(item.to));
                      return <Link key={item.to} to={item.to} onClick={() => setIsOpen(false)} className={cn("group relative flex min-h-[56px] items-center gap-3 rounded-2xl border px-3 py-2.5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60 active:scale-[0.99]", active ? "border-cyan-300/15 bg-cyan-400/[.08] text-white" : "border-transparent text-slate-400 hover:border-white/8 hover:bg-white/[.045] hover:text-white")}>
                        <div className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl border", active ? "border-cyan-300/15 bg-cyan-300/10 text-cyan-200" : "border-white/7 bg-white/[.025] text-slate-500 group-hover:text-slate-200")}><item.icon className="h-[18px] w-[18px]" /></div>
                        <div className="min-w-0 flex-1"><div className="text-sm font-bold">{item.label}</div><div className="mt-0.5 text-[10px] text-slate-500">{active ? "Currently active" : "Open section"}</div></div>
                        <ChevronRight className="h-4 w-4 shrink-0 text-slate-600 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-slate-400" />
                      </Link>;
                    })}
                  </div>
                </nav>

                <div className="relative z-10 flex items-center justify-end border-t border-white/7 bg-[#060911]/80 p-4 backdrop-blur-xl">
                  <button type="button" onClick={() => { setIsOpen(false); setIsSettingsOpen(true); }} aria-label="Open settings" className="grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-white/[.04] text-slate-500 transition hover:border-cyan-300/20 hover:bg-cyan-300/[.08] hover:text-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60 active:scale-[0.98]"><Settings className="h-4 w-4" /></button>
                </div>
              </motion.aside>
            </>
          ) : null}
        </AnimatePresence>

        <AppSettingsSheet theme={theme} onThemeChange={setTheme} open={isSettingsOpen} onOpenChange={setIsSettingsOpen} />
      </div>
    </MotionConfig>
  );
}
