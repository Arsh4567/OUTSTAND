import { createFileRoute } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Sparkles, Zap } from "lucide-react";
import MissionReveal from "@/components/outstand/MissionReveal";
import { Button } from "@/components/ui/button";
import {
  randomChallenge,
  type OutstandChallenge,
} from "@/lib/challenges";

export const Route = createFileRoute("/_authenticated/outstand-v2")({
  component: OutstandV2,
});

function OutstandV2() {
  const [challenge, setChallenge] =
    useState<OutstandChallenge | null>(null);
const [portalOpen, setPortalOpen] = useState(false);
  const [revealing, setRevealing] = useState(false);

  const generate = () => {
  const next = randomChallenge();

  setPortalOpen(true);

  setTimeout(() => {
    setChallenge(next);
  }, 1500);

  setTimeout(() => {
    setPortalOpen(false);
  }, 2600);
};

  return (
    <div className="relative min-h-screen overflow-hidden bg-black">

      {/* Animated Background */}

      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          rotate: [0, 3, 0],
        }}
        transition={{
          repeat: Infinity,
          duration: 12,
          ease: "easeInOut",
        }}
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at center,#2563eb55,transparent 65%)",
        }}
      />

      <motion.div
        animate={{
          opacity: [0.3, 0.7, 0.3],
        }}
        transition={{
          repeat: Infinity,
          duration: 4,
        }}
        className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-black"
      />

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6">

        <div className="mb-10 text-center">

          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-cyan-300">

            <Sparkles size={16} />

            OUTSTAND V2

          </div>

          <h1 className="mt-6 text-6xl font-black text-white">

            Outstand

          </h1>

          <p className="mt-4 max-w-lg text-slate-400">

            One button.

            One mission.

            Ten minutes.

            Become better.

          </p>

        </div>

        <Button
  onClick={generate}
  className="h-24 w-72 rounded-full text-2xl"
>
  <Zap className="mr-3" />
  Generate Mission
</Button>

</div>

<MissionReveal
  open={portalOpen}
  color={challenge?.color ?? "#3b82f6"}
/>

</div>
