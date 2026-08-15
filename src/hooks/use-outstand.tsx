import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useAppState } from "@/hooks/use-app-state";
import { useDailyLog } from "@/hooks/use-dopamine";
import { CHALLENGES, randomChallenge, type OutstandChallenge } from "@/lib/Index";
import { supabase } from "@/integrations/supabase/client";

export function useOutstand() {
  const { recordOutstand } = useAppState();
  const { addPositive } = useDailyLog();
  const [challenge, setChallenge] = useState<OutstandChallenge | null>(null);
  const [remaining, setRemaining] = useState(600);
  const [running, setRunning] = useState(false);
  const [isShuffling, setIsShuffling] = useState(false);
  const [shuffleDisplay, setShuffleDisplay] = useState({ emoji: "⚡", title: "Locating Mission..." });
  const [completionStage, setCompletionStage] = useState<0 | 1 | 2>(0);

  const intervalRef = useRef<number | null>(null);
  const shuffleRef = useRef<number | null>(null);
  const completionTimersRef = useRef<number[]>([]);
  const mountedRef = useRef(true);

  const clearTimer = useCallback((ref: React.MutableRefObject<number | null>) => {
    if (ref.current !== null) {
      window.clearInterval(ref.current);
      ref.current = null;
    }
  }, []);

  const clearCompletionTimers = useCallback(() => {
    completionTimersRef.current.forEach((timer) => window.clearTimeout(timer));
    completionTimersRef.current = [];
  }, []);

  const generate = useCallback(() => {
    clearTimer(intervalRef);
    clearTimer(shuffleRef);
    clearCompletionTimers();
    setRunning(false);
    setCompletionStage(0);
    setIsShuffling(true);
    setChallenge(null);

    let ticks = 0;
    shuffleRef.current = window.setInterval(() => {
      const temp = CHALLENGES[Math.floor(Math.random() * CHALLENGES.length)];
      setShuffleDisplay({ emoji: temp.emoji, title: temp.title });
      ticks += 1;

      if (ticks > 12) {
        clearTimer(shuffleRef);
        const next = randomChallenge(challenge?.title);
        const duration = Math.max(1, Number(next.durationMinutes ?? 10)) * 60;
        setChallenge(next);
        setRemaining(duration);
        setIsShuffling(false);
      }
    }, 80);
  }, [challenge?.title, clearCompletionTimers, clearTimer]);

  const loadChallenge = useCallback((id: string) => {
    const specificChallenge = CHALLENGES.find((item) => item.id === id);
    if (!specificChallenge) {
      console.warn(`Outstand challenge with ID "${id}" not found.`);
      return;
    }

    clearTimer(intervalRef);
    clearTimer(shuffleRef);
    clearCompletionTimers();
    setChallenge(specificChallenge);
    setRemaining(Math.max(1, Number(specificChallenge.durationMinutes ?? 10)) * 60);
    setRunning(false);
    setIsShuffling(false);
    setCompletionStage(0);
  }, [clearCompletionTimers, clearTimer]);

  useEffect(() => {
    if (!running || remaining <= 0) return;
    clearTimer(intervalRef);
    intervalRef.current = window.setInterval(() => {
      setRemaining((current) => {
        if (current <= 1) {
          clearTimer(intervalRef);
          setRunning(false);
          if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate([200, 100, 200]);
          toast.success("Time's up! Mission complete.");
          return 0;
        }
        return current - 1;
      });
    }, 1000);
    return () => clearTimer(intervalRef);
  }, [clearTimer, running, remaining]);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      clearTimer(intervalRef);
      clearTimer(shuffleRef);
      clearCompletionTimers();
    };
  }, [clearCompletionTimers, clearTimer]);

  const complete = useCallback(() => {
    if (!challenge || completionStage !== 0) return;

    const xpEarned = Math.max(0, Number(challenge.xp ?? 50));
    const challengeEmoji = challenge.emoji;
    const challengeColor = challenge.color || "#4f46e5";
    const challengeTitle = challenge.title;
    const challengeDuration = Math.max(1, Number(challenge.durationMinutes ?? 10));

    clearTimer(intervalRef);
    clearTimer(shuffleRef);
    clearCompletionTimers();
    setRunning(false);
    setCompletionStage(1);

    if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate([20, 100, 30, 80, 50, 50, 100]);

    void supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user || !mountedRef.current) return;
      const { error } = await supabase.from("outstand_logs").insert({
        user_id: session.user.id,
        challenge_id: challenge.id,
        title: challengeTitle,
        xp_earned: xpEarned,
        duration_minutes: challengeDuration,
      });
      if (error) console.error("Outstand sync failed:", error.message);
    });

    completionTimersRef.current.push(window.setTimeout(() => {
      if (mountedRef.current) setCompletionStage(2);
    }, 1500));

    completionTimersRef.current.push(window.setTimeout(() => {
      if (!mountedRef.current) return;
      recordOutstand(challengeTitle, xpEarned);
      addPositive("outstand");
      toast.custom((t) => (
        <div className="relative mx-auto flex w-full max-w-[360px] items-center gap-4 overflow-hidden rounded-2xl border border-white/10 bg-[#050810] p-4" style={{ boxShadow: `0 20px 40px -10px ${challengeColor}60` }}>
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-50" />
          <div className="relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-black/50 text-3xl shadow-[inset_0_0_20px_rgba(255,255,255,0.1)]">{challengeEmoji}</div>
          <div className="relative z-10 flex-1"><h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/70">Mission Cleared</h3><div className="mt-1 font-mono text-2xl font-black leading-none text-white">+{xpEarned} <span className="text-sm opacity-50">XP</span></div></div>
        </div>
      ), { id: `outstand-${challenge.id}`, duration: 4000 });
      setChallenge(null);
      setCompletionStage(0);
      completionTimersRef.current = [];
    }, 2800));
  }, [addPositive, challenge, clearCompletionTimers, clearTimer, completionStage, recordOutstand]);

  return {
    challenge,
    remaining,
    running,
    setRunning,
    setRemaining,
    isShuffling,
    shuffleDisplay,
    completionStage,
    generate,
    complete,
    loadChallenge,
    mins: Math.floor(remaining / 60),
    secs: remaining % 60,
  };
}
