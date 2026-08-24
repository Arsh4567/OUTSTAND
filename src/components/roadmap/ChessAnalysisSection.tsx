import { useEffect, useState } from "react";
import { ChessAnalysisDashboard } from "./ChessAnalysisDashboard";
import { supabase } from "@/integrations/supabase/client";

export function ChessAnalysisSection({ username }: { username?: string | null }) {
  const [isChessRoadmap, setIsChessRoadmap] = useState(false);

  useEffect(() => {
    let cancelled = false;

    if (!username) {
      setIsChessRoadmap(false);
      return () => { cancelled = true; };
    }

    void (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data } = await supabase
        .from("roadmaps")
        .select("category")
        .eq("user_id", session.user.id)
        .in("status", ["active", "paused"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!cancelled) setIsChessRoadmap(data?.category === "chess");
    })();

    return () => { cancelled = true; };
  }, [username]);

  if (!username || !isChessRoadmap) return null;
  return <ChessAnalysisDashboard username={username} />;
}
