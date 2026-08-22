import { useCallback, useEffect, useRef, useState } from "react";

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

export function useFocusTimer(onSuccessSync?: (durationMinutes: number) => void) {
  const [state, setState] = useState<TimerState>("idle");
  const [durationMs, setDurationMs] = useState(DEFAULT_DURATION_MS);
  const [endTime, setEndTime] = useState<number | null>(null);
  const [remainingMs, setRemainingMs] = useState(DEFAULT_DURATION_MS);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const completionHandledRef = useRef(false);
  const mountedRef = useRef(true);
  const durationRef = useRef(DEFAULT_DURATION_MS);

  useEffect(() => {
    mountedRef.current = true;
    const savedEnd = readNumber(STORAGE_END);
    const savedDuration = readNumber(STORAGE_DURATION);
    if (savedDuration) {
      durationRef.current = savedDuration;
      setDurationMs(savedDuration);
      setRemainingMs(savedDuration);
    }
    if (!savedEnd || !savedDuration) return () => { mountedRef.current = false; };
    const remaining = savedEnd - Date.now();
    if (remaining > 0) {
      setDurationMs(savedDuration); setEndTime(savedEnd); setRemainingMs(Math.min(savedDuration, remaining)); setState("running");
    } else {
      window.localStorage.removeItem(STORAGE_END); setDurationMs(savedDuration); setRemainingMs(0); setState("completed");
    }
    return () => { mountedRef.current = false; };
  }, []);

  const setDuration = useCallback((minutes: number) => {
    if ((state !== "idle" && state !== "paused" && state !== "completed") || !Number.isFinite(minutes) || minutes <= 0 || minutes > 240) return;
    const ms = Math.round(minutes * 60 * 1000);
    durationRef.current = ms;
    setDurationMs(ms); setRemainingMs(ms); setEndTime(null); setState("idle"); setSaveError(null); completionHandledRef.current = false;
    window.localStorage.removeItem(STORAGE_END); window.localStorage.setItem(STORAGE_DURATION, String(ms));
  }, [state]);

  const start = useCallback(() => {
    if ((state !== "idle" && state !== "paused") || remainingMs <= 0) return;
    const activeDuration = durationRef.current;
    const end = Date.now() + remainingMs;
    completionHandledRef.current = false; setSaveError(null); setEndTime(end); setState("running");
    setDurationMs(activeDuration);
    window.localStorage.setItem(STORAGE_END, String(end)); window.localStorage.setItem(STORAGE_DURATION, String(activeDuration));
  }, [remainingMs, state]);

  const pause = useCallback(() => {
    if (state !== "running") return;
    const nextRemaining = endTime ? Math.max(0, endTime - Date.now()) : remainingMs;
    setRemainingMs(nextRemaining); setEndTime(null); setState(nextRemaining === 0 ? "completed" : "paused"); window.localStorage.removeItem(STORAGE_END);
  }, [endTime, remainingMs, state]);

  const reset = useCallback(() => {
    setState("idle"); setRemainingMs(durationRef.current); setEndTime(null); setIsSaving(false); setSaveError(null); completionHandledRef.current = false;
    window.localStorage.removeItem(STORAGE_END); window.localStorage.setItem(STORAGE_DURATION, String(durationRef.current));
  }, []);

  useEffect(() => {
    if (state !== "running" || endTime == null) return;
    const complete = async () => {
      if (completionHandledRef.current) return;
      completionHandledRef.current = true;
      const completedMinutes = Math.max(1, Math.round(durationMs / 60000));
      window.localStorage.removeItem(STORAGE_END); setState("completed"); setEndTime(null); setRemainingMs(0); setIsSaving(false); setSaveError(null);
      if (mountedRef.current) onSuccessSync?.(completedMinutes);
    };
    const tick = () => {
      const nextRemaining = Math.max(0, endTime - Date.now());
      setRemainingMs(nextRemaining);
      if (nextRemaining === 0) void complete();
    };
    tick();
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, [durationMs, endTime, onSuccessSync, state]);

  const safeDuration = Math.max(1, durationMs);
  const remaining = Math.min(Math.max(0, remainingMs), safeDuration);
  const minutes = Math.floor(remaining / 60000).toString().padStart(2, "0");
  const seconds = Math.floor((remaining % 60000) / 1000).toString().padStart(2, "0");
  const progressPercent = Math.min(100, Math.max(0, ((safeDuration - remaining) / safeDuration) * 100));
  return { state, minutes, seconds, progressPercent, isSaving, saveError, setDuration, start, pause, reset };
}
