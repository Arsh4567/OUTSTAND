import React, { useState } from "react";
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
  User
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

// Motion variants for staggering the list items
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  show: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
};

export default function SidebarLayout({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const { user, profile } = useAuth();
  const { xp } = useAppState();
  
  const safeXp = xp || 0;
  const { level } = levelFromXP(safeXp);
  const safeName = displayNameOf(user, profile) || "Student";

  return (
    <div className="min-h-screen bg-[#050508] flex flex-col font-sans">
      {/* Top Bar - Clean and minimal */}
      <header className="sticky top-0 z-40 flex h-16 items-center px-4 backdrop-blur-md bg-[#050508]/80 border-b border-white/5">
        <button
          onClick={() => setIsOpen(true)}
          className="p-2 -ml-2 text-slate-400 hover:text-cyan-400 hover:scale-110 transition-all duration-300"
        >
          <Menu className="h-6 w-6" />
        </button>
      </header>

      {/* Main Content */}
      <div className="flex-1 w-full max-w-7xl mx-auto">
        {children}
      </div>

      {/* Sidebar Overlay & Menu */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md"
            />

            {/* Side Drawer */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%", transition: { ease: "easeInOut", duration: 0.3 } }}
              transition={{ type: "spring", bounce: 0, duration: 0.5 }}
              className="fixed top-0 left-0 bottom-0 z-50 w-72 bg-gradient-to-b from-[#0a0f1a] to-[#050810] border-r border-blue-500/20 shadow-[0_0_30px_rgba(0,0,0,0.8)] flex flex-col"
            >
              <div className="p-4 flex justify-end">
                <button 
                  onClick={() => setIsOpen(false)} 
                  className="text-slate-500 hover:text-white hover:rotate-90 transition-all duration-300"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Profile Section - Glowing & Clickable */}
              <Link
                to="/profile"
                onClick={() => setIsOpen(false)}
                className="px-6 pb-6 flex items-center gap-4 border-b border-white/10 group transition-all duration-300 hover:bg-white/5"
              >
                <div className="relative h-14 w-14 rounded-full border-2 border-cyan-500/50 flex items-center justify-center bg-cyan-900/20 overflow-hidden group-hover:border-cyan-400 group-hover:shadow-[0_0_15px_rgba(34,211,238,0.4)] transition-all duration-500">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <User className="h-7 w-7 text-cyan-400 group-hover:scale-110 transition-transform duration-300" />
                  )}
                </div>
                <div className="flex flex-col justify-center">
                  <h3 className="text-white font-bold text-lg group-hover:text-cyan-300 transition-colors truncate max-w-[140px] drop-shadow-[0_2px_10px_rgba(255,255,255,0.1)]">
                    {safeName}
                  </h3>
                  <p className="text-cyan-400 text-[11px] font-bold tracking-[0.2em] uppercase drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]">
                    Level {level} Scholar
                  </p>
                </div>
              </Link>

              {/* Navigation Items - Staggered entrance */}
              <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="flex-1 overflow-y-auto py-6 px-4 space-y-1.5 scrollbar-hide"
              >
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
                            ? "bg-blue-600/15 border border-blue-500/30 shadow-[inset_0_0_20px_rgba(59,130,246,0.1)]" 
                            : "hover:bg-white/5 border border-transparent hover:border-white/5"
                        )}
                      >
                        {/* Active Indicator Bar */}
                        {isActive && (
                          <motion.div 
                            layoutId="activeNavIndicator"
                            className="absolute left-0 top-2 bottom-2 w-1 bg-blue-500 rounded-r-full shadow-[0_0_10px_rgba(59,130,246,1)]"
                          />
                        )}
                        
                        <item.icon 
                          className={cn(
                            "h-5 w-5 transition-transform duration-300", 
                            isActive ? "text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]" : "text-slate-400 group-hover:text-slate-200 group-hover:scale-110"
                          )} 
                        />
                        <span 
                          className={cn(
                            "font-medium tracking-wide transition-all duration-300 group-hover:translate-x-1",
                            isActive ? "text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]" : "text-slate-400 group-hover:text-slate-200"
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
              <div className="p-4 mt-auto">
                <Link
                  to="/regain"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 w-full px-4 py-4 rounded-2xl border border-red-500/20 bg-red-500/5 text-slate-300 hover:bg-red-500/10 hover:border-red-500/40 hover:shadow-[0_0_20px_rgba(239,68,68,0.15)] transition-all duration-300 group"
                >
                  <ShieldAlert className="h-5 w-5 text-red-400 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300 drop-shadow-[0_0_5px_rgba(239,68,68,0.5)]" />
                  <span className="font-semibold text-sm tracking-wide group-hover:text-red-100 transition-colors">
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
