import { motion } from "framer-motion";
import { LayoutDashboard, Timer, Sparkles, Flame } from "lucide-react";
import { Link, useLocation } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { id: "dashboard", path: "/", icon: LayoutDashboard, label: "Command" },
  { id: "focus", path: "/focus", icon: Timer, label: "Focus" },
  { id: "dopamine", path: "/dopamine", icon: Sparkles, label: "Matrix" },
  { id: "outstand", path: "/outstand", icon: Flame, label: "Missions" },
];

// Spring physics for the gliding active indicator
const dockSpring = {
  // typed for framer-motion
  type: "spring" as const,
  stiffness: 500,
  damping: 30,
};

export function CommandDock() {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <motion.div 
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.2 }}
      className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/10 bg-slate-950/80 p-2 shadow-[0_20px_40px_rgba(0,0,0,0.7)] backdrop-blur-2xl"
    >
      {NAV_ITEMS.map((item) => {
        const isActive = currentPath === item.path;
        const Icon = item.icon;

        return (
          <Link
            key={item.id}
            to={item.path}
            className="relative group flex h-12 w-16 flex-col items-center justify-center rounded-full outline-none"
          >
            {/* The Gliding Active Pill */}
            {isActive && (
              <motion.div
                layoutId="active-dock-pill"
                className="absolute inset-0 rounded-full border border-white/10 bg-white/[0.08] shadow-inner"
                transition={dockSpring}
              />
            )}

            {/* Icon and Label Container */}
            <div className="relative z-10 flex flex-col items-center justify-center gap-1">
              <Icon 
                className={cn(
                  "h-5 w-5 transition-all duration-300",
                  isActive 
                    ? "text-white scale-110 drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" 
                    : "text-slate-400 group-hover:text-slate-200 group-hover:scale-110"
                )} 
              />
              <span 
                className={cn(
                  "text-[9px] font-black uppercase tracking-widest transition-all duration-300",
                  isActive 
                    ? "text-white opacity-100" 
                    : "text-slate-500 opacity-0 group-hover:opacity-100 group-hover:-translate-y-0.5"
                )}
              >
                {item.label}
              </span>
            </div>

            {/* Hover Glow Effect */}
            {!isActive && (
              <div className="absolute inset-0 rounded-full bg-white/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            )}
          </Link>
        );
      })}
    </motion.div>
  );
}
