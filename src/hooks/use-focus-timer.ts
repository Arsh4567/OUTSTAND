import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../integrations/supabase/client";

type TimerState = "idle" | "running" | "paused" | "completed";

const DEFAULT_DURATION_MS = 25 * 60 * 1000;

export function useFocusTimer(onSuccessSync?: () => void) {
  const [state, setState] = useState<TimerState>("idle");
  const [durationMs, setDurationMs] = useState(DEFAULT_DURATION_MS);
  const [endTime, setEndTime] = useState<number | null>(null);
  const [remainingMs, setRemainingMs] = useState(DEFAULT_DURATION_MS);
  const [isSaving, setIsSaving] = useState(false);
  const completionHandledRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => () => { mountedRef.current = false; }, []);

  const setDuration = useCallback((minutes: number) => {
    if ((state !== "idle" && state !== "paused") || !Number.isFinite(minutes) || minutes <= 0 || minutes > 240) return;
    const ms = Math.round(minutes * 60 * 1000);
    setDurationMs(ms);
    setRemainingMs(ms);
    setEndTime(null);
    setState("idle");
    completionHandledRef.current = false;
  }, [state]);

  const start = useCallback(() => {
    if ((state !== "idle" && state !== "paused") || remainingMs <= 0) return;
    completionHandledRef.current = false;
    setEndTime(Date.now() + remainingMs);
    setState("running");
  }, [remainingMs, state]);

  const pause = useCallback(() => {
    if (state !== "running") return;
    const nextRemaining = endTime ? Math.max(0, endTime - Date.now()) : remainingMs;
    setRemainingMs(nextRemaining);
    setEndTime(null);
    setState(nextRemaining === 0 ? "completed" : "paused");
  }, [endTime, remainingMs, state]);

  const reset = useCallback(() => {
    setState("idle");
    setRemainingMs(durationMs);
    setEndTime(null);
    setIsSaving(false);
    completionHandledRef.current = false;
  }, [durationMs]);

  useEffect(() => {
    if (state !== "running" || endTime == null) return;

    const complete = async () => {
      if (completionHandledRef.current) return;
      completionHandledRef.current = true;
      setState("completed");
      setEndTime(null);
      setRemainingMs(0);
      setIsSaving(true);

      try {
        const { error } = await supabase.rpc("log_focus_session", {
          p_duration_minutes: Math.max(1, Math.round(durationMs / 60000)),
        });
        if (error) {
          console.error("Failed to persist focus session:", error);
          return;
        }
        onSuccessSync?.();
      } finally {
        if (mountedRef.current) setIsSaving(false);
      }
    };

    const tick = () => {
      const nextRemaining = Math.max(0, endTime - Date.now());
      setRemainingMs(nextRemaining);
      if (nextRemaining === 0) void complete();
    };

    tick();
    const interval = window.setInterval(tick, 250);
    return () => window.clearInterval(interval);
  }, [durationMs, endTime, onSuccessSync, state]);

  const safeDuration = Math.max(1, durationMs);
  const remaining = Math.min(Math.max(0, remainingMs), safeDuration);
  const minutes = Math.floor(remaining / 60000).toString().padStart(2, "0");
  const seconds = Math.floor((remaining % 60000) / 1000).toString().padStart(2, "0");
  const progressPercent = Math.min(100, Math.max(0, ((safeDuration - remaining) / safeDuration) * 100));

  return { state, minutes, seconds, progressPercent, isSaving, setDuration, start, pause, reset };
}
