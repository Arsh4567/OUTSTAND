type Game = Record<string, any>;
type VercelRequest = {
  method?: string;
  query?: Record<string, string | string[] | undefined>;
};
type VercelResponse = {
  status: (code: number) => VercelResponse;
  setHeader: (name: string, value: string) => VercelResponse;
  json: (body: unknown) => VercelResponse;
  end: () => void;
};

const USER_AGENT = "ChessRoadmapApp/1.0 (contact: arshuslayer444@gmail.com)";
const json = (res: VercelResponse, status: number, body: unknown) =>
  res.status(status).setHeader("Cache-Control", "private, max-age=300").json(body);

function usernameFrom(req: VercelRequest) {
  const value = req.query?.username;
  const username = Array.isArray(value) ? value[0] : value;
  return typeof username === "string" ? username.trim().replace(/^@/, "") : "";
}

function currentMonthAndPrevious() {
  const current = new Date();
  const previous = new Date(Date.UTC(current.getUTCFullYear(), current.getUTCMonth() - 1, 1));
  return [current, previous];
}

async function fetchMonth(username: string, date: Date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return fetch(`https://api.chess.com/pub/player/${encodeURIComponent(username)}/games/${year}/${month}`, {
    headers: { Accept: "application/json", "User-Agent": USER_AGENT },
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "OPTIONS") { res.status(204).end(); return; }
  if (req.method !== "GET") return json(res, 405, { error: "Method not allowed." });

  const username = usernameFrom(req);
  if (!username || username.length > 80 || !/^[A-Za-z0-9_-]+$/.test(username)) {
    return json(res, 400, { error: "Enter a valid Chess.com username." });
  }

  const results: Game[] = [];
  try {
    for (const date of currentMonthAndPrevious()) {
      const response = await fetchMonth(username, date);
      if (response.status === 404) continue;
      if (response.status === 429) {
        return res.status(429)
          .setHeader("Retry-After", response.headers.get("Retry-After") || "60")
          .setHeader("Cache-Control", "private, max-age=60")
          .json({ error: "Chess.com rate limit reached. Please retry shortly." });
      }
      if (!response.ok) return json(res, 502, { error: `Chess.com games request failed (${response.status}).` });
      const data = await response.json() as { games?: Game[] };
      if (Array.isArray(data.games)) results.push(...data.games);
    }

    const now = Date.now();
    const cutoff = now - 30 * 86400000;
    const games = results.filter((game) =>
      typeof game.end_time === "number" &&
      game.end_time * 1000 >= cutoff &&
      game.end_time * 1000 <= now,
    );

    return json(res, 200, { username, games });
  } catch (error) {
    console.error("[OUTSTAND] Chess.com games API error", error);
    return json(res, 502, { error: "Could not reach Chess.com games right now. Please try again." });
  }
}
