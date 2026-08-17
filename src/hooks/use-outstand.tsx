import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useAppState } from "@/hooks/use-app-state";
import { useDailyLog } from "@/hooks/use-dopamine";
import { CHALLENGES } from "@/lib/challenges.data";
import { OUTSTAND_10M_CHALLENGES } from "@/lib/outstand-10m.data";
import type { OutstandChallenge } from "@/lib/challenges.types";
import { supabase } from "@/integrations/supabase/client";

const pickChallenge = (currentId?: string) => {
  const pool = OUTSTAND_10M_CHALLENGES.filter((item) => item.id !== currentId);
  return pool[Math.floor(Math.random() * pool.length)] ?? OUTSTAND_10M_CHALLENGES[0];
};

const tenMinuteChallengeById = (id: string) => {
  const focused = OUTSTAND_10M_CHALLENGES.find((item) => item.id === id);
  if (focused) return focused;
  const legacy = CHALLENGES.find((item) => item.id === id && item.durationMinutes === 10);
  return legacy ?? null;
};

export function useOutstand() {
  const { recordOutstand } = useAppState();
  const { addPositive } = useDailyLog();
  const [challenge, setChallenge] = useState<OutstandChallenge | null>(null);
  const [remaining, setRemaining] = useState(600);
  const [running, setRunning] = useState(false);
  const [isShuffling, setIsShuffling] = useState(false);
  const [shuffleDisplay] = useState({ emoji: "⚡", title: "Your next move" });
  const [completionStage, setCompletionStage] = useState<0 | 1 | 2>(0);
  const remainingRef = useRef(remaining);
  const completionTimerRef = useRef<number | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    remainingRef.current = remaining;
  }, [remaining]);

  const stopCompletionTimer = useCallback(() => {
    if (completionTimerRef.current !== null) {
      window.clearTimeout(completionTimerRef.current);
      completionTimerRef.current = null;
    }
  }, []);

  const generate = useCallback(() => {
    stopCompletionTimer();
    const next = pickChallenge(challenge?.id);
    setRunning(false);
    setCompletionStage(0);
    setIsShuffling(false);
    setChallenge(next);
    const nextSeconds = Math.max(1, next?.durationMinutes ?? 10) * 60;
    remainingRef.current = nextSeconds;
    setRemaining(nextSeconds);
  }, [challenge?.id, stopCompletionTimer]);

  const loadChallenge = useCallback((id: string) => {
    const specificChallenge = tenMinuteChallengeById(id);
    if (!specificChallenge) {
      console.warn(`Outstand ten-minute challenge with ID "${id}" not found.`);
      return;
    }
    stopCompletionTimer();
    setChallenge(specificChallenge);
    setRemaining(600);
    remainingRef.current = 600;
    setRunning(false);
    setIsShuffling(false);
    setCompletionStage(0);
  }, [stopCompletionTimer]);

  useEffect(() => {
    if (!running) return;
    const interval = window.setInterval(() => {
      const next = Math.max(0, remainingRef.current - 1);
      remainingRef.current = next;
      setRemaining(next);
      if (next === 0) {
        setRunning(false);
        if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate([120, 80, 120]);
        toast.success("Ten minutes complete. Nice work.");
      }
    }, 1000);
    return () => window.clearInterval(interval);
  }, [running]);

  useEffect(() => () => {
    mountedRef.current = false;
    stopCompletionTimer();
  }, [stopCompletionTimer]);

  const complete = useCallback(() => {
    if (!challenge || remainingRef.current !== 0 || completionStage !== 0) return;

    const xpEarned = Math.max(0, Number(challenge.xpReward ?? 50));
    const challengeTitle = challenge.title;
    const challengeDuration = 10;
    const challengeId = challenge.id;

    setRunning(false);
    setCompletionStage(1);
    if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate([20, 70, 30]);

    void supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user || !mountedRef.current) return;
      const { error } = await supabase.from("outstand_logs").insert({
        user_id: session.user.id,
        challenge_id: challengeId,
        title: challengeTitle,
        xp_earned: xpEarned,
        duration_minutes: challengeDuration,
      });
      if (error) console.error("Outstand sync failed:", error.message);
    });

    completionTimerRef.current = window.setTimeout(() => {
      if (!mountedRef.current) return;
      recordOutstand(challengeTitle, xpEarned);
      addPositive("outstand");
      toast.success(`Mission cleared · +${xpEarned} XP`);
      setChallenge(null);
      setCompletionStage(0);
      completionTimerRef.current = null;
    }, 1200);
  }, [addPositive, challenge, completionStage, recordOutstand]);

  return {
    challenge,
    remaining,
    running,
    setRunning,
    setRemaining: (value: number) => {
      remainingRef.current = value;
      setRemaining(value);
    },
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
