import { createFileRoute } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Zap, 
  Sparkles, 
  Flame, 
  Trophy, 
  Target, 
  TrendingUp, 
  WifiOff, 
  CheckCircle2, 
  ChevronRight,
  Medal
} from "lucide-react";
import React, { useEffect, useState, useCallback, memo } from "react";
import { Button } from "@/components/ui/button";
import { useOutstand } from "@/hooks/use-outstand";
import { ChallengeCard } from "@/components/ChallengeCard";
import type { OutstandChallenge } from "@/lib/challenges.types";

// ============================================================================
// ROUTING & TYPES
// ============================================================================

type OutstandSearch = { challengeId?: string };

export const Route = createFileRoute("/_authenticated/outstand")({
  validateSearch: (search: Record<string, unknown>): OutstandSearch => ({
    challengeId: search.challengeId as string | undefined,
  }),
  component: OutstandPage,
});

interface DailyMission {
  id: string;
  title: string;
  xp: number;
  completed: boolean;
}

interface UserStats {
  streak: number;
  xp: number;
  level: number;
  nextLevelXp: number;
}

interface GamificationHUDProps {
  stats: UserStats;
}

interface FocusEngineProps {
  challenge: OutstandChallenge | null;
  isShuffling: boolean;
  shuffleDisplay: { emoji: string; title: string };
  completionStage: number;
  running: boolean;
  mins: string;
  secs: string;
  setRunning: (state: boolean) => void;
  setRemaining: (time: number) => void;
  generate: () => void;
  complete: () => void;
}

const cinematicEase = [0.19, 1, 0.22, 1];

// ============================================================================
// UTILITIES
// ============================================================================

// Native Haptic Engine for supported mobile devices
const triggerHaptic = (type: "light" | "success" | "heavy") => {
  if (typeof window === "undefined" || !navigator.vibrate) return;
  switch (type) {
    case "light": navigator.vibrate(15); break;
    case "success": navigator.vibrate([15, 30, 20]); break;
    case "heavy": navigator.vibrate(40); break;
  }
};

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export function OutstandPage() {
 const { challengeId } = Route.useSearch({ strict: false });
  const {
    challenge, running, setRunning, setRemaining, isShuffling,
    shuffleDisplay, completionStage, generate, complete, mins, secs, loadChallenge,
  } = useOutstand();

  // Network State
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  // Gamification State
  const [userStats, setUserStats] = useState<UserStats>({
    streak: 12,
    xp: 1850,
    level: 4,
    nextLevelXp: 2000,
  });

  const [missions, setMissions] = useState<DailyMission[]>([
    { id: "m1", title: "Complete 1 Deep Focus Session", xp: 100, completed: false },
    { id: "m2", title: "Zero Phone Check for 15m", xp: 150, completed: true },
    { id: "m3", title: "Review Math Chapter 4", xp: 200, completed: false },
  ]);

  // Floating XP Animation State
  const [xpGains, setXpGains] = useState<{ id: string; x: number; y: number; amount: number }[]>([]);

  // Deep Link Auto-loader
  useEffect(() => {
    if (challengeId && loadChallenge) {
      const timer = setTimeout(() => loadChallenge(challengeId), 150);
      return () => clearTimeout(timer);
    }
  }, [challengeId, loadChallenge]);

  // Network Listeners
  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  // Optimized Mission Handler with coordinates for Floating XP
  const handleMissionToggle = useCallback((missionId: string, event: React.MouseEvent | React.KeyboardEvent) => {
    setMissions((prev) => prev.map((m) => {
      if (m.id === missionId) {
        const isCompleting = !m.completed;
        
        if (isCompleting) {
          triggerHaptic("success");
          // Trigger floating XP at click/enter location
          let rect = { left: window.innerWidth / 2, top: window.innerHeight / 2 };
          if ('clientX' in event) {
            rect = { left: event.clientX, top: event.clientY };
          } else if (event.currentTarget instanceof Element) {
            const bound = event.currentTarget.getBoundingClientRect();
            rect = { left: bound.left + bound.width / 2, top: bound.top };
          }
          
          const newGain = { id: Date.now().toString(), x: rect.left, y: rect.top, amount: m.xp };
          setXpGains(curr => [...curr, newGain]);
          setTimeout(() => setXpGains(curr => curr.filter(x => x.id !== newGain.id)), 1200);

          setUserStats(s => ({ ...s, xp: Math.min(s.nextLevelXp, s.xp + m.xp) }));
        } else {
          triggerHaptic("light");
          setUserStats(s => ({ ...s, xp: Math.max(0, s.xp - m.xp) }));
        }
        return { ...m, completed: isCompleting };
      }
      return m;
    }));
  }, []);

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex flex-col items-center justify-between p-4 sm:p-8 bg-background text-foreground font-sans overflow-hidden selection:bg-primary/30">
      
      <EnvironmentEffects completionStage={completionStage} />
      <OfflineBanner isOnline={isOnline} />

      {/* Floating XP Micro-interactions Layer */}
      <AnimatePresence>
        {xpGains.map(gain => (
          <motion.div
            key={gain.id}
            initial={{ opacity: 1, y: gain.y - 20, x: gain.x - 20, scale: 0.5 }}
            animate={{ opacity: 0, y: gain.y - 100, scale: 1.5 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="fixed z-50 text-2xl font-black text-primary drop-shadow-[0_0_15px_var(--color-primary)] pointer-events-none"
          >
            +{gain.amount} XP
          </motion.div>
        ))}
      </AnimatePresence>

      <div className="w-full max-w-5xl z-20 flex flex-col items-center gap-8 h-full flex-grow">
        
        {/* Top HUD */}
        <GamificationHUD stats={userStats} />

        {/* Center Focus Engine */}
        <main className="w-full max-w-sm md:max-w-2xl lg:max-w-4xl flex-grow flex items-center justify-center relative perspective-[1000px] py-8">
          <FocusEngine 
            challenge={challenge}
            isShuffling={isShuffling}
            shuffleDisplay={shuffleDisplay}
            completionStage={completionStage}
            running={running}
            mins={mins}
            secs={secs}
            setRunning={setRunning}
            setRemaining={setRemaining}
            generate={generate}
            complete={complete}
          />
        </main>

        {/* Bottom Mission Board */}
        <MissionBoard missions={missions} onToggle={handleMissionToggle} />
      </div>
    </div>
  );
}

// ============================================================================
// STRICTLY TYPED SUB-COMPONENTS (Memoized for peak performance)
// ============================================================================

const EnvironmentEffects = memo(({ completionStage }: { completionStage: number }) => (
  <>
    <motion.div 
      animate={{ opacity: completionStage === 1 ? 1 : 0, backdropFilter: completionStage === 1 ? "blur(40px)" : "blur(0px)" }}
      transition={{ duration: 1.5, ease: cinematicEase }}
      className="absolute inset-0 z-30 pointer-events-none bg-black/85" 
    />
    <div className="absolute inset-0 z-0 pointer-events-none opacity-20 mesh-bg" />
    <div className="absolute inset-0 z-0 pointer-events-none opacity-15">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--color-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border)_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)]" />
    </div>
    <motion.div 
      className="absolute inset-0 opacity-30 z-0 pointer-events-none mix-blend-screen"
      animate={{ rotate: 360, scale: [1, 1.08, 1] }}
      transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
      style={{ backgroundImage: "radial-gradient(circle 50vw at 50% 15%, oklch(0.55 0.2 260 / 0.18), transparent 60%), radial-gradient(circle 45vw at 85% 85%, oklch(0.65 0.2 285 / 0.12), transparent 50%)" }}
    />
  </>
));
EnvironmentEffects.displayName = "EnvironmentEffects";


const GamificationHUD = memo(({ stats }: GamificationHUDProps) => {
  const xpPercentage = Math.min(100, Math.round((stats.xp / stats.nextLevelXp) * 100));
  const isLevelUp = xpPercentage === 100;

  return (
    <header className="w-full grid grid-cols-1 sm:grid-cols-3 gap-3">
      {/* Streak */}
      <div className="glass-card spotlight-card p-4 flex items-center justify-between group">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Flame className="h-5 w-5 fill-orange-500 text-orange-500 animate-pulse" />
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Active Streak</p>
            <h2 className="text-xl font-black tracking-tight">{stats.streak} Days</h2>
          </div>
        </div>
      </div>

      {/* XP Progress */}
      <div className="glass-card spotlight-card p-4 flex flex-col justify-center relative overflow-hidden group">
        {isLevelUp && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} 
            className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 animate-pulse pointer-events-none" 
          />
        )}
        <div className="flex items-center justify-between mb-2 relative z-10">
          <div className="flex items-center gap-2">
            {isLevelUp ? <Medal className="h-4 w-4 text-warning" /> : <Trophy className="h-4 w-4 text-primary" />}
            <span className="text-[10px] font-bold uppercase tracking-widest">
              {isLevelUp ? "Level Up Ready!" : `Level ${stats.level} Scholar`}
            </span>
          </div>
          <span className="text-xs font-mono font-bold text-primary">{stats.xp} / {stats.nextLevelXp}</span>
        </div>
        <div className="w-full h-2 rounded-full bg-secondary overflow-hidden relative z-10">
          <motion.div 
            className={`h-full rounded-full ${isLevelUp ? 'bg-warning shadow-[0_0_10px_var(--color-warning)]' : 'bg-gradient-to-r from-primary to-accent'}`}
            initial={{ width: 0 }}
            animate={{ width: `${xpPercentage}%` }}
            transition={{ type: "spring", stiffness: 50, damping: 15 }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="glass-card spotlight-card p-4 flex items-center justify-between group">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
            <TrendingUp className="h-5 w-5 text-emerald-500" />
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Focus Time</p>
            <h2 className="text-xl font-black tracking-tight">4.5 Hrs</h2>
          </div>
        </div>
        <div className="text-emerald-500 text-xs font-bold bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-500/20">
          Top 10%
        </div>
      </div>
    </header>
  );
});
GamificationHUD.displayName = "GamificationHUD";


const FocusEngine = memo(({ 
  challenge, isShuffling, shuffleDisplay, completionStage, running, mins, secs, setRunning, setRemaining, generate, complete 
}: FocusEngineProps) => {
  return (
    <AnimatePresence mode="wait">
      {!challenge && !isShuffling ? (
        <motion.div
          key="idle"
          initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
          transition={{ duration: 0.8, ease: cinematicEase }}
          className="text-center space-y-10"
        >
          <div className="space-y-4 relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-primary/20 blur-[100px] rounded-full pointer-events-none" />
            
            <motion.div 
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-surface-2 border border-border text-primary text-xs font-bold uppercase tracking-[0.2em] shadow-sm"
            >
              <Sparkles className="h-3.5 w-3.5 animate-pulse" /> Board Exam Protocol
            </motion.div>
            
            <h1 className="text-5xl sm:text-7xl md:text-8xl font-black tracking-tighter gradient-text drop-shadow-[0_0_40px_rgba(99,102,241,0.2)] pb-2">
              Outstand.
            </h1>
            <p className="text-muted-foreground text-base sm:text-lg font-medium tracking-wide max-w-md mx-auto px-4">
              Defeat distraction. Gamify your deep work.
            </p>
          </div>

          <motion.div whileHover="hover" whileTap="tap" initial="idle" className="relative inline-flex items-center justify-center mt-4">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 14, repeat: Infinity, ease: "linear" }} className="absolute inset-[-24px] rounded-full border border-primary/20 border-t-primary/60" />
            <motion.div animate={{ rotate: -360 }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }} className="absolute inset-[-12px] rounded-full border border-dashed border-accent/30" />
            
            <motion.div variants={{ idle: { scale: 1 }, hover: { scale: 1.05 }, tap: { scale: 0.95 } }} transition={{ type: "spring", stiffness: 400, damping: 20 }}>
              <Button 
                onClick={() => { triggerHaptic("heavy"); generate(); }}
                className="btn-primary relative h-28 w-28 sm:h-32 sm:w-32 rounded-full overflow-hidden group flex items-center justify-center cursor-pointer border border-white/20"
              >
                <Zap className="h-12 w-12 sm:h-14 sm:w-14 fill-current drop-shadow-[0_0_15px_rgba(255,255,255,0.8)] relative z-20" />
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>

      ) : isShuffling ? (
        <motion.div
          key="shuffling"
          initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.1 }}
          transition={{ duration: 0.5, ease: cinematicEase }}
          className="glass-card p-12 sm:p-16 rounded-[3rem] flex flex-col items-center justify-center space-y-8 relative overflow-hidden border border-primary/40 shadow-[0_0_100px_var(--color-primary-glow)]"
        >
          <motion.div animate={{ y: ["-100%", "200%"] }} transition={{ duration: 0.6, repeat: Infinity, ease: "linear" }} className="absolute left-0 right-0 h-[2px] bg-primary/80 blur-[2px] shadow-[0_0_20px_var(--color-primary)]" />
          <motion.div animate={{ y: [-10, 10, -10], filter: ["blur(2px)", "blur(6px)", "blur(2px)"] }} transition={{ duration: 0.15, repeat: Infinity, ease: "linear" }} className="text-8xl sm:text-9xl">
            {shuffleDisplay.emoji}
          </motion.div>
          <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 0.2, repeat: Infinity }} className="text-xl sm:text-2xl font-black text-primary font-mono uppercase tracking-[0.4em] text-center">
            {shuffleDisplay.title}
          </motion.div>
        </motion.div>

      ) : challenge ? (
        <motion.div key="active" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", damping: 25, stiffness: 200, mass: 1 }} className="w-full">
          <ChallengeCard 
            challenge={challenge} 
            completionStage={completionStage} 
            running={running} 
            mins={mins} 
            secs={secs} 
            setRunning={setRunning} 
            setRemaining={setRemaining} 
            generate={generate} 
            complete={complete} 
          />
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
});
FocusEngine.displayName = "FocusEngine";


const MissionBoard = memo(({ missions, onToggle }: { missions: DailyMission[], onToggle: (id: string, e: React.MouseEvent | React.KeyboardEvent) => void }) => {
  return (
    <footer className="w-full max-w-2xl mt-4">
      <div className="glass-card p-5 sm:p-6 rounded-3xl border border-border">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary animate-float" />
            <h3 className="font-bold text-sm sm:text-base tracking-tight">Daily Quests</h3>
          </div>
          <span className="text-[10px] sm:text-xs text-muted-foreground font-bold uppercase tracking-widest bg-secondary px-2 py-1 rounded-md">Resets at Midnight</span>
        </div>

        <div className="space-y-3">
          {missions.map((mission) => (
            <motion.div
              key={mission.id}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={(e) => onToggle(mission.id, e)}
              onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onToggle(mission.id, e)}
              role="button"
              tabIndex={0}
              aria-pressed={mission.completed}
              className={`p-3 sm:p-4 rounded-2xl border flex items-center justify-between cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary transition-all duration-300 ${
                mission.completed 
                  ? "bg-primary/10 border-primary/30 text-primary-foreground opacity-75" 
                  : "bg-surface-2 border-border hover:border-primary/40 hover:shadow-lg text-foreground"
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`h-7 w-7 rounded-xl flex items-center justify-center border-2 transition-all duration-300 ${
                  mission.completed ? "bg-primary border-primary text-white scale-110 shadow-[0_0_15px_var(--color-primary)]" : "border-muted-foreground/30 bg-background"
                }`}>
                  <AnimatePresence>
                    {mission.completed && (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                        <CheckCircle2 className="h-4 w-4" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
             <span className={`text-sm sm:text-base font-semibold transition-all ${mission.completed ? 'line-through text-muted-foreground' : ''}`}>
                  {mission.title}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-md transition-colors ${mission.completed ? 'bg-transparent text-primary/50' : 'bg-primary/20 text-primary'}`}>
                  +{mission.xp} XP
                </span>
                <ChevronRight className={`h-4 w-4 transition-colors ${mission.completed ? 'text-primary/50' : 'text-muted-foreground'}`} />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </footer>
  );
});
MissionBoard.displayName = "MissionBoard";

const OfflineBanner = memo(({ isOnline }: { isOnline: boolean }) => (
  <AnimatePresence>
    {!isOnline && (
      <motion.div
        initial={{ opacity: 0, y: -40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -40, scale: 0.95 }}
        className="fixed top-4 z-50 w-[calc(100%-2rem)] max-w-md mx-auto px-4 py-3 rounded-2xl bg-destructive/90 backdrop-blur-xl border border-destructive shadow-[0_20px_40px_rgba(0,0,0,0.4)] flex items-center gap-3 text-sm font-semibold text-white"
      >
        <WifiOff className="h-5 w-5 animate-pulse" />
        <p>Offline Mode. Local sessions will sync later.</p>
      </motion.div>
    )}
  </AnimatePresence>
));
OfflineBanner.displayName = "OfflineBanner";   
