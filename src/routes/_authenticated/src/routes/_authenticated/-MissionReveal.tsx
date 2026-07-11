import { motion, AnimatePresence } from "framer-motion";

type Props = {
  open: boolean;
  color: string;
};

export default function MissionReveal({ open, color }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Flash */}
          <motion.div
            className="absolute h-[700px] w-[700px] rounded-full"
            style={{
              background: color,
              filter: "blur(120px)",
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{
              scale: [0.2, 1.4, 1],
              opacity: [0, 1, 0.4],
            }}
            transition={{
              duration: 1.2,
            }}
          />

          {/* Outer Ring */}
          <motion.div
            className="absolute h-72 w-72 rounded-full border-4"
            style={{
              borderColor: color,
              boxShadow: `0 0 60px ${color}`,
            }}
            animate={{
              rotate: 360,
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "linear",
            }}
          />

          {/* Inner Ring */}
          <motion.div
            className="absolute h-52 w-52 rounded-full border-2"
            style={{
              borderColor: "white",
            }}
            animate={{
              rotate: -360,
              scale: [1, 1.05, 1],
            }}
            transition={{
              rotate: {
                duration: 5,
                repeat: Infinity,
                ease: "linear",
              },
              scale: {
                duration: 2,
                repeat: Infinity,
              },
            }}
          />

          {/* Portal Core */}
          <motion.div
            className="absolute h-28 w-28 rounded-full"
            style={{
              background: color,
              filter: "blur(20px)",
            }}
            animate={{
              scale: [0.8, 1.15, 0.8],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
