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
    <div className={`relative ${size} shrink-0 overflow-hidden ${rounded} border border-border bg-surface-2`}>
      {avatarUrl ? <img src={avatarUrl} alt="" className="h-full w-full object-cover" loading="lazy" /> : <div className="grid h-full w-full place-items-center text-xs font-black text-primary">{initial}</div>}
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

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen bg-background font-sans text-foreground selection:bg-primary/20 selection:text-primary">
        <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-2xl supports-[padding:max(0px)]:pt-[env(safe-area-inset-top)]">
          <div className="mx-auto flex min-h-[64px] w-full max-w-7xl items-center justify-between gap-2 px-3 py-2 sm:h-[72px] sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-2">
              <button type="button" onClick={() => setIsOpen(true)} aria-label="Open navigation" aria-expanded={isOpen} className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-border bg-surface-2 text-muted-foreground transition hover:border-primary/30 hover:bg-surface-3 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98]">
                <Menu className="h-5 w-5" />
              </button>

              <Link to="/dashboard" className="hidden items-center gap-3 sm:flex" aria-label="Go to dashboard">
                <div className="grid h-9 w-9 place-items-center rounded-xl border border-primary/25 bg-primary/10"><Sparkles className="h-4 w-4 text-primary" /></div>
                <div className="leading-none"><div className="text-[11px] font-black uppercase tracking-[0.34em] text-foreground">Outstand</div><div className="mt-1 text-[10px] font-semibold tracking-[0.16em] text-muted-foreground">PERSONAL OS</div></div>
              </Link>

              <Link to="/dashboard" aria-label={`Current streak: ${currentStreak} days`} className="group ml-0 flex min-w-0 items-center gap-2 rounded-2xl border border-warning/20 bg-warning/10 px-2.5 py-2 transition hover:border-warning/35 hover:bg-warning/15 sm:ml-1 sm:px-3">
                <Flame className="h-5 w-5 shrink-0 text-warning transition group-hover:scale-110" />
                <div className="min-w-0 leading-none"><div className="flex items-baseline gap-1"><span className="text-sm font-black text-foreground">{currentStreak}</span><span className="hidden text-[9px] font-black uppercase tracking-[.12em] text-muted-foreground xs:inline">day streak</span></div><div className="mt-1 hidden text-[8px] font-bold text-muted-foreground sm:block">Keep it alive</div></div>
              </Link>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <Link to="/league" aria-label="Open leaderboard" className="group hidden min-w-[190px] items-center gap-3 rounded-2xl border border-border bg-surface-2 px-3 py-2 text-left transition hover:border-primary/30 hover:bg-surface-3 md:flex">
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl border border-warning/20 bg-warning/10 text-warning"><Trophy className="h-4 w-4" /></div>
                <div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><span className="text-[9px] font-black uppercase tracking-[0.16em] text-muted-foreground">Level {level}</span><span className="text-[10px] font-black text-primary">{xp.toLocaleString()} XP</span></div><div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-4"><motion.div initial={false} animate={{ width: `${Math.min(100, Math.max(0, progressPct))}%` }} transition={{ duration: 0.45, ease: "easeOut" }} className="h-full rounded-full bg-gradient-to-r from-primary to-accent" /></div><div className="mt-1 text-[8px] font-bold uppercase tracking-[0.12em] text-muted-foreground/70">Tap XP to view leaderboard</div></div>
              </Link>

              <Link to="/profile" className="group flex items-center gap-2 rounded-2xl border border-border bg-surface-2 px-2 py-1.5 transition hover:border-primary/30 hover:bg-surface-3 sm:px-2.5" aria-label="Open profile">
                <div className="relative"><UserAvatar avatarUrl={profile?.avatar_url} initial={initial} /><span className="absolute bottom-0.5 right-0.5 h-2.5 w-2.5 rounded-full border-2 border-background bg-success" /></div>
                <div className="hidden text-right md:block"><div className="max-w-32 truncate text-xs font-bold text-foreground">{safeName}</div><div className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Level {level}</div></div>
              </Link>
            </div>
          </div>
        </header>

        <main className="relative mx-auto w-full max-w-7xl flex-1"><div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/[0.06] via-transparent to-accent/[0.05]" /><div className="relative z-10">{children}</div></main>

        <AnimatePresence initial={false}>
          {isOpen ? (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsOpen(false)} className="fixed inset-0 z-50 bg-foreground/60 backdrop-blur-md" />
              <motion.aside initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ ease: customEase, duration: 0.3 }} className="fixed inset-y-0 left-0 z-[60] flex w-[min(88vw,360px)] flex-col overflow-hidden border-r border-border bg-background/95 pb-[env(safe-area-inset-bottom)] shadow-2xl backdrop-blur-2xl" aria-label="Primary navigation">
                <div className="relative z-10 flex items-center justify-between border-b border-border px-4 py-4 sm:px-5">
                  <div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-2xl border border-primary/25 bg-primary/10"><Sparkles className="h-4 w-4 text-primary" /></div><div><div className="text-xs font-black uppercase tracking-[.28em] text-foreground">Outstand</div><div className="mt-0.5 text-[10px] font-medium uppercase tracking-[.18em] text-muted-foreground">Command menu</div></div></div>
                  <button type="button" onClick={() => setIsOpen(false)} aria-label="Close navigation" className="grid h-11 w-11 place-items-center rounded-xl border border-border bg-surface-2 text-muted-foreground transition hover:border-primary/30 hover:bg-surface-3 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98]"><X className="h-5 w-5" /></button>
                </div>

                <div className="relative z-10 mx-4 mt-4 flex items-center gap-3 rounded-2xl border border-border bg-surface-2 p-3"><UserAvatar avatarUrl={profile?.avatar_url} initial={initial} size="h-11 w-11" rounded="rounded-2xl" /><div className="min-w-0 flex-1"><div className="truncate text-sm font-black text-foreground">{safeName}</div><div className="mt-1 text-[9px] font-black uppercase tracking-[.16em] text-primary">Level {level}</div></div><div className="rounded-xl border border-warning/20 bg-warning/10 px-2.5 py-2 text-center"><div className="flex items-center justify-center gap-1 text-warning"><Flame className="h-3.5 w-3.5" /><span className="text-sm font-black">{currentStreak}</span></div><div className="text-[7px] font-black uppercase tracking-wider text-muted-foreground">streak</div></div></div>

                <nav className="relative z-10 flex-1 overflow-y-auto overscroll-contain px-4 py-5 sm:py-6" aria-label="Main navigation">
                  <div className="mb-3 px-3 text-[10px] font-black uppercase tracking-[.24em] text-muted-foreground">Workspace</div>
                  <div className="space-y-1.5">
                    {NAV_ITEMS.map((item) => {
                      const active = pathname === item.to || (item.to !== "/dashboard" && pathname.startsWith(item.to));
                      return <Link key={item.to} to={item.to} onClick={() => setIsOpen(false)} className={cn("group relative flex min-h-[56px] items-center gap-3 rounded-2xl border px-3 py-2.5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.99]", active ? "border-primary/20 bg-primary/10 text-foreground" : "border-transparent text-muted-foreground hover:border-border hover:bg-surface-2 hover:text-foreground")}>
                        <div className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl border", active ? "border-primary/20 bg-primary/10 text-primary" : "border-border bg-surface-2 text-muted-foreground group-hover:text-foreground")}><item.icon className="h-[18px] w-[18px]" /></div>
                        <div className="min-w-0 flex-1"><div className="text-sm font-bold">{item.label}</div><div className="mt-0.5 text-[10px] text-muted-foreground">{active ? "Currently active" : "Open section"}</div></div>
                        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/70 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-muted-foreground" />
                      </Link>;
                    })}
                  </div>
                </nav>

                <div className="relative z-10 flex items-center justify-end border-t border-border bg-surface-1/80 p-4 backdrop-blur-xl">
                  <button type="button" onClick={() => { setIsOpen(false); setIsSettingsOpen(true); }} aria-label="Open settings" className="grid h-11 w-11 place-items-center rounded-full border border-border bg-surface-2 text-muted-foreground transition hover:border-primary/30 hover:bg-primary/10 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98]"><Settings className="h-4 w-4" /></button>
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
