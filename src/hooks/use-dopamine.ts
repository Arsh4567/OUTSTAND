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

export function useDailyLog(dateISO: string = todayISO()) {
  const { user } = useAuth();
  const [log, setLog] = useState<DailyLog | null>(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("daily_logs")
      .select("log_date, positives, negatives, score")
      .eq("user_id", user.id)
      .eq("log_date", dateISO)
      .maybeSingle();
    setLog(
      data
        ? {
            log_date: data.log_date,
            positives: (data.positives as PositiveKey[]) ?? [],
            negatives: (data.negatives as NegativeKey[]) ?? [],
            score: data.score,
          }
        : { log_date: dateISO, positives: [], negatives: [], score: 50 },
    );
    setLoading(false);
  }, [user, dateISO]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const upsert = useCallback(
    async (positives: PositiveKey[], negatives: NegativeKey[]) => {
      if (!user) return;
      const score = computeScore(positives, negatives);
      const optimistic = { log_date: dateISO, positives, negatives, score };
      setLog(optimistic);
      await supabase
        .from("daily_logs")
        .upsert({ user_id: user.id, log_date: dateISO, positives, negatives, score }, { onConflict: "user_id,log_date" });
    },
    [user, dateISO],
  );

  const togglePositive = useCallback(
    async (key: PositiveKey) => {
      const positives: PositiveKey[] = log?.positives ?? [];
      const negatives: NegativeKey[] = log?.negatives ?? [];
      const next = positives.includes(key) ? positives.filter((k) => k !== key) : [...positives, key];
      await upsert(next, negatives);
    },
    [log, upsert],
  );

  const toggleNegative = useCallback(
    async (key: NegativeKey) => {
      const positives: PositiveKey[] = log?.positives ?? [];
      const negatives: NegativeKey[] = log?.negatives ?? [];
      const next = negatives.includes(key) ? negatives.filter((k) => k !== key) : [...negatives, key];
      await upsert(positives, next);
    },
    [log, upsert],
  );

  const addPositive = useCallback(
    async (key: PositiveKey) => {
      const positives: PositiveKey[] = log?.positives ?? [];
      const negatives: NegativeKey[] = log?.negatives ?? [];
      if (positives.includes(key)) return;
      await upsert([...positives, key], negatives);
    },
    [log, upsert],
  );

  const addNegative = useCallback(
    async (key: NegativeKey) => {
      const positives: PositiveKey[] = log?.positives ?? [];
      const negatives: NegativeKey[] = log?.negatives ?? [];
      if (negatives.includes(key)) return;
      await upsert(positives, [...negatives, key]);
    },
    [log, upsert],
  );

  return { log, loading, togglePositive, toggleNegative, addPositive, addNegative, refetch };
}

export function useWeeklyLogs(days = 7) {
  const { user } = useAuth();
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const dates = lastNDays(days);
    const start = dates[0];
    supabase
      .from("daily_logs")
      .select("log_date, positives, negatives, score")
      .eq("user_id", user.id)
      .gte("log_date", start)
      .order("log_date", { ascending: true })
      .then(({ data }) => {
        const byDate = new Map<string, DailyLog>();
        (data ?? []).forEach((d) => {
          byDate.set(d.log_date, {
            log_date: d.log_date,
            positives: (d.positives as PositiveKey[]) ?? [],
            negatives: (d.negatives as NegativeKey[]) ?? [],
            score: d.score,
          });
        });
        setLogs(
          dates.map(
            (d) => byDate.get(d) ?? { log_date: d, positives: [], negatives: [], score: 50 },
          ),
        );
        setLoading(false);
      });
  }, [user, days]);

  return { logs, loading };
}
