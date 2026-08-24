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
  games: number; wins: number; losses: number; draws: number; winRate: number;
  white: { games: number; wins: number; losses: number; draws: number; winRate: number };
  black: { games: number; wins: number; losses: number; draws: number; winRate: number };
  ratingDelta: number | null;
  openings: Array<{ name: string; eco: string | null; games: number }>;
};

const RESULT_LABELS = new Set(["win", "loss", "draw"]);
const ECO_NAMES: Record<string, string> = {
  A00: "Uncommon Opening", A40: "Queen's Pawn Game", A45: "Indian Game", A50: "Old Benoni / Indian Setup", A57: "Benko Gambit", A80: "Dutch Defense",
  B01: "Scandinavian Defense", B02: "Alekhine Defense", B07: "Pirc Defense", B10: "Caro-Kann Defense", B20: "Sicilian Defense", B21: "Sicilian Defense: Grand Prix", B22: "Sicilian Defense: Alapin", B23: "Sicilian Defense: Closed", B30: "Sicilian Defense", B50: "Sicilian Defense",
  C00: "French Defense", C20: "King's Pawn Game", C21: "Center Game", C25: "Vienna Game", C26: "Vienna Game", C29: "Vienna Gambit", C40: "King's Pawn Game", C41: "Philidor Defense", C42: "Petrov Defense", C44: "King's Pawn Game", C50: "Italian Game", C51: "Italian Game: Evans Gambit", C52: "Italian Game", C53: "Giuoco Piano", C54: "Italian Game", C55: "Italian Game: Two Knights", C60: "Ruy Lopez", C65: "Ruy Lopez: Berlin",
  D00: "Queen's Pawn Game", D02: "Queen's Pawn Game", D06: "Queen's Gambit", D10: "Queen's Gambit", D20: "Queen's Gambit Accepted", D30: "Queen's Gambit Declined", D40: "Queen's Gambit Declined", D80: "Grünfeld Defense", D90: "Grünfeld Defense",
  E00: "Catalan Opening", E12: "Queen's Indian Defense", E20: "Nimzo-Indian Defense", E30: "Nimzo-Indian Defense", E60: "King's Indian Defense", E70: "King's Indian Defense", E80: "King's Indian Defense",
};

function normalizeUser(value: string) { return value.trim().toLowerCase(); }
function gameResult(game: ChessComGame, username: string): "win" | "loss" | "draw" | null {
  const user = normalizeUser(username);
  const side = normalizeUser(game.white?.username || "") === user ? game.white : normalizeUser(game.black?.username || "") === user ? game.black : null;
  if (!side) return null;
  const result = side.result === "win" ? "win" : ["agreed","repetition","stalemate","insufficient","50move","timevsinsufficient"].includes(side.result || "") ? "draw" : ["checkmated","timeout","resigned","lose"].includes(side.result || "") ? "loss" : side.result;
  return RESULT_LABELS.has(result || "") ? result as "win" | "loss" | "draw" : null;
}
function titleFromEco(eco?: string) { const code = (eco || "").trim().toUpperCase(); return ECO_NAMES[code] || (code ? `ECO ${code}` : null); }
function openingFromPgn(pgn?: string, eco?: string) {
  const headers = pgn ? [...pgn.matchAll(/^\[(\w+)\s+\"([^\"]*)\"\]$/gm)] : [];
  const map = new Map(headers.map(([, key, value]) => [key, value]));
  const code = map.get("ECO") || eco || "";
  const url = map.get("ECOUrl") || "";
  const raw = map.get("Opening") || "";
  const urlName = url.match(/\/openings\/([^/?#]+)/i)?.[1] || "";
  const name = (raw || urlName || "").replace(/^https?:\/\/[^/]+\//i, "").replace(/^.*\/openings?\//i, "").replace(/[_-]+/g, " ").trim();
  return { name: name && !/^ECO\s+[A-E]\d\d$/i.test(name) ? name : titleFromEco(code) || "Unknown opening", eco: code || null };
}
function inLast30Days(game: ChessComGame, nowMs: number) { return !!game.end_time && game.end_time * 1000 >= nowMs - 30 * 86400000 && game.end_time * 1000 <= nowMs; }

export function aggregateChessComGames(games: ChessComGame[], username: string, now = new Date()): ChessGameAnalysis {
  const recent = games.filter((game) => inLast30Days(game, now.getTime()));
  const stats = { games: 0, wins: 0, losses: 0, draws: 0 }, white = { games: 0, wins: 0, losses: 0, draws: 0 }, black = { games: 0, wins: 0, losses: 0, draws: 0 };
  const openings = new Map<string, { name: string; eco: string | null; games: number }>(); const ratings: Array<{ time: number; rating: number }> = [];
  for (const game of recent) {
    const user = normalizeUser(username); const isWhite = normalizeUser(game.white?.username || "") === user; const side = isWhite ? game.white : normalizeUser(game.black?.username || "") === user ? game.black : null; const result = gameResult(game, username); if (!side || !result) continue;
    stats.games += 1; stats[result === "win" ? "wins" : result === "loss" ? "losses" : "draws"] += 1; const color = isWhite ? white : black; color.games += 1; color[result === "win" ? "wins" : result === "loss" ? "losses" : "draws"] += 1;
    if (typeof side.rating === "number" && typeof game.end_time === "number") ratings.push({ time: game.end_time, rating: side.rating });
    const opening = openingFromPgn(game.pgn, game.eco); const key = `${opening.name}|${opening.eco || ""}`; const item = openings.get(key) || { ...opening, games: 0 }; item.games += 1; openings.set(key, item);
  }
  ratings.sort((a,b) => a.time-b.time); const rate = (w:number,t:number) => t ? Math.round(w/t*100) : 0;
  return { games: stats.games, wins: stats.wins, losses: stats.losses, draws: stats.draws, winRate: rate(stats.wins, stats.games), white: { ...white, winRate: rate(white.wins, white.games) }, black: { ...black, winRate: rate(black.wins, black.games) }, ratingDelta: ratings.length >= 2 ? ratings.at(-1)!.rating - ratings[0].rating : null, openings: Array.from(openings.values()).sort((a,b) => b.games-a.games).slice(0,5) };
}

export function parseAnnotatedMoves(pgn: string) {
  return [...pgn.matchAll(/\$([1-6])|!!|!/g)].map((match) => ({ symbol: match[0], nags: match[1] ? Number(match[1]) : match[0] === "!!" ? 3 : 1, index: match.index ?? -1 }));
}
