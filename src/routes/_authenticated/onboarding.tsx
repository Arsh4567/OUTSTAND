import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Smartphone, Shield, ArrowRight, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/onboarding")({
  component: OnboardingFlow,
});

const slideVariants = {
  enter: { opacity: 0, y: 20 },
  center: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

function OnboardingFlow() {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      // For now, this just sends them to the profile page.
      // We will add the database save later!
      navigate({ to: "/profile" });
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 overflow-hidden relative">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <AnimatePresence mode="wait">
          
          {/* STEP 0: The Shock Factor */}
          {step === 0 && (
            <motion.div
              key="step0"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.5 }}
              className="text-center space-y-6"
            >
              <Smartphone className="w-20 h-20 text-indigo-500 mx-auto mb-8 opacity-80" strokeWidth={1} />
              <div className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">The Reality</div>
              <h1 className="font-mono text-5xl font-black text-white drop-shadow-lg">6 HOURS</h1>
              <p className="text-xl text-zinc-400 font-medium">
                That is how much time the average person spends staring at a screen every single day.
              </p>
            </motion.div>
          )}

          {/* STEP 1: The Pain Point */}
          {step === 1 && (
            <motion.div
              key="step1"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.5 }}
              className="text-center space-y-6"
            >
              <Brain className="w-20 h-20 text-orange-500 mx-auto mb-8 opacity-80" strokeWidth={1} />
              <div className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-500">The Impact</div>
              <h1 className="font-display text-4xl font-black text-white leading-tight">
                Cheap Dopamine
              </h1>
              <p className="text-lg text-zinc-400">
                Endless scrolling drains your focus, destroys your attention span, and leaves you feeling exhausted but unfulfilled.
              </p>
            </motion.div>
          )}

          {/* STEP 2: The Solution */}
          {step === 2 && (
            <motion.div
              key="step2"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.5 }}
              className="text-center space-y-6"
            >
              <Shield className="w-20 h-20 text-emerald-400 mx-auto mb-8 opacity-80" strokeWidth={1} />
              <div className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400">The Cure</div>
              <h1 className="font-display text-4xl font-black text-white leading-tight">
                Enter Outstand
              </h1>
              <p className="text-lg text-zinc-400">
                This isn't just a tracker. It's a system designed to recalibrate your brain, rewarding real-world action over virtual consumption.
              </p>
            </motion.div>
          )}

          {/* STEP 3: The First Task */}
          {step === 3 && (
            <motion.div
              key="step3"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.5 }}
              className="text-center space-y-6"
            >
              <CheckCircle2 className="w-20 h-20 text-cyan-400 mx-auto mb-8 opacity-80" strokeWidth={1} />
              <div className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-400">Your First Mission</div>
              <h1 className="font-display text-4xl font-black text-white leading-tight">
                Break the Cycle
              </h1>
              <p className="text-lg text-zinc-400 pb-4">
                To start your journey, commit to your first focus session today. Reclaim your next 15 minutes.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation Button */}
        <div className="mt-16 flex justify-center">
          <button
            onClick={handleNext}
            className="group relative flex items-center gap-3 bg-white text-black px-8 py-4 rounded-full font-bold text-lg hover:bg-zinc-200 transition-colors"
          >
            {step === 3 ? "Start Journey" : "Continue"}
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Progress Dots */}
        <div className="mt-8 flex justify-center gap-2">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                i === step ? "w-8 bg-white" : "w-2 bg-white/20"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
            }
