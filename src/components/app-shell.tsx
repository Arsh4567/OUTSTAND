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
// import { ChatAssistant } from "@/components/chat-assistant"; // AI Assistant temporarily disabled
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { requestNotificationPermission } from "@/lib/notifications";

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

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("outstand-theme", theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("outstand-haptics", String(haptics));
  }, [haptics]);

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
        toast.success("Test notification triggered! 🎉");
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
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-zinc-950 pb-24 text-slate-50 transition-colors duration-300 md:pb-0">
      
      {/* DESKTOP FLOATING DOCK (Replaces standard full-width header) */}
      <div className="hidden lg:flex fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-3rem)] max-w-6xl">
        <header className="w-full flex items-center justify-between rounded-full border border-white/10 bg-zinc-900/60 px-6 py-3 shadow-[0_0_40px_rgba(0,0,0,0.5)] backdrop-blur-3xl">
          
          <Link to="/" className="group flex items-center gap-3">
            <div className="h-10 w-10 overflow-hidden rounded-full shadow-[0_0_15px_rgba(255,255,255,0.1)] transition-all duration-300 group-hover:scale-105 group-hover:shadow-[0_0_25px_rgba(255,255,255,0.3)]">
              <img src="/outstand-logo.png" alt="Outstand Logo" className="h-full w-full object-cover" />
            </div>
            <div className="font-display text-lg font-bold tracking-tight text-white">Outstand</div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
            {NAV.map((item) => {
              const isActive = pathname === item.to || (item.to !== "/" && pathname.startsWith(item.to));
              return (
                <Link key={item.to} to={item.to} className={cn("relative rounded-full px-5 py-2.5 text-sm font-medium transition-colors", isActive ? "text-white" : "text-zinc-400 hover:text-white")}>
                  {isActive && <motion.div layoutId="desktopNav" className="absolute inset-0 rounded-full bg-white/10" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />}
                  <span className="relative z-10 flex items-center gap-2"><item.icon className="h-4 w-4" />{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Dynamic Top-Right Actions */}
          <div className="flex items-center gap-4">
            <AnimatePresence mode="wait">
              {pathname === "/profile" ? (
                <motion.div key="profile-actions" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} transition={{ duration: 0.2 }} className="flex items-center gap-3">
                  <button onClick={handleShare} className="grid h-10 w-10 place-items-center rounded-full bg-white/5 border border-white/10 text-zinc-400 hover:bg-white/10 hover:text-white transition-all active:scale-95">
                    <Share className="h-4 w-4" />
                  </button>
                  <button onClick={() => setIsSettingsOpen(true)} className="grid h-10 w-10 place-items-center rounded-full bg-white/5 border border-white/10 text-zinc-400 hover:bg-white/10 hover:text-white transition-all active:scale-95">
                    <Settings className="h-4 w-4" />
                  </button>
                </motion.div>
              ) : pathname === "/focus" ? (
                <motion.div key="focus-actions" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} transition={{ duration: 0.2 }}>
                  <button onClick={() => setIsTimerSettingsOpen(true)} className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-zinc-400 transition-all hover:bg-white/10 hover:text-white active:scale-95">
                    <SlidersHorizontal className="h-4 w-4" />
                    <span>Timer Settings</span>
                  </button>
                </motion.div>
              ) : pathname === "/dopamine" ? (
                <motion.div key="dopamine-actions" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} transition={{ duration: 0.2 }} className="flex items-center gap-4">
                  <XpBadge xp={safeXp} level={level} pct={pct} variantId="dopamine" />
                  <button onClick={() => navigate({ to: "/dopamine/history" })} className="grid h-10 w-10 place-items-center rounded-full bg-white/5 border border-white/10 text-zinc-400 hover:bg-white/10 hover:text-white transition-all active:scale-95">
                    <History className="h-4 w-4" />
                  </button>
                </motion.div>
              ) : (
                <motion.div key="default-actions" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} transition={{ duration: 0.2 }} className="flex items-center gap-4">
                  <div className="flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-1.5">
                    <Flame className="h-4 w-4 text-orange-500" />
                    <span className="text-sm font-bold text-orange-50">{bestStreak}</span>
                  </div>
                  
                  <XpBadge xp={safeXp} level={level} pct={pct} variantId="default" />
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-zinc-800 text-sm font-bold text-white transition-all hover:border-white/30 focus:outline-none">
                      {profile?.avatar_url ? (
                        <img src={profile.avatar_url} alt="" className="h-full w-full rounded-full object-cover" />
                      ) : (
                        safeName.charAt(0).toUpperCase()
                      )}
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 border-white/10 bg-zinc-900/95 backdrop-blur-xl text-slate-100 rounded-2xl p-2 shadow-2xl">
                      <DropdownMenuLabel className="px-2 py-1.5">
                        <div className="text-sm font-bold">{safeName}</div>
                        <div className="truncate text-xs font-medium text-zinc-400">{user?.email}</div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator className="bg-white/10 my-1" />
                      <DropdownMenuItem onClick={() => navigate({ to: "/profile" })} className="cursor-pointer rounded-lg focus:bg-white/10 focus:text-white transition-colors">
                        <User className="mr-2 h-4 w-4" /> View profile
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setIsSettingsOpen(true)} className="cursor-pointer rounded-lg focus:bg-white/10 focus:text-white transition-colors">
                        <Settings className="mr-2 h-4 w-4" /> Settings
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={signOut} className="cursor-pointer rounded-lg text-red-400 focus:bg-red-500/20 focus:text-red-400 transition-colors">
                        <LogOut className="mr-2 h-4 w-4" /> Sign out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </header>
      </div>
      
      {/* MOBILE TOP HEADER (Simplified, Dock takes priority at bottom) */}
      <div className="lg:hidden flex items-center justify-between px-6 py-4">
         <Link to="/" className="flex items-center gap-3">
            <div className="h-8 w-8 overflow-hidden rounded-full">
              <img src="/outstand-logo.png" alt="Outstand Logo" className="h-full w-full object-cover" />
            </div>
            <div className="font-display text-base font-bold text-white">Outstand</div>
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger className="grid h-8 w-8 place-items-center rounded-full border border-white/10 bg-zinc-800 text-xs font-bold text-white">
              {profile?.avatar_url ? <img src={profile.avatar_url} alt="" className="h-full w-full rounded-full object-cover" /> : safeName.charAt(0).toUpperCase()}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 border-white/10 bg-zinc-900 text-slate-100">
               <DropdownMenuItem onClick={() => navigate({ to: "/profile" })}><User className="mr-2 h-4 w-4" /> Profile</DropdownMenuItem>
               <DropdownMenuItem onClick={() => setIsSettingsOpen(true)}><Settings className="mr-2 h-4 w-4" /> Settings</DropdownMenuItem>
               <DropdownMenuItem onClick={signOut} className="text-red-400"><LogOut className="mr-2 h-4 w-4" /> Sign out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
      </div>

      {/* MAIN CONTENT (Added pt-24 on large screens to account for the floating top dock) */}
      <AnimatePresence mode="wait">
        <motion.main key={pathname} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.3, ease: "easeOut" }} className="mx-auto w-full max-w-7xl flex-1 px-4 py-2 lg:pt-32">
          <Outlet />
        </motion.main>
      </AnimatePresence>
      
      {/* MOBILE PREMIUM BOTTOM DOCK */}
      <div className="pointer-events-none fixed bottom-6 left-0 right-0 z-50 flex justify-center px-4 lg:hidden">
        <nav className="pointer-events-auto flex items-center gap-1 rounded-[2rem] border border-white/10 bg-zinc-900/60 p-2 shadow-2xl backdrop-blur-3xl">
          {NAV.map((item) => {
            const isActive = pathname === item.to || (item.to !== "/" && pathname.startsWith(item.to));
            return (
              <Link key={item.to} to={item.to} className={cn("relative flex h-14 w-[4.5rem] flex-col items-center justify-center gap-1 rounded-2xl transition-all duration-300 active:scale-90", isActive ? "text-white" : "text-zinc-500 hover:text-zinc-300")}>
                {isActive && <motion.div layoutId="mobileNav" className="absolute inset-0 rounded-2xl bg-white/10 shadow-[0_0_20px_rgba(255,255,255,0.05)]" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />}
                <item.icon className={cn("relative z-10 h-5 w-5 transition-transform duration-300", isActive && "scale-110")} strokeWidth={isActive ? 2.5 : 2} />
                <span className="relative z-10 text-[9px] font-bold uppercase tracking-wider">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* ⚙️ SETTINGS SHEETS ⚙️ */}
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

      {/* AI ASSISTANT TEMPORARILY DISABLED 
        {isClient && user && <ChatAssistant />} 
      */}
    </div>
  );
        }
        
