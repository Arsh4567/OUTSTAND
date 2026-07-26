import { motion, AnimatePresence } from "framer-motion";
import { Timer, X } from "lucide-react";

interface TimerSettingsSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TimerSettingsSheet({ isOpen, onClose }: TimerSettingsSheetProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            onClick={onClose} 
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm" 
          />
          <motion.div 
            initial={{ y: "100%" }} 
            animate={{ y: 0 }} 
            exit={{ y: "100%" }} 
            transition={{ type: "spring", bounce: 0, duration: 0.4 }} 
            className="fixed bottom-0 left-0 right-0 z-[70] mx-auto w-full max-w-lg rounded-t-[2.5rem] border border-white/10 bg-slate-900 p-6 shadow-2xl md:bottom-auto md:top-[20%] md:rounded-[2.5rem]"
          >
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-white">Timer Focus Settings</h2>
                <p className="text-sm text-slate-400">Adjust your Pomodoro sessions.</p>
              </div>
              <button 
                onClick={onClose} 
                className="grid h-10 w-10 place-items-center rounded-full bg-white/5 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="rounded-2xl border border-white/5 bg-white/5 p-8 text-center">
              <Timer className="mx-auto mb-3 h-8 w-8 text-slate-500" />
              <p className="text-sm text-slate-400">Connect this menu to your Pomodoro timer state variables in the future (e.g., 25m vs 50m logic).</p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
