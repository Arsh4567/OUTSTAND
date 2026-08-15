import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../integrations/supabase/client";

type TimerState = "idle" | "running" | "paused" | "completed";
const DEFAULT_DURATION_MS = 25 * 60 * 1000;
const STORAGE_END = "outstand_timer_end";
const STORAGE_DURATION = "outstand_timer_duration";

function readNumber(key: string): number | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(key);
  if (!raw) return null;
  const value = Number(raw);
  return Number.isFinite(value) && value > 0 ? value : null;
}

export function useFocusTimer(onSuccessSync?: () => void) {
  const [state, setState] = useState<TimerState>("idle");
  const [durationMs, setDurationMs] = useState(DEFAULT_DURATION_MS);
  const [endTime, setEndTime] = useState<number | null>(null);
  const [remainingMs, setRemainingMs] = useState(DEFAULT_DURATION_MS);
  const [isSaving, setIsSaving] = useState(false);
  const completionHandledRef = useRef(false);

  useEffect(() => {
    const savedEnd = readNumber(STORAGE_END);
    const savedDuration = readNumber(STORAGE_DURATION);
    if (!savedEnd || !savedDuration) {
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(STORAGE_END);
        window.localStorage.removeItem(STORAGE_DURATION);
      }
      return;
    }

    const now = Date.now();
    if (savedEnd > now) {
      setDurationMs(savedDuration);
      setEndTime(savedEnd);
      setRemainingMs(savedEnd - now);
      setState("running");
    } else {
      window.localStorage.removeItem(STORAGE_END);
      window.localStorage.removeItem(STORAGE_DURATION);
      setState("completed");
      setRemainingMs(0);
    }
  }, []);

  const setDuration = useCallback((minutes: number) => {
    if (state !== "idle" || !Number.isFinite(minutes) || minutes <= 0) return;
    const ms = Math.round(minutes * 60 * 1000);
    setDurationMs(ms);
    setRemainingMs(ms);
  }, [state]);

  const start = useCallback(() => {
    if (state === "completed") {
      setRemainingMs(durationMs);
      setState("idle");
      completionHandledRef.current = false;
      return;
    }
    if (state === "running") return;

    const end = Date.now() + Math.max(0, remainingMs);
    completionHandledRef.current = false;
    setEndTime(end);
    setState("running");

    window.localStorage.setItem(STORAGE_END, String(end));
    window.localStorage.setItem(STORAGE_DURATION, String(durationMs));
  }, [durationMs, remainingMs, state]);

  const pause = useCallback(() => {
    if (state !== "running") return;
    const nextRemaining = endTime ? Math.max(0, endTime - Date.now()) : remainingMs;
    setRemainingMs(nextRemaining);
    setState("paused");
    setEndTime(null);
    window.localStorage.removeItem(STORAGE_END);
  }, [endTime, remainingMs, state]);

  const reset = useCallback(() => {
    setState("idle");
    setRemainingMs(durationMs);
    setEndTime(null);
    setIsSaving(false);
    completionHandledRef.current = false;
    window.localStorage.removeItem(STORAGE_END);
    window.localStorage.removeItem(STORAGE_DURATION);
  }, [durationMs]);

  useEffect(() => {
    if (state !== "running" || endTime == null) return;

    const tick = () => {
      const timeLeft = Math.max(0, endTime - Date.now());
      setRemainingMs(timeLeft);
      if (timeLeft > 0 || completionHandledRef.current) return;

      completionHandledRef.current = true;
      setState("completed");
      setEndTime(null);
      window.localStorage.removeItem(STORAGE_END);

      void (async () => {
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
          setIsSaving(false);
        }
      })();
    };

    tick();
    const interval = window.setInterval(tick, 250);
    return () => window.clearInterval(interval);
  }, [durationMs, endTime, onSuccessSync, state]);

  useEffect(() => {
    return () => {
      window.localStorage.removeItem(STORAGE_END);
    };
  }, []);

  const minutes = Math.floor(remainingMs / 60000).toString().padStart(2, "0");
  const seconds = Math.floor((remainingMs % 60000) / 1000).toString().padStart(2, "0");
  const progressPercent = durationMs > 0
    ? Math.min(100, Math.max(0, ((durationMs - remainingMs) / durationMs) * 100))
    : 0;

  return { state, minutes, seconds, progressPercent, isSaving, setDuration, start, pause, reset };
}
