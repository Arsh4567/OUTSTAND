import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { Activity, Flame, LogOut, Timer, Zap, Brain, User, Settings, Share, History, SlidersHorizontal } from "lucide-react";
import { useEffect, useState } from "react";
import { useAppState } from "@/hooks/use-app-state";
import { useAuth, displayNameOf } from "@/hooks/use-auth";
import { levelFromXP } from "@/lib/habits";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChatAssistant } from "@/components/chat-assistant";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { requestNotificationPermission } from "@/lib/notifications";

// NEW IMPORTS - Our newly extracted components!
import { XpBadge } from "@/components/xp-badge";
import { AppSettingsSheet } from "@/components/app-settings-sheet";
import { TimerSettingsSheet } from "@/components/timer-settings-sheet";

const NAV = [
  { to: "/", label: "Dashboard", icon: Activity },
  { to: "/dopamine", label: "Dopamine", icon: Brain },
  { to: "/focus", label: "Focus", icon: Timer },
  { to: "/outstand", label: "Outstand", icon: Zap },
] as const;

export function AppShell() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isAuthRoute = pathname.startsWith("/auth");

  if (isAuthRoute) return <Outlet />;

  return <ShellWithChrome />;
}

function ShellWithChrome() {
  const { xp, bestStreak } = useAppState(); 
  const { user, profile } = useAuth();
  
  const safeXp = xp || 0;
  const { level, into, need } = levelFromXP(safeXp);
  const safeNeed = need > 0 ? need : 1; 
  const pct = Math.max(0, Math.min(100, Math.round((into / safeNeed) * 100)));
  
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  
  const rawName = displayNameOf(user, profile);
  const safeName = rawName || "User";
  
  const [isClient, setIsClient] = useState(false);
  
  // Sheet States
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTimerSettingsOpen, setIsTimerSettingsOpen] = useState(false);
  
  // App Preferences State
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [haptics, setHaptics] = useState(true);
  const [isNotificationsGranted, setIsNotificationsGranted] = useState(false);
  const [isTestingPush, setIsTestingPush] = useState(false);

  // Initialize Client, Theme, & Notifications
  useEffect(() => {
    setIsClient(true);
    const savedTheme = localStorage.getItem("outstand-theme") as "dark" | "light" | null;
    if (savedTheme) {
      setTheme(savedTheme);
    }
    const savedHaptics = localStorage.getItem("outstand-haptics");
    if (savedHaptics !== null) {
      setHaptics(savedHaptics === "true");
    }
    
    if (typeof window !== "undefined" && "Notification" in window) {
      setIsNotificationsGranted(Notification.permission === "granted");
    }
  }, []);

  // Apply Theme to DOM
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("outstand-theme", theme);
  }, [theme]);

  // Apply Haptics Preference
  useEffect(() => {
    localStorage.setItem("outstand-haptics", String(haptics));
  }, [haptics]);

  // --- FUNCTIONAL ACTIONS ---

  const handleNotificationToggle = async () => {
    if (!isNotificationsGranted) {
      const success = await requestNotificationPermission();
      setIsNotificationsGranted(success);
    } else {
      alert("To disable notifications, please change your browser or device settings.");
    }
  };

  const handleTestPush = async () => {
    if (!user?.id) {
      toast.error("You must be logged in to test push notifications.");
      return;
    }

    setIsTestingPush(true);
    try {
      const response = await fetch('/api/send-test-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });
      
      if (response.ok) {
        toast.success("Test notification triggered! Check your device. 🎉");
      } else {
        const errData = await response.json().catch(() => ({}));
        toast.error(errData.error || "Failed to send test push notification.");
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error("Network error while trying to send test push.");
    } finally {
      setIsTestingPush(false);
    }
  };

  const handleShare = async () => {
    const shareText = `I'm crushing goals on Outstand! Level ${level} with a ${bestStreak} day streak 🔥`;
    const url = window.location.origin;

    if (navigator.share) {
      try {
        await navigator.share({ title: "My Outstand Stats", text: shareText, url });
      } catch (err) {
        console.log("Share canceled", err);
      }
    } else {
      await navigator.clipboard.writeText(`${shareText} - ${url}`);
      toast.success("Stats copied to clipboard!");
    }
  };

  const handleClearLocalData = () => {
    if (window.confirm("Are you sure? This will wipe your unsaved local preferences and log you out.")) {
      localStorage.clear();
      toast.success("Local data wiped. Restarting...");
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
    navigate({ to: "/auth", replace: true });
  };

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-slate-950 pb-24 text-slate-50 transition-colors duration-300 md:pb-0 dark:bg-slate-950 light:bg-slate-50">
      
      <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/80 shadow-sm backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 md:px-6">
          <Link to="/" className="group flex min-w-0 items-center gap-3">
            <div className="h-9 w-9 overflow-hidden rounded-xl shadow-[0_0_15px_rgba(79,70,229,0.3)] transition-all duration-300 group-hover:scale-105 group-hover:shadow-[0_0_25px_rgba(79,70,229,0.6)]">
              <img src="/outstand-logo.png" alt="Outstand Logo" className="h-full w-full object-cover" />
            </div>
            <div className="min-w-0">
              <div className="truncate font-display text-lg font-black tracking-tight text-white">Outstand</div>
              <div className="hidden text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-400 sm:block">Focus • Discipline • Growth</div>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="ml-8 hidden flex-1 items-center gap-2 lg:flex">
            {NAV.map((item) => {
              const isActive = pathname === item.to || (item.to !== "/" && pathname.startsWith(item.to));
              return (
                <Link key={item.to} to={item.to} className={cn("relative rounded-lg px-4 py-2 text-sm font-medium transition-colors", isActive ? "text-white" : "text-slate-400 hover:text-slate-200")}>
                  {isActive && <motion.div layoutId="desktopNav" className="absolute inset-0 rounded-lg bg-white/10" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />}
                  <span className="relative z-10 flex items-center gap-2"><item.icon className="h-4 w-4" />{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* DYNAMIC TOP-RIGHT ACTIONS */}
          <div className="ml-auto flex shrink-0 items-center gap-3 sm:gap-4">
            <AnimatePresence mode="wait">
              
              {/* PROFILE ACTIONS */}
              {pathname === "/profile" ? (
                <motion.div key="profile-actions" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} transition={{ duration: 0.2 }} className="flex items-center gap-2 sm:gap-3">
                  <button onClick={handleShare} className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-slate-900/50 text-slate-400 transition-all hover:bg-white/10 hover:text-white active:scale-95">
                    <Share className="h-4 w-4" />
                  </button>
                  <button onClick={() => setIsSettingsOpen(true)} className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-slate-900/50 text-slate-400 transition-all hover:rotate-90 hover:bg-white/10 hover:text-white hover:shadow-[0_0_15px_rgba(99,102,241,0.4)] active:scale-95">
                    <Settings className="h-4 w-4" />
                  </button>
                </motion.div>
              ) : 
              
              /* FOCUS ACTIONS */
              pathname === "/focus" ? (
                <motion.div key="focus-actions" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} transition={{ duration: 0.2 }}>
                  <button onClick={() => setIsTimerSettingsOpen(true)} className="flex items-center gap-2 rounded-full border border-white/10 bg-slate-900/50 px-4 py-2 text-sm font-medium text-slate-400 transition-all hover:bg-white/10 hover:text-white active:scale-95">
                    <SlidersHorizontal className="h-4 w-4" />
                    <span className="hidden sm:inline">Timer Settings</span>
                  </button>
                </motion.div>
              ) : 
              
              /* DOPAMINE ACTIONS */
              pathname === "/dopamine" ? (
                <motion.div key="dopamine-actions" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} transition={{ duration: 0.2 }} className="flex items-center gap-3 sm:gap-4">
                  <XpBadge xp={safeXp} level={level} pct={pct} variantId="dopamine" />
                  <button onClick={() => navigate({ to: "/dopamine/history" })} className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-slate-900/50 text-slate-400 transition-all hover:bg-indigo-500/20 hover:text-indigo-400 active:scale-95">
                    <History className="h-4 w-4" />
                  </button>
                </motion.div>
              ) : 
              
              /* DEFAULT ACTIONS */
              (
                <motion.div key="default-actions" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} transition={{ duration: 0.2 }} className="flex items-center gap-3 sm:gap-4">
                  <div className="hidden items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1.5 sm:flex">
                    <Flame className="h-4 w-4 text-orange-500" />
                    <span className="text-sm font-bold text-orange-50">{bestStreak}</span>
                    <span className="text-xs font-medium uppercase tracking-wider text-orange-500/70">Streak</span>
                  </div>
                  
                  <XpBadge xp={safeXp} level={level} pct={pct} variantId="default" />
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger className="grid h-10 w-10 place-items-center rounded-full border-2 border-slate-700 bg-slate-800 text-sm font-bold text-white transition-all hover:border-indigo-500 hover:shadow-[0_0_15px_rgba(99,102,241,0.4)] focus:outline-none">
                      {profile?.avatar_url ? (
                        <img src={profile.avatar_url} alt="" className="h-full w-full rounded-full object-cover" />
                      ) : (
                        safeName.charAt(0).toUpperCase()
                      )}
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 border-white/10 bg-slate-900 text-slate-100">
                      <DropdownMenuLabel>
                        <div className="text-base font-bold">{safeName}</div>
                        <div className="truncate text-xs font-medium text-slate-400">{user?.email}</div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator className="bg-white/10" />
                      <DropdownMenuItem onClick={() => navigate({ to: "/profile" })} className="cursor-pointer focus:bg-white/10 focus:text-white">
                        <User className="mr-2 h-4 w-4" /> View profile
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setIsSettingsOpen(true)} className="cursor-pointer focus:bg-white/10 focus:text-white">
                        <Settings className="mr-2 h-4 w-4" /> Settings
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={signOut} className="cursor-pointer text-red-400 focus:bg-red-500/20 focus:text-red-400">
                        <LogOut className="mr-2 h-4 w-4" /> Sign out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>
      
      {/* MAIN CONTENT */}
      <AnimatePresence mode="wait">
        <motion.main key={pathname} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.3, ease: "easeOut" }} className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 md:px-6 md:py-10">
          <Outlet />
        </motion.main>
      </AnimatePresence>
      
      {/* MOBILE NAV */}
      <div className="pointer-events-none fixed bottom-6 left-0 right-0 z-50 flex justify-center px-4 lg:hidden">
        <nav className="pointer-events-auto flex items-center gap-1 rounded-[2rem] border border-white/10 bg-slate-950/80 p-2 shadow-2xl backdrop-blur-xl">
          {NAV.map((item) => {
            const isActive = pathname === item.to || (item.to !== "/" && pathname.startsWith(item.to));
            return (
              <Link key={item.to} to={item.to} className={cn("relative flex h-14 w-[4.5rem] flex-col items-center justify-center gap-1 rounded-2xl transition-all duration-300 active:scale-90", isActive ? "text-white" : "text-slate-500 hover:text-slate-300")}>
                {isActive && <motion.div layoutId="mobileNav" className="absolute inset-0 rounded-2xl bg-indigo-500/20 shadow-[0_0_20px_rgba(99,102,241,0.15)]" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />}
                <item.icon className={cn("relative z-10 h-5 w-5 transition-transform duration-300", isActive && "scale-110")} strokeWidth={isActive ? 2.5 : 2} />
                <span className="relative z-10 text-[9px] font-bold uppercase tracking-wider">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* ⚙️ OUR EXTRACTED COMPONENTS ⚙️ */}
      
      <AppSettingsSheet 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        theme={theme}
        onThemeChange={setTheme}
        haptics={haptics}
        onHapticsChange={setHaptics}
        isNotificationsGranted={isNotificationsGranted}
        onNotificationToggle={handleNotificationToggle}
        isTestingPush={isTestingPush}
        onTestPush={handleTestPush}
        onNavigateProfile={() => navigate({ to: "/profile" })}
        onClearData={handleClearLocalData}
        onSignOut={signOut}
      />

      <TimerSettingsSheet 
        isOpen={isTimerSettingsOpen}
        onClose={() => setIsTimerSettingsOpen(false)}
      />

      {isClient && user && <ChatAssistant />}
    </div>
  );
}
