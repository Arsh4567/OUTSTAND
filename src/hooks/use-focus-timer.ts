import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../integrations/supabase/client';

type TimerState = 'idle' | 'running' | 'paused' | 'completed';

export function useFocusTimer(onSuccessSync?: () => void) {
  const [state, setState] = useState<TimerState>('idle');
  const [durationMs, setDurationMs] = useState<number>(25 * 60 * 1000);
  const [endTime, setEndTime] = useState<number | null>(null);
  const [remainingMs, setRemainingMs] = useState<number>(durationMs);
  const [isSaving, setIsSaving] = useState(false);

  // Restore from LocalStorage on mount to survive refreshes
  useEffect(() => {
    const savedEndTime = localStorage.getItem('outstand_timer_end');
    const savedDuration = localStorage.getItem('outstand_timer_duration');
    
    if (savedEndTime && savedDuration) {
      const end = parseInt(savedEndTime, 10);
      const dur = parseInt(savedDuration, 10);
      const now = Date.now();

      if (end > now) {
        setDurationMs(dur);
        setEndTime(end);
        setRemainingMs(end - now);
        setState('running');
      } else {
        localStorage.removeItem('outstand_timer_end');
      }
    }
  }, []);

  const setDuration = useCallback((minutes: number) => {
    if (state === 'idle') {
      const ms = minutes * 60 * 1000;
      setDurationMs(ms);
      setRemainingMs(ms);
    }
  }, [state]);

  const start = useCallback(() => {
    const end = Date.now() + remainingMs;
    setEndTime(end);
    setState('running');
    localStorage.setItem('outstand_timer_end', end.toString());
    localStorage.setItem('outstand_timer_duration', durationMs.toString());
  }, [remainingMs, durationMs]);

  const pause = useCallback(() => {
    setState('paused');
    setEndTime(null);
    localStorage.removeItem('outstand_timer_end');
  }, []);

  const reset = useCallback(() => {
    setState('idle');
    setRemainingMs(durationMs);
    setEndTime(null);
    localStorage.removeItem('outstand_timer_end');
  }, [durationMs]);

  // The actual countdown tick
  useEffect(() => {
    if (state !== 'running' || !endTime) return;

    const interval = setInterval(async () => {
      const now = Date.now();
      const timeLeft = Math.max(0, endTime - now);
      setRemainingMs(timeLeft);

      if (timeLeft === 0) {
        clearInterval(interval);
        setState('completed');
        setEndTime(null);
        localStorage.removeItem('outstand_timer_end');
        
        // Securely Persist to Supabase
        setIsSaving(true);
        const { error } = await supabase.rpc('log_focus_session', { 
          p_duration_minutes: Math.floor(durationMs / 60000) 
        });
        setIsSaving(false);

        if (!error && onSuccessSync) {
          onSuccessSync(); // Refresh dashboard data
        }
      }
    }, 500);

    return () => clearInterval(interval);
  }, [state, endTime, durationMs, onSuccessSync]);

  const minutes = Math.floor(remainingMs / 60000).toString().padStart(2, '0');
  const seconds = Math.floor((remainingMs % 60000) / 1000).toString().padStart(2, '0');
  const progressPercent = Math.min(100, Math.max(0, ((durationMs - remainingMs) / durationMs) * 100));

  return { state, minutes, seconds, progressPercent, isSaving, setDuration, start, pause, reset };
      }
