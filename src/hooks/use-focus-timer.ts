import { useState, useEffect, useCallback } from 'react';

type TimerState = 'idle' | 'running' | 'paused' | 'completed';

export function useFocusTimer(onComplete: (minutes: number) => void) {
  const [state, setState] = useState<TimerState>('idle');
  const [durationMs, setDurationMs] = useState<number>(25 * 60 * 1000); // 25 mins default
  const [remainingMs, setRemainingMs] = useState<number>(durationMs);
  const [endTime, setEndTime] = useState<number | null>(null);

  const setDuration = useCallback((minutes: number) => {
    if (state === 'idle') {
      const ms = minutes * 60 * 1000;
      setDurationMs(ms);
      setRemainingMs(ms);
    }
  }, [state]);

  const start = useCallback(() => {
    setEndTime(Date.now() + remainingMs);
    setState('running');
  }, [remainingMs]);

  const pause = useCallback(() => {
    setState('paused');
    setEndTime(null);
  }, []);

  const reset = useCallback(() => {
    setState('idle');
    setRemainingMs(durationMs);
    setEndTime(null);
  }, [durationMs]);

  useEffect(() => {
    if (state !== 'running' || !endTime) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const timeLeft = Math.max(0, endTime - now);

      setRemainingMs(timeLeft);

      if (timeLeft === 0) {
        setState('completed');
        setEndTime(null);
        onComplete(Math.floor(durationMs / 60000));
      }
    }, 200); // 200ms tick for UI smoothness, math is based on Date.now()

    return () => clearInterval(interval);
  }, [state, endTime, durationMs, onComplete]);

  const minutes = Math.floor(remainingMs / 60000).toString().padStart(2, '0');
  const seconds = Math.floor((remainingMs % 60000) / 1000).toString().padStart(2, '0');
  const progressPercent = Math.min(100, Math.max(0, ((durationMs - remainingMs) / durationMs) * 100));

  return { state, minutes, seconds, progressPercent, setDuration, start, pause, reset };
}
