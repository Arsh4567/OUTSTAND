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

// 1. EXPLICITLY EXPORTED to fix the Vercel build error
export function useDailyLog(dateISO: string = todayISO()) {
  const { user } = useAuth();
  
  const [log, setLog] = useState<DailyLog | null>(() => {
    try {
      const saved = localStorage.getItem(getStorageKey(dateISO));
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });
  
  const [loading, setLoading] = useState(true);

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

  const upsert = useCallback(
    async (positives: PositiveKey[], negatives: NegativeKey[]) => {
      if (!user) return;
      
      const score = computeScore(positives, negatives);
      const optimistic: DailyLog = { log_date: dateISO, positives, negatives, score };
      
      setLog(optimistic);
      localStorage.setItem(getStorageKey(dateISO), JSON.stringify(optimistic));

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

// 2. EXPLICITLY EXPORTED and Hardened to fix the Profile crash
export function useWeeklyLogs(days = 7) {
  const { user } = useAuth();
  
  // Initialize with empty array so UI components don't crash on mount
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      setLogs([]); // Ensure we return empty array, not undefined
      return;
    }

    const load = async () => {
      setLoading(true);
      const dates = lastNDays(days);
      const start = dates[0];

      try {
        const { data, error } = await supabase
          .from("daily_logs")
          .select("log_date, positives, negatives, score")
          .eq("user_id", user.id)
          .gte("log_date", start)
          .order("log_date", { ascending: true });

        if (error) throw error;

        // Map existing data into a map for fast lookup
        const byDate = new Map<string, DailyLog>();
        (data ?? []).forEach((d) => {
          byDate.set(d.log_date, {
            log_date: d.log_date,
            positives: (Array.isArray(d.positives) ? d.positives : []) as PositiveKey[],
            negatives: (Array.isArray(d.negatives) ? d.negatives : []) as NegativeKey[],
            score: typeof d.score === 'number' ? d.score : 50,
          });
        });

        // Fill in missing dates so the chart doesn't break
        const completeLogs = dates.map((d) => 
          byDate.get(d) ?? { log_date: d, positives: [], negatives: [], score: 50 }
        );

        setLogs(completeLogs);
      } catch (err) {
        console.error("Failed to load weekly logs:", err);
        setLogs([]); // Crash prevention
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user?.id, days]);

  return { logs, loading };
          }
