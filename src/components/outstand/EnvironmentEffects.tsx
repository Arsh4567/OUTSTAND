import { memo } from "react";
import { motion } from "framer-motion";

const cinematicEase = [0.16, 1, 0.3, 1] as const;

type Props = { completionStage: number; isShuffling: boolean };

export const EnvironmentEffects = memo(function EnvironmentEffects({ completionStage, isShuffling }: Props) {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
      <motion.div
        animate={{ opacity: completionStage === 1 ? 1 : 0, backdropFilter: completionStage === 1 ? "blur(40px)" : "blur(0px)" }}
        transition={{ duration: 1.5, ease: cinematicEase }}
        className="absolute inset-0 z-30 bg-black/80 transform-gpu"
      />
      <div className="absolute inset-0 z-0 opacity-20 [perspective:1000px]">
        <motion.div
          animate={{ rotateX: isShuffling ? 65 : 60, y: isShuffling ? "-10%" : "0%" }}
          transition={{ duration: 2, ease: cinematicEase }}
          className="absolute inset-0 origin-bottom transform-gpu bg-[linear-gradient(to_right,rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:linear-gradient(to_bottom,transparent_10%,black_80%)]"
        />
      </div>
      <motion.div
        animate={{ scale: isShuffling ? [1, 1.2, 1] : [1, 1.1, 1], opacity: isShuffling ? [0.6, 0.8, 0.6] : [0.2, 0.3, 0.2] }}
        transition={{ duration: isShuffling ? 2 : 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute left-[20%] top-[10%] h-[50vw] w-[50vw] rounded-full bg-cyan-600/40 blur-[150px] mix-blend-screen transform-gpu"
      />
      <motion.div
        animate={{ scale: isShuffling ? [1, 1.3, 1] : [1, 1.05, 1], opacity: isShuffling ? [0.5, 0.7, 0.5] : [0.15, 0.25, 0.15] }}
        transition={{ duration: isShuffling ? 1.5 : 12, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute bottom-[10%] right-[20%] h-[60vw] w-[60vw] rounded-full bg-indigo-600/30 blur-[160px] mix-blend-screen transform-gpu"
      />
    </div>
  );
});
