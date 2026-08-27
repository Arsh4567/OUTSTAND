import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type LimitState = {
  count: number;
  allowed: boolean;
  nextAvailableAt: string | null;
  reason: "ok" | "cooldown" | "limit_reached";
};

const MAX_ROADMAPS = 4;
const COOLDOWN_MS = 24 * 60 * 60 * 1000;
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
        .select("created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(MAX_ROADMAPS);

      if (error) throw error;
      const rows = data ?? [];
      const count = rows.length;
      const latestCreatedAt = rows[0]?.created_at ? new Date(rows[0].created_at) : null;
      const next = latestCreatedAt ? new Date(latestCreatedAt.getTime() + COOLDOWN_MS) : null;
      const cooldownActive = Boolean(next && next.getTime() > Date.now());
      const nextAvailableAt = next?.toISOString() ?? null;

      const result: LimitState = count >= MAX_ROADMAPS
        ? { count, allowed: false, reason: "limit_reached", nextAvailableAt }
        : cooldownActive
          ? { count, allowed: false, reason: "cooldown", nextAvailableAt }
          : { count, allowed: true, reason: "ok", nextAvailableAt: null };

      setState(result);
      return result;
    } catch {
      setState(initialState);
      return initialState;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);
  return { ...state, loading, refresh };
}

export function roadmapCreationLimitMessage(state: Pick<LimitState, "reason" | "count" | "nextAvailableAt">) {
  if (state.reason === "limit_reached") {
    return `You have reached the ${MAX_ROADMAPS}-roadmap limit. Finish or archive an existing roadmap before creating another.`;
  }
  if (state.reason === "cooldown" && state.nextAvailableAt) {
    const when = new Date(state.nextAvailableAt);
    return `You can create your next roadmap on ${when.toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}.`;
  }
  return "";
}
