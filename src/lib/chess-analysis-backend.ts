import { supabase } from "@/integrations/supabase/client";

export interface UserChessProfile {
  id: string;
  chess_username: string;
  avatar_url: string | null;
  last_synced_at: string | null;
  cached_30d_stats: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
}

export interface AnalyzedGame {
  id: string;
  user_id: string;
  chess_com_game_id: string;
  game_url: string | null;
  time_control: string | null;
  user_color: "white" | "black" | null;
  result: "win" | "loss" | "draw" | "unknown" | null;
  user_rating: number | null;
  opponent_username: string | null;
  opponent_rating: number | null;
  played_at: string | null;
  pgn: string | null;
  analysis_summary: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
}

export interface UserMistake {
  id: string;
  user_id: string;
  game_id: string;
  fen_before_move: string;
  fen_after_move: string;
  played_move: string;
  best_engine_move: string;
  evaluation_drop: number;
  is_solved: boolean;
  created_at: string;
}

export interface BrilliantMove {
  id: string;
  user_id: string;
  game_id: string;
  fen_position: string;
  move_san: string;
  move_uci: string | null;
  annotation_type: "brilliant" | "great_move" | string;
  created_at: string;
}

export interface ThirtyDayChessStats {
  games: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
  white?: Record<string, unknown>;
  black?: Record<string, unknown>;
  ratingDelta?: number | null;
  openings?: Array<Record<string, unknown>>;
  [key: string]: unknown;
}

export interface AnalyzedGameInput {
  chess_com_game_id: string;
  game_url?: string | null;
  time_control?: string | null;
  user_color?: "white" | "black" | null;
  result?: "win" | "loss" | "draw" | "unknown" | null;
  user_rating?: number | null;
  opponent_username?: string | null;
  opponent_rating?: number | null;
  played_at?: string | null;
  pgn?: string | null;
}

export interface GameAnalysisSummary {
  accuracy_score?: number | null;
  blunder_count: number;
  mistake_count: number;
  [key: string]: unknown;
}

export interface MistakeInput {
  fen_before_move: string;
  fen_after_move: string;
  played_move: string;
  best_engine_move: string;
  evaluation_drop: number;
  is_solved?: boolean;
}

export interface BrilliantMoveInput {
  fen_position: string;
  move_san: string;
  move_uci?: string | null;
  annotation_type?: "brilliant" | "great_move" | string;
}

export async function save30DayStats(
  userId: string,
  username: string,
  stats: ThirtyDayChessStats,
): Promise<UserChessProfile> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("user_chess_profiles")
    .upsert(
      {
        id: userId,
        chess_username: username,
        cached_30d_stats: stats,
        last_synced_at: now,
        updated_at: now,
      },
      { onConflict: "id" },
    )
    .select("*")
    .single();

  if (error) throw error;
  return data as UserChessProfile;
}

export async function saveGameWithAnalysis(
  userId: string,
  gameData: AnalyzedGameInput,
  analysisData: GameAnalysisSummary,
  mistakesList: MistakeInput[] = [],
  brilliantMovesList: BrilliantMoveInput[] = [],
): Promise<AnalyzedGame> {
  const { data: game, error: gameError } = await supabase
    .from("analyzed_games")
    .upsert(
      {
        user_id: userId,
        ...gameData,
        analysis_summary: analysisData,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,chess_com_game_id" },
    )
    .select("*")
    .single();

  if (gameError || !game) throw gameError || new Error("Could not save analyzed game.");

  const typedGame = game as AnalyzedGame;

  const [deleteMistakes, deleteBrilliants] = await Promise.all([
    supabase.from("user_mistakes").delete().eq("user_id", userId).eq("game_id", typedGame.id),
    supabase.from("brilliant_moves").delete().eq("user_id", userId).eq("game_id", typedGame.id),
  ]);

  if (deleteMistakes.error) throw deleteMistakes.error;
  if (deleteBrilliants.error) throw deleteBrilliants.error;

  if (mistakesList.length) {
    const { error } = await supabase.from("user_mistakes").insert(
      mistakesList.map((mistake) => ({ user_id: userId, game_id: typedGame.id, ...mistake })),
    );
    if (error) throw error;
  }

  if (brilliantMovesList.length) {
    const { error } = await supabase.from("brilliant_moves").insert(
      brilliantMovesList.map((move) => ({ user_id: userId, game_id: typedGame.id, ...move })),
    );
    if (error) throw error;
  }

  return typedGame;
}

export async function getUserMistakes(
  userId: string,
  filterUnsolvedOnly = false,
): Promise<UserMistake[]> {
  let query = supabase
    .from("user_mistakes")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (filterUnsolvedOnly) query = query.eq("is_solved", false);

  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as UserMistake[];
}

export async function markMistakeAsSolved(mistakeId: string): Promise<UserMistake> {
  const { data, error } = await supabase
    .from("user_mistakes")
    .update({ is_solved: true })
    .eq("id", mistakeId)
    .select("*")
    .single();

  if (error) throw error;
  return data as UserMistake;
}

export async function getBrilliantMoves(userId: string): Promise<BrilliantMove[]> {
  const { data, error } = await supabase
    .from("brilliant_moves")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data || []) as BrilliantMove[];
}
