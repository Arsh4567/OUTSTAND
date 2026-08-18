import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { useAppState } from "@/hooks/use-app-state";
import { useAuth } from "@/hooks/use-auth";
import { levelFromXP } from "@/lib/habits";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { requestNotificationPermission } from "@/lib/notifications";
import { AppSettingsSheet } from "@/components/app-settings-sheet";
import { TimerSettingsSheet } from "@/components/timer-settings-sheet";
import { LayoutDashboard, Swords, Brain, Timer, BookOpen, Trophy, UserRound, Settings, Sparkles } from "lucide-react";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/outstand", label: "Outstand", icon: Swords, featured: true },
  { to: "/intelligence", label: "Intelligence", icon: Brain },
  { to: "/focus", label: "Deep Focus", icon: Timer },
  { to: "/study", label: "Study", icon: BookOpen },
  { to: "/league", label: "League", icon: Trophy },
];

export function AppShell() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isAuthRoute = pathname.startsWith("/auth");
  if (isAuthRoute) return <Outlet />;
  return <ShellWithChrome />;
}

function ShellWithChrome() {
  const { xp } = useAppState();
  const { user } = useAuth();
  const safeXp = xp || 0;
  const { level, progressPct } = levelFromXP(safeXp);
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTimerSettingsOpen, setIsTimerSettingsOpen] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [haptics, setHaptics] = useState(true);
  const [isNotificationsGranted, setIsNotificationsGranted] = useState(false);
  const [isTestingPush, setIsTestingPush] = useState(false);
  const [showSupernova, setShowSupernova] = useState(false);
  const prevLevelRef = useRef(level);
  const hasHydratedRef = useRef(false);

  useEffect(() => {
    if (!hasHydratedRef.current) { hasHydratedRef.current = true; prevLevelRef.current = level; return; }
    if (level > prevLevelRef.current) setShowSupernova(true);
    prevLevelRef.current = level;
  }, [level]);

  useEffect(() => {
    const savedTheme = localStorage.getItem("outstand-theme") as "dark" | "light" | null;
    if (savedTheme) setTheme(savedTheme);
    const savedHaptics = localStorage.getItem("outstand-haptics");
    if (savedHaptics !== null) setHaptics(savedHaptics === "true");
    if (typeof window !== "undefined" && "Notification" in window) setIsNotificationsGranted(Notification.permission === "granted");
  }, []);

  useEffect(() => {
    if (theme === "dark") document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
    localStorage.setItem("outstand-theme", theme);
  }, [theme]);

  useEffect(() => { localStorage.setItem("outstand-haptics", String(haptics)); }, [haptics]);

  const handleNotificationToggle = async () => {
    if (isNotificationsGranted) {
      toast.info("Notifications are enabled. To disable them, use your browser or device notification settings.");
      return;
    }
    try {
      await requestNotificationPermission();
      setIsNotificationsGranted(typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted");
    } catch (error) {
      console.error("Notification permission error:", error);
      toast.error(error instanceof Error ? error.message : "Notifications could not be enabled.");
      setIsNotificationsGranted(false);
    }
  };

  const handleTestPush = async () => {
    if (!user?.id) { toast.error("You must be logged in to test push notifications."); return; }
    setIsTestingPush(true);
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) throw new Error("Please sign in before testing notifications.");
      const response = await fetch("/api/send-test-push", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` } });
      const errData = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(errData.error || "Failed to send test push notification.");
      toast.success("Test notification sent! 🚀");
    } catch (error) { console.error("Test push error:", error); toast.error(error instanceof Error ? error.message : "Network error while trying to send test push."); }
    finally { setIsTestingPush(false); }
  };

  const handleClearLocalData = () => {
    if (window.confirm("Are you sure? This will wipe your unsaved local preferences and log you out.")) {
      localStorage.clear(); toast.success("Local data wiped. Restarting..."); setTimeout(() => window.location.reload(), 1000);
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) { toast.error(error.message); return; }
    toast.success("Signed out successfully"); navigate({ to: "/auth", replace: true });
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-transparent text-slate-50 transition-colors duration-300">
      <AnimatePresence>{showSupernova && <SupernovaEffect level={level} onClose={() => setShowSupernova(false)} />}</AnimatePresence>

      <div className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden">
        <div className="absolute left-[-10%] top-[-20%] h-[50%] w-[50%] rounded-full bg-blue-600/10 blur-[150px]" />
        <div className="absolute bottom-[-20%] right-[-10%] h-[60%] w-[60%] rounded-full bg-indigo-900/15 blur-[150px]" />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-[1800px]">
        <DesktopSidebar pathname={pathname} level={level} xp={safeXp} progressPct={progressPct} onSettings={() => setIsSettingsOpen(true)} />
        <div className="min-w-0 flex-1 xl:pl-[264px]">
          <header className="sticky top-0 z-40 hidden h-[76px] items-center justify-between border-b border-white/[0.06] bg-[#05070d]/75 px-8 backdrop-blur-2xl xl:flex">
            <div className="flex items-center gap-3"><span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_16px_rgba(52,211,153,.65)]" /><span className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">OUTSTAND · Personal growth system</span></div>
            <div className="flex items-center gap-3"><button type="button" onClick={() => setIsTimerSettingsOpen(true)} className="rounded-xl border border-white/[0.07] bg-white/[0.025] px-3 py-2 text-xs font-bold text-slate-300 transition hover:border-cyan-300/20 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60">Quick focus</button><button type="button" onClick={() => navigate({ to: "/profile" })} aria-label="Open profile" className="grid h-10 w-10 place-items-center rounded-xl border border-white/[0.08] bg-white/[0.035] text-slate-300 transition hover:border-cyan-300/20 hover:text-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60"><UserRound className="h-4 w-4" /></button></div>
          </header>

          <AnimatePresence mode="wait">
            <motion.main key={pathname} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.3, ease: "easeOut" }} className="relative z-10 mx-auto w-full max-w-[1560px] px-4 py-5 pb-24 sm:px-6 lg:px-8 xl:px-10 xl:py-8 xl:pb-8 2xl:px-12">
              <Outlet />
            </motion.main>
          </AnimatePresence>
        </div>
      </div>

      <MobileBottomNav pathname={pathname} onSettings={() => setIsSettingsOpen(true)} onQuickFocus={() => setIsTimerSettingsOpen(true)} />
      <AppSettingsSheet isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} theme={theme} onThemeChange={setTheme} haptics={haptics} onHapticsChange={setHaptics} isNotificationsGranted={isNotificationsGranted} onNotificationToggle={handleNotificationToggle} isTestingPush={isTestingPush} onTestPush={handleTestPush} onNavigateProfile={() => navigate({ to: "/profile" })} onClearData={handleClearLocalData} onSignOut={signOut} />
      <TimerSettingsSheet isOpen={isTimerSettingsOpen} onClose={() => setIsTimerSettingsOpen(false)} />
    </div>
  );
}

function DesktopSidebar({ pathname, level, xp, progressPct, onSettings }: { pathname: string; level: number; xp: number; progressPct: number; onSettings: () => void }) {
  return <aside className="fixed inset-y-0 left-0 z-50 hidden w-[264px] border-r border-white/[0.06] bg-[#070a12]/90 px-4 py-5 backdrop-blur-2xl xl:block">
    <div className="flex h-full flex-col">
      <Link to="/dashboard" className="flex items-center gap-3 rounded-2xl px-3 py-3 transition hover:bg-white/[0.035] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60">
        <div className="grid h-10 w-10 place-items-center rounded-xl border border-cyan-300/15 bg-cyan-300/[0.07] text-cyan-200 shadow-[0_0_30px_rgba(34,211,238,.08)]"><Sparkles className="h-5 w-5" /></div>
        <div><p className="text-lg font-black tracking-[-0.04em] text-white">OUTSTAND</p><p className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-600">Become undeniable</p></div>
      </Link>
      <div className="mt-7 px-2 text-[9px] font-black uppercase tracking-[0.2em] text-slate-600">Workspace</div>
      <nav className="mt-2 space-y-1">
        {navItems.map(({ to, label, icon: Icon, featured }) => {
          const active = pathname === to || (to !== "/dashboard" && pathname.startsWith(`${to}/`));
          return <Link key={to} to={to} aria-current={active ? "page" : undefined} className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60 ${active ? "border border-cyan-300/10 bg-cyan-300/[0.09] text-white shadow-[inset_0_0_24px_rgba(34,211,238,.025)]" : "text-slate-500 hover:bg-white/[0.035] hover:text-slate-200"} ${featured ? "mt-2" : ""}`}>
            <span className={`grid h-8 w-8 place-items-center rounded-lg border ${active ? "border-cyan-300/15 bg-cyan-300/[0.07] text-cyan-200" : "border-white/[0.05] bg-white/[0.02] text-slate-600 group-hover:text-slate-300"}`}><Icon className="h-4 w-4" /></span><span className="flex-1">{label}</span>{featured && <span className="rounded-full border border-violet-300/15 bg-violet-300/[0.06] px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider text-violet-200">Core</span>}
          </Link>;
        })}
      </nav>
      <div className="mt-auto space-y-3">
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4"><div className="flex items-center justify-between"><span className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-600">Your level</span><span className="text-xs font-black text-cyan-200">{level}</span></div><p className="mt-2 text-sm font-bold text-white">{xp.toLocaleString()} XP</p><div className="mt-3 h-1 overflow-hidden rounded-full bg-white/5" aria-label={`${Math.round(progressPct)}% progress to next level`}><div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-violet-400 transition-[width] duration-500" style={{ width: `${Math.min(100, Math.max(0, progressPct))}%` }} /></div><p className="mt-2 text-[9px] font-bold text-slate-600">{Math.round(progressPct)}% to next level</p></div>
        <button type="button" onClick={onSettings} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-500 transition hover:bg-white/[0.035] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60"><span className="grid h-8 w-8 place-items-center rounded-lg border border-white/[0.05] bg-white/[0.02]"><Settings className="h-4 w-4" /></span>Settings</button>
      </div>
    </div>
  </aside>;
}

function MobileBottomNav({ pathname, onSettings, onQuickFocus }: { pathname: string; onSettings: () => void; onQuickFocus: () => void }) {
  const items = [
    { to: "/dashboard", label: "Home", icon: LayoutDashboard },
    { to: "/outstand", label: "Outstand", icon: Swords },
    { to: "/intelligence", label: "AI", icon: Brain },
    { to: "/focus", label: "Focus", icon: Timer },
  ];
  return <nav aria-label="Primary navigation" className="fixed inset-x-0 bottom-0 z-[70] border-t border-white/[0.08] bg-[#05070d]/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-2xl xl:hidden">
    <div className="mx-auto grid max-w-lg grid-cols-5 gap-1">
      {items.map(({ to, label, icon: Icon }) => { const active = pathname === to || pathname.startsWith(`${to}/`); return <Link key={to} to={to} aria-current={active ? "page" : undefined} className={`flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[9px] font-black uppercase tracking-[0.08em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70 ${active ? "bg-cyan-300/[0.1] text-cyan-200" : "text-slate-600 hover:text-slate-300"}`}><Icon className="h-4 w-4" />{label}</Link>; })}
      <button type="button" onClick={onSettings} aria-label="Open settings" className="flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[9px] font-black uppercase tracking-[0.08em] text-slate-600 hover:text-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70"><Settings className="h-4 w-4" />Settings</button>
    </div>
    <button type="button" onClick={onQuickFocus} className="sr-only">Quick focus</button>
  </nav>;
}

function SupernovaEffect({ level, onClose }: { level: number; onClose: () => void }) {
  const particles = Array.from({ length: 45 }).map((_, i) => { const angle = Math.random() * Math.PI * 2; const distance = Math.random() * 400 + 100; return { id: i, x: Math.cos(angle) * distance, y: Math.sin(angle) * distance, size: Math.random() * 10 + 4, color: Math.random() > 0.5 ? "#fbbf24" : "#60a5fa" }; });
  useEffect(() => { if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 500]); const timer = setTimeout(onClose, 4000); return () => clearTimeout(timer); }, [onClose]);
  return <motion.div className="fixed inset-0 z-[100] flex flex-col items-center justify-center pointer-events-none overflow-hidden" initial={{ backgroundColor: "rgba(255, 255, 255, 1)" }} animate={{ backgroundColor: "rgba(3, 7, 18, 0.85)" }} exit={{ opacity: 0 }} transition={{ duration: 0.8, ease: "easeOut" }}>
    {particles.map((p) => <motion.div key={p.id} className="absolute top-1/2 left-1/2 rounded-full" style={{ backgroundColor: p.color, width: p.size, height: p.size, boxShadow: `0 0 20px ${p.color}` }} initial={{ x: 0, y: 0, scale: 0, opacity: 1 }} animate={{ x: p.x, y: p.y, scale: Math.random() * 1.5 + 0.5, opacity: 0 }} transition={{ duration: 1.5 + Math.random(), ease: "easeOut" }} />)}
    <motion.div className="relative z-10 flex flex-col items-center text-center" initial={{ scale: 0.5, opacity: 0, y: 50 }} animate={{ scale: 1, opacity: 1, y: 0 }} transition={{ delay: 0.2, type: "spring", bounce: 0.6 }}><motion.div className="mb-2 font-black uppercase tracking-widest text-yellow-400 drop-shadow-[0_0_30px_rgba(250,204,21,0.6)]" style={{ fontSize: "clamp(3rem, 10vw, 6rem)" }} animate={{ scale: [1, 1.05, 1] }} transition={{ repeat: Infinity, duration: 2 }}>Level Up</motion.div><div className="rounded-full border border-white/20 bg-white/10 px-6 py-2 text-lg font-medium tracking-wide text-white shadow-2xl backdrop-blur-md sm:text-2xl">You reached Level <span className="font-bold text-blue-400">{level}</span></div></motion.div>
  </motion.div>;
}
