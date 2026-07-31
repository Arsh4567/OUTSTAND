import { Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
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
  const { level } = levelFromXP(safeXp);
  
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  
  const [isClient, setIsClient] = useState(false);
  
  // Sheet States
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTimerSettingsOpen, setIsTimerSettingsOpen] = useState(false);
  
  // App Preferences State
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [haptics, setHaptics] = useState(true);
  const [isNotificationsGranted, setIsNotificationsGranted] = useState(false);
  const [isTestingPush, setIsTestingPush] = useState(false);

  // Gamification: Supernova State
  const [showSupernova, setShowSupernova] = useState(false);
  const prevLevelRef = useRef(level);
  const hasHydratedRef = useRef(false);

  // Initialize and check for level-ups
  useEffect(() => {
    setIsClient(true);
    
    if (!hasHydratedRef.current) {
      hasHydratedRef.current = true;
      prevLevelRef.current = level;
      return;
    }

    if (level > prevLevelRef.current) {
      setShowSupernova(true);
    }
    
    prevLevelRef.current = level;
  }, [level]);

  useEffect(() => {
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
        toast.success("Test notification triggered! 🚀");
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
    <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-transparent pb-0 text-slate-50 transition-colors duration-300">
      
      {/* 🌟 SUPERNOVA LEVEL-UP OVERLAY 🌟 */}
      <AnimatePresence>
        {showSupernova && (
          <SupernovaEffect level={level} onClose={() => setShowSupernova(false)} />
        )}
      </AnimatePresence>

      <div className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/10 blur-[150px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-900/15 blur-[150px]" />
      </div>

      <AnimatePresence mode="wait">
        <motion.main 
          key={pathname} 
          initial={{ opacity: 0, y: 15 }} 
          animate={{ opacity: 1, y: 0 }} 
          exit={{ opacity: 0, y: -15 }} 
          transition={{ duration: 0.3, ease: "easeOut" }} 
          className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 relative z-10"
        >
          <Outlet />
        </motion.main>
      </AnimatePresence>
      
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

    </div>
  );
}

function SupernovaEffect({ level, onClose }: { level: number, onClose: () => void }) {
  const particles = Array.from({ length: 45 }).map((_, i) => {
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * 400 + 100; 
    return {
      id: i,
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance,
      size: Math.random() * 10 + 4,
      color: Math.random() > 0.5 ? "#fbbf24" : "#60a5fa", 
    };
  });

  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([200, 100, 200, 100, 500]);
    }
    
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center pointer-events-none overflow-hidden"
      initial={{ backgroundColor: "rgba(255, 255, 255, 1)" }}
      animate={{ backgroundColor: "rgba(3, 7, 18, 0.85)" }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute top-1/2 left-1/2 rounded-full"
          style={{ 
            backgroundColor: p.color, 
            width: p.size, 
            height: p.size,
            boxShadow: `0 0 20px ${p.color}` 
          }}
          initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
          animate={{ x: p.x, y: p.y, scale: Math.random() * 1.5 + 0.5, opacity: 0 }}
          transition={{ duration: 1.5 + Math.random(), ease: "easeOut" }}
        />
      ))}

      <motion.div 
        className="relative z-10 text-center flex flex-col items-center"
        initial={{ scale: 0.5, opacity: 0, y: 50 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ delay: 0.2, type: "spring", bounce: 0.6 }}
      >
        <motion.div 
          className="text-yellow-400 font-black tracking-widest uppercase mb-2 drop-shadow-[0_0_30px_rgba(250,204,21,0.6)]"
          style={{ fontSize: "clamp(3rem, 10vw, 6rem)" }}
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          Level Up
        </motion.div>
        
        <div className="bg-white/10 border border-white/20 backdrop-blur-md px-6 py-2 rounded-full text-white font-medium text-lg sm:text-2xl tracking-wide shadow-2xl">
          You reached Level <span className="text-blue-400 font-bold">{level}</span>
        </div>
      </motion.div>
    </motion.div>
  );
}
