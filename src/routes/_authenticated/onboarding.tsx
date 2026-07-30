// onboarding.tsx (Part 1 of 2)
import { useState, useEffect, useRef } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence, useScroll, useTransform, useMotionValue, useSpring } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

// --- ANIMATION TIMING & EASING (Apple-like Butter) ---
const smoothEase = [0.16, 1, 0.3, 1];
const slowEase = [0.22, 1, 0.36, 1];

const fadeUp = {
  hidden: { opacity: 0, y: 30, filter: "blur(10px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 1.2, ease: smoothEase } },
  exit: { opacity: 0, y: -20, filter: "blur(10px)", transition: { duration: 0.8, ease: smoothEase } }
};

// --- COMPONENTS ---

// 1. Cinematic Background Noise & Lighting
const AtmosphericBackground = ({ step }: { step: number }) => {
  // Dynamic background color based on narrative arc
  const getBgGlow = () => {
    if (step <= 2) return "bg-zinc-900/20"; // Dark/Isolated
    if (step === 3) return "bg-red-900/10"; // Pain point
    if (step >= 5) return "bg-blue-900/20"; // Hope/Outstand intro
    return "bg-black";
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#050505]">
      {/* Noise Texture */}
      <div 
        className="absolute inset-0 opacity-[0.03] mix-blend-overlay"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
      />
      
      {/* Dynamic Ambient Glow */}
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
    const timer = setTimeout(() => setShowSecond(true), 2500);
    const autoAdvance = setTimeout(() => onNext(), 6000);
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
            transition={{ duration: 1.5, delay: 0.5 }}
            className="mt-4 flex flex-col items-center"
          >
            <h2 className="text-2xl md:text-4xl font-display text-white font-medium tracking-tight">
              "...just for one minute."
            </h2>
            <motion.div 
              initial={{ scale: 0 }} 
              animate={{ scale: [1, 1.2, 1] }} 
              transition={{ delay: 2, duration: 0.5 }}
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
      const timeout = setTimeout(() => setIndex(prev => prev + 1), 600 - (index * 80)); // Speeds up
      return () => clearTimeout(timeout);
    } else {
      const autoAdvance = setTimeout(() => onNext(), 3000);
      return () => clearTimeout(autoAdvance);
    }
  }, [index, onNext, times.length]);

  return (
    <motion.div className="flex flex-col items-center justify-center h-full text-center px-6" variants={fadeUp} initial="hidden" animate="show" exit="exit">
      <motion.div 
        animate={{ scale: 1 + (index * 0.05) }} 
        transition={{ duration: 0.4 }}
        className="relative"
      >
        <h1 className={`font-mono font-black tracking-tighter ${index === times.length - 1 ? 'text-6xl md:text-8xl text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.3)]' : 'text-5xl text-zinc-500 blur-[1px]'}`}>
          {times[index]}
        </h1>
        {index === times.length - 1 && (
          <motion.p 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 1, duration: 1 }}
            className="text-zinc-400 mt-6 text-lg max-w-sm mx-auto"
          >
            The average daily screen time. A silent thief of your potential.
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
    <motion.div className="flex flex-col items-center justify-center h-full text-center px-6 space-y-4" variants={fadeUp} initial="hidden" animate="show" exit="exit">
      <h2 className="text-3xl md:text-5xl font-display text-zinc-400 font-medium">You weren't lazy.</h2>
      <motion.h2 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ delay: 1.5, duration: 1.2, ease: smoothEase }}
        className="text-3xl md:text-5xl font-display text-white font-bold"
      >
        You were designed to stay.
      </motion.h2>
    </motion.div>
  );
};
// onboarding.tsx (Part 2 of 2)

// Scene 4: Opportunity Cost
const SceneFour = ({ onNext }: { onNext: () => void }) => {
  const items = ["Books unread.", "Skills unlearned.", "Dreams delayed.", "Life, paused."];
  
  return (
    <motion.div className="flex flex-col items-start justify-center h-full px-8 md:px-16" variants={fadeUp} initial="hidden" animate="show" exit="exit">
      <h3 className="text-xl md:text-2xl text-zinc-500 font-medium mb-12">What could you have built instead?</h3>
      <div className="space-y-6">
        {items.map((item, i) => (
          <motion.div
            key={item}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.8 + 0.5, duration: 1, ease: smoothEase }}
            className={`text-3xl md:text-5xl font-display font-bold ${i === items.length - 1 ? 'text-white mt-12' : 'text-zinc-300'}`}
          >
            {item}
          </motion.div>
        ))}
      </div>
      <motion.button 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        transition={{ delay: 4, duration: 1 }}
        onClick={onNext}
        className="mt-16 text-sm uppercase tracking-widest text-zinc-500 hover:text-white transition-colors"
      >
        Tap to continue
      </motion.button>
    </motion.div>
  );
};

// Scene 5: Introduction to Outstand
const SceneFive = ({ onNext }: { onNext: () => void }) => {
  return (
    <motion.div className="flex flex-col items-center justify-center h-full text-center px-6" variants={fadeUp} initial="hidden" animate="show" exit="exit">
      <motion.div 
        initial={{ scale: 0.8, opacity: 0, filter: "blur(20px)" }}
        animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
        transition={{ duration: 2, ease: slowEase }}
        className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.15)_0%,transparent_50%)] pointer-events-none"
      />
      <h2 className="text-2xl md:text-3xl font-display text-blue-400 font-medium mb-6">There is a way out.</h2>
      <motion.h1 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 1.5, ease: smoothEase }}
        className="text-5xl md:text-7xl font-display font-black text-white tracking-tighter"
      >
        Meet Outstand.
      </motion.h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.5, duration: 1.5 }}
        className="mt-8 text-xl text-zinc-400 max-w-md"
      >
        Reclaim your attention. Build unbreakable consistency.
      </motion.p>
      <motion.button 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 4 }}
        onClick={onNext} className="mt-16 text-sm uppercase tracking-widest text-zinc-500 hover:text-white transition-colors"
      >
        Tap to continue
      </motion.button>
    </motion.div>
  );
};

// Scene 6: The Final CTA
const SceneSix = ({ onComplete, isCompleting }: { onComplete: () => void, isCompleting: boolean }) => {
  return (
    <motion.div className="flex flex-col items-center justify-center h-full text-center px-6 relative" variants={fadeUp} initial="hidden" animate="show" exit="exit">
      <h1 className="text-4xl md:text-6xl font-display font-black text-white leading-tight mb-12">
        Your future self<br/>is waiting.
      </h1>
      
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onComplete}
        disabled={isCompleting}
        className="relative group overflow-hidden rounded-full bg-white text-black px-12 py-5 font-bold text-lg md:text-xl transition-all shadow-[0_0_40px_rgba(255,255,255,0.1)] hover:shadow-[0_0_60px_rgba(255,255,255,0.2)] disabled:opacity-50"
      >
        <span className="relative z-10 flex items-center gap-3">
          {isCompleting ? "Initializing..." : "Start My Journey"}
        </span>
        {/* Hover ripple effect */}
        <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-zinc-200/50 to-transparent z-0" />
      </motion.button>
    </motion.div>
  );
};

// --- MAIN ROUTE COMPONENT ---

export const Route = createFileRoute("/_authenticated/onboarding")({
  component: CinematicOnboarding,
});

function CinematicOnboarding() {
  const [step, setStep] = useState(1);
  const [isCompleting, setIsCompleting] = useState(false);
  const navigate = useNavigate();

  const handleNext = () => {
    if (step < 6) setStep(step + 1);
  };

  const completeOnboarding = async () => {
    setIsCompleting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Update the flag we created in Supabase!
        await supabase
          .from('profiles')
          .update({ has_completed_onboarding: true })
          .eq('id', session.user.id);
      }
      
      // Smooth fade out before navigating
      setTimeout(() => {
        navigate({ to: "/dashboard", replace: true });
      }, 800);
      
    } catch (error) {
      console.error("Failed to complete onboarding", error);
      setIsCompleting(false);
    }
  };

  return (
    <div className="h-[100dvh] w-full bg-[#050505] text-white overflow-hidden relative selection:bg-blue-500/30">
      <AtmosphericBackground step={step} />

      {/* Narrative Container */}
      <div className="relative z-10 h-full w-full max-w-2xl mx-auto">
        <AnimatePresence mode="wait">
          {step === 1 && <SceneOne key="scene1" onNext={handleNext} />}
          {step === 2 && <SceneTwo key="scene2" onNext={handleNext} />}
          {step === 3 && <SceneThree key="scene3" onNext={handleNext} />}
          {step === 4 && <SceneFour key="scene4" onNext={handleNext} />}
          {step === 5 && <SceneFive key="scene5" onNext={handleNext} />}
          {step === 6 && <SceneSix key="scene6" onComplete={completeOnboarding} isCompleting={isCompleting} />}
        </AnimatePresence>
      </div>

      {/* Cinematic Progress Indicator (Hidden on hook) */}
      <AnimatePresence>
        {step > 1 && step < 6 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-12 left-0 right-0 flex justify-center gap-3 z-20 pointer-events-none"
          >
            {[2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className={`h-1 rounded-full transition-all duration-1000 ${
                  i === step ? "w-8 bg-white" : i < step ? "w-2 bg-white/40" : "w-2 bg-white/10"
                }`}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
