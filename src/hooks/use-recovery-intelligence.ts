import { useCallback, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { buildRecoveryPlan, type RecoveryInput, type RecoveryPlan } from "@/lib/recovery-intelligence";

type PersistedRecovery = {
  id: string;
  created_at: string;
  signal: string;
  confidence: "low" | "medium" | "high";
  title: string;
  explanation: string;
  action: string;
  should_recover: boolean;
  focus_tasks: number;
  max_minutes: number;
  applied_at: string | null;
  model_version: string;
};

export function useRecoveryIntelligence(roadmapId: string | undefined, input: RecoveryInput | null) {
  const [saving, setSaving] = useState(false);
  const [applied, setApplied] = useState(false);

  const plan = useMemo<RecoveryPlan | null>(() => (roadmapId && input ? buildRecoveryPlan(input) : null), [roadmapId, input]);

  const saveInsight = useCallback(async () => {
    if (!roadmapId || !plan) return false;
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return false;
      const { error } = await supabase.from("roadmap_recovery_insights" as never).insert({
        user_id: session.user.id,
        roadmap_id: roadmapId,
        signal: plan.primaryInsight.signal,
        confidence: plan.primaryInsight.confidence,
        title: plan.primaryInsight.title,
        explanation: plan.primaryInsight.explanation,
        action: plan.primaryInsight.action,
        should_recover: plan.shouldRecover,
        focus_tasks: plan.focusTasks,
        max_minutes: plan.maxMinutes,
        applied_at: null,
        model_version: "recovery-v1",
      } as never);
      return !error;
    } finally {
      setSaving(false);
    }
  }, [plan, roadmapId]);

  const applyRecovery = useCallback(async () => {
    if (!roadmapId || !plan) return false;
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return false;
      const { error } = await supabase.from("roadmap_recovery_insights" as never).insert({
        user_id: session.user.id,
        roadmap_id: roadmapId,
        signal: plan.primaryInsight.signal,
        confidence: plan.primaryInsight.confidence,
        title: plan.primaryInsight.title,
        explanation: plan.primaryInsight.explanation,
        action: plan.primaryInsight.action,
        should_recover: plan.shouldRecover,
        focus_tasks: plan.focusTasks,
        max_minutes: plan.maxMinutes,
        applied_at: new Date().toISOString(),
        model_version: "recovery-v1",
      } as never);
      if (error) return false;
      setApplied(true);
      return true;
    } finally {
      setSaving(false);
    }
  }, [plan, roadmapId]);

  return { plan, saving, applied, saveInsight, applyRecovery };
}
