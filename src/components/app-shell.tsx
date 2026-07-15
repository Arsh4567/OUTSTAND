import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { Activity, Flame, LogOut, Timer, Zap, Brain, User } from "lucide-react";
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
  
  const { level, into, need } = levelFromXP(xp);
  const pct = Math.min(100, Math.round((into / need) * 100));
  
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const name = displayNameOf(user, profile);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    toast("Signed out");
    navigate({ to: "/auth", replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col pb-24 md:pb-0 overflow-x-hidden">
      
      <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 md:px-6">
          <Link to="/" className="flex min-w-0 items-center gap-3 group">
            <div className="h-9 w-9 overflow-hidden rounded-xl shadow-[0_0_15px_rgba(79,70,229,0.3)] transition-all duration-300 group-hover:shadow-[0_0_25px_rgba(79,70,229,0.6)] group-hover:scale-105">
              <img
                src="/outstand-logo.png"
                alt="Outstand Logo"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="min-w-0">
              <div className="truncate font-display text-lg font-black tracking-tight text-white">
                Outstand
              </div>
              <div className="hidden text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-400 sm:block">
                Focus • Discipline • Growth
              </div>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="ml-8 hidden flex-1 items-center gap-2 lg:flex">
            {NAV.map((item) => {
              const isActive = pathname === item.to || (item.to !== "/" && pathname.startsWith(item.to));
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "relative rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                    isActive ? "text-white" : "text-slate-400 hover:text-slate-200"
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="desktopNav"
                      className="absolute inset-0 rounded-lg bg-white/10"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex shrink-0 items-center gap-3 sm:gap-4">
            
            {/* Streak Badge */}
            <div className="hidden items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1.5 sm:flex">
              <Flame className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-bold text-orange-50">{bestStreak}</span>
              <span className="text-xs font-medium text-orange-500/70 uppercase tracking-wider">Streak</span>
            </div>

            {/* 🔥 PREMIUM LEVEL & XP RING 🔥 */}
            <div className="flex items-center gap-3 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1.5 shadow-inner">
              <div className="relative h-7 w-7 flex items-center justify-center">
                
                {/* 1. Level-Up Shockwave Effect */}
                <motion.div
                   key={`shockwave-${level}`}
                   initial={{ scale: 0.8, opacity: 1, borderWidth: "4px" }}
                   animate={{ scale: 2.5, opacity: 0, borderWidth: "0px" }}
                   transition={{ duration: 1, ease: "easeOut" }}
                   className="absolute inset-0 rounded-full border-indigo-400 pointer-events-none z-0"
                />

                <svg viewBox="0 0 36 36" className="h-7 w-7 -rotate-90 relative z-10 overflow-visible">
                  <circle cx="18" cy="18" r="15" fill="none" className="stroke-slate-800" strokeWidth="4" />
                  
                  {/* 2. Spring-Physics Glowing Ring */}
                  <motion.circle
                    cx="18" cy="18" r="15" fill="none"
                    stroke="url(#lvl)" strokeWidth="4" strokeLinecap="round"
                    initial={{ strokeDasharray: "0 94.25", filter: "drop-shadow(0px 0px 0px rgba(99,102,241,0))" }}
                    animate={{ 
                      strokeDasharray: `${(pct / 100) * 94.25} 94.25`,
                      filter: "drop-shadow(0px 0px 6px rgba(99,102,241,0.8))"
                    }}
                    transition={{ type: "spring", bounce: 0.4, duration: 1.5 }}
                  />
                  <defs>
                    <linearGradient id="lvl" x1="0" x2="1" y1="0" y2="1">
                      <stop offset="0%" stopColor="#818cf8" />
                      <stop offset="100%" stopColor="#4f46e5" />
                    </linearGradient>
                  </defs>
                </svg>
                
                <motion.span 
                  key={`lvl-${level}`}
                  initial={{ scale: 1.8, opacity: 0, rotate: -15 }}
                  animate={{ scale: 1, opacity: 1, rotate: 0 }}
                  transition={{ type: "spring", bounce: 0.6, duration: 0.8 }}
                  className="absolute inset-0 grid place-items-center text-[11px] font-black text-indigo-100 z-20"
                >
                  {level}
                </motion.span>
              </div>
              
              <div className="hidden text-xs sm:block">
                {/* 3. The Neon Text Pop */}
                <motion.div 
                  key={`xp-${xp}`}
                  initial={{ 
                    color: "#4ade80", 
                    scale: 1.3,
                    textShadow: "0px 0px 20px rgba(74,222,128,1)"
                  }}
                  animate={{ 
                    color: "#ffffff", 
                    scale: 1,
                    textShadow: "0px 0px 0px rgba(74,222,128,0)"
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 15 }}
                  className="font-black tabular-nums tracking-tight origin-left"
                >
                  {xp} XP
                </motion.div>
                <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">
                  Lv {level}
                </div>
              </div>
            </div>

            {/* Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger className="grid h-10 w-10 place-items-center rounded-full border-2 border-slate-700 bg-slate-800 text-sm font-bold text-white transition-all hover:border-indigo-500 hover:shadow-[0_0_15px_rgba(99,102,241,0.4)] focus:outline-none">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="h-full w-full rounded-full object-cover" />
                ) : (
                  name.charAt(0).toUpperCase()
                )}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-slate-900 border-white/10 text-slate-100">
                <DropdownMenuLabel>
                  <div className="font-bold text-base">{name}</div>
                  <div className="truncate text-xs font-medium text-slate-400">{user?.email}</div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem onClick={() => navigate({ to: "/profile" })} className="focus:bg-white/10 focus:text-white cursor-pointer">
                  <User className="mr-2 h-4 w-4" /> View profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={signOut} className="focus:bg-red-500/20 focus:text-red-400 cursor-pointer text-red-400">
                  <LogOut className="mr-2 h-4 w-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT WITH PAGE TRANSITIONS */}
      <AnimatePresence mode="wait">
        <motion.main 
          key={pathname}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 md:px-6 md:py-10"
        >
          <Outlet />
        </motion.main>
      </AnimatePresence>

      <footer className="mt-auto border-t border-white/5 py-8 text-center text-xs font-medium text-slate-500">
        Built to help you Outstand. <span className="text-slate-400">Stay quiet. Stay consistent.</span>
      </footer>

      {/* PREMIUM FLOATING BOTTOM NAV (Mobile Only) */}
      <div className="fixed bottom-6 left-0 right-0 z-50 flex justify-center px-4 lg:hidden pointer-events-none">
        <nav className="flex items-center gap-1 rounded-[2rem] border border-white/10 bg-slate-950/80 p-2 backdrop-blur-xl shadow-2xl pointer-events-auto">
          {NAV.map((item) => {
            const isActive = pathname === item.to || (item.to !== "/" && pathname.startsWith(item.to));
            
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "relative flex h-14 w-[4.5rem] flex-col items-center justify-center gap-1 rounded-2xl transition-all duration-300 active:scale-90",
                  isActive ? "text-white" : "text-slate-500 hover:text-slate-300"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="mobileNav"
                    className="absolute inset-0 rounded-2xl bg-indigo-500/20 shadow-[0_0_20px_rgba(99,102,241,0.15)]"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                
                <item.icon 
                  className={cn("relative z-10 h-5 w-5 transition-transform duration-300", isActive && "scale-110")} 
                  strokeWidth={isActive ? 2.5 : 2}
                />
                
                <span className="relative z-10 text-[9px] font-bold tracking-wider uppercase">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>

      {isClient && user && <ChatAssistant />}
    </div>
  );
}
