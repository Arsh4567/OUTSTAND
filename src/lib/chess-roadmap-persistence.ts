import { supabase } from "@/integrations/supabase/client";

export type ChessComRoadmapData = {
  profile: { username: string; avatar: string | null; title: string | null };
  ratings: { rapid: number | null; blitz: number | null; bullet: number | null; tactics: number | null };
};

export async function loadSavedChessRoadmap() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;

  const { data, error } = await supabase
    .from("chess_roadmap_profiles")
    .select("chess_com_username, chess_com_avatar, chess_com_title, rapid_rating, blitz_rating, bullet_rating, tactics_rating, ratings, generated_roadmap, roadmap_generated_at")
    .eq("user_id", session.user.id)
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

export async function saveChessComProfile(data: ChessComRoadmapData) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Please sign in first.");

  const { data: saved, error } = await supabase
    .from("chess_roadmap_profiles")
    .upsert({
      user_id: session.user.id,
      chess_com_username: data.profile.username,
      chess_com_avatar: data.profile.avatar,
      chess_com_title: data.profile.title,
      rapid_rating: data.ratings.rapid,
      blitz_rating: data.ratings.blitz,
      bullet_rating: data.ratings.bullet,
      tactics_rating: data.ratings.tactics,
      ratings: data.ratings,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" })
    .select("*")
    .single();

  if (error) throw error;
  return saved;
}

export async function saveGeneratedChessRoadmap(roadmap: unknown, chessCom?: ChessComRoadmapData) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Please sign in first.");

  const patch: Record<string, unknown> = {
    user_id: session.user.id,
    generated_roadmap: roadmap,
    roadmap_generated_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (chessCom) {
    patch.chess_com_username = chessCom.profile.username;
    patch.chess_com_avatar = chessCom.profile.avatar;
    patch.chess_com_title = chessCom.profile.title;
    patch.rapid_rating = chessCom.ratings.rapid;
    patch.blitz_rating = chessCom.ratings.blitz;
    patch.bullet_rating = chessCom.ratings.bullet;
    patch.tactics_rating = chessCom.ratings.tactics;
    patch.ratings = chessCom.ratings;
  }

  const { data, error } = await supabase
    .from("chess_roadmap_profiles")
    .upsert(patch, { onConflict: "user_id" })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}
