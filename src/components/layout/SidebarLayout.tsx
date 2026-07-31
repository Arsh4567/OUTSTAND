import React, { useState, useEffect } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu,
  X,
  Home,
  Trophy,
  ShieldAlert,
  Timer,
  Zap,
  Brain,
  User,
  Target
} from "lucide-react";
import { useAuth, displayNameOf } from "@/hooks/use-auth";
import { useAppState } from "@/hooks/use-app-state";
import { levelFromXP } from "@/lib/habits";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", icon: Home },
  { to: "/focus", label: "Focus", icon: Timer },
  { to: "/dopamine", label: "Dopamine", icon: Brain },
  { to: "/outstand", label: "Outstand", icon: Zap },
  { to: "/league", label: "Leaderboard", icon: Trophy },
];

// Refined buttery-smooth easing curve
const customEase = [0.22, 1, 0.36, 1];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.15,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  show: { 
    opacity: 1, 
    x: 0, 
    transition: { type: "spring", stiffness: 300, damping: 24 } 
  },
};

export default function SidebarLayout({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const { user, profile } = useAuth();
  const { xp } = useAppState();
  
  const safeXp = xp || 0;
  const { level } = levelFromXP(safeXp);
  const safeName = displayNameOf(user, profile) || "Student";

  // Lock background scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  return (
    <div className="min-h-screen bg-[#030508] flex flex-col font-sans selection:bg-blue-500/30">
      
      {/* Enhanced Top Bar */}
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between px-4 backdrop-blur-xl bg-[#030508]/80 border-b border-white/5 shadow-sm">
        <button
          onClick={() => setIsOpen(true)}
          className="p-2 -ml-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all duration-300 active:scale-95"
        >
          <Menu className="h-6 w-6" />
        </button>

        {/* Center Brand */}
        <div className="flex items-center gap-2 absolute left-1/2 -translate-x-1/2">
          <Target className="h-5 w-5 text-blue-500 drop-shadow-[0_0_10px_rgba(59,130,246,0.6)]" />
          <span className="font-black text-lg text-white tracking-[0.2em] uppercase">Outstand</span>
        </div>

        {/* Right side placeholder (keeps brand centered) */}
        <div className="w-10" /> 
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto relative">
        {/* Subtle background noise/gradient for depth */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/5 via-transparent to-transparent pointer-events-none" />
        <div className="relative z-10">
          {children}
        </div>
      </main>

      {/* Sidebar Overlay & Menu */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Cinematic Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.3 } }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md"
            />

            {/* High-Tech Side Drawer */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ ease: customEase, duration: 0.5 }}
              className="fixed top-0 left-0 bottom-0 z-50 w-[280px] sm:w-80 bg-[#050810] border-r border-white/5 shadow-[20px_0_40px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden"
            >
              {/* Subtle Grid Background inside drawer */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none mix-blend-overlay" />

              <div className="p-5 flex justify-end relative z-10">
                <button 
                  onClick={() => setIsOpen(false)} 
                  className="p-2 rounded-full bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all duration-300 group"
                >
                  <X className="h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
                </button>
              </div>

              {/* Profile Section - Glowing & Clickable */}
              <Link
                to="/profile"
                onClick={() => setIsOpen(false)}
                className="px-6 pb-8 pt-2 flex items-center gap-4 border-b border-white/5 group transition-all duration-300 hover:bg-white/[0.02] relative z-10"
              >
                <div className="relative h-14 w-14 rounded-full border-2 border-cyan-500/30 flex items-center justify-center bg-cyan-950/40 overflow-hidden group-hover:border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.1)] group-hover:shadow-[0_0_20px_rgba(34,211,238,0.4)] transition-all duration-500 shrink-0">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <User className="h-6 w-6 text-cyan-400 group-hover:scale-110 transition-transform duration-300" />
                  )}
                </div>
                <div className="flex flex-col justify-center overflow-hidden">
                  <h3 className="text-white font-bold text-lg group-hover:text-cyan-300 transition-colors truncate drop-shadow-[0_2px_10px_rgba(255,255,255,0.1)]">
                    {safeName}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="flex h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_5px_rgba(34,211,238,0.8)] animate-pulse" />
                    <p className="text-cyan-400 text-[10px] font-bold tracking-[0.2em] uppercase drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]">
                      Lvl {level} Scholar
                    </p>
                  </div>
                </div>
              </Link>

              {/* Navigation Items */}
              <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="flex-1 overflow-y-auto py-6 px-4 space-y-2 scrollbar-hide relative z-10"
              >
                <div className="px-3 mb-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">
                  Main Directives
                </div>
                
                {NAV_ITEMS.map((item) => {
                  const isActive = pathname === item.to || (item.to !== "/" && pathname.startsWith(item.to));
                  return (
                    <motion.div key={item.to} variants={itemVariants}>
                      <Link
                        to={item.to}
                        onClick={() => setIsOpen(false)}
                        className={cn(
                          "group flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-300 overflow-hidden relative",
                          isActive 
                            ? "bg-blue-600/10 border border-blue-500/20 shadow-[inset_0_0_20px_rgba(59,130,246,0.05)]" 
                            : "hover:bg-white/5 border border-transparent hover:border-white/5"
                        )}
                      >
                        {/* Active Indicator Bar */}
                        {isActive && (
                          <motion.div 
                            layoutId="activeNavIndicator"
                            className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-blue-500 rounded-r-full shadow-[0_0_10px_rgba(59,130,246,0.8)]"
                          />
                        )}
                        
                        <item.icon 
                          className={cn(
                            "h-5 w-5 transition-all duration-300", 
                            isActive 
                              ? "text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.8)] scale-110" 
                              : "text-slate-500 group-hover:text-slate-300 group-hover:scale-110"
                          )} 
                        />
                        <span 
                          className={cn(
                            "font-bold tracking-wide transition-all duration-300 group-hover:translate-x-1",
                            isActive 
                              ? "text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]" 
                              : "text-slate-400 group-hover:text-white"
                          )}
                        >
                          {item.label}
                        </span>
                      </Link>
                    </motion.div>
                  );
                })}
              </motion.div>

              {/* Regain Protocol - Isolated Red Action */}
              <div className="p-4 mt-auto border-t border-white/5 relative z-10 bg-[#050810]/80 backdrop-blur-md">
                <Link
                  to="/regain"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-center gap-3 w-full px-4 py-4 rounded-xl border border-red-500/20 bg-red-500/5 text-slate-300 hover:bg-red-500/10 hover:border-red-500/40 hover:shadow-[0_0_20px_rgba(239,68,68,0.15)] transition-all duration-300 group overflow-hidden relative"
                >
                  {/* Subtle red background flare on hover */}
                  <div className="absolute inset-0 bg-gradient-to-r from-red-500/0 via-red-500/5 to-red-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  <ShieldAlert className="h-5 w-5 text-red-400 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300 drop-shadow-[0_0_5px_rgba(239,68,68,0.5)] relative z-10" />
                  <span className="font-bold text-sm tracking-[0.05em] uppercase text-red-400/80 group-hover:text-red-300 transition-colors relative z-10">
                    Regain Protocol
                  </span>
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
      }
                    
