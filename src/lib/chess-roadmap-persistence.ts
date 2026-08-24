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
    .select("chess_com_username, profile, ratings, generated_roadmap, roadmap_generated_at")
    .eq("user_id", session.user.id)
    .maybeSingle();

  if (error) throw error;
  return data || null;
}

export async function saveChessComProfile(data: ChessComRoadmapData) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Please sign in first.");

  const { data: saved, error } = await supabase
    .from("chess_roadmap_profiles")
    .upsert({
      user_id: session.user.id,
      chess_com_username: data.profile.username,
      profile: data.profile,
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
    patch.profile = chessCom.profile;
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
