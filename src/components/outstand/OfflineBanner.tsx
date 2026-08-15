import { memo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { WifiOff } from "lucide-react";

export const OfflineBanner = memo(function OfflineBanner({ isOnline }: { isOnline: boolean }) {
  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ opacity: 0, y: -40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -40, scale: 0.95 }}
          role="status"
          className="fixed top-6 z-50 flex w-auto items-center gap-3 rounded-full border border-red-500/30 bg-red-500/10 px-6 py-3 text-xs font-bold uppercase tracking-widest text-red-400 shadow-[0_0_30px_rgba(239,68,68,0.2)] backdrop-blur-xl"
        >
          <WifiOff className="h-4 w-4 animate-pulse" aria-hidden="true" />
          Network disconnected — local mode active
        </motion.div>
      )}
    </AnimatePresence>
  );
});
