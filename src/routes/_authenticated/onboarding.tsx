// src/routes/_authenticated/onboarding.tsx (Part 1 of 2)
import { useState, useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { useAppState } from "@/hooks/use-app-state";
import { ArrowRight, Check, Sparkles } from "lucide-react";

const smoothEase = [0.16, 1, 0.3, 1];

const fadeUp = {
  hidden: { opacity: 0, y: 20, filter: "blur(8px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 1.4, ease: smoothEase } },
  exit: { opacity: 0, y: -15, filter: "blur(8px)", transition: { duration: 0.8, ease: smoothEase } }
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
    if (step <= 2) return "bg-blue-950/20";
    if (step === 3) return "bg-indigo-950/30";
    if (step >= 4) return "bg-blue-900/25";
    return "bg-black";
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#030712]">
      <div 
        className="absolute inset-0 opacity-[0.03] mix-blend-overlay"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
      />
      <motion.div 
        layout
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2.5 }}
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120vw] h-[120vh] blur-[160px] rounded-full transition-colors duration-[3000ms] ${getBgGlow()}`} 
      />
    </div>
  );
};

// Scene 1: The Hook
const SceneOne = ({ onNext }: { onNext: () => void }) => {
  const [showSecond, setShowSecond] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => setShowSecond(true), 2500);
    const autoAdvance = setTimeout(() => onNext(), 6000);
    return () => { clearTimeout(timer); clearTimeout(autoAdvance); };
  }, [onNext]);

  return (
    <motion.div className="flex flex-col items-center justify-center h-full text-center px-6 max-w-lg mx-auto" variants={fadeUp} initial="hidden" animate="show" exit="exit">
      <motion.h2 className="text-xl sm:text-3xl font-display text-zinc-300 font-medium tracking-tight leading-relaxed">
        "You unlock your phone..."
      </motion.h2>
      <AnimatePresence>
        {showSecond && (
          <motion.div 
            initial={{ opacity: 0, filter: "blur(10px)", y: 10 }} 
            animate={{ opacity: 1, filter: "blur(0px)", y: 0 }} 
            transition={{ duration: 1.8, ease: smoothEase }}
            className="mt-6 flex flex-col items-center"
          >
            <h2 className="text-2xl sm:text-4xl font-display text-white font-semibold tracking-tight leading-relaxed">
              "...just for one minute."
            </h2>
            <motion.div 
              initial={{ scale: 0 }} 
              animate={{ scale: [1, 1.3, 1] }} 
              transition={{ delay: 1.5, duration: 0.8 }}
              className="mt-10 w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_25px_rgba(59,130,246,0.9)]"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// Scene 2: The Time Loop
const SceneTwo = ({ onNext }: { onNext: () => void }) => {
  const times = ["1 min", "5 mins", "15 mins", "30 mins", "1 hour", "2 hours", "4 HOURS"];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (index < times.length - 1) {
      const timeout = setTimeout(() => setIndex(prev => prev + 1), 600 - (index * 50));
      return () => clearTimeout(timeout);
    } else {
      const autoAdvance = setTimeout(() => onNext(), 3500);
      return () => clearTimeout(autoAdvance);
    }
  }, [index, onNext, times.length]);

  return (
    <motion.div className="flex flex-col items-center justify-center h-full text-center px-6 max-w-xl mx-auto" variants={fadeUp} initial="hidden" animate="show" exit="exit">
      <motion.div 
        animate={{ scale: 1 + (index * 0.03) }} 
        transition={{ duration: 0.4 }}
        className="relative"
      >
        <h1 className={`font-mono font-black tracking-tight ${index === times.length - 1 ? 'text-5xl sm:text-7xl text-blue-400 drop-shadow-[0_0_35px_rgba(59,130,246,0.4)]' : 'text-4xl sm:text-6xl text-zinc-500 blur-[0.5px]'}`}>
          {times[index]}
        </h1>
        {index === times.length - 1 && (
          <motion.p 
            initial={{ opacity: 0, y: 15 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.8, duration: 1.2, ease: smoothEase }}
            className="text-slate-300 mt-6 text-sm sm:text-base max-w-md mx-auto font-medium leading-relaxed"
          >
            The average daily screen time. A silent drain on human potential.
          </motion.p>
        )}
      </motion.div>
    </motion.div>
  );
};

// Scene 3: The Reality
const SceneThree = ({ onNext }: { onNext: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(() => onNext(), 5000);
    return () => clearTimeout(timer);
  }, [onNext]);

  return (
    <motion.div className="flex flex-col items-center justify-center h-full text-center px-6 space-y-4 max-w-lg mx-auto" variants={fadeUp} initial="hidden" animate="show" exit="exit">
      <h2 className="text-2xl sm:text-4xl font-display text-slate-400 font-medium">You weren't lazy.</h2>
      <motion.h2 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ delay: 1.2, duration: 1.4, ease: smoothEase }}
        className="text-3xl sm:text-5xl font-display text-white font-bold tracking-tight"
      >
        You were engineered to stay.
      </motion.h2>
    </motion.div>
  );
};

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
    <motion.div className="flex flex-col items-center justify-center h-full text-center px-6 max-w-md mx-auto w-full" variants={fadeUp} initial="hidden" animate="show" exit="exit">
      <div className="text-[11px] uppercase tracking-[0.3em] text-blue-400 font-bold mb-4 flex items-center gap-2">
        <Sparkles className="w-3.5 h-3.5" /> Act I: Identity
      </div>
      <h2 className="text-2xl sm:text-3xl font-display font-bold text-white mb-8 tracking-tight">
        What should we call you?
      </h2>
      <div className="w-full relative">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your name"
          autoFocus
          aria-label="Your Name"
          className="w-full bg-transparent border-b-2 border-blue-500/30 focus:border-blue-500 py-3 text-xl sm:text-2xl font-display text-center text-white outline-none transition-colors placeholder:text-zinc-600"
          onKeyDown={(e) => e.key === "Enter" && name.trim() && onNext()}
        />
      </div>
      <motion.button
        disabled={!name.trim()}
        onClick={onNext}
        className="mt-12 flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-8 py-3.5 rounded-full font-bold text-sm tracking-wide transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)] disabled:opacity-30 disabled:pointer-events-none"
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
    <motion.div className="flex flex-col items-center justify-center h-full text-center px-6 max-w-md mx-auto w-full" variants={fadeUp} initial="hidden" animate="show" exit="exit">
      <div className="text-[11px] uppercase tracking-[0.3em] text-blue-400 font-bold mb-3">Act II: The Reality Check</div>
      <h2 className="text-xl sm:text-2xl font-display font-bold text-white mb-2 tracking-tight">
        Be honest with yourself.
      </h2>
      <p className="text-slate-400 text-xs sm:text-sm mb-8">What is your current daily screen time?</p>

      <div className="text-5xl sm:text-6xl font-mono font-black text-blue-400 mb-6 drop-shadow-[0_0_20px_rgba(59,130,246,0.3)]">
        {hours} <span className="text-xl font-normal text-slate-400">hrs/day</span>
      </div>

      <input
        type="range"
        min={1}
        max={14}
        value={hours}
        aria-label="Daily screen time hours"
        onChange={(e) => setHours(Number(e.target.value))}
        className="w-full accent-blue-500 bg-zinc-800 h-2 rounded-lg cursor-pointer mb-10"
      />

      <button
        onClick={onNext}
        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-8 py-3.5 rounded-full font-bold text-sm tracking-wide transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)]"
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
    <motion.div className="flex flex-col items-center justify-center h-full text-center px-6 max-w-lg mx-auto w-full py-6" variants={fadeUp} initial="hidden" animate="show" exit="exit">
      <div className="text-[11px] uppercase tracking-[0.3em] text-blue-400 font-bold mb-2">Act III: Your Arsenal</div>
      <h2 className="text-xl sm:text-3xl font-display font-bold text-white mb-1 tracking-tight">
        Choose 3 foundational habits
      </h2>
      <p className="text-slate-400 text-xs sm:text-sm mb-6">Selected ({selected.length}/3)</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full mb-8 text-left">
        {PRESET_HABITS.map((habit) => {
          const isSelected = selected.includes(habit.id);
          return (
            <button
              key={habit.id}
              onClick={() => toggleHabit(habit.id)}
              aria-pressed={isSelected}
              className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
                isSelected 
                  ? "bg-blue-600/20 border-blue-500 text-white shadow-[0_0_20px_rgba(59,130,246,0.25)]" 
                  : "bg-zinc-900/60 border-zinc-800/80 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-900"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{habit.emoji}</span>
                <span className="font-medium text-xs sm:text-sm">{habit.name}</span>
              </div>
              <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isSelected ? "bg-blue-500 border-blue-500" : "border-zinc-700"}`} aria-hidden="true">
                {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
              </div>
            </button>
          );
        })}
      </div>

      <button
        disabled={selected.length < 3}
        onClick={onNext}
        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-9 py-3.5 rounded-full font-bold text-sm sm:text-base tracking-wide transition-all shadow-[0_0_25px_rgba(59,130,246,0.35)] disabled:opacity-30 disabled:pointer-events-none"
      >
        Lock In Matrix <ArrowRight className="w-4 h-4" />
      </button>
    </motion.div>
  );
};

// Scene 7: Final Call to Action
const SceneSevenCTA = ({ onComplete, isCompleting }: { onComplete: () => void; isCompleting: boolean }) => {
  return (
    <motion.div className="flex flex-col items-center justify-center h-full text-center px-6 relative max-w-lg mx-auto" variants={fadeUp} initial="hidden" animate="show" exit="exit">
      <h1 className="text-3xl sm:text-5xl font-display font-black text-white leading-tight mb-10 tracking-tight">
        Your new life<br/>begins now.
      </h1>
      
      <motion.button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        onClick={onComplete}
        disabled={isCompleting}
        className="relative group overflow-hidden rounded-full bg-blue-600 text-white px-10 py-4 font-bold text-base sm:text-lg transition-all shadow-[0_0_30px_rgba(59,130,246,0.4)] hover:shadow-[0_0_50px_rgba(59,130,246,0.6)] disabled:opacity-50"
      >
        <span className="relative z-10 flex items-center gap-3">
          {isCompleting ? "Configuring Dashboard..." : "Enter Dashboard"}
        </span>
        <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-blue-400/30 to-transparent z-0" />
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
      await updateProfile({
        display_name: name.trim(),
        full_name: name.trim(),
        screen_time: screenTime,
        has_completed_onboarding: true,
      });

      const chosenHabits = PRESET_HABITS.filter((h) => selectedHabitIds.includes(h.id)).map((h) => ({
        name: h.name,
        emoji: h.emoji,
        color: h.color,
      }));
      setInitialHabits(chosenHabits);

      setTimeout(() => {
        navigate({ to: "/dashboard", replace: true });
      }, 600);
    } catch (error) {
      console.error("Failed to store onboarding setup", error);
      setIsCompleting(false);
    }
  };

  return (
    <div className="h-[100dvh] w-full bg-[#030712] text-white overflow-hidden relative selection:bg-blue-500/30 flex flex-col justify-between">
      <AtmosphericBackground step={step} />

      {/* Centered Content Container with Optimized Vertical Spacing */}
      <main className="relative z-10 flex-1 w-full max-w-xl mx-auto flex items-center justify-center px-4 sm:px-6">
        <AnimatePresence mode="wait">
          {step === 1 && <SceneOne key="s1" onNext={handleNext} />}
          {step === 2 && <SceneTwo key="s2" onNext={handleNext} />}
          {step === 3 && <SceneThree key="s3" onNext={handleNext} />}
          {step === 4 && <SceneFourName key="s4" name={name} setName={setName} onNext={handleNext} />}
          {step === 5 && <SceneFiveScreenTime key="s5" hours={screenTime} setHours={setScreenTime} onNext={handleNext} />}
          {step === 6 && <SceneSixHabits key="s6" selected={selectedHabitIds} setSelected={setSelectedHabitIds} onNext={handleNext} />}
          {step === 7 && <SceneSevenCTA key="s7" onComplete={completeOnboarding} isCompleting={isCompleting} />}
        </AnimatePresence>
      </main>

      {/* Minimal Footer Step Indicator */}
      <div className="relative z-20 pb-8 pt-4">
        <AnimatePresence>
          {step > 1 && step < 7 && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="flex justify-center items-center gap-2"
              aria-label={`Step ${step} of 7`}
            >
              {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                <div
                  key={i}
                  className={`h-1 rounded-full transition-all duration-500 ${
                    i === step ? "w-6 bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]" : i < step ? "w-1.5 bg-blue-400/50" : "w-1.5 bg-zinc-800"
                  }`}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
      }
