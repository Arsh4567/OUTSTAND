import { supabase } from "@/integrations/supabase/client";

export type ChessComRoadmapData = {
  profile: { username: string; avatar: string | null; title: string | null };
  ratings: { rapid: number | null; blitz: number | null; bullet: number | null; tactics: number | null };
};

export type SavedChessRoadmap = ChessComRoadmapData & {
  generatedRoadmap?: unknown;
  savedAt?: string | null;
};

export async function loadSavedChessRoadmap(): Promise<SavedChessRoadmap | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("chess_roadmap_profiles")
    .select(
      "chess_com_username,chess_com_avatar,chess_com_title,rapid_rating,blitz_rating,bullet_rating,tactics_rating,generated_roadmap,roadmap_generated_at",
    )
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    profile: {
      username: data.chess_com_username,
      avatar: data.chess_com_avatar,
      title: data.chess_com_title,
    },
    ratings: {
      rapid: data.rapid_rating,
      blitz: data.blitz_rating,
      bullet: data.bullet_rating,
      tactics: data.tactics_rating,
    },
    generatedRoadmap: data.generated_roadmap,
    savedAt: data.roadmap_generated_at,
  };
}

async function upsertChessRoadmapProfile(
  data: ChessComRoadmapData,
  generatedRoadmap?: unknown,
) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Please sign in first.");

  const now = new Date().toISOString();
  const payload: Record<string, unknown> = {
    user_id: user.id,
    chess_com_username: data.profile.username,
    chess_com_avatar: data.profile.avatar,
    chess_com_title: data.profile.title,
    rapid_rating: data.ratings.rapid,
    blitz_rating: data.ratings.blitz,
    bullet_rating: data.ratings.bullet,
    tactics_rating: data.ratings.tactics,
    ratings: data.ratings,
    updated_at: now,
  };

  if (generatedRoadmap !== undefined) {
    payload.generated_roadmap = generatedRoadmap;
    payload.roadmap_generated_at = now;
  }

  const { data: saved, error } = await supabase
    .from("chess_roadmap_profiles")
    .upsert(payload, { onConflict: "user_id" })
    .select("*")
    .single();

  if (error) throw error;
  return saved;
}

export async function saveChessComProfile(data: ChessComRoadmapData) {
  return upsertChessRoadmapProfile(data);
}

export async function saveGeneratedChessRoadmap(
  roadmap: unknown,
  chessCom: ChessComRoadmapData,
) {
  return upsertChessRoadmapProfile(chessCom, roadmap);
}
