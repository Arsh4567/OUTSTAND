export type ChessComGame = {
  url?: string;
  pgn?: string;
  time_class?: string;
  rated?: boolean;
  rules?: string;
  white?: { username?: string; rating?: number; result?: string; accuracy?: number };
  black?: { username?: string; rating?: number; result?: string; accuracy?: number };
  end_time?: number;
  eco?: string;
};

export type ChessGameAnalysis = {
  games: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
  white: { games: number; wins: number; losses: number; draws: number; winRate: number };
  black: { games: number; wins: number; losses: number; draws: number; winRate: number };
  ratingDelta: number | null;
  openings: Array<{ name: string; eco: string | null; games: number }>;
};

const RESULT_LABELS = new Set(["win", "loss", "draw"]);

function normalizeUser(value: string) {
  return value.trim().toLowerCase();
}

function gameResult(game: ChessComGame, username: string): "win" | "loss" | "draw" | null {
  const user = normalizeUser(username);
  const side = normalizeUser(game.white?.username || "") === user ? game.white : normalizeUser(game.black?.username || "") === user ? game.black : null;
  if (!side) return null;
  const result = side.result === "win" ? "win" : side.result === "agreed" || side.result === "repetition" || side.result === "stalemate" || side.result === "insufficient" || side.result === "50move" || side.result === "timevsinsufficient" ? "draw" : side.result === "checkmated" || side.result === "timeout" || side.result === "resigned" || side.result === "lose" ? "loss" : side.result;
  return RESULT_LABELS.has(result || "") ? (result as "win" | "loss" | "draw") : null;
}

function openingFromPgn(pgn?: string, eco?: string) {
  if (!pgn) return { name: eco ? `ECO ${eco}` : "Unknown opening", eco: eco || null };
  const headers = [...pgn.matchAll(/^\[(\w+)\s+\"([^\"]*)\"\]$/gm)];
  const map = new Map(headers.map(([, key, value]) => [key, value]));
  const opening = map.get("Opening") || map.get("ECOUrl") || map.get("ECO") || (eco ? `ECO ${eco}` : "Unknown opening");
  const normalized = opening.replace(/^.*\/opening\//i, "").replace(/[_-]+/g, " ").trim();
  return { name: normalized || "Unknown opening", eco: map.get("ECO") || eco || null };
}

function inLast30Days(game: ChessComGame, nowMs: number) {
  if (!game.end_time) return false;
  return game.end_time * 1000 >= nowMs - 30 * 86400000 && game.end_time * 1000 <= nowMs;
}

export function aggregateChessComGames(games: ChessComGame[], username: string, now = new Date()): ChessGameAnalysis {
  const nowMs = now.getTime();
  const recent = games.filter((game) => inLast30Days(game, nowMs));
  const stats = { games: 0, wins: 0, losses: 0, draws: 0 };
  const white = { games: 0, wins: 0, losses: 0, draws: 0 };
  const black = { games: 0, wins: 0, losses: 0, draws: 0 };
  const openings = new Map<string, { name: string; eco: string | null; games: number }>();
  const ratings: Array<{ time: number; rating: number }> = [];

  for (const game of recent) {
    const user = normalizeUser(username);
    const isWhite = normalizeUser(game.white?.username || "") === user;
    const side = isWhite ? game.white : normalizeUser(game.black?.username || "") === user ? game.black : null;
    const result = gameResult(game, username);
    if (!side || !result) continue;

    stats.games += 1;
    stats[result === "win" ? "wins" : result === "loss" ? "losses" : "draws"] += 1;
    const colorStats = isWhite ? white : black;
    colorStats.games += 1;
    colorStats[result === "win" ? "wins" : result === "loss" ? "losses" : "draws"] += 1;
    if (typeof side.rating === "number" && typeof game.end_time === "number") ratings.push({ time: game.end_time, rating: side.rating });

    const opening = openingFromPgn(game.pgn, game.eco);
    const key = `${opening.name}|${opening.eco || ""}`;
    const item = openings.get(key) || { ...opening, games: 0 };
    item.games += 1;
    openings.set(key, item);
  }

  ratings.sort((a, b) => a.time - b.time);
  const ratingDelta = ratings.length >= 2 ? ratings[ratings.length - 1].rating - ratings[0].rating : null;
  const rate = (wins: number, total: number) => total ? Math.round((wins / total) * 100) : 0;

  return {
    games: stats.games,
    wins: stats.wins,
    losses: stats.losses,
    draws: stats.draws,
    winRate: rate(stats.wins, stats.games),
    white: { ...white, winRate: rate(white.wins, white.games) },
    black: { ...black, winRate: rate(black.wins, black.games) },
    ratingDelta,
    openings: Array.from(openings.values()).sort((a, b) => b.games - a.games).slice(0, 5),
  };
}

export function parseAnnotatedMoves(pgn: string) {
  const annotations = [...pgn.matchAll(/\$([1-6])|!!|!/g)].map((match) => ({ symbol: match[0], nags: match[1] ? Number(match[1]) : match[0] === "!!" ? 3 : 1, index: match.index ?? -1 }));
  return annotations;
}
