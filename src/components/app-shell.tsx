import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { Activity, Flame, LogOut, Timer, Zap, Brain, User, Settings, Share, History, SlidersHorizontal, X, Smartphone, Moon, Sun, Trash2, Edit3, Bell } from "lucide-react";
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
    
    // Check initial notification status
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
    <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col pb-24 md:pb-0 overflow-x-hidden transition-colors duration-300 dark:bg-slate-950 light:bg-slate-50">
      
      <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 md:px-6">
          <Link to="/" className="flex min-w-0 items-center gap-3 group">
            <div className="h-9 w-9 overflow-hidden rounded-xl shadow-[0_0_15px_rgba(79,70,229,0.3)] transition-all duration-300 group-hover:shadow-[0_0_25px_rgba(79,70,229,0.6)] group-hover:scale-105">
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
                  <button onClick={() => setIsSettingsOpen(true)} className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-slate-900/50 text-slate-400 transition-all hover:bg-white/10 hover:text-white hover:rotate-90 hover:shadow-[0_0_15px_rgba(99,102,241,0.4)] active:scale-95">
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
                    <span className="text-xs font-medium text-orange-500/70 uppercase tracking-wider">Streak</span>
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
                    <DropdownMenuContent align="end" className="w-56 bg-slate-900 border-white/10 text-slate-100">
                      <DropdownMenuLabel>
                        <div className="font-bold text-base">{safeName}</div>
                        <div className="truncate text-xs font-medium text-slate-400">{user?.email}</div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator className="bg-white/10" />
                      <DropdownMenuItem onClick={() => navigate({ to: "/profile" })} className="focus:bg-white/10 focus:text-white cursor-pointer">
                        <User className="mr-2 h-4 w-4" /> View profile
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setIsSettingsOpen(true)} className="focus:bg-white/10 focus:text-white cursor-pointer">
                        <Settings className="mr-2 h-4 w-4" /> Settings
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={signOut} className="focus:bg-red-500/20 focus:text-red-400 cursor-pointer text-red-400">
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
      <div className="fixed bottom-6 left-0 right-0 z-50 flex justify-center px-4 lg:hidden pointer-events-none">
        <nav className="flex items-center gap-1 rounded-[2rem] border border-white/10 bg-slate-950/80 p-2 backdrop-blur-xl shadow-2xl pointer-events-auto">
          {NAV.map((item) => {
            const isActive = pathname === item.to || (item.to !== "/" && pathname.startsWith(item.to));
            return (
              <Link key={item.to} to={item.to} className={cn("relative flex h-14 w-[4.5rem] flex-col items-center justify-center gap-1 rounded-2xl transition-all duration-300 active:scale-90", isActive ? "text-white" : "text-slate-500 hover:text-slate-300")}>
                {isActive && <motion.div layoutId="mobileNav" className="absolute inset-0 rounded-2xl bg-indigo-500/20 shadow-[0_0_20px_rgba(99,102,241,0.15)]" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />}
                <item.icon className={cn("relative z-10 h-5 w-5 transition-transform duration-300", isActive && "scale-110")} strokeWidth={isActive ? 2.5 : 2} />
                <span className="relative z-10 text-[9px] font-bold tracking-wider uppercase">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* ⚙️ GLOBAL SETTINGS BOTTOM SHEET */}
      <AnimatePresence>
        {isSettingsOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsSettingsOpen(false)} className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", bounce: 0, duration: 0.4 }} className="fixed bottom-0 left-0 right-0 z-[70] mx-auto w-full max-w-lg rounded-t-[2.5rem] border border-white/10 bg-slate-900 p-6 shadow-2xl md:bottom-auto md:top-[15%] md:rounded-[2.5rem] max-h-[85vh] overflow-y-auto">
              <div className="mb-8 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-white">App Settings</h2>
                  <p className="text-sm text-slate-400">Manage your preferences & data.</p>
                </div>
                <button onClick={() => setIsSettingsOpen(false)} className="grid h-10 w-10 place-items-center rounded-full bg-white/5 text-slate-400 transition-colors hover:bg-white/10 hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="space-y-6 pb-6">
                
                {/* 1. Preferences */}
                <div>
                  <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">Preferences</h3>
                  <div className="space-y-2">
                    
                    {/* Push Notifications Toggle */}
                    <div className="flex items-center justify-between rounded-2xl bg-white/5 p-4">
                      <div className="flex items-center gap-4">
                        <div className="grid h-10 w-10 place-items-center rounded-full bg-green-500/20">
                          <Bell className="h-5 w-5 text-green-400" />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-200">Push Notifications</div>
                          <div className="text-xs text-slate-400">Daily reminders</div>
                        </div>
                      </div>
                      <button 
                        onClick={handleNotificationToggle} 
                        className={cn("h-7 w-12 cursor-pointer rounded-full p-1 transition-colors duration-300", isNotificationsGranted ? "bg-green-500" : "bg-slate-700")}
                      >
                        <motion.div layout className="h-5 w-5 rounded-full bg-white shadow-sm" animate={{ x: isNotificationsGranted ? 20 : 0 }} transition={{ type: "spring", stiffness: 500, damping: 30 }} />
                      </button>
                    </div>

                    {/* Test Push Trigger (Only shows if notifications are granted) */}
                    {isNotificationsGranted && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="flex items-center justify-between rounded-2xl bg-white/5 p-4 mt-2"
                      >
                        <div className="flex items-center gap-4">
                          <div className="grid h-10 w-10 place-items-center rounded-full bg-indigo-500/20">
                            <Zap className="h-5 w-5 text-indigo-400" />
                          </div>
                          <div>
                            <div className="font-semibold text-slate-200">Test Connection</div>
                            <div className="text-xs text-slate-400">Send a live ping to this screen</div>
                          </div>
                        </div>
                        <button
                          onClick={handleTestPush}
                          disabled={isTestingPush}
                          className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white transition-all hover:bg-indigo-500 active:scale-95 disabled:opacity-50"
                        >
                          {isTestingPush ? "Testing..." : "Test Push"}
                        </button>
                      </motion.div>
                    )}

                    {/* Haptics Toggle */}
                    <div className="flex items-center justify-between rounded-2xl bg-white/5 p-4">
                      <div className="flex items-center gap-4">
                        <div className="grid h-10 w-10 place-items-center rounded-full bg-indigo-500/20">
                          <Smartphone className="h-5 w-5 text-indigo-400" />
                        </div>
                        <span className="font-semibold text-slate-200">Haptic Feedback</span>
                      </div>
                      <button onClick={() => setHaptics(!haptics)} className={cn("h-7 w-12 cursor-pointer rounded-full p-1 transition-colors duration-300", haptics ? "bg-indigo-500" : "bg-slate-700")}>
                        <motion.div layout className="h-5 w-5 rounded-full bg-white shadow-sm" animate={{ x: haptics ? 20 : 0 }} transition={{ type: "spring", stiffness: 500, damping: 30 }} />
                      </button>
                    </div>

                    {/* Theme Toggle */}
                    <div className="flex items-center justify-between rounded-2xl bg-white/5 p-4">
                      <div className="flex items-center gap-4">
                        <div className="grid h-10 w-10 place-items-center rounded-full bg-amber-500/20">
                          {theme === "dark" ? <Moon className="h-5 w-5 text-amber-400" /> : <Sun className="h-5 w-5 text-amber-400" />}
                        </div>
                        <span className="font-semibold text-slate-200">App Theme</span>
                      </div>
                      <div className="flex gap-1 rounded-xl bg-slate-800 p-1">
                        <button onClick={() => setTheme("dark")} className={cn("rounded-lg px-3 py-1 text-xs font-bold transition-all", theme === "dark" ? "bg-slate-700 text-white shadow-sm" : "text-slate-400 hover:text-slate-200")}>Dark</button>
                        <button onClick={() => setTheme("light")} className={cn("rounded-lg px-3 py-1 text-xs font-bold transition-all", theme === "light" ? "bg-slate-700 text-white shadow-sm" : "text-slate-400 hover:text-slate-200")}>Light</button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Account Details */}
                <div>
                  <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">Account</h3>
                  <div className="space-y-2">
                    <button onClick={() => { setIsSettingsOpen(false); navigate({ to: "/profile" }); }} className="flex w-full items-center justify-between rounded-2xl bg-white/5 p-4 transition-colors hover:bg-white/10">
                      <div className="flex items-center gap-4">
                        <div className="grid h-10 w-10 place-items-center rounded-full bg-blue-500/20">
                          <Edit3 className="h-5 w-5 text-blue-400" />
                        </div>
                        <div className="text-left">
                          <div className="font-semibold text-slate-200">Edit Profile</div>
                          <div className="text-xs text-slate-400">Update username or avatar</div>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
                
                {/* 3. Danger Zone */}
                <div>
                  <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-red-500/70">Danger Zone</h3>
                  <div className="space-y-2">
                    <button onClick={handleClearLocalData} className="flex w-full items-center gap-4 rounded-2xl bg-red-500/5 p-4 text-red-400 transition-colors hover:bg-red-500/10">
                      <div className="grid h-10 w-10 place-items-center rounded-full bg-red-500/10">
                        <Trash2 className="h-5 w-5" />
                      </div>
                      <div className="text-left">
                        <div className="font-bold">Clear Local Data</div>
                        <div className="text-xs text-red-400/70">Wipes unsaved offline preferences</div>
                      </div>
                    </button>

                    <button onClick={() => { setIsSettingsOpen(false); signOut(); }} className="flex w-full items-center gap-4 rounded-2xl bg-red-500/10 p-4 text-red-400 transition-colors hover:bg-red-500/20">
                      <div className="grid h-10 w-10 place-items-center rounded-full bg-red-500/20">
                        <LogOut className="h-5 w-5" />
                      </div>
                      <span className="font-bold">Sign Out</span>
                    </button>
                  </div>
                </div>

              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ⏱️ FOCUS TIMER SETTINGS SHEET */}
      <AnimatePresence>
        {isTimerSettingsOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsTimerSettingsOpen(false)} className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", bounce: 0, duration: 0.4 }} className="fixed bottom-0 left-0 right-0 z-[70] mx-auto w-full max-w-lg rounded-t-[2.5rem] border border-white/10 bg-slate-900 p-6 shadow-2xl md:bottom-auto md:top-[20%] md:rounded-[2.5rem]">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-white">Timer Focus Settings</h2>
                  <p className="text-sm text-slate-400">Adjust your Pomodoro sessions.</p>
                </div>
                <button onClick={() => setIsTimerSettingsOpen(false)} className="grid h-10 w-10 place-items-center rounded-full bg-white/5 text-slate-400 transition-colors hover:bg-white/10 hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="rounded-2xl border border-white/5 bg-white/5 p-8 text-center">
              <Timer className="mx-auto mb-3 h-8 w-8 text-slate-500" />
                <p className="text-sm text-slate-400">Connect this menu to your Pomodoro timer state variables in the future (e.g., 25m vs 50m logic).</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {isClient && user && <ChatAssistant />}
    </div>
  );
}

// Reusable Badge Component
function XpBadge({ xp, level, pct, variantId }: { xp: number, level: number, pct: number, variantId: string }) {
  const safeLevel = level || 1;
  const safeXp = xp || 0;
  const safePct = pct || 0;
  const gradientId = `lvl-grad-${variantId}`;

  return (
    <div className="flex items-center gap-3 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1.5 shadow-inner">
      <div className="relative h-7 w-7 flex items-center justify-center">
        <motion.div key={`shockwave-${variantId}-${safeLevel}`} initial={{ scale: 0.8, opacity: 1, borderWidth: "4px" }} animate={{ scale: 2.5, opacity: 0, borderWidth: "0px" }} transition={{ duration: 1, ease: "easeOut" }} className="absolute inset-0 rounded-full border-indigo-400 pointer-events-none z-0" />
        <svg viewBox="0 0 36 36" className="h-7 w-7 -rotate-90 relative z-10 overflow-visible">
          <circle cx="18" cy="18" r="15" fill="none" className="stroke-slate-800" strokeWidth="4" />
          <motion.circle cx="18" cy="18" r="15" fill="none" stroke={`url(#${gradientId})`} strokeWidth="4" strokeLinecap="round" initial={{ strokeDasharray: "0 94.25", filter: "drop-shadow(0px 0px 0px rgba(99,102,241,0))" }} animate={{ strokeDasharray: `${(safePct / 100) * 94.25} 94.25`, filter: "drop-shadow(0px 0px 6px rgba(99,102,241,0.8))" }} transition={{ type: "spring", bounce: 0.4, duration: 1.5 }} />
          <defs>
            <linearGradient id={gradientId} x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="#818cf8" />
              <stop offset="100%" stopColor="#4f46e5" />
            </linearGradient>
          </defs>
        </svg>
        <motion.span key={`lvl-${variantId}-${safeLevel}`} initial={{ scale: 1.8, opacity: 0, rotate: -15 }} animate={{ scale: 1, opacity: 1, rotate: 0 }} transition={{ type: "spring", bounce: 0.6, duration: 0.8 }} className="absolute inset-0 grid place-items-center text-[11px] font-black text-indigo-100 z-20">
          {safeLevel}
        </motion.span>
      </div>
      
      <div className="hidden text-xs sm:block">
        <motion.div key={`xp-${variantId}-${safeXp}`} initial={{ color: "#4ade80", scale: 1.3, textShadow: "0px 0px 20px rgba(74,222,128,1)" }} animate={{ color: "#ffffff", scale: 1, textShadow: "0px 0px 0px rgba(74,222,128,0)" }} transition={{ type: "spring", stiffness: 300, damping: 15 }} className="font-black tabular-nums tracking-tight origin-left">
          {safeXp} XP
        </motion.div>
        <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">
          Lv {safeLevel}
        </div>
      </div>
    </div>
  );
}  
