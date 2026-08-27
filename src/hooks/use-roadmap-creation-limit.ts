import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type LimitState = {
  count: number;
  allowed: boolean;
  nextAvailableAt: string | null;
  reason: "ok" | "cooldown" | "limit_reached";
};

const initialState: LimitState = { count: 0, allowed: true, nextAvailableAt: null, reason: "ok" };

export function useRoadmapCreationLimit() {
  const [state, setState] = useState<LimitState>(initialState);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setState(initialState); return initialState; }
      const { data, error } = await supabase
        .from("roadmaps")
        .select("created_at", { count: "exact", head: false })
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      const rows = data ?? [];
      const count = rows.length;
      const latest = rows[0]?.created_at ? new Date(rows[0].created_at) : null;
      const next = latest ? new Date(latest.getTime() + 24 * 60 * 60 * 1000) : null;
      const cooldown = Boolean(next && next.getTime() > Date.now());
      const nextAvailableAt = next?.toISOString() ?? null;
      const result: LimitState = count >= 4
        ? { count, allowed: false, reason: "limit_reached", nextAvailableAt }
        : cooldown
          ? { count, allowed: false, reason: "cooldown", nextAvailableAt }
          : { count, allowed: true, reason: "ok", nextAvailableAt: null };
      setState(result);
      return result;
    } catch {
      setState(initialState);
      return initialState;
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);
  return { ...state, loading, refresh };
}

export function roadmapCreationLimitMessage(state: Pick<LimitState, "reason" | "count" | "nextAvailableAt">) {
  if (state.reason === "limit_reached") return "You already have 4 roadmaps. Finish or archive one before creating another.";
  if (state.reason === "cooldown" && state.nextAvailableAt) {
    const when = new Date(state.nextAvailableAt);
    return `Roadmap creation is on cooldown. Your next roadmap can be created ${when.toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}.`;
  }
  return "";
}
