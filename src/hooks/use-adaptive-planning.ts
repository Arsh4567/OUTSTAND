import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { buildAdaptiveRecommendation, type AdaptiveInput, type AdaptiveRecommendation } from "@/lib/adaptive-planning";

type Snapshot = {
  id: string;
  generated_at: string;
  status: AdaptiveRecommendation["status"];
  completion_pct: number;
  pace_ratio: number;
  remaining_required: number;
  available_days: number;
  recommendation: { headline: string; explanation: string; action: string };
};

export function useAdaptivePlanning(roadmapId: string | undefined, input: AdaptiveInput | null) {
  const [recommendation, setRecommendation] = useState<AdaptiveRecommendation | null>(null);
  const [latest, setLatest] = useState<Snapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const analyze = useCallback(async () => {
    if (!roadmapId || !input) return;
    setLoading(true);
    const next = buildAdaptiveRecommendation(input);
    setRecommendation(next);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setLoading(false); return; }

    const { data } = await supabase
      .from("roadmap_adaptation_snapshots" as never)
      .select("id, generated_at, status, completion_pct, pace_ratio, remaining_required, available_days, recommendation")
      .eq("roadmap_id" as never, roadmapId)
      .eq("user_id" as never, session.user.id)
      .order("generated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    setLatest((data || null) as Snapshot | null);
    setLoading(false);
  }, [roadmapId, input]);

  useEffect(() => { void analyze(); }, [analyze]);

  const saveInsight = useCallback(async () => {
    if (!roadmapId || !recommendation) return false;
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return false;
      const { data, error } = await supabase.from("roadmap_adaptation_snapshots" as never).insert({
        user_id: session.user.id,
        roadmap_id: roadmapId,
        status: recommendation.status,
        completion_pct: recommendation.completionPct,
        pace_ratio: recommendation.paceRatio,
        remaining_required: recommendation.remainingRequired,
        available_days: recommendation.availableDays,
        recommendation: {
          headline: recommendation.headline,
          explanation: recommendation.explanation,
          action: recommendation.action,
        },
        accepted_at: new Date().toISOString(),
      } as never).select().single();
      if (error) return false;
      setLatest(data as Snapshot);
      return true;
    } finally { setSaving(false); }
  }, [roadmapId, recommendation]);

  return { recommendation, latest, loading, saving, refresh: analyze, saveInsight };
}
