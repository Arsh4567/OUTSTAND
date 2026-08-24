type VercelRequest = { method?: string; headers: Record<string, string | undefined>; query?: Record<string, string | string[] | undefined> };
type VercelResponse = { status: (code: number) => VercelResponse; setHeader: (name: string, value: string) => VercelResponse; json: (body: unknown) => VercelResponse; end: () => void };

const USER_AGENT = "ChessRoadmapApp/1.0 (contact: arshuslayer444@gmail.com)";
const json = (res: VercelResponse, status: number, body: unknown) => res.status(status).setHeader("Cache-Control", "no-store").json(body);

function usernameFrom(req: VercelRequest) {
  const value = req.query?.username;
  const username = Array.isArray(value) ? value[0] : value;
  return typeof username === "string" ? username.trim().replace(/^@/, "") : "";
}

function rating(value: unknown) {
  return typeof value === "object" && value !== null && Number.isFinite(Number((value as any).last?.rating)) ? Number((value as any).last.rating) : null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "OPTIONS") { res.status(204).end(); return; }
  if (req.method !== "GET") return json(res, 405, { error: "Method not allowed." });
  const username = usernameFrom(req);
  if (!username || username.length > 80 || !/^[A-Za-z0-9_-]+$/.test(username)) return json(res, 400, { error: "Enter a valid Chess.com username." });

  try {
    const headers = { Accept: "application/json", "User-Agent": USER_AGENT };
    const profileResponse = await fetch(`https://api.chess.com/pub/player/${encodeURIComponent(username)}`, { headers });
    if (profileResponse.status === 404) return json(res, 404, { error: "Chess.com username not found." });
    if (profileResponse.status === 429) return json(res, 429, { error: "Chess.com is rate-limiting requests. Please try again shortly." });
    if (!profileResponse.ok) return json(res, profileResponse.status >= 500 ? 502 : profileResponse.status, { error: `Chess.com profile request failed (${profileResponse.status}).` });

    const statsResponse = await fetch(`https://api.chess.com/pub/player/${encodeURIComponent(username)}/stats`, { headers });
    if (statsResponse.status === 404) return json(res, 404, { error: "Chess.com stats were not found for this username." });
    if (statsResponse.status === 429) return json(res, 429, { error: "Chess.com is rate-limiting requests. Please try again shortly." });
    if (!statsResponse.ok) return json(res, statsResponse.status >= 500 ? 502 : statsResponse.status, { error: `Chess.com stats request failed (${statsResponse.status}).` });

    const profile = await profileResponse.json() as Record<string, unknown>;
    const stats = await statsResponse.json() as Record<string, unknown>;
    return json(res, 200, {
      profile: {
        username: String(profile.username || username),
        avatar: typeof profile.avatar === "string" ? profile.avatar : null,
        title: typeof profile.title === "string" ? profile.title : null,
      },
      ratings: {
        rapid: rating(stats.chess_rapid),
        blitz: rating(stats.chess_blitz),
        bullet: rating(stats.chess_bullet),
        tactics: typeof (stats.tactics as any)?.highest?.rating === "number" ? Number((stats.tactics as any).highest.rating) : typeof (stats.tactics as any)?.lowest?.rating === "number" ? Number((stats.tactics as any).lowest.rating) : null,
      },
      source: "chess.com",
    });
  } catch (error) {
    console.error("[OUTSTAND] Chess.com API error", error);
    return json(res, 502, { error: "Could not reach Chess.com right now. Please try again." });
  }
}
