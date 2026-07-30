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
// src/routes/_authenticated/onboarding.tsx (Part 2 of 2)

// Scene 4: Name Input (Identity)
const SceneFourName = ({ 
  name, 
  setName, 
  onNext 
}: { 
  name: string; 
  setName: (val: string) => void; 
  onNext: () => void; 
}) => {
  return (
    <motion.div className="flex flex-col items-center justify-center h-full text-center px-6 max-w-md mx-auto" variants={fadeUp} initial="hidden" animate="show" exit="exit">
      <div className="text-xs uppercase tracking-[0.3em] text-blue-400 font-bold mb-4 flex items-center gap-2">
        <Sparkles className="w-4 h-4" /> Act I: Identity
      </div>
      <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-8">
        What should we call you?
      </h2>
      <div className="w-full relative">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your name"
          autoFocus
          className="w-full bg-transparent border-b-2 border-zinc-800 focus:border-blue-500 py-3 text-2xl md:text-3xl font-display text-center text-white outline-none transition-colors placeholder:text-zinc-700"
          onKeyDown={(e) => e.key === "Enter" && name.trim() && onNext()}
        />
      </div>
      <motion.button
        disabled={!name.trim()}
        onClick={onNext}
        className="mt-12 flex items-center gap-2 bg-white text-black px-8 py-3.5 rounded-full font-bold text-base hover:bg-zinc-200 transition-all disabled:opacity-30 disabled:pointer-events-none"
      >
        Continue <ArrowRight className="w-4 h-4" />
      </motion.button>
    </motion.div>
  );
};

// Scene 5: Screen Time Reality Check
const SceneFiveScreenTime = ({ 
  hours, 
  setHours, 
  onNext 
}: { 
  hours: number; 
  setHours: (val: number) => void; 
  onNext: () => void; 
}) => {
  return (
    <motion.div className="flex flex-col items-center justify-center h-full text-center px-6 max-w-md mx-auto" variants={fadeUp} initial="hidden" animate="show" exit="exit">
      <div className="text-xs uppercase tracking-[0.3em] text-blue-400 font-bold mb-4">Act II: The Reality Check</div>
      <h2 className="text-2xl md:text-3xl font-display font-bold text-white mb-2">
        Be honest with yourself.
      </h2>
      <p className="text-zinc-400 text-sm mb-10">What is your current daily screen time?</p>

      <div className="text-6xl font-mono font-black text-blue-400 mb-8">
        {hours} <span className="text-2xl font-normal text-zinc-500">hrs/day</span>
      </div>

      <input
        type="range"
        min={1}
        max={14}
        value={hours}
        onChange={(e) => setHours(Number(e.target.value))}
        className="w-full accent-blue-500 bg-zinc-800 h-2 rounded-lg cursor-pointer mb-12"
      />

      <button
        onClick={onNext}
        className="flex items-center gap-2 bg-white text-black px-8 py-3.5 rounded-full font-bold text-base hover:bg-zinc-200 transition-all"
      >
        Set Benchmark <ArrowRight className="w-4 h-4" />
      </button>
    </motion.div>
  );
};

// Scene 6: Habit Selection
const SceneSixHabits = ({ 
  selected, 
  setSelected, 
  onNext 
}: { 
  selected: string[]; 
  setSelected: React.Dispatch<React.SetStateAction<string[]>>; 
  onNext: () => void; 
}) => {
  const toggleHabit = (id: string) => {
    if (selected.includes(id)) {
      setSelected(selected.filter((item) => item !== id));
    } else {
      if (selected.length < 3) {
        setSelected([...selected, id]);
      }
    }
  };

  return (
    <motion.div className="flex flex-col items-center justify-center h-full text-center px-6 max-w-xl mx-auto" variants={fadeUp} initial="hidden" animate="show" exit="exit">
      <div className="text-xs uppercase tracking-[0.3em] text-blue-400 font-bold mb-2">Act III: Your Arsenal</div>
      <h2 className="text-2xl md:text-4xl font-display font-bold text-white mb-2">
        Choose 3 foundational habits
      </h2>
      <p className="text-zinc-400 text-sm mb-8">Selected ({selected.length}/3)</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full mb-10 text-left">
        {PRESET_HABITS.map((habit) => {
          const isSelected = selected.includes(habit.id);
          return (
            <button
              key={habit.id}
              onClick={() => toggleHabit(habit.id)}
              className={`p-4 rounded-xl border transition-all flex items-center justify-between ${
                isSelected 
                  ? "bg-blue-600/10 border-blue-500/80 text-white shadow-[0_0_20px_rgba(59,130,246,0.2)]" 
                  : "bg-zinc-900/50 border-zinc-800/80 text-zinc-400 hover:border-zinc-700"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{habit.emoji}</span>
                <span className="font-medium text-sm">{habit.name}</span>
              </div>
              <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${isSelected ? "bg-blue-500 border-blue-500" : "border-zinc-700"}`}>
                {isSelected && <Check className="w-3 h-3 text-white" />}
              </div>
            </button>
          );
        })}
      </div>

      <button
        disabled={selected.length < 3}
        onClick={onNext}
        className="flex items-center gap-2 bg-white text-black px-10 py-4 rounded-full font-bold text-lg hover:bg-zinc-200 transition-all disabled:opacity-30 disabled:pointer-events-none"
      >
        Lock In Matrix <ArrowRight className="w-5 h-5" />
      </button>
    </motion.div>
  );
};

// Scene 7: Final Call to Action
const SceneSevenCTA = ({ onComplete, isCompleting }: { onComplete: () => void; isCompleting: boolean }) => {
  return (
    <motion.div className="flex flex-col items-center justify-center h-full text-center px-6 relative" variants={fadeUp} initial="hidden" animate="show" exit="exit">
      <h1 className="text-4xl md:text-6xl font-display font-black text-white leading-tight mb-12">
        Your new life<br/>begins now.
      </h1>
      
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onComplete}
        disabled={isCompleting}
        className="relative group overflow-hidden rounded-full bg-white text-black px-12 py-5 font-bold text-lg md:text-xl transition-all shadow-[0_0_40px_rgba(255,255,255,0.1)] hover:shadow-[0_0_60px_rgba(255,255,255,0.2)] disabled:opacity-50"
      >
        <span className="relative z-10 flex items-center gap-3">
          {isCompleting ? "Configuring Dashboard..." : "Enter Dashboard"}
        </span>
        <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-zinc-200/50 to-transparent z-0" />
      </motion.button>
    </motion.div>
  );
};

export const Route = createFileRoute("/_authenticated/onboarding")({
  component: CinematicOnboarding,
});

function CinematicOnboarding() {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [screenTime, setScreenTime] = useState(6);
  const [selectedHabitIds, setSelectedHabitIds] = useState<string[]>([]);
  const [isCompleting, setIsCompleting] = useState(false);

  const { updateProfile } = useAuth();
  const { setInitialHabits } = useAppState();
  const navigate = useNavigate();

  const handleNext = () => setStep((s) => s + 1);

  const completeOnboarding = async () => {
    setIsCompleting(true);
    try {
      // 1. Optimistically update user profile with Name & Screen Time
      await updateProfile({
        display_name: name.trim(),
        full_name: name.trim(),
        screen_time: screenTime,
        has_completed_onboarding: true,
      });

      // 2. Map selected preset IDs back to habit objects and inject into state
      const chosenHabits = PRESET_HABITS.filter((h) => selectedHabitIds.includes(h.id)).map((h) => ({
        name: h.name,
        emoji: h.emoji,
        color: h.color,
      }));
      setInitialHabits(chosenHabits);

      // 3. Smooth transition to Dashboard
      setTimeout(() => {
        navigate({ to: "/dashboard", replace: true });
      }, 600);
    } catch (error) {
      console.error("Failed to store onboarding setup", error);
      setIsCompleting(false);
    }
  };

  return (
    <div className="h-[100dvh] w-full bg-[#050505] text-white overflow-hidden relative selection:bg-blue-500/30">
      <AtmosphericBackground step={step} />

      <div className="relative z-10 h-full w-full max-w-2xl mx-auto">
        <AnimatePresence mode="wait">
          {step === 1 && <SceneOne key="s1" onNext={handleNext} />}
          {step === 2 && <SceneTwo key="s2" onNext={handleNext} />}
          {step === 3 && <SceneThree key="s3" onNext={handleNext} />}
          {step === 4 && <SceneFourName key="s4" name={name} setName={setName} onNext={handleNext} />}
          {step === 5 && <SceneFiveScreenTime key="s5" hours={screenTime} setHours={setScreenTime} onNext={handleNext} />}
          {step === 6 && <SceneSixHabits key="s6" selected={selectedHabitIds} setSelected={setSelectedHabitIds} onNext={handleNext} />}
          {step === 7 && <SceneSevenCTA key="s7" onComplete={completeOnboarding} isCompleting={isCompleting} />}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {step > 1 && step < 7 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-8 left-0 right-0 flex justify-center gap-2 z-20 pointer-events-none"
          >
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div
                key={i}
                className={`h-1 rounded-full transition-all duration-500 ${
                  i === step ? "w-6 bg-white" : i < step ? "w-1.5 bg-white/40" : "w-1.5 bg-white/10"
                }`}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
