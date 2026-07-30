// src/hooks/use-app-state.ts
import { useMemo } from "react";
import { useLocalStorage } from "@/hooks/use-local-storage";
import {
  computeStreak,
  todayISO,
  XP_PER_FOCUS,
  XP_PER_HABIT,
  type FocusSession,
  type Habit,
  type OutstandCompletion,
} from "@/lib/habits";

const seedHabits: Habit[] = [
  {
    id: "h1",
    name: "Read 20 minutes",
    emoji: "📚",
    color: "primary",
    createdAt: new Date().toISOString(),
    history: [],
  },
  {
    id: "h2",
    name: "Deep work session",
    emoji: "🧠",
    color: "accent",
    createdAt: new Date().toISOString(),
    history: [],
  },
  {
    id: "h3",
    name: "Exercise / stretch",
    emoji: "🏃",
    color: "success",
    createdAt: new Date().toISOString(),
    history: [],
  },
  {
    id: "h4",
    name: "No phone before class",
    emoji: "📵",
    color: "warning",
    createdAt: new Date().toISOString(),
    history: [],
  },
];

export function useAppState() {
  // 1. Fetch raw data from local storage
  const [rawHabits, setHabits] = useLocalStorage<Habit[]>("ht.habits.v1", seedHabits);
  const [rawSessions, setSessions] = useLocalStorage<FocusSession[]>("ht.sessions.v1", []);
  const [rawOutstand, setOutstand] = useLocalStorage<OutstandCompletion[]>("ht.outstand.v1", []);

  // 2. SANITIZATION: Guarantee these are ALWAYS arrays to prevent .reduce() and .filter() crashes
  const habits = Array.isArray(rawHabits) ? rawHabits : seedHabits;
  const sessions = Array.isArray(rawSessions) ? rawSessions : [];
  const outstand = Array.isArray(rawOutstand) ? rawOutstand : [];

  const xp = useMemo(() => {
    // 3. SAFE MATH: Use optional chaining (?.) and fallbacks (|| 0)
    const habitCompletions = habits.reduce((sum, h) => sum + (h?.history?.length || 0), 0);
    const focus = sessions.filter((s) => s?.completed).length;
    const outstandXp = outstand.reduce((sum, o) => sum + (o?.xp || 0), 0);
    
    return (habitCompletions * XP_PER_HABIT) + (focus * XP_PER_FOCUS) + outstandXp;
  }, [habits, sessions, outstand]);

  const level = Math.floor(xp / 500) + 1;
  const progressToNextLevel = (xp % 500) / 5; 

  const recordOutstand = (title: string, xp: number) => {
    setOutstand((prev) => {
      const safePrev = Array.isArray(prev) ? prev : [];
      return [
        { id: crypto.randomUUID(), title, xp, completedAt: new Date().toISOString() },
        ...safePrev,
      ].slice(0, 200);
    });
  };

  const toggleToday = (id: string) => {
    const today = todayISO();
    setHabits((prev) => {
      const safePrev = Array.isArray(prev) ? prev : [];
      return safePrev.map((h) => {
        if (h.id !== id) return h;
        const history = Array.isArray(h.history) ? h.history : [];
        const has = history.includes(today);
        return {
          ...h,
          history: has ? history.filter((d) => d !== today) : [...history, today],
        };
      });
    });
  };

  const addHabit = (data: { name: string; emoji: string; color: string }) => {
    const habit: Habit = {
      id: crypto.randomUUID(),
      name: data.name,
      emoji: data.emoji,
      color: data.color,
      createdAt: new Date().toISOString(),
      history: [],
    };
    setHabits((prev) => [...(Array.isArray(prev) ? prev : []), habit]);
  };

  // NEW: Bulk setup function for onboarding initialization
  const setInitialHabits = (chosenHabits: Array<{ name: string; emoji: string; color: string }>) => {
    const formattedHabits: Habit[] = chosenHabits.map((item) => ({
      id: crypto.randomUUID(),
      name: item.name,
      emoji: item.emoji,
      color: item.color,
      createdAt: new Date().toISOString(),
      history: [],
    }));
    setHabits(formattedHabits);
  };

  const updateHabit = (id: string, data: Partial<Pick<Habit, "name" | "emoji" | "color">>) => {
    setHabits((prev) => {
      const safePrev = Array.isArray(prev) ? prev : [];
      return safePrev.map((h) => (h.id === id ? { ...h, ...data } : h));
    });
  };

  const deleteHabit = (id: string) => {
    setHabits((prev) => {
      const safePrev = Array.isArray(prev) ? prev : [];
      return safePrev.filter((h) => h.id !== id);
    });
  };

  const recordSession = (durationMin: number, completed: boolean) => {
    const s: FocusSession = {
      id: crypto.randomUUID(),
      startedAt: new Date().toISOString(),
      durationMin,
      completed,
    };
    setSessions((prev) => [s, ...(Array.isArray(prev) ? prev : [])].slice(0, 500));
  };

  // 4. SAFE STREAK CALCULATION: Ensure computeStreak always receives an array
  const streaks = useMemo(() => {
    return habits.map((h) => ({ 
      id: h?.id, 
      streak: computeStreak(Array.isArray(h?.history) ? h.history : []) 
    }));
  }, [habits]);

  const bestStreak = streaks.reduce((a, b) => ((b?.streak || 0) > a ? (b?.streak || 0) : a), 0);

  return {
    habits,
    sessions,
    outstand,
    xp,
    level,
    progressToNextLevel,
    bestStreak,
    streaks,
    toggleToday,
    addHabit,
    setInitialHabits,
    updateHabit,
    deleteHabit,
    recordSession,
    recordOutstand,
  };
}
// src/routes/_authenticated/onboarding.tsx (Part 1 of 2)
import { useState, useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { useAppState } from "@/hooks/use-app-state";
import { ArrowRight, Check, Sparkles } from "lucide-react";

const smoothEase = [0.16, 1, 0.3, 1];
const slowEase = [0.22, 1, 0.36, 1];

const fadeUp = {
  hidden: { opacity: 0, y: 30, filter: "blur(10px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 1.2, ease: smoothEase } },
  exit: { opacity: 0, y: -20, filter: "blur(10px)", transition: { duration: 0.8, ease: smoothEase } }
};

// Preset habits for Act 3 selection
const PRESET_HABITS = [
  { id: "h_read", name: "Read 20 pages", emoji: "📚", color: "primary" },
  { id: "h_deepwork", name: "90m Deep Work", emoji: "🧠", color: "accent" },
  { id: "h_workout", name: "Physical Exercise", emoji: "🏃", color: "success" },
  { id: "h_meditate", name: "10m Mindfulness", emoji: "🧘", color: "warning" },
  { id: "h_nophone", name: "No Phone First Hour", emoji: "📵", color: "primary" },
  { id: "h_coldshower", name: "Cold Shower", emoji: "⚡", color: "accent" },
];

const AtmosphericBackground = ({ step }: { step: number }) => {
  const getBgGlow = () => {
    if (step <= 2) return "bg-zinc-900/20";
    if (step === 3) return "bg-red-900/10";
    if (step >= 4) return "bg-blue-900/20";
    return "bg-black";
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#050505]">
      <div 
        className="absolute inset-0 opacity-[0.03] mix-blend-overlay"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
      />
      <motion.div 
        layout
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2 }}
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120vw] h-[120vh] blur-[150px] rounded-full transition-colors duration-[3000ms] ${getBgGlow()}`} 
      />
    </div>
  );
};

// Scene 1: The Hook
const SceneOne = ({ onNext }: { onNext: () => void }) => {
  const [showSecond, setShowSecond] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => setShowSecond(true), 2000);
    const autoAdvance = setTimeout(() => onNext(), 5000);
    return () => { clearTimeout(timer); clearTimeout(autoAdvance); };
  }, [onNext]);

  return (
    <motion.div className="flex flex-col items-center justify-center h-full text-center px-6" variants={fadeUp} initial="hidden" animate="show" exit="exit">
      <motion.h2 className="text-2xl md:text-4xl font-display text-zinc-400 font-medium tracking-tight">
        "You unlock your phone..."
      </motion.h2>
      <AnimatePresence>
        {showSecond && (
          <motion.div 
            initial={{ opacity: 0, filter: "blur(10px)" }} 
            animate={{ opacity: 1, filter: "blur(0px)" }} 
            transition={{ duration: 1.5, delay: 0.3 }}
            className="mt-4 flex flex-col items-center"
          >
            <h2 className="text-2xl md:text-4xl font-display text-white font-medium tracking-tight">
              "...just for one minute."
            </h2>
            <motion.div 
              initial={{ scale: 0 }} 
              animate={{ scale: [1, 1.2, 1] }} 
              transition={{ delay: 1.5, duration: 0.5 }}
              className="mt-12 w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.8)]"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// Scene 2: The Time Loop
const SceneTwo = ({ onNext }: { onNext: () => void }) => {
  const times = ["1 min", "5 mins", "12 mins", "27 mins", "1 hour", "2 hours", "4 HOURS"];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (index < times.length - 1) {
      const timeout = setTimeout(() => setIndex(prev => prev + 1), 500 - (index * 60));
      return () => clearTimeout(timeout);
    } else {
      const autoAdvance = setTimeout(() => onNext(), 3000);
      return () => clearTimeout(autoAdvance);
    }
  }, [index, onNext, times.length]);

  return (
    <motion.div className="flex flex-col items-center justify-center h-full text-center px-6" variants={fadeUp} initial="hidden" animate="show" exit="exit">
      <motion.div 
        animate={{ scale: 1 + (index * 0.04) }} 
        transition={{ duration: 0.3 }}
        className="relative"
      >
        <h1 className={`font-mono font-black tracking-tighter ${index === times.length - 1 ? 'text-6xl md:text-8xl text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.3)]' : 'text-5xl text-zinc-500 blur-[1px]'}`}>
          {times[index]}
        </h1>
        {index === times.length - 1 && (
          <motion.p 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.8, duration: 1 }}
            className="text-zinc-400 mt-6 text-lg max-w-sm mx-auto font-medium"
          >
            The average daily screen time. A silent thief of human potential.
          </motion.p>
        )}
      </motion.div>
    </motion.div>
  );
};

// Scene 3: The Reality
const SceneThree = ({ onNext }: { onNext: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(() => onNext(), 4500);
    return () => clearTimeout(timer);
  }, [onNext]);

  return (
    <motion.div className="flex flex-col items-center justify-center h-full text-center px-6 space-y-4" variants={fadeUp} initial="hidden" animate="show" exit="exit">
      <h2 className="text-3xl md:text-5xl font-display text-zinc-400 font-medium">You weren't lazy.</h2>
      <motion.h2 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ delay: 1.2, duration: 1.2, ease: smoothEase }}
        className="text-3xl md:text-5xl font-display text-white font-bold"
      >
        You were designed to stay.
      </motion.h2>
    </motion.div>
  );
};
