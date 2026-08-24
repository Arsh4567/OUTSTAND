type Game = Record<string, any>;

function currentMonthAndPrevious() {
  const current = new Date();
  const previous = new Date(Date.UTC(current.getUTCFullYear(), current.getUTCMonth() - 1, 1));
  return [current, previous];
}

async function fetchMonth(username: string, date: Date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const response = await fetch(`https://api.chess.com/pub/player/${encodeURIComponent(username)}/games/${year}/${month}`, {
    headers: {
      Accept: "application/json",
      "User-Agent": "ChessRoadmapApp/1.0 (contact: arshuslayer444@gmail.com)",
    },
  });
  return { response, year, month };
}

export default async function handler(req: Request) {
  const url = new URL(req.url);
  const username = url.searchParams.get("username")?.trim().replace(/^@/, "");
  if (!username) return new Response(JSON.stringify({ error: "Chess.com username is required." }), { status: 400, headers: { "Content-Type": "application/json" } });

  const results: Game[] = [];
  try {
    for (const date of currentMonthAndPrevious()) {
      const { response } = await fetchMonth(username, date);
      if (response.status === 404) continue;
      if (response.status === 429) return new Response(JSON.stringify({ error: "Chess.com rate limit reached. Please retry shortly." }), { status: 429, headers: { "Content-Type": "application/json", "Retry-After": response.headers.get("Retry-After") || "60" } });
      if (!response.ok) return new Response(JSON.stringify({ error: `Chess.com games request failed (${response.status}).` }), { status: 502, headers: { "Content-Type": "application/json" } });
      const data = await response.json() as { games?: Game[] };
      results.push(...(Array.isArray(data.games) ? data.games : []));
    }

    const cutoff = Date.now() - 30 * 86400000;
    const games = results.filter((game) => typeof game.end_time === "number" && game.end_time * 1000 >= cutoff && game.end_time * 1000 <= Date.now());
    return new Response(JSON.stringify({ username, games }), { status: 200, headers: { "Content-Type": "application/json", "Cache-Control": "private, max-age=300" } });
  } catch {
    return new Response(JSON.stringify({ error: "Unable to fetch Chess.com games right now." }), { status: 502, headers: { "Content-Type": "application/json" } });
  }
}
