import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { computeScore, type PositiveKey, type NegativeKey } from "@/lib/dopamine";
import { todayISO, lastNDays } from "@/lib/habits";

export type DailyLog = {
  log_date: string;
  positives: PositiveKey[];
  negatives: NegativeKey[];
  score: number;
};

const getStorageKey = (date: string) => `dopamine_log_${date}`;

export function useDailyLog(dateISO: string = todayISO()) {
  const { user } = useAuth();
  
  // 1. SAFE INITIALIZATION: Try-catch handles corrupted local storage
  const [log, setLog] = useState<DailyLog | null>(() => {
    try {
      const saved = localStorage.getItem(getStorageKey(dateISO));
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      localStorage.removeItem(getStorageKey(dateISO));
      return null;
    }
  });
  
  const [loading, setLoading] = useState(true);

  // 2. ROBUST REFETCH: Sanitizes data incoming from Supabase
  const refetch = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from("daily_logs")
        .select("log_date, positives, negatives, score")
        .eq("user_id", user.id)
        .eq("log_date", dateISO)
        .maybeSingle();

      if (error) throw error;

      // Sanitization: Ensure data arrays are actually arrays and score is a number
      const fetchedLog: DailyLog = {
        log_date: data?.log_date ?? dateISO,
        positives: Array.isArray(data?.positives) ? (data.positives as PositiveKey[]) : [],
        negatives: Array.isArray(data?.negatives) ? (data.negatives as NegativeKey[]) : [],
        score: typeof data?.score === 'number' ? data.score : 50,
      };

      setLog(fetchedLog);
      localStorage.setItem(getStorageKey(dateISO), JSON.stringify(fetchedLog));
    } catch (err) {
      console.error("Data fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [user, dateISO]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  // 3. OPTIMISTIC UPSERT: Updates UI instantly, saves locally, syncs to server
  const upsert = useCallback(
    async (positives: PositiveKey[], negatives: NegativeKey[]) => {
      if (!user) return;
      
      const score = computeScore(positives, negatives);
      const optimistic: DailyLog = { log_date: dateISO, positives, negatives, score };
      
      // Update UI immediately
      setLog(optimistic);
      localStorage.setItem(getStorageKey(dateISO), JSON.stringify(optimistic));

      // Attempt background sync
      const { error } = await supabase
        .from("daily_logs")
        .upsert({ user_id: user.id, log_date: dateISO, positives, negatives, score }, { onConflict: "user_id,log_date" });
      
      if (error) console.error("Sync failed:", error);
    },
    [user, dateISO],
  );

  const togglePositive = useCallback(async (key: PositiveKey) => {
    const positives = log?.positives ?? [];
    const negatives = log?.negatives ?? [];
    const next = positives.includes(key) ? positives.filter((k) => k !== key) : [...positives, key];
    await upsert(next, negatives);
  }, [log, upsert]);

  const toggleNegative = useCallback(async (key: NegativeKey) => {
    const positives = log?.positives ?? [];
    const negatives = log?.negatives ?? [];
    const next = negatives.includes(key) ? negatives.filter((k) => k !== key) : [...negatives, key];
    await upsert(positives, next);
  }, [log, upsert]);

  const addPositive = useCallback(async (key: PositiveKey) => {
    if (log?.positives.includes(key)) return;
    await upsert([...(log?.positives ?? []), key], log?.negatives ?? []);
  }, [log, upsert]);

  const addNegative = useCallback(async (key: NegativeKey) => {
    if (log?.negatives.includes(key)) return;
    await upsert(log?.positives ?? [], [...(log?.negatives ?? []), key]);
  }, [log, upsert]);

  return { log, loading, togglePositive, toggleNegative, addPositive, addNegative, refetch };
}

// 4. MISSING EXPORT ADDED: useWeeklyLogs logic for trend tracking
export function useWeeklyLogs(days = 7) {
  const { user } = useAuth();
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const dates = lastNDays(days);
    const start = dates[0];

    const load = async () => {
      try {
        const { data, error } = await supabase
          .from("daily_logs")
          .select("log_date, positives, negatives, score")
          .eq("user_id", user.id)
          .gte("log_date", start)
          .order("log_date", { ascending: true });

        if (error) throw error;

        const byDate = new Map<string, DailyLog>();
        (data ?? []).forEach((d) => {
          byDate.set(d.log_date, {
            log_date: d.log_date,
            positives: (d.positives as PositiveKey[]) ?? [],
            negatives: (d.negatives as NegativeKey[]) ?? [],
            score: typeof d.score === 'number' ? d.score : 50,
          });
        });

        setLogs(
          dates.map(
            (d) => byDate.get(d) ?? { log_date: d, positives: [], negatives: [], score: 50 },
          ),
        );
      } catch (err) {
        console.error("Failed to load weekly logs:", err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user, days]);

  return { logs, loading };
}
