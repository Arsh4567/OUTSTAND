import React, { useState, useEffect } from 'react';
import { Link, useRouterState } from '@tanstack/react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Menu, X, Home, BookOpen, 
  ShieldAlert, Trophy, User, ChevronRight, Sparkles 
} from 'lucide-react';

const NAV_ITEMS = [
  { name: 'Dashboard', path: '/dashboard', icon: Home },
  { name: 'Study Hub', path: '/study', icon: BookOpen },
  { name: 'Leaderboard', path: '/leaderboard', icon: Trophy },
  { name: 'Regain Protocol', path: '/regain', icon: ShieldAlert, emergency: true },
];

// 1. Framer Motion Animation Blueprints (The Stagger Effect)
const sidebarVariants = {
  hidden: { x: '-100%', opacity: 0.8 },
  visible: { 
    x: 0, 
    opacity: 1,
    transition: { type: 'spring', damping: 25, stiffness: 250, staggerChildren: 0.05, delayChildren: 0.1 }
  },
  exit: { 
    x: '-100%', 
    opacity: 0,
    transition: { type: 'spring', damping: 25, stiffness: 200 } 
  }
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 300 } }
};

export default function SidebarLayout({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const routerState = useRouterState();

  // 2. Haptic Feedback Engine
  const triggerHaptic = (intensity: number = 15) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(intensity);
    }
  };

  const toggleMenu = (state: boolean) => {
    setIsOpen(state);
    triggerHaptic(state ? 20 : 10); // Heavier thud on open, lighter tap on close
  };

  useEffect(() => {
    setIsOpen(false);
  }, [routerState.location.pathname]);

  const [touchStart, setTouchStart] = useState<number | null>(null);
  
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart) return;
    const touchEnd = e.changedTouches[0].clientX;
    const distance = touchStart - touchEnd;
    
    if (distance < -50 && touchStart < 50) toggleMenu(true);
    if (distance > 50 && isOpen) toggleMenu(false);
  };

  return (
    <div 
      className="min-h-screen bg-[#030712] text-slate-100 font-sans overflow-x-hidden selection:bg-cyan-500/30"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Sleeker Header with Glassmorphism */}
      <header className="fixed top-0 left-0 w-full h-16 z-40 flex items-center px-4 bg-[#030712]/60 backdrop-blur-xl border-b border-white/5">
        <button 
          onClick={() => toggleMenu(true)}
          className="p-2 -ml-2 text-slate-400 hover:text-cyan-400 transition-colors focus:outline-none"
        >
          <Menu className="w-6 h-6" />
        </button>
        <div className="ml-4 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cyan-500" />
          <span className="font-display font-bold tracking-[0.2em] uppercase text-xs text-white/90">
            Outstand
          </span>
        </div>
      </header>

      <main className="pt-16 min-h-screen">
        {children}
      </main>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Darker, deeper blur for the background overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={() => toggleMenu(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md z-50"
            />

            <motion.div
              variants={sidebarVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="fixed top-0 left-0 h-full w-[80vw] max-w-[320px] bg-gradient-to-b from-[#0a0e17] to-[#03050a] border-r border-white/10 z-50 flex flex-col shadow-[20px_0_40px_rgba(0,0,0,0.7)]"
            >
              {/* Premium Profile Section */}
              <div className="p-6 border-b border-white/5 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-blue-500/5 blur-3xl rounded-full" />
                <button 
                  onClick={() => toggleMenu(false)}
                  className="absolute top-4 right-4 p-2 text-slate-500 hover:text-white transition-colors z-10"
                >
                  <X className="w-5 h-5" />
                </button>
                
                <motion.div variants={itemVariants} className="flex items-center gap-4 mt-6 relative z-10">
                  <div className="w-14 h-14 rounded-full bg-slate-900 border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.2)] flex items-center justify-center overflow-hidden">
                    <User className="w-7 h-7 text-cyan-400" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-white tracking-wide text-lg">Recruit #042</span>
                    <span className="text-xs text-cyan-400 font-mono tracking-widest uppercase mt-0.5">Level 12 Scholar</span>
                  </div>
                </motion.div>
              </div>

              {/* Staggered Navigation Links */}
              <nav className="flex-1 overflow-y-auto py-6 px-4 flex flex-col gap-2">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isActive = routerState.location.pathname.startsWith(item.path);
                  
                  return (
                    <motion.div variants={itemVariants} key={item.path}>
                      <Link
                        to={item.path}
                        onClick={() => triggerHaptic(10)}
                        className={`
                          flex items-center justify-between p-4 rounded-xl transition-all duration-300 group
                          ${isActive 
                            ? 'bg-gradient-to-r from-cyan-500/10 to-transparent text-cyan-400 border border-cyan-500/20 shadow-[inset_4px_0_0_rgba(6,182,212,1)]' 
                            : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                          }
                          ${item.emergency ? 'mt-8 border border-red-900/30 text-red-400 hover:bg-red-900/10 hover:text-red-300 shadow-none' : ''}
                        `}
                      >
                        <div className="flex items-center gap-4">
                          <Icon className={`w-5 h-5 transition-transform duration-300 group-hover:scale-110 ${isActive ? 'drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]' : ''}`} />
                          <span className="font-medium tracking-wide">{item.name}</span>
                        </div>
                        <ChevronRight className={`w-4 h-4 transition-all duration-300 ${isActive ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2 group-hover:opacity-50 group-hover:translate-x-0'}`} />
                      </Link>
                    </motion.div>
                  );
                })}
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
                  }
